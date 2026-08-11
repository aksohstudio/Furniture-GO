# Furniture GO
# User Interface (UI)

# 02_Project_Dashboard

---

## Document Information

| Item | Value |
|------|-------|
| Document | 02_Project_Dashboard |
| Version | v2.0 |
| Status | Confirmed |
| Category | Project Dashboard |

---

# 1. Purpose

The Project Dashboard is the central workspace of every Furniture GO project.

It provides a complete overview of the project's engineering status, production readiness, and workflow progress.

The Project Dashboard serves as the command center of the entire project.

All engineering and production modules are accessed from this interface.

The Project Dashboard shall never perform engineering calculations.

It is responsible only for displaying project information and guiding users through the complete workflow.

---

# 2. Target Users

Furniture GO supports two primary user roles.

## Designer

Responsible for:

- Reviewing Designer Drawings
- Project Recognition
- Site Survey
- Backup PDF Editing
- CAD Editing
- Project Confirmation

---

## Factory

Responsible for:

- Production Review
- Engineering Review
- Material Generation
- Cutting Generation
- Hardware Generation
- Production Preparation

Both user roles share the same Dashboard layout.

Available functions depend on user permissions.

---

# 3. Design Philosophy

The Project Dashboard shall provide users with a complete understanding of the project at a glance.

Users should immediately know:

- Current Project Status
- Current Engineering Status
- Production Readiness
- Pending Tasks
- Production Review Items
- Recent Activities

The Dashboard shall minimize unnecessary navigation.

Every important project operation shall begin from this screen.

---

# 4. Screen Layout

Desktop Layout

```text
┌───────────────────────────────────────────────────────────────┐
│ Top Navigation                                                │
├──────────────┬────────────────────────────────────────────────┤
│ Project Tree │ Project Workflow                              │
│              │                                                │
│ Rooms        │ Workflow Cards                                │
│ Cabinets     │                                                │
│              │ Project Summary                               │
│              │                                                │
│              │ Production Readiness                          │
│              │                                                │
├──────────────┼────────────────────────────────────────────────┤
│ Recent       │ Statistics                                    │
│ Activities   │                                                │
└──────────────┴────────────────────────────────────────────────┘
```

iPad Layout

```text
Top Navigation

↓

Project Information

↓

Workflow Cards

↓

Room / Cabinet List

↓

Project Summary

↓

Recent Activities
```

The layout shall automatically adapt to different display sizes.

---

# 5. Project Information

The Dashboard header shall display:

- Project Name
- Client (Optional)
- Project Status
- Last Modified
- Current Revision
- Production Readiness

Users may rename the Project if permitted.

The current Project shall remain visible at all times.

---

# 6. Project Tree

The Project Tree displays the engineering structure of the current Project.

Hierarchy:

```text
Project

↓

Room

↓

Furniture

↓

Module

↓

Component
```

Selecting any item refreshes the Dashboard.

Only information related to the selected object shall be displayed.

The Project Tree serves as the primary navigation method inside a Project.

---

# 7. Project Workflow

The Project Dashboard shall display the complete engineering and production workflow.

Workflow sequence:

```text
Original PDF

↓

Project Recognition

↓

Production Review

↓

Backup PDF

↓

Site Survey

↓

Project Confirmation

↓

Generate Production Data

↓

CAD Workspace

↓

Production Drawing Workspace

↓

Cutting List

↓

Purchase List

↓

Ready for Production
```

Every workflow stage shall remain visible throughout the Project lifecycle.

The Dashboard shall always indicate:

- Current Stage
- Completed Stages
- Pending Stages
- Next Recommended Action

---

# 8. Workflow Cards

Each workflow stage shall be displayed as an individual Workflow Card.

Each card shall display:

- Stage Name
- Current Status
- Progress Indicator
- Last Updated Time
- Responsible User (Optional)

Selecting a Workflow Card opens the corresponding workspace.

Workflow Cards guide users naturally through the complete project lifecycle.

---

# 9. Workflow Status

Each Workflow Card shall display one of the following states:

- Not Started
- In Progress
- Waiting for Review
- Waiting for Site Survey
- Waiting for Confirmation
- Ready
- Completed
- Error

Status shall always be represented using:

- Text
- Icons
- Colours

Colour alone shall never be used as the only indicator.

---

# 10. Production Review

The Dashboard shall display a summary of all Production Review items.

Examples include:

- Missing Information
- Dimension Conflicts
- Geometry Conflicts
- Hardware Conflicts
- Factory Rule Differences
- Manual Confirmation Required

The Dashboard shall display:

- Total Review Items
- Completed Review Items
- Remaining Review Items

Selecting the Production Review Card opens the complete Review List.

---

# 11. Backup PDF

The Dashboard shall display the current Backup PDF status.

Examples include:

- Original PDF Imported
- Backup PDF Created
- Backup PDF Updated
- Waiting for Confirmation
- Locked

Users may open the Backup PDF directly from the Dashboard.

The Original PDF shall remain read-only.

All engineering annotations shall be recorded inside the Backup PDF.

---

# 12. Site Survey

The Dashboard shall display the Site Survey progress.

Examples include:

- Not Started
- In Progress
- Completed

Site Survey information may include:

- Measurements
- Site Notes
- Photos
- Observations

Selecting the Site Survey Card opens the Site Survey Workspace.

---

# 13. Project Confirmation

