# Furniture GO
# Product Requirement Document (PRD)

# 26_Production_Formula_Engine

---

## Document Information

| Item | Value |
|------|-------|
| Document | 26_Production_Formula_Engine |
| Version | v2.0 |
| Status | Approved |
| Category | Core Engineering Engine |

---

# 1. Purpose

The Production Formula Engine is the core engineering calculation engine of Furniture GO.

Its responsibility is to execute engineering rules and automatically convert furniture design information into complete production information.

The Production Formula Engine does not create engineering rules.

It executes engineering rules provided by the Official Engineering Knowledge Base.

The engine is responsible for calculating:

- Cabinet Structure
- Panel Sizes
- Door Sizes
- Drawer Sizes
- Hardware Requirements
- Material Requirements
- Cutting List
- Purchase List
- Production Drawing Data

The Production Formula Engine is the only calculation engine inside Furniture GO.

All production modules shall obtain engineering calculation results exclusively from this engine.

---

# 2. Design Philosophy

The Production Formula Engine shall never rely on hardcoded values.

Every engineering calculation shall originate from the Official Engineering Knowledge Base.

Engineering Rules include, but are not limited to:

- Material Engineering
- Hardware Engineering
- Cabinet Engineering
- Door System Engineering
- Construction Engineering
- Production Engineering
- Calculation Rules
- Drawing Rules
- Cutting Rules
- Assembly Rules

The Production Formula Engine executes Engineering Rules.

It shall never create, modify or guess Engineering Rules.

All engineering calculations must remain Engineering Knowledge driven.

---

# 3. Core Responsibilities

The Production Formula Engine is responsible for automatically calculating:

- Cabinet Structure
- Cabinet Width
- Cabinet Height
- Cabinet Depth
- Panel Thickness
- Door Formula
- Drawer Formula
- Shelf Formula
- Divider Formula
- Back Panel Formula
- Back Rail Formula
- End Panel Formula
- Filler Formula
- Toe Kick Formula
- Hanging Rail Formula
- Hardware Formula
- Material Formula
- Cutting Formula
- Purchase Formula
- Production Drawing Formula

The Production Formula Engine is responsible only for calculation.

Engineering definitions always originate from the Official Engineering Knowledge Base.

---

# 4. Formula Principles

The Production Formula Engine shall always generate:

Final Production Size

instead of

Design Size.

Every generated dimension shall represent the actual manufacturing dimension.

The Production Formula Engine shall automatically perform all engineering deductions, clearances, offsets, overlaps and production adjustments according to Engineering Rules.

No production deduction shall be hardcoded.

Every engineering deduction shall originate from the Official Engineering Knowledge Base.

---

# 5. Formula Workflow

Every production calculation shall follow one standardized workflow.

The workflow is:

Project

↓

Designer PDF

↓

Recognition Engine

↓

Official Engineering Knowledge Base

↓

Engineering Record

↓

Furniture Object Engine

↓

Production Formula Engine

↓

Calculated Production Result

↓

Production Drawing

↓

Cutting List

↓

Purchase List

The Production Formula Engine shall never bypass the Official Engineering Knowledge Base.

Every production calculation shall originate from an Engineering Record.

---

# 6. Engineering Rule Source

The Production Formula Engine shall obtain all Engineering Rules exclusively from the Official Engineering Knowledge Base.

Engineering Rules include, but are not limited to:

- Material Engineering
- Hardware Engineering
- Cabinet Engineering
- Door System Engineering
- Drawer System Engineering
- Construction Engineering
- Production Engineering
- Calculation Rules
- Drawing Rules
- Cutting Rules
- Assembly Rules

The Production Formula Engine shall never use hardcoded engineering values.

The Production Formula Engine shall never invent engineering rules.

Every engineering calculation shall execute the corresponding Engineering Rules exactly as defined.

---

# 7. Core Principle

Furniture GO calculates furniture.

It does not calculate CAD geometry.

Every production calculation shall be based on Furniture Objects.

Furniture Objects are generated from recognized Engineering Records.

Engineering Records define the production rules.

The Production Formula Engine executes those rules.

CAD is only a graphical representation.

Production calculations shall never depend on CAD geometry.

---

# 8. Functional Requirements

## CR26-001
### Cabinet Formula

The Production Formula Engine shall automatically calculate every cabinet structure according to the Engineering Rules defined in the Official Engineering Knowledge Base.

Supported cabinet types include, but are not limited to:

- Base Cabinet
- Wall Cabinet
- Tall Cabinet
- Wardrobe
- TV Cabinet
- Shoe Cabinet
- Vanity Cabinet
- Display Cabinet
- Pantry Cabinet
- Custom Cabinet

The Formula Engine shall execute Engineering Rules instead of fixed cabinet formulas.

---

## CR26-002
### Cabinet Panel Formula

The Production Formula Engine shall automatically calculate:

- Left Side Panel
- Right Side Panel
- Top Panel
- Bottom Panel
- Fixed Shelf
- Adjustable Shelf
- Divider Panel
- Back Panel
- Back Rail
- Stretcher
- Hanging Rail
- Toe Kick
- End Panel
- Filler Panel

