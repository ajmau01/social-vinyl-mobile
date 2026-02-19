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
1. **GLOBAL CONTEXT**: Read `~/ObsidianVaults/SocialVinyl-Dev/000-Atlas.md` (MANDATORY).
2. Read: `_Dashboard/README.md` for project overview
3. Check: `_Dashboard/Current-Sprint.md` for active work
4. Review: `Projects/Mobile-App/Overview.md` for this project's context
5. Scan: `Projects/Mobile-App/Implementation-Notes/` for recent discoveries

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

**Status**: Feb 14, 2026
**Active Milestone**: [Milestone 12: Phase 9 - Advanced Collection Features](https://github.com/ajmau01/social-vinyl-mobile/milestone/12)
**Theme**: Complete Collection Browsing Experience

### Recent Accomplishments ✅

**Phase 8 (Visual Design Parity) - COMPLETE** (Feb 13-14, 2026)
- All 8 issues merged (#100-107)
- Compact scrollable chips, collapsible search, bookmark overlay
- Now Playing footer overhaul, SessionDrawer sync migration
- Mobile app now has full visual parity with web app

**Security Hardening - MOSTLY COMPLETE**
- 8 of 9 issues complete
- WebSocket auth migrated to secure message-based protocol (#68 ✅)
- Token storage in SecureStore (#67 ✅)
- Session timeout implemented (#69 ✅)
- Only #72 (SSL pinning) blocked on production domain

### Current Work: Phase 9 (Feb 17 - Mar 3, 2026)

**Objective**: Implement final 3 view modes + random album feature

**Issues Ready for Gemini**:
1. **[#119]** Implement 'New' and 'Saved' View Modes (HIGH priority, 3 days) ⭐ START HERE
2. **[#120]** Random LP/Dice Button (MEDIUM priority, 1 day)
3. **[#121]** 'Spin' View Mode (BLOCKED on backend [#242](https://github.com/ajmau01/recordcollection/issues/242))

**Reference Issue**:
- **[#115]** Phase 9.1 Overview (parent issue with full context)

### Key Documentation Created (Feb 14, 2026)

**In Vault** (`~/ObsidianVaults/SocialVinyl-Dev/`):
- ✅ `_Dashboard/Roadmap-to-v1.0.md` - Complete strategic roadmap (8,000+ words)
- ✅ `_Dashboard/Quick-Start-Phase-9.md` - Instant reference for Phase 9 work
- ✅ `Projects/Mobile-App/Phase-9-Implementation-Plan.md` - Technical implementation guide
- ✅ `_Dashboard/Cross-Repo-Dependencies.md` - Updated with backend #242 coordination

**In GitHub**:
- ✅ Issues #119, #120, #121 created with 200+ lines each (complete implementation details)
- ✅ Backend issue [recordcollection#242](https://github.com/ajmau01/recordcollection/issues/242) created
- ✅ All issues cross-linked with comments

**In Project**:
- ✅ `GEMINI.md` updated with Phase 9 rollout details (developer briefing)

### What to Review (When Resuming)

**Before reviewing PRs or planning next work**:
1. Read: `_Dashboard/Current-Sprint.md` - Current status
2. Read: `_Dashboard/Roadmap-to-v1.0.md` - Strategic context (Milestones 12-17 defined)
3. Check: Gemini's implementation notes in `Projects/Mobile-App/Implementation-Notes/`
4. Review: PRs for issues #119, #120 (when Gemini completes them)

**Backend Coordination**:
- Backend issue [#242](https://github.com/ajmau01/recordcollection/issues/242) blocks mobile #121
- Track status in `_Dashboard/Cross-Repo-Dependencies.md`
- Coordinate production deployment timing

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
- **Current Milestone**: https://github.com/ajmau01/social-vinyl-mobile/milestone/12
- **Backend Repo**: https://github.com/ajmau01/recordcollection
- **Backend Coordination Issue**: https://github.com/ajmau01/recordcollection/issues/242

## Key Documentation

**In this repo**:
- `MOBILE_APP_PLAN_V2.md` - Complete mobile strategy

**In vault** (`~/ObsidianVaults/SocialVinyl-Dev/`):
- `Projects/Mobile-App/Overview.md` - Architecture overview
- `Projects/Mobile-App/Phase-9-Implementation-Plan.md` - **NEW** Current work (Feb 2026)
- `_Dashboard/Roadmap-to-v1.0.md` - **NEW** Strategic roadmap to production (Feb 2026)
- `_Dashboard/Quick-Start-Phase-9.md` - **NEW** Quick reference for Phase 9 (Feb 2026)
- `Shared/WebSocket-Protocol.md` - Real-time communication spec
- `Shared/Authentication-Design.md` - Security fix proposal (now implemented)

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

## Phase 9 Handoff (Feb 14, 2026)

**What Was Completed Today**:
- ✅ Comprehensive strategic roadmap to v1.0 created (Milestones 12-17)
- ✅ Milestone 12 (Phase 9) created with 4 issues
- ✅ Issues #119, #120, #121 created with complete implementation details (840+ lines total)
- ✅ Backend coordination issue [#242](https://github.com/ajmau01/recordcollection/issues/242) created
- ✅ All documentation committed to vault (5 documents, 10,000+ words)
- ✅ GEMINI.md updated with developer briefing
- ✅ All cross-linking complete (GitHub ↔ Vault)

**Next Steps for Gemini** (Developer):
1. Read `_Dashboard/Quick-Start-Phase-9.md`
2. Implement issue #119 (New/Saved views - 3 days)
3. Implement issue #120 (Random LP button - 1 day)
4. Wait for backend #242, then implement #121 (Spin view - 3 days)

**Next Steps for Claude** (You - Future Session):
1. **Review Gemini's PRs** when #119 and #120 are complete
2. **Monitor backend progress** on issue #242
3. **Coordinate deployment** when all Phase 9 work is done
4. **Plan Milestone 13** (Core Feature Parity) once Phase 9 is complete

**Critical Files to Track**:
- `_Dashboard/Current-Sprint.md` - Gemini updates this as they work
- `Projects/Mobile-App/Implementation-Notes/` - Gemini documents progress here
- `_Dashboard/Cross-Repo-Dependencies.md` - Backend coordination status

---

## Remember

You are part of a **multi-agent development team**. The Obsidian vault is your shared brain. Always:
1. **Read before acting** - check what's been done (especially `Current-Sprint.md`)
2. **Document after completing** - leave clear notes for Gemini
3. **Coordinate breaking changes** - affects backend too (see `Cross-Repo-Dependencies.md`)
4. **Reference GitHub issues** - link vault notes to issues
5. **Review the roadmap** - `Roadmap-to-v1.0.md` has the complete plan through v1.0

---

*For full ecosystem context, see: `~/ObsidianVaults/SocialVinyl-Dev/_Dashboard/README.md`*

*Last Updated: 2026-02-14 - Phase 9 planning complete, ready for Gemini implementation*
