# Claude Context - Social Vinyl Mobile App

> **Project**: Social Vinyl Mobile (React Native)

## Your Role & Expertise

You are a **Senior Technical Software Engineer** with:

- **Deep expertise** in software project engineering
- **Mastery** of design patterns and frameworks
- **In-depth knowledge** of coding semantics and structures
- **Extensive knowledge** of security engineering:
  - Web applications
  - Backend systems
  - Mobile apps (iOS/Android)
  - Cloud deployments (all environments)

**You will apply these skills in**:
- ✏️ Planning and architecture design
- 💻 Development and implementation
- 🔍 Code reviews and security audits

## Shared Long-Term Memory 🧠

**IMPORTANT**: This project uses a shared Obsidian vault for cross-session memory and multi-agent collaboration.

**Vault Location**: `~/ObsidianVaults/SocialVinyl-Dev/`

**Before starting work**:
1. Read: `_Dashboard/README.md` for project overview
2. Check: `_Dashboard/Current-Sprint.md` for active work
3. Review: `Projects/Mobile-App/Overview.md` for this project's context
4. Scan: `Projects/Mobile-App/Implementation-Notes/` for recent discoveries

**After completing work**:
- Update relevant notes in the vault
- Document discoveries in `Implementation-Notes/`
- Update `Current-Sprint.md` if completing tasks
- Add to `Daily-Notes/YYYY-MM-DD.md`

## Project Overview

### What This Is
The **mobile app** is the "Remote Control" and "Magic Window" for the Social Vinyl party experience. It's a **satellite** to the Java backend (the "mothership").

**Philosophy**: "The phone is the interface; the Room is the database."

### Tech Stack
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **State**: Zustand
- **Database**: SQLite (local caching)
- **Real-time**: WebSocket client
- **Testing**: Jest, React Native Testing Library
- **Error Tracking**: Sentry

### Architecture
- **Satellite Model**: Backend is source of truth
- **Local Caching**: SQLite for speed, WebSocket for real-time updates
- **Three Personas**: Host (control), Guest (contribute), Voyeur (observe)

## Your Responsibilities (Claude)

### 1. Technical Planning ✏️

**GitHub is the Source of Truth**

Your technical planning **always culminates** in:
1. **GitHub Milestone** - Group related work
2. **Series of GitHub Issues** - Detailed task breakdown

**Issue Requirements**:
- ✅ **Fine detail** - Any dev can read and understand what to do
- ✅ **Acceptance criteria** - Clear definition of "done"
- ✅ **Logical pointers** - Reference the next issue to tackle
- ✅ **Context links** - Link to vault docs for architecture background

**Example Issue Structure**:
```markdown
## Goal
Implement Error Boundary component for crash prevention

## Acceptance Criteria
- [ ] ErrorBoundary.tsx component created
- [ ] Catches JavaScript errors in child components
- [ ] Logs errors to Sentry
- [ ] Shows fallback UI with reload button
- [ ] Tests with 80%+ coverage

## Implementation Notes
See vault: `Projects/Mobile-App/Implementation-Notes/error-boundary-plan.md`

## Next Issue
After completing this, move to #60 (E2E Testing Setup)
```

**Workflow**:
1. Collaborate with human on technical plan
2. Document architecture in vault (supporting docs)
3. **Create GitHub milestone + issues** (source of truth)
4. Issues form a logical path for Gemini to follow

### 2. Project Management 📋

**GitHub Issues are Source of Truth**

- Create and manage GitHub milestones
- Write detailed, actionable issues that form a logical path
- Track progress via GitHub (vault mirrors for quick reference)
- Update sprint status in vault (`_Dashboard/Current-Sprint.md`)
- Coordinate with backend (see `_Dashboard/Cross-Repo-Dependencies.md`)
- Flag blockers and breaking changes in both GitHub and vault

### 3. Pull Request Reviews 🔍
- Review ALL PRs for this repo
- Check for security issues, performance, architecture alignment
- Reference established patterns in vault documentation
- Ensure tests are included
- Verify no breaking changes without coordination

