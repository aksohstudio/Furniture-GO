# Furniture GO
# User Interface (UI)

# 10_Project_Settings

---

## Document Information

| Item | Value |
|------|-------|
| Document | 10_Project_Settings |
| Version | v2.1 |
| Status | Confirmed |
| Category | Project Settings |

---

# 1. Purpose

The Project Settings Workspace manages Project-specific configuration for Furniture GO.

It allows users to define Project information and production preferences.

The workspace shall remain simple, clear and easy to understand.

Only settings directly related to the current Project shall be included.

The Project Settings Workspace does not perform production calculations.

---

# 2. Target Users

Furniture GO supports two primary user roles.

## Designer

Responsible for:

- Configure Project Information
- Configure Drawing Defaults
- Configure Material Defaults
- Configure Hardware Defaults
- Configure Export Preferences

---

## Factory

Responsible for:

- Review Project Settings
- Verify Production Defaults
- Confirm Factory Configuration

Factory users may review Project Settings according to their permissions.

---

# 3. Design Philosophy

Project Settings shall normally be configured when a new Project is created.

Most users should rarely need to revisit this workspace.

The interface shall avoid unnecessary technical options.

Only settings that influence the current Project shall be displayed.

---

# 4. Screen Layout

Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Toolbar                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Settings Categories              │ Setting Details                           │
│                                  │                                           │
│ General                          │                                           │
│ Drawing                          │                                           │
│ Materials                        │                                           │
│ Hardware                         │                                           │
│ Export                           │                                           │
├──────────────────────────────────┴───────────────────────────────────────────┤
│ Bottom Status Bar                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

iPad

```text
Top Toolbar

↓

Settings Categories

↓

Setting Details

↓

Bottom Toolbar
```

The interface shall remain consistent across supported platforms.

---

# 5. General

Displays:

- Project Name
- Customer Name
- Project Number
- Designer
- Project Address
- Project Notes

General information identifies the current Project.

---

# 6. Drawing Settings

Displays:

- Default Scale
- Paper Size
- Dimension Unit
- Dimension Precision
- Drawing Standard

Drawing Settings define the default presentation for newly generated drawings.

---

# 7. Material Settings

Displays:

- Default Board Material
- Default Thickness
- Default Edge Banding
- Default Back Panel
- Default Grain Direction

These values are used as defaults for newly created Furniture Objects.

---

# 8. Hardware Settings

Displays:

- Default Hinge
- Default Drawer Slide
- Default Handle
- Default Connector
- Default Accessories

Default Hardware is applied automatically when creating new Furniture Objects.

Users may change hardware later inside the Furniture Object Editor.

---

# 9. Export Settings

Displays:

- PDF
- DWG
- Excel
- Image

Additional settings include:

- Default Export Folder
- Default Paper Size
- Export Quality

Export Settings affect exported documents only.

---

# 10. Top Toolbar

The toolbar includes:

- Save
- Reset
- Export Settings
- Import Settings
- Help

Only modified settings shall require saving.

---

# 11. Navigation

Project Dashboard

↓

Project Settings

↓

Return to Dashboard

Users may return to the Project Dashboard at any time.

---

# 12. Performance

Project Settings shall load immediately.

Changes shall be saved after user confirmation.

Only modified settings shall be updated.

---

# 13. Future Expansion

Future versions may support:

- Project Templates
- Company Templates
- Team Permissions
- Language Packs
- Cloud Backup
- Online Synchronization

Future capabilities shall integrate without redesigning the Project Settings Workspace.

---

# 14. Relationship with PRD

This UI corresponds to the following PRDs:

- PRD04 — Target Users
- PRD05 — User Workflow
- PRD06 — Project System
- PRD22 — Project Management System
- PRD23 — Material Generation System
- PRD25 — Hardware Generation System
- PRD26 — Production Formula Engine

Project Settings define Project defaults.

They do not modify production calculations.

Production calculations belong exclusively to the Production Formula Engine.

---

# 15. Design Principles

The Project Settings Workspace shall follow these principles:

1. Simple Configuration
2. Project-Oriented
3. Easy to Understand
4. Production-Friendly
5. Consistent Defaults
6. High Performance
7. Furniture Industry Focus
8. Offline First

The Project Settings Workspace defines default Project preferences.

It is not intended for production editing or engineering calculations.

---

# Approval

Status: Confirmed

Version: v2.1

This document is the official UI specification for the Furniture GO Project Settings.