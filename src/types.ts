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
