# Furniture GO
# Product Requirement Document (PRD)

# 18_Factory_Database_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 18_Factory_Database_System |
| Version | v2.0 |
| Status | Confirmed |
| Category | Database System |

---

# 1. Overview

The Factory Database System is the factory-specific extension layer of the Official Engineering Knowledge Base.

Its purpose is to allow each factory to maintain its own operational references while preserving one standardized engineering knowledge source.

The Factory Database does not contain engineering knowledge.

It does not contain production rules.

It does not contain calculation rules.

It does not contain drawing rules.

All engineering knowledge remains exclusively inside the Official Engineering Knowledge Base.

The Factory Database exists only to support factory operations and factory identification.

---

# 2. Objectives

The Factory Database System shall:

- Store factory-specific reference information.
- Support factory operations.
- Preserve Official Engineering Knowledge Base integrity.
- Support factory product identification.
- Support factory terminology.
- Support future factory expansion.

The Factory Database shall never replace the Official Engineering Knowledge Base.

---

# 3. Database Principles

The Factory Database is an extension layer of the Official Engineering Knowledge Base.

Every Factory Database record shall reference an existing Engineering Knowledge Record.

Factory Database records shall never create independent products.

Factory Database records shall never modify engineering knowledge.

Factory Database records shall only provide factory-specific reference information.

---

# 4. Database Ownership

Each factory owns and manages its own Factory Database.

Factory Database information belongs only to the corresponding factory.

Changes made by one factory shall never affect another factory.

Factory-specific information shall remain completely isolated from other factories.

---

# 5. Engineering Knowledge Relationship

Every Factory Database record shall always remain linked to one Engineering Knowledge Record.

The Factory Database shall never modify:

- Official Product Name
- Brand
- Model
- Specification
- Engineering Rules
- Production Rules
- Calculation Rules
- Drawing Rules
- Cutting Rules
- Assembly Rules

The Official Engineering Knowledge Base always remains the authoritative engineering source.

The Factory Database only provides factory-specific reference information.

---

# 6. Factory Record Structure

Every Factory Database record shall follow one standardized structure.

Each Factory Record may contain:

- Factory Record ID
- Engineering Record ID
- Factory Alias
- Factory Code
- Factory Material Code (Optional)
- Factory Hardware Code (Optional)
- Factory Remarks (Optional)
- Status
- Version

Every Factory Record shall remain linked to exactly one Engineering Record.

Factory Records shall never contain independent engineering definitions.

---

# 7. Factory Alias

The Factory Database shall support Factory Alias for every Engineering Record.

Factory Alias represents the terminology commonly used inside a factory.

Examples include:

- 18白
- 白CB
- 白板
- 黑ABS
- 大门铰

Multiple Factory Aliases may reference the same Engineering Record.

Factory Alias shall never replace the Official Engineering Name.

Factory Alias exists only to improve factory workflow and recognition.

---

# 8. Factory Code

The Factory Database shall support Factory Code for every Engineering Record.

Factory Code is defined independently by each factory.

Examples include:

- M001
- HW023
- ABS018
- GL005

Factory Codes are used only within the corresponding factory.

Factory Codes shall never replace Official Product Codes.

---

# 9. Factory Material Code

Factories may assign internal material codes to Engineering Records.

Examples include:

- WHITE18
- GREY18
- MDF09
- BKP03

Factory Material Codes are optional.

They are intended only for internal factory management.

---

# 10. Factory Hardware Code

Factories may assign internal hardware codes to Engineering Records.

Examples include:

- H001
- DR015
- HD210
- SL550

Factory Hardware Codes are optional.

They exist only for factory reference.

---

# 11. Product Identification

Furniture GO shall always identify products using the Official Engineering Knowledge Base.

The Factory Database provides additional factory references only.

During recognition, the standard identification workflow is:

Official Engineering Record

↓

Factory Alias

↓

Factory Code

↓

Factory Material Code

↓

Factory Hardware Code

↓

Matched Product

Official Engineering Records always have the highest priority.

Factory references shall never replace engineering identification.

---

# 12. Database Search

Furniture GO shall support searching Factory Database records using:

- Official Engineering Name
- Factory Alias
- Factory Code
- Factory Material Code
- Factory Hardware Code
- Brand
- Model

