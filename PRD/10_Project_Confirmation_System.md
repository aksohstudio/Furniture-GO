# Furniture GO
# Product Requirement Document (PRD)

# 10_Project_Confirmation_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 10_Project_Confirmation_System |
| Version | v2.0 |
| Status | Confirmed |
| Category | Project Management System |

---

# 1. Overview

The Project Confirmation System manages project confirmation after project recognition and engineering review have been completed.

Its responsibility is to ensure that all engineering information has been confirmed before production begins.

The Project Confirmation System establishes one confirmed Engineering State for the entire project.

Furniture GO shall never perform production using unconfirmed engineering information.

Only confirmed Engineering States may enter downstream production systems.

---

# 2. Project Confirmation Workflow

Every project shall follow the confirmation workflow below.

Project Import

↓

AI Recognition Engine

↓

Engineering Record Review

↓

Furniture Object Review

↓

User Confirmation

↓

Confirm Project

↓

Engineering State Locked

↓

Production Ready

Only confirmed Engineering States may proceed to:

- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Furniture Shop Drawing Generation Engine

---

# 3. Confirm Project

After all Engineering Records and Furniture Objects have been confirmed,

the user selects:

**Confirm Project**

Furniture GO shall then:

- Lock the confirmed Engineering State.
- Save the current project version.
- Mark the project as Production Ready.
- Use the confirmed Engineering State for all downstream production systems.

Every downstream production module shall reference the same confirmed Engineering State.

---

# 4. Confirmed Engineering State

Once confirmed,

the Engineering State becomes the official production reference.

The confirmed Engineering State includes:

- Engineering Records
- Furniture Objects
- Project Structure
- User Confirmations
- Engineering References

Production modules shall never use unconfirmed Engineering States.

The Project Confirmation System ensures that every downstream production document originates from the same confirmed project version.

---

# 5. Project Modification

Confirmed projects may still be modified.

Whenever a confirmed project is modified, the Project Confirmation System shall automatically create a new Working Engineering State.

The previously confirmed Engineering State shall remain unchanged.

Every modification shall be recorded automatically.

The system shall determine:

- What has changed
- Which Furniture Objects are affected
- Which Production Formula results require regeneration
- Which downstream production documents become outdated

Previous confirmed Engineering States shall always remain available.

---

# 6. Working Engineering State

Whenever a project enters editing mode, Furniture GO shall create a Working Engineering State.

The Working Engineering State allows users to modify:

- Engineering Records
- Furniture Objects
- Project Structure
- User Confirmations

Production systems shall never use a Working Engineering State.

Only confirmed Engineering States may enter downstream production systems.

---

# 7. Engineering State History

The Project Confirmation System shall preserve every confirmed Engineering State.

Each Engineering State shall record:

- Engineering State Version
- Project Version
- Date
- Time
- User
- Change Summary (Optional)

No confirmed Engineering State shall ever be overwritten.

Complete project history shall remain available for future review.

---

# 8. Partial Regeneration

Furniture GO shall support automatic Partial Regeneration.

Whenever only part of a project changes, only the affected production data shall be regenerated.

Examples include:

- Furniture Object
- Room
- Floor
- Engineering Record

Affected downstream systems may include:

- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Furniture Shop Drawing Generation Engine

Unaffected production data shall remain unchanged.

This minimizes unnecessary regeneration while preserving project consistency.

---

# 9. Resume Processing

Whenever project processing is interrupted, Furniture GO shall automatically preserve the latest completed processing checkpoint.

Interruptions may include:

- Application Closed
- Computer Shutdown
- Power Failure
- User Pause

When the project is reopened, Furniture GO shall allow users to:

- Continue Processing
- Restart Processing

Processing shall resume from the latest completed checkpoint whenever possible.

Previously completed work shall never be repeated unnecessarily.

---

# 10. Generated Document Status

Every production document generated from a confirmed Engineering State shall contain version information.

Document information may include:

- Document Version
- Engineering State Version
- Project Version
- Generation Date
- Generation Time
- Generation ID (Optional)

