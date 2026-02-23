# Gemini Context - Social Vinyl Mobile App

> **Project**: Social Vinyl Mobile (React Native)
> **Your Role**: Development & Implementation
> **Current Assignment**: v1.0 Party Core — Issues #144 + #145 (Host Home Screen & Session Mode Selector)
> **Branch**: `feature/144-145-host-home-session-modes`
> **Status**: Ready to implement
> **Last Updated**: 2026-02-23

---

## 🎯 Current Assignment: Issues #144 + #145

**These two issues ship together in one PR.**

Read the full implementation plan before starting:
- `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/GEMINI-HANDOFF.md` — **complete implementation guide with code**
- `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Implementation-Notes/2026-02-23-issue-144-145-plan.md` — architecture decisions
- GitHub [#144](https://github.com/ajmau01/social-vinyl-mobile/issues/144) — Host Home Screen spec
- GitHub [#145](https://github.com/ajmau01/social-vinyl-mobile/issues/145) — Session Mode Selector spec

### What You're Building

**#145 — Session Mode Selector** (builds first, used by #144):
1. New copy strings in `src/constants/copy.ts`
2. `mode` param added to `SessionService.createSession()`
3. New component `src/components/session/SessionModeSelector.tsx`
4. Rewrite `app/create-session.tsx` with mode-aware flow

**#144 — Host Home Screen** (builds on top of #145):
5. New component `src/components/HostHomeScreen.tsx`
6. Routing gate additions in `app/index.tsx`

### Key Architecture Decision (IMPORTANT)

`sessionMode` is **mobile-only**. Never sent to backend. All three modes call:
- `create-session { name, permanent: false }` (same for all modes)
- Go Live additionally: `set-broadcast { sessionId }` after creation

| Mode | Backend calls |
|------|---------------|
| Listening Party | `create-session` only |
| Go Live | `create-session` + `set-broadcast` |
| Just Play | `create-session` only |

### Pre-condition

Issue #154 (History & Setlist DB) must be merged first — `dbService.getSessionsHistory()` must exist. **Verify this before starting `HostHomeScreen.tsx`.**

### Implementation Order

1. `src/constants/copy.ts` — add new strings
2. `src/services/SessionService.ts` — add mode param
3. `src/components/session/SessionModeSelector.tsx` — new component
4. `app/create-session.tsx` — full rewrite
5. `src/components/HostHomeScreen.tsx` — new component
6. `app/index.tsx` — routing gate additions

---

## ✅ v1.0 Party Core Progress

**Group 1 — Foundation**: ALL COMPLETE ✅
- #141 Terminology Pass (PR #155)
- #142 Cold Start Screen Redesign (PR #160)
- #143 Account & Identity Model (PR #163)

**Group 2 — Host Experience**:
- [ ] **#144** Host Home Screen ← YOU ARE HERE
- [ ] **#145** Session Mode Selector ← YOU ARE HERE
- [x] **#146** Active Session Command View ✅ (PR #164 merged Feb 23)

**Group 3 — Guest Experience** (after #144/#145):
- [ ] #147 Guest Onboarding
- [ ] #148 Guest Collection View
- [ ] #149 Bookmark-to-Buy

**Shared**:
- [x] **#154** History & Setlist View ✅ (must be merged before HostHomeScreen)

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
- **ALWAYS work in the feature branch**: `feature/144-145-host-home-session-modes`
- **ALWAYS create a PR** — never merge locally
- **NEVER merge a PR** — that's the user's job
- **ALWAYS use** "Andrew Mauer" (`ajmauer@gmail.com`) for commits

## After Completing Work

1. `npx tsc --noEmit` — verify no TypeScript errors
2. `npm test` — all tests pass
3. Create implementation note: `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Implementation-Notes/2026-02-23-issue-144-145-complete.md`
4. Update `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Current-Sprint.md`
5. Create PR against `main` with title: `feat(host): host home screen + session mode selector (#144 #145)`

---

## Project Structure

```
app/
├── index.tsx              ← routing gates (modify in step 6)
├── create-session.tsx     ← full rewrite (step 4)
└── (tabs)/
    └── collection.tsx

src/
├── components/
│   ├── HostHomeScreen.tsx         ← NEW (step 5)
│   └── session/
│       ├── ActiveSessionView.tsx  ← existing, do NOT modify
│       └── SessionModeSelector.tsx ← NEW (step 3)
├── constants/
│   └── copy.ts                    ← add strings (step 1)
├── services/
│   └── SessionService.ts          ← add mode param (step 2)
└── store/
    └── useSessionStore.ts         ← sessionMode already added in #146
```

---

## Key Existing Patterns to Follow

### ServiceContext / useServices()
```tsx
const { sessionService, databaseService } = useServices();
```

### Session Store
```tsx
const { username, authToken, sessionRole, lastSyncTime } = useSessionStore();
// sessionMode: 'party' | 'live' | 'solo' | null — already in store from #146
```

### Existing SessionService.createSession() signature (current)
```typescript
public async createSession(name: string, permanent: boolean): Promise<AsyncResult<SessionCreatedMessage>>
```
→ Add `mode?: 'party' | 'live' | 'solo'` as third param.

### Existing SessionService.setBroadcast()
```typescript
public async setBroadcast(sessionId: number): Promise<AsyncResult<void>>
```
Already exists — use it for Go Live mode.

### DatabaseService.getSessionsHistory()
```typescript
// Returns array of session records from SQLite sessions table
// Each record has: id, session_name, host_username, started_at, ended_at, mode, guest_count
await databaseService.getSessionsHistory(10);
```

---

## Quick Commands

```bash
npm test                    # Run all tests
npx tsc --noEmit           # Type check
npx eslint src/            # Lint
npm test -- SessionMode    # Test specific file
```

---

## Vault

**Location**: `~/ObsidianVaults/SocialVinyl-Dev/`

**Key files for this task**:
- `Projects/Mobile-App/GEMINI-HANDOFF.md` — full implementation guide ⭐
- `Projects/Mobile-App/Implementation-Notes/2026-02-23-issue-144-145-plan.md` — architecture
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
