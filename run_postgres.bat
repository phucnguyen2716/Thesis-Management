@echo off
title PostgreSQL Server
echo Starting PostgreSQL on port 5432...
echo Starting PostgreSQL on %date% %time% > postgres_start.log
"C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "C:\Program Files\PostgreSQL\18\data" >> postgres_start.log 2>&1
pause
