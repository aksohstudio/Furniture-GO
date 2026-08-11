# Furniture GO
# Product Requirement Document (PRD)

# 21_Project_Execution_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 21_Project_Execution_System |
| Version | v1.0 |
| Status | Confirmed |
| Category | Project Workflow |

---

# 1. Overview

The Project Execution System defines the complete workflow used by Furniture GO from the moment a project is received until production documents are generated.

It establishes a standardized execution process to ensure that every project is reviewed, confirmed, verified, and approved before entering production.

The system separates project review, project confirmation, and production generation into independent stages to maximize production accuracy.

---

# 2. Objectives

The Project Execution System shall:

- Standardize the entire project workflow
- Protect the original designer drawing
- Support editable working documents
- Assist users with AI project review
- Allow on-site modification and confirmation
- Ensure production data accuracy
- Generate production documents only after confirmation
- Maintain complete project history
- Support future project revisions

---

# 3. Core Workflow

Furniture GO shall follow the workflow below.

```text
Receive Original PDF

↓

Import into Furniture GO

↓

AI Scan Entire PDF

↓

Generate Review Report

↓

Create

Original PDF
(Read Only)

+

Backup PDF
(Editable)

↓

Production Scope Selection

↓

Site Measurement

↓

Discussion & Confirmation

↓

Lock Backup PDF

↓

Generate Project Database

↓

Automatic Verification

↓

Generate Production Documents
```

No production documents shall be generated before the project is confirmed.

---

# 4. AI Project Review

Immediately after importing the designer's PDF, Furniture GO shall perform a complete AI project review.

The AI review shall analyze the entire drawing before any production calculation begins.

The review includes:

- Environment
- Cabinets
- Dimensions
- Materials
- Hardware
- Duplicate Information
- Missing Information
- Inconsistent Information
- Possible Errors

The AI review assists users in identifying potential issues but shall never make production decisions automatically.

---

# 5. Review Report

After AI scanning is completed, Furniture GO shall generate a Review Report.

The Review Report is the project's working issue list.

Its purpose is to help users review and confirm the project before production.

The Review Report shall not generate any production documents.

---

## Review Report Contents

Each issue shall include:

- Room
- Location
- Problem
- Severity
- AI Status
- Issue Status

Issue Status includes:

- Pending
- Resolved
- Accepted

---

## AI Status

Furniture GO shall not display AI confidence percentages.

Instead, AI shall display simplified status indicators.

Available statuses include:

- Verified
- Needs Review
- Critical

The objective is to help users focus on important issues without exposing unnecessary technical information.

---

## Navigation

Selecting an issue from the Review Report shall automatically:

- Open the related PDF page
- Locate the related object
- Highlight the affected area

Users shall not manually search through the drawing for the reported issue.

---

# 6. AI Review Principles

Furniture GO follows the principle:

**AI Assists, Humans Decide.**

Artificial Intelligence may:

- Detect problems
- Detect inconsistencies
- Detect missing information
- Compare drawings
- Provide project analysis

Artificial Intelligence shall never:

- Automatically modify drawings
- Automatically modify dimensions
- Automatically change construction methods
- Automatically approve production
- Replace professional judgement

Final decisions always belong to the user.

---

# 7. Review Before Production

Furniture GO shall never generate production documents immediately after importing drawings.

Every project must first complete the Review Stage.

Users review:

- Drawing Issues
- Site Conditions
- Dimension Corrections
- Construction Notes
- Production Scope

Only after user confirmation may the project continue to the production stage.

---

# 8. Original PDF

Furniture GO shall permanently preserve the designer's original drawing.

The Original PDF serves as the project's reference document.

The Original PDF shall:

- Be Read Only
- Never be modified
- Never be overwritten
- Never be deleted automatically
- Remain available for future comparison

Every imported drawing shall retain its original content.

---

# 9. Backup PDF

After the AI Review is completed, Furniture GO shall automatically create an editable Backup PDF.

The Backup PDF becomes the project's working document.

All project modifications shall be performed on the Backup PDF.

The Original PDF shall remain unchanged.

---

## Backup PDF Supports

The Backup PDF shall support:

- Dimension Modification
- Text Notes
- Construction Notes
- Problem Marking
- Site Records
- Drawing Annotations
- Highlighter Marking
- Apple Pencil Handwriting

The Backup PDF represents the latest working version of the project.

---

# 10. Production Scope Selection

Furniture GO shall never assume that every cabinet shown in the designer's drawing belongs to the current project.

