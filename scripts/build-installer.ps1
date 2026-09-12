$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$staging = Join-Path $repoRoot 'installer\staging'
$release = Join-Path $repoRoot 'release\installer'
$runtime = Join-Path $staging 'runtime'
$nodeSource = (Get-Command node -ErrorAction Stop).Source
$nodeSignature = Get-AuthenticodeSignature -LiteralPath $nodeSource
if ($nodeSignature.Status -ne 'Valid') {
  throw "Bundled Node runtime signature is not valid: $($nodeSignature.Status)"
}
$nodeVersion = (& $nodeSource --version).Trim()
if ($nodeVersion -ne 'v24.18.0') {
  throw "Unexpected Node runtime version: $nodeVersion"
}

$isccCandidates = @(
  (Get-Command iscc -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
  'C:\Program Files\Inno Setup 7\ISCC.exe',
  'C:\Program Files (x86)\Inno Setup 7\ISCC.exe'
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
if (-not $isccCandidates) { throw 'Inno Setup ISCC.exe was not found' }
$iscc = $isccCandidates | Select-Object -First 1

foreach ($directory in @($staging, $release)) {
  if (Test-Path -LiteralPath $directory) { Remove-Item -LiteralPath $directory -Recurse -Force }
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}
New-Item -ItemType Directory -Path $runtime -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $repoRoot 'index.html') -Destination $staging
Copy-Item -LiteralPath (Join-Path $repoRoot 'server.js') -Destination $staging
Copy-Item -LiteralPath (Join-Path $repoRoot 'FurnitureGO-Launcher.ps1') -Destination $staging
Copy-Item -LiteralPath $nodeSource -Destination (Join-Path $runtime 'node.exe')
Copy-Item -LiteralPath (Join-Path $repoRoot 'src') -Destination $staging -Recurse
Copy-Item -LiteralPath (Join-Path $repoRoot 'node_modules') -Destination $staging -Recurse

# Keep runtime JavaScript/WASM assets while excluding development-only metadata
# that is not loaded by server.js and makes the installer unnecessarily large.
$stagedModules = Join-Path $staging 'node_modules'
Get-ChildItem -LiteralPath $stagedModules -Recurse -File -ErrorAction Stop |
  Where-Object { $_.Name -like '*.d.ts' -or $_.Name -like '*.d.ts.map' -or $_.Name -like '*.js.map' -or $_.Name -like '*.md' -or $_.Name -like 'LICENSE*' -or $_.Name -like 'NOTICE*' } |
  Remove-Item -Force
if (Test-Path -LiteralPath (Join-Path $stagedModules '.bin')) { Remove-Item -LiteralPath (Join-Path $stagedModules '.bin') -Recurse -Force }
if (Test-Path -LiteralPath (Join-Path $stagedModules '.package-lock.json')) { Remove-Item -LiteralPath (Join-Path $stagedModules '.package-lock.json') -Force }

& $iscc (Join-Path $repoRoot 'installer\FurnitureGO.iss')
if ($LASTEXITCODE -ne 0) { throw "Inno Setup compilation failed with exit code $LASTEXITCODE" }

$artifact = Join-Path $release 'Furniture-GO-1.0.0-Setup.exe'
if (-not (Test-Path -LiteralPath $artifact)) { throw 'Expected Installer artifact was not generated' }
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $artifact).Hash
@{
  product = 'Furniture GO'
  version = '1.0.0'
  nodeVersion = $nodeVersion
  nodeSource = $nodeSource
  nodeSigner = $nodeSignature.SignerCertificate.Subject
  artifact = (Split-Path -Leaf $artifact)
  sizeBytes = (Get-Item -LiteralPath $artifact).Length
  sha256 = $hash
} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $release 'Furniture-GO-1.0.0-Setup.json') -Encoding UTF8
Set-Content -LiteralPath (Join-Path $release 'Furniture-GO-1.0.0-Setup.sha256') -Value "$hash  Furniture-GO-1.0.0-Setup.exe" -Encoding ASCII
Remove-Item -LiteralPath $staging -Recurse -Force
Write-Host "Installer built: $artifact"
Write-Host "SHA256: $hash"
