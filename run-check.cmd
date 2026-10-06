@echo off
cd /d C:\Users\hudav\Documents\GitHub\webapp
call npm run check > check.log 2>&1
echo ==== CHECK EXIT %ERRORLEVEL% ==== >> check.log
