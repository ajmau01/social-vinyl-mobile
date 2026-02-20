# Gemini Context - Social Vinyl Mobile App

> **Project**: Social Vinyl Mobile (React Native)
> **Your Role**: Development & Implementation
> **Current Assignment**: Milestone 13 - Core Feature Parity
> **Status**: Ready to Start (Feb 15, 2026)
> **Last Updated**: Feb 20, 2026 - Issue #128 revised after webapp parity audit

## ⚠️ IMPORTANT UPDATE — Issue #128 Revised (Feb 20, 2026)

**Issue #128 (Session Management UI) has been significantly expanded** after a 3-agent parity audit against the live webapp.

Key corrections you MUST know before implementing #128:
1. **Join codes are 5 characters** (not 4-digit) — e.g. `RQLA4`, `MVN75`
2. **File paths use Expo Router** — `app/` not `src/screens/`, no `AppNavigator.tsx`
3. **No new backend work needed** — all handlers exist (`create-session`, `join-session`, `leave-session`, `get-sessions`, `set-broadcast`, `archive-session`)
4. **Scope is full webapp parity** — session list, ON AIR/Go Live broadcast, Family Pass, display name lobby, native Share Sheet, deep links, Session Info modal
5. **Do issue #136 first** — 0.5-day refactor of `WebSocketService.joinSession()`, unblocked right now
6. **Revised estimate**: 10-12 days (was 5-6)

