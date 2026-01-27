# Product Definition: Social Vinyl Mobile

## Vision
Social Vinyl Mobile is the "Premium Satellite" to the Social Vinyl Java backend. It transforms the record-listening experience into a social event, acting as a high-performance remote control for the host and an interactive jukebox for guests.

## Target Personas
- **The Host:** The collection owner who controls playback, manages the bin, and toggles session modes from their phone.
- **The Guest:** Attendees who join a session via code/QR to explore the collection and contribute picks to the shared queue.
- **The Voyeur:** Public observers who enjoy a real-time, read-only view of the "Now Playing" state.

## Core Goals
- **Seamless Control:** Empower hosts to manage the entire ecosystem (playback, bins, sessions) with native responsiveness.
- **Social Engagement:** Create a frictionless "Jukebox" experience for guests to interact with the physical collection digitally.
- **Visual Immersion:** Deliver a high-fidelity "Glassmorphic" UI that serves as a beautiful digital companion to the analog ritual of vinyl.

## MVP Features
- **Real-time "Now Playing" Banner:** Instant visual synchronization with the turntable state via WebSockets.
- **Unified Bin Management:** Complete port of web functionality (add, reorder, veto) with native performance.
- **Offline Digging:** Local SQLite caching of the collection (metadata and artwork) to allow browsing even when the server is offline.
- **Hybrid Connection:** A "Satellite Link" architecture that prioritizes real-time server state while falling back to local cache for catalog browsing.

## Success Metrics
- **Native Performance:** 60fps animations for transitions and "Modern UI" effects.
- **Zero Latency:** WebSocket updates appearing on the phone within 100ms of the server broadcast.
- **Reliable Sync:** Successful handling of flaky mobile networks with automatic reconnection.
