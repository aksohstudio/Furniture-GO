# Furniture GO
# User Interface (UI)

# 09_Purchase_List_Workspace

---

## Document Information

| Item | Value |
|------|-------|
| Document | 09_Purchase_List_Workspace |
| Version | v2.1 |
| Status | Confirmed |
| Category | Purchase List Workspace |

---

# 1. Purpose

The Purchase List Workspace automatically generates purchasing information from approved Furniture Objects.

The system calculates all required materials and hardware for the current Project.

Its purpose is to help users quickly understand:

- What to purchase
- How much to purchase
- Required specifications

The Purchase List is intended for purchasing preparation only.

It does not manage suppliers, pricing, inventory or purchasing workflows.

---

# 2. Target Users

Furniture GO supports two primary user roles.

## Designer

Responsible for:

- Review Purchase List
- Verify Material Specifications
- Verify Hardware Specifications

---

## Factory

Responsible for:

- Material Purchasing
- Hardware Purchasing
- Purchase Verification
- Printing Purchase Reports

The Purchase List is primarily used during production preparation.

---

# 3. Design Philosophy

The Purchase List follows a **Simple First** philosophy.

Users should immediately understand:

- Material Name
- Specification
- Quantity

The workspace shall avoid unnecessary purchasing management functions.

The interface shall remain simple, clean and production-oriented.

---

# 4. Categories

The Purchase List is automatically organized into:

- Board Materials
- Hardware
- Accessories
- Other Materials

Users may expand or collapse each category independently.

---

# 5. Screen Layout

Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Toolbar                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Category List                    │ Purchase List                            │
│                                  │                                          │
│ Board Materials                  │ Item Name                               │
│ Hardware                         │ Specification                           │
│ Accessories                      │ Quantity                                │
│ Other Materials                  │ Unit                                    │
├──────────────────────────────────┴──────────────────────────────────────────┤
│ Bottom Status Bar                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

iPad

```text
Top Toolbar

↓

Category List

↓

Purchase List

↓

Bottom Toolbar
```

The interface shall remain consistent across supported platforms.

---

# 6. Board Materials

Displays:

- Material Name
- Board Size
- Thickness
- Quantity

Example

```text
18mm White Melamine

2440 × 1220

23 Sheets
```

Only purchasing information required by production shall be displayed.

---

# 7. Hardware

Displays:

- Hardware Name
- Model
- Quantity

Example

```text
Blum 110° Hinge

36 Pieces

Blum Tandem Slide

18 Pairs

Handle A001

24 Pieces
```

Hardware information is automatically generated from the Official Hardware Database.

---

# 8. Accessories

Displays:

- Item Name
- Specification
- Quantity

Examples include:

- ABS Edge Banding
- Glass
- Mirror
- Aluminium Frame
- Screws
- Connectors
- Adhesives
- Edge Protection

Accessories are generated automatically according to the approved Furniture Objects.

---

# 9. Top Toolbar

The toolbar includes:

- Generate Purchase List
- Refresh
- Print
- Export PDF
- Export Excel
- Settings

The Purchase List is generated automatically.

Manual quantity editing is not supported.

---

# 10. Purchase Summary

Displays:

- Board Materials
- Hardware
- Accessories
- Other Materials
- Total Purchase Items

The summary provides a quick overview of the Project purchasing requirements.

---

# 11. Navigation

Project Dashboard

↓

Production Drawing

↓

Cutting List

↓

Purchase List

↓

Project Settings

Users may freely return to previous workspaces while remaining inside the same Project.

---

# 12. Performance

The Purchase List shall regenerate automatically whenever approved Furniture Objects are updated.

Large Projects shall remain responsive.

Searching, filtering and category switching shall remain smooth.

---

# 13. Future Expansion

Future versions may support:

- Supplier Templates
- Custom Purchase Categories
- Purchase Notes
- CSV Export
- ERP Export
- Purchase Comparison
- Multi-Supplier Support
- Digital Purchasing

Future capabilities shall integrate without redesigning the Purchase List Workspace.

---

# 14. Relationship with PRD

This UI corresponds to the following PRDs:

- PRD04 — Target Users
- PRD05 — User Workflow
- PRD06 — Project System
- PRD11 — Furniture Object Engine
- PRD23 — Material Generation System
- PRD25 — Hardware Generation System
- PRD26 — Production Formula Engine

The Purchase List is automatically generated from approved Furniture Objects.

Users review, print and export purchasing information.

Material calculations belong to the Production Formula Engine.

---

# 15. Design Principles

The Purchase List Workspace shall follow these principles:

1. Simple First
2. Automatically Generated
3. Production-Oriented
4. Easy to Read
5. High Performance
6. Read-Only Purchasing Data
7. Furniture Industry Focus
8. Offline First

The Purchase List is intended for purchasing preparation only.

It does not replace purchasing management software.

---

# Approval

Status: Confirmed

Version: v2.1

This document is the official UI specification for the Furniture GO Purchase List Workspace.