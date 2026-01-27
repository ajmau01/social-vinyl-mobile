# Specification: Phase 2 Voyeur (Read-Only)

## Context
Following the successful "Uplink" (Phase 1), we now implement the "Voyeur" capability. This transforms the app from a simple "Now Playing" display into a searchable, offline-first catalog of the host's collection.

## Core Requirements
1.  **Local Database:** Implement `expo-sqlite` to store the collection (Releases, Artists).
2.  **Sync Engine:** A robust synchronization service that fetches the collection from the Mothership (Java Backend) without blocking the UI.
    *   Must handle pagination.
    *   Must be resilient to interruptions (app backgrounding).
3.  **Collection UI:** A high-performance "Infinite Scroll" list of records.
    *   Search/Filter by Artist or Title.
    *   Fast image loading (caching).

## API Contract
-   **Endpoint:** `GET /api/v1/collection` (Pagination: `?page=X&size=Y`).
-   **Data Shape:**
    ```json
    {
      "items": [
        { "id": 123, "title": "Thriller", "artist": "Michael Jackson", "thumb": "url..." }
      ],
      "meta": { "total": 3000, "page": 1 }
    }
    ```

## Acceptance Criteria
- [ ] App initializes a SQLite database on first launch.
- [ ] "Collection" tab displays a list of records (initially empty or cached).
- [ ] User can manually trigger a "Sync".
- [ ] Sync progress is visible (e.g., "Syncing: 50%").
- [ ] App works offline (browsing previously synced items).
