# Furniture GO

# Git Workflow

---

## Document Information

| Item | Value |
|------|-------|
| Document | Git_Workflow |
| Version | v1.0 |
| Status | Confirmed |
| Category | Governance |
| Owner | Product Owner |

---

# 1. Purpose

This document defines the official Git workflow for the Furniture GO project.

Its purpose is to establish a consistent source code management process that supports stable development, efficient collaboration, and reliable releases.

All developers shall follow this workflow when contributing to the project.

---

# 2. Objectives

The Git workflow is designed to:

- Protect the main codebase.
- Prevent accidental code loss.
- Improve collaboration.
- Maintain project stability.
- Simplify code review.
- Support long-term development.
- Enable reliable releases.

---

# 3. Git Principles

Furniture GO follows these principles.

---

## Stable Main Branch

The **main** branch shall always remain stable.

Only tested and approved code may be merged into the main branch.

---

## Isolated Development

New work shall be developed in separate branches.

Development work shall never be performed directly on the main branch.

---

## Small Changes

Developers should commit small, focused, and meaningful changes.

Large unrelated changes shall be separated into multiple commits.

---

## Traceability

Every change shall be traceable through Git history.

Each commit shall clearly describe its purpose.

---

# 4. Branch Structure

Furniture GO uses the following branch structure.

```
main

develop

feature/*

bugfix/*

release/*

hotfix/*
```

---

## main

Purpose:

Official production releases.

Only approved code shall exist in this branch.

---

## develop

Purpose:

Primary development branch.

Completed features are merged here before release.

---

## feature/*

Purpose:

Develop individual features.

Examples:

```
feature/project-home

feature/cad-workspace

feature/furniture-object-editor
```

---

## bugfix/*

Purpose:

Resolve non-critical bugs.

Examples:

```
bugfix/pdf-render

bugfix/material-loader
```

---

## release/*

Purpose:

Prepare official releases.

Examples:

```
release/v1.0.0

release/v1.1.0
```

Only stabilization work is allowed in release branches.

---

## hotfix/*

Purpose:

Resolve critical production issues.

Examples:

```
hotfix/startup-crash

hotfix/data-loss
```

Hotfix branches shall merge into both:

- main
- develop

---

# 5. Development Workflow

Normal development follows this process.

```
Create Feature Branch

↓

Development

↓

Commit Changes

↓

Self Testing

↓

Code Review

↓

Merge into develop

↓

Integration Testing

↓

Release Branch

↓

Final Testing

↓

Merge into main

↓

Official Release
```

---

# 6. Feature Workflow

Each new feature shall follow:

```
develop

↓

feature/new-feature

↓

Development

↓

Testing

↓

Merge Request

↓

Code Review

↓

Merge into develop
```

Feature branches shall be deleted after successful merging.

---

# 7. Bug Fix Workflow

Bug fixes follow:

```
develop

↓

bugfix/issue-name

↓

Fix

↓

Testing

↓

Merge into develop
```

Critical production issues shall use the Hotfix workflow instead.

---

# 8. Release Workflow

Official releases follow:

```
develop

↓

release/v1.x.x

↓

Testing

↓

Bug Fixes

↓

Product Owner Approval

↓

Merge into main

↓

Official Release
```

No new features shall be added during the release phase.

---

# 9. Hotfix Workflow

Critical production issues follow:

```
main

↓

hotfix/issue

↓

Fix

↓

Testing

↓

Merge into main

↓

Merge into develop
```

Hotfixes shall receive the highest priority.

---

# 10. Commit Standards

Commit messages shall use the following format.

```
Category: Description
```

Examples:

```
Feature: Add Furniture Object Editor

BugFix: Fix DWG Import

Refactor: Improve Layer Manager

Docs: Update UI04

Release: Version 1.0.0
```

Commit messages shall be:

- Short
- Clear
- Descriptive

---

# 11. Merge Rules

Before merging:

✓ Code compiles successfully.

✓ Tests pass.

✓ PRD requirements are satisfied.

✓ UI specifications are satisfied.

✓ No merge conflicts remain.

✓ Code review is completed.

Only approved code may be merged.

---

# 12. Code Review

Every Merge Request shall be reviewed.

Review criteria include:

- Code Quality
- Readability
- Architecture
- Performance
- Security
- PRD Compliance
- UI Compliance

Major architectural changes require Product Owner approval.

---

# 13. Conflict Resolution

When merge conflicts occur:

1. Identify conflicting changes.

2. Resolve conflicts carefully.

3. Verify project functionality.

4. Perform testing.

5. Complete merge.

Conflicts shall never be resolved without verification.

---

# 14. Branch Protection

The following protections apply.

**main**

- Direct commits prohibited.
- Pull Request required.
- Testing required.
- Product Owner approval required.

**develop**

- Direct commits allowed only for authorized developers.

Feature, Bugfix, Release, and Hotfix branches may be created by authorized developers.

---

# 15. Version Tags

Official releases shall be tagged.

Examples:

```
v1.0.0

v1.0.1

v1.1.0

v2.0.0
```

Version tags shall correspond to released builds.

---

# 16. Repository Rules

Developers shall:

✓ Commit regularly.

✓ Push changes frequently.

✓ Keep branches updated.

✓ Delete obsolete branches.

Developers shall not:

✗ Commit unfinished experimental code to main.

✗ Rewrite published Git history without approval.

✗ Force push to protected branches.

---

# 17. Relationship with Other Documents

Related Governance Documents:

- Project Security Classification
- Project Rules
- Naming Convention
- Document Standards
- Version Control
- Coding Standards
- Release Process
- Backup Policy
- License Policy
- AI Development Policy

This document defines the official Git Workflow for Furniture GO.

---

# Approval

Status: Confirmed

Version: v1.0

This document is the official Git Workflow for Furniture GO.