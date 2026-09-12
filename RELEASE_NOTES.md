# Furniture GO — Release Notes

## Release

**Furniture GO Version 1.0.0 — Official Release**

Status: Officially released locally after final acceptance and Product Owner approval.

Furniture GO Version 1.0.0 is officially released. Remote publication is not available from this environment.

## Release scope

This release covers the completed Version 1 engineering workflow from Sprint 01 through Sprint 11, plus Sprint 12 Task 01–10 release preparation, packaging, final acceptance, and approval.

## Core workflow

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

## Completed capabilities

- Project System and project-scoped working state
- Project Recognition workflow
- CAD Workspace with project-scoped CAD working state
- Canonical Furniture Object Engine and Furniture Object Editor
- Furniture 3D Workspace for visualization and engineering review
- Production Drawing generation, preview, package, print, PDF, DWG boundary, and runtime revision handling
- Cutting List generation, Board Layout, Material Statistics, Waste Analysis, Information Panel, Part Trace, print, PDF, and Excel output
- Purchase List generation, board materials, hardware, accessories, summary, category management, print, PDF, Excel, and reports
- Official Engineering Knowledge Base references and validation boundaries
- Production Formula Engine using defined engineering rules
- Offline production workflow and read-only downstream result contracts
- Sprint 11 functional, integration, stress, save/recovery, data consistency, performance observation, and UX verification work
- Sprint 12 Task 01–09 deliverable, PRD, UI, documentation, release-note, change-log, build, installer, and final-acceptance verification

## Engineering boundaries

The Official Engineering Knowledge Base remains the engineering source of truth. The Production Formula Engine executes defined engineering rules; runtime does not invent, guess, or retrieve engineering rules online. Production Drawing, Cutting List, and Purchase List outputs consume their existing canonical sources and contracts and remain read-only derived results.

## UI / UX status

UI00–UI10 compliance was statically verified. Navigation, project/object context, state, error, empty, read-only, output, accessibility sanity, and explicit responsive requirements were audited.

Browser smoke testing was not available:

`BROWSER TEST NOT AVAILABLE`

Static verification must not be interpreted as a completed browser UX test.

## Verification status

Verified commands and regression groups include:

- Sprint 11 Task 01–12
- Sprint 10 Task 01–11
- Relevant Sprint 08 and Sprint 09 tests
- `npm run test:engineering`
- `npm run test:release-candidate-task01`
- `npm run test:release-candidate-task03`
- `npm run test:release-candidate-task04`
- `npm run test:system-testing-task12`
- `npm run build`

The build check passes. No explicit official performance threshold is defined; benchmark values remain observational.

## Known limitations

- `npm test` fails with `Unexpected token 'export'` and remains `BLOCKED BY EXISTING TEST HARNESS ISSUE`.
- Direct frontend ESM syntax checks are limited by the existing CommonJS package configuration.
- Browser smoke testing is unavailable: `BROWSER TEST NOT AVAILABLE`.
- Sprint 07 Task 14 and Sprint 08 Task 02 retain historical scope-audit limitations.
- Production Package DWG export is unavailable: `DWG_EXPORT_UNAVAILABLE`.
- Production Drawing revision history is runtime-only.
- The 3D Workspace has no independent persistence architecture.
- Auto Save is not a unified global scheduler; existing project-scoped save and CAD working-state boundaries remain in force.
- Furniture Object has no independent recovery architecture; existing Project backup and working-state recovery boundaries apply.
- No explicit official performance threshold is defined.
- Existing Production Drawing PDF tests may report the canvas polyfill warning.

## Out of scope / not included

The following are not Version 1 capabilities in this Release Candidate:

- CNC workflows
- Cloud services or synchronization
- ERP
- Inventory
- Supplier system
- Online collaboration
- AI production features
- CRM
- Purchase orders, quotations, and accounting

## Release readiness

Version 1.0.0 is officially released locally. The installer is unsigned and publisher metadata is not defined, as documented. Remote publication is not available.
