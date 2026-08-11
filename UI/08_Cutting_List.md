# Furniture GO
# User Interface (UI)

# 08_Cutting_List_Workspace

---

## Document Information

| Item | Value |
|------|-------|
| Document | 08_Cutting_List_Workspace |
| Version | v2.1 |
| Status | Confirmed |
| Category | Cutting List Workspace |

---

# 1. Purpose

The Cutting List Workspace manages all cutting information required for furniture production.

It converts approved Furniture Objects into optimized cutting information for manufacturing.

The workspace focuses on:

- Cutting Lists
- Board Layout Visualization
- Material Usage
- Waste Reduction
- Production Preparation

Board optimization is performed automatically by the Cutting Optimization Engine.

This workspace is responsible for reviewing, managing and exporting cutting information.

---

# 2. Target Users

Furniture GO supports two primary user roles.

## Designer

Responsible for:

- Review Cutting Results
- Verify Board Layout
- Verify Material Usage

---

## Factory

Responsible for:

- Production Cutting
- Material Preparation
- Board Cutting
- Printing Reports
- CNC Preparation

Factory users primarily use this workspace during production.

---

# 3. Design Philosophy

The Cutting List Workspace follows a **Simple First** philosophy.

Most users only need to know:

- What to cut
- How many pieces to cut

Board layouts are displayed only when requested.

The default interface shall remain clean, simple and production-oriented.

---

# 4. View Modes

The Cutting List Workspace provides four viewing modes.

### ① Simple View (Default)

Displays:

- Part Size
- Quantity
- Material
- Thickness

---

### ② Board Layout

Displays optimized board layouts.

---

### ③ Statistics

Displays material statistics.

---

### ④ Waste Analysis

Displays optimization efficiency and waste analysis.

Users may switch between view modes at any time.

---

# 5. Screen Layout

Desktop

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Top Toolbar                                                                │
├────────────────────────────────────────────────────────────────────────────┤
│ View Mode                                          Information Panel        │
│                                                    │                       │
│ Simple View                                        │ Material Summary      │
│ Board Layout                                       │ Waste                │
│ Statistics                                         │ Progress             │
│ Waste Analysis                                     │ Cost                 │
├────────────────────────────────────────────────────┴───────────────────────┤
│ Main Workspace                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│ Bottom Status Bar                                                          │
└────────────────────────────────────────────────────────────────────────────┘
```

iPad

```text
Top Toolbar

↓

View Mode Selector

↓

Main Workspace

↓

Information Drawer

↓

Bottom Toolbar
```

The interface shall remain optimized for both desktop and touch devices.

---

# 6. Simple View (Default)

Simple View displays only production information.

Example

```text
Material

18mm White

────────────────────────

600 × 720

Quantity : 12

────────────────────────

564 × 720

Quantity : 8

────────────────────────

560 × 380

Quantity : 24

────────────────────────

764 × 140

Quantity : 12
```

Only production information required for cutting shall be displayed.

The interface shall remain clean and easy to read.

---

# 7. Expand Part Details

Selecting a cutting item expands additional information.

Example

```text
600 × 720

Quantity : 12

▼

Kitchen

Base Cabinet

Left Side Panel ×4

Wardrobe

Side Panel ×6

TV Cabinet

Side Panel ×2
```

Users may collapse the details at any time.

---

# 8. Board Layout

Board Layout displays optimized cutting layouts.

Example

```text
Board 01

2440 × 1220

┌──────────────────────┐

B01

B02

B03

██ Waste ██

└──────────────────────┘
```

Each board displays:

- Board Size
- Material
- Parts
- Grain Direction
- Waste Area

Selecting a part highlights it.

Double-clicking opens:

**UI06 — Furniture Object Editor**

---

# 9. Statistics

Displays:

- Material Type
- Board Quantity
- Total Area
- Used Area
- Remaining Area
- Estimated Cost
- Optimization Score

---

# 10. Waste Analysis

Displays:

- Waste Percentage
- Reusable Offcuts
- Scrap Area
- Optimization Efficiency
- Estimated Cost Loss

Waste shall be displayed graphically.

---

# 11. Information Panel

Displays:

- Material Name
- Board Thickness
- Board Quantity
- Current Progress
- Optimization Percentage
- Estimated Material Cost
- Current Status

The Information Panel is read-only.

---

# 12. Top Toolbar

The toolbar includes:

- Generate Cutting List
- Optimize
- Refresh
- Print
- Export PDF
- Export Excel
- Export CNC
- Settings
- View Mode

---

# 13. Printing

Users may print different report types.

Supported outputs include:

- Simple Cutting List
- Board Layout
- QR Labels
- Barcode Labels
- Waste Report
- CNC Report

Users may freely combine report types before printing.

---

# 14. Part Trace

Every cutting part remains traceable.

Selecting a part displays:

```text
Furniture

↓

Cabinet

↓

Board

↓

Production Drawing

↓

CAD Object

↓

Furniture Object
```

Users may jump directly to the originating Furniture Object.

---

# 15. Navigation

Project Dashboard

↓

Production Drawing

↓

Cutting List

↓

Purchase List

Users may freely return to previous workspaces without leaving the Project.

---

# 16. Performance

The Cutting List Workspace shall remain responsive for large Projects.

Board layouts shall support smooth:

- Zoom
- Pan
- Selection
- Search

Only modified layouts shall regenerate whenever possible.

---

# 17. Future Expansion

Future versions may support:

- Multiple Board Sizes
- AI Layout Suggestions
- Automatic Material Replacement
- Factory Machine Integration
- Offcut Inventory
- Digital Factory
- Live Machine Status
- Cloud Production

Future capabilities shall integrate without redesigning the workspace.

---

# 18. Relationship with PRD

This UI corresponds to the following PRDs:

- PRD04 — Target Users
- PRD05 — User Workflow
- PRD06 — Project System
- PRD12 — Board Generation Engine
- PRD13 — Cutting Optimization System
- PRD24 — Cutting Generation System
- PRD26 — Production Formula Engine

The Cutting List Workspace displays cutting information generated by the Cutting Optimization Engine.

Users review and export cutting information.

Board optimization belongs exclusively to the Cutting Optimization Engine.

---

# 19. Design Principles

The Cutting List Workspace shall follow these principles:

1. Simple First
2. Production-Oriented
3. Automatic Optimization
4. Read-Only Production Data
5. Easy Verification
6. High Performance
7. Furniture Industry Focus
8. Offline First

The workspace is intended for reviewing cutting information rather than editing production data.

---

# Approval

Status: Confirmed

Version: v2.1

This document is the official UI specification for the Furniture GO Cutting List Workspace.