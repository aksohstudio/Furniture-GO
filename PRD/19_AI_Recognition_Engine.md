# Furniture GO
# Product Requirement Document (PRD)

# 19_AI_Recognition_Engine

---

## Document Information

| Item | Value |
|------|-------|
| Document | 19_AI_Recognition_Engine |
| Version | v2.0 |
| Status | Confirmed |
| Category | Core Recognition Engine |

---

# 1. Overview

The AI Recognition Engine is the core recognition engine of Furniture GO.

Its responsibility is to recognize, analyze, and interpret furniture project information from supported drawing sources.

The AI Recognition Engine transforms recognized information into standardized Engineering Records and Furniture Objects.

The AI Recognition Engine does not create Engineering Rules.

It does not perform production calculations.

It does not make production decisions.

Its responsibility is to recognize project information accurately and match it with the Official Engineering Knowledge Base.

The AI Recognition Engine serves as the entry point of the entire Furniture GO production workflow.

---

# 2. Objectives

The AI Recognition Engine shall:

- Recognize Designer Drawings.
- Recognize PDF Drawings.
- Recognize DWG Drawings.
- Recognize supported Images.
- Build structured Project Data.
- Match Engineering Records.
- Generate Furniture Objects.
- Support Project Confirmation.
- Support Recognition Review.

The AI Recognition Engine shall always prioritize recognition accuracy over recognition speed.

Final engineering decisions shall always belong to the user.

---

# 3. Recognition Principles

The AI Recognition Engine shall follow the following principles.

## Recognition Before Calculation

Furniture GO shall recognize every object before any engineering calculation begins.

No production calculation shall begin before successful recognition.

---

## Engineering Knowledge Driven

Every recognized object shall be matched against the Official Engineering Knowledge Base.

Engineering Rules shall never originate from the AI Recognition Engine.

---

## Factory Reference Support

After Engineering Records have been identified, the AI Recognition Engine may reference the Factory Reference Database to identify factory-specific names and codes.

Factory References shall never replace Engineering Records.

---

## User Confirmation

The AI Recognition Engine assists users.

It shall never make final production decisions.

Users always retain final confirmation authority.

---

## Unknown Object Principle

If no matching Engineering Record exists, the AI Recognition Engine shall classify the object as an Unknown Engineering Record.

The system shall never guess unknown products automatically.

---

# 4. Recognition Workflow

Every recognition task shall follow one standardized workflow.

Project

↓

Designer PDF / DWG / Image

↓

AI Recognition Engine

↓

Official Engineering Knowledge Base

↓

Engineering Record

↓

Factory Reference Database

↓

Furniture Object Engine

↓

Project Confirmation

↓

Production Formula Engine

The AI Recognition Engine shall never bypass the Official Engineering Knowledge Base.

Every recognized object shall first become an Engineering Record before entering the Furniture Object Engine.

---

# 5. Recognition Sources

The AI Recognition Engine shall support recognition from multiple project sources.

Supported sources include:

- Designer PDF
- DWG Drawing
- Supported Images
- Future Supported Formats

Every supported source shall be converted into standardized recognition data before further processing.

The recognition process shall remain independent of the original file format.

---

# 6. Recognition Scope

The AI Recognition Engine shall recognize all production-related information required by Furniture GO.

Recognition includes, but is not limited to:

## Project Information

- Project Name
- Project Number
- Designer Information
- Revision Information
- Scale
- Drawing Title

---

## Space Recognition

- Floor
- Room
- Area
- Cabinet Zone

---

## Cabinet Recognition

- Cabinet Type
- Cabinet Position
- Cabinet Quantity
- Cabinet Dimensions
- Cabinet Orientation

---

## Material Recognition

- Board Material
- Board Thickness
- Surface Finish
- Grain Direction
- Edge Banding

---

## Hardware Recognition

- Hinges
- Drawer Slides
- Handles
- Lift Systems
- Connectors
- Accessories

---

## Door System Recognition

- Swing Door
- Sliding Door
- Folding Door
- Glass Door
- Aluminium Frame Door

---

## Construction Recognition

- Fluted Panel
- Hidden Handle
- LED
- Glass
- Stone
- Decorative Panels
- Construction Notes

---

## Drawing Recognition

- CAD Blocks
- CAD Layers
- Text
- Dimensions
- Symbols
- Section Marks
- Callouts
- Notes

Recognition scope shall continue expanding through Official Engineering Knowledge updates.

---

# 7. Engineering Knowledge Matching

Every recognized object shall be matched against the Official Engineering Knowledge Base.

Matching shall compare:

- Official Product Name
- Recognition Keywords
- Recognition Aliases
- Engineering Symbols
- Drawing Information
- Product Specifications

Successful matching shall produce one Engineering Record.

Engineering Rules shall always originate from the matched Engineering Record.

---

# 8. Factory Reference Matching

After an Engineering Record has been identified, the AI Recognition Engine may search the Factory Reference Database.

Factory matching may include:

- Factory Alias
- Factory Code
- Factory Material Code
- Factory Hardware Code

Factory references exist only to assist factory operations.

Factory Reference information shall never replace Engineering Records.

---

# 9. Furniture Object Generation