Every panel calculation shall execute Engineering Rules provided by the Official Engineering Knowledge Base.

---

## CR26-003
### Material Formula

Material Engineering shall provide:

- Material Thickness
- Board Size
- Grain Direction
- Production Rules
- Cutting Rules
- Edge Banding Rules

The Production Formula Engine shall calculate production dimensions according to these Engineering Rules.

Material values shall never be hardcoded.

---

## CR26-004
### Engineering Deduction Formula

The Production Formula Engine shall automatically execute all engineering deductions.

Engineering deductions include, but are not limited to:

- Panel Deductions
- Back Panel Deductions
- Groove Offsets
- Door Gaps
- Drawer Clearances
- Hardware Clearances
- Assembly Gaps
- Sliding Door Overlaps
- Aluminium Profile Deductions
- Glass Deductions

Every deduction value shall originate from the Official Engineering Knowledge Base.

The Production Formula Engine shall never use manually defined deduction values.

---

## CR26-005
### Final Production Principle

Every generated dimension shall represent the Final Production Size.

The Production Formula Engine shall automatically complete:

- Deductions
- Clearances
- Offsets
- Overlaps
- Assembly Adjustments

The user shall never manually calculate production dimensions.

---

## CR26-006
### Cabinet Width Formula

The Production Formula Engine shall automatically calculate cabinet width according to the Engineering Rules defined by the Official Engineering Knowledge Base.

Engineering Rules may include:

- Cabinet Structure
- Material Thickness
- Door System
- Hardware Requirements
- Construction Rules
- Deduction Rules

The generated result shall always represent the Final Production Width.

---

## CR26-007
### Cabinet Height Formula

The Production Formula Engine shall automatically calculate cabinet height according to Engineering Rules.

Engineering calculations may include:

- Toe Kick
- Top Panel
- Bottom Panel
- Cabinet Structure
- Door System
- Hardware Clearance
- Production Deductions

The generated result shall always represent the Final Production Height.

---

## CR26-008
### Cabinet Depth Formula

The Production Formula Engine shall automatically calculate cabinet depth according to Engineering Rules.

Engineering calculations may include:

- Cabinet Type
- Door System
- Drawer System
- Hardware Requirements
- Back Panel Structure
- Production Deductions

The generated result shall always represent the Final Production Depth.

---

## CR26-009
### Cabinet Structure Formula

The Production Formula Engine shall automatically generate the complete cabinet structure.

Engineering calculations shall determine:

- Left Side Panel
- Right Side Panel
- Top Panel
- Bottom Panel
- Fixed Shelf
- Adjustable Shelf
- Divider Panel
- Back Panel
- Back Rail
- Hanging Rail
- Toe Kick
- End Panel
- Filler Panel

Every component shall be generated according to Engineering Rules.

---

## CR26-010
### Back Panel Formula

The Production Formula Engine shall automatically determine:

- Back Panel Thickness
- Back Panel Position
- Groove Type
- Groove Depth
- Groove Offset
- Rebate Size
- Final Cutting Size

All calculations shall originate from the Official Engineering Knowledge Base.

---

## CR26-011
### Shelf Formula

The Production Formula Engine shall automatically determine:

- Shelf Quantity
- Shelf Width
- Shelf Depth
- Shelf Thickness
- Shelf Position
- Shelf Support Requirements

Engineering Rules shall determine all shelf calculations.

---

## CR26-012
### Divider Formula

The Production Formula Engine shall automatically determine:

- Vertical Divider
- Horizontal Divider
- Divider Thickness
- Divider Position
- Divider Cutting Size

Engineering Rules shall define every divider calculation.

---

## CR26-013
### End Panel Formula

The Production Formula Engine shall automatically determine:

- Whether an End Panel is required
- End Panel Thickness
- End Panel Width
- End Panel Height
- End Panel Finish

Engineering Rules shall determine all End Panel calculations.

The Formula Engine shall never assume every cabinet requires an End Panel.

---

## CR26-014
### Filler Formula

The Production Formula Engine shall automatically calculate:

- Left Filler
- Right Filler
- Top Filler
- Bottom Filler

Engineering calculations shall consider:

- Cabinet Position
- Wall Conditions
- Design Requirements
- Engineering Rules

---

## CR26-015
### Toe Kick Formula

The Production Formula Engine shall automatically calculate:

- Toe Kick Height
- Toe Kick Length
- Toe Kick Thickness
- Toe Kick Quantity
- Toe Kick Cutting Size

Engineering Rules shall determine every Toe Kick calculation.

---

## CR26-016
### Door Formula

The Production Formula Engine shall automatically calculate all door dimensions.

Door calculations shall execute Engineering Rules provided by the Official Engineering Knowledge Base.

Engineering calculations may include:

- Door Width
- Door Height
- Door Thickness
- Door Gaps
- Overlay
- Inset
- Reveal
- Opening Clearance

All generated door dimensions shall represent Final Production Size.

---

## CR26-017
### Door Processing Formula

The Production Formula Engine shall automatically determine whether additional door processing is required.

