@echo off
echo.
echo ========================================
echo   LONGBRAIN SETUP
echo ========================================
echo.

REM Step 1: Install MCP server dependencies
echo [1/3] Installing MCP server dependencies...
cd mcp-server
npm install
if errorlevel 1 (
    echo ERROR: npm install failed. Make sure Node.js is installed.
    pause
    exit /b 1
)
cd ..
echo     OK

REM Step 2: Setup global CLAUDE.md
echo [2/3] Setting up global CLAUDE.md...
set CLAUDE_DIR=%USERPROFILE%\.claude

if not exist "%CLAUDE_DIR%" mkdir "%CLAUDE_DIR%"

if exist "%CLAUDE_DIR%\CLAUDE.md" (
    echo     Found existing CLAUDE.md - backing up to CLAUDE.md.bak
    copy "%CLAUDE_DIR%\CLAUDE.md" "%CLAUDE_DIR%\CLAUDE.md.bak" >nul
)

copy "templates\global-CLAUDE.md" "%CLAUDE_DIR%\CLAUDE.md" >nul
echo     OK - Saved to %CLAUDE_DIR%\CLAUDE.md

REM Step 3: Setup settings.json MCP config
echo [3/3] Configuring MCP in Claude Code settings...
set SETTINGS_FILE=%CLAUDE_DIR%\settings.json
set REPO_PATH=%CD%

if not exist "%SETTINGS_FILE%" (
    echo     Creating new settings.json...
    (
        echo {
        echo   "mcpServers": {
        echo     "longbrain": {
        echo       "command": "node",
        echo       "args": ["%REPO_PATH:\=\\%\\mcp-server\\server.js"],
        echo       "env": {
        echo         "AI_KNOWLEDGE_VAULT": "%REPO_PATH:\=\\%"
        echo       }
        echo     }
        echo   }
        echo }
    ) > "%SETTINGS_FILE%"
    echo     OK - Created %SETTINGS_FILE%
) else (
    echo     settings.json exists. Please manually add longbrain MCP config.
    echo     See MCP-SETUP.md for instructions.
)

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo   1. Restart Claude Code
echo   2. When prompted "Allow longbrain?", click Allow
echo   3. Start a new session - Longbrain is now active in ALL projects!
echo.
echo Verify connection: type "vault_stats" in Claude Code
echo.
pause
