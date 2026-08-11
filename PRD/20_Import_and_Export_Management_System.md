# Furniture GO

# Product Requirement Document (PRD)

# 20_Import_and_Export_Management_System

---

## Document Information

| Item | Value |
|------|-------|
| Document | 20_Import_and_Export_Management_System |
| Version | v1.0 |
| Status | Confirmed |
| Category | File Management System |

---

# Part 1

---

# 1. Overview

The Import and Export Management System manages all project data import and export operations within Furniture GO.

Its objective is to allow users to transfer, share, backup, restore, and export project information through standardized file formats.

The system shall maintain:

- Project Consistency
- Revision History
- Data Protection

throughout all import and export operations.

---

# 2. Core Principles

Furniture GO Import and Export Management System shall follow:

## 2.1 Fast（快速）

The system shall avoid:

- Unnecessary re-scanning
- Duplicate processing
- Duplicate file generation

---

## 2.2 Convenience（方便）

Users shall not need to:

- Manually organize project files
- Manually manage versions
- Manually rebuild projects

---

## 2.3 No Duplicate Work（不重复工作）

Existing data shall be reused whenever possible.

Including:

- Project Database
- Recognition Data
- Revision History
- Backup History

The system shall not repeat completed work unnecessarily.

---

## 2.4 User Data Ownership（用户资料拥有权）

Project data belongs to the user.

The system shall never automatically:

- Delete data
- Overwrite old versions
- Remove project history

---

# 3. Import System（导入系统）

Furniture GO shall support importing multiple file formats.

---

## 3.1 Drawing Files（图纸文件）

Supported:

- PDF
- DWG
- DXF

---

## 3.2 Image Files（图片文件）

Supported:

- JPG
- PNG

---

## 3.3 Document Files（文件）

Supported:

- XLSX
- CSV
- DOCX

---

## 3.4 Project Package（项目包）

Supported:

- ZIP Project Package

---

# 4. Import Processing（导入处理）

When importing files, Furniture GO shall:

1. Detect file type
2. Check file content
3. Compare with existing project data
4. Determine file status

Possible status:

- New File（新文件）
- Updated File（更新文件）
- Duplicate File（重复文件）

---

The system shall never directly overwrite existing project data.

---

# 5. Duplicate File Detection（重复文件检测）

Furniture GO shall compare imported files with existing files.

If:

- File name is different
- Date is different
- Export source is different

but the actual content is identical,

the system shall classify it as:

## Duplicate File

---

Duplicate File shall:

- Not create new Revision
- Not increase Revision History
- Not modify Project Database

---

# 6. Revision Management（版本管理）

When an updated file is imported,

Furniture GO shall automatically create:

## Revision History

The system shall record:

- Old Version
- New Version
- Change Date
- Change Information

---

Old versions shall:

- Remain available
- Never be automatically deleted
- Never be automatically overwritten

---

# 7. Difference Report（差异报告）

When differences are detected,

Furniture GO shall generate:

## Difference Report

Including:

- Added Items
- Modified Items
- Removed Items
- Version Differences

---

Users shall confirm before applying changes.

Available actions:

- Merge（合并）
- Replace（替换）
- Keep Existing（保留旧版本）

---

# 8. Project Package Restore（项目包恢复）

When importing a Project Package（项目包）,

Furniture GO shall support complete project restoration.

The system shall restore:

- Project Database（项目资料库）
- Original PDF（原始 PDF）
- Backup PDF（备份 PDF）
- Recognition Data（识别资料）
- Shop Drawings（施工图）
- Manufacturing Requirements（生产要求）
- Purchase List（采购清单）
- Cutting Summary（开料汇总）
- Revision History（版本记录）
- Export History（导出记录）
- Backup History（备份记录）

---

## 8.1 Restore Principle（恢复原则）

Furniture GO shall not perform unnecessary:

- PDF Re-scanning
- AI Re-Recognition
- Project Rebuilding

Existing confirmed project data shall remain available.

---

# 9. Project Package Import Verification（项目包验证）

When importing a Project Package,

Furniture GO shall verify:

- Package Integrity（项目包完整性）
- Project Version（项目版本）
- Database Version（资料库版本）
- Document Availability（文件完整性）

---

If problems are detected:

The system shall generate:

## Import Verification Report（导入验证报告）

Including:

- Missing Files（缺少文件）
- Version Differences（版本差异）
- Database Conflicts（资料冲突）

---

# 10. Conflict Report（冲突报告）

When imported data conflicts with existing data,

Furniture GO shall not automatically overwrite.

The system shall generate:

## Conflict Report

Including:

- Existing Version（当前版本）
- Imported Version（导入版本）
- Modified Date（修改日期）
- Data Difference（资料差异）

---

User actions:

- Keep Existing（保留当前）
- Use Imported Version（使用导入版本）
- Merge（合并）

---

# 11. Export System（导出系统）

