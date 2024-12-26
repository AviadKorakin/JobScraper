if not "%minimized%"=="" goto :minimized
set minimized=true
@echo off
cd "%~dp0"

start /min cmd /C "node daily-script.js"
goto :EOF
:minimized