$ErrorActionPreference = "Stop"

$repositoryPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$gitPath = "C:\Program Files\Git\cmd\git.exe"
$npmPath = "C:\Program Files\nodejs\npm.cmd"
$snapshotPaths = @(
  "server/data/google-sheets/calendar.gviz",
  "server/data/google-sheets/calendar-metadata.json"
)
$logPath = Join-Path $repositoryPath ".calendar-sync.log"

function Write-SyncLog([string]$message) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -LiteralPath $logPath -Encoding UTF8 -Value "[$timestamp] $message"
}

try {
  Set-Location -LiteralPath $repositoryPath
  Write-SyncLog "scheduled synchronization started"

  & $gitPath pull --rebase --autostash origin main
  if ($LASTEXITCODE -ne 0) { throw "git pull failed with exit code $LASTEXITCODE" }

  & $npmPath run sync:calendar
  if ($LASTEXITCODE -ne 0) { throw "calendar synchronization failed with exit code $LASTEXITCODE" }

  & $gitPath diff --quiet -- @snapshotPaths
  $diffExitCode = $LASTEXITCODE
  if ($diffExitCode -eq 0) {
    Write-SyncLog "calendar snapshot is unchanged"
    exit 0
  }
  if ($diffExitCode -ne 1) { throw "git diff failed with exit code $diffExitCode" }

  & $gitPath add -- @snapshotPaths
  if ($LASTEXITCODE -ne 0) { throw "git add failed with exit code $LASTEXITCODE" }

  & $gitPath commit -m "Update calendar snapshot"
  if ($LASTEXITCODE -ne 0) { throw "git commit failed with exit code $LASTEXITCODE" }

  & $gitPath push origin main
  if ($LASTEXITCODE -ne 0) { throw "git push failed with exit code $LASTEXITCODE" }

  Write-SyncLog "calendar snapshot changed and was pushed"
} catch {
  Write-SyncLog "FAILED: $($_.Exception.Message)"
  exit 1
}