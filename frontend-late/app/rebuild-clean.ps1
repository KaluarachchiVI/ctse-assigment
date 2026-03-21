# Use after changing API URLs or env — removes stale chunks that still call old ports.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
Write-Host "Running npm run build..."
npm run build
Write-Host "Done. Restart `npm run start` or rebuild the Docker frontend image."
