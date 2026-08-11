# Furniture GO
# Product Requirement Document (PRD)

# 24_Cutting_Generation_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 24_Cutting_Generation_System |
| Version | v1.0 |
| Status | Confirmed |
| Category | Production Generation |

---

# 1. Overview

The Cutting Generation System is responsible for generating all cutting documents required for factory production.

The system reads only from the confirmed Project Database.

All cutting information shall originate from confirmed production data.

The Cutting Generation System never reads directly from PDF drawings.

---

# 2. Objectives

The Cutting Generation System shall:

- Read the confirmed Project Database
- Generate the Detailed Cutting List
- Generate the Summary Cutting List
- Automatically group identical panel sizes
- Automatically sort cutting information
- Support panel saw production
- Maintain consistency with the Project Database

---

# 3. Input Source

The Cutting Generation System reads only from the confirmed Project Database.

The system shall never read directly from:

- Original PDF
- Backup PDF
- AI Scan Results
- Review Report

The Project Database is the only source of cutting information.

---

# 4. Generation Workflow

```text
Project Database

↓

Read Panel Objects

↓

Read Material References

↓

Generate Detailed Cutting List

↓

Generate Summary Cutting List

↓

Factory Production
```

---

# 5. Detailed Cutting List

The Detailed Cutting List is designed for factory workers.

Each panel shall display:

- Room
- Cabinet
- Material
- Panel Size
- Quantity
- Panel Name
- Remarks (if any)

---

## Example

```text
Master Bedroom

Wardrobe W01

18mm White Board

560 × 720 = 2      Side Panel（侧板）

────────────────────

564 × 147 = 2      Top & Bottom Panel（上下板）

────────────────────

720 × 560 = 5      Shelf（层板）
```

---

# 6. Panel Name Rule

Panel names shall be displayed in both English and Chinese.

Examples include:

- Side Panel（侧板）
- Top & Bottom Panel（上下板）
- Shelf（层板）
- Back Panel（背板）
- Drawer Side（抽侧板）
- Drawer Front（抽前板）
- Drawer Back（抽后板）
- Drawer Bottom（抽底板）

Factory aliases shall be used if available.

Otherwise, Furniture GO default names shall be used.

---

# 7. Dimension Grouping Rule

Panels having identical:

- Material
- Width
- Height
- Panel Name

shall be automatically grouped.

The dimension shall only appear once.

If multiple identical panels share the same purpose, the quantity shall be combined.

If identical dimensions have different purposes, the dimension shall still appear only once, while each purpose shall be listed separately.

Example:

```text
720 × 560 = 6

Shelf（层板） × 5

Top Panel（顶板） × 1
```

---

# 8. Summary Cutting List

The Summary Cutting List is designed for panel saw production.

It contains only cutting information.

It shall not display:

- Room
- Cabinet
- Panel Name
- Remarks

---

## Example

```text
600mm

18mm White Board

2400 × 600 = 3

1900 × 600 = 4

────────────────────

8mm White Board

2400 × 600 = 5

────────────────────

12mm White Board

1800 × 600 = 2

================================================

500mm

18mm White Board

2400 × 500 = 2

────────────────────

3mm White Board

2400 × 500 = 6
```

---

# 9. First Cut Rule

The Summary Cutting List shall group panels by First Cut Width.

Within each width group:

- Materials shall be separated.
- Panel lengths shall be sorted from longest to shortest.

This layout supports efficient panel saw production.

---

# 10. Sorting Rule

Furniture GO shall automatically sort cutting information using:

1. First Cut Width
2. Material
3. Length (Longest to Shortest)

Panels with identical dimensions shall be automatically grouped.

---

# 11. Grain Direction Rule

Furniture GO shall determine whether grain direction is required based on the Material Database.

Materials requiring grain direction shall automatically display the grain indicator.

Materials without grain direction requirements shall not display any direction.

Users are not required to manually configure grain direction.

---

# 12. Remark Rule

Approved remarks stored in the Project Database shall be displayed only in the Detailed Cutting List.

The Summary Cutting List shall never display remarks.

---

# 13. Panel ID Rule

Every panel shall maintain a unique internal Panel ID.

Panel IDs are used only by the system.

Panel IDs shall never be displayed in either Cutting List.

---

# 14. Database Consistency

The Cutting Generation System shall always remain synchronized with the Project Database.

Whenever the Project Database changes, both Cutting Lists shall be regenerated.

Furniture GO shall never manually edit generated Cutting Lists.

---

# 15. Design Principles

Furniture GO generates Cutting Lists only from the confirmed Project Database.

The Detailed Cutting List is designed for factory workers.

The Summary Cutting List is designed for panel saw production.

The system automatically groups identical panel dimensions.

The system automatically groups panels by First Cut Width.

The system automatically determines grain direction from the Material Database.

Panel IDs remain internal to the system.

Production remarks are displayed only in the Detailed Cutting List.

The Cutting Generation System is designed for manual panel saw production rather than CNC production.

---

# Approval

Status: Confirmed

Version: v1.0