# Furniture GO
# User Interface (UI)

# 04_CAD_Workspace

---

## Document Information

| Item | Value |
|------|-------|
| Document | 04_CAD_Workspace |
| Version | v2.1 |
| Status | Confirmed |
| Category | CAD Workspace |

---

# 1. Purpose

The CAD Workspace is the primary working environment for furniture designers.

It provides professional 2D CAD editing while remaining fully integrated with the Furniture GO ecosystem.

The CAD Workspace is responsible for graphical editing only.

Production calculations, furniture data management, and manufacturing logic are handled by their respective systems.

---

# 2. Target Users

Furniture GO supports two primary user roles.

## Designer

Responsible for:

- CAD Creation
- CAD Editing
- DWG Import
- DWG Export
- Drawing Management
- Printing

---

## Factory

Responsible for:

- View CAD
- Measure CAD
- Print CAD

Factory users shall not modify CAD drawings.

Only authorized Designers may edit CAD drawings.

---

# 3. Design Philosophy

The Furniture GO CAD Workspace combines professional CAD workflows with furniture industry workflows.

The interface shall remain familiar to experienced AutoCAD users while introducing Furniture GO Project integration.

The workspace shall prioritize:

- Speed
- Precision
- Stability
- Minimal Learning Curve

The CAD Workspace edits drawings only.

Furniture data shall remain managed by the Furniture Object System.

---

# 4. Screen Layout

Desktop Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Top Toolbar                                                                 │
├──────────────────┬──────────────────────────────┬───────────────────────────┤
│ Project Explorer │                              │ Properties Panel          │
│                  │                              │                           │
│ Project          │                              │ CAD Properties            │
│ Room             │         CAD Canvas           │ or                        │
│ Furniture Tree   │                              │ Furniture Information     │
│ Drawings         │                              │                           │
├──────────────────┴──────────────────────────────┴───────────────────────────┤
│ Command Line / Status Bar                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

iPad Layout

```text
Top Toolbar

↓

Collapsible Project Explorer

↓

CAD Canvas

↓

Floating Properties Panel

↓

Bottom Quick Toolbar
```

The layout shall remain familiar to professional CAD users.

---

# 5. Project Explorer

The left panel displays the complete Project hierarchy.

```text
Project

↓

Room

↓

Furniture

↓

CAD Drawings
```

Example:

```text
ABC Residence

├── Kitchen
│
│   ├── Furniture
│   │
│   │   ├── Base Cabinet
│   │   ├── Wall Cabinet
│   │   ├── Tall Cabinet
│   │   └── Island Cabinet
│   │
│   └── Drawings
│       ├── Plan
│       ├── Elevation
│       ├── Section
│       └── Detail
│
├── Master Bedroom
│
└── Living Room
```

Selecting a Furniture object highlights the corresponding CAD object.

Selecting a Drawing loads the selected drawing.

---

# 6. CAD Canvas

The CAD Canvas is the primary drawing workspace.

Supported operations include:

- Draw
- Modify
- Move
- Copy
- Rotate
- Mirror
- Offset
- Trim
- Extend
- Stretch
- Hatch
- Measure
- Snap
- Pan
- Zoom

Supported input devices:

- Mouse
- Keyboard
- Touch
- Apple Pencil

---

# 7. Top Toolbar

The Top Toolbar includes:

- New Drawing
- Open
- Save
- Undo
- Redo
- Import DWG
- Export DWG
- Print
- Layer Manager
- Dimension
- Properties
- Settings

Toolbar organization shall remain similar to traditional CAD software.

---

# 8. Properties Panel

The Properties Panel supports two modes.

## CAD Properties

Displays:

- Layer
- Line Type
- Line Weight
- Color
- Dimension Style
- Visibility
- Lock Status

---

## Furniture Information (Read Only)

Displays:

- Furniture Name
- Material
- Board Thickness
- Door Type
- Drawer Type
- Hardware Summary
- Formula Status
- Production Status

Furniture information is read-only.

Editing Furniture data shall always open:

UI06 — Furniture Object Editor.

---

# 9. Command Line / Status Bar

Displays:

- Current Command
- Cursor Coordinates
- Grid Status
- Snap Status
- Drawing Scale
- Selection Count
- Current Layer

The Status Bar shall remain visible throughout editing.

---

# 10. Drawing Tools

Supported tools include:

- Line
- Polyline
- Rectangle
- Circle
- Arc
- Spline
- Offset
- Trim
- Extend
- Mirror
- Rotate
- Move
- Copy
- Stretch
- Array
- Dimension
- Leader
- Text
- Table
- Hatch
- Measure
- Selection

Future drawing tools may be added without redesigning the interface.

---

# 11. Measurement

Measurement tools include:

- Linear
- Aligned
- Radius
- Diameter
- Angle
- Area
- Distance

Designer may edit CAD drawings.

Factory users may measure drawings but shall not edit CAD geometry.

---

# 12. Layer Manager

Supported functions include:

- Create Layer
- Rename Layer
- Delete Layer
- Lock Layer
- Unlock Layer
- Hide Layer
- Show Layer
- Layer Color
- Line Type

Layer changes update immediately.

---

# 13. Furniture Navigation

Furniture Objects appear inside the Project Explorer.

Selecting a Furniture object shall:

- Highlight the corresponding CAD geometry
- Center the drawing
- Display Furniture Information

Double-clicking a Furniture object opens:

UI06 — Furniture Object Editor.

Furniture information shall never be edited directly inside the CAD Workspace.

---

# 14. Navigation

Project Dashboard

↓

CAD Workspace

↓

Furniture Object Editor

↓

3D Workspace

↓

Production Drawing

Users may freely switch between workspaces while remaining inside the same Project.

---

# 15. Performance

The CAD Workspace shall remain responsive for large furniture projects.

Typical operations include:

- Zoom
- Pan
- Layer Switching
- Furniture Selection
- Drawing Regeneration

All operations shall remain smooth under supported hardware.

---

# 16. Future Expansion

Future versions may support:

- Plugin System
- AI Drawing Assistant
- Script Automation
- Block Library
- Dynamic Components
- Cloud Collaboration

Future capabilities shall integrate without redesigning the CAD Workspace.

---

# 17. Relationship with PRD

This UI corresponds to the following PRDs:

- PRD04 — Target Users
- PRD05 — User Workflow
- PRD06 — Project System
- PRD11 — Furniture Object Engine
- PRD27 — Production Drawing System
- PRD28 — CAD Generation and Editing System
- PRD29 — Furniture 3D Modeling System
- PRD30 — Furniture Object Editing System

The CAD Workspace is responsible only for graphical editing.

Furniture data shall always be managed through the Furniture Object Editing System.

---

# 18. Design Principles

The CAD Workspace shall follow these principles:

1. Professional CAD Workflow
2. Graphical Editing Only
3. Project-Oriented
4. High Precision
5. Stable Performance
6. Familiar User Experience
7. Furniture Industry Focus
8. Offline First

The CAD Workspace edits drawings.

It does not perform production calculations or modify engineering logic.

---

# Approval

Status: Confirmed

Version: v2.1

This document is the official UI specification for the Furniture GO CAD Workspace.