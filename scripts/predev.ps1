# Frees port 5188 and clears stray Tether dev/electron processes so `npm run dev`
# starts clean. Best-effort — errors are swallowed so it never blocks dev start.
$ErrorActionPreference = 'SilentlyContinue'
$killed = 0

# 1. Whatever is listening on the Vite port (a half-dead prior dev server).
$conn = Get-NetTCPConnection -LocalPort 5188 -State Listen -ErrorAction SilentlyContinue
foreach ($c in $conn) {
  Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
  $killed++
}

# 2. Stray Electron from THIS project only (it holds the single-instance lock, which
#    makes a new dev launch quit immediately). Matched by path so other Electron
#    apps (VS Code, Slack, Teams) are never touched.
$root = Split-Path -Parent $PSScriptRoot
$procs = Get-CimInstance Win32_Process -Filter "Name='electron.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*$root*" -or $_.ExecutablePath -like "*$root*" }
foreach ($p in $procs) {
  Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
  $killed++
}

if ($killed -gt 0) { Write-Output "[predev] cleared $killed stray process(es); port 5188 is free" }
