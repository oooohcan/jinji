Set-Location "c:\code\jinji"
$env:HTTP_PROXY="http://127.0.0.1:7897"
$env:HTTPS_PROXY="http://127.0.0.1:7897"

Write-Host "=== Step 1: Aborting merge ===" -ForegroundColor Cyan
git merge --abort 2>&1

Write-Host "`n=== Step 2: Checking status ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Step 3: Force pushing local to remote ===" -ForegroundColor Cyan
git push --force origin HEAD

Write-Host "`n=== Done ===" -ForegroundColor Green