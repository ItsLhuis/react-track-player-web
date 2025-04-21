---
sidebar_position: 6
id: objects
title: Objects
---

# Objects

This page describes the structure of various objects used in React Track Player Web.

## Track

The Track object is the fundamental unit for playback in React Track Player Web.

```typescript
type Track = {
  url: string // URL of the audio file (required)
  title: string // Track title (required)
  artist?: string // Name of the artist
  album?: string // Name of the album
  artwork?: string // URL to the track's artwork image
  duration?: number // Duration in seconds
  isLiveStream?: boolean // Flag for live streams
  [key: string]: any // Any additional custom metadata
}
```

### Required Properties

| Property | Type     | Description                                     |
| -------- | -------- | ----------------------------------------------- |
| `url`    | `string` | URL of the audio file to play (local or remote) |
| `title`  | `string` | Title of the track                              |

### Optional Properties

| Property       | Type      | Description                                                          |
| -------------- | --------- | -------------------------------------------------------------------- |
| `artist`       | `string`  | Name of the artist                                                   |
| `album`        | `string`  | Name of the album                                                    |
| `artwork`      | `string`  | URL to artwork image                                                 |
| `duration`     | `number`  | Duration in seconds (will be detected automatically if not provided) |
| `isLiveStream` | `boolean` | Whether this track is a live stream                                  |

### Custom Properties

You can add any additional properties to a Track object. These will be stored and available when
accessing the track later.

### Example

```javascript
const track = {
  url: "https://example.com/audio/song.mp3",
  title: "Awesome Song",
  artist: "Amazing Artist",
  album: "Fantastic Album",
  artwork: "https://example.com/artwork/song.jpg",
  duration: 245,
  isLiveStream: false,
  // Custom properties
  genre: "Pop",
  releaseYear: 2023,
  lyrics: "La la la, this is my song..."
}
```

## Progress

The Progress object represents the current playback progress.

```typescript
type Progress = {
  position: number // Current playback position in seconds
  duration: number // Total duration of the track in seconds
  buffered: number // Amount of the track that has been buffered in seconds
}
```

### Properties

| Property   | Type     | Description                                                 |
| ---------- | -------- | ----------------------------------------------------------- |
| `position` | `number` | Current playback position in seconds                        |
| `duration` | `number` | Total duration of the current track in seconds              |
| `buffered` | `number` | Position up to which the track has been buffered in seconds |

### Example

```javascript
// Get current progress
const progress = TrackPlayer.getProgress()
console.log(`
  Position: ${progress.position} seconds
  Duration: ${progress.duration} seconds
  Buffered: ${progress.buffered} seconds
  Completion: ${((progress.position / progress.duration) * 100).toFixed(2)}%
`)
```

## PlaybackState

The PlaybackState represents the current state of the player.

```typescript
type PlaybackState = {
  state: State // Current playback state
  playWhenReady: boolean // Whether the player will play when ready
}
```

### Properties

| Property        | Type      | Description                                                |
| --------------- | --------- | ---------------------------------------------------------- |
| `state`         | `State`   | Current playback state, see [State](./constants#state)     |
| `playWhenReady` | `boolean` | Whether the player will automatically play when it's ready |

### Example

```javascript
// Get current playback state
const playbackState = TrackPlayer.getPlaybackState()
console.log(`
  Current state: ${playbackState.state}
  Will play when ready: ${playbackState.playWhenReady ? "Yes" : "No"}
`)
```

## Event Data

Different events provide different data structures:

### PlaybackState Event

```typescript
{
  type: Event.PlaybackState
  state: State
}
```

### PlaybackTrackChanged Event

```typescript
{
  type: Event.PlaybackTrackChanged
  prevTrack: number // Index of the previous track (-1 if none)
  nextTrack: number // Index of the new track (-1 if none)
}
```

### PlaybackProgressUpdated Event

```typescript
{
  type: Event.PlaybackProgressUpdated
  position: number // Current position in seconds
  duration: number // Total duration in seconds
  buffered: number // Buffered position in seconds
}
```

### PlaybackError Event

```typescript
{
  type: Event.PlaybackError
  error: string // Error message
}
```

### PlaybackMetadataReceived Event

```typescript
{
  type: Event.PlaybackMetadataReceived
  track: number // Index of the track that received metadata
  metadata: object // The new metadata object
}
```

## SetupOptions

Options used when setting up the player.

```typescript
type SetupOptions = {
  waitForBuffer?: boolean // Whether to wait for buffer before playing
  updateInterval?: number // Interval in seconds between progress updates
  useMediaSession?: boolean // Whether to enable MediaSession API integration
  capabilities?: Capability[] // List of player capabilities to enable
}
```

See more details in the [setupPlayer](./functions/lifecycle#setupplayer) function documentation.
