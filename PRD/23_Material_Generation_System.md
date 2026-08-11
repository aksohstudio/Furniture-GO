# Furniture GO
# Product Requirement Document (PRD)

# 23_Material_Generation_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 23_Material_Generation_System |
| Version | v1.0 |
| Status | Confirmed |
| Category | Production Generation |

---

# 1. Overview

The Material Generation System is responsible for generating the purchasing material list for a confirmed project.

The system reads only from the confirmed Project Database.

It summarizes all required materials for the entire project and produces a purchasing document.

The Material Generation System never reads directly from PDF drawings.

---

# 2. Objectives

The Material Generation System shall:

- Read the confirmed Project Database
- Generate the Material List
- Automatically summarize identical materials
- Automatically calculate required quantities
- Support purchasing preparation
- Maintain consistency with the Project Database

---

# 3. Input Source

The Material Generation System reads only from the confirmed Project Database.

The system shall never read directly from:

- Original PDF
- Backup PDF
- AI Scan Results
- Review Report

The Project Database is the only source of production information.

---

# 4. Generation Workflow

```text
Project Database

↓

Read Panel Objects

↓

Read Material References

↓

Group Identical Materials

↓

Calculate Total Quantity

↓

Generate Material List
```

---

# 5. Material Reading

The system shall read every Panel Object stored inside the Project Database.

Each Panel references its Material ID.

Material information is obtained through the Material Reference.

The Material Generation System shall not duplicate material information.

---

# 6. Material Grouping

The system shall automatically group identical materials throughout the entire project.

Materials shall be grouped using:

- Material ID
- Specification
- Thickness

Materials with different Material IDs shall never be merged.

Materials with different specifications shall never be merged.

Materials with different thicknesses shall never be merged.

---

# 7. Quantity Calculation

After grouping, Furniture GO shall automatically calculate the total quantity required for each material.

The calculated quantity represents the total purchasing requirement for the entire project.

---

# 8. Material List

The Material List is a purchasing document.

Its purpose is to prepare materials before production begins.

The Material List summarizes the entire project.

It does not describe individual production parts.

---

## Material List Contents

Each material shall include:

- Material Name
- Specification
- Thickness
- Total Quantity

The system shall automatically determine the correct specification from the Material Database.

---

# 9. Material List Exclusions

The Material List shall not contain:

- Room
- Cabinet
- Panel Dimensions
- Panel Quantity
- Production Information

These belong to the Cutting List.

---

# 10. Material List Example

```text
Project : ABC House

--------------------------------

18mm White Board (4×8)
25 pcs

--------------------------------

18mm Wood Grain Board (4×8)
18 pcs

--------------------------------

8mm Double White Board (4×8)
6 pcs

--------------------------------

ABS 1mm White
3 rolls
```

---

# 11. Database Consistency

The Material Generation System shall always remain synchronized with the Project Database.

Whenever the Project Database changes, the Material List shall be regenerated.

Furniture GO shall never manually edit generated Material Lists.

---

# 12. Design Principles

Furniture GO generates Material Lists only from the confirmed Project Database.

The Material List is designed for purchasing.

The Material List summarizes the entire project.

The Material List automatically groups identical materials.

The Material List automatically calculates total quantities.

The Material List never contains production dimensions.

Production dimensions belong to the Cutting List.

---

# Approval

Status: Confirmed

Version: v1.0