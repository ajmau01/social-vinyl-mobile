# Gemini Context - Social Vinyl Mobile App

> **Project**: Social Vinyl Mobile (React Native)
> **Your Role**: Development & Implementation
> **Current Assignment**: Phase 9 - Advanced Collection Features
> **Status**: Ready to Start (Feb 14, 2026)

## 🎯 Current Assignment: Phase 9 - Advanced Collection Features

**Milestone**: [Milestone 12: Phase 9](https://github.com/ajmau01/social-vinyl-mobile/milestone/12)
**Timeline**: 2 weeks (Feb 17 - Mar 3, 2026)
**Priority**: HIGH
**Status**: ✅ Ready to start

### What You're Building

Complete the collection browsing experience by implementing the final 3 view modes:
1. **'New' View** - Group albums by when they were added (Today, This Week, etc.)
2. **'Saved' View** - Filter to bookmarked albums
3. **'Spin' View** - Group by play count (BLOCKED on backend)
4. **Random LP Button** - Dice icon that opens a random album

**User Impact**: Users can now discover and explore their collection in 6 different ways (currently only 3 work).

### Your Issues (in priority order)

**START HERE** 👇

1. **[Issue #119](https://github.com/ajmau01/social-vinyl-mobile/issues/119) - Implement 'New' and 'Saved' View Modes** ⭐
   - Priority: HIGH
   - Effort: 3 days
   - Status: ✅ Ready to start (NO blockers)
   - File: `src/hooks/useGroupedReleases.ts`

2. **[Issue #120](https://github.com/ajmau01/social-vinyl-mobile/issues/120) - Random LP/Dice Button**
   - Priority: MEDIUM
   - Effort: 1 day
   - Status: ✅ Ready to start (NO blockers)
   - Files: `app/(tabs)/collection.tsx`, `src/components/collection/CollectionHeader.tsx`

3. **[Issue #121](https://github.com/ajmau01/social-vinyl-mobile/issues/121) - 'Spin' View Mode**
   - Priority: MEDIUM
   - Effort: 3 days (after backend ready)
   - Status: 🔴 BLOCKED - Wait for backend [#242](https://github.com/ajmau01/recordcollection/issues/242)
   - File: `src/hooks/useGroupedReleases.ts`

### Implementation Plan (Your 2-Week Sprint)

**Week 1** (Feb 17-21):
- **Day 1-3**: Implement #119 (New/Saved views)
  - Add helper function for time period grouping
  - Update grouping logic
  - Write unit tests
  - Manual testing
- **Day 4**: Implement #120 (Random LP button)
  - Add handler in collection screen
  - Wire up dice icon
  - Write tests
- **Day 5**: Testing, PR review, fixes

**Week 2** (Feb 24-28):
- **Days 1-2**: Backend coordination for #121
  - Backend team works on [recordcollection#242](https://github.com/ajmau01/recordcollection/issues/242)
  - You: Prepare for #121 (review code, read backend specs)
- **Days 3-5**: If backend ready, implement #121
  - If backend NOT ready: polish #119/#120, add extra tests, improve UX

### Documentation Available

**Your complete implementation guides** (Claude prepared these for you):

1. **Quick Start**: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Quick-Start-Phase-9.md`
   - Read this FIRST before starting
   - Implementation order, file reference, testing checklist

2. **Technical Details**: `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Phase-9-Implementation-Plan.md`
   - Full code examples
   - Helper functions
   - Section sorting logic
   - Testing requirements

3. **Roadmap Context**: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Roadmap-to-v1.0.md`
   - Why Phase 9 matters
   - What comes next
   - Path to v1.0

4. **GitHub Issues**: Each issue has 200+ lines of implementation details
   - Copy-paste ready code
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

### Before Starting Work

**Read these files**:
1. `_Dashboard/README.md` - Vault overview
2. `_Dashboard/Current-Sprint.md` - Active tasks (check what's assigned to you!)
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

## Phase 9 Implementation Details

### Issue #119: New & Saved View Modes (START HERE)

**Goal**: Make 'New' and 'Saved' chips functional instead of showing all albums in one carousel.

**What's Currently Broken**:
- Tap "New" chip → Shows all albums in single carousel (should group by time periods)
- Tap "Saved" chip → Shows all albums in single carousel (should filter to saved only)

**What You're Fixing**:
1. Add helper function to group albums by time periods (Today, This Week, etc.)
2. Update grouping logic in `useGroupedReleases.ts`
3. Add section sorting for time periods

**File to Modify**: `src/hooks/useGroupedReleases.ts` (lines 99-145)

**Implementation Steps** (from issue #119):

**Step 1**: Add helper function (top of file, after imports)
\`\`\`typescript
function getTimePeriodKey(addedAt: number): string {
    const now = Date.now();
    const addedMs = addedAt * 1000;
    const diff = now - addedMs;
    const dayMs = 24 * 60 * 60 * 1000;

    if (diff < dayMs) return 'Today';
    if (diff < 7 * dayMs) return 'This Week';
    if (diff < 30 * dayMs) return 'This Month';

    const addedDate = new Date(addedMs);
    const addedYear = addedDate.getFullYear();
    const currentYear = new Date().getFullYear();

    if (addedYear === currentYear) return 'Earlier This Year';
    return addedYear.toString();
}
\`\`\`

**Step 2**: Update grouping logic (around line 99-130)
\`\`\`typescript
// Add these two cases to the existing if/else chain:
} else if (groupBy === 'new') {
    key = getTimePeriodKey(release.added_at);
} else if (groupBy === 'saved') {
    if (!release.isSaved) return; // Skip unsaved
    key = 'Saved Albums';
}
\`\`\`

**Step 3**: Update section sorting (around line 133-145)
- Add custom sorting for 'new' mode (time periods in order)
- See issue #119 for complete code

**Testing**:
- Unit tests: `src/hooks/__tests__/useGroupedReleases.test.ts`
- Manual: Switch to "New" chip, verify grouping
- Manual: Long-press to save albums, switch to "Saved" chip
- E2E: `e2e/view-modes.test.ts`

**Acceptance Criteria**:
- [ ] 'New' view groups by time periods (Today, This Week, etc.)
- [ ] Time periods appear in chronological order
- [ ] 'Saved' view filters to only saved albums
- [ ] Empty state works (no saved albums shows empty message)
- [ ] All tests pass
- [ ] No performance regressions

**Estimated Time**: 3 days
- Day 1: Implement 'New' view + unit tests
- Day 2: Implement 'Saved' view + unit tests
- Day 3: Manual testing, E2E tests, PR

---

### Issue #120: Random LP/Dice Button

**Goal**: Wire up the dice icon (already in UI from Phase 8) to open a random album modal.

**What's Currently Broken**:
- Dice icon is visible but does nothing when tapped

**What You're Implementing**:
1. Handler to pick random album
2. Wire up icon to handler
3. Open ReleaseDetailsModal with random album
4. Handle edge cases (empty collection, single album)

**Files to Modify**:
1. `app/(tabs)/collection.tsx` - Add handler
2. `src/components/collection/CollectionHeader.tsx` - Wire up icon

**Implementation Steps** (from issue #120):

**Step 1**: Add handler in `collection.tsx`
\`\`\`typescript
const handleRandomLP = useCallback(() => {
    if (releases.length === 0) return;

    const randomIndex = Math.floor(Math.random() * releases.length);
    const randomRelease = releases[randomIndex];

    setSelectedRelease(randomRelease);
    setModalVisible(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}, [releases]);
\`\`\`

**Step 2**: Pass to header
\`\`\`typescript
<CollectionHeader
    // ... existing props
    onRandomLP={handleRandomLP}
/>
\`\`\`

**Step 3**: Wire up icon in `CollectionHeader.tsx`
- Add `onRandomLP` to props interface
- Wrap dice icon in TouchableOpacity
- Handle disabled state (no albums)
- See issue #120 for complete code

**Testing**:
- Unit: Handler selects random album
- Manual: Tap dice → modal opens
- Manual: Empty collection → button disabled
- E2E: `e2e/collection.test.ts`

**Acceptance Criteria**:
- [ ] Dice icon opens random album modal
- [ ] Haptic feedback on tap
- [ ] Button disabled when no albums
- [ ] Random picks from filtered results (after search)
- [ ] All tests pass

**Estimated Time**: 1 day

---

### Issue #121: Spin View Mode (BLOCKED)

**Goal**: Group albums by play count (how often they've been played)

**Status**: 🔴 BLOCKED on backend [recordcollection#242](https://github.com/ajmau01/recordcollection/issues/242)

**What's Blocking**:
- Backend needs to add `spin_count` column to database
- Backend needs to track play events via WebSocket
- Backend needs to include `spinCount` in collection sync

**Backend Timeline**: 3-4 days (being worked on in parallel)

**Your Timeline**: 2-3 days (after backend deploys to dev)

**What You'll Implement** (when unblocked):
1. Add `spinCount` field to Release type
2. Add database migration for mobile SQLite
3. Add helper function to group by play frequency
4. Update grouping logic
5. Test with dev backend

**Implementation Steps** (from issue #121):
- Step 1: Update `src/types/index.ts` - Add `spinCount?: number`
- Step 2: Update database schema in `DatabaseService.ts`
- Step 3: Add `getSpinGroupKey()` helper function
- Step 4: Add grouping logic for 'spin' mode
- Step 5: Test with dev backend
- See issue #121 for complete code

**Coordination**:
1. Backend team completes [#242](https://github.com/ajmau01/recordcollection/issues/242)
2. Backend deploys to dev environment
3. **You get notified** via vault `Current-Sprint.md` or GitHub comment
4. You connect mobile to dev backend and test
5. You implement mobile grouping logic
6. Coordinate production deployment

**What to Do While Blocked**:
- Focus on #119 and #120
- Review backend issue #242 to understand the data format
- Prepare test cases for when backend is ready
- Polish #119/#120 implementation

---

## Current Sprint Focus

**Active Sprint**: Phase 9 - Advanced Collection Features
**Check**: `ObsidianVaults/SocialVinyl-Dev/_Dashboard/Current-Sprint.md`

**Your Tasks** (in order):
1. ✅ **Issue #119**: New/Saved view modes (3 days) - START HERE
2. ✅ **Issue #120**: Random LP button (1 day) - NEXT
3. ⏸️ **Issue #121**: Spin view mode (BLOCKED on backend)

**Reference Issues**:
- **#115**: Phase 9.1 overview (parent issue with full context)

**Completed Recently** (for context):
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

## Phase 9 Success Criteria

**Phase 9 is complete when**:
- [ ] All 6 view modes are functional (A-Z, Genre, Decade, New, Spin, Saved)
- [ ] 'New' view groups by time periods correctly
- [ ] 'Saved' view filters to bookmarked albums
- [ ] Random LP button opens random album modal
- [ ] 'Spin' view groups by play count (or documented as v1.1 if backend delayed)
- [ ] All tests passing (unit + E2E)
- [ ] No performance regressions with 3000+ albums
- [ ] PRs merged and deployed

---

## Backend Coordination (Important!)

**Backend Issue**: [recordcollection#242 - Track Play Count](https://github.com/ajmau01/recordcollection/issues/242)

**Why This Matters**:
Issue #121 (Spin view) depends on backend implementing play count tracking. The backend team is working on this in parallel.

**Timeline**:
- Backend work: 3-4 days
- Your work: 2-3 days (after backend ready)

**How You'll Know Backend is Ready**:
1. Check `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Cross-Repo-Dependencies.md`
2. Look for status change: 🔴 BLOCKED → 🟢 READY
3. Or: GitHub comment on issue #121

**What to Do When Backend is Ready**:
1. Connect mobile to dev backend
2. Test `spinCount` data is received
3. Implement grouping logic from issue #121
4. Run tests with real data
5. Coordinate production deployment timing

**Deployment Coordination**:
- Backend deploys FIRST to production
- Then mobile deploys (same day or next day)
- Document in vault when deployed

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

**Phase 9 Quick Start**: `_Dashboard/Quick-Start-Phase-9.md` ⭐ READ THIS FIRST

**Implementation Plan**: `Projects/Mobile-App/Phase-9-Implementation-Plan.md`

**Before work**: Read `_Dashboard/Current-Sprint.md`

**After work**: Update `Implementation-Notes/` and `Daily-Notes/`

**Questions**: Flag in vault for Claude

**Repo**: https://github.com/ajmau01/social-vinyl-mobile

**Milestone**: https://github.com/ajmau01/social-vinyl-mobile/milestone/12

---

## Your First Steps (When You Start)

1. **Read Quick Start**: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/Quick-Start-Phase-9.md`
2. **Read Issue #119**: https://github.com/ajmau01/social-vinyl-mobile/issues/119
3. **Read Implementation Plan**: `~/ObsidianVaults/SocialVinyl-Dev/Projects/Mobile-App/Phase-9-Implementation-Plan.md`
4. **Open file**: `src/hooks/useGroupedReleases.ts`
5. **Start coding**: Add `getTimePeriodKey()` helper function
6. **Run tests**: `npm test useGroupedReleases`
7. **Manual test**: Switch to "New" chip in app
8. **Document**: Create implementation note when done

---

*For full setup instructions, see: `ObsidianVaults/SocialVinyl-Dev/_Dashboard/Setup-Gemini-Antigravity.md`*
