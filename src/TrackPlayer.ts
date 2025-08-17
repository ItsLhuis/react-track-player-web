import { Capability, Event, RepeatMode, State } from "./constants"

import type {
  AudioAnalysisData,
  EqualizerBand,
  EqualizerOptions,
  EqualizerPreset,
  EventData,
  EventHandler,
  Progress,
  SetupOptions,
  Track
} from "./types"

class SetupNotCalledError extends Error {
  constructor() {
    super("The player has not been set up. Call TrackPlayer.setupPlayer() first.")
    this.name = "SetupNotCalledError"
  }
}

const DefaultOptions: SetupOptions = {
  waitForBuffer: true,
  updateInterval: 1,
  useMediaSession: true,
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.Stop,
    Capability.Skip,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
    Capability.SeekTo,
    Capability.SeekBy,
    Capability.SetVolume,
    Capability.SetRate
  ]
}

const DefaultEqualizerBands: EqualizerBand[] = [
  { frequency: 32, gain: 0, Q: 1 },
  { frequency: 64, gain: 0, Q: 1 },
  { frequency: 125, gain: 0, Q: 1 },
  { frequency: 250, gain: 0, Q: 1 },
  { frequency: 500, gain: 0, Q: 1 },
  { frequency: 1000, gain: 0, Q: 1 },
  { frequency: 2000, gain: 0, Q: 1 },
  { frequency: 4000, gain: 0, Q: 1 },
  { frequency: 8000, gain: 0, Q: 1 },
  { frequency: 16000, gain: 0, Q: 1 }
]

/**
 * Main TrackPlayer class to handle audio playback
 */
class TrackPlayer {
  private static instance: TrackPlayer | null = null

  private audioElement: HTMLAudioElement | null = null
  private options: SetupOptions = DefaultOptions
  private state: State = State.None
  private queue: Track[] = []
  private currentTrackIndex: number = -1
  private eventListeners: Map<Event, Set<EventHandler>> = new Map()
  private progressInterval: number | null = null
  private isSetup: boolean = false
  private playWhenReady: boolean = false
  private repeatMode: RepeatMode = RepeatMode.Off
  private isChangingTrack: boolean = false
  private metadataLoadedMap: Map<number, boolean> = new Map()

  private hasTriedInitAudio: boolean = false

  private audioContext: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private gainNode: GainNode | null = null
  private equalizerFilters: BiquadFilterNode[] = []
  private analyserNode: AnalyserNode | null = null
  private equalizerOptions: EqualizerOptions = {
    enabled: false,
    bands: [...DefaultEqualizerBands]
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Sets up the player with the given options
   * @param options Player setup options
   * @returns Promise that resolves when the player is set up
   */
  public static async setupPlayer(options: SetupOptions = {}): Promise<void> {
    if (!TrackPlayer.instance) {
      TrackPlayer.instance = new TrackPlayer()
    }

    await TrackPlayer.instance.init(options)
  }

  /**
   * Gets the TrackPlayer instance
   * @returns The TrackPlayer instance
   * @throws Error if the player is not set up
   */
  private static getInstance(): TrackPlayer {
    if (!TrackPlayer.instance || !TrackPlayer.instance.isSetup) {
      throw new SetupNotCalledError()
    }
    return TrackPlayer.instance
  }

  /**
   * Sets up the audio equalizer and analyser nodes
   * Creates AudioContext and all audio nodes but doesn't connect them
   * Connections are made on first play() to comply with browser policies
   */
  private setupEqualizer(): void {
    if (!this.audioElement) return

    // Check if AudioContext has already been created
    if (this.audioContext && this.audioContext.state !== "closed") return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Don't try to create nodes if context is suspended
      // They will be created when context is resumed
      if (this.audioContext.state === "suspended") {
        return
      }

      this.createAudioFilters()
    } catch (error) {
      console.error("Error setting up equalizer:", error)
    }
  }

  /**
   * Creates audio filters and analyser node (but not source node)
   */
  private createAudioFilters(): void {
    if (!this.audioContext) return

    this.gainNode = this.audioContext.createGain()

    this.analyserNode = this.audioContext.createAnalyser()
    this.analyserNode.fftSize = 2048
    this.analyserNode.smoothingTimeConstant = 0.8

    this.equalizerFilters = []

    this.equalizerOptions.bands.forEach((band) => {
      const filter = this.audioContext!.createBiquadFilter()
      filter.type = "peaking"
      filter.frequency.value = band.frequency
      filter.Q.value = band.Q
      filter.gain.value = band.gain

      this.equalizerFilters.push(filter)
    })
  }