Users shall define the production scope before production begins.

---

## Highlighter Selection

The Backup PDF shall provide a Highlighter tool.

Users highlight the cabinets that belong to the current project.

Highlighted objects become part of the production scope.

Objects that are not highlighted shall be excluded from production.

---

## Included Objects

Only highlighted objects shall enter:

- Project Database
- Material List
- Hardware List
- Cutting List
- Shop Drawings
- Quotation
- Manufacturing Documents

---

## Excluded Objects

Objects that are not highlighted:

- Shall remain visible in the PDF
- Shall not enter the Project Database
- Shall not participate in production calculation
- Shall not appear in production documents

This allows partial project execution without modifying the original drawing.

---

# 11. Site Measurement

During site measurement, users shall edit the Backup PDF directly.

Supported modifications include:

- Dimensions
- Construction Methods
- Notes
- Site Conditions
- Questions
- Problems Found
- Additional Information

All modifications shall be stored only inside the Backup PDF.

The Original PDF shall never be modified.

---

# 12. Apple Pencil Support

Furniture GO shall fully support Apple Pencil.

Supported operations include:

- Handwriting
- Free Drawing
- Highlighting
- Circle Marking
- Arrow Marking
- Free Annotation
- Eraser

Apple Pencil is designed for fast on-site communication and documentation.

---

# 13. Structured Data Principle

Furniture GO distinguishes between Reference Information and Structured Data.

---

## Reference Information

Reference Information includes:

- Handwriting
- Free Notes
- Circles
- Arrows
- Highlighter Marks
- Sketches

Reference Information exists only for human communication.

It shall not directly modify the Project Database.

---

## Structured Data

Structured Data includes:

- Cabinet Type
- Dimensions
- Material
- Hardware
- Construction Method
- Board Thickness
- Edge Banding
- Production Parameters

Structured Data shall only be created through structured user input.

Only Structured Data may enter the Project Database.

---

## Core Principle

Furniture GO follows the principle:

**Reference Notes are for humans. Structured Data is for the system.**

Handwritten notes remain part of the Backup PDF.

Production calculations always use Structured Data stored inside the Project Database.

---

# 14. Working Document Principle

Before project confirmation:

The Backup PDF is the project's only working document.

Furniture GO shall not:

- Generate Project Database
- Generate Material List
- Generate Hardware List
- Generate Cutting List
- Generate Shop Drawings
- Generate Quotations

Only after the Backup PDF is confirmed and locked may production generation begin.

---

# 15. Lock Backup PDF

After project review and confirmation are completed, users may lock the Backup PDF.

The Locked Backup PDF becomes the project's official production reference.

Only a Locked Backup PDF may generate production data.

---

## Lock Verification

Before locking the project, Furniture GO shall automatically verify:

- Pending Issues
- Missing Information
- Dimension Conflicts
- Cabinet Conflicts
- Unknown Materials
- Missing Hardware

If unresolved issues remain, the system shall notify the user.

Users may choose:

- Continue Lock
- Return to Review

The final decision always belongs to the user.

---

# 16. Project Database

After the Backup PDF is locked, Furniture GO shall generate a Project Database.

The Project Database becomes the project's only production data source.

All production modules shall read data only from the Project Database.

No production module shall directly read the PDF after the Project Database has been created.

---

## Project Database Structure

The Project Database shall organize information using the following hierarchy:

```text
Project

↓

Room

↓

Cabinet

↓

Cabinet Components

• Panels
• Doors
• Drawers
• Materials
• Hardware
• Accessories
• Construction Data
```

The Project Database represents the confirmed production information for the project.

---

# 17. Snapshot Principle

When a Project Database is created, it becomes an independent project snapshot.

The snapshot stores:

- Project Information
- Factory Rules
- Material Mapping
- Hardware Mapping
- Production Parameters

Future updates to the Factory Database shall not automatically modify existing Project Databases.

Each project permanently preserves the production rules that existed when it was confirmed.

---

# 18. Unknown Mapping

If AI detects materials, hardware or production data that cannot be matched to the Factory Database, the project shall continue.

Unknown items shall be marked as:

- Needs Mapping

Unknown items shall automatically appear in the Review Report.

Users may manually map the unknown item to an existing Factory Database record.

After mapping is completed:

- The Project Database shall update automatically.
- Related production calculations shall update automatically.

Furniture GO shall never modify the Factory Database automatically.

---

# 19. Automatic Verification

After the Project Database has been generated, Furniture GO shall automatically verify production consistency.

