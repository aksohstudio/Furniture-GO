# Furniture GO — Change Log

This file records the project history and verified changes. Furniture GO Version 1.0.0 is officially released locally; remote publication is not available.

## [1.0.0 — Official Release]

### Release

- Furniture GO Version 1.0.0 officially released after Sprint 12 completion, final acceptance PASS, and Product Owner approval.
- Installer: `release/installer/Furniture-GO-1.0.0-Setup.exe`.
- Release artifact SHA-256: `2D8C405596DC30DE1F8FBE3B3DF5CA575610F02DBF07F4C75EF8CAD771C9E5E3`.
- Release tag: `v1.0.0`.
- Remote publication: `REMOTE PUBLICATION NOT AVAILABLE`.

### Release Limitations

- Installer remains unsigned and Publisher metadata is not defined.
- Browser smoke testing and installation GUI testing were unavailable.
- Existing npm test ESM/CommonJS harness limitation and documented engineering/workspace limitations remain unchanged.

## Historical Release Candidate Preparation

### Completed

- Completed the Version 1 development sequence from Sprint 01 through Sprint 11: project foundation and project system, recognition, CAD, the canonical Furniture Object Engine, 3D review, Production Drawing, Cutting List, Purchase List, and system testing and optimization.
- Recorded the completed sprint milestones: Sprint 01, Sprint 02, Sprint 03, Sprint 04, Sprint 05, Sprint 06, Sprint 07, Sprint 08, Sprint 09, Sprint 10, and Sprint 11.
- Established the offline-first engineering workflow from Project through Recognition, CAD, Furniture Object, 3D, Production Drawing, Cutting List, Purchase List, and production outputs.
- Integrated the Official Engineering Knowledge Base and Production Formula Engine within the approved engineering and read-only derived-result boundaries.
- Completed Sprint 12 Task 01–09 verification, including deliverables, PRD/UI compliance, documentation, release notes, change log, release build, Installer Package, and final acceptance testing.

### Changed

- Added the project README and Release Notes as Release Candidate documentation.
- Added this permanent project history record in accordance with the Release Process.
- Documented the current Release Candidate scope, workflow boundaries, verification evidence, and release readiness state without changing the package version.
- Added the approved Inno Setup installer, bundled Node runtime, installation-local launcher, user-data boundary, artifact metadata, and SHA-256 checksum for final acceptance review.

### Fixed

- Rejected project-scoped Working State and CAD snapshot writes when their `projectId` does not match the target Project.
- Restored the approved Professional-role access path for Project restore operations.
- Sprint 11 critical bug review confirmed zero Critical bugs and zero High bugs; this does not mean that every known limitation has been removed.

### Verified

- Verified the Release Candidate documentation, PRD/UI coverage, engineering test suite, Sprint 10/11 integration and system-testing evidence, and the production build checks available in the repository.
- Preserved the canonical Project and Furniture Object sources, existing downstream result contracts, read-only result boundaries, Project/Object isolation, offline operation, and deterministic verification scope.

### Known Limitations

- `npm test` remains `BLOCKED BY EXISTING TEST HARNESS ISSUE` because the existing Sprint 02 harness reports `Unexpected token 'export'`.
- Direct frontend ESM syntax checking remains limited by the existing CommonJS package configuration.
- Browser smoke testing is unavailable: `BROWSER TEST NOT AVAILABLE`.
- Sprint 07 Task 14 and Sprint 08 Task 02 retain their historical scope-audit limitations.
- Production Package DWG export remains unavailable: `DWG_EXPORT_UNAVAILABLE`.
- Production Drawing revision history is runtime-only.
- The 3D Workspace has no independent persistence architecture.
- Auto Save is not a unified global scheduler; existing project-scoped save and CAD working-state boundaries remain the supported boundaries.
- Furniture Object has no independent recovery architecture; existing Project backup and working-state recovery boundaries apply.
- No explicit official performance threshold is defined; benchmark timing and heap values are observational.
- Existing Production Drawing PDF tests may report the canvas polyfill warning.

## Sprint 12 Release Candidate History

### Task 01 — Verify All Sprint Deliverables

- Completed the repository deliverable audit and its deterministic documentation/test evidence.

### Task 02 — Verify PRD Compliance

- Completed PRD compliance verification for the Release Candidate preparation scope.

### Task 03 — Verify UI Compliance

- Completed static UI00–UI10 compliance verification, including navigation, context, state, error, empty, read-only, output, accessibility sanity, and responsive requirements.

### Task 04 — Finalize Documentation

- Completed the Release Candidate README and documentation-source index without making release or browser-test claims.

### Task 05 — Prepare Release Notes

- Completed source-grounded Release Notes for Sprint 12 Release Candidate v2.1 / Version 1 preparation.

### Task 06 — Update Change Log

- Completed this Change Log from repository documentation and recorded verification evidence.

### Task 07 — Generate Release Build

- Completed the Version 1.0.0 release build verification.

### Task 08 — Generate Installer Package

- Completed the approved Inno Setup installer implementation and recorded artifact integrity, unsigned status, publisher metadata limitation, and GUI test limitation.

### Task 09 — Final Acceptance Testing

- Completed final acceptance verification with isolated runtime checks, installer checksum verification, regression tests, build validation, and release-readiness limitation audit.

## Out of Scope for this Version 1 preparation

- CNC, cloud synchronization, ERP, inventory, supplier systems, online collaboration, AI features, CRM, purchase orders, quotations, and accounting remain outside the documented Version 1 scope.
- Sprint 12 Task 10 Approve Version 1 Release completed with Product Owner approval.

## Version Status

Version 1.0.0 is officially released locally. Product Owner approval is recorded in the Task 10 release evidence. No remote publication occurred.