  /**
   * Creates the source node and connects all audio nodes
   * Called only once on first play() after user interaction
   */
  private async initializeAudioGraph(): Promise<void> {
    if (!this.audioContext || !this.audioElement || this.sourceNode) return

    try {
      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      // Create source node (can only be done once per audio element)
      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement)

      // Create filters if they don't exist (in case context was suspended during init)
      if (!this.gainNode) {
        this.createAudioFilters()
      }

      // Connect all nodes
      let previousNode: AudioNode = this.sourceNode

      this.equalizerFilters.forEach((filter) => {
        previousNode.connect(filter)
        previousNode = filter
      })

      previousNode.connect(this.analyserNode!)
      this.analyserNode!.connect(this.gainNode!)
      this.gainNode!.connect(this.audioContext.destination)
    } catch (error) {
      console.error("Error initializing audio graph:", error)
    }
  }

  /**
   * Initializes the player with the given options
   * @param options Player setup options
   */
  private async init(options: SetupOptions): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      throw new Error("TrackPlayer can only be used in a browser environment.")
    }

    this.options = { ...DefaultOptions, ...options }

    // Create audio element if it doesn't exist
    if (!this.audioElement) {
      this.audioElement = document.createElement("audio")
      this.audioElement.crossOrigin = "anonymous"
      this.audioElement.setAttribute("id", "react-track-player-web")
      document.body.appendChild(this.audioElement)
    }

    // Set up audio element event listeners
    this.audioElement.addEventListener("play", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Playing)
      }
    })

    this.audioElement.addEventListener("pause", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Paused)
      }
    })

    this.audioElement.addEventListener("ended", this.handleEnded.bind(this))
    this.audioElement.addEventListener("waiting", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Buffering)
      }
    })

    this.audioElement.addEventListener("canplay", this.handleCanPlay.bind(this))
    this.audioElement.addEventListener("error", this.handleMediaError.bind(this))
    this.audioElement.addEventListener("loadstart", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Buffering)
      }
    })

    this.audioElement.addEventListener("stalled", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Buffering)
      }
    })

    this.audioElement.addEventListener("suspend", this.handleSuspend.bind(this))

    // Add metadata loaded event listener to cache duration info
    this.audioElement.addEventListener("loadedmetadata", () => {
      const currentIndex = this.currentTrackIndex
      if (currentIndex >= 0) {
        this.metadataLoadedMap.set(currentIndex, true)
      }
      // Once metadata is loaded, emit a progress update to report the duration
      this.emitProgress()
    })

    // Set up MediaSession API if available and enabled
    if (this.options.useMediaSession && "mediaSession" in navigator) {
      this.setupMediaSession()
    }

    this.setupEqualizer()

    this.isSetup = true
    this.updateState(State.Ready)

    // Set up progress interval
    this.startProgressInterval()
  }

  /**
   * Sets up the MediaSession API for media controls
   */
  private setupMediaSession(): void {
    if (!("mediaSession" in navigator)) return

    const capabilities = this.options.capabilities || [
      Capability.Play,
      Capability.Pause,
      Capability.Stop,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
      Capability.SetVolume,
      Capability.SetRate
    ]

    // Only set handlers for enabled capabilities
    if (capabilities.includes(Capability.Play)) {
      navigator.mediaSession.setActionHandler("play", () => {
        TrackPlayer.play().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("play", null)
    }

    if (capabilities.includes(Capability.Pause)) {
      navigator.mediaSession.setActionHandler("pause", () => {
        TrackPlayer.pause().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("pause", null)
    }

    if (capabilities.includes(Capability.Stop)) {
      navigator.mediaSession.setActionHandler("stop", () => {
        TrackPlayer.stop().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("stop", null)
    }

    if (capabilities.includes(Capability.SkipToPrevious)) {
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        TrackPlayer.skipToPrevious().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("previoustrack", null)
    }

    if (capabilities.includes(Capability.SkipToNext)) {
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        TrackPlayer.skipToNext().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("nexttrack", null)
    }

    if (capabilities.includes(Capability.SeekTo)) {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          TrackPlayer.seekTo(details.seekTime).catch(console.error)
        }
      })
    } else {
      navigator.mediaSession.setActionHandler("seekto", null)
    }
  }

  /**
   * Updates the MediaSession metadata with the current track info
   */
  private updateMediaSessionMetadata(): void {
    if (!("mediaSession" in navigator)) return

    const currentTrack = this.getCurrentTrackObject()
    if (!currentTrack) return

    const artwork = currentTrack.artwork
      ? [{ src: currentTrack.artwork, sizes: "512x512", type: "image/jpeg" }]
      : undefined

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      artwork
    })
  }

  /**
   * Handles ended event - determines what to play next based on repeat mode
   */
  private handleEnded(): void {
    const instance = TrackPlayer.getInstance()

    instance.isChangingTrack = true

    switch (instance.repeatMode) {
      case RepeatMode.Track:
        // Replay the current track
        if (instance.audioElement) {
          instance.audioElement.currentTime = 0
          instance.audioElement.play().catch(console.error)

          // Ensure state is updated when track repeats
          instance.updateState(State.Playing)
        }
        break

      case RepeatMode.Queue:
        // If at the end of the queue, go back to the beginning
        if (instance.currentTrackIndex >= instance.queue.length - 1) {
          TrackPlayer.skip(0)
            .then(() => TrackPlayer.play())
            .catch(console.error)
        } else {
          // Otherwise proceed to next track
          TrackPlayer.skipToNext()
            .then(() => TrackPlayer.play())
            .catch(console.error)
        }
        break

      case RepeatMode.Off:
      default:
        // Try to play the next track
        if (instance.currentTrackIndex < instance.queue.length - 1) {
          TrackPlayer.skipToNext()
            .then(() => TrackPlayer.play())
            .catch((error) => {
              instance.isChangingTrack = false
              console.error(error)
            })
        } else {
          // End of the queue reached with repeat off
          instance.isChangingTrack = false

          // Important to mark as Stopped but NOT reset the currentTrackIndex
          // This way we know we're at the end of the queue, not the beginning
          instance.updateState(State.Stopped)
          instance.playWhenReady = false

          // Don't clear the source here to allow seeking the last track,
          // but we do need to ensure currentTime is at the end for our logic in play()
          if (instance.audioElement) {
            // Ensure currentTime is at/near the end to trigger restart logic correctly
            if (instance.audioElement.duration) {
              instance.audioElement.currentTime = instance.audioElement.duration
            }
          }
        }
        break
    }
  }

  /**
   * Handles canplay event
   */
  private handleCanPlay(): void {
    if (this.state === State.Buffering) {
      if (this.isChangingTrack && this.playWhenReady) {
        // If we're changing tracks and should continue playing, start playback
        if (this.audioElement) {
          this.audioElement.play().catch(console.error)
        }
        this.isChangingTrack = false
        this.updateState(State.Playing)
      } else if (this.isChangingTrack && !this.playWhenReady) {
        // If we're changing tracks but shouldn't be playing
        this.isChangingTrack = false
        this.updateState(State.Paused)
      } else if (this.audioElement?.paused && !this.playWhenReady) {
        this.isChangingTrack = false
        this.updateState(State.Paused)
      } else {
        this.isChangingTrack = false
        this.updateState(State.Playing)
      }
    }
  }

  /**
   * Handles suspend event
   */
  private handleSuspend(): void {
    if (this.state === State.Buffering && this.audioElement && this.audioElement.readyState >= 3) {
      if (!this.isChangingTrack) {
        this.updateState(this.audioElement.paused ? State.Paused : State.Playing)
      }
    }
  }

  /**
   * Handles media errors
   */
  private handleMediaError(): void {
    const error = this.audioElement?.error
    let message = "Unknown media error"
    let code = ""

    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          message = "Media playback aborted"
          code = "MEDIA_ERR_ABORTED"
          break
        case MediaError.MEDIA_ERR_NETWORK:
          message = "Network error occurred during playback"
          code = "MEDIA_ERR_NETWORK"
          break
        case MediaError.MEDIA_ERR_DECODE:
          message = "Media decoding error"
          code = "MEDIA_ERR_DECODE"
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = "Media format not supported"
          code = "MEDIA_ERR_SRC_NOT_SUPPORTED"
          break
      }
    }

    this.emitEvent({
      type: Event.PlaybackError,
      error: message,
      code
    })

    this.updateState(State.Error)
  }

  /**
   * Updates the player state and emits a state change event
   * @param state New state
   */
  private updateState(state: State): void {
    if (this.state !== state) {
      this.state = state
      this.emitEvent({
        type: Event.PlaybackState,
        state
      })
    }
  }

  /**
   * Starts the progress interval
   */
  private startProgressInterval(): void {
    if (this.progressInterval) {
      this.stopProgressInterval()
    }

    const interval = this.options.updateInterval || 1
    let lastUpdate = 0

    const updateProgress = (timestamp: number) => {
      if (timestamp - lastUpdate >= interval * 1000) {
        this.emitProgress()
        lastUpdate = timestamp
      }
      this.progressInterval = requestAnimationFrame(updateProgress)
    }

    this.progressInterval = requestAnimationFrame(updateProgress)
  }

  /**
   * Stops the progress interval
   */
  private stopProgressInterval(): void {
    if (this.progressInterval) {
      cancelAnimationFrame(this.progressInterval)
      this.progressInterval = null
    }
  }

  /**
   * Emits the current playback progress
   */
  private emitProgress(): void {
    if (!this.audioElement) return

    const position = this.audioElement.currentTime
    const currentTrack = this.getCurrentTrackObject()
    let duration = isNaN(this.audioElement.duration) ? 0 : this.audioElement.duration

    // For live streams, report a very large duration or -1
    if (currentTrack?.isLiveStream) {
      duration = -1 // Or Number.MAX_SAFE_INTEGER
    }

    const buffered =
      this.audioElement.buffered.length > 0
        ? this.audioElement.buffered.end(this.audioElement.buffered.length - 1)
        : 0

    this.emitEvent({
      type: Event.PlaybackProgressUpdated,
      position,
      duration,
      buffered
    })
  }

  /**
   * Emits an event to all registered listeners
   * @param data Event data
   */
  private emitEvent(data: EventData): void {
    const eventType = data.type
    const listeners = this.eventListeners.get(eventType)

    if (listeners) {
      listeners.forEach((listener) => {
        listener(data)
      })
    }
  }

  /**
   * Gets the current track object
   * @returns The current track or undefined if no track is selected
   */
  private getCurrentTrackObject(): Track | undefined {
    if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.queue.length) {
      return this.queue[this.currentTrackIndex]
    }
    return undefined
  }

  /**
   * Loads a track into the player
   * @param track Track to load
   * @param preservePlayState Whether to preserve the current play state
   */
  private async loadTrack(track: Track, preservePlayState = true): Promise<void> {
    if (!this.audioElement) {
      throw new Error("Player not initialized")
    }

    // Set the changing track flag to prevent unwanted state changes
    this.isChangingTrack = true

    // Remember the current play state if requested
    const wasPlaying = preservePlayState && (this.playWhenReady || this.state === State.Playing)

    try {
      // Stop any current playback
      this.audioElement.pause()
      this.audioElement.currentTime = 0

      // Set the new source
      this.audioElement.src = track.url

      // Handle live stream specific settings
      if (track.isLiveStream) {
        // For live streams, we want to start at the live edge
        this.audioElement.currentTime = 0
      }

      // Maintain the playWhenReady flag if we're preserving play state
      if (preservePlayState) {
        this.playWhenReady = wasPlaying
      }

      // Load the audio
      this.audioElement.load()

      if (this.options.useMediaSession) {
        this.updateMediaSessionMetadata()
      }

      // Emit buffering state during track loading
      this.updateState(State.Buffering)

      return Promise.resolve()
    } catch (error) {
      this.isChangingTrack = false
      this.emitEvent({
        type: Event.PlaybackError,
        error: `Failed to load track: ${error instanceof Error ? error.message : String(error)}`
      })
      this.updateState(State.Error)
      return Promise.reject(error)
    }
  }

  /**
   * Preloads next track metadata to optimize duration detection
   */
  private preloadNextTrackMetadata(): void {
    if (this.currentTrackIndex < this.queue.length - 1) {
      const nextTrackIndex = this.currentTrackIndex + 1
      const nextTrack = this.queue[nextTrackIndex]

      // Only preload if we haven't already and it's not a live stream
      if (nextTrack && !nextTrack.isLiveStream && !this.metadataLoadedMap.get(nextTrackIndex)) {
        const tempAudio = new Audio()

        // Just load enough to get metadata
        tempAudio.preload = "metadata"

        // Set the source
        tempAudio.src = nextTrack.url

        // Listen for the metadata load
        tempAudio.addEventListener(
          "loadedmetadata",
          () => {
            this.metadataLoadedMap.set(nextTrackIndex, true)
            // Cleanup
            tempAudio.src = ""
          },
          { once: true }
        )

        // Handle errors silently
        tempAudio.addEventListener(
          "error",
          () => {
            // Cleanup on error
            tempAudio.src = ""
          },
          { once: true }
        )
      }
    }
  }

  /**
   * Checks if the player has the specified capability
   * @param capability The capability to check
   * @returns True if the player has the capability, false otherwise
   */
  private static hasCapability(capability: Capability): boolean {
    const instance = TrackPlayer.getInstance()
    return instance.options.capabilities?.includes(capability) || false
  }

  // Public API

  /**
   * Adds event listener for player events
   * @param event Event type
   * @param listener Event handler
   */
  public static addEventListener(event: Event, listener: EventHandler): void {
    const instance = TrackPlayer.getInstance()

    if (!instance.eventListeners.has(event)) {
      instance.eventListeners.set(event, new Set())
    }

    const listeners = instance.eventListeners.get(event)
    listeners?.add(listener)
  }

  /**
   * Removes event listener
   * @param event Event type
   * @param listener Event handler
   * @returns True if the listener was removed, false otherwise
   */
  public static removeEventListener(event: Event, listener: EventHandler): boolean {
    const instance = TrackPlayer.getInstance()

    const listeners = instance.eventListeners.get(event)
    if (listeners) {
      return listeners.delete(listener)
    }

    return false
  }

  /**
   * Updates player options after initialization
   * @param options Updated options
   * @returns Promise that resolves when options are updated
   */
  public static async updateOptions(options: Partial<SetupOptions>): Promise<void> {
    const instance = TrackPlayer.getInstance()

    // Update the options
    instance.options = { ...instance.options, ...options }

    // Update progress interval if needed
    if (options.updateInterval !== undefined) {
      instance.startProgressInterval()
    }

    // Update media session if needed
    if (options.useMediaSession !== undefined || options.capabilities !== undefined) {
      if (instance.options.useMediaSession && "mediaSession" in navigator) {
        instance.setupMediaSession()
        instance.updateMediaSessionMetadata() // Refresh metadata with new settings
      }
    }
  }

  /**
   * Adds tracks to the queue
   * @param tracks Track or array of tracks to add
   * @param insertBeforeIndex Optional index to insert before
   * @returns Promise that resolves when tracks are added
   */
  public static async add(tracks: Track | Track[], insertBeforeIndex?: number): Promise<void> {
    const instance = TrackPlayer.getInstance()

    const tracksArray = Array.isArray(tracks) ? tracks : [tracks]

    if (tracksArray.length === 0) {
      return
    }

    if (
      insertBeforeIndex !== undefined &&
      insertBeforeIndex >= 0 &&
      insertBeforeIndex <= instance.queue.length
    ) {
      instance.queue.splice(insertBeforeIndex, 0, ...tracksArray)

      // If we inserted before the current track, update the index
      if (instance.currentTrackIndex >= insertBeforeIndex) {
        instance.currentTrackIndex += tracksArray.length
      }
    } else {
      instance.queue.push(...tracksArray)
    }

    // If nothing is playing yet, load the first track
    if (instance.currentTrackIndex === -1 && instance.queue.length > 0) {
      instance.currentTrackIndex = 0
      const firstTrack = instance.queue[0]
      await instance.loadTrack(firstTrack, false)

      // Emit an initial track change event to ensure useActiveTrack picks it up
      instance.emitEvent({
        type: Event.PlaybackTrackChanged,
        prevTrack: null,
        nextTrack: 0
      })

      // Start preloading metadata for the next track
      instance.preloadNextTrackMetadata()
    }
  }

  /**
   * Moves a track from one position to another in the queue
   * @param fromIndex Index of the track to move
   * @param toIndex Destination index for the track
   * @returns Promise that resolves when the track is moved
   * @throws Error if indices are invalid
   */
  public static async move(fromIndex: number, toIndex: number): Promise<void> {
    const instance = TrackPlayer.getInstance()

    if (fromIndex < 0 || fromIndex >= instance.queue.length) {
      throw new Error(`From index ${fromIndex} is out of bounds`)
    }

    if (toIndex < 0 || toIndex >= instance.queue.length) {
      throw new Error(`To index ${toIndex} is out of bounds`)
    }

    // No need to do anything if indices are the same
    if (fromIndex === toIndex) {
      return
    }

    // Remember the current track index
    const currentTrackIndex = instance.currentTrackIndex

    // Remove the track from its current position
    const trackToMove = instance.queue[fromIndex]
    instance.queue.splice(fromIndex, 1)

    // Insert the track at the destination position
    instance.queue.splice(toIndex, 0, trackToMove)

    // Update the currentTrackIndex if needed
    if (currentTrackIndex === fromIndex) {
      // The current track is the one being moved
      instance.currentTrackIndex = toIndex
    } else if (fromIndex < currentTrackIndex && toIndex >= currentTrackIndex) {
      // Moving a track from before the current to after it - decrease index by 1
      instance.currentTrackIndex -= 1
    } else if (fromIndex > currentTrackIndex && toIndex <= currentTrackIndex) {
      // Moving a track from after the current to before it - increase index by 1
      instance.currentTrackIndex += 1
    }

    // Also update the metadataLoadedMap to match the new indices
    const metadataLoaded = instance.metadataLoadedMap.get(fromIndex)
    if (metadataLoaded !== undefined) {
      instance.metadataLoadedMap.delete(fromIndex)
      instance.metadataLoadedMap.set(toIndex, metadataLoaded)
    }

    // If the current playing track was moved, we might need to update media info
    if (currentTrackIndex === fromIndex && instance.options.useMediaSession) {
      instance.updateMediaSessionMetadata()
    }
  }

  /**
   * Removes tracks from the queue
   * @param indices Index or array of indices to remove
   * @returns Promise that resolves when tracks are removed
   */
  public static async remove(indices: number | number[]): Promise<void> {
    const instance = TrackPlayer.getInstance()

    const indicesArray = Array.isArray(indices) ? indices : [indices]

    if (indicesArray.length === 0) {
      return
    }

    // Sort indices in descending order to avoid index shifting during removal
    const sortedIndices = [...indicesArray].sort((a, b) => b - a)

    const currentIndex = instance.currentTrackIndex
    const wasPlaying = instance.state === State.Playing

    // Remove tracks by indices
    for (const index of sortedIndices) {
      if (index >= 0 && index < instance.queue.length) {
        instance.queue.splice(index, 1)

        // Adjust currentTrackIndex if needed
        if (index < currentIndex) {
          instance.currentTrackIndex -= 1
        } else if (index === currentIndex) {
          // Current track was removed
          if (instance.queue.length > 0) {
            // Set index to the next track or the last track if we removed the last one
            instance.currentTrackIndex = Math.min(currentIndex, instance.queue.length - 1)
            instance
              .loadTrack(instance.queue[instance.currentTrackIndex], wasPlaying)
              .catch(console.error)
          } else {
            instance.currentTrackIndex = -1
            instance.updateState(State.Stopped)
          }
        }
      }
    }

    // Clean up the metadata cache for removed tracks
    for (const index of sortedIndices) {
      instance.metadataLoadedMap.delete(index)
    }
  }

  /**
   * Skips to the track with the given index
   * @param index Index of the track to skip to
   * @returns Promise that resolves when the track is loaded
   * @throws Error if the track is not found
   */
  public static async skip(index: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.Skip)) {
      throw new Error("Skip capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (index < 0 || index >= instance.queue.length) {
      throw new Error(`Track index ${index} is out of bounds`)
    }

    const prevTrackIndex = instance.currentTrackIndex
    const wasPlaying = instance.state === State.Playing || instance.playWhenReady
    instance.currentTrackIndex = index

    // Don't change play state while changing tracks
    await instance.loadTrack(instance.queue[index], wasPlaying)

    instance.emitEvent({
      type: Event.PlaybackTrackChanged,
      prevTrack: prevTrackIndex >= 0 ? prevTrackIndex : null,
      nextTrack: index
    })

    // Start preloading metadata for the next track
    instance.preloadNextTrackMetadata()

    // Preserve playback state
    await TrackPlayer.play()
  }

  /**
   * Skips to the next track in the queue
   * @returns Promise that resolves when the next track is loaded
   * @throws Error if there is no next track
   */
  public static async skipToNext(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SkipToNext)) {
      throw new Error("SkipToNext capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (instance.currentTrackIndex < 0) {
      throw new Error("No track is currently playing")
    }

    // If in repeat track mode, restart the current song
    if (instance.repeatMode === RepeatMode.Track && instance.currentTrackIndex >= 0) {
      const wasPlaying = instance.state === State.Playing || instance.playWhenReady
      await instance.loadTrack(instance.queue[instance.currentTrackIndex], wasPlaying)
      await TrackPlayer.play()
      return
    }

    // Check if we're at the end of the queue
    if (instance.currentTrackIndex >= instance.queue.length - 1) {
      if (instance.repeatMode === RepeatMode.Queue && instance.queue.length > 0) {
        const wasPlaying = instance.state === State.Playing || instance.playWhenReady
        instance.currentTrackIndex = 0

        await instance.loadTrack(instance.queue[0], wasPlaying)

        instance.emitEvent({
          type: Event.PlaybackTrackChanged,
          prevTrack: instance.queue.length - 1, // The previous track was the last one
          nextTrack: instance.currentTrackIndex
        })

        await TrackPlayer.play()
        return
      } else {
        // If there's only one track in queue and not in repeat mode, throw error
        if (instance.queue.length === 1) {
          throw new Error("No next track available")
        }
        throw new Error("No next track available")
      }
    }

    const wasPlaying = instance.state === State.Playing || instance.playWhenReady
    instance.currentTrackIndex += 1

    await instance.loadTrack(instance.queue[instance.currentTrackIndex], wasPlaying)

    instance.emitEvent({
      type: Event.PlaybackTrackChanged,
      prevTrack: instance.currentTrackIndex - 1,
      nextTrack: instance.currentTrackIndex
    })

    instance.preloadNextTrackMetadata()
    await TrackPlayer.play()
  }

  /**
   * Skips to the previous track in the queue
   * @returns Promise that resolves when the previous track is loaded
   * @throws Error if there is no previous track
   */
  public static async skipToPrevious(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SkipToPrevious)) {
      throw new Error("SkipToPrevious capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (instance.currentTrackIndex < 0) {
      throw new Error("No track is currently playing")
    }

    // If in repeat track mode, restart the current song
    if (instance.repeatMode === RepeatMode.Track && instance.currentTrackIndex >= 0) {
      const wasPlaying = instance.state === State.Playing || instance.playWhenReady
      await instance.loadTrack(instance.queue[instance.currentTrackIndex], wasPlaying)
      await TrackPlayer.play()
      return
    }

    // Check if we're at the beginning of the queue
    if (instance.currentTrackIndex <= 0) {
      if (instance.repeatMode === RepeatMode.Queue && instance.queue.length > 0) {
        const wasPlaying = instance.state === State.Playing || instance.playWhenReady
        instance.currentTrackIndex = instance.queue.length - 1

        await instance.loadTrack(instance.queue[instance.currentTrackIndex], wasPlaying)

        instance.emitEvent({
          type: Event.PlaybackTrackChanged,
          prevTrack: 0, // The previous track was the first one
          nextTrack: instance.currentTrackIndex
        })

        await TrackPlayer.play()
        return
      } else {
        // If there's only one track in queue and not in repeat mode, throw error
        if (instance.queue.length === 1) {
          throw new Error("No previous track available")
        }
        throw new Error("No previous track available")
      }
    }

    const wasPlaying = instance.state === State.Playing || instance.playWhenReady
    instance.currentTrackIndex -= 1

    await instance.loadTrack(instance.queue[instance.currentTrackIndex], wasPlaying)

    instance.emitEvent({
      type: Event.PlaybackTrackChanged,
      prevTrack: instance.currentTrackIndex + 1,
      nextTrack: instance.currentTrackIndex
    })

    instance.preloadNextTrackMetadata()
    await TrackPlayer.play()
  }

  /**
   * Gets the current queue of tracks
   * @returns Array of tracks in the queue
   */
  public static getQueue(): Track[] {
    const instance = TrackPlayer.getInstance()
    return [...instance.queue]
  }

  /**
   * Gets a track from the queue by index
   * @param index Index of the track to retrieve
   * @returns The track, or undefined if not found
   */
  public static getTrack(index: number): Track | undefined {
    const instance = TrackPlayer.getInstance()

    if (index >= 0 && index < instance.queue.length) {
      return instance.queue[index]
    }

    return undefined
  }

  /**
   * Gets the currently active track object
   * @returns The active track, or undefined if none
   */
  public static getActiveTrack(): Track | undefined {
    const instance = TrackPlayer.getInstance()
    return instance.getCurrentTrackObject()
  }

  /**
   * Gets the index of the active track
   * @returns Index of the active track, or -1 if none
   */
  public static getActiveTrackIndex(): number {
    const instance = TrackPlayer.getInstance()
    return instance.currentTrackIndex
  }

  /**
   * Updates metadata for a specific track
   * @param index Index of the track to update
   * @param metadata Updated metadata fields
   */
  public static async updateMetadataForTrack(
    index: number,
    metadata: Partial<Track>
  ): Promise<void> {
    const instance = TrackPlayer.getInstance()

    if (index < 0 || index >= instance.queue.length) {
      throw new Error(`Track index ${index} is out of bounds`)
    }

    // Update the track
    instance.queue[index] = {
      ...instance.queue[index],
      ...metadata
    }

    // If this is the current track, update media session metadata
    if (index === instance.currentTrackIndex && instance.options.useMediaSession) {
      instance.updateMediaSessionMetadata()
    }
  }

  /**
   * Sets the repeat mode
   * @param mode RepeatMode option (Off, Track, Queue)
   * @returns Promise that resolves when the mode is set
   */
  public static async setRepeatMode(mode: RepeatMode): Promise<void> {
    const instance = TrackPlayer.getInstance()
    instance.repeatMode = mode
  }

  /**
   * Gets the current repeat mode
   * @returns The current RepeatMode value
   */
  public static getRepeatMode(): RepeatMode {
    const instance = TrackPlayer.getInstance()
    return instance.repeatMode
  }

  /**
   * Starts or resumes playback
   * @returns Promise that resolves when playback starts
   */
  public static async play(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.Play)) {
      throw new Error("Play capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    // Initialize audio graph on first user interaction (only once)
    if (!instance.sourceNode && instance.audioContext && !instance.hasTriedInitAudio) {
      instance.hasTriedInitAudio = true
      await instance.initializeAudioGraph()
    }

    // Check if we're at the end of the queue (last track has finished playing)
    // We're at the end if:
    // 1. State is Stopped AND we're on the last track AND current position is at/near the end
    const isAtQueueEnd =
      instance.state === State.Stopped &&
      instance.currentTrackIndex === instance.queue.length - 1 &&
      (instance.audioElement.currentTime >= instance.audioElement.duration - 0.1 ||
        instance.audioElement.duration === 0)

    // If we need to start from beginning
    if ((instance.currentTrackIndex === -1 || isAtQueueEnd) && instance.queue.length > 0) {
      const prevTrackIndex = instance.currentTrackIndex
      instance.currentTrackIndex = 0
      await instance.loadTrack(instance.queue[0], false)
      instance.playWhenReady = true

      // Emit track change event to update metadata in the UI
      instance.emitEvent({
        type: Event.PlaybackTrackChanged,
        prevTrack: prevTrackIndex >= 0 ? prevTrackIndex : null,
        nextTrack: 0
      })

      // Preload metadata for the next track
      instance.preloadNextTrackMetadata()
    }
    // If we're in Stopped state but have performed a seek on the last track
    else if (
      instance.state === State.Stopped &&
      instance.currentTrackIndex >= 0 &&
      instance.audioElement.currentTime < instance.audioElement.duration - 0.1
    ) {
      // Reload the current track but preserve the seeked position
      const currentPosition = instance.audioElement.currentTime
      await instance.loadTrack(instance.queue[instance.currentTrackIndex], false)
      if (currentPosition > 0) {
        instance.audioElement.currentTime = currentPosition
      }
      instance.playWhenReady = true
    } else if (instance.currentTrackIndex === -1) {
      throw new Error("No track is loaded")
    }

    instance.playWhenReady = true

    try {
      await instance.audioElement.play()
    } catch (error) {
      instance.emitEvent({
        type: Event.PlaybackError,
        error: `Failed to play: ${error instanceof Error ? error.message : String(error)}`
      })
      throw error
    }
  }

  /**
   * Pauses playback
   * @returns Promise that resolves when playback is paused
   */
  public static async pause(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.Pause)) {
      throw new Error("Pause capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.currentTrackIndex === -1) {
      throw new Error("No track is loaded")
    }

    instance.playWhenReady = false
    instance.audioElement.pause()
  }

  /**
   * Stops playback
   * @returns Promise that resolves when playback is stopped
   */
  public static async stop(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.Stop)) {
      throw new Error("Stop capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.currentTrackIndex === -1) {
      throw new Error("No track is loaded")
    }

    instance.playWhenReady = false
    instance.audioElement.pause()
    instance.audioElement.currentTime = 0

    // Clear the source
    instance.audioElement.src = ""

    instance.updateState(State.Stopped)
  }

  /**
   * Seeks to the specified position
   * @param position Position in seconds
   * @returns Promise that resolves when the seek is complete
   */
  public static async seekTo(position: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SeekTo)) {
      throw new Error("SeekTo capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.currentTrackIndex === -1) {
      throw new Error("No track is loaded")
    }

    instance.audioElement.currentTime = position

    // Emit progress immediately after seeking to update UI
    instance.emitProgress()
  }

  /**
   * Retries playback of the current track after an error
   * @returns Promise that resolves when the track is reloaded
   */
  public static async retry(): Promise<void> {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.currentTrackIndex === -1) {
      throw new Error("No track to retry")
    }

    const wasPlaying = instance.state === State.Playing || instance.playWhenReady

    // Reload the current track
    await instance.loadTrack(instance.queue[instance.currentTrackIndex], wasPlaying)

    // If it was playing before, resume playback
    if (wasPlaying) {
      await TrackPlayer.play()
    }
  }

  /**
   * Seeks by the specified offset
   * @param offset Offset in seconds (positive or negative)
   * @returns Promise that resolves when the seek is complete
   */
  public static async seekBy(offset: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SeekBy)) {
      throw new Error("SeekBy capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.currentTrackIndex === -1) {
      throw new Error("No track is loaded")
    }

    const newPosition = instance.audioElement.currentTime + offset

    // Prevent seeking past the end
    const clampedPosition = Math.min(newPosition, instance.audioElement.duration - 0.01)

    // Prevent seeking before the beginning
    instance.audioElement.currentTime = Math.max(0, clampedPosition)

    // Emit progress immediately after seeking to update UI
    instance.emitProgress()
  }

  /**
   * Sets the volume
   * @param volume Volume level from 0 to 1
   * @returns Promise that resolves when the volume is set
   */
  public static async setVolume(volume: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SetVolume)) {
      throw new Error("SetVolume capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    instance.audioElement.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Gets the current volume
   * @returns The current volume level (0 to 1)
   */
  public static getVolume(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    return instance.audioElement.volume
  }

  /**
   * Sets the playback rate
   * @param rate Playback rate from 0.25 to 2.0
   * @returns Promise that resolves when the rate is set
   */
  public static async setRate(rate: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SetRate)) {
      throw new Error("SetRate capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    instance.audioElement.playbackRate = Math.max(0.25, Math.min(2.0, rate))
  }

  /**
   * Gets the current playback rate
   * @returns The current playback rate
   */
  public static getRate(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    return instance.audioElement.playbackRate
  }

  /**
   * Gets the current playback state
   * @returns The playback state
   */
  public static getPlaybackState(): State {
    const instance = TrackPlayer.getInstance()
    return instance.state
  }

  /**
   * Gets the current playback position
   * @returns The position in seconds
   */
  public static getPosition(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      return 0
    }

    return instance.audioElement.currentTime
  }

  /**
   * Gets the duration of the current track
   * @returns The duration in seconds or 0 if no track is loaded
   */
  public static getDuration(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      return 0
    }

    return isNaN(instance.audioElement.duration) ? 0 : instance.audioElement.duration
  }

  /**
   * Gets the buffered position of the current track
   * @returns The buffered position in seconds
   */
  public static getBufferedPosition(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement || instance.audioElement.buffered.length === 0) {
      return 0
    }

    return instance.audioElement.buffered.end(instance.audioElement.buffered.length - 1)
  }

  /**
   * Gets the current progress information
   * @returns Progress object with position, duration, and buffered position
   */
  public static getProgress(): Progress {
    return {
      position: TrackPlayer.getPosition(),
      duration: TrackPlayer.getDuration(),
      buffered: TrackPlayer.getBufferedPosition()
    }
  }

  /**
   * Enables or disables the equalizer
   * @param enabled True to enable, false to disable
   */
  public static setEqualizerEnabled(enabled: boolean): void {
    const instance = TrackPlayer.getInstance()
    instance.equalizerOptions.enabled = enabled

    if (instance.equalizerFilters.length > 0) {
      instance.equalizerFilters.forEach((filter, index) => {
        if (enabled) {
          filter.gain.value = instance.equalizerOptions.bands[index].gain
        } else {
          filter.gain.value = 0
        }
      })
    }
  }

  /**
   * Checks if the equalizer is enabled
   * @returns True if the equalizer is enabled
   */
  public static isEqualizerEnabled(): boolean {
    const instance = TrackPlayer.getInstance()
    return instance.equalizerOptions.enabled
  }

  /**
   * Sets the gain of a specific equalizer band
   * @param bandIndex Band index (0-9)
   * @param gain Gain in dB (-12 to +12)
   */
  public static setEqualizerBandGain(bandIndex: number, gain: number): void {
    const instance = TrackPlayer.getInstance()

    if (bandIndex < 0 || bandIndex >= instance.equalizerOptions.bands.length) {
      throw new Error(`Band index ${bandIndex} is out of range`)
    }

    // Clamp gain between -12 and +12 dB
    const clampedGain = Math.max(-12, Math.min(12, gain))

    // Update options
    instance.equalizerOptions.bands[bandIndex].gain = clampedGain

    // Update filter if enabled
    if (instance.equalizerOptions.enabled && instance.equalizerFilters[bandIndex]) {
      instance.equalizerFilters[bandIndex].gain.value = clampedGain
    }
  }

  /**
   * Gets the gain of a specific band
   * @param bandIndex Band index
   * @returns Gain in dB
   */
  public static getEqualizerBandGain(bandIndex: number): number {
    const instance = TrackPlayer.getInstance()

    if (bandIndex < 0 || bandIndex >= instance.equalizerOptions.bands.length) {
      throw new Error(`Band index ${bandIndex} is out of range`)
    }

    return instance.equalizerOptions.bands[bandIndex].gain
  }

  /**
   * Gets all equalizer bands
   * @returns Array with configuration of all bands
   */
  public static getEqualizerBands(): EqualizerBand[] {
    const instance = TrackPlayer.getInstance()
    return [...instance.equalizerOptions.bands]
  }

  /**
   * Sets multiple equalizer bands at once
   * @param bands Array with the configuration of the bands
   */
  public static setEqualizerBands(bands: EqualizerBand[]): void {
    const instance = TrackPlayer.getInstance()

    if (bands.length !== instance.equalizerOptions.bands.length) {
      throw new Error(
        `Expected ${instance.equalizerOptions.bands.length} bands, got ${bands.length}`
      )
    }

    bands.forEach((band, index) => {
      const clampedGain = Math.max(-12, Math.min(12, band.gain))
      instance.equalizerOptions.bands[index] = { ...band, gain: clampedGain }

      // Update filter if enabled
      if (instance.equalizerOptions.enabled && instance.equalizerFilters[index]) {
        instance.equalizerFilters[index].gain.value = clampedGain
      }
    })
  }

  /**
   * Resets the equalizer to default values (all gains to 0)
   */
  public static resetEqualizer(): void {
    const instance = TrackPlayer.getInstance()

    instance.equalizerOptions.bands.forEach((band, index) => {
      band.gain = 0

      if (instance.equalizerFilters[index]) {
        instance.equalizerFilters[index].gain.value = 0
      }
    })
  }

  /**
   * Applies a predefined equalizer preset
   * @param preset Preset name (e.g., "rock", "pop", "flat")
   */
  public static setEqualizerPreset(preset: EqualizerPreset): void {
    const instance = TrackPlayer.getInstance()

    let gains: number[]

    // Predefined presets with optimized settings
    switch (preset.toLowerCase()) {
      case "rock":
        gains = [4, 3, 1, -1, 0, 1, 3, 4, 4, 3]
        break
      case "pop":
        gains = [1, 2, 3, 2, 0, -1, -1, 1, 2, 3]
        break
      case "jazz":
        gains = [2, 1, 0, 1, 2, 2, 1, 0, 1, 2]
        break
      case "classical":
        gains = [3, 2, 1, 0, -1, -1, 0, 1, 2, 3]
        break
      case "electronic":
        gains = [5, 4, 2, 0, -1, 1, 2, 3, 4, 5]
        break
      case "vocal":
        gains = [0, -1, 0, 2, 4, 3, 2, 1, 0, -1]
        break
      case "bass":
        gains = [6, 5, 4, 2, 1, 0, -1, -2, -2, -2]
        break
      case "treble":
        gains = [-2, -2, -1, 0, 1, 2, 4, 5, 6, 6]
        break
      case "flat":
      default:
        gains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        break
    }

    if (gains.length !== instance.equalizerOptions.bands.length) {
      throw new Error(
        `Expected ${instance.equalizerOptions.bands.length} gain values, got ${gains.length}`
      )
    }

    gains.forEach((gain, index) => {
      TrackPlayer.setEqualizerBandGain(index, gain)
    })
  }

  /**
   * Gets real-time audio analysis data
   * @returns Frequency and time-domain data
   */
  public static getAudioAnalysisData(): AudioAnalysisData | null {
    const instance = TrackPlayer.getInstance()

    if (!instance.analyserNode || !instance.audioContext) {
      return null
    }

    const bufferLength = instance.analyserNode.frequencyBinCount
    const frequencyData = new Uint8Array(bufferLength)
    const timeData = new Uint8Array(bufferLength)

    instance.analyserNode.getByteFrequencyData(frequencyData)
    instance.analyserNode.getByteTimeDomainData(timeData)

    return {
      frequencyData,
      timeData,
      sampleRate: instance.audioContext.sampleRate,
      fftSize: instance.analyserNode.fftSize
    }
  }

  /**
   * Configures the audio analyser
   * @param fftSize FFT size (must be a power of 2)
   * @param smoothingTimeConstant Temporal smoothing (0-1)
   */
  public static configureAudioAnalyser(
    fftSize: number = 2048,
    smoothingTimeConstant: number = 0.8
  ): void {
    const instance = TrackPlayer.getInstance()

    if (!instance.analyserNode) {
      console.warn("Audio analyser not initialized")
      return
    }

    // Check if fftSize is a power of 2
    if ((fftSize & (fftSize - 1)) !== 0) {
      throw new Error("fftSize must be a power of 2")
    }

    instance.analyserNode.fftSize = fftSize
    instance.analyserNode.smoothingTimeConstant = Math.max(0, Math.min(1, smoothingTimeConstant))
  }

  /**
   * Resets the player state
   * @returns Promise that resolves when the player is reset
   */
  public static async reset(): Promise<void> {
    const instance = TrackPlayer.getInstance()

    await TrackPlayer.stop().catch(() => {})

    instance.queue = []
    instance.currentTrackIndex = -1
    instance.metadataLoadedMap.clear()
    instance.updateState(State.Ready)
  }

  /**
   * Destroys the player and releases resources
   * @returns Promise that resolves when the player is destroyed
   */
  public static async destroy(): Promise<void> {
    const instance = TrackPlayer.getInstance()

    instance.stopProgressInterval()

    if (instance.audioElement) {
      instance.audioElement.pause()
      instance.audioElement.src = ""
      instance.audioElement.remove()
      instance.audioElement = null
    }

    instance.queue = []
    instance.currentTrackIndex = -1
    instance.eventListeners.clear()
    instance.metadataLoadedMap.clear()
    instance.isSetup = false
    instance.state = State.None

    TrackPlayer.instance = null
  }
}

export default TrackPlayer
