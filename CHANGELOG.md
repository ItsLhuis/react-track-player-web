# Changelog

All notable changes to the React Track Player Web project will be documented in this file.

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
