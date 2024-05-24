@echo off

set "CURRENT_DIR=%CD%"

set "SCRIPT_NAME=start.js"

set "SCRIPT_PATH=%CURRENT_DIR%\%SCRIPT_NAME%"

cd "%CURRENT_DIR%"

node "%SCRIPT_NAME%"