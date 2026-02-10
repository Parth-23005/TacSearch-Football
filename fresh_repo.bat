@echo off
echo ========================================
echo Creating Fresh Git Repository
echo ========================================
echo.

echo [1/5] Backing up current .git folder...
if exist .git.backup rmdir /s /q .git.backup
move .git .git.backup
echo Done!
echo.

echo [2/5] Initializing fresh repository...
git init
echo Done!
echo.

echo [3/5] Adding all files...
git add .
echo Done!
echo.

echo [4/5] Creating initial commit...
git commit -m "Initial commit - TacSearch Football"
echo Done!
echo.

echo [5/5] Setting up remote...
git remote add origin https://github.com/Parth-23005/TacSearch-Football.git
echo Done!
echo.

echo ========================================
echo Fresh repository created successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Push to GitHub: git push -u origin main
echo 2. If branch error, run: git branch -M main
echo.
echo Old git history backed up to .git.backup
echo (You can delete it after successful push)
