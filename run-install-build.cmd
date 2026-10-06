@echo off
cd /d C:\Users\hudav\Documents\GitHub\webapp
powershell -NoProfile -ExecutionPolicy Bypass -File verify-packages.ps1 > verify.log 2>&1
echo ==== VERIFY EXIT %ERRORLEVEL% ==== >> verify.log
powershell -NoProfile -ExecutionPolicy Bypass -File repair-packages.ps1 >> verify.log 2>&1
echo ==== REPAIR EXIT %ERRORLEVEL% ==== >> verify.log
call npm install --prefer-offline --no-audit --no-fund --ignore-scripts --loglevel=error > npm-detached.log 2>&1
echo ==== INSTALL EXIT %ERRORLEVEL% ==== >> npm-detached.log
call npm run build > build.log 2>&1
echo ==== BUILD EXIT %ERRORLEVEL% ==== >> build.log