Every successfully matched Engineering Record shall generate one or more Furniture Objects.

Furniture Objects represent production-ready engineering objects.

Furniture Objects shall contain:

- Engineering Record Reference
- Project Position
- Project Dimensions
- User Confirmed Information
- Recognition Confidence
- Recognition Status

Furniture Objects shall never contain independent Engineering Rules.

Engineering Rules shall always remain inside the Official Engineering Knowledge Base.

---

# 10. Recognition Report

After recognition is completed, the AI Recognition Engine shall automatically generate a Recognition Report.

The Recognition Report provides users with a complete review of all recognition results before Project Confirmation.

The report shall include, but is not limited to:

- Successfully Recognized Objects
- Similar Engineering Records
- Unknown Engineering Records
- Missing Dimensions
- Missing Notes
- Recognition Warnings
- Recognition Errors

The Recognition Report shall be generated automatically for every recognition session.

---

# 11. Recognition Report Structure

The Recognition Report shall follow the project hierarchy.

Hierarchy:

Project

↓

Floor

↓

Room

↓

Cabinet

↓

Furniture Object

↓

Recognition Item

Every recognition issue shall remain attached to its corresponding Furniture Object.

Recognition issues shall never be displayed as isolated error lists.

This allows users to review recognition results within the actual project structure.

---

# 12. Recognition Status

Every Furniture Object shall maintain an independent Recognition Status.

Recognition Status may include:

- Recognized
- Similar Match
- Unknown Engineering Record
- Missing Information
- User Modified
- User Confirmed
- Ignored

Recognition Status shall remain visible until Project Confirmation is completed.

---

# 13. Recognition Review

Every Recognition Item shall support direct review.

Users may:

- Open Original PDF
- Open Original DWG
- View Source Image
- Jump to Drawing Page
- Jump to Room
- Jump to Cabinet
- Jump to Furniture Object

The AI Recognition Engine shall help users locate recognition issues quickly.

The review process shall minimize unnecessary navigation.

---

# 14. Similar Engineering Records

When multiple Engineering Records satisfy the recognition result, the AI Recognition Engine shall present all suitable candidates.

The system shall never automatically choose between similar Engineering Records.

Users shall confirm the correct Engineering Record before production continues.

Only one Engineering Record may be assigned to each Furniture Object.

---

# 15. Unknown Engineering Records

When no suitable Engineering Record exists, the AI Recognition Engine shall classify the result as an Unknown Engineering Record.

Unknown Engineering Records shall preserve all available recognition information, including:

- Source Image
- Drawing Location
- Dimensions
- Text
- Symbols
- Recognition Confidence
- Recognition Notes

Unknown Engineering Records shall never enter the Production Formula Engine.

Users must resolve every Unknown Engineering Record before Project Confirmation.

Future Official Engineering Knowledge updates may allow Unknown Engineering Records to be recognized automatically.

---

# 16. Incremental Recognition

When project information changes, the AI Recognition Engine shall perform Incremental Recognition.

Only affected Furniture Objects shall be reprocessed.

Examples include:

- Cabinet Changes
- Dimension Changes
- Material Changes
- Hardware Changes
- Drawing Revisions

The entire project shall never be re-recognized unnecessarily.

Recognition results that are unaffected shall remain unchanged.

---

# 17. Recognition Improvement Strategy

The AI Recognition Engine shall continuously improve recognition accuracy.

Recognition improvement shall be achieved through:

- Official Engineering Knowledge updates
- Recognition algorithm improvements
- Recognition model improvements
- Recognition keyword improvements
- Recognition alias improvements
- Confirmed Project refinement

The AI Recognition Engine shall never create new Engineering Rules automatically.

Engineering knowledge shall always be maintained by the Official Engineering Knowledge Base.

---

# 18. Recognition Reliability

Recognition accuracy shall always take priority over recognition speed.

The AI Recognition Engine shall never guess Engineering Records.

If sufficient confidence cannot be achieved, the system shall present:

- Similar Engineering Records

or

- Unknown Engineering Record

for user confirmation.

Every production workflow shall begin only after successful recognition and user confirmation.

---

# 19. Design Principles

The AI Recognition Engine shall follow these principles:

1. Recognition Before Calculation
2. Engineering Knowledge Driven
3. Furniture Object Driven
4. User Confirmation Required
5. No Automatic Engineering Decisions
6. No Automatic Engineering Rule Creation
7. Incremental Recognition
8. Recognition Accuracy First
9. Fully Offline Operation
10. Fully Integrated with the Official Engineering Knowledge Base

---

# 20. Scope

This PRD defines only the AI Recognition Engine.

The following systems are defined separately:

- Official Engineering Knowledge Base
- Factory Reference Database System
- Furniture Object Engine
- Production Formula Engine
- Production Drawing System
- CAD Generation System
- Furniture 3D System

The AI Recognition Engine is responsible only for recognition and engineering matching.

Engineering calculations belong exclusively to the Production Formula Engine.

Engineering knowledge belongs exclusively to the Official Engineering Knowledge Base.

---

# 21. Approval

Status: Confirmed

Version: v2.0

This document is the official specification of the Furniture GO AI Recognition Engine.