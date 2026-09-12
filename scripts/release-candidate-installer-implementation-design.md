# Furniture GO Installer Implementation Design

## Status

Design only. This document does not install dependencies, modify `package.json`, modify production code, generate an Installer, start Task 09, start Task 10, create a Release Tag, or release Version 1.

Current state remains:

- `INSTALLER PACKAGING NOT CONFIGURED`
- `INSTALLER RELEASE BLOCKER`
- Task 09: `BLOCKED`
- Task 10: `NOT STARTED`
- Version 1: `NOT RELEASED`
- Release Tag: `NOT CREATED`

## 1. Current Architecture

Furniture GO currently consists of:

- A Node HTTP server in `server.js`.
- A Web frontend served from the repository, with `index.html` loading `/src/main.js` as an ESM module.
- Existing Furniture GO services, canonical sources, read-only result contracts, and local persistence.
- Localhost binding at `127.0.0.1:4173`, with `PORT` as the existing override.
- Runtime data rooted at `<application root>/.runtime-data`.
- `npm run build` mapped to `scripts/build-check.js`, which verifies repository foundation files and directories but does not bundle or package the application.

The current application is not an Electron, Tauri, or other desktop-wrapper application. No installer, launcher, signing, packaging, or distribution configuration exists.

## 2. Runtime Packaging Design

The recommended design preserves the Node + Web core and adds only a Windows distribution layer:

```text
Furniture GO source
        ↓
existing build/foundation verification
        ↓
staged application files + bundled Node runtime
        ↓
Windows launcher + Installer metadata
        ↓
per-user installation
        ↓
server.js on localhost + existing Web frontend
```

The package must include the application files required by the current runtime, the approved production dependencies, and a version-pinned Node runtime. It must not alter Furniture GO business logic, engineering rules, canonical sources, contracts, or production workflows.

## 3. Installer Technology Comparison

### Recommended class: thin Windows installer layer

Examples include an approved Windows installer tool such as Inno Setup or WiX, selected by the Release Owner. The tool would install files, create a launcher shortcut, register uninstall metadata, and produce a real Windows Installer artifact.

- Architecture impact: Medium at the distribution boundary; low to core modules.
- Production code impact: Low, but launcher/data-path integration must be designed.
- Dependency impact: Adds installer tooling outside runtime; no desktop framework required.
- Runtime impact: Bundled Node and a launcher are required.
- Persistence impact: Low, because the storage root must become installation-safe without changing data semantics.
- Offline impact: Low; all runtime assets remain local.
- Upgrade/uninstall: Explicitly controllable, including preservation of user data.
- Maintenance: Lower than a desktop wrapper if runtime ownership and packaging scripts are documented.
- Risk: Medium until install, update, uninstall, and data-preservation tests pass.

### Electron

Electron would bundle Chromium and Node and provide a desktop window, but it introduces a new desktop application lifecycle, main process, window management, packaging configuration, larger runtime, and additional security/maintenance surface. It is not required merely to install the existing Web application.

- Architecture impact: High.
- Production/UI/runtime impact: High.
- Persistence impact: Medium because application data and process lifecycle must be redefined.
- Release risk: High for Version 1 blocker resolution.

### Tauri

Tauri would introduce a native/Rust desktop layer, sidecar or server integration, new toolchains, packaging/signing configuration, and a new lifecycle. It may reduce runtime size compared with Electron, but it is still a new application architecture.

- Architecture impact: High.
- Production/UI/runtime impact: Medium to High.
- Persistence impact: Medium.
- Release risk: High for the current Sprint 12 boundary.

### Script-only installer

A PowerShell or batch copy script could distribute files, but by itself it does not provide the formal Installer artifact, reliable uninstall metadata, upgrade behavior, or release verification required by the current Release Process. It may be a launcher/helper inside a formal installer, but is not sufficient as the release solution alone.

- Architecture impact: Low.
- Installer acceptance confidence: Low unless wrapped by approved installer tooling.
- Recommendation: Not sufficient alone.

## 4. Recommended Implementation

Use a thin Windows Installer layer, with the exact tool selected and approved before implementation. The preferred implementation shape is:

