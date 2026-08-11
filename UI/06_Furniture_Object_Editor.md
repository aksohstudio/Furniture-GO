# Furniture GO
# User Interface (UI)

# 06_Furniture_Object_Editor

---

## Document Information

| Item | Value |
|------|-------|
| Document | 06_Furniture_Object_Editor |
| Version | v2.1 |
| Status | Confirmed |
| Category | Furniture Object Editor |

---

# 1. Purpose

The Furniture Object Editor is the central editing workspace of Furniture GO.

It allows users to edit Furniture Objects without directly modifying CAD geometry.

All approved modifications automatically synchronize with:

- CAD Workspace
- 3D Workspace
- Production Formula Engine
- Production Drawing System
- Project Database

The Furniture Object Editor is the only workspace responsible for editing Furniture Objects.

---

# 2. Target Users

Furniture GO supports two primary user roles.

## Designer

Responsible for:

- Create Furniture Objects
- Edit Furniture Objects
- Configure Materials
- Configure Doors
- Configure Drawers
- Configure Hardware
- Review Object Validation

---

## Factory

Responsible for:

- View Furniture Objects
- Review Furniture Information
- Inspect Production Configuration

Factory users may view Furniture Objects but shall not modify them.

Only Designers may edit Furniture Objects.

---

# 3. Design Philosophy

The Furniture Object Editor is built around Furniture Objects rather than CAD entities.

Users edit furniture itself.

The system automatically updates every connected module.

The interface shall remain:

- Visual
- Simple
- Professional
- Furniture-oriented
- Object-oriented

The Furniture Object Editor shall always remain the single source of editable furniture data.

---

# 4. Screen Layout

Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Toolbar                                                                  │
├──────────────────┬──────────────────────────────┬────────────────────────────┤
│ Furniture Tree   │ Visual Object Editor         │ Live Preview               │
│                  │                              │                            │
│ Project          │ General                      │                            │
│ Room             │ Dimensions                   │                            │
│ Furniture        │ Materials                    │        3D Preview          │
│ Module           │ Doors                        │                            │
│ Component        │ Drawers                      │                            │
│ Hardware         │ Hardware                     │                            │
│                  │ Formula                      │                            │
│                  │ Notes                        │                            │
├──────────────────┴──────────────────────────────┴────────────────────────────┤
│ Bottom Status Bar                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

iPad

```text
Top Toolbar

↓

Furniture Tree

↓

Visual Property Editor

↓

Live Preview

↓

Bottom Quick Toolbar
```

The layout shall remain consistent across supported platforms.

---

# 5. Furniture Tree

The Furniture Tree displays the complete Project hierarchy.

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

↓

Hardware
```

Selecting any object immediately loads its editable information.

Only properties applicable to the selected object shall be displayed.

---

# 6. Visual Object Editor

The editor is divided into logical sections.

Supported sections include:

- General
- Dimensions
- Materials
- Doors
- Drawers
- Hardware
- Formula Information
- Notes

Only relevant sections shall be displayed according to the selected object.

---

# 7. Visual Dimension Editing

Dimensions shall be edited visually whenever possible.

Example

```text
      Cabinet

┌──────────────┐
│              │
│              │
│              │
└──────────────┘

← 600 →

↑
720
```

Users may click any displayed dimension directly.

After confirmation,

the following systems update automatically:

- Furniture Object
- CAD Workspace
- 3D Workspace
- Production Formula Engine
- Production Drawing System

Manual synchronization shall never be required.

---

# 8. Material Editor

Users may configure:

- Board Material
- Board Thickness
- Edge Banding
- Surface Finish
- Wood Grain Direction

Material selection shall reference the Official Material Database.

---

# 9. Door Editor

Supported properties include:

- Door Type
- Opening Direction
- Door Thickness
- Door Material
- Handle
- Hinge
- Soft Close
- Glass Panel (Optional)

Changing a Door automatically updates every connected system.

---

# 10. Drawer Editor

Supported properties include:

- Drawer Type
- Drawer Slide
- Soft Close
- Internal Height
- Front Panel
- Opening Method
- Drawer Material

Changes synchronize automatically after confirmation.

---

# 11. Hardware Editor

Supported hardware includes:

- Hinges
- Drawer Slides
- Handles
- Lift Systems
- Legs
- Connectors
- Accessories

Hardware selections shall reference the Official Hardware Database.

---

# 12. Formula Information

The Formula section displays:

- Material Formula
- Production Formula
- Hardware Formula
- Calculation Status

Formula information is provided for reference only.

Editing production formulas belongs to the Production Formula Engine.

---

# 13. Live Preview

The right panel displays a live 3D preview.

Supported functions include:

- Rotate
- Pan
- Zoom
- Section View
- Exploded View

The preview updates automatically after every confirmed modification.

---

# 14. Synchronization

All approved modifications automatically synchronize with:

- Project Database
- CAD Workspace
- 3D Workspace
- Production Formula Engine
- Production Drawing System

Manual synchronization shall never be required.

---

# 15. Validation

The Furniture Object Editor validates:

- Missing Material
- Missing Hardware
- Invalid Dimensions
- Formula Errors
- Relationship Errors
- Database Reference Errors

Detected issues shall be displayed immediately.

Users shall resolve validation issues before production generation.

---

# 16. Top Toolbar

The toolbar includes:

- Save
- Undo
- Redo
- Duplicate Object
- Delete Object
- Add Module
- Refresh
- Settings

Toolbar organization shall remain simple and consistent.

---

# 17. Navigation

Project Dashboard

↓

Furniture Object Editor

↓

CAD Workspace

↓

3D Workspace

↓

Production Drawing

Users may freely switch between workspaces while remaining inside the same Project.

---

# 18. Performance

The Furniture Object Editor shall remain responsive for large Projects.

Object updates shall synchronize automatically.

The Live Preview shall refresh without noticeable delay.

Only modified objects shall be regenerated whenever possible.

---

# 19. Future Expansion

Future versions may support:

- Template Library
- Smart Objects
- Batch Editing
- Favorites
- Reusable Furniture Modules
- AI Recommendations
- Custom Furniture Templates
- Quick Edit Panel

Future capabilities shall integrate without redesigning the Furniture Object Editor.

---

# 20. Relationship with PRD

This UI corresponds to the following PRDs:

- PRD04 — Target Users
- PRD05 — User Workflow
- PRD06 — Project System
- PRD11 — Furniture Object Engine
- PRD26 — Production Formula Engine
- PRD27 — Production Drawing System
- PRD28 — CAD Generation and Editing System
- PRD29 — Furniture 3D Modeling System
- PRD30 — Furniture Object Editing System

The Furniture Object Editor is the only workspace responsible for editing Furniture Objects.

CAD geometry, production formulas and visualization are synchronized automatically through the Furniture Object Engine.

---

# 21. Design Principles

The Furniture Object Editor shall follow these principles:

1. Object-Oriented Editing
2. Single Source of Truth
3. Automatic Synchronization
4. Visual Editing
5. Professional Workflow
6. Furniture Industry Focus
7. High Performance
8. Offline First

Furniture Objects represent the engineering data of the Project.

They are the foundation of every connected Furniture GO system.

---

# Approval

Status: Confirmed

Version: v2.1

This document is the official UI specification for the Furniture GO Furniture Object Editor.