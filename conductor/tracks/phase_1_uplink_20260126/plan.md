# Implementation Plan: Phase 1 Uplink

## Phase 1: Foundation Setup
- [x] Task: Initialize project structure and install core dependencies (Zustand, WebSocket utils).
    - [ ] Sub-task: Install `zustand`, `clsx`, `tailwind-merge` (if using).
    - [ ] Sub-task: Configure `expo-router` basic layout (`_layout.tsx`).
- [~] Task: Create the global theme and design tokens (Colors, Typography) matching `product-guidelines.md`.
    - [ ] Sub-task: Create `src/constants/theme.ts`.
- [ ] Task: Conductor - User Manual Verification 'Foundation Setup' (Protocol in workflow.md)

## Phase 2: WebSocket Service
- [ ] Task: Implement the `WebSocketService` class with connection and event emitter logic.
    - [ ] Sub-task: Write unit tests for connection handling (mocked WS).
    - [ ] Sub-task: Implement `connect()`, `disconnect()`, and auto-reconnect logic.
- [ ] Task: Create the `useSessionStore` (Zustand) to manage connection state.
    - [ ] Sub-task: Write unit tests for store actions (`setConnected`, `setNowPlaying`).
    - [ ] Sub-task: Implement the store and hook it up to the WebSocket service.
- [ ] Task: Conductor - User Manual Verification 'WebSocket Service' (Protocol in workflow.md)

## Phase 3: UI Implementation
- [ ] Task: Build the "Now Playing" Banner Component.
    - [ ] Sub-task: Create `src/components/NowPlayingBanner.tsx` with `expo-blur`.
    - [ ] Sub-task: Style it according to Glassmorphism guidelines.
- [ ] Task: Integrate Banner into the Main Layout.
    - [ ] Sub-task: Add the banner to the persistent layout so it floats above all tabs.
    - [ ] Sub-task: Connect the banner to `useSessionStore` to display real data.
- [ ] Task: Conductor - User Manual Verification 'UI Implementation' (Protocol in workflow.md)
