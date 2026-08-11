# Furniture GO
# Product Requirement Document (PRD)

# 09_Project_Recognition_and_Analysis_Engine

---

## Document Information

| Item | Value |
|------|-------|
| Document | 09_Project_Recognition_and_Analysis_Engine |
| Version | v2.0 |
| Status | Confirmed |
| Category | Recognition Engine |

---

# 1. Overview

The Project Recognition and Analysis Engine is responsible for understanding the complete Designer Project before any engineering or production process begins.

Its responsibility is to recognize, correlate, organize, and analyze project information from imported drawings and generate confirmed Engineering Records.

The Project Recognition and Analysis Engine does not perform engineering calculations.

It does not generate Furniture Objects.

It does not generate Production Boards.

It does not determine manufacturing methods.

Its responsibility is only to transform project information into structured Engineering Records for downstream systems.

---

# 2. Input Sources

The Project Recognition and Analysis Engine shall support multiple project input sources.

Supported sources include:

- Designer PDF
- DWG Drawings
- Supported Images
- Furniture Drawings
- Architecture Drawings
- Electrical Drawings
- Ceiling Drawings
- Plumbing Drawings
- Other Related Project Drawings

One project may contain multiple source documents.

The engine shall analyze all imported sources as one complete project.

---

# 3. Whole Project Recognition

The Project Recognition and Analysis Engine shall analyze the complete project before generating Engineering Records.

The engine shall:

- Read every imported source.
- Correlate information across all drawings.
- Recognize project geometry.
- Recognize engineering features.
- Recognize designer intent.
- Build complete Engineering Records.

Only after the complete project has been analyzed may downstream systems continue.

---

# 4. Project Organization

After project recognition has been completed, the engine shall automatically organize the project.

Project hierarchy:

Project

↓

Floor

↓

Room

↓

Furniture

↓

Related Drawings

Each Furniture Object candidate shall collect all related drawings regardless of their original document location.

Examples include:

- Layout
- Elevation
- Section
- Internal Details
- Construction Details
- Other Related Drawings

The engine shall organize project information by Furniture rather than by document order.

---

# 5. Information Correlation

The Project Recognition and Analysis Engine shall automatically correlate information collected from all imported project sources.

Correlation may include:

- Furniture Drawings
- Architecture Drawings
- Electrical Drawings
- Ceiling Drawings
- Plumbing Drawings
- Other Related Drawings

The objective is to understand one Furniture Object candidate using all available project information.

The engine shall never assume that complete engineering information exists within a single drawing.

---

# 6. Geometry Recognition

The Project Recognition and Analysis Engine shall recognize geometry from imported project sources.

Recognized geometry may include:

- Rectangle
- Square
- Circle
- Radius
- Arc
- Chamfer
- Notch
- Cutout
- Irregular Shape

Recognized geometry shall become part of the corresponding Engineering Record.

The engine shall recognize geometry only.

The engine shall never simplify, redesign, or modify the original designer geometry.

---

# 7. Engineering Feature Recognition

The Project Recognition and Analysis Engine shall recognize engineering-related features from imported project sources.

Recognized features may include:

- Curved Cabinet
- Curved Counter
- Curved End Panel
- Bay Window
- Column Wrap
- Pipe Cutout
- Sink Cutout
- Appliance Cutout
- Decorative Curve
- Fluted Panel
- Feature Wall
- Ceiling Feature

Recognized engineering features shall become part of the corresponding Engineering Record.

The Project Recognition and Analysis Engine shall never determine manufacturing methods.

Manufacturing methods shall be determined later by the Official Engineering Knowledge Base together with the Production Formula Engine.

---

# 8. Engineering Information Verification

The Project Recognition and Analysis Engine shall verify engineering information rather than document quantity.

Verification may include:

- Information Completeness
- Information Consistency
- Engineering Readiness

The engine shall determine whether sufficient engineering information exists to build Engineering Records.

The engine shall never require every drawing type to exist.

If required engineering information already exists elsewhere within the project, no missing drawing issue shall be generated.

---

# 9. Engineering Record Generation

After recognition and verification have been completed, the Project Recognition and Analysis Engine shall automatically generate Engineering Records.

Every Engineering Record may contain:

- Geometry Information
- Dimensions
- Recognized Features
- Material References
- Hardware References
- Designer Notes
- Recognition Confidence
- Related Drawings

Engineering Records become the official recognition output used by downstream systems.

The Project Recognition and Analysis Engine shall never generate Furniture Objects or Production Formula results.

---

# 10. Engineering Issue Detection

After Engineering Records have been generated, the Project Recognition and Analysis Engine shall automatically detect engineering issues.

Engineering issues may include:

- Missing Engineering Information
- Dimension Conflicts
- Geometry Conflicts
- Drawing Conflicts
- Material Conflicts
- Hardware Conflicts
- Environment Conflicts
- Electrical Conflicts
- Ceiling Conflicts
- Plumbing Conflicts

Every detected issue shall be linked to its corresponding Engineering Record.

