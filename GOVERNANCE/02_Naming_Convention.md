# Furniture GO

# Naming Convention

---

## Document Information

| Item | Value |
|------|-------|
| Document | Naming_Convention |
| Version | v1.0 |
| Status | Confirmed |
| Category | Governance |
| Owner | Product Owner |

---

# 1. Purpose

This document defines the official naming convention for the Furniture GO project.

A unified naming convention improves:

- Readability
- Maintainability
- Scalability
- Team Collaboration
- Long-term Consistency

Every document, source file, database object, module, class, function, variable, and resource shall follow these rules.

---

# 2. Objectives

The naming convention is designed to:

- Maintain consistency across the project.
- Prevent ambiguous naming.
- Improve development efficiency.
- Reduce communication errors.
- Support future expansion.

---

# 3. General Principles

All names shall be:

- Clear
- Descriptive
- Consistent
- Professional
- Easy to understand

Names shall describe purpose rather than implementation.

Avoid abbreviations unless officially defined.

---

# 4. Language

English shall be the official language for:

- Source Code
- Documents
- Database
- UI IDs
- PRD
- Sprint
- API
- Variables
- Classes
- Functions

Comments may include additional explanations when necessary.

---

# 5. File Naming

All document files shall follow:

```
Number_Name.md
```

Examples

```
00_Project_Security_Classification.md

01_Project_Rules.md

02_Naming_Convention.md

03_Document_Standards.md

04_Version_Control.md

05_Coding_Standards.md
```

---

UI

```
00_UI_Index.md

01_Project_Home.md

02_Project_Dashboard.md

03_Project_Recognition.md
```

---

PRD

```
00_PRD_Index.md

01_Industry_Problems.md

02_Project_System.md

26_Production_Formula_Engine.md

30_Furniture_Object_Editing_System.md
```

---

Sprint

```
01_Sprint_01.md

02_Sprint_02.md

...

12_Sprint_12.md
```

---

# 6. Folder Naming

Folder names shall use:

```
PascalCase
```

or

```
UPPERCASE
```

Examples

```
PRD

UI

DEVELOPMENT

GOVERNANCE

Database

Assets

Components

Services

Modules
```

Folder names shall remain singular whenever possible.

---

# 7. Source Code Naming

## Classes

Use PascalCase.

Examples

```
FurnitureObject

MaterialDatabase

ProjectManager

CadWorkspace

ProductionDrawingGenerator
```

---

## Interfaces

Prefix with **I**.

Examples

```
IFurnitureObject

IProjectRepository

IMaterialProvider
```

---

## Enums

Use PascalCase.

Examples

```
ProjectStatus

DoorType

MaterialCategory
```

---

# 8. Variable Naming

Variables shall use camelCase.

Examples

```
projectName

currentRoom

selectedFurniture

boardThickness

materialType

hardwareCount
```

Avoid meaningless names such as:

```
temp

data1

aaa

value2

object3
```

---

# 9. Function Naming

Functions shall begin with verbs.

Examples

```
createProject()

loadProject()

saveProject()

generateDrawing()

calculateFormula()

updateFurnitureObject()

exportPdf()

importDwg()
```

Avoid generic names such as:

```
run()

test()

execute()

doWork()
```

---

# 10. Constant Naming

Constants shall use:

```
UPPER_SNAKE_CASE
```

Examples

```
MAX_BOARD_WIDTH

DEFAULT_THICKNESS

SYSTEM_VERSION

APP_NAME

PROJECT_EXTENSION
```

---

# 11. Database Naming

Tables

Use PascalCase.

Examples

```
Projects

FurnitureObjects

Materials

Hardware

ProductionDrawings
```

---

Fields

Use camelCase.

Examples

```
projectId

roomName

boardWidth

doorType

hardwareId
```

Primary Keys

```
id
```

Foreign Keys

```
projectId

materialId

hardwareId

roomId
```

---

# 12. UI Naming

Screen IDs

```
UI01

UI02

UI03
```

Components

```
ProjectCard

RoomTree

Toolbar

StatusBar

PropertiesPanel

PreviewViewport
```

Buttons

```
SaveButton

GenerateButton

ExportButton

RefreshButton
```

---

# 13. PRD Naming

Every PRD shall follow:

```
PRD + Number + Title
```

Examples

```
PRD17

Official Database System

PRD26

Production Formula Engine

PRD30

Furniture Object Editing System
```

---

# 14. Version Naming

Version format:

```
Major.Minor.Revision
```

Examples

```
1.0.0

1.1.0

1.2.5

2.0.0
```

Documents

```
v1.0

v2.0

v2.1
```

---

# 15. Reserved Words

The following terms are reserved and shall be used consistently throughout the project.

```
Furniture Object

Project

Room

Module

Component

Material

Hardware

Drawing

Board

Panel

Formula

Production

Workspace

Dashboard

Recognition

Generation

Synchronization
```

Do not create alternative names for these official terms.

---

# 16. Naming Rules

Developers shall:

✓ Use descriptive names.

✓ Keep terminology consistent.

✓ Follow official naming formats.

✓ Reuse existing terms whenever possible.

Developers shall not:

✗ Invent unofficial terminology.

✗ Mix naming styles.

✗ Use abbreviations without approval.

✗ Rename official project concepts.

---

# 17. Relationship with Other Documents

Related Governance Documents:

- Project Security Classification
- Project Rules
- Document Standards
- Version Control
- Coding Standards
- Git Workflow
- Release Process
- Backup Policy
- License Policy
- AI Development Policy

This document defines the official naming convention for all Furniture GO project assets.

---

# Approval

Status: Confirmed

Version: v1.0

This document is the official Naming Convention for Furniture GO.