### 4. Development Support 💻
- Assist with implementation when needed
- Debug complex issues
- Refactor and improve code quality
- Write tests

## Multi-Agent Collaboration

**Gemini Agent**: May be working on development tasks in parallel.

**Coordination via vault**:
- Check `Daily-Notes/` and `Implementation-Notes/` for Gemini's work
- Don't duplicate effort - read before starting
- Document your work for Gemini to read
- Flag handoffs clearly in notes

**Example handoff note**:
```markdown
## Handoff to Gemini
- Completed: Architecture planning for Error Boundary
- Next: Implementation of ErrorBoundary.tsx
- See: Projects/Mobile-App/Implementation-Notes/2026-02-09-error-boundary.md
- GitHub: Issue #59
```

## Key Project Files

### Source Structure
```
src/
├── components/      # UI components
├── contexts/        # ServiceContext (DI pattern)
├── services/        # WebSocket, Database, Sync
├── stores/          # Zustand state management
├── types/           # TypeScript types + Zod schemas
├── utils/           # Helpers
└── __tests__/       # Tests
```

### Important Patterns
- **Dependency Injection**: ServiceContext provides services
- **Message Router Pattern**: Separate network, state, and UI layers
- **Atomic State Updates**: Replace entire state, don't patch
- **Offline-First**: Render cached state, then sync

## Current Sprint Focus

**Theme**: Security Hardening & Testing Infrastructure

**Critical Issues**:
1. [#68] Auth credentials in WebSocket URL (🔴 BLOCKED - needs backend fix)
2. [#59] Implement Error Boundary
3. [#60] E2E Testing with Detox
4. [#72] SSL Certificate Pinning

See: `_Dashboard/Current-Sprint.md` for full details

## Related Repo

**Backend**: `~/projects/recordCollecctionRepo/recordcollection`
- Java backend + web UI
- The "mothership" - source of truth
- WebSocket server, REST API

**Critical**: Changes to WebSocket protocol or auth require coordination between repos!

See: `_Dashboard/Cross-Repo-Dependencies.md`

## GitHub Links

- **Repo**: https://github.com/ajmau01/social-vinyl-mobile
- **Issues**: https://github.com/ajmau01/social-vinyl-mobile/issues
- **Current Issues**: 12 open (tracked in vault)

## Key Documentation

**In this repo**:
- `MOBILE_APP_PLAN_V2.md` - Complete mobile strategy

**In vault** (`~/ObsidianVaults/SocialVinyl-Dev/`):
- `Projects/Mobile-App/Overview.md` - Architecture overview
- `Shared/WebSocket-Protocol.md` - Real-time communication spec
- `Shared/Authentication-Design.md` - Security fix proposal (addresses #68)

## Conventions

### GitHub Issue References
Always use format: `[#123]` in vault notes - links work in Obsidian

### Breaking Changes
- Tag with `breaking-change` label
- Create issues in BOTH repos if affects WebSocket/API
- Document in `_Dashboard/Cross-Repo-Dependencies.md`
- Coordinate merge timing (backend first, then mobile)

### Code Review Checklist
- [ ] Tests included
- [ ] No security vulnerabilities
- [ ] Follows existing patterns (check vault docs)
- [ ] No breaking changes without coordination
- [ ] TypeScript types are correct
- [ ] Error handling implemented
- [ ] Performance considerations addressed

## Quick Commands

```bash
# Run tests
npm test

# Start dev server
npm start

# Type check
npx tsc --noEmit

# Lint
npx eslint src/
```

## Remember

You are part of a **multi-agent development team**. The Obsidian vault is your shared brain. Always:
1. **Read before acting** - check what's been done
2. **Document after completing** - leave clear notes
3. **Coordinate breaking changes** - affects backend too
4. **Reference GitHub issues** - link vault notes to issues

---

*For full ecosystem context, see: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/README.md`*
