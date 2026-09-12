# Furniture GO

Furniture GO is an offline-first furniture engineering and production workspace for Version 1. It connects project recognition, CAD working state, canonical Furniture Objects, 3D review, production drawings, cutting lists, purchase lists, and production outputs.

## Release status

Current status: Furniture GO Version 1.0.0 officially released.

Sprint 12 Task 01–10 are completed. Product Owner approval was obtained and Furniture GO Version 1.0.0 was officially released locally.

## Version 1 workflow

```text
Project
  → Recognition
  → CAD
  → Furniture Object
  → 3D
  → Production Drawing
  → Cutting List
  → Purchase List
  → Output
```

The Project System is the project source of truth. The Furniture Object Engine is the canonical Furniture Object source. Production Drawing, Cutting List, and Purchase List are downstream read-only result contracts consumed by their workspaces and output services.

## Main workspaces

- Project Home and Project Dashboard
- Project Recognition Workspace
- CAD Workspace with project-scoped working state
- Furniture Object Editor and Furniture Object Engine
- Furniture 3D Workspace for visualization and engineering review
- Production Drawing Workspace
- Cutting List Workspace
- Purchase List Workspace
- Project Settings and document/backup workflows

## Engineering boundaries

The Official Engineering Knowledge Base provides approved engineering knowledge and validation references. The Production Formula Engine applies existing approved formula rules; it does not invent engineering rules or retrieve manufacturer data online at runtime. Derived production results remain read-only and do not replace or mutate canonical Project, Furniture Object, Material, Hardware, or Formula sources.

## Offline operation and outputs

Normal Version 1 operation is local and offline-first. Existing output capabilities include printing, offline PDF generation, offline XLSX/Excel generation, and purchase reports. Cloud synchronization, online collaboration, remote rendering, online CAD, ERP, inventory, supplier management, CRM, AI production generation, CNC workflows, purchase orders, quotations, and accounting are out of scope.

## Known limitations

- `npm test` is blocked by the existing Sprint 02 test harness: `Unexpected token 'export'`.
- Direct frontend ESM syntax checks are limited by the current CommonJS package configuration.
- Browser smoke testing is currently unavailable: `BROWSER TEST NOT AVAILABLE`.
- Sprint 07 Task 14 and Sprint 08 Task 02 retain historical scope-audit limitations.
- Production Package DWG export remains unavailable: `DWG_EXPORT_UNAVAILABLE`.
- Production Drawing revision history is runtime-only.
- The 3D Workspace has no independent persistence architecture.
- Auto Save is not a unified global scheduler; existing project-scoped save and CAD working-state behavior remain the supported boundaries.
- Furniture Objects do not have a separate dedicated recovery architecture; existing Project backup/working-state recovery boundaries apply.
- No explicit official performance threshold is defined; benchmark timings and heap values are observational.
- Production Drawing PDF tests may report the existing canvas polyfill warning.

## Development and verification

Install dependencies with the repository's normal package workflow, then use the scripts declared in `package.json`. Common verification commands include:

```powershell
npm run build
npm run test:engineering
npm run test:release-candidate-task01
npm run test:release-candidate-task03
npm run test:system-testing-task12
```

Sprint-specific regression scripts are available under `scripts/` and are registered in `package.json` where applicable. The Sprint 02 `npm test` limitation above is known and must not be bypassed by modifying its harness during release-candidate preparation.

## Documentation sources

- Development and Sprint specifications: [`DEVELOPMENT/`](DEVELOPMENT/)
- Product requirements: [`PRD/`](PRD/)
- UI specifications: [`UI/`](UI/)
- Governance and release rules: [`GOVERNANCE/`](GOVERNANCE/)

This README records the Version 1.0.0 release state. Remote publication is not implied.
