/**
 * Player capabilities
 *
 * Defines the actions that the player can support and expose to the UI,
 * such as play, pause, skip, seek, etc.
 */
export enum Capability {
  /**
   * Allows playing the current track
   */
  Play = "play",

  /**
   * Allows pausing the current track
   */
  Pause = "pause",

  /**
   * Allows stopping playback
   */
  Stop = "stop",

  /**
   * Allows skipping to any track in the queue
   */
  Skip = "skip",

  /**
   * Allows skipping to the next track in the queue
   */
  SkipToNext = "skip-to-next",

  /**
   * Allows skipping to the previous track in the queue
   */
  SkipToPrevious = "skip-to-previous",

  /**
   * Allows seeking to a specific position in the track
   */
  SeekTo = "seek-to",

  /**
   * Allows seeking forward or backward by a relative amount of time
   */
  SeekBy = "seek-by",

  /**
   * Allows setting the playback volume
   */
  SetVolume = "set-volume",

  /**
   * Allows changing the playback rate (e.g. speed up or slow down)
   */
  SetRate = "set-rate"
}

/**
 * Player events
 *
 * Defines the events emitted by the player during its lifecycle,
 * such as state changes, track changes, progress updates, etc.
 */
export enum Event {
  /**
   * Emitted when the playback state changes (e.g. playing, paused)
   */
  PlaybackState = "playback-state",

  /**
   * Emitted when an error occurs during playback
   */
  PlaybackError = "playback-error",

  /**
   * Emitted when the current track changes (e.g. skip, auto-next)
   */
  PlaybackTrackChanged = "playback-track-changed",

  /**
   * Emitted periodically with the current playback position
   */
  PlaybackProgressUpdated = "playback-progress-updated"
}

/**
 * Player states
 *
 * Represents the various states the player can be in,
 * such as playing, paused, buffering, etc.
 */
export enum State {
  /**
   * No track is loaded
   */
  None = "none",

  /**
   * Player is ready with a loaded track
   */
  Ready = "ready",

  /**
   * Playback is currently active
   */
  Playing = "playing",

  /**
   * Playback is paused
   */
  Paused = "paused",

  /**
   * Playback is stopped
   */
  Stopped = "stopped",

  /**
   * Player is buffering data
   */
  Buffering = "buffering",

  /**
   * An error occurred and playback cannot proceed
   */
  Error = "error"
}

/**
 * Repeat modes
 *
 * Controls the repeat behavior of the player, such as repeating
 * a single track or the entire queue.
 */
export enum RepeatMode {
  /**
   * Doesn't repeat anything
   */
  Off = "off",

  /**
   * Loops the current track indefinitely
   */
  Track = "track",

  /**
   * Repeats the entire queue from the beginning
   */
  Queue = "queue"
}