Furniture GO shall support multiple export formats.

---

## 11.1 Drawing Export（图纸导出）

Supported:

- PDF
- DWG
- DXF

---

## 11.2 Document Export（文件导出）

Supported:

- XLSX
- CSV
- DOCX

---

## 11.3 Image Export（图片导出）

Supported:

- JPG
- PNG

---

## 11.4 Project Package Export（项目包导出）

Supported:

- ZIP Project Package

The package shall contain complete project information according to export type.

---

# 12. Export Preset System（导出预设系统）

Furniture GO shall provide default Export Presets.

---

## Production Package（生产包）

Purpose:

Factory Production（工厂生产）

Contains:

- Shop Drawing
- Cutting Summary
- Manufacturing Requirements
- Purchase List
- DWG / DXF

---

## Client Package（客户包）

Purpose:

Client Review（客户查看）

Contains:

- Final PDF
- Project Report
- Images

Does not include:

- Cutting Data
- Manufacturing Data

---

## Designer Package（设计师包）

Purpose:

Design Communication（设计沟通）

Contains:

- PDF
- DWG
- Project Information

---

## Complete Project Package（完整项目包）

Contains:

- All Project Documents
- Database
- Recognition Data
- History Records

---

# 13. Custom Export Preset（自定义导出预设）

Users shall be able to create custom Export Presets.

Example:

Factory A Package:

Include:

- DWG
- Cutting Summary
- Purchase List

Exclude:

- Client Documents

---

# 14. File Permission Management（文件权限管理）

Furniture GO shall manage different permission levels according to file type.

---

## 14.1 Original PDF（原始 PDF）

Permission:

Read Only（只读）

Purpose:

- Preserve Designer Original Drawing（保存设计师原图）
- Support Revision Comparison（支持版本比较）
- Support AI Recognition（支持 AI 识别）

The system shall not allow automatic modification.

---

## 14.2 Backup PDF（备份 PDF）

Permission:

System Managed（系统管理）

Purpose:

- Before Modification Backup（修改前备份）
- Revision Recovery（版本恢复）

---

## 14.3 Project Database（项目资料库）

Permission:

System Controlled（系统控制）

Users shall modify project data through Furniture GO functions.

Direct database modification shall not be allowed.

---

## 14.4 Export Files（导出文件）

Permission:

Shareable（可分享）

Examples:

- PDF
- DWG
- XLSX
- CSV

---

# 15. Backup System（备份系统）

Furniture GO shall support:

- Automatic Backup（自动备份）
- Manual Backup（手动备份）

---

# 15.1 Automatic Backup（自动备份）

The system shall automatically create backups before:

- Import New Version（导入新版本）
- Major Modification（重大修改）
- Export Operation（导出）
- Project Confirmation（项目确认）

---

# 15.2 Manual Backup（手动备份）

Users may manually create important backup points.

Example:

Backup Note:

- Before Factory Submission
- Before Client Approval
- Final Version

---

# 15.3 Backup History（备份记录）

Backup History shall record:

- Backup Date
- Backup Version
- Backup Note
- Backup Source

---

# 16. Save Confirmation（保存确认）

When users modify project data and attempt to exit,

Furniture GO shall detect unsaved changes.

The system shall display:

```
Unsaved Changes

Do you want to save?

[Save]

[Don't Save]

[Cancel]
```

---

# 17. Trash / Recycle Bin（回收站）

When deleting a Project,

Furniture GO shall not permanently delete immediately.

The project shall move to:

Trash / Recycle Bin

---

# 17.1 Delete Confirmation（删除确认）

Before deletion:

The system shall display:

```
Delete Project?

This project will be moved to Trash.

It will be permanently deleted after 30 days.
```

Options:

- Cancel
- Move to Trash

---

# 17.2 Trash Management（回收站管理）

Users may:

- Restore Project（恢复项目）
- Permanently Delete（永久删除）

---

# 17.3 Automatic Permanent Delete（自动永久删除）

After 30 days:

The system may permanently delete the project.

Deleted data includes:

- Project Database
- Documents
- Recognition Data
- History Records

---

# 18. User Permission System（用户权限系统）

Furniture GO shall support:

- Owner（老板）
- Admin（管理员）
- Designer（设计师）
- Worker（员工）

---

# 18.1 Offline Account Structure（离线账号结构）

Furniture GO Version 1 shall support:

Company Account（公司账号）

with:

User Profile（用户档案）

---

Example:

```
Company

↓

Users

├── Owner

├── Designer

└── Worker
```

---

# 18.2 Owner Permission（老板权限）

Owner may:

- View All Projects
- Edit Projects
- Delete Projects
- Restore Projects
- Export Files
- Print Documents

---

# 18.3 Delete Permission（删除权限）

Project deletion shall be restricted.

Owner / Admin:

- Delete Project
- Restore Project
- Permanent Delete

Designer / Worker:

