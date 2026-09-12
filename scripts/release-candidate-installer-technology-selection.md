# Furniture GO Installer Technology Selection & Approval Proposal

## Status

Selection and approval proposal only. No installer tool was installed, no dependency or package file was changed, no Installer artifact was created, and no implementation was started.

Current release state:

- Task 08: `BLOCKED — awaiting technology approval`
- Task 09: `BLOCKED`
- Task 10: `NOT STARTED`
- Version 1: `NOT RELEASED`
- Release Tag: `NOT CREATED`

## 1. Current Architecture

The repository is a Node + Web application:

- `server.js` starts a Node HTTP server on `127.0.0.1:4173`, with the existing `PORT` override.
- `index.html` loads `/src/main.js` as an ESM module and references source CSS directly.
- Existing Furniture GO services, engineering rules, canonical sources, result contracts, and local persistence remain the application core.
- Runtime persistence currently uses `<application root>/.runtime-data`.
- `npm run build` executes `scripts/build-check.js`, which validates required files and directories but does not bundle or package the application.
- `package.json` contains no installer, packaging, desktop-wrapper, signing, or distribution mechanism.

Installer technology is therefore a Packaging Layer decision. It is not the same thing as the application runtime or a Desktop Application Framework.

## 2. Installer Requirement

The current Release Process requires an Installer in the official Release Package and Approval Checklist. Sprint 12 also requires Installer Generation and an Installer Package that functions correctly.

The repository documents do not prescribe `.exe`, `.msi`, MSIX, or another specific artifact format. They also do not approve a portable folder or archive as a substitute.

The selected technology must produce a real Windows-installable artifact and support the already-designed bundled Node runtime, launcher, separate user-data directory, upgrade preservation, uninstall safety, version metadata, integrity verification, and installation testing.

## 3. Candidate Comparison

### NSIS

NSIS can install arbitrary files, create shortcuts and uninstall entries, run custom launcher/setup logic, and package a bundled Node runtime. It can preserve a separate user-data directory and can be driven by a reproducible script.

- Keeps Node + Web core: Yes.
- Bundled Node: Yes.
- Starts `server.js`: Yes, through the launcher.
- Requires launcher: Yes, recommended.
- Core production/UI changes: None expected; runtime data-root boundary still needs implementation design.
- Persistence impact: Low.
- Offline: Strong.
- Upgrade/uninstall/data preservation: Script-controlled; must be tested carefully.
- Metadata/checksum/signing: Supported through package metadata and external signing/checksum process.
- Complexity/maintenance: Medium; NSIS scripting is flexible but lower-level.
- Main risk: custom script errors around upgrades, permissions, and uninstall safety.

### Inno Setup

Inno Setup is a script-based Windows installer well suited to installing a folder tree, bundled runtime, launcher, shortcuts, registry/uninstall metadata, and versioned artifacts without introducing a desktop application framework.

- Keeps Node + Web core: Yes.
- Bundled Node: Yes.
- Starts `server.js`: Yes, through a launcher or controlled shortcut.
- Requires launcher: Yes, recommended for readiness checks and lifecycle handling.
- Core production/UI changes: None expected; runtime data-root boundary still needs implementation design.
- Persistence impact: Low.
- Offline: Strong.
- Upgrade/uninstall/data preservation: Explicitly scriptable and understandable; user data can be excluded from uninstall.
- Metadata/checksum/signing: Supports version metadata and package creation; signing/checksum remain release controls to be added separately.
- Windows compatibility: Strong for the intended traditional Windows installer model.
- Complexity/maintenance: Low to Medium for this scope.
- Build/CI suitability: Good if a pinned tool version and scripted inputs are used.
- Main risk: installer scripts still need review for privilege, path, upgrade, and data deletion behavior.

### WiX Toolset

WiX can generate formal MSI packages and provides enterprise-standard installation semantics and Windows Installer integration. It also adds substantially more configuration and toolchain complexity than this repository currently has.

- Keeps Node + Web core: Yes.
- Bundled Node: Yes.
- Starts `server.js`: Yes, but launcher/service behavior needs separate design.
- Persistence impact: Low in data semantics, but install/upgrade component rules are more complex.
- Offline: Strong.
- Upgrade/uninstall: Strong when authored correctly.
- Metadata/checksum/signing: Strong package metadata; signing remains separate.
- Complexity/maintenance: High for the current team/repository baseline.
- CI/CD: Good after establishing a Windows build environment.
- Main risk: MSI component rules, upgrade codes, custom actions, and rollback behavior increase implementation risk.

### MSIX / Windows App Packaging

