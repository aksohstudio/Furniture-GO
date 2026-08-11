# Furniture GO
# Product Requirement Document (PRD)

# 25_Hardware_Generation_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 25_Hardware_Generation_System |
| Version | v1.0 |
| Status | Confirmed |
| Category | Production Generation |

---

# 1. Overview

The Hardware Generation System is responsible for generating the hardware purchasing list for a confirmed project.

The system reads only from the confirmed Project Database.

The Hardware List summarizes all hardware required for the project.

The Hardware Generation System never reads directly from PDF drawings.

---

# 2. Objectives

The Hardware Generation System shall:

- Read the confirmed Project Database
- Generate the Hardware List
- Automatically summarize identical hardware
- Automatically calculate required quantities
- Support project purchasing
- Maintain consistency with the Project Database

---

# 3. Input Source

The Hardware Generation System reads only from the confirmed Project Database.

The system shall never read directly from:

- Original PDF
- Backup PDF
- AI Scan Results
- Review Report

The Project Database is the only source of hardware information.

---

# 4. Generation Workflow

```text
Project Database

↓

Read Hardware Objects

↓

Apply Factory Rules

↓

Read Official Database

↓

Calculate Quantity

↓

Group Identical Hardware

↓

Generate Hardware List
```

---

# 5. Hardware List Purpose

The Hardware List is a purchasing document.

It is generated together with the Material List.

Its purpose is to prepare all hardware required for the project.

The Hardware List shall not contain:

- Room
- Cabinet
- Installation Position
- Production Information

---

# 6. Hardware Brand Selection

After PDF analysis and project review, Furniture GO shall request the user to confirm the hardware brand strategy.

Two modes shall be supported.

---

## Mode A

Entire Project uses one hardware brand.

Example:

```text
Brand

Blum
```

The system automatically applies the selected brand to all compatible hardware.

---

## Mode B

Each hardware category uses an independent brand.

Example:

```text
Door Hinges

Blum

────────────

Drawer Slides

Hettich

────────────

Lift Systems

Blum

────────────

Basket

Hafele
```

---

# 7. Hardware Rules

Furniture GO does not hardcode hardware rules.

Factory Setup defines all calculation rules.

Examples include:

- Door hinge quantity
- Drawer slide selection
- Lift system rules
- Clothes rail rules
- Other hardware rules

---

## Example

Door Hinge Rule

```text
Door Height

0~900

2 Hinges

901~1800

3 Hinges

1801~2400

4 Hinges
```

Drawer Slide Rule

```text
Drawer Internal Depth

350 → 300mm Slide

400 → 350mm Slide

450 → 400mm Slide

500 → 450mm Slide

550 → 500mm Slide
```

Furniture GO executes these factory rules automatically.

---

# 8. Official Database

Factory Database determines:

- Preferred Brand
- Factory Rules

Official Database determines:

- Hardware Specifications
- Official Dimensions
- Installation Requirements
- Official Calculation Rules
- Official Product Information

---

# 9. Hardware Confirmation

If Furniture GO cannot determine hardware specifications automatically, the system shall request user confirmation.

Examples include:

- Drawer Slide Type
- Hinge Type
- Lift System
- Other unknown hardware

Furniture GO shall never guess unknown hardware.

---

# 10. Hardware Grouping

Hardware shall be grouped by Hardware ID.

Hardware having identical Hardware IDs shall be combined.

Hardware having different Hardware IDs shall never be combined.

---

# 11. Quantity Calculation

Hardware quantity shall be calculated automatically using:

- Project Database
- Factory Rules
- Official Database

The system shall generate the total quantity required for the project.

---

# 12. Hardware Unit

Every hardware item shall maintain its own unit.

Examples include:

- pcs
- pair
- set
- roll

The Hardware List shall automatically display the correct unit.

---

# 13. Hardware Categories

The Hardware List shall automatically group hardware by category.

Examples include:

- Door Hinges
- Drawer Slides
- Lift Systems
- Handles
- Wardrobe Accessories
- Kitchen Accessories
- Lighting
- Others

Within each category, identical hardware shall be automatically grouped.

---

# 14. Consumable Items

Furniture GO shall not calculate consumable materials.

Examples include:

- Screws
- Nails
- Glue
- Silicone
- Tape
- Other consumables

These items are outside the scope of the Hardware Generation System.

---

# 15. Hardware List Scope

The Hardware List shall display only:

- Hardware Name
- Specification
- Quantity
- Unit

The Hardware List shall not calculate:

- Purchase Packaging
- Box Quantity
- Supplier Information
- Inventory
- Pricing

These are outside the scope of Furniture GO.

---

# 16. Database Consistency

The Hardware Generation System shall always remain synchronized with the Project Database.

Whenever the Project Database changes, the Hardware List shall be regenerated automatically.

Furniture GO shall never manually edit generated Hardware Lists.

---

# 17. Design Principles

Furniture GO generates Hardware Lists only from the confirmed Project Database.

The Hardware List is a purchasing document.

Factory Database defines hardware rules.

Official Database defines official hardware knowledge.

Project Database stores project information only.

Furniture GO never guesses unknown hardware.

Hardware is grouped by Hardware ID.

Hardware is categorized automatically.

Consumable materials are not calculated.

The Hardware List calculates only project requirements.

Furniture GO does not manage purchasing, suppliers, pricing or inventory.

---

# Approval

Status: Confirmed

Version: v1.0