The Dashboard shall display the current Project Confirmation status.

Examples include:

- Waiting for Designer
- Waiting for Factory
- Waiting for Owner
- Confirmed
- Locked

Only confirmed Projects may proceed to Production Generation.

The Dashboard shall clearly indicate whether the Project is ready for production.

---

# 14. Project Summary

The Dashboard shall display a Project Summary panel.

The Project Summary provides a high-level overview of the current Project.

Examples include:

- Total Rooms
- Total Furniture
- Total Modules
- Total Components
- Total Hardware Items
- Production Readiness
- Current Revision
- Last Modified

The Project Summary shall update automatically whenever the Project changes.

---

# 15. Production Readiness

The Dashboard shall display the overall Production Readiness of the Project.

Examples include:

- Ready for Production
- Waiting for Review
- Waiting for Site Survey
- Waiting for Confirmation
- Missing Information
- Engineering Incomplete

Production Readiness shall be determined automatically from the current Project status.

Users shall immediately understand whether production may begin.

---

# 16. Statistics

The Dashboard shall display engineering and production statistics.

Examples include:

Engineering

- Total Rooms
- Total Furniture
- Total Components
- Total Drawings

Production

- Material Items
- Cutting Boards
- Hardware Items
- Production Drawings

Review

- Total Review Items
- Completed
- Remaining

Statistics are for reference only.

They shall never perform engineering calculations.

---

# 17. Recent Activities

The Dashboard shall display recent Project activities.

Examples include:

- Designer PDF Imported
- Project Recognition Completed
- Production Review Generated
- Site Survey Updated
- Backup PDF Modified
- Project Confirmed
- Material List Generated
- Production Drawings Regenerated

Activities shall be displayed in chronological order.

Users may open the related module directly from an activity record.

---

# 18. Quick Actions

The Dashboard shall provide Quick Actions for frequently used operations.

Examples include:

- Open Original PDF
- Open Backup PDF
- Open Production Review
- Open Site Survey
- Open CAD Workspace
- Open Production Drawings
- Open Cutting List
- Open Purchase List
- Generate Production Data

Only actions available to the current user shall be displayed.

Unavailable actions shall remain hidden or disabled according to user permissions.

---

# 19. Top Navigation

The Top Navigation shall remain visible throughout the Dashboard.

It shall contain:

- Back to Project Home
- Current Project Name
- Search
- Engineering Database
- Settings

Future versions may additionally include:

- Notifications
- Activity Center
- User Profile

The Top Navigation shall provide fast access to frequently used functions.

---

# 20. Bottom Status Bar

The Bottom Status Bar shall display current Project information.

Examples include:

- Current User
- Current Project
- Current Revision
- Last Saved Time
- Offline Status
- Application Version

The Status Bar shall update automatically whenever Project information changes.

It shall remain visible without interfering with the main workspace.

---

# 21. Navigation

The Project Dashboard serves as the central navigation hub of every Project.

Users may navigate directly to:

- Project Recognition Workspace
- Production Review
- Backup PDF
- Site Survey
- Project Confirmation
- CAD Workspace
- Furniture Object Workspace
- 3D Workspace
- Production Drawing Workspace
- Cutting List Workspace
- Purchase List Workspace
- Project Settings

Users may return to the Project Dashboard from any workspace.

The Dashboard shall always preserve the current Project context.

---

# 22. Performance

The Project Dashboard shall remain responsive under normal operating conditions.

The system shall:

- Load Project information efficiently.
- Refresh Dashboard information automatically.
- Update only modified sections.
- Avoid unnecessary Project reloading.
- Maintain smooth navigation between workspaces.

Large Projects shall remain responsive through incremental loading where applicable.

---

# 23. Future Expansion

The Dashboard architecture shall support future expansion without redesign.

Future capabilities may include:

- Project Timeline
- Task Assignment
- Team Collaboration
- Production Schedule
- Notifications
- Approval Workflow
- KPI Dashboard
- AI Assistant
- Cloud Synchronization

Future modules shall integrate into the existing Dashboard architecture.

---

# 24. Relationship with PRD

This UI corresponds to the following PRDs:

- PRD04 — Target Users
- PRD05 — User Workflow
- PRD06 — Project System
- PRD07 — Cabinet Intelligence System
- PRD08 — Factory Configuration System
- PRD09 — Project Recognition and Analysis System
- PRD10 — Project Confirmation System
- PRD11 — Furniture Object Engine
- PRD20 — Import and Export System
- PRD21 — Project Execution System
- PRD22 — Database Architecture System
- PRD26 — Production Formula Engine
- PRD27 — Production Drawing Output System
- PRD28 — CAD Generation and Editing System
- PRD29 — Furniture 3D Modeling System
- PRD30 — Furniture Object Editing System

The Project Dashboard coordinates user access to engineering and production workspaces.

Business logic shall never be implemented inside the Dashboard.

---

# 25. Design Principles

The Project Dashboard shall follow these principles:

1. Project-Centric
2. Workflow-Oriented
3. Engineering First
4. Production Ready
5. Simple Navigation
6. Consistent User Experience
7. Responsive Layout
8. Offline First
9. Modular Architecture
10. Professional Workspace

The Dashboard shall always guide users naturally through the complete Furniture GO engineering and production workflow.

---

# Approval

Status: Confirmed

Version: v2.0

This document is the official UI specification for the Furniture GO Project Dashboard.