Examples include:

- Finger Groove
- Aluminium Frame
- Glass Door
- Sliding Door
- Fluted Door
- Routed Door
- CNC Door
- Profile Door

Required processing information shall originate from the Official Engineering Knowledge Base.

The Formula Engine shall generate production-ready processing data.

---

## CR26-018
### Hardware Formula

The Production Formula Engine shall automatically calculate hardware requirements.

Engineering calculations may include:

- Hinge Type
- Hinge Quantity
- Hinge Position
- Drawer Slide Type
- Drawer Slide Length
- Lift System
- Sliding Door Hardware
- Handle Position
- Connector Quantity
- Fastener Quantity

All Hardware Engineering Rules shall originate from the Official Engineering Knowledge Base.

---

## CR26-019
### Drawer Formula

The Production Formula Engine shall automatically calculate:

- Drawer Width
- Drawer Height
- Drawer Depth
- Drawer Box Dimensions
- Drawer Quantity
- Drawer Clearance

Engineering Rules shall determine every drawer calculation.

---

## CR26-020
### Material Formula

The Production Formula Engine shall automatically determine:

- Material Type
- Material Thickness
- Board Size
- Grain Direction
- Edge Banding Requirements
- Material Quantity

Engineering Rules shall originate from the Official Engineering Knowledge Base.

Designer specifications shall always have the highest priority.

If no designer specification exists, the Formula Engine shall apply the default Engineering Rules.

---

## CR26-021
### Cutting Formula

The Production Formula Engine shall automatically generate production cutting dimensions.

The Formula Engine shall calculate:

- Panel Cutting Size
- Door Cutting Size
- Drawer Component Size
- Shelf Cutting Size
- Divider Cutting Size
- End Panel Size
- Filler Size
- Back Panel Size
- Toe Kick Size

All cutting dimensions shall represent Final Production Size.

---

## CR26-022
### Purchase Formula

The Production Formula Engine shall automatically generate purchase requirements.

Examples include:

- Board Quantity
- Board Size
- Edge Banding
- Hinges
- Drawer Slides
- Sliding Door Hardware
- Lift Systems
- Aluminium Profiles
- Glass
- Screws
- Accessories

Purchase calculations shall execute Engineering Rules provided by the Official Engineering Knowledge Base.

---

## CR26-023
### Production Drawing Formula

The Production Formula Engine shall provide all engineering calculation results required by the Production Drawing System.

Examples include:

- Final Production Dimensions
- Panel Dimensions
- Door Dimensions
- Drawer Dimensions
- Hardware Locations
- Processing Information
- Fabrication Dimensions

The Production Drawing System shall never perform independent engineering calculations.

---

## CR26-024
### Formula Regeneration

Whenever project information changes, the Production Formula Engine shall automatically regenerate all affected production data.

Examples include:

- Cabinet Dimensions
- Material Selection
- Door System
- Hardware System
- Cabinet Structure
- Project Revision

All downstream production information shall remain synchronized.

---

## CR26-025
### Engineering Knowledge Dependency

The Production Formula Engine shall obtain Engineering Rules exclusively from the Official Engineering Knowledge Base.

No engineering rule shall be permanently hardcoded inside the application.

The Formula Engine shall never invent engineering rules.

The Formula Engine shall only execute standardized Engineering Rules.

---

## CR26-026
### Calculation Consistency

Every engineering calculation shall remain consistent across:

- Furniture Object Engine
- Production Drawing System
- CAD Generation System
- Furniture 3D System
- Cutting Generation System
- Purchase Generation System

Every production module shall reference the same engineering calculation results.

---

## CR26-027
### Error Detection

The Production Formula Engine shall automatically detect engineering conflicts.

Examples include:

- Invalid Cabinet Dimensions
- Unsupported Hardware Combination
- Material Conflict
- Structure Conflict
- Formula Conflict
- Engineering Rule Conflict

Detected issues shall be reported before production data is generated.

---

## CR26-028
### Future Expansion

The Production Formula Engine shall support future Engineering Knowledge expansion without requiring changes to the calculation engine.

New Engineering Rules shall be introduced through the Official Engineering Knowledge Base.

The Formula Engine shall automatically support newly added Engineering Records without requiring structural redesign.

---

# 9. Design Principles

The Production Formula Engine shall follow these principles:

1. Engineering Knowledge Driven
2. Furniture Object Driven
3. Production Oriented
4. Automatically Calculated
5. No Hardcoded Engineering Rules
6. Final Production Size Only
7. Single Calculation Source
8. Fully Synchronized Across All Production Modules
9. Fully Offline Operation
10. Expandable Through Official Engineering Knowledge

---

# 10. Scope

This PRD defines only the Production Formula Engine.

The following systems are defined separately:

- Official Engineering Knowledge Base
- Recognition Engine
- Furniture Object Engine
- Production Drawing System
- CAD Generation System
- Furniture 3D System
- Cutting Generation System
- Purchase Generation System

---

# 11. Approval

Status: Approved

Version: v2.0

This document is the official specification of the Furniture GO Production Formula Engine.