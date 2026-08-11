# Furniture GO
# Product Requirement Document (PRD)

# 04_Target_Users

---

## Document Information

| Item | Value |
|------|-------|
| Document | 04_Target_Users |
| Version | v3.0 |
| Status | Confirmed |
| Category | User Roles |

---

# 1. Overview

Furniture GO is designed around two primary user roles.

Each role follows a different workflow and has different responsibilities.

The system provides dedicated workspaces based on user roles.

Each workspace displays only the functions required for that role.

This keeps Furniture GO simple, efficient, and easy to learn.

---

# 2. User Roles

Furniture GO supports two primary user roles.

- Designer
- Factory

Each role has independent permissions and responsibilities.

The system shall not expose unnecessary functions to users outside their responsibilities.

---

# 3. Designer Workspace

The Designer Workspace focuses on design review, site verification, and project updates.

Typical users include:

- Interior Designer
- Architect
- Project Designer

Main responsibilities include:

- Import Designer Documents
- View Original Designer PDF
- View Editable Project PDF
- Review Recognition Report
- Perform Site Survey
- Update Dimensions
- Add Notes
- Record Site Conditions
- Review Engineering Issues
- Export Updated Project PDF

The Designer Workspace prepares project information.

It shall never generate production documents.

---

# 4. Factory Workspace

The Factory Workspace focuses on engineering review and production preparation.

Typical users include:

- Factory Owner
- Furniture Contractor
- Production Manager
- Project Manager

Main responsibilities include:

- Receive Designer Projects
- Review Recognition Report
- Review Engineering Information
- View Designer Documents
- Query Dimensions
- Confirm Project
- Generate Production Documents
- Review Production Results
- Export and Print Production Documents

The Factory Workspace shall never modify the Original Designer Documents or Designer CAD.

---

# 5. Designer Permissions

The Designer role shall have permission to:

- Import Designer Documents
- View Original Designer Documents
- View Editable Project PDF
- Review Recognition Report
- Perform Site Survey
- Update Dimensions
- Add Project Notes
- Record Site Conditions
- Review Engineering Issues
- Export Updated Project PDF

The Designer role shall not have permission to:

- Generate Material Lists
- Generate Hardware Lists
- Generate Cutting Lists
- Generate Manufacturing Requirements
- Generate Shop Drawings
- Generate Quotations
- Generate Project Packages

The Designer Workspace is intended only for project preparation and engineering confirmation.

---

# 6. Factory Permissions

The Factory role shall have permission to:

- Receive Designer Projects
- View Original Designer Documents
- View Editable Project PDF
- Review Recognition Reports
- Review Engineering Information
- Query Dimensions
- Confirm Projects
- Generate Production Documents
- Review Production Results
- Export Production Documents
- Print Production Documents

The Factory role shall not have permission to:

- Modify Original Designer Documents
- Modify Designer CAD Drawings
- Modify Original Designer Dimensions

All production calculations shall be performed only after Project Confirmation.

---

# 7. Role Separation

Furniture GO shall maintain clear separation between Designer and Factory responsibilities.

Designer responsibilities include:

- Design Preparation
- Site Survey
- Project Updates
- Engineering Confirmation

Factory responsibilities include:

- Engineering Review
- Project Confirmation
- Production Preparation
- Production Document Generation

Neither role shall perform the responsibilities assigned to the other.

---

# 8. Workspace Principles

Each workspace shall display only the tools required for its corresponding role.

The Designer Workspace shall focus on:

- Reviewing
- Annotating
- Updating
- Confirming

The Factory Workspace shall focus on:

- Reviewing
- Confirming
- Generating
- Exporting

This separation reduces operational errors and simplifies the user experience.

---

# 9. Project Ownership

Every Project shall clearly distinguish between design ownership and production ownership.

The Designer shall own:

- Original Designer Documents
- Editable Project PDF
- Site Survey Information
- Engineering Notes

The Factory shall own:

- Project Confirmation
- Production Documents
- Production Results
- Manufacturing Information
- Project Package

Both roles shall collaborate using the same Project while maintaining independent responsibilities.

---

# 10. Document Protection

Furniture GO shall protect all Original Designer Documents.

The Factory Workspace may:

- View Designer Documents
- Query Dimensions
- View Designer Notes

The Factory Workspace shall never:

- Modify Original Designer Documents
- Modify Designer CAD Drawings
- Overwrite Designer Dimensions

All production modifications shall be recorded separately within the confirmed Project information.

The Original Designer Documents shall remain permanently unchanged.

---

# 11. Permission Model

Furniture GO shall apply permissions according to the assigned user role.

Permissions include:

- View
- Update
- Confirm
- Generate
- Export
- Print

The system shall display only the functions available to the current role.

Unauthorized functions shall remain inaccessible.

Permission management shall be enforced consistently across all modules.

---

# 12. Future Expansion

The User Role framework shall support future expansion without changing the core workflow.

Future capabilities may include:

- Team Collaboration
- Shared Projects
- Multi-user Access
- Cloud Synchronization
- Additional Permission Levels

Future extensions shall remain compatible with the Designer and Factory role model.

The standard Furniture GO workflow shall continue to support two primary user roles.

---

# 13. Security and Reliability

Furniture GO shall protect the responsibilities of every user role.

The system shall never allow:

- Factory users to modify Original Designer Documents.
- Factory users to modify Designer CAD Drawings.
- Factory users to overwrite Designer Dimensions.
- Designer users to generate production documents.
- Designer users to modify production calculation results.

All user actions shall follow the assigned role permissions.

If a user attempts to perform an unauthorized action, Furniture GO shall deny the request and notify the user.

---

# 14. Design Principles

The User Role System shall follow these principles:

1. Two Primary User Roles
2. Responsibility-Based Access
3. Simple and Clear Workspaces
4. Designer Owns Design Information
5. Factory Owns Production Information
6. Read-Only Protection for Original Designer Documents
7. Role-Based Permission Management
8. No Automatic Permission Escalation
9. Fully Offline Operation
10. Expandable Through Future Permission Modules

---

# 15. Scope

This PRD defines only the User Role System.

The following systems are defined separately:

- User Workflow
- Project System
- Furniture Intelligence Engine
- Project Recognition and Analysis Engine
- Project Confirmation System
- Furniture Object Engine
- Official Engineering Knowledge Base
- Factory Reference Database System
- AI Recognition Database System
- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Furniture Shop Drawing Generation Engine
- Project Document Package Engine

The User Role System defines only user responsibilities, permissions, and workspace access.

Engineering, recognition, project management, and production processes are handled by their respective systems.

---

# 16. Approval

Status: Confirmed

Version: v3.0

This document is the official specification of the Furniture GO User Role System.