# Project Workflow: Social Vinyl Mobile

## Guiding Principles

1. **The Plan is the Source of Truth:** All work must be tracked in `plan.md`.
2. **Branching Strategy:** **NEVER** commit directly to the `main` branch. All new work must be performed on a dedicated feature branch (e.g., `feat/issue-description`).
3. **Pull Requests:** All changes must be merged via a Pull Request (PR). Every PR must undergo a code review and manual testing before merging.
4. **Test-Driven Development:** Write unit tests before implementing functionality.
5. **High Code Coverage:** Aim for >80% code coverage for all modules.
6. **Non-Interactive & CI-Aware:** Prefer non-interactive commands. Use `CI=true` for watch-mode tools.

## Task Workflow

### Standard Task Workflow

1. **Create Feature Branch:** Before starting a new task or phase, create a branch from `main`.
   ```bash
   git checkout main && git pull && git checkout -b feat/task-name
   ```

2. **Mark In Progress:** Edit `plan.md` and change the task status from `[ ]` to `[~]`.

3. **TDD Cycle (Red/Green/Refactor):**
   - Write failing tests.
   - Implement minimum code to pass.
   - Refactor for quality.

4. **Verify Coverage:** Target >80% coverage for all new code.

5. **Phase Completion Commits:**
   - Instead of committing after every individual task, work through the tasks in a Phase.
   - Once a **Phase** is complete, stage all changes.
   - **Commit Message Summary:** Include a detailed summary of the phase's changes directly in the commit message.

6. **Update Plan:** Mark tasks as `[x]` in `plan.md` and record the commit SHA of the phase completion.

### PR and Merge Protocol

1. **Push to Remote:** Push the feature branch to the repository.
2. **Create Pull Request:** Open a PR against the `main` branch.
3. **Review & Test:** 
   - Request a code review.
   - Perform manual smoke tests (e.g., in Expo Go or iOS Simulator).
4. **Merge:** Only merge the PR into `main` after explicit approval and successful verification.

## Development Commands (Expo/React Native)

### Setup
```bash
npm install
```

### Daily Development
```bash
npx expo start         # Start dev server
npx expo test          # Run tests (if configured)
npx expo lint          # Run linter
```

## Definition of Done

A task/phase is complete when:
1. Implementation matches the specification.
2. All tests pass with >80% coverage.
3. Code is reviewed via a Pull Request.
4. Feature is manually verified on a mobile device (Expo Go/Simulator).
5. Branch is merged into `main`.
