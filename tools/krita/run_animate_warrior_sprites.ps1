$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$kritaRunner = "C:\Program Files\Krita (x64)\bin\kritarunner.com"
$runnerModuleDir = Join-Path $env:APPDATA "kritarunner"
$moduleName = "animate_warrior_sprites"

if (-not (Test-Path -LiteralPath $kritaRunner)) {
  throw "Could not find kritarunner.com at $kritaRunner"
}

New-Item -ItemType Directory -Path $runnerModuleDir -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "$moduleName.py") -Destination (Join-Path $runnerModuleDir "$moduleName.py") -Force

Push-Location $projectRoot
try {
  & $kritaRunner -s $moduleName
}
finally {
  Pop-Location
}
