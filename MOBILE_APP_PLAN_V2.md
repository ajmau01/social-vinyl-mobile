# Social Vinyl - Mobile App Plan V2
> **Strategic Shift**: Moving from "Personal Offline Database" to "Connected Party Companion".

**Status**:  APPROVED
**Date**: 2026-01-26
**Reference**: [Old Plan (V1)](./MOBILE_APP_PLAN.md) | [Social Vinyl Spec](./SOCIAL_VINYL_SPEC.md)

---

## 1. Executive Summary
The V1 plan (Dec 2025) focused on a self-contained, offline-first app that replaced the server.
**Plan V2 (Jan 2026)** acknowledges that the **Java Backend is the "Brain"** of the Social Vinyl ecosystem. The mobile app will not replace the server; it will extend it. The app effectively becomes a "Remote Control" for the Host and a "Magic Window" for Guests.

**The Core Pivot:**
*   **Old Thought:** "The phone is the database."
*   **New Reality:** "The phone is the interface; the Room is the database."

---

## 2. Hybrid Architecture (Satellite Model)

We will use a **Satellite Repo** strategy. The mobile app will exist in a separate codebase but relies 100% on the running Java Backend for state and logic.

### 2.1 The "Mothership" (Existing Repo)
*   **Role**: The Source of Truth.
*   **Responsibilities**:
    *   Maintains the Discogs Collection Database (H2/Derby).
    *   Manages "Sessions" (Household vs. Party).
    *   Broadcasts "Now Playing" state via WebSockets.
    *   Handles Discogs API rate limiting and auth.
    *   **Action Required**: Expose new JSON API endpoints (e.g., `/api/v1/collection`) to serve the mobile app more efficiently than HTML scraping.

