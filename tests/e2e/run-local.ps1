# Run in a detached process when the calling shell has a short command timeout.
# This script never resets or deletes database state.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location $root
$artifacts = Join-Path $PSScriptRoot 'artifacts'
New-Item -ItemType Directory -Path $artifacts -Force | Out-Null
$ErrorActionPreference = 'Continue'
& node (Join-Path $root 'node_modules/@playwright/test/cli.js') test *> (Join-Path $artifacts 'suite.log')
$code = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
Set-Content -Path (Join-Path $artifacts 'suite.exitcode') -Value $code
exit $code