Search results shall always return the corresponding Engineering Record.

---

# 13. Database Consistency

Every Factory Database record shall always remain synchronized with its corresponding Engineering Record.

Factory-specific information shall never replace or override Official Engineering information.

Engineering knowledge shall always remain the authoritative source.

If an Engineering Record is updated through an official Furniture GO release, every linked Factory Record shall continue referencing the updated Engineering Record.

The relationship between Engineering Records and Factory Records shall remain permanent throughout the product lifecycle.

---

# 14. Database Independence

Each Factory Database operates independently.

Factory-specific information shall never be shared automatically with other factories.

Every factory maintains its own:

- Factory Alias
- Factory Code
- Factory Material Code
- Factory Hardware Code
- Factory Remarks

Changes inside one Factory Database shall never affect another Factory Database.

---

# 15. Factory Database Scope

The Factory Database stores factory-specific reference information only.

The Factory Database shall never store:

- Engineering Knowledge
- Recognition Rules
- Production Rules
- Calculation Rules
- Drawing Rules
- Cutting Rules
- Assembly Rules
- Product Specifications
- Official Product Definitions

These are maintained exclusively by the Official Engineering Knowledge Base.

The Factory Database exists only to improve factory operation and internal identification.

---

# 16. Database Usage

The Factory Database supports:

- Factory Identification
- Factory Terminology
- Internal Factory Search
- Factory Project Workflow
- Project Confirmation
- Recognition Assistance

The Factory Database does not perform engineering calculations.

The Factory Database does not generate production results.

The Factory Database does not determine product selection.

Engineering calculations are always performed by the Production Formula Engine using the Official Engineering Knowledge Base.

---

# 17. Factory Recognition Workflow

During project processing, the standard workflow shall be:

Project

↓

Recognition Engine

↓

Official Engineering Knowledge Base

↓

Engineering Record

↓

Factory Database

↓

Factory Alias / Factory Code

↓

Factory Display Information

The Factory Database is applied only after the Engineering Record has been successfully identified.

Factory information shall never participate in engineering recognition.

---

# 18. Factory Database Maintenance

Each factory is responsible for maintaining its own Factory Database.

Factory administrators may:

- Add Factory Aliases
- Edit Factory Aliases
- Remove Factory Aliases
- Add Factory Codes
- Edit Factory Codes
- Remove Factory Codes
- Update Factory Remarks

Factory maintenance shall never modify Engineering Records.

The integrity of the Official Engineering Knowledge Base shall always be preserved.

---

# 19. Factory Database Security

The Factory Database contains factory-specific operational information.

Furniture GO shall ensure that Factory Database information remains isolated from the Official Engineering Knowledge Base.

Factory-specific information shall never modify, overwrite or replace Official Engineering Records.

Each Factory Database shall remain accessible only to its corresponding factory.

The Factory Database shall always preserve the integrity of the Official Engineering Knowledge Base.

---

# 20. Future Expansion

The Factory Database architecture shall support future expansion without changing its core structure.

Future factory information may include:

- Factory Departments
- Factory Production Lines
- Machine References
- CNC Machine References
- Internal Workflow References
- Factory Labels

Future expansion shall remain limited to factory-specific reference information.

Engineering knowledge shall always remain inside the Official Engineering Knowledge Base.

---

# 21. Design Principles

The Factory Database is a factory reference system.

The Factory Database extends the Official Engineering Knowledge Base.

The Factory Database does not replace the Official Engineering Knowledge Base.

The Factory Database stores factory-specific information only.

The Factory Database improves factory workflow.

The Factory Database improves internal terminology.

The Factory Database improves internal searching.

The Factory Database supports factory project management.

The Factory Database shall never contain engineering knowledge.

The Factory Database shall never contain engineering rules.

The Factory Database shall never perform engineering calculations.

The Official Engineering Knowledge Base remains the only engineering authority within Furniture GO.

---

# 22. Relationship with Other Systems

The Factory Database cooperates with other core systems as follows:

Official Engineering Knowledge Base

↓

Recognition Engine

↓

Factory Database

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

The Factory Database supplies factory-specific reference information only.

All engineering calculations originate from the Official Engineering Knowledge Base and are executed by the Production Formula Engine.

---

# 23. Approval

Status: Confirmed

Version: v2.0