# Furniture GO

# Project Rules

---

## Document Information

| Item | Value |
|------|-------|
| Document | Project_Rules |
| Version | v1.0 |
| Status | Confirmed |
| Category | Governance |
| Owner | Product Owner |

---

# 1. Purpose

This document defines the official project rules for Furniture GO.

Its purpose is to establish a consistent development methodology, decision-making process, documentation standard, and engineering discipline for the entire project.

All project members shall comply with these rules throughout the lifecycle of Furniture GO.

---

# 2. Objectives

The project rules are designed to:

- Maintain a consistent product direction.
- Protect engineering quality.
- Prevent uncontrolled development.
- Ensure maintainability.
- Improve long-term scalability.
- Reduce unnecessary redesign.
- Preserve project knowledge.

---

# 3. Core Principles

Furniture GO follows the principles below.

---

## PRD First

No feature shall be developed before its corresponding PRD has been approved.

---

## UI First

User interface design shall be completed before implementation begins.

---

## Single Source of Truth

Furniture Objects are the single source of truth.

No module shall maintain independent business data.

---

## Offline First

Version 1 shall operate without Internet connectivity.

Cloud functionality belongs to future versions.

---

## Modular Architecture

Every system shall remain independent.

Communication shall occur only through officially defined interfaces.

---

## Simplicity

Build only what furniture factories actually require.

Avoid unnecessary complexity.

---

# 4. Development Workflow

Furniture GO follows the workflow below.

```
Requirement

↓

Discussion

↓

PRD

↓

Product Owner Approval

↓

UI Specification

↓

Development

↓

Testing

↓

Bug Fix

↓

Release
```

Development shall never bypass this workflow.

---

# 5. Decision Authority

The Product Owner has final authority over:

- Product Direction
- Feature Scope
- PRD Approval
- UI Approval
- Architecture Decisions
- Version Scope
- Release Approval

Technical discussions are encouraged, but final decisions belong to the Product Owner.

---

# 6. Change Management

Changes shall follow the process below.

```
Proposal

↓

Discussion

↓

Impact Analysis

↓

Approval

↓

PRD Update

↓

UI Update

↓

Implementation
```

No undocumented change shall be implemented.

---

# 7. Development Rules

Developers shall:

✓ Follow approved PRDs.

✓ Follow approved UI specifications.

✓ Write maintainable code.

✓ Keep modules independent.

✓ Maintain project consistency.

Developers shall not:

✗ Implement undocumented features.

✗ Modify architecture without approval.

✗ Introduce conflicting business logic.

✗ Bypass the Furniture Object Engine.

---

# 8. Documentation Rules

Every major system shall include:

- PRD
- UI Specification
- Sprint Plan
- Source Code
- Testing Documentation

Documentation shall always be updated before implementation.

---

# 9. Quality Standards

All development shall satisfy the following requirements.

- Stable
- Maintainable
- Readable
- Expandable
- Testable
- Modular
- Consistent

Quality shall never be sacrificed for development speed.

---

# 10. Product Scope

Version 1 includes:

✓ Project Management

✓ Project Recognition

✓ CAD Workspace

✓ Furniture Object Engine

✓ 3D Workspace

✓ Production Drawing

✓ Cutting List

✓ Purchase List

Version 1 does not include:

✗ Cloud Services

✗ ERP

✗ Inventory

✗ CRM

✗ Supplier Management

✗ AI Assistance

---

# 11. Coding Discipline

Developers shall:

- Follow project architecture.
- Reuse existing modules whenever possible.
- Minimize duplicated code.
- Use meaningful names.
- Keep functions focused.
- Keep modules loosely coupled.

Large architectural changes require Product Owner approval.

---

# 12. Testing Rules

Every completed module shall pass:

✓ Functional Testing

✓ Integration Testing

✓ Performance Testing

✓ Stability Testing

✓ Acceptance Testing

No module shall enter Release without passing all required tests.

---

# 13. Version Control

Every significant change shall be documented.

Each release shall include:

- Version Number
- Change Log
- Release Notes

Official releases shall remain reproducible.

---

# 14. Communication Rules

All project discussions shall remain:

- Professional
- Objective
- Solution-oriented
- Documented

Product decisions shall always be recorded in the official documentation.

---

# 15. Release Rules

A version may be released only when:

✓ All Sprint objectives are completed.

✓ All PRDs are implemented.

✓ All UI specifications are implemented.

✓ No Critical Bugs remain.

✓ Product Owner approves the release.

---

# 16. Future Expansion

Future versions shall continue following the same governance process.

New modules shall not require redesign of existing architecture.

Version 2 and beyond shall preserve compatibility with the established engineering principles whenever practical.

---

# 17. Relationship with Other Documents

Related Governance Documents:

- Project Security Classification
- Naming Convention
- Document Standards
- Version Control
- Coding Standards
- Git Workflow
- Release Process
- Backup Policy
- License Policy
- AI Development Policy

This document defines the official project governance rules for Furniture GO.

---

# Approval

Status: Confirmed

Version: v1.0

This document is the official Project Rules for Furniture GO.