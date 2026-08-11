# Furniture GO
# Product Requirement Document (PRD)

# 06_Project_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 06_Project_System |
| Version | v3.0 |
| Status | Confirmed |
| Category | Project Management |

---

# 1. Overview

The Project System is responsible for managing the complete lifecycle of every project inside Furniture GO.

A Project represents one complete furniture engineering and production project.

The Project System organizes all project information from imported Designer Documents through Engineering Records, Furniture Objects, Production Data, and final Project Documents.

Furniture GO manages complete projects rather than individual drawings or individual furniture items.

---

# 2. Objectives

The Project System shall:

- Manage complete Projects.
- Organize Designer Documents.
- Organize Engineering Records.
- Organize Furniture Objects.
- Organize Production Data.
- Organize Project Documents.
- Preserve Project History.
- Support complete project traceability.

The Project System shall not perform engineering calculations.

---

# 3. Project Structure

Every Project shall follow the same structure.

Project

↓

Designer Documents

↓

Recognition

↓

Engineering Records

↓

Project Confirmation

↓

Furniture Objects

↓

Production Data

↓

Project Package

The Project shall always be the highest-level object within Furniture GO.

Every engineering object and production document shall belong to one Project.

---

# 4. Designer Documents

A Project may contain multiple Designer Documents.

Supported document types may include:

- Designer PDF
- DWG Drawings
- Supported Images
- Project Notes
- Site Survey Records
- Site Photos
- Measurement Records

Multiple documents shall belong to one Project.

Furniture GO shall treat all imported documents as one complete project.

---

# 5. Recognition Management

Every Project shall maintain one complete Recognition process.

The Recognition process shall include:

- AI Recognition
- Furniture Intelligence
- Project Recognition and Analysis
- Engineering Issue Detection
- Engineering Review

Recognition results shall become part of the Project.

The Project System shall manage Recognition results without modifying them.

---

# 6. Engineering Record Management

Every Project shall maintain one complete collection of Engineering Records.

Engineering Records may include:

- Geometry Information
- Engineering Features
- Material References
- Hardware References
- Dimensions
- Designer Notes
- Recognition Results

Engineering Records shall become the official engineering foundation of the Project.

The Project System shall preserve every Engineering Record throughout the Project lifecycle.

---

# 7. Furniture Object Management

After Project Confirmation, every confirmed Engineering Record shall generate one or more Furniture Objects.

The Project System shall organize all Furniture Objects within the Project.

Every Furniture Object shall remain linked to:

- Project
- Floor
- Room
- Designer Documents
- Engineering Record
- Production Data

The Project System shall never modify Furniture Objects directly.

---

# 8. Production Data Management

The Project System shall organize all production data generated during the production workflow.

Production Data may include:

- Production Formula Results
- Production Boards
- Material Information
- Hardware Information
- Cutting Information
- Manufacturing Requirements
- Shop Drawing Data

The Project System shall organize production data only.

Production calculations shall be performed by dedicated production engines.

---

# 9. Project Status Management

Every Project shall maintain an overall Project Status.

Supported Project Statuses may include:

- Project Imported
- Recognition In Progress
- Engineering Review
- Project Confirmation
- Production Ready
- Production In Progress
- Completed
- Archived

Project Status shall represent the overall lifecycle of the Project.

Individual Engineering Records and Furniture Objects may maintain their own independent statuses.

---

# 10. Project Document Management

Every Project shall maintain one complete collection of Project Documents.

Project Documents may include:

- Original Designer Documents
- Editable Project PDF
- Recognition Reports
- Engineering Review Lists
- Engineering Records
- Production Documents
- Shop Drawings
- Project Reports
- Project Package

Every Project Document shall remain associated with its corresponding Project.

The Project System shall organize Project Documents only.

Document generation shall be performed by dedicated systems.

---

# 11. Project History

The Project System shall preserve the complete history of every Project.

Project History may include:

- Project Creation
- Document Imports
- Recognition History
- Engineering State History
- Project Revisions
- Production History
- Project Archive

Historical records shall never be overwritten.

Every historical version shall remain available for future review.

---

# 12. Project Traceability

Every Project shall maintain complete traceability throughout its lifecycle.

Traceability shall include relationships between:

- Designer Documents
- Recognition Results
- Engineering Records
- Furniture Objects
- Production Formula Results
- Production Boards
- Production Documents
- Project Package

Every production result shall be traceable back to its originating Designer Documents.

---

# 13. System Integration

The Project System shall integrate with:

- Project Recognition and Analysis Engine
- Project Confirmation System
- Furniture Object Engine
- Official Engineering Knowledge Base
- Factory Reference Database System

The Project System shall organize outputs generated by:

- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Furniture Shop Drawing Generation Engine
- Project Document Package Engine

The Project System shall never perform engineering calculations or production calculations.

---

# 14. Project Reliability

The Project System shall preserve the integrity and consistency of every Project throughout its lifecycle.

The Project System shall never:

- Modify Engineering Records
- Modify Furniture Objects
- Modify Production Formula Results
- Modify Production Boards
- Modify Production Documents
- Overwrite historical Project data

Every Project shall remain a complete and reliable representation of its engineering and production history.

---

# 15. Design Principles

The Project System shall follow these principles:

1. Project Lifecycle Management
2. Complete Project Organization
3. Full Project Traceability
4. Automatic Project History Preservation
5. Centralized Project Management
6. No Engineering Calculations
7. No Production Calculations
8. No Automatic Engineering Decisions
9. Fully Offline Operation
10. Expandable Through Future Project Modules

---

# 16. Scope

This PRD defines only the Project System.

The following systems are defined separately:

- Project Recognition and Analysis Engine
- Project Confirmation System
- Furniture Intelligence Engine
- Furniture Object Engine
- Official Engineering Knowledge Base
- Factory Reference Database System
- AI Recognition Database System
- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Furniture Shop Drawing Generation Engine
- Project Document Package Engine

The Project System is responsible only for managing, organizing, preserving, and tracing complete Project information.

Recognition belongs exclusively to the Project Recognition and Analysis Engine.

Engineering confirmation belongs exclusively to the Project Confirmation System.

Furniture Object generation belongs exclusively to the Furniture Object Engine.

Production calculations belong exclusively to the Production Formula Engine.

---

# 17. Approval

Status: Confirmed

Version: v3.0

This document is the official specification of the Furniture GO Project System.