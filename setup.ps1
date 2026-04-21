# One-shot local setup (Windows PowerShell): env file, Docker stack (optional), Frontend deps.
# Run from the repository root:  .\setup.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
Set-Location $RepoRoot

Write-Host "== CTSE assignment setup ==" -ForegroundColor Cyan

function Test-CommandExists([string] $Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "node")) {
    Write-Host "Node.js is required. Install from https://nodejs.org/ and re-run." -ForegroundColor Red
    exit 1
}
Write-Host ("Node.js: " + (node -v))

$dockerAvailable = Test-CommandExists "docker"
if (-not $dockerAvailable) {
    Write-Host "Docker not found in PATH — skipping docker compose (install Docker Desktop to run the stack)." -ForegroundColor Yellow
} else {
    Write-Host ("Docker: " + (docker --version))
}

if (-not (Test-Path (Join-Path $RepoRoot ".env"))) {
    $example = Join-Path $RepoRoot ".env.example"
    if (Test-Path $example) {
        Copy-Item $example (Join-Path $RepoRoot ".env")
        Write-Host "Created .env from .env.example (edit secrets as needed)." -ForegroundColor Green
    } else {
        Write-Host "No .env.example found; create .env manually next to docker-compose.yml." -ForegroundColor Yellow
    }
} else {
    Write-Host ".env already exists — leaving in place."
}

if ($dockerAvailable) {
    Write-Host "`nBuilding and starting Docker Compose stack..." -ForegroundColor Cyan
    docker compose build
    docker compose up -d
    Write-Host "Stack started. API gateway: http://localhost:8087" -ForegroundColor Green
}

$frontend = Join-Path $RepoRoot "Frontend"
Set-Location $frontend
Write-Host "`nInstalling Frontend dependencies..." -ForegroundColor Cyan
npm install

Write-Host "`nRunning production build (sanity check)..." -ForegroundColor Cyan
npm run build

Write-Host @"

Done.

- API gateway (Docker): http://localhost:8087
- Frontend dev server:  cd Frontend; npm run dev   (set Frontend/.env VITE_API_BASE_URL if needed)

"@ -ForegroundColor Green