- Request Delete

---

# 19. Offline Device Transfer（离线设备转移）

Furniture GO shall support moving projects between devices.

Example:

```
Old Device

↓

Export Backup Package

↓

New Device

↓

Import Package

↓

Restore Project
```

---

Transferred data includes:

- Project Database
- Documents
- Recognition Data
- Revision History
- Export History
- Backup History

---

# 20. App Update Migration（APP 更新迁移）

Furniture GO shall support automatic data migration during application updates.

Example:

```
Version 1.0

↓

Version 1.1

↓

Version Migration

↓

New Version
```

---

The system shall preserve:

- Project Database
- Official Database
- Factory Database
- AI Recognition Data
- Revision History
- Backup History
- Export History

---

# 20.1 Migration Safety（迁移安全）

Before migration:

Furniture GO shall automatically create:

Safety Backup（安全备份）

---

Migration Process:

```
App Update

↓

Check Database Version

↓

Create Backup

↓

Migration

↓

Verify Data

↓

Open New Version
```

---

If migration fails:

The system shall:

- Keep old data
- Restore previous version
- Prevent data loss

---

# 21. Project Structure Migration（项目结构迁移）

When new versions introduce:

- New Database Fields
- New Project Structure
- New Export Format

Old Projects shall remain compatible.

---

Furniture GO shall automatically upgrade old projects.

Example:

Old Project:

```
Cabinet

- Width
- Height
```

New Project:

```
Cabinet

- Width
- Height
- Material ID
- Hardware ID
- Manufacturing Rule
```

---

The system shall add new structures without removing existing information.

---

# 22. Legacy Support（旧版本支持）

Furniture GO shall support opening old project versions.

Old Projects shall not become unusable.

---

When opening a legacy project:

System shall provide:

- Open Without Upgrade
- Upgrade Project

---

# 23. Project Upgrade Revision（项目升级版本）

When upgrading old projects,

Furniture GO shall not overwrite the original version.

The system shall create:

Project Revision（项目版本）

Example:

```
Project ABC

├── Revision v1
│
├── Revision v2
│
└── Current Version
```

---

Users may:

- Use Latest Version
- View Previous Version
- Rollback Previous Version

---

# 24. Future Cloud Compatibility（未来云端兼容）

Furniture GO Version 1 shall remain:

Offline First（离线优先）

Cloud service shall be an extension.

---

Cloud shall not replace Offline Project ownership.

Structure:

```
Offline Project

        ↕

Cloud Copy
```

---

# 25. Cloud Sync Data（云端同步资料）

Future Cloud Sync may support:

## Project

- Project Database
- Original PDF
- Backup PDF
- Recognition Data
- Shop Drawings
- Manufacturing Requirements

---

## Database

- Official Database
- Factory Database
- AI Recognition Database

---

## User

- User Profile
- Role Permission

---

## History

- Revision History
- Export History
- Backup History

---

# 26. Cloud Conflict Management（云端冲突管理）

When different devices modify the same project,

Furniture GO shall not automatically overwrite data.

---

Example:

Device A:

```
Cabinet K01

Dimension:
600mm
```

Device B:

```
Cabinet K01

Dimension:
650mm
```

---

System shall create:

Conflict Report

Including:

- Version A
- Version B
- Modification Time
- Data Difference

---

User Actions:

- Keep Version A
- Keep Version B
- Merge
- Cancel

---

# 27. Free Version and Upgrade System（免费版与升级系统）

Furniture GO shall support:

Freemium Model（免费模式）

---

Free Version shall allow users to experience core workflow.

Restrictions shall focus on quantity.

Examples:

- Project Quantity
- AI Recognition Count
- Database Capacity
- Export Count

---

The system shall not remove core workflow experience.

---

# 28. Upgrade Data Protection（升级资料保护）

When users upgrade:

Free Version

↓

Paid Version

---

Existing data shall remain available.

Including:

- Existing Projects
- Database
- Recognition Data
- Revision History
- Backup History

---

Upgrade shall only:

- Unlock Features
- Remove Limits
- Add Capabilities

---

# 29. Free Limit Protection（免费限制保护）

When users exceed free limits:

Example:

Free Limit:

```
10 Projects
```

Existing:

```
15 Projects
```

---

Furniture GO shall:

Allow:

- Open Existing Projects
- View Data
- Print Existing Documents

Restrict:

- Creating New Projects
- Using Restricted Features

---

# 30. Design Principles（设计原则）

Furniture GO Import and Export Management System shall:

- Protect User Data
- Maintain Revision History
- Support Offline Workflow
- Avoid Duplicate Work
- Support Future Cloud Expansion
- Preserve Project Ownership

---

All Import and Export operations shall prioritize:

- Fast（快速）
- Convenience（方便）
- Accuracy（准确）
- Safety（安全）

---

# Approval

Status: Confirmed

Version: v1.0