1. Stage the current application files and verified dependencies.
2. Bundle a pinned Node runtime so the user does not need to install Node.js.
3. Add a small Windows launcher responsible for starting `server.js`, waiting for localhost readiness, opening the local URL, and stopping the child server on exit.
4. Install application files separately from user data.
5. Produce one versioned Windows Installer artifact with checksum metadata.
6. Verify fresh install, launch, offline operation, update, uninstall safety, and reinstall behavior.

The launcher and packaging metadata belong to the Distribution/Installation Layer. Furniture GO service behavior and workflow rules remain unchanged.

## 5. Launcher Design

The launcher should:

- Resolve its installed application root without relying on the caller's working directory.
- Invoke the bundled Node executable with the packaged `server.js`.
- Set an explicit writable data directory through the agreed runtime configuration mechanism.
- Prefer the existing localhost port, but handle an occupied port through an explicit error or approved port-selection policy; it must not silently connect to an unrelated process.
- Poll the expected local endpoint before opening the browser/application URL.
- Open the existing application URL only after readiness.
- Forward or record startup errors locally.
- Terminate the child server when the launcher exits where safe.
- Avoid exposing the server beyond localhost unless a future security decision explicitly allows it.

The current endpoint `http://127.0.0.1:4173` is valid as the default endpoint because `server.js` binds to `127.0.0.1` and uses `PORT` as its existing override. A launcher must still verify readiness instead of assuming startup success.

## 6. Node Runtime Strategy

Bundling Node is recommended because the stated goal is that users should not need to install Node.js separately.

- Place the pinned runtime under the installed application runtime directory.
- Invoke that executable by absolute path from the launcher.
- Record the runtime version in build metadata.
- Do not use the user's global Node installation.
- Keep the runtime immutable during normal application use.
- Update the runtime only through a versioned Installer update.

The exact Node distribution and license handling require Release Owner approval. No runtime is added in this design-only task.

## 7. Data / Persistence Strategy

### Current state

The current runtime data root is `<application root>/.runtime-data`. This is safe for the repository's current local development layout but is not automatically safe under a protected Windows install directory.

### Required future policy

Install application files under an application directory and store user data under a user-writable per-user directory, for example:

```text
Application: %LocalAppData%\Furniture GO\app
User data:   %LocalAppData%\Furniture GO\data
Logs:        %LocalAppData%\Furniture GO\logs   (only if needed)
```

The existing Project, Furniture Object, backup, and contract semantics must remain unchanged. The smallest safe implementation is a configurable storage-root injection at the existing service construction boundary, with a development default preserving `.runtime-data`. It must not change schemas, source-of-truth ownership, data contracts, or recovery behavior.

This is a **PERSISTENCE IMPACT: LOW** decision: the physical root changes for installed operation, while the persistence model and data semantics remain the same.

### Install, upgrade, uninstall rules

- First install creates the application directory and an empty user-data directory with user-only write access where supported.
- Upgrade replaces application/runtime files but preserves the user-data directory.
- Any required data migration must be explicit, versioned, backup-protected, and separately tested; no migration is designed or implemented here.
- Uninstall removes application files, launcher, shortcuts, and uninstall metadata.
- Uninstall must preserve user Project data, Furniture Object data, backups, and other production data by default.
- A separate, explicit user-data removal action would require Product Owner approval and strong confirmation; it must not be part of ordinary uninstall.

## 8. Install / Update / Uninstall Lifecycle

### INSTALL

Install the pinned runtime, application files, launcher, metadata, shortcuts, and uninstall registration. Initialize only the empty user-data root; do not overwrite existing data.

### FIRST LAUNCH

Launcher resolves paths, starts bundled Node with `server.js`, waits for `127.0.0.1:4173`, then opens the local application URL. Startup failure must be visible and must not be reported as a successful launch.

### NORMAL USE

Furniture GO continues to use the existing offline workflow and persistence services. No cloud or remote dependency is introduced.

### UPDATE

Stop the running application safely, replace only application/runtime files, preserve user data, and restart using the new launcher/runtime. Version and migration checks must be explicit.

### UNINSTALL

Remove installed application artifacts and shortcuts. Preserve user data and backups. The Installer must not recursively delete the user-data directory as an implicit side effect.

