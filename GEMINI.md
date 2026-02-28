# Gemini Context - Social Vinyl Mobile App

> **Project**: Social Vinyl Mobile (React Native)
> **Your Role**: Development & Implementation
> **Current Assignment**: Issues #136 + #138 + #139 — Join Session Refactor
> **Last Assignment**: Issues #148 + #149 ✅ (PR #174 merged)
> **Status**: Ready to implement
> **Last Updated**: 2026-02-27

---

## 🎯 Current Assignment: Issues #136, #138, #139 — Join Session Cleanup

**One PR for all three issues.** Changes are tightly coupled.

Read the full implementation plan before starting:
- `GEMINI-HANDOFF.md` in this repo root — **complete implementation guide with exact code snippets** ⭐
- GitHub [#136](https://github.com/ajmau01/social-vinyl-mobile/issues/136) — fragile joinSession pattern
- GitHub [#138](https://github.com/ajmau01/social-vinyl-mobile/issues/138) — polling loop → event-driven
- GitHub [#139](https://github.com/ajmau01/social-vinyl-mobile/issues/139) — sessionId type normalization

### What You're Changing

**#139** — Normalize `sessionId` to `string` at the WebSocket message boundary. Update types in `useSessionStore` and `useWebSocket` from `string | number | null` → `string | null`. Remove redundant `.toString()` coercions.

**#138** — Replace the 100ms polling loop in `joinSession()` with a new `waitForConnection()` private method that subscribes to the Zustand store and resolves event-driven on `connectionState === 'connected'`.

**#136** — Remove `dynamic require('@/store/useSessionStore')` hack from inside the polling loop and the `PROTOCOL_ACK` handler. Replace with a static top-level import.

### Files to Change (3 files only)

1. `src/store/useSessionStore.ts` — sessionId type + remove `.toString()` coercions
2. `src/hooks/useWebSocket.ts` — sessionId type + `String(sessionId)` normalization
3. `src/services/WebSocketService.ts` — static import, `waitForConnection()`, replace polling

### Implementation Order

1. Step 1: Fix sessionId type in `useSessionStore.ts` (4 sub-changes)
2. Step 2: Normalize sessionId in `useWebSocket.ts` (3 sub-changes)
3. Step 3: Replace polling in `WebSocketService.ts` (4 sub-changes)
4. Step 4: Verify — `npx tsc --noEmit` + `npm test`
5. Step 5: Commit + open PR

See `GEMINI-HANDOFF.md` for exact before/after code for every change.

---

## ✅ v1.0 Party Core Progress

**Group 1 — Foundation**: ALL COMPLETE ✅
- #141 Terminology Pass (PR #155)
- #142 Cold Start Screen Redesign (PR #160)
- #143 Account & Identity Model (PR #163)

**Group 2 — Host Experience**: ALL COMPLETE ✅
- #144 Host Home Screen ✅ (PR #166 merged Feb 23)
- #145 Session Mode Selector ✅ (PR #166 merged Feb 23)
- #146 Active Session Command View ✅ (PR #164 merged Feb 23)
- #154 History & Setlist View ✅ (closed Feb 23)
- #168 Leave Session ✅ (closed Feb 23)

**Group 3 — Guest Experience** ← YOU ARE HERE:
- [x] **#147** Guest Onboarding ✅ (PR #172 merged Feb 26)
- [ ] **#148** Guest Collection View ← START HERE
- [ ] **#149** Bookmark-to-Buy (same PR as #148)

---

## Standing Coding Conventions (Non-Negotiable)

### WebSocket Actions in Effects
**NEVER** fire WebSocket actions in `useEffect([], [])`. Gate on `isConnected` with a `hasLoaded` ref:
```tsx
const hasLoaded = useRef(false);
const { isConnected } = useWebSocket();

useEffect(() => {
    if (isConnected && !hasLoaded.current) {
        hasLoaded.current = true;
        loadData();
    }
}, [isConnected]);
```

### Voyeur Guard
When gating UI on session state, apply the same condition to both trigger and mounted component:
```tsx
{sessionId && sessionRole !== 'voyeur' && <InfoButton />}
{sessionId && sessionRole !== 'voyeur' && <InfoModal />}
```

### Zustand Store Selectors
Use `useShallow` for any component that reads multiple store fields:
```tsx
const { fieldA, fieldB } = useStore(useShallow(state => ({
    fieldA: state.fieldA,
    fieldB: state.fieldB,
})));
```

### Imports
- Icons: `import { Ionicons } from '@expo/vector-icons';`
- Theme: `import { THEME } from '@/constants/theme';`
- Copy: `import { COPY } from '@/constants/copy';`
- Store: `import { useSessionStore } from '@/store/useSessionStore';`
- Services: `import { useServices } from '@/contexts/ServiceContext';`

---

## Workflow Rules (Non-Negotiable)

- **NEVER commit directly to `main`**
- **ALWAYS work in the feature branch**: `refactor/136-138-139-join-session-cleanup`
- **ALWAYS create a PR** — never merge locally
- **NEVER merge a PR** — that's the user's job
- **ALWAYS use** "Andrew Mauer" (`ajmauer@gmail.com`) for commits

## After Completing Work

1. `npx tsc --noEmit` — verify no TypeScript errors
2. `npm test` — all tests pass
3. Create implementation note: `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Implementation-Notes/2026-02-27-issues-136-138-139-complete.md`
4. Update `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Current-Sprint.md` — mark #136, #138, #139 in progress
5. Create PR against `main` with title: `refactor: event-driven join session + sessionId type normalization (#136, #138, #139)`

---

## Project Structure

```
app/
├── _layout.tsx            ← register want-list route (step 14)
├── want-list.tsx          ← NEW want list screen (step 8)
└── (tabs)/
    └── collection.tsx     ← modify: guest defaults, bin bar, want list (step 13)

src/
├── components/
│   ├── BinSummaryBar.tsx          ← NEW (step 6)
│   ├── CollectionHeader.tsx       ← modify: hideViewModes, onWantListPress (step 10)
│   ├── CollectionSectionView.tsx  ← modify: thread guest props (step 11)
│   ├── ReleaseCard.tsx            ← modify: guestMode, isWanted, onWantList (step 9)
│   ├── ReleaseDetailsModal.tsx    ← modify: pick validation toasts (step 12)
│   ├── SessionDrawer.tsx          ← modify: want list menu entry (step 15)
│   ├── ToastNotification.tsx      ← NEW (step 5)
│   └── WantListItem.tsx           ← NEW (step 7)
├── hooks/
│   └── useGuestCollectionContext.ts  ← NEW (step 3)
├── services/
│   └── DatabaseService.ts         ← modify: want_list table + 4 methods (step 2)
├── types/
│   └── index.ts                   ← add WantListItem interface (step 1)
└── utils/
    └── wantList.ts                ← NEW (step 4)
```

---

## Key Existing Patterns to Follow

### ServiceContext / useServices()
```tsx
const { sessionService, webSocketService } = useServices();
```

### Session Store
```tsx
const { sessionRole, sessionId, sessionName, hostUsername } = useSessionStore(
    useShallow(state => ({ ... }))
);
```

### DatabaseService — existing pattern for `getSessionSetlist`
The `want_list` table follows the same schema and method pattern as `session_plays`. Look at how `getSessionSetlist()` is implemented and follow the same style for `getWantList()`.

### Migration Guard Pattern
```typescript
const tableInfo = await this.db.getAllAsync<{ name: string }>("PRAGMA table_info(table_name)");
if (tableInfo.length === 0) {
    // run migration
}
```

---

## Quick Commands

```bash
npm test                    # Run all tests
npx tsc --noEmit           # Type check
npx eslint src/            # Lint
npm test -- WantList       # Test specific file
```

---

## Vault

**Location**: `~/ObsidianVaults/SocialVinyl-Dev/`

**Key files for this task**:
- `Projects/Mobile-App/GEMINI-HANDOFF.md` — full implementation guide ⭐
- `_Dashboard/Current-Sprint.md` — sprint status

---

## Communication Style

- Bulleted, concise prose — no filler
- Full production-ready code — do NOT truncate
- Technical comments only where logic is non-obvious
- Flag blockers in vault, not verbally

---

*Repo*: https://github.com/ajmau01/social-vinyl-mobile
*Milestone*: https://github.com/ajmau01/social-vinyl-mobile/milestone/15
