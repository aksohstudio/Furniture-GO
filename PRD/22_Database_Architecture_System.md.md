# Furniture GO
# Product Requirement Document (PRD)

# 22_Database_Architecture_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 22_Database_Architecture_System |
| Version | v1.0 |
| Status | Confirmed |
| Category | Database Architecture |

---

# 1. Overview

The Database Architecture System defines how production data is organized inside Furniture GO.

Its purpose is to establish a unified object architecture for the entire system.

All production modules shall obtain data from the Project Database through standardized object relationships.

The architecture is designed for long-term scalability while remaining optimized for real furniture production workflows.

---

# 2. Objectives

The Database Architecture System shall:

- Standardize all production objects
- Establish object relationships
- Provide unique object identification
- Support AI Recognition
- Support Project Database generation
- Support Material List generation
- Support Hardware List generation
- Support Cutting List generation
- Support Shop Drawing generation
- Support Quotation generation

---

# 3. Database Architecture

Furniture GO separates data into three independent database systems.

```text
Official Database

↓

Factory Database

↓

Project Database
```

Each database has its own responsibility.

No database replaces another.

---

# 4. Core Principles

Furniture GO stores production information using object relationships.

Every object shall have its own Object ID.

The Project Database shall reference Object IDs instead of storing duplicated product information.

Object names are used for display only.

---

# 5. Object Hierarchy

```text
Project
│
├── Room
│
├── Cabinet
│
├── Panel
│
├── Door
│
├── Drawer
│
├── Material Reference
│
├── Hardware Reference
│
└── Accessory Reference
```

This hierarchy represents the complete production structure of every project.

---

# 6. Project Object

Every project shall be an independent Project Object.

Each Project Object contains:

- Project ID
- Project Name
- Project Status
- Revision
- Lock Status

The Project Object is the root object of the Project Database.

---

# 7. Room Object

Every room shall be an independent Room Object.

Each Room Object contains:

- Room ID
- Project ID
- Room Name
- Room Type
- Status

Every Cabinet belongs to one Room.

---

# 8. Cabinet Object

Every cabinet shall be an independent Cabinet Object.

Each Cabinet Object contains:

- Cabinet ID
- Room ID
- Cabinet Type
- Width
- Height
- Depth
- Status

Every production object belongs to a Cabinet.

---

# 9. Panel Object

Every panel shall be an independent production object.

Each Panel Object contains:

- Panel ID
- Parent Cabinet ID
- Room ID
- Material ID
- Width
- Height
- Thickness
- Quantity
- Status

Panel is the smallest production unit inside Furniture GO.

---

# 10. Door Object

Every door shall be an independent production object.

Each Door Object contains:

- Door ID
- Parent Cabinet ID
- Room ID
- Material ID
- Width
- Height
- Thickness
- Door Type
- Opening Direction
- Handle Method
- Hinge Reference
- Status

Door Objects maintain their own production information.

---

# 11. Drawer Object

Every drawer shall be an independent production object.

Each Drawer Object contains:

- Drawer ID
- Parent Cabinet ID
- Room ID
- Material ID
- Drawer Slide Reference
- Width
- Height
- Depth
- Quantity
- Status

Drawer Slides are referenced from the Hardware Database.

The Drawer Object does not directly store hardware specifications.

---

# 12. Material Reference

The Project Database shall not duplicate material information.

Every production object references Material IDs stored in the Official Database or Factory Database.

Material information is retrieved only when required for display or calculation.

---

# 13. Hardware Reference

The Project Database shall not duplicate hardware information.

Every production object references Hardware IDs.

Hardware specifications remain inside the Hardware Database.

---

# 14. Accessory Reference

Accessories shall be managed independently.

Every Accessory Object references an Accessory ID.

Examples include:

- Clothes Rail
- Basket
- Mirror
- Jewelry Tray
- Shoe Rack
- Other Accessories

The Project Database references Accessory IDs instead of storing duplicated information.

---

# 15. Object Relationships

Every object communicates through Object IDs.

Examples:

Project → Room

Room → Cabinet

Cabinet → Panel

Cabinet → Door

Cabinet → Drawer

Panel → Material

Door → Material

Drawer → Drawer Slide

Cabinet → Accessories

This relationship architecture ensures data consistency throughout the system.

---

# 16. Reference by ID

Furniture GO follows the Reference by ID principle.

The Project Database stores Object IDs instead of duplicated text.

Advantages include:

- Consistent data
- Faster searching
- Easier maintenance
- Future scalability
- Reduced duplicated information

---

# 17. Database Responsibilities

Official Database

- Standardized furniture knowledge
- AI Recognition knowledge
- Product standards

Factory Database

- Factory defaults
- Factory production rules
- Factory custom settings

Project Database

- Confirmed project information
- Production objects
- Object relationships
- Production references

Each database performs an independent responsibility.

---

# 18. Design Principles

Furniture GO organizes every production object independently.

Every object has its own identity.

Every object communicates using Object IDs.

The Project Database references information instead of duplicating it.

The architecture is designed for long-term expansion.

The architecture prioritizes real furniture production workflows.

The architecture supports future database growth without requiring structural redesign.

---

# Approval

Status: Confirmed

Version: v1.0