# Gemini Context - Social Vinyl Mobile App

> **Project**: Social Vinyl Mobile (React Native)
> **Your Role**: Development & Implementation

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

## Current Sprint Focus

**Check**: `ObsidianVaults/SocialVinyl-Dev/_Dashboard/Current-Sprint.md`

**Likely tasks for you**:
- Issue #59: Error Boundary implementation
- Issue #60: E2E testing setup
- Issue #58: Component test coverage
- Bug fixes and refactoring

**Blocked tasks** (wait for Claude):
- Issue #68: Auth security (needs architectural design)

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

## Remember

- 🧠 **Vault is your shared brain** - read it before starting, update after finishing
- 🤝 **Claude handles architecture** - flag questions for review
- 🛠️ **You handle implementation** - write clean, tested code
- 📝 **Document everything** - future you (and Claude) will thank you
- 🧪 **Test thoroughly** - quality over speed

---

## Quick Reference

**Vault location**: `~/ObsidianVaults/SocialVinyl-Dev/`

**Before work**: Read `_Dashboard/Current-Sprint.md`

**After work**: Update `Implementation-Notes/` and `Daily-Notes/`

**Questions**: Flag in vault for Claude

**Repo**: https://github.com/ajmau01/social-vinyl-mobile

---

*For full setup instructions, see: `ObsidianVaults/SocialVinyl-Dev/_Dashboard/Setup-Gemini-Antigravity.md`*
