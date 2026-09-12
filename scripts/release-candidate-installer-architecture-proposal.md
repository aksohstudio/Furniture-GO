# Furniture GO — Installer Packaging Architecture Proposal

## Status

Analysis only. No packaging framework, dependency, installer, Release Tag, or Version 1 release was created.

Current state remains:

- Task 08: blocked by `INSTALLER PACKAGING NOT CONFIGURED` / `INSTALLER RELEASE BLOCKER`
- Task 09: not started and remains blocked
- Task 10: not started
- Version 1: not released

## Evidence baseline

The proposal is based on the repository's current configuration:

- `package.json` version `1.0.0`, with `start`/`dev` using `node server.js` and `build` using `node scripts/build-check.js`.
- `package-lock.json` contains the current runtime dependencies only; no desktop or Installer framework is present.
- `server.js` starts a Node HTTP server on `127.0.0.1:4173` (or `PORT`) and serves the repository's frontend files.
- `index.html` loads `/src/main.js` as a module and references `/src/styles/*`; the current project does not produce a bundled frontend output.
- Runtime persistence is rooted at `<application root>/.runtime-data`, with services using the local storage boundary.
- `scripts/build-check.js` validates required files/directories; it does not package, bundle, sign, or install the application.
- No existing Electron, Tauri, NSIS, WiX, Squirrel, Inno Setup, MSI, DMG, PKG, desktop wrapper, installer metadata, signing configuration, or packaging command exists.
- Existing release documents require an Installer in the official Release Package and Release Approval Checklist, but do not prescribe `.exe`, `.msi`, or another concrete format, and do not approve a portable/archive substitute.

## Evaluation criteria

The core engineering architecture must remain unchanged: Project, Furniture Object Engine, Formula Engine, Engineering Knowledge Base, downstream result contracts, persistence semantics, offline behavior, and UI business behavior are out of scope for this proposal.

The Installer layer must still provide a real installable artifact, a reliable startup path, writable user data handling, uninstall behavior, version metadata, and a verifiable release package.

## Candidate comparison

### A. Lightweight Windows distribution/install layer

**Architecture impact: LOW to MEDIUM, conditional.**

This preserves the existing Node + Web application. A future implementation would package the application files and a compatible Node runtime, install a launcher/service entry, start `server.js` on localhost, and open or expose the existing web UI. A Windows-native packaging tool would be required to produce the actual Installer artifact.

Impact:

- `server.js`: requires a supported installed-root/runtime launch contract and controlled port/process lifecycle; the HTTP server model can remain.
- Frontend: no business/UI rewrite is required, but source-based ESM assets must be shipped consistently because there is no current bundle.
- `src/main.js`: no required redesign.
- Persistence: the current `.runtime-data` under the application root is unsuitable for a protected install directory unless the installer uses a writable location or a minimal runtime-data path policy is introduced. Existing data format and services should remain unchanged, but the data-location contract must be made explicit.
- Offline: can remain fully offline and localhost-only.
- Engineering and production modules: no direct change required.
- Dependencies: requires a Node runtime distribution and a Windows packaging tool, but not a new application framework.
- Verification: feasible through install, launch, data-directory, uninstall, and localhost smoke checks once an approved packaging tool is selected.
- Maintenance: lower than Electron/Tauri if the Node runtime and Windows packaging ownership are explicitly maintained.

This is the closest fit, but it is not available in the current repository and therefore is not a zero-change solution.

### B. Electron

**Architecture impact: HIGH.**

Electron can bundle Chromium and Node and can produce a Windows application package, but it changes the runtime model from a separately started localhost server plus browser frontend to a desktop shell lifecycle. It would require an Electron main process, window lifecycle, server coordination, packaging configuration, larger dependencies, and likely explicit handling of application data directories and process shutdown.

The Furniture GO business modules could conceptually remain, but the application startup, distribution, security boundary, memory footprint, and long-term dependency maintenance would change substantially. It is not appropriate for a minimal Sprint 12 blocker resolution.

### C. Tauri

**Architecture impact: HIGH.**

Tauri can provide a smaller desktop shell, but it introduces a Rust/native desktop layer, build toolchain, application lifecycle, frontend serving model, packaging configuration, signing, and runtime integration. The current Node server would need a deliberate sidecar or replacement strategy. That is a new application architecture, not a packaging-only change.

Tauri may be considered in a future architecture cycle, but it is not suitable for the current release-blocker scope.

### D. Other Windows desktop packaging approaches

**Architecture impact: MEDIUM to HIGH, depending on the tool.**

