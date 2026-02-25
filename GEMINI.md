# Gemini Context - Social Vinyl Mobile App

> **Project**: Social Vinyl Mobile (React Native)
> **Your Role**: Development & Implementation
> **Current Assignment**: v1.0 Party Core — Issue #147 (Guest Onboarding)
> **Branch**: `feature/147-guest-onboarding`
> **Status**: Ready to implement
> **Last Updated**: 2026-02-24

---

## 🎯 Current Assignment: Issue #147 — Guest Onboarding

**One issue, one PR.**

Read the full implementation plan before starting:
- `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/GEMINI-HANDOFF.md` — **complete implementation guide** ⭐
- GitHub [#147](https://github.com/ajmau01/social-vinyl-mobile/issues/147) — full spec with acceptance criteria

### What You're Building

A guest arrives at a party, scans a QR code, and needs to be in the host's collection in under 30 seconds. This issue redesigns the join flow to hit that target.

**Three paths, one screen** (`GuestJoinModal.tsx`):
1. **Returning user** — has `authToken` in SecureStore → auto-joins, zero friction
2. **New user "Skip"** — enters display name only → joins immediately, no account
3. **New user with account** — display name + email + password → ⚠️ **STUB ONLY** (see below)

### ⚠️ Scope Boundary — Read This First

The full account creation flow (email + password) depends on Backend #272 (Guest Registration endpoint) which is **not yet built**. Do NOT implement a non-functional form.

**Build in this session**:
- Deep link handling + pre-population of join code
- Background WebSocket pre-connection before UI renders
- Returning user auto-join (stored `authToken`)
- "Skip for now" path — display name only, joins immediately
- The `GuestJoinModal` component with the full UX chrome

**Stub only — do not implement**:
- The email + password account creation form
- Replace with a "Create Account (Coming Soon)" placeholder, styled consistently

### Implementation Order

1. `app/_layout.tsx` — deep link handler: pre-populate join code, kick off background WS join
2. `src/components/session/GuestJoinModal.tsx` — NEW modal overlay component
3. `app/join-session.tsx` — wire `GuestJoinModal`, handle returning user auto-join
4. `src/constants/copy.ts` — add new copy strings

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
- [ ] **#147** Guest Onboarding ← START HERE
- [ ] **#148** Guest Collection View
- [ ] **#149** Bookmark-to-Buy

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
- **ALWAYS work in the feature branch**: `feature/147-guest-onboarding`
- **ALWAYS create a PR** — never merge locally
- **NEVER merge a PR** — that's the user's job
- **ALWAYS use** "Andrew Mauer" (`ajmauer@gmail.com`) for commits

## After Completing Work

1. `npx tsc --noEmit` — verify no TypeScript errors
2. `npm test` — all tests pass
3. Create implementation note: `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Implementation-Notes/2026-02-24-issue-147-complete.md`
4. Update `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Current-Sprint.md` — mark #147 complete
5. Create PR against `main` with title: `feat(guest): guest onboarding — deep link join + skip path (#147)`

---

## Project Structure

```
app/
├── _layout.tsx            ← deep link handler (modify in step 1)
├── join-session.tsx       ← wire GuestJoinModal, auto-join (modify in step 3)
└── (tabs)/
    └── collection.tsx

src/
├── components/
│   └── session/
│       └── GuestJoinModal.tsx     ← NEW (step 2)
├── constants/
│   └── copy.ts                    ← add strings (step 4)
└── store/
    └── useSessionStore.ts         ← read lastMode/authToken for returning user check
```

---

## Key Existing Patterns to Follow

### ServiceContext / useServices()
```tsx
const { sessionService, webSocketService } = useServices();
```

### Session Store — returning user check
```tsx
const { authToken, sessionRole, lastMode } = useSessionStore();
// returning guest = lastMode === 'guest' && authToken exists in SecureStore
```

### Existing SessionService.joinSession()
```typescript
public async joinSession(joinCode: string, displayName: string): Promise<AsyncResult<SessionJoinedMessage>>
```
This is the call made when the guest taps "Join Party" on the skip path.

### Deep link URL format
```
socialvinyl://join?code=RQLA4
```
Extract `code` in `_layout.tsx` Linking handler and pass as param to `join-session` route.

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
