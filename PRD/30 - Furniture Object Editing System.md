# Furniture GO
# Product Requirement Document (PRD)

# 30_Furniture_Object_Editing_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 30_Furniture_Object_Editing_System |
| Version | v2.0 |
| Status | Confirmed |
| Category | Furniture Object Editing System |

---

# 1. Overview

The Furniture Object Editing System is responsible for creating, editing, organizing, validating, and managing Furniture Objects throughout the entire Project lifecycle.

Furniture GO does not edit CAD geometry directly.

Instead, users edit Furniture Objects.

All engineering, production, CAD, 3D, and document generation systems obtain their information from the latest confirmed Furniture Objects.

The Furniture Object Editing System maintains the integrity, consistency, and synchronization of Furniture Objects across the entire Furniture GO ecosystem.

---

# 2. Objectives

The Furniture Object Editing System shall provide:

- Furniture Object Creation
- Furniture Object Editing
- Furniture Object Management
- Object Hierarchy Management
- Object Relationship Management
- Object Validation
- Object Synchronization
- Object Lifecycle Management
- Object Search
- Object Locking

The system ensures that every connected system always references the latest confirmed Furniture Objects.

---

# 3. Scope

This PRD defines only the Furniture Object Editing System.

The system is responsible for:

- Creating Furniture Objects
- Editing Furniture Objects
- Managing Object Properties
- Managing Object Relationships
- Managing Object Hierarchies
- Managing Object Lifecycle
- Object Locking
- Object Validation
- Object Synchronization

The Furniture Object Editing System shall never:

- Perform Project Recognition
- Generate CAD Geometry
- Generate 3D Models
- Perform Engineering Calculations
- Perform Production Formula Calculations
- Generate Production Drawings

Those responsibilities belong to their respective systems.

---

# 4. Object Workflow

Project Recognition and Analysis Engine

↓

Furniture Object Engine

↓

Furniture Object Editing System

↓

Confirmed Furniture Objects

↓

CAD Generation and Editing System

↓

Furniture 3D Modeling System

↓

Production Formula Engine

↓

Production Drawing Output System

↓

Project Document Package Engine

The Furniture Object Editing System manages Furniture Objects after they have been created by the Furniture Object Engine.

---

# 5. Design Principles

The Furniture Object Editing System shall follow these principles:

- Object-Oriented
- Engineering-Oriented
- Modular
- Independent
- Expandable
- Synchronized
- Project-Centric
- Non-destructive Editing

Editing shall never destroy confirmed project history.

Every modification shall remain traceable.

---

# 6. Object Hierarchy

Furniture Objects shall follow the project hierarchy.

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

Each child object belongs to exactly one parent object.

Every Furniture Object belongs to one Project.

The hierarchy shall remain expandable without redesigning the system architecture.

---

# 7. Object Identity

Every Furniture Object shall have a unique Object ID.

Object IDs shall:

- Remain unique within the Project.
- Remain stable throughout the Project lifecycle.
- Never be reused after deletion.
- Be used internally by the system.

Users are not required to view or modify Object IDs.

Object IDs are the primary identifiers used throughout Furniture GO.

---

# 8. Core Principles

Furniture Objects represent engineering information.

They do not represent:

- CAD Geometry
- 3D Graphics
- Production Drawings
- Production Formula Results

Furniture Objects represent the logical engineering structure used throughout the entire Furniture GO ecosystem.

All connected systems shall reference the same Furniture Objects.

---

# 9. Project Object

The Project Object is the root object of every Furniture GO project.

A Project Object may contain:

- Project Information
- Project Settings
- Project Metadata
- Project Status
- Multiple Rooms

Every Furniture Object shall belong to one Project.

---

# 10. Room Object

A Room Object represents an individual room within a Project.

Examples include:

- Master Bedroom
- Bedroom
- Living Room
- Kitchen
- Dry Kitchen
- Wet Kitchen
- Bathroom
- Laundry
- Study Room

Each Room Object may contain multiple Furniture Objects.

---

# 11. Furniture Object

A Furniture Object represents one complete furniture unit.

Examples include:

- Wardrobe
- TV Cabinet
- Kitchen Cabinet
- Vanity Cabinet
- Shoe Cabinet
- Display Cabinet
- Pantry Cabinet

Each Furniture Object may contain one or more Modules.

Furniture Objects are the primary engineering units throughout Furniture GO.

---

# 12. Module Object

A Module Object represents a functional section within a Furniture Object.

Examples include:

- Swing Door Module
- Sliding Door Module
- Drawer Module
- Shelf Module
- Hanging Module
- Open Shelf Module

Each Module may contain multiple Components.

Modules divide large furniture items into manageable engineering structures.

---

# 13. Component Object

A Component Object represents an individual engineering component within a Module.

Examples include:

- Left Panel
- Right Panel
- Top Panel
- Bottom Panel
- Back Panel
- Shelf
- Divider
- Toe Kick
- End Panel
- Filler

Component Objects are engineering components.

Production Boards are generated later by the Board Generation Engine.

