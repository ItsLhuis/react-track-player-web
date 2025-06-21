import { Capability, Event, State } from "./constants"

/**
 * Track object type
 *
 * Represents a single audio track with associated metadata,
 * such as title, artist, album, artwork, and duration.
 */
export type Track = {
  /**
   * URL of the audio file
   */
  url: string

  /**
   * Track title
   */
  title: string

  /**
   * Name of the artist
   */
  artist?: string

  /**
   * Name of the album
   */
  album?: string

  /**
   * URL to the track's artwork image
   */
  artwork?: string

  /**
   * Duration of the track in seconds
   */
  duration?: number

  /**
   * Flag for live streams
   */
  isLiveStream?: boolean

  /**
   * Any additional custom metadata
   */
  [key: string]: any
}

/**
 * Setup options for the track player
 *
 * Configuration used when initializing the player,
 * such as buffering behavior, update intervals, and capabilities.
 */
export type SetupOptions = {
  /**
   * Whether the player should wait for the buffer to be ready before playing
   * @default true
   */
  waitForBuffer?: boolean

  /**
   * Interval in seconds between progress updates
   * @default 1
   */
  updateInterval?: number

  /**
   * Whether to enable integration with the MediaSession API
   * @default true
   */
  useMediaSession?: boolean

  /**
   * List of player capabilities to enable (e.g. play, pause, skip)
   * @default All capabilities
   */
  capabilities?: Capability[]
}

/**
 * Event data for a track change event
 *
 * Emitted when the current track changes (e.g. auto-skip or manual skip)
 */
export type TrackChangedEventData = {
  /**
   * Type of the event
   */
  type: Event.PlaybackTrackChanged

  /**
   * Index of the previous track, or null if none
   */
  prevTrack: number | null

  /**
   * Index of the next track, or null if none
   */
  nextTrack: number | null
}

/**
 * Event data for playback state changes
 *
 * Emitted when the playback state transitions (e.g. from playing to paused)
 */
export type PlaybackStateEventData = {
  /**
   * Type of the event
   */
  type: Event.PlaybackState

  /**
   * Current playback state
   */
  state: State
}

/**
 * Event data for playback errors
 *
 * Emitted when an error occurs during playback
 */
export type PlaybackErrorEventData = {
  /**
   * Type of the event
   */
  type: Event.PlaybackError

  /**
   * Description of the error
   */
  error: string

  /**
   * Optional error code
   */
  code?: string
}

/**
 * Event data for playback progress updates
 *
 * Emitted periodically to report playback position and buffer status
 */
export type PlaybackProgressEventData = {
  /**
   * Type of the event
   */
  type: Event.PlaybackProgressUpdated

  /**
   * Current playback position in seconds
   */
  position: number

  /**
   * Duration of the current track in seconds
   */
  duration: number

  /**
   * Buffered position in seconds
   */
  buffered: number
}

/**
 * Combined type for all player event data
 *
 * Union type that encompasses all possible event payloads.
 */
export type EventData =
  | TrackChangedEventData
  | PlaybackStateEventData
  | PlaybackErrorEventData
  | PlaybackProgressEventData

/**
 * Event handler function
 *
 * Callback function invoked when a player event is emitted.
 */
export type EventHandler = (data: EventData) => void

/**
 * Playback progress data
 *
 * Represents the current state of playback progress,
 * including position, duration, and buffered amount.
 */
export type Progress = {
  /**
   * Current playback position in seconds
   */
  position: number

  /**
   * Total duration of the current track in seconds
   */
  duration: number

  /**
   * Current buffered position in seconds
   */
  buffered: number
}

/**
 * Equalizer frequency values
 *
 * Represents the center frequencies (in Hz) of the standard 10-band equalizer.
 * These values correspond to commonly used frequency bands in audio equalization,
 * covering the full audible spectrum from sub-bass to high treble.
 *
 * Typical mapping:
 * - 32 Hz: Sub-bass
 * - 64 Hz: Bass
 * - 125 Hz: Low mids
 * - 250 Hz: Midrange
 * - 500 Hz: Upper mids
 * - 1000 Hz: Presence
 * - 2000 Hz: Upper presence
 * - 4000 Hz: Brilliance
 * - 8000 Hz: Treble
 * - 16000 Hz: Air
 */
export type EqualizerFrequency = 32 | 64 | 125 | 250 | 500 | 1000 | 2000 | 4000 | 8000 | 16000

/**
 * Equalizer band configuration
 *
 * Represents a single frequency band in the equalizer with its
 * frequency, gain adjustment, and quality factor settings.
 */
export type EqualizerBand = {
  /**
   * Center frequency of the band in Hz
   * Common values: 32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000
   */
  frequency: EqualizerFrequency

  /**
   * Gain adjustment for this frequency band in decibels
   * Range: -12dB to +12dB
   * Positive values boost the frequency, negative values cut it
   */
  gain: number

  /**
   * Quality factor (Q) that determines the bandwidth of the filter
   * Higher Q values create narrower bands, lower Q values create wider bands
   * Typical range: 0.1 to 30, with 1 being a good default
   */
  Q: number
}

/**
 * Equalizer configuration options
 *
 * Contains the overall equalizer settings including whether it's enabled
 * and the configuration for all frequency bands.
 */
export type EqualizerOptions = {
  /**
   * Whether the equalizer is currently enabled
   * When disabled, all frequency adjustments are bypassed
   */
  enabled: boolean

  /**
   * Array of equalizer bands configuration
   * Typically contains 10 bands covering the audible frequency spectrum
   */
  bands: EqualizerBand[]
}

/**
 * Equalizer preset names
 *
 * Predefined equalizer configurations for different music genres
 * and listening preferences.
 */
export type EqualizerPreset =
  | "flat" // No adjustments (0dB on all bands)
  | "rock" // Enhanced bass and treble for rock music
  | "pop" // Balanced with slight bass and treble boost
  | "jazz" // Smooth mid-range emphasis
  | "classical" // Natural sound with subtle enhancements
  | "electronic" // Heavy bass and crisp highs for electronic music
  | "vocal" // Mid-range boost for vocal clarity
  | "bass" // Heavy low-frequency emphasis
  | "treble" // High-frequency emphasis

/**
 * Audio analysis data
 *
 * Real-time frequency analysis data from the audio stream,
 * useful for creating visualizers or automatic EQ adjustments.
 */
export type AudioAnalysisData = {
  /**
   * Frequency domain data (FFT)
   * Array of frequency magnitudes from 0Hz to Nyquist frequency
   */
  frequencyData: Uint8Array

  /**
   * Time domain data (waveform)
   * Array of amplitude values over time
   */
  timeData: Uint8Array

  /**
   * Sample rate of the audio context
   */
  sampleRate: number

  /**
   * Size of the FFT analysis
   * Determines frequency resolution
   */
  fftSize: number
}
