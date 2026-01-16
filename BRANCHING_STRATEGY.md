# Frontend Branching Strategy

## Overview

This repository uses a two-branch strategy to separate design/Figma work from active development.

## Branches

### `main` (Protected Branch)

- **Purpose**: Stable, production-ready code integrated with Figma Make
- **Who uses it**: Figma Make environment for UI/UX design integration
- **Status**: Only receives PRs from `dev` branch
- **Protection rules**:
  - Requires PR review before merge
  - Requires passing CI/CD checks

### `dev` (Active Development)

- **Purpose**: Development, bug fixes, features, and improvements
- **Who uses it**: Development team
- **Status**: Main branch for day-to-day work
- **PR target**: Create feature branches from `dev`, merge back via PR

## Workflow

### For New Features/Bug Fixes

```bash
# Start from dev
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit, and push
git add .
git commit -m "feat: description"
git push -u origin feature/my-feature

# Create PR to dev (not main!)
# After review and tests pass, merge to dev
```

### When Ready for Figma Integration

```bash
# Create PR from dev to main
# This goes through code review and testing
# Once approved, merge to main
# main is now updated with latest stable code
```

## CI/CD Integration

- **Dev branch**: Runs tests, linting, and builds
- **Main branch**: Runs full test suite + deployment to production/staging
- **Feature branches**: Run tests before allowing merge to dev

## Branch Protection Settings

### Main Branch

- ✅ Require pull request reviews before merging (1+ reviews)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Dismiss stale PR approvals when new commits are pushed
- ❌ Do not allow direct pushes (force push protection)

### Dev Branch  

- ✅ Require pull request reviews before merging (1 review minimum)
- ✅ Require status checks to pass before merging
- ❌ Allow direct pushes for hotfixes (optional, for flexibility)

## Key Rules

1. **Never commit directly to `main`** - always use PRs from `dev`
2. **Never commit directly to `dev`** - always use feature branches with PRs
3. **Keep `main` clean** - it should always be deployable
4. **Test before merging** - ensure all CI checks pass
5. **Review before merging** - have at least one person review code changes

## Syncing Branches

```bash
# Keep dev updated with any main changes
git checkout dev
git pull origin main
git push origin dev

# Keep main updated with dev changes (via PR)
git checkout main
git pull origin dev
git push origin main
```

## Questions?

If you have questions about this branching strategy, please ask!