MSIX, WiX, Inno Setup, NSIS, Squirrel, or a custom Windows installer could produce an installable artifact, but each requires a new packaging configuration, build/signing process, installation layout, and lifecycle contract. A plain ZIP or packaged folder does not satisfy the documented Installer requirement unless the Release Process is explicitly changed by the Release Owner, which is outside this proposal.

These approaches are implementation choices, not currently approved project mechanisms.

## Key architecture questions

### Can the current Node + Web architecture be preserved?

Yes, conditionally. The lowest-impact path is a distribution layer around the existing Node server and frontend. It still requires a supported Node runtime strategy, a launcher, a writable per-user data strategy, an installer format/tool, uninstall behavior, version metadata, and installation verification.

### How would the installed application start?

A future approved package would need to launch `server.js`, bind localhost, handle an available port, and open or expose the existing UI at the local URL. The current repository has no launcher or browser-opening mechanism for this installed lifecycle.

### Where would data live?

The current runtime path is `<application root>/.runtime-data`. Installing into a protected Windows application directory could make writes unsafe. A future implementation must choose either a writable application directory or a documented per-user data directory and preserve existing Project-scoped persistence and recovery boundaries. This is the minimum persistence-adjacent architecture decision.

### Does this affect Offline First?

No, if the package remains localhost-only and ships all required runtime dependencies/assets. Network access must not be introduced as a runtime requirement.

### Can the Installer be verified?

Yes, after an approved mechanism exists: artifact existence/type/version, installation completion, startup, localhost UI availability, writable data path, uninstall behavior, and absence of cross-project/data contamination. Browser or GUI verification must be performed only when the environment is available.

## Recommendation

### RECOMMENDED

An approved lightweight Windows distribution/install layer that preserves Node + Web architecture, packages a supported Node runtime with the existing application, adds a controlled launcher and installer metadata, and defines a writable user-data location without changing Furniture GO business or persistence semantics.

**ARCHITECTURE IMPACT:** MEDIUM (LOW for core Furniture GO modules; MEDIUM for runtime/distribution lifecycle)

**SCOPE IMPACT:** HIGH for the current Sprint 12 scope, because no such mechanism currently exists and Release Process changes are required.

**RELEASE RISK:** MEDIUM until runtime, data location, signing, uninstall, and installation tests are proven.

### ALTERNATIVE

An Electron or Tauri desktop wrapper may be evaluated in a separately authorized architecture effort. Both are higher-impact choices and should not be introduced solely to close the current Sprint 12 blocker without an explicit architecture decision.

### NOT RECOMMENDED

- Calling the current `npm run build` output an Installer.
- Renaming a ZIP/folder to `.exe` or `.msi`.
- A custom ad-hoc launcher without installer lifecycle and data-path guarantees.
- Introducing Electron, Tauri, NSIS, WiX, Inno Setup, or another framework without approval.
- Changing Release Process or acceptance criteria to remove the Installer requirement.

## Direct answers

1. **Lowest-impact option:** lightweight Windows distribution/install layer around the existing Node + Web runtime.
2. **Best Version 1 option:** the same layer, only after formal approval and implementation of runtime/data/install verification.
3. **Easiest Offline preservation:** lightweight Node runtime packaging; Electron also supports offline operation but has higher architecture impact.
4. **Easiest Installer-function verification:** a standard Windows installer with explicit launcher, install path, uninstall path, and smoke-test procedure; the specific tool remains unselected.
5. **Lowest long-term maintenance:** preserve the current server/runtime model with a narrowly scoped distribution layer, provided Node runtime ownership is accepted.
6. **Lowest risk:** no implementation until the Product Owner selects and authorizes a mechanism; among implementation choices, the lightweight wrapper has the lowest core-module risk.
7. **Can this avoid changing core Furniture GO architecture?** Yes, but not without adding a new distribution/runtime layer and making installation data/runtime behavior explicit.
8. **Minimum necessary architecture change:** packaging metadata, a supported Node runtime/launcher lifecycle, writable user-data policy, installer/uninstaller configuration, and installation verification.
9. **Is that beyond original Sprint 12 scope?** Yes. Sprint 12 requires an Installer outcome, but the repository contains no mechanism; adding one is an architecture/distribution expansion not authorized by the current task boundaries.
10. **What must Product Owner approve next?** The installer format/tool, whether a Node runtime may be bundled, the data directory policy, signing/distribution ownership, the scope/time for packaging implementation, and whether Sprint 12 may be extended or Task 09 remains blocked until those are complete.

## Final state

`INSTALLER PACKAGING NOT CONFIGURED`

`INSTALLER RELEASE BLOCKER`

Task 09 remains blocked. Task 10 has not started. Version 1 is not released. No Installer, dependency, Release Tag, or public release was created by this proposal.