Whenever a new Engineering State is confirmed, the Project Confirmation System shall automatically compare every generated document.

Documents generated from previous Engineering States shall be marked:

- Outdated

Documents generated from the latest confirmed Engineering State shall be marked:

- Latest

Users shall always know which production documents are synchronized with the current confirmed project.

---

# 11. Project Package

Every project shall automatically create one Project Package.

The Project Package shall contain all information related to the project.

Examples include:

- Original Designer Documents
- Recognition Reports
- Engineering Records
- Furniture Objects
- Production Documents
- Shop Drawings
- Project Reports
- Revision History
- Site Survey
- Site Photos

Users shall not manually organize project files.

One Project shall always correspond to one Project Package.

---

# 12. Project Revisions

One Project may contain multiple Project Revisions.

Examples include:

- Original Project
- Revision 01
- Revision 02
- Service Project
- Extension Project

Each Project Revision shall preserve its own:

- Engineering State
- Production Documents
- Shop Drawings
- Project Reports
- Revision History

Project Revisions shall remain independent while belonging to the same Project Package.

---

# 13. Project Timeline

Every Project shall automatically maintain a Project Timeline.

The Timeline records every confirmed Engineering State in chronological order.

Timeline events may include:

- Original Project
- Project Revision
- Site Modification
- Service Work
- Extension Work
- Production Confirmation

Users may open any Timeline record to review the corresponding Engineering State and all related production information.

---

# 14. Timeline Records

Every Timeline Record may contain:

- Engineering State
- Engineering Records
- Furniture Objects
- Production Documents
- Shop Drawings
- Project Reports
- Site Survey
- Site Photos
- Project Notes

The Project Confirmation System shall preserve every Timeline Record.

No historical Engineering State shall ever be overwritten.

---

# 15. Confirmation Principles

The Project Confirmation System shall manage project confirmation only.

The system shall never:

- Modify Engineering Records
- Modify Furniture Objects
- Perform Engineering Calculations
- Generate Production Boards
- Perform Cutting Optimization
- Generate Production Documents

Its responsibility is to establish one verified Engineering State that becomes the official production reference.

Every downstream production system shall reference the same confirmed Engineering State.

---

# 16. System Integration

The Project Confirmation System shall integrate with:

- AI Recognition Engine
- Official Engineering Knowledge Base
- Factory Reference Database System
- Furniture Object Engine

After project confirmation, the confirmed Engineering State shall be used by:

- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Furniture Shop Drawing Generation Engine
- Project Document Package Engine

The Project Confirmation System shall never perform engineering calculations independently.

---

# 17. Confirmation Reliability

The Project Confirmation System shall allow project confirmation only after all required engineering information has been verified.

The system shall never:

- Confirm incomplete Engineering Records
- Confirm incomplete Furniture Objects
- Confirm unresolved validation issues
- Confirm inconsistent Engineering States

If unresolved issues remain, user confirmation shall be required before the project may proceed to production.

Every confirmed Engineering State shall represent verified production information.

---

# 18. Design Principles

The Project Confirmation System shall follow these principles:

1. Engineering State Driven
2. Project Confirmation Only
3. Automatic Version Management
4. Automatic History Preservation
5. Partial Regeneration Support
6. Full Project Traceability
7. No Independent Engineering Calculations
8. No Automatic Production Decisions
9. Fully Offline Operation
10. Expandable Through Official Engineering Knowledge

---

# 19. Scope

This PRD defines only the Project Confirmation System.

The following systems are defined separately:

- AI Recognition Engine
- Official Engineering Knowledge Base
- Factory Reference Database System
- Furniture Object Engine
- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Furniture Shop Drawing Generation Engine
- Project Document Package Engine

The Project Confirmation System is responsible only for managing project confirmation, Engineering States, project versions, and production readiness.

Engineering calculations belong exclusively to the Production Formula Engine.

Engineering knowledge belongs exclusively to the Official Engineering Knowledge Base.

---

# 20. Approval

Status: Confirmed

Version: v2.0

This document is the official specification of the Furniture GO Project Confirmation System.