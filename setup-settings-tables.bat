@echo off
echo Setting up database tables for settings and requesters...
echo.

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: psql command not found. Please install PostgreSQL and add it to PATH.
    echo.
    echo You can also run the SQL script manually in your database management tool.
    echo File: setup-database-settings.sql
    pause
    exit /b 1
)

echo PostgreSQL found. Running setup script...
echo.

REM Prompt for database connection details
set /p DB_HOST=Enter database host (default: localhost): 
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT=Enter database port (default: 5432): 
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME=Enter database name: 
if "%DB_NAME%"=="" (
    echo Error: Database name is required.
    pause
    exit /b 1
)

set /p DB_USER=Enter database user: 
if "%DB_USER%"=="" (
    echo Error: Database user is required.
    pause
    exit /b 1
)

echo.
echo Running setup script on database: %DB_NAME%@%DB_HOST%:%DB_PORT%
echo.

REM Run the SQL script
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f setup-database-settings.sql

if %errorlevel% equ 0 (
    echo.
    echo Database setup completed successfully!
    echo Tables 'settings' and 'requesters' have been created.
    echo Default data has been inserted.
) else (
    echo.
    echo Error: Database setup failed. Please check your connection details and try again.
)

echo.
pause
