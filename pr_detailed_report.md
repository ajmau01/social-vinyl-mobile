# Pull Request: Real-time Listening Bin Sync (Issue #125, #126)

This PR implements the core collaborative foundation for Milestone 13, transforming the mobile app into a real-time "Social Vinyl" remote control.

## 🚀 Deep Implementation Detail

The work spans two repositories and establishes a bi-directional WebSocket protocol that allows multiple clients (Host & Guests) to interact with a shared Listening Bin.

### 1. Unified WebSocket Protocol (Mobile & Backend)
- **Bi-directional Messaging**: Added `CLIENT_ACTION` type to `WebSocketService` allowing clients to send structured commands rather than just receiving state.
- **Protocol Handshake**: Implemented a handshake mechanism (`PROTOCOL_HANDSHAKE` / `PROTOCOL_ACK`) to negotiate capabilities (e.g., `bin_sync`, `session_mgmt`).
- **UUID Correlation**: Integrated a UUID utility for `actionId` tagging, enabling precise acknowledgment of actions (`ACTION_ACK`).

### 2. Listening Bin Synchronization Service
- **`ListeningBinSyncService.ts`**: A new service acting as the "Brain" for bin operations. It manages `addAlbum`, `removeAlbum`, and `reorderAlbums` via WebSocket actions.
- **Optimistic State Management**: The `useListeningBinStore` now supports immediate UI updates. When an LP is added, it appears instantly in the UI with a "Syncing..." status. If the server fails to acknowledge, the state is gracefully rolled back.
- **Server Authority**: Removed local persistence from the Listening Bin store. The "Source of Truth" is now strictly the server, preventing "junk" or stale data from surviving app restarts.

### 3. Collaborative UI Layer
- **Interactive Bin**: Guests and Hosts share the same view.
- **`BinItem.tsx`**: Redesigned to include drag handles and better metadata display.
- **Drag-and-Drop Reordering**: Integrated `react-native-draggable-flatlist` to allow real-time queue management.

---

## 🧪 Testing Challenges & Critical Fixes

Testing this multi-client flow revealed several "edge of the abyss" bugs that were critical for stability:

| Challenge | Root Cause | Fix Implementation |
| :--- | :--- | :--- |
| **Empty Bin on Reload** | `SyncService` was defined but never actually initialized in the app lifecycle. | Added `listeningBinSyncService.init()` to the `RootLayout` (`_layout.tsx`) so it starts listening for updates immediately on launch. |
| **"Ghost" Reconnects** | The server validated re-connecting sessions but never triggered an initial data push. | Patched `AuthenticateHandler.java` on the backend to immediately broadcast the `state` (albums) the moment a session is restored. |
| **Duplicate Key Crashes** | If the same album was added twice, the list component crashed due to duplicate `releaseId` keys. | Implemented a robust `keyExtractor` in `bin.tsx` that generates a `frontendId` (combining `releaseId` + `timestamp` + `index`) to ensure 100% uniqueness. |
| **Missing LP Art** | Property name mismatch between repos (`coverImage` on backend vs `thumb_url` on mobile). | Added property mapping in `ListeningBinSyncService.ts` and updated TypeScript interfaces in `types/index.ts` to bridge the gap. |

---

## 📍 Current Position & Nomenclature

### Host/Guest Dynamics
This PR marks a major milestone: **Hosts can now start a session, and as Guests add Albums (LPs) to the bin, the Host's screen updates in real-time.** 
- The Host has "Admin" powers (delete any LP).
- Guests can delete LPs they personally added.
- Everyone sees the same synchronized order.

### Nomenclature Alignment
Following the user's direction, we have aligned the nomenclature across the project:
- **Tracks vs LPs**: We are dealing with **Albums/LPs** (collections of songs). The sync logic and UI now consistently refer to adding "Albums" or "LPs" to the bin, rather than "tracks" (which are individual songs on a record).

---

## ✅ Verification Status
- [x] **Store Tests**: `useListeningBinStore.test.ts` verified optimistic adds/removes.
- [x] **Service Tests**: `ListeningBinSyncService.test.ts` verified WebSocket action routing.
- [x] **End-to-End Simulation**: Successfully verified with `simulate-client.cjs` where a simulated guest added an LP to a live session and the mobile client updated instantly.
- [x] **Manual Smoke Test**: Reloaded app, joined session `WHEPL`, and verified immediate population with correct art.

**Ready for Review.**
