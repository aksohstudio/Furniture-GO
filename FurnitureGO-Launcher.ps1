$ErrorActionPreference = 'Stop'

$appRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodePath = Join-Path $appRoot 'runtime\node.exe'
$serverPath = Join-Path $appRoot 'server.js'
$dataRoot = Join-Path $env:LOCALAPPDATA 'Furniture GO\data'
$port = 4173
$url = "http://127.0.0.1:$port/"

if (-not (Test-Path -LiteralPath $nodePath)) { throw "Bundled Node runtime not found: $nodePath" }
if (-not (Test-Path -LiteralPath $serverPath)) { throw "Furniture GO server not found: $serverPath" }
New-Item -ItemType Directory -Path $dataRoot -Force | Out-Null
$env:FURNITURE_GO_DATA_DIR = $dataRoot
$env:PORT = "$port"

$server = Start-Process -FilePath $nodePath -ArgumentList @($serverPath) -WorkingDirectory $appRoot -PassThru -WindowStyle Hidden
try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
    if ($server.HasExited) { throw "Furniture GO server exited before readiness (code $($server.ExitCode))" }
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { $ready = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 250
  }
  if (-not $ready) { throw "Furniture GO server did not become ready at $url" }
  Start-Process $url | Out-Null
  Wait-Process -Id $server.Id
} finally {
  if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}