MSIX provides modern Windows packaging and clean install/update semantics, but it introduces package identity, signing, manifest, capability, and filesystem constraints. The current application writes runtime data under its application root and runs a Node server, so the package would need a carefully designed writable data boundary and launch model.

- Keeps Node + Web core: Partly; the runtime can be packaged, but lifecycle and filesystem behavior require adaptation.
- Bundled Node: Possible.
- Starts `server.js`: Possible, but requires package entry/launcher design.
- Persistence impact: Medium because writable data and package locations must be separated.
- Offline: Possible.
- Upgrade/uninstall: Strong package semantics, but data preservation needs explicit testing.
- Signing: Practically important for trusted distribution and package installation.
- Complexity/maintenance: Medium to High.
- Main risk: packaging identity, signing, permissions, and current root-relative `.runtime-data` assumptions.

### Electron

Electron is a desktop application framework, not merely an Installer technology. It would bundle Chromium and Node and introduce a main process/window lifecycle. The current localhost server could be retained only through an additional coordination design.

- Core architecture impact: High.
- Production/UI/runtime impact: High.
- Persistence impact: Medium.
- Offline: Strong after packaging.
- Complexity, dependency size, memory, and maintenance: High.
- Assessment: unnecessary for the current Installer requirement.

### Tauri

Tauri is also a desktop application framework. It introduces a native/Rust layer, new build tooling, application lifecycle, packaging configuration, and a sidecar or replacement strategy for `server.js`.

- Core architecture impact: High.
- Production/UI/runtime impact: Medium to High.
- Persistence impact: Medium.
- Offline: Strong after packaging.
- Complexity and maintenance: High relative to the current repository.
- Assessment: not appropriate as a minimal Version 1 blocker resolution.

## 4. Recommended Technology

### RECOMMENDED TECHNOLOGY: Inno Setup

Inno Setup is the best fit for the current Version 1 objective because it adds a thin Windows Installer layer without converting Furniture GO into an Electron/Tauri desktop application.

Why:

1. It can install the existing application tree and a bundled Node runtime.
2. It can create a launcher shortcut and uninstall registration.
3. It supports explicit versioned Installer output without changing Furniture GO business code.
4. It can preserve a separate per-user data directory by excluding it from ordinary uninstall.
5. It has lower implementation and maintenance complexity than WiX for this repository.
6. It avoids the larger runtime and application-lifecycle change of Electron.
7. It avoids the native/Rust toolchain and sidecar design of Tauri.
8. It keeps offline operation and the existing localhost workflow.

This is a proposal, not an authorization to install or use Inno Setup in the current task.

## 5. Runtime Packaging Strategy

- Bundle a pinned Node runtime with the staged application.
- Invoke that runtime by absolute path; do not depend on a user's global Node installation.
- Package `server.js`, `index.html`, `src`, approved dependencies, and required runtime assets.
- Record the Node runtime version and package version in build metadata.
- Keep the application files separate from user data.
- Do not alter Furniture GO contracts or engineering services.

## 6. Launcher Strategy

A small Windows launcher is required even with Inno Setup. It should:

- Resolve the installed application directory.
- Resolve the separate user-data directory.
- Start the bundled Node executable with `server.js`.
- Pass the approved runtime data-root configuration.
- Verify readiness at `http://127.0.0.1:4173` before opening the UI.
- Detect startup failure or an occupied port without silently connecting elsewhere.
- Open the existing local URL after readiness.
- Shut down the child server safely when the application is closed.
- Keep the server bound to localhost.

The launcher is part of the Distribution Layer, not a replacement for Furniture GO services.

## 7. Data / Persistence Strategy

Current data is rooted at `<application root>/.runtime-data`. The installed application should use separate locations such as:

```text
Application: %LocalAppData%\Furniture GO\app
User data:   %LocalAppData%\Furniture GO\data
Logs:        %LocalAppData%\Furniture GO\logs
```

The future implementation should add only a configurable storage-root boundary with the development default preserved. It must not change schemas, canonical ownership, Project/Object isolation, recovery semantics, or derived-result contracts.

- First install: create empty user-data root.
- Upgrade: replace application/runtime files, preserve user data.
- Uninstall: remove application files and shortcuts, preserve Projects, Furniture Objects, backups, and other production data.
- Reinstall: reuse preserved data under explicit compatibility checks.
- Migration: only if required, with backup and a separately versioned migration procedure.

## 8. Install / Upgrade / Uninstall Strategy

### Install

Install the pinned runtime, application, launcher, shortcuts, metadata, and uninstall registration. Do not overwrite existing user data.

### Launch

Start bundled Node, run `server.js`, wait for localhost readiness, then open the existing Web UI.

