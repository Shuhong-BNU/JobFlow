$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Fail-Step($message) {
  Write-Host ""
  Write-Host "Startup aborted: $message" -ForegroundColor Red
  exit 1
}

function Invoke-CheckedCommand {
  param(
    [string]$Command,
    [string]$FailureMessage
  )

  Invoke-Expression $Command

  if ($LASTEXITCODE -ne 0) {
    Fail-Step $FailureMessage
  }
}

function Test-TcpPort {
  param(
    [string]$HostName,
    [int]$Port
  )

  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    $wait = $async.AsyncWaitHandle.WaitOne(1500, $false)

    if (-not $wait) {
      $client.Close()
      return $false
    }

    $client.EndConnect($async)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Ensure-DockerDesktop {
  cmd /c "docker info >nul 2>nul"
  if ($LASTEXITCODE -eq 0) {
    return
  }

  $desktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"

  if (-not (Test-Path $desktopExe)) {
    Fail-Step "Docker is not ready and Docker Desktop was not found."
  }

  Write-Step "Docker is not ready. Trying to start Docker Desktop"
  Start-Process -FilePath $desktopExe | Out-Null

  for ($i = 0; $i -lt 24; $i++) {
    Start-Sleep -Seconds 5
    cmd /c "docker info >nul 2>nul"

    if ($LASTEXITCODE -eq 0) {
      return
    }
  }

  Fail-Step "Docker Desktop did not become ready within the wait window."
}

function Wait-ForDatabase {
  param(
    [string]$HostName = "127.0.0.1",
    [int]$Port = 5432,
    [int]$Attempts = 20
  )

  for ($i = 0; $i -lt $Attempts; $i++) {
    if (Test-TcpPort -HostName $HostName -Port $Port) {
      return
    }

    Start-Sleep -Seconds 2
  }

  Fail-Step "Database port ${HostName}:$Port did not become ready in time."
}

if (-not (Test-Path ".env.local")) {
  Write-Step "Creating .env.local from .env.example"
  Copy-Item ".env.example" ".env.local"
}

if (-not (Test-Path ".env")) {
  Write-Step "Creating .env from .env.example"
  Copy-Item ".env.example" ".env"
}

if (-not (Test-Path ".runtime\\logs")) {
  New-Item -ItemType Directory -Path ".runtime\\logs" -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $repoRoot ".runtime\\logs\\dev-$timestamp.log"

Ensure-DockerDesktop

Write-Step "Starting local PostgreSQL container"
Invoke-CheckedCommand "docker compose up -d" "docker compose failed."

Write-Step "Waiting for database port"
Wait-ForDatabase

Write-Step "Running database migrations"
Invoke-CheckedCommand "npm run db:migrate" "Database migration failed."

Write-Step "Running database seed"
Invoke-CheckedCommand "npm run db:seed" "Database seed failed."

Write-Step "Starting next dev and writing logs to $logPath"
$env:JOBFLOW_FILE_LOGGING = "1"
npm run dev *>&1 | Tee-Object -FilePath $logPath
