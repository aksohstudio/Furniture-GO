# Furniture GO

# Version Control

---

## Document Information

| Item | Value |
|------|-------|
| Document | Version_Control |
| Version | v1.0 |
| Status | Confirmed |
| Category | Governance |
| Owner | Product Owner |

---

# 1. Purpose

This document defines the official version control policy for the Furniture GO project.

Its purpose is to ensure that every change made to the project is properly tracked, documented, and recoverable.

Version control guarantees project stability, traceability, and long-term maintainability.

All project assets shall follow this policy.

---

# 2. Objectives

The version control system is designed to:

- Track project history.
- Prevent accidental data loss.
- Maintain project stability.
- Support collaboration.
- Simplify debugging.
- Preserve historical versions.
- Enable reliable releases.

---

# 3. Version Control Principles

Furniture GO follows these principles.

---

## Single Source of Truth

The official project repository shall always be the authoritative source.

No unofficial copies shall replace the official repository.

---

## Traceability

Every significant change shall be recorded.

Every version shall be reproducible.

---

## Stability Before Release

Only verified versions may become official releases.

Experimental work shall remain isolated.

---

## Controlled Updates

Changes shall follow the official development workflow.

No undocumented modifications are permitted.

---

# 4. Version Numbering

Furniture GO follows Semantic Versioning.

```
Major.Minor.Patch
```

Example:

```
1.0.0

1.1.0

1.2.5

2.0.0
```

Meaning:

Major

Breaking architecture or product changes.

Minor

New features without breaking compatibility.

Patch

Bug fixes and optimizations.

---

# 5. Document Versioning

Every official document shall contain:

Version

Status

Revision

Example

```
Version: v1.0

Status: Confirmed

Revision: 1
```

Major document restructuring requires a new Version.

Minor edits increase the Revision number.

---

# 6. Source Code Versioning

Source code shall be organized by official releases.

Examples:

```
Version 1.0

Version 1.1

Version 1.2

Version 2.0
```

Development builds shall clearly indicate that they are not production releases.

---

# 7. Change Categories

Changes shall be classified into one of the following categories.

## Feature

New functionality.

Example:

```
Add Furniture Object Editor
```

---

## Improvement

Existing functionality is enhanced.

Example:

```
Improve CAD Rendering Performance
```

---

## Bug Fix

Correct defects.

Example:

```
Fix Board Layout Refresh Issue
```

---

## Refactoring

Improve internal implementation without changing behavior.

Example:

```
Refactor Formula Calculation Module
```

---

## Documentation

Documentation updates only.

Example:

```
Update PRD26
```

---

# 8. Change Log

Every official release shall include a Change Log.

Each entry should include:

- Version
- Date
- Category
- Summary
- Author

Example:

| Version | Category | Summary |
|----------|----------|---------|
| 1.0.0 | Feature | Initial Release |
| 1.0.1 | Bug Fix | Fixed PDF Loading Issue |
| 1.1.0 | Feature | Added Production Drawing Workspace |

---

# 9. Branch Strategy

Recommended development branches:

```
main

develop

feature/*

bugfix/*

release/*
```

Purpose:

**main**

Official production releases.

**develop**

Current development.

**feature/**

New features.

**bugfix/**

Bug fixes.

**release/**

Release preparation.

Only reviewed code may be merged into **main**.

---

# 10. Commit Standards

Commit messages shall be short and descriptive.

Recommended format:

```
Category: Description
```

Examples:

```
Feature: Add Furniture Object Editor

BugFix: Fix CAD Layer Refresh

Refactor: Simplify Material Loader

Docs: Update UI06 Specification

Release: Version 1.0.0
```

Avoid vague messages such as:

```
Update

Fix

Test

Changes
```

---

# 11. Release Process

Official releases follow the workflow below.

```
Development

↓

Internal Testing

↓

Bug Fix

↓

Release Candidate

↓

Final Approval

↓

Official Release
```

Only approved releases shall be distributed.

---

# 12. Rollback Policy

If a release introduces critical issues:

- Stop distribution immediately.
- Restore the previous stable version.
- Investigate the issue.
- Fix the problem.
- Create a new release.

Rollback shall never modify historical records.

---

# 13. Archive Policy

Every released version shall remain archived.

Archived versions shall include:

- Source Code
- Documentation
- Release Notes
- Change Log

Historical releases shall remain accessible for reference.

---

# 14. Version Compatibility

Minor and Patch releases should maintain compatibility whenever practical.

Major releases may introduce architectural changes.

Migration documentation shall be provided whenever compatibility changes.

---

# 15. Quality Requirements

Before creating an official version:

✓ Build succeeds.

✓ Tests pass.

✓ Documentation updated.

✓ Change Log completed.

✓ Release Notes completed.

✓ Product Owner approval obtained.

---

# 16. Relationship with Other Documents

Related Governance Documents:

- Project Security Classification
- Project Rules
- Naming Convention
- Document Standards
- Coding Standards
- Git Workflow
- Release Process
- Backup Policy
- License Policy
- AI Development Policy

This document defines the official Version Control policy for Furniture GO.

---

# Approval

Status: Confirmed

Version: v1.0

This document is the official Version Control policy for Furniture GO.