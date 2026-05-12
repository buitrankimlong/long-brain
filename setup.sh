#!/bin/bash
set -e

echo ""
echo "========================================"
echo "  LONGBRAIN SETUP"
echo "========================================"
echo ""

REPO_PATH="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

# Step 1: Install MCP server dependencies
echo "[1/3] Installing MCP server dependencies..."
cd "$REPO_PATH/mcp-server"
npm install
cd "$REPO_PATH"
echo "    OK"

# Step 2: Setup global CLAUDE.md
echo "[2/3] Setting up global CLAUDE.md..."
mkdir -p "$CLAUDE_DIR"

if [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
    echo "    Found existing CLAUDE.md - backing up to CLAUDE.md.bak"
    cp "$CLAUDE_DIR/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md.bak"
fi

cp "$REPO_PATH/templates/global-CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
echo "    OK - Saved to $CLAUDE_DIR/CLAUDE.md"

# Step 3: Setup settings.json MCP config
echo "[3/3] Configuring MCP in Claude Code settings..."
SETTINGS_FILE="$CLAUDE_DIR/settings.json"

if [ ! -f "$SETTINGS_FILE" ]; then
    echo "    Creating new settings.json..."
    cat > "$SETTINGS_FILE" << EOF
{
  "mcpServers": {
    "longbrain": {
      "command": "node",
      "args": ["$REPO_PATH/mcp-server/server.js"],
      "env": {
        "AI_KNOWLEDGE_VAULT": "$REPO_PATH"
      }
    }
  }
}
EOF
    echo "    OK - Created $SETTINGS_FILE"
else
    echo "    settings.json exists."
    # Check if longbrain already configured
    if grep -q "longbrain" "$SETTINGS_FILE"; then
        echo "    longbrain already configured - skipping"
    else
        echo "    Please manually add longbrain config. See MCP-SETUP.md"
    fi
fi

echo ""
echo "========================================"
echo "  SETUP COMPLETE!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Code"
echo "  2. When prompted 'Allow longbrain?', click Allow"
echo "  3. Start a new session - Longbrain is now active in ALL projects!"
echo ""
echo "Verify connection: type 'vault_stats' in Claude Code"
echo ""
