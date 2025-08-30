# Changelog

All notable changes to the React Track Player Web project will be documented in this file.

## [1.1.3] - 2025-08-30

### Fixed

- 🚧 **Race condition in reset method causing AbortError**
  - Fixed "The play() request was interrupted by a call to pause()" error during queue transitions
  - Improved audio element cleanup with direct manipulation instead of async stop operations
  - Removed TrackPlayer.stop() call from reset() method to prevent conflicts

## [1.1.2] - 2025-08-17

### Fixed

- 🔁 **RepeatMode.Queue behavior for single track scenarios**
  - Fixed skipToNext/skipToPrevious logic when only one track exists in queue with RepeatMode.Queue
  - Single track now correctly restarts when using RepeatMode.Queue mode
  - Improved validation order to prioritize repeat mode logic over track count checks
  - Maintains consistent behavior across all repeat modes regardless of queue size

## [1.1.1] - 2025-08-17

### Fixed

- 🔧 **CORS restrictions with Web Audio API**

  - Fixed "MediaElementAudioSource outputs zeroes due to CORS access restrictions" error
  - Added `crossOrigin = "anonymous"` to audio element initialization
  - Equalizer and audio analysis now work correctly with all audio sources

- 🎵 **Queue navigation behavior in repeat modes**
  - Fixed skip next/previous logic when only one track exists in queue
  - RepeatMode.Track: Skip functions now correctly restart the current track
  - RepeatMode.Off: Skip functions throw error when reaching queue boundaries
  - RepeatMode.Queue: Skip functions correctly wrap around queue boundaries
  - Improved consistency in queue boundary handling across all repeat modes

## [1.1.0] - 2025-06-21

### Added

- 🟦 **10-band Equalizer with presets and real-time control**
  - Enable/disable equalizer functionality
  - Control individual band gains (-12 to +12 dB)
  - Set all bands at once with custom configurations
  - Built-in presets: "rock", "pop", "jazz", "classical", "electronic", "vocal", "bass", "treble",
    "flat"
  - Real-time equalizer adjustments during playback
  - Full programmatic control via new API methods:
    - `setEqualizerEnabled()` / `isEqualizerEnabled()`
    - `setEqualizerBandGain()` / `getEqualizerBandGain()`
    - `setEqualizerBands()` / `getEqualizerBands()`
    - `setEqualizerPreset()`
    - `resetEqualizer()`

## [1.0.2] - 2025-04-21

### Added

- 📚 Published official documentation site at https://itslhuis.github.io/react-track-player-web/

### Fixed

- 🏠 Fixed the `homepage` field in `package.json` to correctly point to the documentation site

## [1.0.1] - 2025-04-20

### Added

- 🎵 Full audio playback control (play, pause, skip, seek)
- 📋 Queue management
- 🔁 Repeat modes (Off, Track, Queue)
- 🎚️ Volume and playback rate control
- 📱 MediaSession API integration for media controls
- 🔄 Event system for state changes and updates
- 🌊 Buffer state tracking
- 📊 Playback progress tracking
- 🔧 Configurable capabilities
- React hooks for easy integration:
  - useTrackPlayerEvents - Register event listeners
  - useProgress - Track playback progress
  - usePlaybackState - Monitor current playback state
  - usePlayWhenReady - Track if player will start when ready
  - useActiveTrack - Keep track of currently active track
