$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path 'backend/.env')) {
    Copy-Item 'backend/.env.example' 'backend/.env'
}

docker compose --env-file backend/.env.docker.example --env-file backend/.env up --build
exit $LASTEXITCODE