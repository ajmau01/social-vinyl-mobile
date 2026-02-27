# Gemini Context - Social Vinyl Mobile App

> **Project**: Social Vinyl Mobile (React Native)
> **Your Role**: Development & Implementation
> **Current Assignment**: STANDBY — v1.0 Party Core COMPLETE
> **Last Assignment**: Issues #148 + #149 ✅ (PR #174 merged)
> **Status**: Awaiting next sprint planning from Claude
> **Last Updated**: 2026-02-27

---

## 🎯 Current Assignment: Issues #148 + #149 — Guest Collection Experience

**One PR for both issues.** See the rationale in the handoff doc.

Read the full implementation plan before starting:
- `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/GEMINI-HANDOFF.md` — **complete implementation guide** ⭐
- GitHub [#148](https://github.com/ajmau01/social-vinyl-mobile/issues/148) — Guest Collection View spec
- GitHub [#149](https://github.com/ajmau01/social-vinyl-mobile/issues/149) — Bookmark-to-Buy spec

### What You're Building

**#148 — Guest Collection View**: When a guest opens collection during an active session:
1. Default view mode is **N&N** (`'new'`) instead of Genre
2. **'Spin' chip hidden** — host-only, irrelevant for guests
3. **Bin summary bar** above collection: "3 in the bin · Keep browsing" → taps to Bin tab
4. **Pick validation toasts** in `ReleaseDetailsModal` at add-to-bin time (non-blocking nudges)
5. **Guest long-press disabled** — no Notable/Saved actions for guests

**#149 — Bookmark-to-Buy (Guest Want List)**:
1. `want_list` SQLite table — local-first, no backend sync
2. `pricetag-outline` icon on ReleaseCard in guest mode (bottom-right, vs host bookmark top-left)
3. Toast on add/remove
4. **Want list screen** (`app/want-list.tsx`): grouped by party, album art, context
5. **Share** via React Native built-in `Share.share()` — no new package needed
6. Accessible from **CollectionHeader** (pricetag icon) and **SessionDrawer**

### Implementation Order (15 Steps)

Follow the handoff doc exactly. Summary:
1. Types (`WantListItem` interface)
2. DatabaseService (`want_list` table + 4 CRUD methods)
3. `useGuestCollectionContext` hook
4. `wantList.ts` utils
5. `ToastNotification.tsx` component
6. `BinSummaryBar.tsx` component
7. `WantListItem.tsx` component
8. `app/want-list.tsx` screen
9. Modify `ReleaseCard.tsx`
10. Modify `CollectionHeader.tsx`
11. Modify `CollectionSectionView.tsx`
12. Modify `ReleaseDetailsModal.tsx`
13. Modify `app/(tabs)/collection.tsx`
14. Register route in `app/_layout.tsx`
15. Add want list entry to `SessionDrawer.tsx`

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
- **ALWAYS work in the feature branch**: `feature/148-149-guest-experience`
- **ALWAYS create a PR** — never merge locally
- **NEVER merge a PR** — that's the user's job
- **ALWAYS use** "Andrew Mauer" (`ajmauer@gmail.com`) for commits

## After Completing Work

1. `npx tsc --noEmit` — verify no TypeScript errors
2. `npm test` — all tests pass
3. Create implementation note: `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Implementation-Notes/2026-02-26-issues-148-149-complete.md`
4. Update `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Current-Sprint.md` — mark #148 + #149 complete
5. Create PR against `main` with title: `feat(guest): guest collection view + want list (#148, #149)`

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
