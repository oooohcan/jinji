@echo off
cd /d c:\code\jinji
set HTTP_PROXY=http://127.0.0.1:7897
set HTTPS_PROXY=http://127.0.0.1:7897

echo === Step 1: Aborting merge ===
git merge --abort 2>nul

echo === Step 2: Checking status ===
git status

echo === Step 3: Force pushing local to remote ===
git push --force origin HEAD

echo === Done ===
pause