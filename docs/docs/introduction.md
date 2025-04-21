---
sidebar_position: 1
id: introduction
title: Introduction
slug: /
---

# Introduction

[![downloads](https://img.shields.io/npm/dw/react-track-player-web)](https://www.npmjs.com/package/react-track-player-web)
[![npm](https://img.shields.io/npm/v/react-track-player-web)](https://www.npmjs.com/package/react-track-player-web)
[![license](https://img.shields.io/npm/l/react-track-player-web)](https://github.com/ItsLhuis/react-track-player-web/blob/main/LICENSE)

**React Track Player Web** is a powerful audio player library for React applications. It provides a
simple yet comprehensive way to play audio tracks in your web application with full control over
playback and queue management.

## Features

- 🎵 **Full audio playback control** (play, pause, skip, seek)
- 📋 **Queue management** for handling multiple tracks
- 🔁 **Repeat modes** (Off, Track, Queue)
- 🎚️ **Volume and playback rate control**
- 📱 **MediaSession API integration** for media controls in browsers
- 🔄 **Event system** for state changes and updates
- 🌊 **Buffer state tracking** for improved user experience
- 📊 **Playback progress tracking**
- 🔧 **Configurable capabilities** to match your application needs

## Basic Example

```javascript
import TrackPlayer, { State, Event } from "react-track-player-web"

// Step 1: Set up the player when your app initializes
useEffect(() => {
  const setupPlayer = async () => {
    await TrackPlayer.setupPlayer({
      updateInterval: 0.5, // Update progress every 0.5 second
      useMediaSession: true // Enable media controls in browser
    })

    // Add tracks to the queue
    await TrackPlayer.add([
      {
        url: "https://example.com/track1.mp3",
        title: "Track 1",
        artist: "Artist 1",
        artwork: "https://example.com/artwork1.jpg"
      },
      {
        url: "https://example.com/track2.mp3",
        title: "Track 2",
        artist: "Artist 2",
        artwork: "https://example.com/artwork2.jpg"
      }
    ])
  }

  setupPlayer()

  // Cleanup when the component unmounts
  return () => {
    TrackPlayer.destroy()
  }
}, [])

// Step 2: Control playback with simple functions
const playPauseTrack = async () => {
  const state = TrackPlayer.getPlaybackState()
  if (state === State.Playing) {
    await TrackPlayer.pause()
  } else {
    await TrackPlayer.play()
  }
}

// Step 3: Listen for events
useEffect(() => {
  const handlePlaybackStateChange = (data) => {
    console.log("Playback state changed to:", data.state)
  }

  TrackPlayer.addEventListener(Event.PlaybackState, handlePlaybackStateChange)

  return () => {
    TrackPlayer.removeEventListener(Event.PlaybackState, handlePlaybackStateChange)
  }
}, [])
```

## Why React Track Player Web?

- **Simple API**: Designed with ease of use in mind
- **Complete Control**: Full control over the audio playback experience
- **React Integration**: Custom hooks for seamless integration with React components
- **Media Controls**: Support for browser and system media controls
- **Comprehensive Documentation**: Everything you need to get started and master the library

Ready to add audio playback to your React application? Follow our [Installation](/docs/installation) guide
to get started!