### 2.2 The "Satellite" (New Mobile Repo)
*   **Technology**: React Native (Expo) + TypeScript.
*   **Role**: The Premium Interface.
*   **Responsibilities**:
    *   **Presentation**: Rendering the "Glassmorphism" UI with native performance (60fps).
    *   **Real-Time Sync**: Connects to the Mothership's WebSocket to receive "Now Playing" updates.
    *   **Local Caching**: Stores album art and metadata locally (SQL) for instant loading, but *checks in with the Mothership* for state (Who is playing? What's in the bin?).

---

## 3. Core Features by Persona

The Mobile App adapts its interface based on *who* is using it, driven by the same logic as the Web App.

### A. The Host (You) - "The Remote Control"
*   **Goal**: Control the room from the couch.
*   **Exclusive Features**:
    *   **Playback Control**: "Play this Record" (Updates the Now Playing banner for everyone).
    *   **Bin Management**: Reorder tracks, Veto guest picks, Clear Bin.
    *   **Session Switching**: Toggle between "Household" and "Party" modes.
    *   **Scan & Add**: Use the phone camera to scan a barcode and add a new record to the collection (New V2 feature).

### B. The Guest (at the Party) - "The Jukebox"
*   **Goal**: Contribute to the vibe.
*   **Exclusive Features**:
    *   **Join via Code**: Enter a 4-digit code (or scan QR) to join the session.
    *   **Add to Bin**: Browse the collection and queue up tracks.
    *   **Personalization**: "Added by [Name]" tag attached to their picks.

### C. The Voyeur (Public) - "Digital Digging"
*   **Goal**: Passive observation.
*   **Features**:
    *   **Read-Only View**: Browse the collection.
    *   **Live Banner**: See exactly what is spinning in real-time.
    *   **No Controls**: Cannot modify the bin or state.

---

## 4. Technical Strategy

### 4.1 State Management (The "Hybrid" Approach)
We need the speed of local data with the accuracy of server data.
*   **Static Data (The Records)**: Cached on the Phone (SQLite).
    *   Album Titles, Artists, Cover Art URLs rarely change.
    *   *Sync Strategy*: "Lazy Sync" on app launch.
*   **Dynamic Data (The Party)**: Live from Server (WebSocket/Rest).
    *   "What's in the bin?"
    *   "Who is active?"
    *   *Sync Strategy*: Real-time WebSocket subscription.

### 4.2 The "Modern" UI Port
We will port the **aesthetic** of your current `modern.css` but rebuild the **implementation**.
*   **Glassmorphism**: Use `expo-blur` or `react-native-blur` for the glassy overlays.
*   **Animations**: `react-native-reanimated` for smooth vinyl spinning and drawer slides.
*   **Components**: Build a "Design System" in React Native that mirrors your CSS variables (Neon Purple, Deep Night background).

---

## 5. Performance & Scalability (The 3,000 Record Problem)

### 5.1 The Bottleneck
Fetching larger collections (e.g., 3,000 records = 30+ API pages) is slow and prone to timeouts/rate limits.
*   **Mobile-Only (V1) Failure Mode**: iOS/Android kill background tasks after ~30 seconds. If the user switches apps during a 5-minute sync, the process dies or hangs.
*   **SaaS Backend (V2) Solution**: The Server runs 24/7. It is perfect for long-running jobs.

### 5.2 Async Ingestion Strategy ("Slow & Steady")
1.  **Impatient UI**: The Mobile App requests a sync. The Server immediately says "On it!" (202 Accepted) and releases the phone.
2.  **Background Job**: The Server spins up a `CollectionIngestionTask`.
    *   It fetches Page 1. Sleeps 1.5s. Fetches Page 2. Sleeps 1.5s. (Respects Discogs 60/min limit).
    *   It updates the DB incrementally.
3.  **Real-Time Feedback**: The Server sends WebSocket progress events (`sync: 120/3000 items`) to the phone so the user sees a progress bar, but the phone does *zero* work.

### 5.3 Smart Deltas
To minimize API usage (6-hour rule):
*   **Logic**: Discogs allows sorting by `date_added`.
*   **Optimization**: 
    1.  Fetch Page 1 (Newest items).
    2.  Check: "Do I already have this Release ID in my DB?"
    3.  **Yes**: STOP. No need to fetch Pages 2-30.
    4.  **No**: Continue fetching until we find a known ID.
*   **Result**: 99% of syncs cost only **1 API Call**, regardless of collection size.

---

## 6. Engineering Standards: Lessons from the Web Refactor

We will explicitly apply the architectural lessons learned from the `modern-ui` restructure to the mobile codebase.

### 6.1 Strict Separation of Concerns (The "Message Router" Pattern)
**Lesson**: Mixing UI logic with WebSocket parsing (as seen in the legacy `listening-bin.js`) leads to fragile "God Classes."
**Mobile Application**:
*   **Network Layer**: A dedicated `WebSocketService` that *only* handles connection, reconnection (heartbeat), and JSON parsing. It emits raw events.
*   **State Layer**: `Zustand` or `Redux Toolkit` stores that subscribe to these events and update the global state "atomically."
*   **UI Layer**: React Components that *only* read data from the Store. They never touch the WebSocket directly.

### 6.2 Atomic State Updates
**Lesson**: Updating the UI piecemeal leads to sync errors (e.g., the "Hanging Verify Button" issue).
**Mobile Application**:
*   **Pattern**: Single Source of Truth. When a WebSocket message `BIN_UPDATED` arrives, it replaces the *entire* local bin state. We do not attempt to "patch" the list locally.
*   **Benefit**: Eliminates "drift" between the server and the phone.

### 6.3 Feature Isolation (Modular Architecture)
**Lesson**: Code tangling makes it hard to add features (e.g., separating "Host" features from "Guest" features).
**Mobile Application**:
*   **Structure**: Group code by **Feature**, not Type.
    *   `src/features/auth` (Login, Token Storage)
    *   `src/features/player` (Now Playing, Playback Controls)
    *   `src/features/collection` (Grid, Search, Filters)
*   **Constraint**: Features should be self-contained modules. The `Collection` module should not know about the `Player` module; they communicate via the Global Store.

### 6.4 Defensive Networking
**Lesson**: Mobile networks are flaky. The "Session Expired" loop caused significant issues in the web app.
**Mobile Application**:
*   **Offline-First UI**: The app must render the *last known state* immediately (cached in SQLite), then show a "Connecting..." indicator. It must never show a blank screen while waiting for the server.
*   **Smart Reconnection**: Implement "Exponential Backoff" for WebSocket reconnection strategies to avoid hammering the server when the user walks out of WiFi range.

---

## 7. Migration Steps (The "Transformation")

We don't "convert" code; we "re-implement" specs.

| Phase | Goal | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 1: connection** | Establish the Uplink | New React Native App; Connects to `ws://server/listening-bin`; Displays "Now Playing". |
| **Phase 2: READ-ONLY** | The "Voyeur" App | Sync Collection JSON from Server; Store in SQLite; Browse/Search UI. |
| **Phase 3: WRITE** | The "Guest" App | "Add to Bin" button; Logic sends specific WebSocket messages (`add-release`) to server. |
| **Phase 4: CONTROL** | The "Host" App | Admin Login screen; "Play", "Veto", "Clear" actions wired to API. |

---

## 8. Strategic Validation (Architectural Analogs)

To de-risk the design, we have benchmarked this architecture against established industry patterns. We are not inventing a new model; we are adopting a proven "Real-Time Control Plane" pattern.

### 8.1 The "Sonos" Model (Control Plane)
*   **Concept**: The music plays in the room, not on the phone. The phone is a remote.
*   **Relevance to Us**: Matches our **Host Persona**. The phone tells the Java Server to "Play Record X," and the server broadcasts that state to the room speakers and all other connected phones.

### 8.2 The "Discord" Model (Real-Time Social)
*   **Concept**: A shared channel where state (messages) is pushed to clients instantly via WebSockets.
*   **Relevance to Us**: Matches our **Guest Persona**. The "Listening Bin" is effectively a Chat Room. Guests see items appear instantly without refreshing.

### 8.3 The "Netflix" Model (Catalog Browsing)
*   **Concept**: A massive catalog (3,000+ items) that feels instant because metadata is cached, but heavy assets are streamed on demand.
*   **Relevance to Us**: Matches our **Voyeur Persona**. We sync the metadata (JSON) to the phone for fast scrolling, but we leave the heavy lifting (Discogs API fetching) to the server background jobs.

---

## 9. Phase 0: Environment Setup (Actionable)

Before initializing the project, ensure your development machine is ready.

### 9.1 Cross-Platform Strategy
We are using **Expo** (React Native).
*   **Strategy:** Single Codebase (TypeScript).
*   **Output:** Generates *both* an `.apk` (Android) and an `.ipa` (iOS) from the exact same business logic.
*   **Mac Advantage:** A Mac is the *universal* builder. It can build Android apps (via Android Studio) AND iOS apps (via Xcode). A Windows machine cannot build iOS apps.

### 9.2 Android Setup (For Your Personal Use)
Since your daily driver is Android, you have two options:
1.  **The "Lite" Path (Recommended):**
    *   Install **Expo Go** from the Google Play Store on your Android phone.
    *   Connect phone to same WiFi as Mac.
    *   Run `npx expo start`. Scan QR with Android Camera.
    *   *Zero setup on Mac.*
2.  **The Emulator Path:**
    *   Install **Android Studio** (Google's IDE).
    *   Open "Virtual Device Manager" inside it.
    *   Create a "Pixel 6" virtual device.
    *   Run `npx expo start --android`.

### 9.3 iOS Setup (For Guests)
To support iPhone users:
1.  **Simulator Path:** Follow the Xcode steps below to run a virtual iPhone on your Mac screen.
    ```bash
    brew install watchman
    # Open "Simulator" app on Mac
    ```
2.  **Physical Path:** Install **Expo Go** from App Store on an iPhone. Scan the same QR code.

---

## 10. Appendix: Quick Start Guide

**Ready to start?** Use this guide to initialize the project in your next session.

### Prerequisite: Directory Structure
We recommend creating the mobile app as a *sibling* to your current repo.
```
projects/
├── recordCollecctionRepo/
│   └── recordcollection/   <-- The "Mothership" (Java Backend)
└── social-vinyl-mobile/    <-- The "Satellite" (React Native)
```

### Step 1: Initialize the App
Execute these commands to bootstrap the TypeScript/Expo project:
```bash
# Navigate to projects root
cd ~/projects

# Create the new repo (Satellite)
npx create-expo-app@latest social-vinyl-mobile --template blank-typescript

# Enter the directory
cd social-vinyl-mobile

# Install Key Dependencies (Navigation, Blur, SVG, Networking)
npx expo install expo-router react-safe-area-context react-native-screens
npx expo install expo-blur expo-haptics expo-linear-gradient
npx expo install react-native-svg
```

### Step 2: Verify the Uplink
Ensure the Mothership is running (`http://localhost:9080`), then start the satellite:
```bash
npx expo start
```
Scan the QR code with your phone (or press `i` for iOS Simulator).
