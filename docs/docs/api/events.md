---
sidebar_position: 1
id: events
title: Events
---

# Events

React Track Player Web emits various events that allow you to monitor and respond to changes in
playback status, track changes, and more.

## Available Events

The library provides the following events, accessible through the `Event` enum:

| Event                     | Description                                                   |
| ------------------------- | ------------------------------------------------------------- |
| `PlaybackState`           | Fired when the playback state changes (playing, paused, etc.) |
| `PlaybackTrackChanged`    | Fired when the current track changes                          |
| `PlaybackProgressUpdated` | Fired periodically with updated playback position             |
| `PlaybackError`           | Fired when a playback error occurs                            |

## Listening to Events

You can register event listeners using the `addEventListener` method:

```javascript
import TrackPlayer, { Event } from "react-track-player-web"

// Listen for playback state changes
const stateListener = (data) => {
  console.log("Playback state changed:", data.state)
}
TrackPlayer.addEventListener(Event.PlaybackState, stateListener)

// Listen for track changes
TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (data) => {
  console.log("Track changed from", data.prevTrack, "to", data.nextTrack)
})

// Listen for progress updates
TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (data) => {
  console.log(`Position: ${data.position}, Duration: ${data.duration}`)
})

// Listen for errors
TrackPlayer.addEventListener(Event.PlaybackError, (data) => {
  console.error("Playback error:", data.error, "Code:", data.code)
})
```

## Removing Event Listeners

To prevent memory leaks, you should remove event listeners when they're no longer needed:

```javascript
// Remove a specific listener
TrackPlayer.removeEventListener(Event.PlaybackState, stateListener)
```

## Event Data

Each event provides specific data:

### PlaybackState

```typescript
{
  type: Event.PlaybackState,
  state: State // The new playback state
}
```

### PlaybackTrackChanged

```typescript
{
  type: Event.PlaybackTrackChanged,
  prevTrack: number | null, // Index of the previous track (or null)
  nextTrack: number // Index of the new track
}
```

### PlaybackProgressUpdated

```typescript
{
  type: Event.PlaybackProgressUpdated,
  position: number, // Current playback position in seconds
  duration: number, // Track duration in seconds
  buffered: number // Buffered position in seconds
}
```

### PlaybackError

```typescript
{
  type: Event.PlaybackError,
  error: string, // Error message
  code?: string // Error code (if available)
}
```

## Using with React Components

Instead of manually managing event listeners in React components, it's recommended to use the
`useTrackPlayerEvents` hook:

```javascript
import React, { useState } from "react"
import { useTrackPlayerEvents, Event, State } from "react-track-player-web"

function PlayerStatus() {
  const [playerState, setPlayerState] = useState("Unknown")
  const [currentTrack, setCurrentTrack] = useState(null)

  // Register multiple event listeners at once
  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackTrackChanged], (event) => {
    if (event.type === Event.PlaybackState) {
      // Map state enum to human-readable string
      const stateMap = {
        [State.None]: "Uninitialized",
        [State.Ready]: "Ready",
        [State.Playing]: "Playing",
        [State.Paused]: "Paused",
        [State.Stopped]: "Stopped",
        [State.Buffering]: "Buffering",
        [State.Error]: "Error"
      }
      setPlayerState(stateMap[event.state] || "Unknown")
    }

    if (event.type === Event.PlaybackTrackChanged) {
      // Get the track information
      const trackInfo = TrackPlayer.getTrack(event.nextTrack)
      setCurrentTrack(trackInfo)
    }
  })

  return (
    <div>
      <div>Player state: {playerState}</div>
      {currentTrack && (
        <div>
          Now playing: {currentTrack.title} by {currentTrack.artist || "Unknown Artist"}
        </div>
      )}
    </div>
  )
}
```

This approach ensures that event listeners are properly cleaned up when the component unmounts.
