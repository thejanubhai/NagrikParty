# Verifies every installed package against the tarball recorded in
# package-lock.json (npm cacache), listing any package with missing files.
$root = 'C:\Users\hudav\Documents\GitHub\webapp'
$nm = Join-Path $root 'node_modules'
$cache = Join-Path $env:LOCALAPPDATA 'npm-cache\_cacache\content-v2'
$report = Join-Path $root 'integrity-report.txt'
$list = Join-Path $root 'integrity-broken.txt'

# Node parses the lockfile for us (.cjs because "type": "module").
$entries = & node (Join-Path $root 'lock-packages.cjs')
if ($LASTEXITCODE -ne 0) { "lock parse failed"; exit 1 }

function Get-ContentPath([string]$integrity) {
  # integrity looks like "sha512-<base64>"
  $parts = $integrity -split '-', 2
  if ($parts.Count -lt 2 -or -not $parts[1]) { return $null }
  $bytes = [System.Convert]::FromBase64String($parts[1])
  $hex = -join ($bytes | ForEach-Object { $_.ToString('x2') })
  # cacache layout: content-v2/sha512/<first 2>/<next 2>/<rest>
  $a = $hex.Substring(0, 2); $b = $hex.Substring(2, 2); $c = $hex.Substring(4)
  $algDir = Join-Path $cache (($parts[0]) -replace ':', '/')
  return Join-Path (Join-Path (Join-Path $algDir $a) $b) $c
}

$broken = @()
$checked = 0
$skipped = 0
foreach ($line in $entries) {
  $cols = $line -split "`t", 2
  if ($cols.Count -lt 2) { continue }
  $relPath = $cols[0]; $integrity = $cols[1]
  if ($relPath -like 'node_modules/.bin*') { continue }
  $pkgDir = Join-Path $nm ($relPath -replace '^node_modules/', '' -replace '/', '\')
  if (-not (Test-Path (Join-Path $pkgDir 'package.json'))) { $skipped++; continue }
  $contentFile = Get-ContentPath $integrity
  if (-not $contentFile -or -not (Test-Path $contentFile)) { $skipped++; continue }
  $checked++
  $tarFiles = & tar -tf $contentFile 2>$null
  $missing = @()
  foreach ($entry in $tarFiles) {
    $rel = $entry -replace '^package/', ''
    if (-not $rel -or $rel.EndsWith('/')) { continue }
    if (-not (Test-Path (Join-Path $pkgDir $rel))) { $missing += $rel }
  }
  if ($missing.Count -gt 0) {
    $broken += [PSCustomObject]@{
      Path = $relPath; Dir = $pkgDir; Count = $missing.Count
      Sample = ($missing | Select-Object -First 5) -join ', '
    }
  }
}

"checked=$checked skipped=$skipped broken=$($broken.Count)" | Out-File $report -Encoding utf8
$broken | ForEach-Object { "$($_.Path) :: $($_.Count) missing :: $($_.Sample)" } | Out-File $report -Encoding utf8 -Append
@($broken | ForEach-Object { $_.Path }) | Out-File $list -Encoding utf8
