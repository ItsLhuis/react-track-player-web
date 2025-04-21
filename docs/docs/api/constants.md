---
sidebar_position: 5
id: constants
title: Constants
---

# Constants

React Track Player Web provides several constants for player states, events, capabilities, and
repeat modes.

## State

Enum representing the different states the player can be in.

```javascript
import { State } from "react-track-player-web"
```

| Constant          | Description                             |
| ----------------- | --------------------------------------- |
| `State.None`      | Player is not initialized               |
| `State.Ready`     | Player is ready but not playing         |
| `State.Playing`   | Audio is playing                        |
| `State.Paused`    | Playback is paused                      |
| `State.Stopped`   | Playback is stopped (at start position) |
| `State.Buffering` | Player is buffering audio               |
| `State.Error`     | An error occurred                       |

### Example

```javascript
import { State } from "react-track-player-web"

// Check if player is currently playing
if (TrackPlayer.getPlaybackState() === State.Playing) {
  console.log("Music is playing!")
}
```

## Event

Enum representing the different events that can be emitted by the player.

```javascript
import { Event } from "react-track-player-web"
```

| Constant                         | Description                                      | Event Data                                                 |
| -------------------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| `Event.PlaybackState`            | Fired when the playback state changes            | `{ state: State }`                                         |
| `Event.PlaybackTrackChanged`     | Fired when the current track changes             | `{ prevTrack: number, nextTrack: number }`                 |
| `Event.PlaybackProgressUpdated`  | Fired periodically with position updates         | `{ position: number, duration: number, buffered: number }` |
| `Event.PlaybackError`            | Fired when an error occurs during playback       | `{ error: string }`                                        |
| `Event.PlaybackQueueEnded`       | Fired when playback reaches the end of the queue | `{}`                                                       |
| `Event.PlaybackMetadataReceived` | Fired when track metadata is updated             | `{ track: number, metadata: object }`                      |

### Example

```javascript
import { Event } from "react-track-player-web"

// Listen for playback errors
TrackPlayer.addEventListener(Event.PlaybackError, (data) => {
  console.error("Playback error:", data.error)
})
```

## Capability

Enum representing the different capabilities that can be enabled for the player.

```javascript
import { Capability } from "react-track-player-web"
```

| Constant                    | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `Capability.Play`           | Enable play functionality                                       |
| `Capability.Pause`          | Enable pause functionality                                      |
| `Capability.Stop`           | Enable stop functionality                                       |
| `Capability.Skip`           | Enable skip to any track in the queue                           |
| `Capability.SkipToNext`     | Enable skip to next track                                       |
| `Capability.SkipToPrevious` | Enable skip to previous track                                   |
| `Capability.SeekTo`         | Enable seeking to position                                      |
| `Capability.SeekBy`         | Enable seeking forward or backward by a relative amount of time |
| `Capability.SetVolume`      | Enable volume control                                           |
| `Capability.SetRate`        | Enable playback rate control                                    |

### Example

```javascript
import { Capability } from "react-track-player-web"

// Setup player with specific capabilities
await TrackPlayer.setupPlayer({
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
    Capability.SeekTo
  ]
})
```

## RepeatMode

Enum representing the different repeat modes for playback.

```javascript
import { RepeatMode } from "react-track-player-web"
```

| Constant           | Description                        |
| ------------------ | ---------------------------------- |
| `RepeatMode.Off`   | No repeat, play through queue once |
| `RepeatMode.Track` | Repeat the current track           |
| `RepeatMode.Queue` | Repeat the entire queue            |

### Example

```javascript
import { RepeatMode } from "react-track-player-web"

// Set player to repeat the current track
await TrackPlayer.setRepeatMode(RepeatMode.Track)

// Check current repeat mode
const currentMode = TrackPlayer.getRepeatMode()
if (currentMode === RepeatMode.Queue) {
  console.log("Player is set to repeat the entire queue")
}
```
