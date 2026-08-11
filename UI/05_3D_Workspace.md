# Furniture GO
# User Interface (UI)

# 05_3D_Workspace

---

## Document Information

| Item | Value |
|------|-------|
| Document | 05_3D_Workspace |
| Version | v2.1 |
| Status | Confirmed |
| Category | Furniture 3D Workspace |

---

# 1. Purpose

The 3D Workspace is the real-time visualization environment of Furniture GO.

It allows users to inspect furniture models, verify construction details, understand spatial relationships, and prepare projects for production.

The workspace is designed for visualization and engineering review.

It is not responsible for production calculations.

---

# 2. Target Users

Furniture GO supports two primary user roles.

## Designer

Responsible for:

- Model Inspection
- Design Verification
- Material Preview
- Presentation
- CAD Coordination

---

## Factory

Responsible for:

- Production Verification
- Installation Review
- Structure Inspection
- Measurement Reference
- Production Presentation

Factory users may inspect and measure models but shall not modify Furniture Objects through the 3D Workspace.

---

# 3. Design Philosophy

The Furniture GO 3D Workspace is designed specifically for furniture engineering and production.

The interface prioritizes:

- Structure Visualization
- Production Verification
- Installation Understanding
- Easy Navigation
- High Performance

Photorealistic rendering is secondary.

The primary objective is helping users understand furniture construction.

The 3D Workspace is a visualization environment.

It shall never modify engineering or production data.

---

# 4. Screen Layout

Desktop Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Toolbar                                                                  │
├──────────────────┬──────────────────────────────┬────────────────────────────┤
│ Project Explorer │                              │ Information Panel          │
│                  │                              │                            │
│ Project          │                              │ Furniture Information      │
│ Room             │         3D Viewport          │ Material Summary           │
│ Furniture Tree   │                              │ Hardware Summary           │
│ Views            │                              │ Visibility                 │
├──────────────────┴──────────────────────────────┴────────────────────────────┤
│ Bottom Status Bar                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

iPad Layout

```text
Top Toolbar

↓

Collapsible Project Explorer

↓

3D Viewport

↓

Floating Information Panel

↓

Bottom Quick Toolbar
```

The layout shall remain consistent across supported platforms.

---

# 5. Project Explorer

The Project Explorer displays the current Project hierarchy.

```text
Project

↓

Room

↓

Furniture

↓

3D Views
```

Example:

```text
ABC Residence

├── Kitchen
│     ├── Base Cabinet
│     ├── Wall Cabinet
│     ├── Tall Cabinet
│     └── Island Cabinet
│
├── Master Bedroom
│     └── Wardrobe
│
└── Living Room
      └── TV Cabinet
```

Selecting a Furniture object automatically focuses the camera on the selected model.

---

# 6. 3D Viewport

The center workspace displays the furniture model.

Supported navigation includes:

- Orbit
- Pan
- Zoom
- Fit View
- Reset View
- Walkthrough
- First Person View
- Section View
- Exploded View

Navigation affects visualization only.

Supported input devices include:

- Mouse
- Keyboard
- Touch
- Apple Pencil

---

# 7. Top Toolbar

The toolbar includes:

- Home View
- Camera
- Section View
- Exploded View
- Production Mode
- Material Display
- Screenshot
- Print
- Full Screen
- Settings

The toolbar shall remain simple and production-oriented.

---

# 8. Information Panel

The Information Panel is read-only.

It displays:

- Furniture Name
- Material Summary
- Hardware Summary
- Object Visibility
- Measurements
- Rendering Information
- Project Status

Editing Furniture information shall always open:

UI06 — Furniture Object Editor.

---

# 9. Bottom Status Bar

Displays:

- Current View
- Selection Count
- Rendering Quality
- Synchronization Status
- Camera Position
- FPS (Optional)

The Status Bar shall remain visible.

---

# 10. Visualization Tools

Supported visualization tools include:

- Show Objects
- Hide Objects
- Isolate Selected Object
- Transparency
- Wireframe
- Solid View
- Shadow
- Lighting
- Background
- Material Preview
- Section View
- Exploded View

Visualization tools shall never modify project data.

---

# 11. Measurement

Users may inspect:

- Width
- Height
- Depth
- Distance

Measurements displayed inside the 3D Workspace are intended for engineering verification.

Accurate production measurements remain inside the CAD Workspace.

---

# 12. Production Mode

The 3D Workspace provides a dedicated Production Mode.

Production Mode reorganizes the model according to the manufacturing sequence.

Typical sequence:

```text
Cabinet Structure

↓

Shelves

↓

Drawers

↓

Doors

↓

Hardware

↓

Installation Preview
```

Each stage may be displayed independently.

Production Mode is intended for:

- Designer
- Factory

Production Mode affects visualization only.

No engineering or production data shall be modified.

---

# 13. Furniture Navigation

Selecting a Furniture Object shall:

- Highlight the object
- Focus the camera
- Display object information

Double-clicking a Furniture Object opens:

UI06 — Furniture Object Editor.

The 3D Workspace shall never edit Furniture Objects directly.

---

# 14. Navigation

Project Dashboard

↓

3D Workspace

↓

Furniture Object Editor

↓

CAD Workspace

↓

Production Drawing

Users may switch freely between workspaces while remaining inside the same Project.

---

# 15. Performance

The 3D Workspace shall remain responsive for large furniture projects.

Rendering quality shall be adjustable.

Model synchronization shall occur automatically whenever Project data changes.

Only changed model data shall be refreshed whenever possible.

---

# 16. Future Expansion

Future versions may support:

- AR
- VR
- Walkthrough Recording
- Real-time Ray Tracing
- Cloud Presentation
- Cloud Rendering
- Multi-user Review
- Client Presentation Mode

Future capabilities shall integrate without redesigning the workspace.

---

# 17. Relationship with PRD

This UI corresponds to the following PRDs:

- PRD04 — Target Users
- PRD05 — User Workflow
- PRD06 — Project System
- PRD11 — Furniture Object Engine
- PRD28 — CAD Generation and Editing System
- PRD29 — Furniture 3D Modeling System
- PRD30 — Furniture Object Editing System

The 3D Workspace is responsible only for visualization.

Furniture editing shall always be performed through the Furniture Object Editing System.

---

# 18. Design Principles

The 3D Workspace shall follow these principles:

1. Visualization First
2. Production-Oriented
3. High Performance
4. Real-Time Synchronization
5. Read-Only Engineering Data
6. Familiar Navigation
7. Furniture Industry Focus
8. Offline First

The 3D Workspace helps users understand the Project visually.

It shall never perform production calculations or modify engineering data.

---

# Approval

Status: Confirmed

Version: v2.1

This document is the official UI specification for the Furniture GO 3D Workspace.