The Project Recognition and Analysis Engine shall identify engineering risks only.

It shall never resolve engineering issues automatically.

---

# 11. Engineering Review List

After issue detection has been completed, the Project Recognition and Analysis Engine shall automatically generate an Engineering Review List.

The Engineering Review List may include:

- Missing Engineering Information
- Dimension Conflicts
- Geometry Conflicts
- Unrecognized Objects
- Manual Correlation Required
- Site Verification Required

The Engineering Review List becomes the primary review list before Project Confirmation.

Every Engineering Review Item shall reference its corresponding Engineering Record.

---

# 12. Project Dashboard

After project recognition has been completed, Furniture GO shall display the Project Dashboard.

The Project Dashboard provides a complete overview of the recognized project.

The dashboard may include:

- Project Name
- Floor List
- Room List
- Furniture Count
- Engineering Record Count
- Engineering Issue Count
- Project Status

Users may directly access:

- Engineering Review List
- Editable Project PDF
- Floor List
- Room List
- Furniture List
- Engineering Records

The Project Dashboard becomes the primary entry point for project review.

---

# 13. Manual Correlation

If the Project Recognition and Analysis Engine cannot confidently determine the relationship between recognized information, the system shall never make engineering decisions automatically.

Instead, Furniture GO shall:

- Suggest the most likely correlation
- Display AI Recognition Confidence
- Request user confirmation

After user confirmation:

- The corresponding Engineering Record shall be updated.
- The Engineering Review List shall be updated.
- The Project Dashboard shall be updated.

Only confirmed correlations may enter downstream systems.

---

# 14. Designer Revision Management

The Project Recognition and Analysis Engine shall preserve every imported Designer Revision.

Example:

Project

├── Original.pdf

├── Revision 01.pdf

├── Revision 02.pdf

└── Revision 03.pdf (Current)

Rules:

- Every revision shall remain permanently stored.
- The latest revision becomes the Current Revision.
- Previous revisions shall be marked as Superseded.
- Recognition shall always use the Current Revision unless the user selects another revision.

Recognition history shall remain available for future reference.

---

# 15. Editable Project PDF

The Project Recognition and Analysis Engine shall automatically generate one Editable Project PDF for every imported project.

The Original Designer Documents shall always remain unchanged.

Users shall perform all project annotations on the Editable Project PDF.

Supported annotations may include:

- Dimension Updates
- Site Notes
- Engineering Notes
- User Remarks
- Confirmation Records

The Editable Project PDF shall remain synchronized with the corresponding Engineering Records.

The Original Designer Documents shall always remain preserved.

---

# 16. Project Status

The Project Recognition and Analysis Engine shall continuously update the Recognition Status of every project.

Recognition statuses may include:

- Project Imported
- Recognition In Progress
- Engineering Records Generated
- Engineering Review Required
- Manual Correlation Required
- Site Verification Required
- Ready for Project Confirmation

The Recognition Status shall always reflect the latest recognition progress.

Recognition Status shall not represent production status.

Production status shall be managed separately by the Project Confirmation System.

---

# 17. System Integration

The Project Recognition and Analysis Engine shall integrate with:

- AI Recognition Engine
- Official Engineering Knowledge Base
- Factory Reference Database System

The generated Engineering Records shall be used by:

- Project Confirmation System
- Furniture Object Engine
- Future Recognition Improvement Systems

The Project Recognition and Analysis Engine shall never perform engineering calculations.

The Project Recognition and Analysis Engine shall never generate Furniture Objects.

The Project Recognition and Analysis Engine shall never generate Production Formula results.

---

# 18. Design Principles

The Project Recognition and Analysis Engine shall follow these principles:

1. Recognition Driven
2. Engineering Record Generation Only
3. Whole Project Recognition
4. Automatic Information Correlation
5. Automatic Engineering Issue Detection
6. Manual Confirmation When Required
7. No Independent Engineering Calculations
8. No Automatic Manufacturing Decisions
9. Fully Offline Operation
10. Expandable Through Official Engineering Knowledge

---

# 19. Scope

This PRD defines only the Project Recognition and Analysis Engine.

The following systems are defined separately:

- AI Recognition Engine
- Official Engineering Knowledge Base
- Factory Reference Database System
- Project Confirmation System
- Furniture Object Engine
- Production Formula Engine
- Board Generation Engine
- Cutting Optimization Engine
- Manufacturing Requirements Engine
- Furniture Shop Drawing Generation Engine
- Project Document Package Engine

The Project Recognition and Analysis Engine is responsible only for recognizing, correlating, analyzing, and organizing project information into Engineering Records.

Engineering confirmation belongs exclusively to the Project Confirmation System.

Furniture Object generation belongs exclusively to the Furniture Object Engine.

Engineering calculations belong exclusively to the Production Formula Engine.

---

# 20. Approval

Status: Confirmed

Version: v2.0

This document is the official specification of the Furniture GO Project Recognition and Analysis Engine.