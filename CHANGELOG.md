# Changelog

All notable changes to the React Track Player Web project will be documented in this file.

## 1.0.1 - 2025-04-20

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
