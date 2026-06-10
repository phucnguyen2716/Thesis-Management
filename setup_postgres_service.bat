@echo off
:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges...
) else (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

:: Register PostgreSQL service
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" register -N "postgresql-x64-18" -D "C:\Program Files\PostgreSQL\18\data" -U "NT AUTHORITY\NetworkService"

:: Start PostgreSQL service
net start postgresql-x64-18

echo.
echo PostgreSQL service has been successfully registered and started!
echo.
pause
