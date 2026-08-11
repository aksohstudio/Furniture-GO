# Furniture GO
# User Interface (UI)

# 03_Project_Recognition_Workspace

---

## Document Information

| Item | Value |
|------|-------|
| Document | 03_Project_Recognition_Workspace |
| Version | v2.0 |
| Status | Confirmed |
| Category | Project Recognition Workspace |

---

# 1. Purpose

The Project Recognition Workspace is the first engineering workspace of every Furniture GO project.

Its purpose is to understand the Designer Project before any production preparation begins.

The workspace allows users to:

- View the Original PDF
- Review AI Recognition Results
- Resolve Production Review Items
- Edit the Backup PDF
- Record Site Survey Information
- Prepare the Project for Production

The Project Recognition Workspace shall never generate production documents.

It is responsible only for project understanding, engineering review, and project confirmation.

---

# 2. Target Users

Furniture GO supports two primary user roles.

## Designer

Responsible for:

- Importing Designer Projects
- Reviewing Original PDF
- Editing Backup PDF
- Site Survey
- Project Confirmation
- CAD Editing

---

## Factory

Responsible for:

- Reviewing Recognition Results
- Production Review
- Engineering Confirmation
- Site Measurements
- Project Confirmation

Both roles share the same workspace.

Available tools depend on user permissions.

---

# 3. Design Philosophy

The Project Recognition Workspace shall focus on the engineering drawing.

The drawing is the primary working area.

The interface shall maximize drawing visibility.

Tools shall remain hidden unless required.

The workspace shall resemble professional engineering applications such as:

- GoodNotes
- Concepts
- Bluebeam Revu

The engineering drawing shall always receive the highest visual priority.

---

# 4. Screen Layout

Desktop

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Top Navigation                                                      │
├──────────────┬────────────────────────────────────────────┬─────────┤
│ Project Tree │              PDF Workspace                 │ Review  │
│              │                                            │ Panel   │
│ Rooms        │                                            │         │
│ Cabinets     │              Backup PDF                    │ Notes   │
│              │                                            │ Issues  │
│              │                                            │ History │
├──────────────┴────────────────────────────────────────────┴─────────┤
│ Floating Drawing Toolbar                                            │
└─────────────────────────────────────────────────────────────────────┘
```

iPad

```text
Top Navigation

↓

Full Screen PDF

↓

Floating Toolbar

↓

Slide-out Review Panel
```

The PDF Workspace shall occupy approximately 80–90% of the available screen area.

---

# 5. Top Navigation

The Top Navigation shall contain:

- Back to Dashboard
- Project Name
- Current Revision
- Recognition Status
- Save
- Search
- Settings

Future versions may additionally support:

- Notifications
- Collaboration
- User Profile

The Top Navigation shall remain compact.

---

# 6. Project Tree

The left navigation panel displays the Project hierarchy.

Hierarchy:

```text
Project

↓

Recognition Summary

↓

Production Review

↓

Backup PDF

↓

Site Survey

↓

Project Confirmation

↓

Rooms

↓

Furniture
```

Example:

```text
ABC Residence

├── Recognition Summary
├── Production Review
├── Backup PDF
├── Site Survey
├── Project Confirmation

Rooms

