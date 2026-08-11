# Furniture GO
# User Interface (UI)

# 01_Project_Home

---

## Document Information

| Item | Value |
|------|-------|
| Document | 01_Project_Home |
| Version | v2.1 |
| Status | Confirmed |
| Category | Project Home |

---

# 1. Purpose

The Project Home is the main entry point of Furniture GO.

It functions as the Project Manager of the application.

Every Project is treated as an independent engineering folder.

Users select a Project before entering the engineering and production workflow.

The Project Home is responsible only for project management.

It shall never display engineering details or production calculations.

---

# 2. Target Users

Furniture GO supports two primary user roles.

## Designer

Responsible for:

- Creating Projects
- Importing Designer Projects
- Opening Existing Projects

---

## Factory

Responsible for:

- Opening Projects
- Managing Production Projects
- Continuing Production Work

Both roles share the same Project Home interface.

Available functions depend on user permissions.

---

# 3. Design Philosophy

The Project Home shall behave like a professional Project Manager.

It is similar in concept to:

- Windows Explorer
- Apple Files
- Finder

Every Project is treated as an independent folder.

Engineering information is not displayed until the Project is opened.

The interface shall remain:

- Simple
- Fast
- Professional
- Touch Friendly
- Mouse Friendly
- Keyboard Friendly

---

# 4. Screen Layout

Desktop

```text
┌──────────────────────────────────────────────┐
│ Top Navigation                               │
├──────────────────────────────────────────────┤
│                                              │
│              Project List                    │
│                                              │
│  📁 ABC Residence                            │
│  📁 Villa Project                            │
│  📁 Condo A-18-05                            │
│  📁 Office Renovation                        │
│                                              │
├──────────────────────────────────────────────┤
│ Bottom Quick Actions                         │
└──────────────────────────────────────────────┘
```

iPad

```text
Top Navigation

↓

Project Cards

↓

Quick Actions
```

The layout shall automatically adapt to screen size.

---

# 5. Top Navigation

The Top Navigation shall contain:

- Furniture GO Logo
- New Project
- Search
- Engineering Database
- Settings

Future versions may additionally include:

- Notifications
- User Profile
- Activity Center

The navigation shall remain visible at all times.

---

# 6. Project List

Every Project shall appear as a Project Card.

Each Project Card shall display:

- Project Name
- Project Status
- Last Opened Time
- Current Revision

Optional information may include:

- Client Name
- Designer Name
- Project Thumbnail

The Project Home shall never display:

- Rooms
- Furniture
- Modules
- Components
- Production Details

Those belong to the Project Dashboard.

Projects shall be sorted by default using:

Most Recently Opened.

Additional sorting options include:

- Project Name
- Creation Date
- Status

---

# 7. Project Status

Every Project shall display one workflow status.

Examples include:

- Imported
- Project Recognition
- Production Review
- Waiting Site Survey
- Waiting Confirmation
- Ready for Production
- In Production
- Completed
- Archived

Status shall always be represented by both text and colour.

---

# 8. Quick Actions

Quick Actions provide access to common application functions.

Examples include:

- New Project
- Import Designer Project
- Engineering Database
- Factory Reference Database
- Settings

Future versions may additionally support:

- Project Templates
- Recent Projects
- Help Center
- Cloud Synchronization

---

# 9. Navigation

Selecting a Project opens:

UI02 — Project Dashboard

Selecting New Project opens:

Project Creation Wizard

Selecting Import opens:

Designer Project Import

Selecting Engineering Database opens:

Official Engineering Knowledge Base

Factory Reference Database

Selecting Settings opens:

Project Settings

---

# 10. User Interaction

Users may:

- Open Project
- Create Project
- Import Designer Project
- Rename Project
- Duplicate Project
- Archive Project
- Delete Project
- Search Project
- Filter Projects

Desktop users may:

- Double Click to Open

Touch devices shall support:

- Single Tap
- Long Press

The Project Home shall never edit Project contents.

---

# 11. Empty State

When no Projects exist,

the interface shall display:

- Furniture GO Logo
- "No Projects"
- Create New Project
- Import Existing Project

The Empty State shall guide first-time users.

---

# 12. Performance

The Project Home shall:

- Open quickly.
- Support smooth scrolling.
- Display large numbers of Projects efficiently.
- Update search results immediately.

Only Project information shall be loaded.

Project contents shall load after opening the Project.

---

# 13. Future Expansion

Future versions may support:

- Favorites
- Project Categories
- Tags
- Team Projects
- Shared Projects
- Project Templates
- Recent Activity

These additions shall not require redesigning the Project Home.

---

# 14. Relationship with PRD

This UI corresponds to:

- PRD04 — Target Users
- PRD05 — User Workflow
- PRD06 — Project System
- PRD20 — Import and Export System
- PRD21 — Project Execution System
- PRD22 — Database Architecture System

The Project Home manages Projects only.

Engineering information begins after entering the Project Dashboard.

---

# 15. Design Principles

The Project Home shall follow these principles:

1. Project First
2. Folder-Oriented
3. Fast Navigation
4. Simple User Experience
5. Responsive Layout
6. Offline First
7. Professional Appearance
8. Separation of Project and Engineering

The Project Home shall never display engineering details.

Engineering begins inside the Project Dashboard.

---

# Approval

Status: Confirmed

Version: v2.1

This document is the official UI specification for the Furniture GO Project Home.