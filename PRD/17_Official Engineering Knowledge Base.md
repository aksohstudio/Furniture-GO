# Furniture GO
# Product Requirement Document (PRD)

# 17_Official_Engineering_Knowledge_Base

---

## Document Information

| Item | Value |
|------|-------|
| Document | 17_Official_Engineering_Knowledge_Base |
| Version | v3.0 |
| Status | Confirmed |
| Category | Core Engineering System |

---

# 1. Overview

The Official Engineering Knowledge Base is the core engineering intelligence system of Furniture GO.

It contains standardized engineering knowledge required for furniture recognition, calculation, production, drawing generation, cutting optimization, and purchasing.

The Official Engineering Knowledge Base is the primary knowledge source used by the Furniture GO Engine.

Every production module shall obtain engineering knowledge from this system.

The Official Engineering Knowledge Base is not a product catalogue.

It is not an ERP system.

It is not an inventory system.

It is not a supplier database.

Its responsibility is to allow Furniture GO to understand furniture products and automatically perform engineering calculations according to standardized furniture production knowledge.

For Furniture GO Version 1, the Official Engineering Knowledge Base includes a built-in Malaysia Official Library.

The complete Engineering Knowledge Base operates entirely offline.

Internet access is never required during normal production workflows.

---

# 2. Objectives

The Official Engineering Knowledge Base shall:

- Provide standardized engineering knowledge.
- Provide standardized product knowledge.
- Support PDF Recognition.
- Support AI Recognition.
- Support Furniture Object Generation.
- Support Production Formula calculations.
- Support Production Drawing Generation.
- Support Cutting List Generation.
- Support Purchase List Generation.
- Support future engineering knowledge expansion.
- Operate completely offline.

The Official Engineering Knowledge Base serves as the single engineering reference for every production module inside Furniture GO.

---

# 3. Core Principles

The Official Engineering Knowledge Base follows the following principles.

## Single Source of Truth

Every production module shall obtain engineering knowledge from the Official Engineering Knowledge Base.

Engineering knowledge shall never be duplicated across multiple systems.

---

## Engineering Before Calculation

Before any production calculation begins, Furniture GO shall first identify the product through the Official Engineering Knowledge Base.

Only after successful identification may engineering calculations begin.

Unknown products shall never enter the production workflow automatically.

---

## Standardization

Every product shall have one official engineering definition.

Different product names, aliases, abbreviations, or drawing labels referring to the same product shall resolve to one standardized engineering record.

---

## Offline First

The Official Engineering Knowledge Base shall operate completely offline.

All engineering knowledge required by Furniture GO Version 1 shall be built into the application.

---

## Read Only

The Official Engineering Knowledge Base is maintained exclusively by the Furniture GO Official Team.

Users shall not:

- Add engineering records.
- Modify engineering records.
- Delete engineering records.
- Rename engineering records.

Official updates shall only be distributed through official Furniture GO releases.

---

## Engineering Intelligence

The Official Engineering Knowledge Base exists primarily for engineering intelligence.

Its purpose is to enable the Furniture GO Engine to recognize products, understand engineering rules, perform production calculations, and automatically generate production information.

The Engineering Knowledge Base is designed primarily for system intelligence rather than manual user browsing.

---

# 4. Engineering Workflow

Every production workflow begins with engineering recognition.

The standard workflow is:

Project

↓

PDF

↓

Recognition Engine

↓

Official Engineering Knowledge Base

↓

Furniture Object Engine

↓

Production Formula Engine

↓

Production Drawing

↓

Cutting List

↓

Purchase List

Every production module depends on successful engineering identification.

The Official Engineering Knowledge Base is therefore one of the core engines of Furniture GO.

---

# 5. Engineering Knowledge Categories

The Official Engineering Knowledge Base organizes furniture engineering knowledge into standardized engineering categories.

These categories allow the Furniture GO Engine to recognize products, understand engineering rules, perform calculations, and automatically generate production information.

The Malaysia Official Library shall include, but is not limited to, the following engineering knowledge categories.

---

## Cabinet Engineering

Cabinet Engineering defines standardized cabinet structures.

Examples include:

- Base Cabinet
- Wall Cabinet
- Tall Cabinet
- Wardrobe
- TV Cabinet
- Vanity Cabinet
- Display Cabinet
- Storage Cabinet

Each cabinet record may define:

- Cabinet Structure
- Engineering Rules
- Production Rules
- Calculation Rules
- Drawing Rules
- Assembly Rules
- Recognition Rules

---

## Material Engineering

Material Engineering defines standardized board materials.

Examples include:

- Melamine Board
- MDF
- Plywood
- Particle Board
- Block Board
- Decorative Board
- Back Panel

Each material record may define:

- Official Name
- Brand
- Collection
- Model
- Thickness
- Board Size
- Surface Finish
- Grain Direction
- Product Code
- Production Rules
- Calculation Rules
- Drawing Rules
- Cutting Rules
- Recognition Rules

