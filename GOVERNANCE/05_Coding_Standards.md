# Furniture GO

# Coding Standards

---

## Document Information

| Item | Value |
|------|-------|
| Document | Coding_Standards |
| Version | v1.0 |
| Status | Confirmed |
| Category | Governance |
| Owner | Product Owner |

---

# 1. Purpose

This document defines the official coding standards for the Furniture GO project.

Its purpose is to ensure that all source code remains consistent, maintainable, scalable, and easy to understand throughout the lifetime of the project.

Every developer shall follow these standards.

---

# 2. Objectives

The coding standards are designed to:

- Improve code readability.
- Maintain coding consistency.
- Reduce development errors.
- Simplify maintenance.
- Improve scalability.
- Support future expansion.
- Reduce technical debt.

---

# 3. General Principles

Furniture GO source code shall always be:

- Clean
- Readable
- Consistent
- Maintainable
- Modular
- Testable
- Reusable

Code shall prioritize clarity over cleverness.

---

# 4. Development Philosophy

Furniture GO follows these principles.

## PRD First

Business logic shall follow approved PRDs.

---

## UI First

User interface implementation shall follow approved UI specifications.

---

## Single Source of Truth

Furniture Objects are the official business data.

No module shall maintain duplicate business logic.

---

## Modular Design

Each module shall have a single responsibility.

Modules shall communicate through defined interfaces.

---

## Offline First

Version 1 shall operate without Internet connectivity.

---

# 5. Code Organization

Project structure shall remain modular.

Example:

```
src/

components/

pages/

layouts/

modules/

database/

services/

hooks/

utils/

router/

constants/

styles/

types/
```

Each folder shall have a clearly defined responsibility.

---

# 6. Naming Rules

Source code shall follow the official Naming Convention document.

Examples:

Classes

```
FurnitureObject

ProjectManager

MaterialDatabase
```

Variables

```
projectName

currentRoom

selectedFurniture
```

Functions

```
createProject()

saveProject()

generateDrawing()

calculateFormula()
```

Constants

```
APP_NAME

DEFAULT_BOARD_SIZE

MAX_PROJECT_COUNT
```

---

# 7. Function Standards

Functions shall:

- Perform one responsibility.
- Remain easy to understand.
- Be reusable.
- Avoid unnecessary complexity.

Prefer:

```
createFurnitureObject()
```

instead of

```
processEverything()
```

Functions should remain reasonably short whenever practical.

---

# 8. Class Standards

Each class shall have one primary responsibility.

Example:

```
FurnitureObject

MaterialRepository

DrawingGenerator

HardwareManager
```

Avoid creating large "God Classes" that manage unrelated responsibilities.

---

# 9. Comments

Comments shall explain **why**, not **what**.

Good Example

```cpp
// Prevent circular object references.
```

Poor Example

```cpp
// Increase i by 1.
```

Obsolete comments shall be removed.

---

# 10. Error Handling

Every module shall handle errors gracefully.

Error handling shall:

- Prevent crashes.
- Display meaningful messages.
- Preserve user data.
- Record useful logs.

Unexpected failures shall never corrupt project data.

---

# 11. Logging

Logs shall assist debugging.

Recommended log levels:

```
INFO

WARNING

ERROR

CRITICAL
```

Sensitive information shall never be written to logs.

---

# 12. Performance

Developers shall:

- Avoid unnecessary loops.
- Avoid duplicate calculations.
- Minimize memory usage.
- Reuse existing objects.
- Optimize only when necessary.

Readable code takes priority unless performance is affected.

---

# 13. Code Reuse

Developers shall reuse existing modules whenever possible.

Avoid duplicate implementations.

Shared functionality belongs in:

```
utils/

services/

shared modules
```

---

# 14. Dependency Rules

Modules shall remain loosely coupled.

Preferred dependency direction:

```
UI

↓

Business Logic

↓

Database

↓

Storage
```

Business logic shall not depend directly on UI components.

---

# 15. Security

Developers shall:

✓ Validate user input.

✓ Protect project data.

✓ Handle exceptions safely.

✓ Prevent unauthorized modifications.

Developers shall not:

✗ Hardcode passwords.

✗ Store sensitive information in plain text.

✗ Expose internal architecture unnecessarily.

---

# 16. Testing Requirements

Every completed module should support:

✓ Unit Testing

✓ Integration Testing

✓ Functional Testing

✓ Performance Testing

Critical business logic shall be verified before release.

---

# 17. Code Review

Before merging code:

✓ Follow PRD.

✓ Follow UI Specification.

✓ Follow Naming Convention.

✓ Pass Testing.

✓ Maintain readability.

✓ Avoid unnecessary complexity.

Major architectural changes require Product Owner approval.

---

# 18. Refactoring

Refactoring is encouraged when it:

- Improves readability.
- Simplifies maintenance.
- Reduces duplication.
- Improves modularity.

Refactoring shall not change approved business behavior without approval.

---

# 19. Relationship with Other Documents

Related Governance Documents:

- Project Security Classification
- Project Rules
- Naming Convention
- Document Standards
- Version Control
- Git Workflow
- Release Process
- Backup Policy
- License Policy
- AI Development Policy

This document defines the official coding standards for Furniture GO.

---

# Approval

Status: Confirmed

Version: v1.0

This document is the official Coding Standards for Furniture GO.