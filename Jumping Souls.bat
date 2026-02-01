@echo off
setlocal
set PORT=8000

where /q py
if %errorlevel%==0 (
  set PY=py
  goto :run
)

where /q python
if %errorlevel%==0 (
  set PY=python
  goto :run
)

echo Python not found. Install Python or add it to PATH, then retry.
pause
exit /b 1

:run
echo Starting local server on http://localhost:%PORT%/index.html
start "" http://localhost:%PORT%/index.html
%PY% -m http.server %PORT%