---

## Hardware Engineering

Hardware Engineering defines standardized furniture hardware.

Examples include:

- Hinges
- Drawer Slides
- Handles
- Lift Systems
- Legs
- Connectors
- Fasteners
- Accessories

Each hardware record may define:

- Official Name
- Brand
- Model
- Category
- Specification
- Product Code
- Installation Rules
- Hole Position Rules
- Calculation Rules
- Drawing Rules
- Production Rules
- Recognition Rules

---

## Door System Engineering

Examples include:

- Swing Door
- Sliding Door
- Folding Door
- Lift-Up Door
- Glass Door
- Aluminium Frame Door

Each record may define:

- Production Rules
- Calculation Rules
- Drawing Rules
- Installation Rules

---

## Edge Banding Engineering

Each record may define:

- Material
- Thickness
- Width
- Finish
- Production Rules
- Calculation Rules

---

## Glass Engineering

Each record may define:

- Glass Type
- Thickness
- Production Rules
- Calculation Rules
- Installation Rules

---

## Countertop Engineering

Each record may define:

- Material
- Thickness
- Joint Rules
- Production Rules
- Calculation Rules

---

## Recognition Engineering

Recognition Engineering supports automatic identification.

Examples include:

- Recognition Keywords
- Recognition Aliases
- Drawing Symbols
- Product Synonyms
- Recognition Rules

The Recognition Engine shall always consult the Official Engineering Knowledge Base before creating Furniture Objects.

---

## Production Engineering

Production Engineering defines standardized production knowledge.

Examples include:

- Production Rules
- Calculation Rules
- Drawing Rules
- Cutting Rules
- Assembly Rules
- Industry Standards

Production Engineering supports automatic production generation.

---

# 6. Engineering Record Structure

Every Engineering Record shall follow one standardized structure.

Each record may contain:

- Engineering ID
- Official Name
- Category
- Brand
- Collection
- Model
- Product Code
- Specification

- Recognition Rules

- Production Rules

- Calculation Rules

- Drawing Rules

- Cutting Rules

- Assembly Rules

- Related Engineering Rules

- Product Images

- Dimension Drawings

- Status

- Version

Every engineering record represents one standardized engineering definition.

---

# 7. Engineering Search

Furniture GO shall support fast searching throughout the Official Engineering Knowledge Base.

Users may search using:

- Official Name
- Brand
- Model
- Product Code
- Category
- Recognition Keyword
- Recognition Alias

Search results shall always return standardized engineering records.

---

# 8. Engineering Filtering

Furniture GO shall support filtering by:

- Category
- Brand
- Material Type
- Hardware Type
- Thickness
- Board Size
- Product Status

Filtering simplifies engineering knowledge retrieval without changing the engineering architecture.

---

# 9. Engineering Maintenance

The Official Engineering Knowledge Base shall be maintained exclusively by the Furniture GO Official Team.

The Engineering Knowledge Base remains read-only throughout normal application usage.

Users shall not:

- Add engineering records.
- Modify engineering records.
- Delete engineering records.
- Rename engineering records.

Only official Furniture GO releases may update the Engineering Knowledge Base.

Official updates may include:

- New Engineering Records
- Updated Engineering Rules
- Updated Recognition Rules
- Updated Production Rules
- Updated Calculation Rules
- Updated Drawing Rules
- Updated Cutting Rules
- Updated Assembly Rules

---

# 10. Official Engineering Updates

Furniture GO Version 1 operates completely offline.

The Official Engineering Knowledge Base shall therefore be distributed together with official Furniture GO releases.

Official Engineering updates are planned every six months.

Standard release schedule:

- January Release
- July Release

Emergency engineering updates may be released when necessary.

Official updates may include:

- New Materials
- New Hardware
- New Cabinet Engineering
- New Construction Engineering
- Updated Engineering Rules
- Updated Production Rules
- Updated Calculation Rules
- Updated Drawing Rules
- Updated Cutting Rules

Official Engineering updates shall never automatically modify Factory Database contents.

---

# 11. Engineering Usage

The Official Engineering Knowledge Base provides standardized engineering knowledge for:

- PDF Recognition
- AI Recognition
- Furniture Object Generation
- Production Formula Engine
- Production Drawing Generation
- Cutting List Generation
- Purchase List Generation

The Engineering Knowledge Base is responsible for identifying products and providing engineering rules.

It does not determine:

- Interior Design
- Furniture Design Style
- Customer Preferences
- Factory Preferences
- Purchasing Decisions

Designer drawings and confirmed project information always determine the final production result.

---

# 12. Engineering Workflow

Every production workflow shall begin with engineering identification.

The standard workflow is:

Project

↓

PDF

↓

Recognition Engine

↓

Official Engineering Knowledge Base

↓

Furniture Object Engine

↓

Production Formula Engine

↓

Production Drawing

↓

Cutting List

↓

Purchase List