## 9. Security Analysis

- Bundled Node must come from a trusted, version-pinned source and be integrity-checked.
- Installed executables should use least-privilege locations and permissions.
- User data must be writable by the intended user and protected from ordinary application-directory replacement.
- The server must remain bound to localhost by default.
- Firewall exposure should not be required for normal operation.
- Launcher and runtime paths must be absolute and validated to prevent malicious working-directory replacement.
- Installer artifacts need checksum verification and, if distributed externally, code-signing assessment.
- Signing infrastructure is not introduced by this design; the Release Owner must decide whether signing is required before release.
- Updates must not overwrite or delete user data.

## 10. Testing Plan

The future implementation must test:

1. Fresh install on a clean Windows environment.
2. Installer artifact type, version metadata, checksum, and non-zero size.
3. Launcher startup without a system Node installation.
4. Local server readiness at the configured localhost endpoint.
5. Frontend loading and offline operation.
6. Project creation and save.
7. Close/restart and data persistence.
8. Upgrade while preserving existing Project data.
9. Data isolation and canonical-source behavior after upgrade.
10. Uninstall while preserving user data.
11. Reinstall behavior with preserved data.
12. Failure handling for missing runtime, occupied port, unreadable data directory, and interrupted install.

GUI/browser steps must be reported as `NOT AVAILABLE IN CURRENT ENVIRONMENT` when the environment cannot execute them. No GUI PASS may be claimed without actual execution.

## 11. Release Artifact Design

The future release flow is:

```text
Source
→ existing build verification
→ staged application + bundled Node runtime
→ approved Windows Installer tooling
→ versioned Installer artifact
→ checksum / metadata verification
→ fresh-install smoke test
→ upgrade/uninstall data-safety test
→ Final Acceptance
```

The artifact name should be selected by the Release Owner after the tool and platform are approved, for example a versioned Windows installer name. No filename is reserved or created by this design.

## 12. Architecture Impact

- **CORE ARCHITECTURE IMPACT:** LOW
- **PRODUCTION CODE IMPACT:** LOW, limited to an explicit runtime data-root/launcher boundary if required
- **PERSISTENCE IMPACT:** LOW, physical storage-root policy only; schema and semantics unchanged
- **SCOPE IMPACT:** HIGH, because the repository currently lacks the distribution layer and release tooling
- **RELEASE RISK:** MEDIUM until installation, update, uninstall, signing, and data-safety tests pass

## 13. Required Approvals

Before implementation, Product Owner / Release Owner must approve:

- The selected Windows Installer technology.
- Bundling a Node runtime and its license/source handling.
- The launcher and localhost lifecycle.
- The application and user-data directory policy.
- Upgrade and uninstall data-preservation behavior.
- Artifact naming, checksum, signing, and distribution ownership.
- The additional scope and schedule required to resolve the current release blocker.

## 14. Implementation Boundary

Allowed in a separately authorized implementation task:

- Installer metadata and configuration.
- Windows launcher.
- Bundled runtime staging.
- Application/user-data directory configuration.
- Packaging scripts and artifact verification.
- Install/update/uninstall tests.

Still prohibited without separate authorization:

- Changing Furniture GO engineering logic, UI, business workflow, canonical sources, contracts, or persistence schema.
- Introducing cloud, ERP, inventory, supplier, AI, or other product functionality.
- Starting Task 09 or Task 10.

## 15. Final Recommendation

### RECOMMENDED IMPLEMENTATION

Approve a thin Windows Installer layer around the existing Node + Web application, with bundled Node, a controlled launcher, separate user-data storage, and a formally selected Windows Installer tool. This has the lowest core-module risk and preserves Offline First operation.

### ALTERNATIVE

Evaluate Electron or Tauri in a separately approved architecture project if a true desktop shell is a product requirement. Neither is necessary solely to meet the Installer requirement.

### NOT RECOMMENDED

Do not use a renamed archive, ad-hoc copy script, fake executable, or unapproved desktop framework as a release workaround.

## Final state

`TASK 09: BLOCKED`

`TASK 10: NOT STARTED`

`VERSION 1: NOT RELEASED`

`RELEASE TAG: NOT CREATED`
