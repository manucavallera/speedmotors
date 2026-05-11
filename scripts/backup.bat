@echo off
REM Backup PostgreSQL via docker exec — Windows
REM Programar con Task Scheduler: schtasks /create /tn "SpeedMotors Backup" /tr "C:\ruta\scripts\backup.bat" /sc daily /st 03:00

SET BACKUP_DIR=%~dp0backups
IF NOT EXIST "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

FOR /f "tokens=1-3 delims=/ " %%a IN ("%date%") DO SET D=%%c%%b%%a
FOR /f "tokens=1-2 delims=: " %%a IN ("%time%") DO SET T=%%a%%b
SET T=%T: =0%

SET FILE=%BACKUP_DIR%\speedmotors_%D%_%T%.sql

docker exec speedmotors-db pg_dump -U speedmotors speedmotors > "%FILE%"

echo Backup guardado: %FILE%