Every production module shall use engineering rules provided by the Official Engineering Knowledge Base.

No production module shall perform engineering calculations independently.

---

# 13. Engineering Rule System

Every engineering record shall contain the engineering knowledge required for automatic production.

Engineering Rules may include:

- Recognition Rules
- Production Rules
- Calculation Rules
- Drawing Rules
- Cutting Rules
- Assembly Rules

Engineering Rules define how every product participates in furniture production.

Examples include:

Material Engineering

- Default Thickness
- Default Board Size
- Grain Direction
- Production Formula
- Cutting Formula

Hardware Engineering

- Hole Position
- Installation Formula
- Minimum Clearance
- Production Formula

Cabinet Engineering

- Structure Formula
- Panel Offset Rules
- Back Panel Rules
- Assembly Rules

Door Engineering

- Door Gap Rules
- Hinge Position Rules
- Handle Position Rules

The Production Formula Engine shall calculate every production result according to these Engineering Rules.

Engineering Rules are the foundation of automatic production.

---

# 14. Production Formula Relationship

The Official Engineering Knowledge Base does not perform calculations.

Instead, it provides engineering knowledge to the Production Formula Engine.

The relationship is:

Engineering Knowledge

↓

Production Formula Engine

↓

Calculated Result

↓

Furniture Object

↓

Production Drawing

↓

Cutting List

↓

Purchase List

The Production Formula Engine shall never invent engineering rules.

All engineering calculations must originate from the Official Engineering Knowledge Base.

---

# 15. Offline Engineering Principle

Furniture GO Version 1 is designed as a fully offline engineering system.

The complete Official Engineering Knowledge Base shall always be available without Internet access.

Every engineering rule required by Furniture GO Version 1 shall be built into the application.

Internet access shall never be required during normal production workflows.

Future online synchronization belongs only to future online versions of Furniture GO.

---

# 16. Universal Expansion Principle

The Official Engineering Knowledge Base is designed for continuous expansion.

There shall be no predefined limitation on engineering knowledge.

Future engineering knowledge may include, but is not limited to:

- Materials
- Hardware
- Cabinet Structures
- Door Systems
- Drawer Systems
- Glass Systems
- Aluminium Systems
- Edge Banding
- Countertop Systems
- Production Standards
- Construction Methods
- Recognition Rules
- Engineering Rules
- Industry Standards

The engineering architecture shall support unlimited future expansion without requiring structural redesign.

---

# 17. Malaysia Official Engineering Library

Furniture GO Version 1 includes a built-in Malaysia Official Engineering Library.

The Malaysia Official Engineering Library is the default engineering library distributed with Furniture GO.

The library contains standardized engineering knowledge commonly used within the Malaysian furniture industry.

Examples include:

- Board Materials
- Hardware
- Cabinet Structures
- Door Systems
- Drawer Systems
- Glass Systems
- Aluminium Profiles
- Edge Banding
- Countertops
- Standard Construction Methods
- Engineering Rules
- Production Rules
- Calculation Rules

The Malaysia Official Engineering Library operates completely offline.

Internet access is never required during production.

The Official Engineering Library remains read-only.

Users shall not:

- Add Engineering Records
- Modify Engineering Records
- Delete Engineering Records
- Rename Engineering Records

Only the Furniture GO Official Team may release Official Engineering Library updates.

Official Engineering Library updates are scheduled every six months.

Emergency engineering updates may be released separately when necessary.

Official Engineering Library updates shall never modify Factory Database contents automatically.

---

# 18. Future Regional Engineering Libraries

The Official Engineering Knowledge Base supports future regional engineering libraries.

Examples include:

- Singapore Official Engineering Library
- Australia Official Engineering Library
- United Kingdom Official Engineering Library
- Japan Official Engineering Library

Every regional engineering library shall follow the same Furniture GO Engineering Standard.

Regional engineering libraries may contain different engineering knowledge according to local furniture manufacturing practices.

The Furniture GO Engine shall support switching engineering libraries without changing the overall system architecture.

---

# 19. Design Principles

The Official Engineering Knowledge Base is one of the core systems of Furniture GO.

It provides standardized engineering knowledge for the entire production workflow.

The Engineering Knowledge Base supports:

- Product Recognition
- Engineering Recognition
- Furniture Object Generation
- Production Formula Engine
- Production Drawing Generation
- Cutting List Generation
- Purchase List Generation

The Engineering Knowledge Base defines engineering rules.

The Production Formula Engine executes engineering rules.

The Furniture Object Engine organizes engineering information.

Every production result generated by Furniture GO shall originate from standardized engineering knowledge.

The Engineering Knowledge Base remains completely independent from:

- Factory Database
- Inventory System
- Supplier System
- ERP System
- Purchasing System

The Engineering Knowledge Base is designed to become one of the world's most comprehensive offline furniture engineering knowledge systems.

---

# 20. Approval

Status: Confirmed

Version: v3.0