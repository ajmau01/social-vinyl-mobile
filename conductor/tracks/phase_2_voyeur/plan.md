# Implementation Plan: Phase 2 Voyeur

## Phase 2.1: Database layer
- [ ] **Task:** Initialize `expo-sqlite` and define the schema.
    - [ ] Install `expo-sqlite`.
    - [ ] Create `src/services/DatabaseService.ts`.
    - [ ] Define tables: `releases` (id, title, artist, thumb_url, added_at).

## Phase 2.2: Sync Engine
- [ ] **Task:** Implement the `CollectionSyncService`.
    - [ ] Create `src/services/CollectionSyncService.ts`.
    - [ ] Implement `fetchPage()` logic.
    - [ ] Implement "Smart Sync" (stop when matching existing ID).

## Phase 2.3: UI Implementation
- [ ] **Task:** Build the Collection Screen.
    - [ ] Create `src/app/(tabs)/collection.tsx`.
    - [ ] Implement `FlashList` (Shopify) or optimized `FlatList` for performance.
    - [ ] specific Search Bar component (Glassmorphism).

## Phase 2.4: Integration & Verification
- [ ] **Task:** Connect Sync Service to UI.
    - [ ] Add "Pull to Refresh" to trigger sync.
    - [ ] Verify offline capability.
