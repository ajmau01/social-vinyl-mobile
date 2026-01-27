# Specification: Phase 1 Uplink

## Context
This is the inaugural track for the Social Vinyl Mobile app. The goal is to establish the "Satellite Link" with the Java Mothership. We are not building the full browsing experience yet; we are focusing strictly on the infrastructure (Navigation, State Management, WebSockets) and the "Now Playing" banner.

## Core Requirements
1.  **Navigation Shell:** Implement a tab-based navigation layout using `expo-router` with placeholders for Home, Search, and Profile.
2.  **WebSocket Service:** Create a robust service that connects to the Java backend, handles heartbeats/reconnection, and parses incoming JSON messages.
3.  **State Management:** Set up a `Zustand` store to hold the global session state (Now Playing, Connected Status).
4.  **Now Playing Banner:** A persistent UI component that displays the current track metadata (Artist, Title, Cover Art) received from the WebSocket.
5.  **Glassmorphic UI:** Apply the `expo-blur` and linear gradient styling to the main container and banner.

## API Contract
- **WebSocket URL:** `ws://<SERVER_IP>:9080/listening-bin`
- **Inbound Events:**
    - `WELCOME`: Initial connection handshake.
    - `NOW_PLAYING`: Updates the current track info.
    - `SESSION_ENDED`: Clears the state.

## Design Specs
- **Background:** Deep Night (Hex: `#0a0a12`)
- **Banner:** Frosted Glass overlay (Blur Intensity: 50) anchored to the bottom of the screen (above the tab bar).
- **Typography:** Sans-serif, White text.

## Acceptance Criteria
- [ ] App launches and connects to the local Java server.
- [ ] "Connected" indicator appears in the UI.
- [ ] When a record is played on the Java server (simulated or real), the mobile app updates the banner instantly.
- [ ] If the server goes down, the app shows a "Reconnecting..." state.