Verification includes:

- Material List
- Hardware List
- Cutting List
- Cabinet Completeness
- Dimension Completeness

The objective is to ensure that all production information remains internally consistent.

Production documents shall only be generated after verification has completed successfully.

---

# 20. Smart Regeneration

When project revisions modify confirmed production data, Furniture GO shall analyze the impact before regenerating production documents.

Only affected production documents shall be regenerated.

Unaffected documents shall remain unchanged.

---

## Verification Before Keeping

Before keeping an existing production document, Furniture GO shall verify that the document is not affected by the latest project changes.

The system shall never assume that a document is unaffected.

Only verified documents may remain valid.

---

## Core Principle

Furniture GO follows the principle:

**Never Assume. Always Verify.**

Accuracy shall always have higher priority than generation speed.

---

# 21. Drawing Comparison

When a new drawing belonging to an existing project is imported, Furniture GO shall preserve all previous drawings.

The system shall never overwrite existing drawings automatically.

Furniture GO shall compare the new drawing with the current confirmed project.

---

## Drawing Comparison Report

The comparison report shall identify:

- Added Cabinets
- Removed Cabinets
- Modified Cabinets
- Dimension Changes
- Material Changes
- Hardware Changes
- Added Pages
- Removed Pages
- Modified Pages

Users shall decide how the new drawing is handled.

---

## Available Actions

Users may choose:

- Compare with Current Project
- Create New Project
- Cancel

If users accept the updated drawing, Furniture GO shall create a new Project Revision.

---

# 22. Unlock Project

If a confirmed project requires modification, users shall first unlock the project.

Unlocking a project returns the project to editing mode.

The Backup PDF becomes editable again.

---

## Unlock Workflow

```text
Locked Project

↓

Unlock Project

↓

Edit Backup PDF

↓

Lock Backup PDF

↓

Generate New Project Database

↓

Automatic Verification

↓

Generate New Production Documents
```

Users shall not directly modify a locked project.

---

# 23. Production Document Status

When a project is unlocked, all previously generated production documents shall immediately become outdated.

Affected documents include:

- Material List
- Hardware List
- Cutting List
- Shop Drawings
- Quotation
- Manufacturing Documents

Outdated documents shall not be used for production.

Furniture GO shall clearly indicate each document's current status.

---

## Document Status

Production documents may have the following states:

- Valid
- Outdated
- Generating
- Failed

Only documents marked as **Valid** shall be considered production-ready.

---

# 24. Project Revision

Every confirmed project modification shall create a new Project Revision.

Furniture GO shall never overwrite previous confirmed project versions.

Each revision represents a complete production snapshot.

---

## Revision Workflow

```text
Locked Project

↓

Unlock Project

↓

Modify Backup PDF

↓

Lock Backup PDF

↓

Create New Revision

↓

Generate New Project Database

↓

Generate New Production Documents
```

---

## Revision Information

Each revision shall record:

- Revision Number
- Revision Name
- Created Date
- Created By
- Lock Status
- Review Report
- Project Database
- Production Documents

Every revision shall remain permanently available.

---

# 25. Revision History

Furniture GO shall permanently preserve the history of every project revision.

Users may:

- View Revision
- Compare Revisions
- Export Revision
- Restore Revision

Restoring a previous revision shall create a new revision.

Previous revisions shall never be overwritten.

---

# 26. Review History

The Review Report shall remain permanently attached to the project.

Each issue shall preserve:

- Issue ID
- Room
- Location
- Problem
- AI Status
- Issue Status
- Created Time
- Resolved Time
- Resolved By

Completed issues remain available for future reference.

Furniture GO shall maintain a complete review history throughout the project's lifecycle.

---

# 27. Design Principles

The Project Execution System follows the principles defined in
**01_Product_Vision.md**.

Core principles include:

- AI Assists, Humans Decide
- Single Source of Truth
- Review Before Production
- Offline First
- User Data Ownership
- Fast • Convenient • Accurate

Additionally, the Project Execution System follows:

- Original PDF is permanently preserved.
- Backup PDF is the only working document.
- Locked Backup PDF is the only production source.
- Project Database is the only production database.
- Production Scope is defined by the user.
- Every major modification creates a new revision.
- Production documents shall never be generated from unconfirmed data.
- Production documents shall never be generated from outdated data.
- Every project shall maintain complete revision history.
- Every project shall maintain complete review history.

---

# 28. Approval

Status: Confirmed

Version: v1.0

Approved