Component Objects themselves are not production boards.

---

# 14. Hardware Object

A Hardware Object represents hardware associated with a Furniture Object or Component Object.

Examples include:

- Hinges
- Drawer Slides
- Sliding Door Systems
- Lift Systems
- Handles
- Legs
- Connectors
- LED Profiles
- Shelf Supports

Hardware Objects shall reference the Official Engineering Knowledge Base and the Factory Reference Database whenever applicable.

Hardware specifications shall never be duplicated across multiple systems.

---

# 15. Parent-Child Relationships

Furniture Objects shall maintain hierarchical parent-child relationships.

Example:

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

Every child object shall inherit the Project context from its parent.

Parent-child relationships shall remain valid throughout the entire Project lifecycle.

---

# 16. Object References

Furniture Objects may reference other Objects.

Examples include:

- Furniture Object → Material
- Furniture Object → Hardware
- Component Object → Material
- Component Object → Hardware
- Component Object → Manufacturing Requirements

Reference relationships shall remain synchronized automatically.

Reference relationships shall complement, but never replace, parent-child relationships.

---

# 17. Object Independence

Every Furniture Object shall exist independently.

Editing one Furniture Object shall never modify unrelated Furniture Objects.

Deleting one Furniture Object shall never affect unrelated Objects.

The Furniture Object Editing System shall preserve Object integrity throughout the Project lifecycle.

---

# 18. Object Properties

Every Furniture Object shall contain editable properties.

Typical properties may include:

- Name
- Type
- Description
- Status
- Visibility
- Position
- Rotation
- Custom Properties

Available properties depend on the Object Type.

Property updates shall automatically notify dependent systems while preserving Object identity.

---

# 19. Object Lifecycle

Every Furniture Object shall maintain a complete lifecycle throughout the Project.

Typical lifecycle stages include:

- Created
- Modified
- Validated
- Confirmed
- Locked
- Archived

Object lifecycle status is independent from Production Status.

Project revisions shall preserve previous Object states.

Confirmed Objects shall never be overwritten.

New revisions shall create updated Object versions while preserving historical records.

---

# 20. Object Synchronization

Whenever a Furniture Object is created, modified, locked, unlocked, or deleted,

the Furniture Object Editing System shall automatically notify all dependent systems.

Dependent systems may include:

- CAD Generation and Editing System
- Furniture 3D Modeling System
- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Production Drawing Output System
- Project Document Package Engine

Only affected Furniture Objects shall be synchronized.

Unaffected Furniture Objects shall remain unchanged.

Manual synchronization shall never be required.

---

# 21. Object Validation

Before Engineering or Production processing begins,

the Furniture Object Editing System shall validate Furniture Object integrity.

Validation may include:

- Missing Parent Object
- Invalid Child Object
- Circular References
- Invalid Object Type
- Duplicate Object ID
- Invalid Object Relationship
- Missing Required Properties

Detected issues shall be reported to users before further processing.

The system shall never modify Furniture Objects automatically during validation.

---

# 22. Object Communication

The Furniture Object Editing System shall coordinate editing activities between connected systems.

All editing operations shall update the corresponding Furniture Objects.

Connected systems shall always reference the latest confirmed Furniture Objects.

The system shall never allow conflicting Furniture Object definitions to exist.

---

# 23. Data Consistency

The Furniture Object Editing System shall preserve consistent Furniture Object data throughout the entire Furniture GO ecosystem.

The following systems shall always reference the same confirmed Furniture Objects:

- Furniture Object Engine
- CAD Generation and Editing System
- Furniture 3D Modeling System
- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Production Drawing Output System
- Project Document Package Engine

No connected system shall maintain an independent editable copy of Furniture Objects.

Furniture Objects shall remain the single engineering data source throughout the Project lifecycle.

---

# 24. Design Principles

The Furniture Object Editing System shall follow these principles:

1. Object-Oriented Editing
2. Non-destructive Editing
3. Stable Object Identity
4. Stable Object Relationships
5. Automatic Synchronization
6. Consistent Project Data
7. Modular Architecture
8. Expandable Design
9. Fully Offline Operation
10. Complete Project Traceability

---

# 25. Scope

This PRD defines only the Furniture Object Editing System.

The following systems are defined separately:

- User Role System
- User Workflow
- Project System
- Furniture Intelligence System
- Project Recognition and Analysis System
- Project Confirmation System
- Furniture Object Engine
- Official Engineering Knowledge Base
- Factory Reference Database System
- AI Recognition Database System
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Project Document Package Engine
- Production Formula Engine
- Production Drawing Output System
- CAD Generation and Editing System
- Furniture 3D Modeling System

The Furniture Object Editing System is responsible only for editing, organizing, validating, synchronizing, and managing Furniture Objects.

Engineering calculations, production calculations, CAD editing, 3D visualization, and production document generation are handled by their respective systems.

---

# 26. Approval

Status: Confirmed

Version: v2.0

This document is the official specification of the Furniture GO Furniture Object Editing System.