├── Kitchen
│     ├── Base Cabinet
│     ├── Wall Cabinet
│     └── Island
│
├── Master Bedroom
│     └── Wardrobe
│
├── Living Room
│     └── TV Cabinet
```

Selecting any item refreshes the PDF Workspace.

The Project Tree serves as the primary navigation method inside the Recognition Workspace.

---

# 7. PDF Workspace

The PDF Workspace is the central working area.

The PDF shall occupy most of the screen.

Users shall be able to:

- Zoom
- Pan
- Rotate
- Fit Width
- Fit Page
- Full Screen

The workspace shall support:

- Mouse
- Keyboard
- Touch
- Apple Pencil

The PDF shall remain readable at every zoom level.

Engineering drawings shall never be obscured by permanent toolbars.

---

# 8. Original PDF

The Original PDF is the official drawing received from the Designer.

The Original PDF shall remain permanently read-only.

Users may:

- View
- Zoom
- Rotate
- Search
- Measure (Reference Only)

Users shall never:

- Draw
- Modify
- Delete
- Replace Dimensions
- Save Changes

The Original PDF serves as the permanent project record.

Every imported Designer PDF shall remain archived throughout the Project lifecycle.

---

# 9. AI Recognition

Immediately after importing the Original PDF,

Furniture GO shall begin automatic Project Recognition.

Recognition includes:

- Drawing Classification
- Room Recognition
- Furniture Recognition
- Cabinet Recognition
- Dimension Recognition
- Material Recognition
- Hardware Recognition
- Drawing Correlation
- Duplicate Detection
- Missing Information Detection
- Conflict Detection

Recognition progress shall be displayed in real time.

Users may continue reviewing the Project while recognition is running.

---

# 10. Recognition Summary

After Project Recognition is completed,

the workspace shall display a Recognition Summary.

Examples include:

Project

- Total Pages
- Drawing Types
- Recognition Status

Engineering

- Rooms
- Furniture
- Cabinets
- Components

Recognition

- Missing Information
- Duplicate Information
- Recognition Confidence
- Recognition Warnings

The summary provides users with an overview before engineering review begins.

---

# 11. Production Review

The Production Review panel summarizes all engineering issues detected during Project Recognition.

Examples include:

- Missing Dimensions
- Missing Materials
- Missing Hardware
- Drawing Conflicts
- Factory Rule Differences
- Recognition Warnings
- Manual Confirmation Required

Each item shall display:

- Severity
- Location
- Description
- Current Status

Selecting an item automatically opens the corresponding location in the Backup PDF.

---

# 12. Backup PDF

The Backup PDF is the official engineering working copy.

The Backup PDF shall be generated automatically after importing the Original PDF.

Unlike the Original PDF,

the Backup PDF is fully editable.

Users may:

- Draw
- Highlight
- Add Text
- Add Dimensions
- Add Symbols
- Add Arrows
- Add Site Notes
- Insert Photos
- Record Measurements
- Mark Production Notes

Every engineering modification shall be recorded inside the Backup PDF.

The Original PDF shall never be modified.

---

# 13. Floating Drawing Toolbar

The Drawing Toolbar shall remain floating.

It shall never permanently occupy screen space.

Typical tools include:

- Select
- Pen
- Highlighter
- Text
- Arrow
- Rectangle
- Circle
- Dimension
- Camera
- Stamp
- Eraser
- Undo
- Redo

Users may collapse or expand the toolbar at any time.

The toolbar shall be optimized for:

- Mouse
- Touch
- Apple Pencil

Drawing tools shall never obstruct important drawing content.

---

# 14. Annotation System

Annotations may be attached anywhere on the Backup PDF.

Supported annotation types include:

- Text Notes
- Dimension Corrections
- Production Notes
- Site Notes
- Warning Notes
- Question Marks
- Approval Marks
- Photos

Each annotation automatically records:

- User
- Date
- Time

Annotations remain editable until the Project is confirmed.

---

# 15. Auto Save

The Backup PDF shall automatically save user changes.

Examples include:

- New Annotation
- Dimension Modification
- Drawing
- Photo Insertion
- Site Note

Auto Save shall occur without interrupting user workflow.

Unexpected application shutdowns shall not result in significant engineering data loss.

---

# 16. Site Survey

The Site Survey records the actual conditions found on site.

All Site Survey information shall be stored within the current Project.

Examples include:

- Actual Measurements
- Wall Conditions
- Ceiling Conditions
- Floor Levels
- Beam Locations
- Column Locations
- Window Positions
- Door Positions
- Installation Restrictions
- Transportation Notes

Users may also attach:

- Photos
- Videos (Future)
- Voice Notes (Future)
- Sketches

Site Survey information becomes part of the Project record.

---

# 17. Measurement Editing

Measurements recorded during the Site Survey shall be edited directly on the Backup PDF.

Examples include:

- Replace Existing Dimensions
- Add Missing Dimensions
- Highlight Incorrect Dimensions
- Record Actual Measurements

Original Designer dimensions shall remain visible when required.

Modified measurements shall be clearly distinguished from the original drawing.

Every measurement modification shall be recorded automatically.

---

# 18. Project Confirmation

After:

- Project Recognition
- Production Review
- Backup PDF Updates
- Site Survey

have been completed,

users shall perform Project Confirmation.

Users may confirm:

- Dimensions
- Materials
- Hardware
- Construction Methods
- Production Decisions

Only confirmed Projects may proceed to Production Data Generation.

After confirmation,

the current Backup PDF becomes the official Project Revision.

---

# 19. Revision Management

Every confirmed Backup PDF creates a new Project Revision.

Each revision shall record:

- Revision Number
- Revision Date
- Modified By
- Revision Notes

Previous revisions shall remain available.

Users may compare revisions for reference.

Historical revisions shall never be overwritten.

---

# 20. Review Panel

The Review Panel shall remain collapsible.

Typical sections include:

- Recognition Summary
- Production Review
- Notes
- Site Survey
- Revision History

The panel shall slide in only when required.

The PDF Workspace shall always remain the primary focus.

---

# 21. History

Every engineering action shall be recorded.

Examples include:

- Imported Designer PDF
- AI Recognition Completed
- Added Annotation
- Updated Dimension
- Inserted Photo
- Added Site Note
- Confirmed Production Decision
- Locked Project Revision

History shall be displayed in chronological order.

Users may jump directly to the related PDF location from a history entry.

---

# 22. Quick Actions

The Project Recognition Workspace shall provide quick access to common engineering functions.

Examples include:

- Open Original PDF
- Open Backup PDF
- View Recognition Summary
- Open Production Review
- Open Site Survey
- Compare Revisions
- Lock Current Revision

Only actions available to the current user shall be displayed.

Unavailable actions shall remain hidden or disabled according to user permissions.

---

# 23. Navigation

The Project Recognition Workspace serves as the engineering review center of every Project.

Users may navigate directly to:

- Original PDF
- Recognition Summary
- Production Review
- Backup PDF
- Site Survey
- Project Confirmation
- CAD Workspace
- Project Dashboard

The current Project context shall always be preserved.

Users may return to the Project Dashboard at any time.

---

# 24. Performance

The Project Recognition Workspace shall remain responsive while handling large engineering drawings.

The system shall support:

- Large PDF files
- Multi-page projects
- High-resolution drawings
- Smooth zooming
- Smooth panning
- Real-time annotation

Only the currently visible pages shall be rendered whenever possible to improve performance.

Background loading shall be used for large projects.

---

# 25. Future Expansion

The Project Recognition Workspace shall support future expansion without redesign.

Future capabilities may include:

- AI Recognition Improvement
- Automatic Dimension Verification
- Automatic Drawing Comparison
- Voice Annotation
- Video Annotation
- Team Collaboration
- Cloud Synchronization
- AI Engineering Assistant

Future features shall integrate into the existing workspace without changing the overall interface.

---

# 26. Relationship with PRD

This UI corresponds to the following PRDs:

- PRD04 — Target Users
- PRD05 — User Workflow
- PRD06 — Project System
- PRD08 — Factory Configuration System
- PRD09 — Project Recognition and Analysis System
- PRD10 — Project Confirmation System
- PRD11 — Furniture Object Engine
- PRD17 — Official Engineering Knowledge Base
- PRD18 — Factory Reference Database System
- PRD19 — AI Recognition Database System
- PRD20 — Import and Export System
- PRD21 — Project Execution System
- PRD22 — Database Architecture System
- PRD28 — CAD Generation and Editing System

The Project Recognition Workspace prepares engineering information before production begins.

No production calculations shall be performed within this workspace.

Production calculations belong to the Production Formula Engine.

---

# 27. Design Principles

The Project Recognition Workspace shall follow these principles:

1. Drawing First
2. Project Recognition before Production
3. Original PDF Never Changes
4. Backup PDF Is the Only Editable Drawing
5. Maximize Drawing Visibility
6. Floating Tools
7. Touch Friendly
8. Apple Pencil Friendly
9. Offline First
10. Professional Engineering Workflow

The engineering drawing shall always remain the primary working area.

User interface elements shall never permanently obstruct the drawing.

---

# Approval

Status: Confirmed

Version: v2.0

This document is the official UI specification for the Furniture GO Project Recognition Workspace.