Read [Issue #128](https://github.com/ajmau01/social-vinyl-mobile/issues/128) for the full updated spec before starting.

---

## 🎉 GREAT NEWS: Phase 9 is COMPLETE!

You crushed Phase 9 ahead of schedule! All 4 issues merged on Feb 15, 2026:
- ✅ New/Saved view modes
- ✅ Random LP button
- ✅ Daily Spin history view
- ✅ Collection browsing is feature-complete!

---

## 🚀 NEXT UP: Milestone 13 - Core Feature Parity

**This is BIG.** Milestone 13 transforms the app from "solo browsing" to **real multi-client party mode**.

**What changes**:
- ❌ **Before**: Listening Bin is local-only, no session sharing
- ✅ **After**: Guests can join sessions and collaborate on the queue in real-time

**Your first task**: [Issue #125](https://github.com/ajmau01/social-vinyl-mobile/issues/125) - WebSocket Protocol Enhancement (CRITICAL)

**Why it's critical**: Every other feature in Milestone 13 depends on this foundation.

**Read first**: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Quick-Start-Milestone-13.md`

---

## 🎯 Current Assignment: Milestone 13 - Core Feature Parity

**Milestone**: [Milestone 13: Core Feature Parity](https://github.com/ajmau01/social-vinyl-mobile/milestone/13)
**Timeline**: 3-4 weeks (Mar 3 - Mar 31, 2026)
**Priority**: CRITICAL (enables real party functionality)
**Status**: ✅ Ready to start

---

## ✅ Phase 9 COMPLETE! 🎉

**Completed**: Feb 15, 2026 (2 days ahead of schedule!)

All 4 issues merged:
- ✅ [#115](https://github.com/ajmau01/social-vinyl-mobile/issues/115) Phase 9.1 Overview
- ✅ [#119](https://github.com/ajmau01/social-vinyl-mobile/issues/119) New/Saved View Modes (PR #122)
- ✅ [#120](https://github.com/ajmau01/social-vinyl-mobile/issues/120) Random LP Button (PR #122)
- ✅ [#121](https://github.com/ajmau01/social-vinyl-mobile/issues/121) Daily Spin History View (PR #124)

**What You Delivered**:
- 6 working view modes (All, Notable, Recent, Artist, Format, Saved)
- Daily Spin history view with real-time updates
- Random LP/Dice button
- Notable vs Saved feature separation

**User Impact**: Collection browsing is now feature-complete! 🚀

---

## 🚀 What's Next: Milestone 13 - Core Feature Parity

### The Big Picture

**Phase 9 gave users great collection browsing.** ✅

**Milestone 13 enables the core party experience.** 🎯

**What's Missing Right Now**:
- ❌ Listening Bin is local-only (Guests can't add to Host's queue)
- ❌ No way to create/join party sessions
- ❌ Now Playing is static (no progress, likes, attribution)
- ❌ No bi-directional WebSocket messaging

**Milestone 13 fixes all of this.**

### What You're Building

Transform the mobile app into a true **multi-client party controller**:

1. **WebSocket Protocol Enhancement** (Foundation) - Bi-directional messaging
2. **Listening Bin Real-time Sync** - Guests can add to Host's queue
3. **Enhanced Now Playing** - Progress ring, likes, attribution
4. **Session Management** - Create/join sessions with QR codes

**User Impact**:
- Hosts can share a 4-digit code or QR code to start a party
- Guests can join and collaboratively build the listening queue
- Everyone sees real-time updates (bin changes, likes, progress)
- Full parity with web app for core party features

### Your Issues (in priority order)

**CRITICAL - START HERE** 👇

1. **[Issue #125](https://github.com/ajmau01/social-vinyl-mobile/issues/125) - WebSocket Protocol Enhancement** 🔴
   - Priority: CRITICAL (blocks all other Milestone 13 work)
   - Effort: 3-4 days
   - Status: ✅ Ready to start (NO blockers)
   - Files: New UUID utility, WebSocket service, session store
   - **Backend coordination**: Backend team works on [#245](https://github.com/ajmau01/recordcollection/issues/245) in parallel

2. **[Issue #126](https://github.com/ajmau01/social-vinyl-mobile/issues/126) - Listening Bin Real-time Sync**
   - Priority: HIGH
   - Effort: 4-5 days
   - Status: ⏸️ BLOCKED by #125
   - Files: New bin sync service, enhanced bin store, drag-to-reorder UI

3. **[Issue #127](https://github.com/ajmau01/social-vinyl-mobile/issues/127) - Enhanced Now Playing**
   - Priority: MEDIUM
   - Effort: 3-4 days
   - Status: ⏸️ BLOCKED by #125
   - Files: New ProgressRing component, redesigned NowPlayingBanner

4. **[Issue #128](https://github.com/ajmau01/social-vinyl-mobile/issues/128) - Session Management UI**
   - Priority: CRITICAL (for v1.0)
   - Effort: 5-6 days
   - Status: ⏸️ BLOCKED by #125
   - Files: New session service, create/join screens, QR scanner

### Implementation Plan (Your 3-4 Week Sprint)

**Week 1: Protocol Foundation** (CRITICAL - Mar 3-7)
- **Day 1-4**: Implement #125 (WebSocket Protocol Enhancement)
  - Create UUID utility
  - Add new message types
  - Enhance WebSocket service with `sendAction()` method
  - Add protocol handshake
  - Handle ACKs and feature negotiation
  - Write unit tests
- **Backend team works on [#245](https://github.com/ajmau01/recordcollection/issues/245) in parallel**
- **Day 5**: Testing, PR review, coordinate with backend

**Week 2: Real-time Bin Sync** (Mar 10-14)
- **Day 1-5**: Implement #126 (Listening Bin Real-time Sync)
  - Create bin sync service
  - Enhanced bin store with optimistic updates
  - Pending operations queue
  - Drag-to-reorder UI
  - Sync status indicators
  - Write tests

**Week 3: Enhanced Now Playing** (Mar 17-21)
- **Day 1-4**: Implement #127 (Enhanced Now Playing)
  - Create ProgressRing SVG component
  - Redesign NowPlayingBanner
  - Add like functionality
  - Add attribution display
  - Write tests

**Week 4: Session Management** (Mar 24-28)
- **Day 1-5**: Implement #128 (Session Management UI)
  - Create session service
  - Build create session screen
  - Build join session screen
  - QR code display/scanner
  - Write tests
- **Final day**: Integration testing, deployment coordination

### Documentation Available

**Your complete implementation guides** (Claude prepared these for you):

1. **Quick Start**: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Quick-Start-Milestone-13.md` ⭐
   - **READ THIS FIRST** before starting
   - Implementation order, priorities, deployment checklist
   - Backend coordination requirements

2. **Complete Technical Plan**: `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Milestone-13-Implementation-Plan.md`
   - 400+ lines of detailed specifications
   - Architecture diagrams
   - Week-by-week implementation strategy
   - Complete file lists
   - Testing strategy
   - Success metrics

3. **Backend Coordination**: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Cross-Repo-Dependencies.md`
   - 5 backend issues (#245-249) created
   - Breaking changes tracker
   - Deployment order (backend first, then mobile)

4. **Roadmap Context**: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Roadmap-to-v1.0.md`
   - Why Milestone 13 matters
   - Strategic position (2nd of 4 milestones to v1.0)
   - What comes after

5. **GitHub Issues**: Each issue has 100-150 lines of implementation details
   - Complete acceptance criteria
   - Code examples
   - Step-by-step instructions
   - Test cases

---

## Your Role

You are the **hands-on developer** for this project. Your focus is:
- 🛠️ **Implementation**: Writing code, building features
- 🧪 **Testing**: Writing and running tests
- 🐛 **Bug Fixes**: Debugging and fixing issues
- ♻️ **Refactoring**: Improving code quality

**You work in coordination with Claude**, who handles:
- Planning and architecture design
- PR reviews and quality standards
- Project management and sprint coordination

## Shared Long-Term Memory 🧠

**CRITICAL**: This project uses a shared Obsidian vault for team coordination.

**Vault Location**: `~/ObsidianVaults/SocialVinyl-Dev/`

### 1. Before Starting Work
- **GLOBAL CONTEXT**: Read `~/ObsidianVaults/SocialVinyl-Dev/000-Atlas.md` (MANDATORY).
- Read `_Dashboard/README.md` for ecosystem overview.
- Check `_Dashboard/Current-Sprint.md` for active tasks.
3. `Projects/Mobile-App/Overview.md` - Project context
4. `Projects/Mobile-App/Implementation-Notes/` - Recent work by Claude or previous sessions

### After Completing Work

**Update these files**:
1. `Projects/Mobile-App/Implementation-Notes/YYYY-MM-DD-topic.md` - Document what you did
2. `Daily-Notes/YYYY-MM-DD.md` - Add session summary
3. `_Dashboard/Current-Sprint.md` - Mark tasks as complete

## Project Overview

### What You're Building
The mobile app is the "Remote Control" for Social Vinyl parties. It's a satellite to the Java backend (the "mothership").

### Tech Stack
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **State**: Zustand
- **Database**: SQLite (local caching)
- **Real-time**: WebSocket client
- **Testing**: Jest, React Native Testing Library

### Key Patterns
- **Dependency Injection**: ServiceContext provides services
- **Message Router**: Separate network, state, and UI layers
- **Atomic State Updates**: Replace entire state, don't patch
- **Offline-First**: Cache local, sync with server

## Your Workflow

**GitHub Issues are Your Source of Truth**

Claude creates detailed GitHub issues that form a **logical path** for you to follow. Each issue tells you exactly what to do and points to the next one.

### 0. CRITICAL WORKFLOW RULES (NON-NEGOTIABLE)
- **NEVER commit directly to `main`**. ALWAYS work in a `feature/...` or `fix/...` branch.
- **ALWAYS create a Pull Request** to merge changes. Never merge locally without a PR.
- **ALWAYS use "Andrew Mauer" (<ajmauer@gmail.com>)** for all commits and PRs. (Local git config has been verified).

### 1. Check Your Tasks

**On GitHub**:
1. Go to: https://github.com/ajmau01/social-vinyl-mobile/issues
2. Look for issues assigned to you or labeled for development
3. Issues are ordered in a logical sequence
4. Each issue points to the next one

**In Antigravity, ask**:
> "What GitHub issues are currently open for the mobile repo? Show me the ones ready for development."

### 2. Read the Issue

**GitHub issue contains everything you need**:
- Goal and context
- Detailed acceptance criteria
- Implementation guidance
- Link to vault docs (for architecture background)
- Pointer to next issue

**Example**:
> "Read GitHub issue #59. What do I need to implement?"

**If issue references vault docs**:
> "Also read `ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Architecture.md` for context on the Error Boundary pattern."

### 3. Implement

Write the code! Follow:
- Existing patterns in the codebase
- TypeScript strict mode
- Test-driven development (write tests!)

### 4. Test

```bash
npm test                    # Run all tests
npm test -- ErrorBoundary   # Run specific test
```

Ensure:
- All tests pass
- New code has test coverage
- No TypeScript errors

### 5. Document

Create implementation note:
> "Create a file `ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Implementation-Notes/2026-02-09-feature-name.md` documenting what I implemented, files changed, and testing results."

### 6. Update Sprint

Mark task complete:
> "Update `ObsidianVaults/SocialVinyl-Dev/_Dashboard/Current-Sprint.md` to mark task #59 as completed by Gemini."

## File Structure

```
src/
├── components/       ← UI components (you'll write these)
├── contexts/         ← ServiceContext (DI pattern)
├── services/         ← Business logic services
├── stores/          ← Zustand state management
├── types/           ← TypeScript types + Zod schemas
├── utils/           ← Helper functions
└── __tests__/       ← Tests (you'll write these!)
```

## Common Tasks

### Implementing a New Component

**Example: Error Boundary (Issue #59)**

1. **Read the plan**:
   ```
   ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Implementation-Notes/
     └── error-boundary-plan.md
   ```

2. **Create the component**:
   ```typescript
   // src/components/ErrorBoundary.tsx
   import React from 'react';
   import * as Sentry from '@sentry/react-native';

   interface Props {
     children: React.ReactNode;
   }

   interface State {
     hasError: boolean;
   }

   export class ErrorBoundary extends React.Component<Props, State> {
     // ... implementation
   }
   ```

3. **Write tests**:
   ```typescript
   // src/components/__tests__/ErrorBoundary.test.tsx
   describe('ErrorBoundary', () => {
     it('catches errors and displays fallback', () => {
       // ... test implementation
     });
   });
   ```

4. **Document**:
   Create `Implementation-Notes/2026-02-09-error-boundary.md`

### Fixing a Bug

1. **Understand the issue**:
   - Read GitHub issue
   - Check vault for related notes

2. **Write failing test**:
   - Reproduce the bug in a test
   - Verify test fails

3. **Fix the code**:
   - Make minimal changes
   - Ensure test passes

4. **Document**:
   - Update implementation notes
   - Reference GitHub issue

### Adding a Feature

1. **Check if Claude left a plan** in vault
2. **Read architecture docs** for patterns
3. **Implement following patterns**
4. **Write comprehensive tests**
5. **Document in vault**

## Coordination with Claude

### Claude Creates Plans
Claude might leave implementation plans for you:

**Location**: `ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Implementation-Notes/`

**Example plan file**:
```markdown
# Feature X - Implementation Plan

## Architecture
[Claude's design]

## Requirements
[What needs to be done]

## Handoff to Gemini
Ready for implementation. Follow patterns in Architecture.md.
```

**You**: Read it, implement it, document completion.

### You Flag Issues for Claude

If you hit architectural questions or blockers:

**Create note**:
```markdown
# Issue: WebSocket Connection Failing

## Problem
Auth credentials in URL causing 401 errors.

## Related
- Issue #68 (mobile)
- Issue #237 (backend)

## Question for Claude
Should we implement the JWT auth fix from
`Shared/Authentication-Design.md`?

## Status
🔴 BLOCKED - Waiting for Claude's architectural decision
```

### Handoffs

**Clear handoffs** in implementation notes:

```markdown
## Handoff to Claude
Implementation complete. Ready for PR review.

Files changed:
- src/components/ErrorBoundary.tsx
- src/components/__tests__/ErrorBoundary.test.tsx

Tests: All passing (95% coverage)
GitHub: Issue #59
```

## Milestone 13 Implementation Details

### Issue #125: WebSocket Protocol Enhancement (START HERE - CRITICAL)

**Goal**: Establish reliable bi-directional messaging foundation with protocol versioning and feature negotiation.

**Why This is CRITICAL**:
- **ALL** other Milestone 13 features depend on this
- Enables client→server actions (add to bin, like tracks, etc.)
- Provides feature negotiation (graceful degradation for old servers)
- Establishes message acknowledgment system

**What You're Building**:
1. UUID generation utility
2. New WebSocket message types (PROTOCOL_HANDSHAKE, CLIENT_ACTION, ACTION_ACK)
3. Enhanced WebSocket service with `sendAction()` method
4. Protocol handshake on connection
5. Feature flag system (`enabledFeatures` in session store)

**Files to Create**:
- `src/utils/uuid.ts` - UUID generation utility

**Files to Modify**:
- `src/types/index.ts` - Add new message types
- `src/types/schemas.ts` - Add Zod schemas
- `src/services/WebSocketService.ts` - Protocol handshake + sendAction()
- `src/store/useSessionStore.ts` - Add enabledFeatures tracking
- `src/hooks/useWebSocket.ts` - Expose enabledFeatures

**Implementation Steps** (from issue #125):

**Step 1**: Create UUID utility (`src/utils/uuid.ts`)
\`\`\`typescript
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
\`\`\`

**Step 2**: Add new message types to `src/types/index.ts`
- ProtocolHandshakeMessage
- ProtocolAckMessage
- ClientActionMessage
- ActionAckMessage
- See issue #125 for complete code

**Step 3**: Add Zod schemas to `src/types/schemas.ts`
- Validation for all new message types

**Step 4**: Enhance WebSocket service
- Add `sendAction()` method for client→server messages
- Add protocol handshake in `handleOpen()`
- Handle PROTOCOL_ACK and ACTION_ACK messages
- Track pending actions with timeout handling

**Step 5**: Update session store
- Add `enabledFeatures: string[]` field
- Add `setEnabledFeatures()` action
- Add `isFeatureEnabled()` helper

**Step 6**: Write unit tests
- UUID generation
- Protocol handshake message creation
- sendAction() behavior
- ACK timeout handling

**Testing**:
- Unit tests for UUID generation
- Unit tests for protocol negotiation
- Integration test with mock server
- Manual test with real backend (after backend #245 merges)

**Acceptance Criteria**:
- [ ] Protocol handshake sent on WebSocket connection
- [ ] Server responds with enabled features
- [ ] enabledFeatures stored in session store
- [ ] sendAction() method works
- [ ] ACTION_ACK handling works
- [ ] Timeout triggers error callback
- [ ] Graceful degradation if server doesn't support protocol
- [ ] All tests pass
- [ ] Backward compatible with old servers

**Estimated Time**: 3-4 days
- Day 1-2: Implement core protocol infrastructure
- Day 3: Write tests, handle edge cases
- Day 4: Integration testing, PR

**Backend Coordination**:
- Backend team works on [#245](https://github.com/ajmau01/recordcollection/issues/245) in parallel
- Coordinate merge timing (backend deploys first, then mobile)
- Test with backend dev environment before production

---

### Issue #126: Listening Bin Real-time Sync

**Goal**: Replace local-only bin with WebSocket-synced bin supporting multi-client collaboration.

**Status**: ⏸️ BLOCKED by #125 (Protocol Enhancement)

**What You're Building**:
1. Enhanced bin store with sync tracking
2. Optimistic UI updates (instant feedback)
3. Pending operations queue (offline resilience)
4. Bin sync service for WebSocket actions
5. Drag-to-reorder functionality
6. Sync status indicators
7. Attribution labels ("Added by [Name]")

**Files to Create**:
- `src/services/ListeningBinSyncService.ts` - Bin sync service
- `src/hooks/useListeningBin.ts` - Bin hook
- `src/components/BinItem.tsx` - Individual bin item component

**Files to Modify**:
- `src/store/useListeningBinStore.ts` - Add sync tracking, optimistic updates
- `app/(tabs)/bin.tsx` - Add drag-to-reorder, sync status

**Key Concepts**:
- **Optimistic updates**: UI updates immediately, then syncs with server
- **Pending operations**: Queue actions when offline, replay when reconnected
- **Server authority**: Server state always wins in conflicts

**Dependencies**:
- `react-native-draggable-flatlist` - For drag-to-reorder
- `react-native-gesture-handler` - Peer dependency
- `react-native-reanimated` - Already installed

**Estimated Time**: 4-5 days

**Backend Coordination**:
- Backend [#246](https://github.com/ajmau01/recordcollection/issues/246) must complete first
- Deploy backend before mobile
- Test with 2+ devices

---

### Issue #127: Enhanced Now Playing

**Goal**: Transform static banner into interactive component with progress, likes, and attribution.

**Status**: ⏸️ BLOCKED by #125 (Protocol Enhancement)

**What You're Building**:
1. Circular progress ring (SVG component)
2. Heart/like button with real-time counter
3. Attribution display ("Added by [Name]")
4. Tap to view full release details

**Files to Create**:
- `src/components/ProgressRing.tsx` - SVG progress ring component

**Files to Modify**:
- `src/components/NowPlayingBanner.tsx` - Complete redesign
- `src/store/useSessionStore.ts` - Add enhanced now playing fields
- `src/services/ListeningBinSyncService.ts` - Add likeCurrentTrack() method

**Dependencies**:
- `react-native-svg` - May already be installed

**Estimated Time**: 3-4 days

**Backend Coordination**:
- Backend [#247](https://github.com/ajmau01/recordcollection/issues/247) (Like system)
- Backend [#249](https://github.com/ajmau01/recordcollection/issues/249) (Enhanced now playing)

---

### Issue #128: Session Management UI — FULL WEBAPP PARITY

> ⚠️ **ISSUE REVISED 2026-02-20** — Read the updated GitHub issue before starting. Original scope was ~40% of the full feature. This note reflects the corrected, full-parity scope.

**Goal**: Build the complete Session Management UI to full parity with the live webapp, plus mobile-native enhancements.

**Reference**: The webapp Session Manager (see screenshot in issue) is the design spec. Match it exactly.

**Status**: ⏸️ BLOCKED by #125 (Protocol Enhancement) + pre-req #136

**Pre-req first**: [Issue #136](https://github.com/ajmau01/social-vinyl-mobile/issues/136) — Refactor `WebSocketService.joinSession()` (0.5 days, unblocked, do this before #128 branch)

**CRITICAL CORRECTIONS from original issue**:
- ❌ "4-digit code" → ✅ **5-character alphanumeric** (e.g. `RQLA4`, `MVN75`)
- ❌ `src/screens/` path → ✅ `app/` (Expo Router)
- ❌ `src/navigation/AppNavigator.tsx` → ✅ `app/_layout.tsx`
- ❌ No backend work needed for #248 → ✅ All backend handlers already exist

**What You're Building** (full parity with webapp):
1. Session Manager screen (`app/session-list.tsx`) — session cards with Go Live / ON AIR / Share / End / Family Pass
2. Create session screen (`app/create-session.tsx`) — name + permanent toggle
3. Join session screen (`app/join-session.tsx`) — 5-char code entry + native QR scanner
4. Lobby modal — display name prompt on first guest join
5. Share flow — QR code + native Share Sheet + magic link (NOT just QR)
6. Session Info modal — ⓘ button in header with large code + ON AIR badge
7. Family Pass — permanent session auto-rejoin on session-left
8. SessionDrawer overhaul — replace disabled placeholder with live session controls
9. "Go Live" / "ON AIR" broadcast toggle — one session is THE broadcast
10. Deep links — `socialvinyl://join?code=XXXXX` via Expo Linking

**Files to Create**:
- `app/session-list.tsx` — Session Manager (list all sessions)
- `app/create-session.tsx` — Host creates session
- `app/join-session.tsx` — Guest joins via code or QR
- `src/services/SessionService.ts` — Session lifecycle service
- `src/services/interfaces.ts` — Add `ISessionService`
- `src/components/session/SessionCodeDisplay.tsx` — QR + Share Sheet + copy
- `src/components/session/QRScanner.tsx` — Native camera QR scanner
- `src/components/session/SessionCard.tsx` — Session list card
- `src/components/session/LobbyModal.tsx` — Display name on first join
- `src/components/session/SessionInfoModal.tsx` — ⓘ info overlay

**Files to Modify**:
- `app/_layout.tsx` — Add Stack screens (not AppNavigator.tsx)
- `src/contexts/ServiceContext.tsx` — Register SessionService
- `src/stores/useSessionStore.ts` — Add: joinCode, sessionRole, isPermanent, isBroadcast, displayName; update partialize
- `src/types/schemas.ts` — Zod schemas for session-created, session-joined, session-left, session-list
- `src/components/SessionDrawer.tsx` — Replace disabled placeholder with live controls

**Backend Actions** (all exist, zero new backend work needed):
- `create-session` → `session-created`
- `join-session` → `session-joined` (SessionJoinedMessage DTO)
- `leave-session` → `session-left`
- `get-sessions` → `session-list`
- `set-broadcast` → updates broadcast
- `archive-session` → session archived

**Dependencies**:
- `react-native-qrcode-svg` — QR code generation (client-side, same as webapp's qrcode.min.js)
- `expo-barcode-scanner` — QR scanning
- `expo-camera` — Camera access

**Estimated Time**: **10-12 days** (revised from 5-6 to reflect full parity scope)

**Backend Coordination**:
- No new backend issues needed for parity
- Future enhancement: backend [#266](https://github.com/ajmau01/recordcollection/issues/266) (end-session broadcast) — NOT blocking

---

## Current Sprint Focus

**Active Sprint**: Milestone 13 - Core Feature Parity
**Check**: `ObsidianVaults/SocialVinyl-Dev/_Dashboard/Current-Sprint.md`

**Your Tasks** (in order):
1. 🔴 **Issue #125**: WebSocket Protocol Enhancement (3-4 days) - **START HERE CRITICAL**
2. ⏸️ **Issue #126**: Listening Bin Real-time Sync (4-5 days) - BLOCKED by #125
3. ⏸️ **Issue #127**: Enhanced Now Playing (3-4 days) - BLOCKED by #125
4. ⏸️ **Issue #128**: Session Management UI (5-6 days) - BLOCKED by #125

**Completed Recently** (for context):
- ✅ **Phase 9**: Advanced Collection Features (all 4 issues merged Feb 15) 🎉
  - New/Saved view modes (#119)
  - Random LP button (#120)
  - Daily Spin history view (#121)
- ✅ Phase 8: Visual Design Parity (all issues #100-107 merged Feb 13-14)
- ✅ Security hardening (8 of 9 complete)
- ✅ WebSocket authentication (#68 merged)

## Testing Standards

### Unit Tests
- Use Jest + React Native Testing Library
- Test behavior, not implementation
- Aim for 80%+ coverage on new code

### Integration Tests
- Test component interactions
- Mock services via ServiceContext
- Test error scenarios

### E2E Tests (when #60 is done)
- Use Detox
- Test critical user flows
- Run before PRs

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Define types in `src/types/`

### React/React Native
- Functional components with hooks
- Use TypeScript for props
- Follow React best practices

### Testing
- Every new component gets tests
- Every bug fix gets a test
- Tests should be readable

### Documentation
- JSDoc for complex functions
- README updates for new features
- Implementation notes in vault

## GitHub Workflow

### Before Pushing
```bash
npm test              # All tests pass
npx tsc --noEmit     # No TypeScript errors
npx eslint src/      # No lint errors
```

### Creating PR
1. Push your branch
2. Create PR with description
3. **Update vault** with PR link in implementation notes
4. Claude will review

### After PR Comments
1. Address Claude's feedback
2. Update code
3. Push changes
4. **Document** any architectural discussions in vault

## Quick Commands

```bash
# Start dev server
npm start

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npx eslint src/

# Test specific file
npm test -- ErrorBoundary
```

## Milestone 13 Success Criteria

**Milestone 13 is complete when**:
- [ ] Protocol enhancement (#125) complete and merged
- [ ] Backend protocol (#245) complete and deployed
- [ ] Listening Bin syncs in real-time across multiple clients
- [ ] Optimistic UI updates work (instant feedback)
- [ ] Offline bin actions queue and sync on reconnect
- [ ] Host can create session with 5-character code (Go Live, ON AIR, Share, Family Pass)
- [ ] Guest can join via 5-char code or QR scan (lobby for display name on first join)
- [ ] Now Playing shows progress ring, like counter, attribution
- [ ] All tests passing (unit + integration + E2E)
- [ ] Multi-client testing verified (2+ devices)
- [ ] PRs merged and deployed (backend first, then mobile)

---

## Backend Coordination (CRITICAL!)

**5 Backend Issues Created**: [#245-249](https://github.com/ajmau01/recordcollection/issues?q=is%3Aissue+is%3Aopen+245..249)

**Why This Matters**:
ALL Milestone 13 features require backend support. Backend team works in parallel with you.

**Timeline**:
- **Week 1**: Backend #245 (2-3 days) + Mobile #125 (3-4 days) - **FOUNDATION**
- **Week 2-3**: Backend #246-249 + Mobile #126-128 - **FEATURES** (parallel work)

**How You'll Know Backend is Ready**:
1. Check `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Cross-Repo-Dependencies.md`
2. Look for status changes (🔴 BLOCKED → 🟢 READY)
3. GitHub comments on your mobile issues
4. Claude may notify you in vault notes

**CRITICAL Deployment Order**:
- **ALWAYS**: Backend deploys FIRST, then mobile
- **Week 1**: Backend #245 → Mobile #125
- **Week 2**: Backend #246 → Mobile #126
- **Week 3**: Backend #247 + #249 → Mobile #127
- **Week 4**: Mobile #136 (pre-req refactor, 0.5d) → Mobile #128 (10-12d, no backend needed)

**Why Backend First?**:
- Backend supports both old and new clients
- Mobile gracefully degrades if backend not ready
- Prevents breaking existing clients

**Coordination Steps**:
1. Backend team completes their issue
2. Backend deploys to dev environment
3. You test mobile with dev backend
4. Backend deploys to production
5. You deploy mobile to production
6. Multi-client testing
7. Update vault documentation

---

## Remember

- 🧠 **Vault is your shared brain** - read it before starting, update after finishing
- 🤝 **Claude handles architecture** - flag questions for review
- 🛠️ **You handle implementation** - write clean, tested code
- 📝 **Document everything** - future you (and Claude) will thank you
- 🧪 **Test thoroughly** - quality over speed
- 🎯 **Focus on #119 first** - it's the highest priority and ready to go

---

## Quick Reference

**Vault location**: `~/ObsidianVaults/SocialVinyl-Dev/`

**Milestone 13 Quick Start**: `_Dashboard/Quick-Start-Milestone-13.md` ⭐ **READ THIS FIRST**

**Implementation Plan**: `Projects/Mobile-App/Milestone-13-Implementation-Plan.md`

**Before work**: Read `_Dashboard/Current-Sprint.md`

**After work**: Update `Implementation-Notes/` and `Daily-Notes/`

**Questions**: Flag in vault for Claude

**Repo**: https://github.com/ajmau01/social-vinyl-mobile

**Milestone**: https://github.com/ajmau01/social-vinyl-mobile/milestone/13

---

## Your First Steps (When You Start)

1. **Read Quick Start**: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Quick-Start-Milestone-13.md` ⭐
2. **Read Issue #125**: https://github.com/ajmau01/social-vinyl-mobile/issues/125
3. **Read Implementation Plan**: `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Milestone-13-Implementation-Plan.md`
4. **Create UUID utility**: `src/utils/uuid.ts`
5. **Start coding**: Add new message types to `src/types/index.ts`
6. **Enhance WebSocket service**: Add `sendAction()` method
7. **Run tests**: `npm test` (write tests as you go!)
8. **Coordinate with backend**: Check that backend #245 is progressing
9. **Document**: Create implementation note when done

**Remember**: Issue #125 is the **foundation** for all other Milestone 13 features. Take your time to get it right!

---

*For full setup instructions, see: `ObsidianVaults/SocialVinyl-Dev/_Dashboard/Setup-Gemini-Antigravity.md`*
