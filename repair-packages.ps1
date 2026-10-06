# Deletes the package directories listed in integrity-broken.txt so that
# `npm install` re-extracts them from the cache.
$list = 'C:\Users\hudav\Documents\GitHub\webapp\integrity-broken.txt'
if (-not (Test-Path $list)) { "no list"; exit 0 }
$nm = 'C:\Users\hudav\Documents\GitHub\webapp\node_modules'
$lines = Get-Content $list | Where-Object { $_ -and $_.Trim() }
foreach ($rel in $lines) {
  $dir = Join-Path $nm ($rel -replace '^node_modules/', '' -replace '/', '\')
  if (Test-Path $dir) {
    try { Remove-Item -Recurse -Force $dir -ErrorAction Stop; "removed $rel" }
    catch { "FAILED $rel : $_" }
  }
}
"done, removed $($lines.Count) candidates"