### Update

Stop the running process, replace application files, retain user data, and restart. Data migration must be explicit and separately verified.

### Uninstall

Remove application files, launcher, shortcuts, and installer metadata. Preserve the user-data directory by default. Do not delete production data as an implicit uninstall side effect.

## 9. Security Analysis

- Pin and integrity-check the bundled Node runtime and staged application files.
- Keep server binding on localhost.
- Avoid requiring firewall exposure for normal operation.
- Validate absolute launcher paths and prevent working-directory replacement attacks.
- Keep application files and user data under appropriate Windows permissions.
- Assess code signing for the Installer and launcher before public distribution; signing is not currently documented as a completed repository capability and must not be invented here.
- Review antivirus/SmartScreen reputation and supply-chain provenance before release.
- Verify checksums for release artifacts.

## 10. Version / Artifact Strategy

The future artifact should carry:

- Package name: Furniture GO
- Package version: current approved package version
- Windows architecture target
- Node runtime version
- Build identifier
- SHA-256 checksum

The exact filename and signing policy require approval. No artifact is created by this proposal.

## 11. Testing Strategy

The future implementation must verify:

1. Fresh install on a clean Windows environment.
2. Installer type, non-zero size, version metadata, and checksum.
3. Launch without a system Node installation.
4. `server.js` readiness on localhost.
5. Frontend loading and offline operation.
6. Project creation and save.
7. Close/restart and persistence.
8. Upgrade while preserving existing Project data.
9. Existing Furniture Object and derived-result boundaries after upgrade.
10. Uninstall while preserving user data.
11. Reinstall and data reuse.
12. Failure cases: occupied port, missing runtime, unreadable data directory, interrupted install.

GUI/browser steps must be reported as `NOT AVAILABLE IN CURRENT ENVIRONMENT` when not executable. No GUI PASS may be claimed without actual testing.

## 12. Impact Assessment

- **CORE ARCHITECTURE IMPACT:** LOW
- **PRODUCTION CODE IMPACT:** LOW
- **PERSISTENCE IMPACT:** LOW
- **DEPENDENCY IMPACT:** MEDIUM
- **INSTALLER COMPLEXITY:** LOW to MEDIUM
- **MAINTENANCE:** MEDIUM
- **SECURITY RISK:** MEDIUM until signing, provenance, and artifact verification are established
- **RELEASE RISK:** MEDIUM until install/update/uninstall testing passes

## 13. Implementation Boundary

Allowed only after explicit approval:

- Inno Setup tooling and pinned configuration.
- Installer metadata and packaging scripts.
- Windows launcher.
- Bundled Node runtime staging.
- Application and user-data directory policy.
- Version metadata, checksum, and artifact verification.
- Install/update/uninstall behavior and tests.

Forbidden in this implementation scope:

- Furniture Object Engine, Formula Engine, Engineering Knowledge Base.
- Production Drawing, Cutting List, Purchase List.
- Business logic, UI redesign, canonical sources, data contracts.
- Core persistence semantics or schema changes.
- Cloud, ERP, Inventory, Supplier, or AI features.
- Release Process or acceptance criteria changes.

## 14. Required Product Owner Approvals

Product Owner / Release Owner must approve:

1. Inno Setup as the Installer technology.
2. Bundled Node runtime strategy and runtime version.
3. Launcher implementation and localhost lifecycle.
4. Application/data directory separation and persistence-root boundary.
5. Upgrade policy and data migration policy.
6. Uninstall policy that preserves user data.
7. Artifact naming, checksum, signing, and distribution ownership.
8. Scope and schedule for the implementation work.

## 15. Final Recommendation

### RECOMMENDED

Approve Inno Setup as the Windows Installer technology for a future implementation, while preserving Node + Web as the application runtime and adding only the required bundled runtime, launcher, data-directory, and packaging layers.

### ALTERNATIVE

WiX if Product Owner requires MSI-first enterprise deployment and accepts higher build, authoring, and maintenance complexity.

### NOT RECOMMENDED

NSIS for this proposal's default path because its lower-level scripting increases lifecycle and uninstall-safety authoring risk; MSIX because current root-relative data and runtime behavior need more package-specific adaptation; Electron/Tauri because they introduce desktop application architecture rather than only an Installer layer; script-only or archive distribution because it does not meet the documented Installer requirement.

## Final state

`TASK 08: BLOCKED — awaiting technology approval`

`TASK 09: BLOCKED`

`TASK 10: NOT STARTED`

`VERSION 1: NOT RELEASED`

`RELEASE TAG: NOT CREATED`

No tool was installed, no package file was modified, and no Installer was generated.
