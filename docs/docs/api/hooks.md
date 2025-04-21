---
sidebar_position: 4
id: hooks
title: Hooks
---

# Hooks

React Track Player Web provides several hooks to easily integrate player functionality into your
React components.

## useTrackPlayerEvents

Register event listeners that are automatically cleaned up when the component unmounts.

```javascript
import { useTrackPlayerEvents, Event } from "react-track-player-web"

function MyComponent() {
  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackTrackChanged], (event) => {
    // Handle events
    if (event.type === Event.PlaybackState) {
      console.log("State changed:", event.state)
    } else if (event.type === Event.PlaybackTrackChanged) {
      console.log("Track changed:", event.nextTrack)
    }
  })

  return <div>Player controls</div>
}
```

### Parameters

| Parameter | Type              | Required | Description                                                    |
| --------- | ----------------- | -------- | -------------------------------------------------------------- |
| events    | `Event[]`         | Yes      | Array of events to subscribe to                                |
| callback  | `(event) => void` | Yes      | Function called when any of the specified events are triggered |

## useProgress

Tracks playback progress and provides position, duration, and buffered information.

```javascript
import { useProgress } from "react-track-player-web"

function ProgressBar() {
  // Update progress every 500ms (default is 1000ms)
  const { position, duration, buffered } = useProgress(500)

  const progress = (position / duration) * 100 || 0
  const bufferedPercent = (buffered / duration) * 100 || 0

  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="buffered-bar" style={{ width: `${bufferedPercent}%` }} />
      <div className="time-display">
        {formatTime(position)} / {formatTime(duration)}
      </div>
    </div>
  )
}
```

### Parameters

| Parameter      | Type     | Required | Description                                       |
| -------------- | -------- | -------- | ------------------------------------------------- |
| updateInterval | `number` | No       | Update interval in milliseconds (default: 1000ms) |

### Return Value

An object with the following properties:

| Property | Type     | Description                                       |
| -------- | -------- | ------------------------------------------------- |
| position | `number` | Current playback position in seconds              |
| duration | `number` | Total duration of the current track in seconds    |
| buffered | `number` | Buffered position of the current track in seconds |

## usePlaybackState

Keeps track of the current playback state.

```javascript
import { usePlaybackState, State } from "react-track-player-web"

function PlayPauseButton() {
  const playbackState = usePlaybackState()

  const handlePlayPause = async () => {
    if (playbackState === State.Playing) {
      await TrackPlayer.pause()
    } else {
      await TrackPlayer.play()
    }
  }

  return (
    <button onClick={handlePlayPause}>{playbackState === State.Playing ? "Pause" : "Play"}</button>
  )
}
```

### Return Value

Returns the current playback state (`State` enum value).

## usePlayWhenReady

Tracks whether the player will start playing once it's ready.

```javascript
import { usePlayWhenReady, State, usePlaybackState } from "react-track-player-web"

function LoadingIndicator() {
  const playWhenReady = usePlayWhenReady()
  const playbackState = usePlaybackState()

  const isLoading = playWhenReady && playbackState === State.Buffering

  return isLoading ? <div className="loading-spinner" /> : null
}
```

### Return Value

Returns a boolean indicating whether the player will automatically start playing once it's ready.

## useActiveTrack

Keeps track of the currently active track.

```javascript
import { useActiveTrack } from "react-track-player-web"

function NowPlaying() {
  const track = useActiveTrack()

  if (!track) return <div>No track playing</div>

  return (
    <div className="now-playing">
      {track.artwork && <img src={track.artwork} alt="Album Art" />}
      <div className="track-info">
        <h3>{track.title}</h3>
        <p>{track.artist}</p>
      </div>
    </div>
  )
}
```

### Return Value

Returns the currently active track object or `null` if no track is active.
