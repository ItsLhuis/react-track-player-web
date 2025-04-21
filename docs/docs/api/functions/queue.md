---
sidebar_position: 3
id: queue
title: Queue
---

# Queue

These functions allow you to manage the playback queue - adding, removing, and rearranging tracks,
as well as retrieving information about the queue and current track.

## Adding Tracks

### add

Adds one or more tracks to the queue.

```javascript
await TrackPlayer.add(tracks: Track | Track[], insertBeforeIndex?: number): Promise<void>
```

#### Parameters

| Parameter         | Type               | Required | Description                                                                                        |
| ----------------- | ------------------ | -------- | -------------------------------------------------------------------------------------------------- |
| tracks            | `Track \| Track[]` | Yes      | A single track or array of tracks to add                                                           |
| insertBeforeIndex | `number`           | No       | Optional index to insert tracks before (if not provided, tracks are added to the end of the queue) |

#### Example

```javascript
// Add a single track to the end of the queue
await TrackPlayer.add({
  url: "https://example.com/song.mp3",
  title: "Song Title",
  artist: "Artist Name",
  artwork: "https://example.com/album-art.jpg"
})

// Add multiple tracks to the end of the queue
await TrackPlayer.add([
  {
    url: "https://example.com/song1.mp3",
    title: "First Song",
    artist: "Artist Name"
  },
  {
    url: "https://example.com/song2.mp3",
    title: "Second Song",
    artist: "Artist Name"
  }
])

// Insert tracks at a specific position (before track at index 2)
await TrackPlayer.add(
  [
    {
      url: "https://example.com/song3.mp3",
      title: "Insert Before",
      artist: "Artist Name"
    }
  ],
  2
)
```

## Modifying the Queue

### remove

Removes one or more tracks from the queue by index.

```javascript
await TrackPlayer.remove(indices: number | number[]): Promise<void>
```

#### Parameters

| Parameter | Type                 | Required | Description                         |
| --------- | -------------------- | -------- | ----------------------------------- |
| indices   | `number \| number[]` | Yes      | Index or array of indices to remove |

#### Example

```javascript
// Remove a single track at index 3
await TrackPlayer.remove(3)

// Remove multiple tracks
await TrackPlayer.remove([0, 2, 5])
```

### move

Moves a track from one position to another in the queue.

```javascript
await TrackPlayer.move(fromIndex: number, toIndex: number): Promise<void>
```

#### Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| fromIndex | `number` | Yes      | Index of the track to move      |
| toIndex   | `number` | Yes      | Destination index for the track |

#### Example

```javascript
// Move the track at index 2 to position 5
await TrackPlayer.move(2, 5)
```

## Queue Information

### getQueue

Gets the entire queue of tracks.

```javascript
TrackPlayer.getQueue(): Track[]
```

#### Return Value

Returns an array of Track objects representing the current queue.

#### Example

```javascript
const queue = TrackPlayer.getQueue()
console.log(`Queue has ${queue.length} tracks`)

// List all tracks in the queue
queue.forEach((track, index) => {
  console.log(`${index + 1}. ${track.title} by ${track.artist || "Unknown"}`)
})
```

### getTrack

Gets a track from the queue by index.

```javascript
TrackPlayer.getTrack(index: number): Track | undefined
```

#### Parameters

| Parameter | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| index     | `number` | Yes      | Index of the track to retrieve |

#### Return Value

Returns the Track object if found, or undefined if the index is out of bounds.

#### Example

```javascript
const trackAtIndex2 = TrackPlayer.getTrack(2);
if (trackAtIndex2) {
  console
```
