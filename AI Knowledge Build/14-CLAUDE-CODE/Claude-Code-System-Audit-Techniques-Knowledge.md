---
tags: [audit, code-review, hooks, mcp, testing, claude-code]
description: Claude-Code-System-Audit-Techniques
created: 2026-05-13
moc: "[[14 Claude Code]]"
---

# Claude Code System Audit Techniques

## Tổng quan
Kỹ thuật rà soát hệ thống Claude Code bao gồm: hooks, MCP servers, settings, vault structure.
Áp dụng cho bất kỳ dự án nào dùng Claude Code làm nền tảng.

## 1. Parallel Multi-Agent Audit (Kỹ thuật tốt nhất)

Spawn 9 agents song song, mỗi agent chuyên 1 loại vấn đề:
```
1. Syntax Checker    — node --check + JSON.parse validation
2. File Reference    — verify tất cả referenced paths exist
3. Hook Logic        — test hooks với realistic stdin inputs
4. MCP Tool Tester   — validate tool registration + responses
5. Integration       — test hooks + MCP end-to-end
6. Security          — credential exposure, dangerous patterns
7. Edge Cases        — boundary values, empty inputs, large files
8. Performance       — timeout risks, blocking ops, memory leaks
9. Documentation     — CLAUDE.md vs actual implementation match
```

Kết quả: Tổng hợp theo severity: CRITICAL > HIGH > MEDIUM > LOW

## 2. Hook Audit Checklist

### Input Parsing
```bash
# Test với valid input
echo '{"hook_event_name":"PostToolUse","tool_name":"Bash","tool_input":{"command":"npm install"},"cwd":"/tmp","session_id":"test"}' | node hook.js

# Test với empty/malformed input
echo '{}' | node hook.js
echo 'invalid json' | node hook.js
echo '' | node hook.js
```

### Exit Code Contract
- `exit 0` → proceed normally
- `exit 1` → error (logged, không block)
- `exit 2` + stdout JSON → BLOCK tool execution (PreToolUse only)

### Output Format
- **UserPromptSubmit**: stdout = context text injected before Claude's response
- **PreToolUse**: stdout = warning/context; exit 2 blocks tool
- **PostToolUse**: stdout ignored; chỉ dùng để side effects
- **Stop**: stdout ignored; chỉ dùng để cleanup/save

### Timeout Risks
```javascript
// Hook bị kill nếu vượt timeout trong settings.json
// Default: không có timeout
// Recommendation: 5-15s tùy hook
// Async hooks phải dùng process.stdin correctly
```

## 3. MCP Server Audit

### Tool Registration Check
```javascript
// Verify mỗi tool có đủ: name, description, schema, handler
// Test với MCP Inspector:
npx @modelcontextprotocol/inspector node server.js

// Hoặc manual via stdin JSON-RPC:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node server.js
```

### Tool Response Validation
```javascript
// Mỗi tool PHẢI return: { content: [{ type: "text", text: string }] }
// Không được throw unhandled exception
// Phải handle: missing params, empty vault, file not found
```

### Dependency Check
```bash
cd mcp-server && node -e "require('./server.js')"  # Test import
node --check server.js                              # Syntax only
```

## 4. Settings.json Audit

```javascript
// Verify structure:
// 1. Tất cả hook paths tồn tại
// 2. Timeouts hợp lý (UserPromptSubmit: 8s, PreToolUse: 5s, Stop: 15-30s)
// 3. Không có duplicate event entries
// 4. matcher "" = fire on all (correct for most hooks)

const settings = JSON.parse(fs.readFileSync('~/.claude/settings.json'));
for (const [event, groups] of Object.entries(settings.hooks)) {
  for (const group of groups) {
    for (const hook of group.hooks) {
      if (hook.type === 'command') {
        // Extract path from command string and verify it exists
        const match = hook.command.match(/node\s+"([^"]+)"/);
        if (match) assert(fs.existsSync(match[1]));
      }
    }
  }
}
```

## 5. Vault Structure Audit

```bash
# Required directories
ls "AI Knowledge Build/00-NEVER-AGAIN/"
ls "AI Knowledge Build/30-PROJECTS/"
ls "AI Knowledge Build/32-LEARNINGS/"
ls "AI Knowledge Build/35-DECISIONS/"

# Required index files
cat "00-NEVER-AGAIN/index.md"

# Check knowledge files format (must end in -Knowledge.md)
find "01-20*" -name "*.md" ! -name "*-Knowledge.md"
```

## 6. Audit Script Template

```javascript
// audit-longbrain.js — Chạy toàn bộ audit trong 1 script
const checks = [
  // [name, fn_returning_issues_array]
  ["Syntax", checkSyntax],
  ["File References", checkFileRefs],
  ["Hook Inputs", checkHookInputs],
  ["MCP Tools", checkMcpTools],
  ["Vault Dirs", checkVaultDirs],
  ["Settings", checkSettings],
];

const allIssues = [];
for (const [name, fn] of checks) {
  const issues = await fn();
  allIssues.push(...issues.map(i => ({ ...i, category: name })));
}

// Sort by severity
const sorted = allIssues.sort((a, b) =>
  ["CRITICAL","HIGH","MEDIUM","LOW"].indexOf(a.severity) -
  ["CRITICAL","HIGH","MEDIUM","LOW"].indexOf(b.severity)
);
```

## 7. Common Issues Found in Claude Code Projects

| Issue | Symptom | Fix |
|-------|---------|-----|
| Hook path hardcoded | Works on one machine, fails on another | Dùng absolute path hoặc env var |
| stdin not consumed | Hook hangs trên large inputs | `for await (const chunk of process.stdin)` |
| Missing error handling in MCP | Tool crashes → whole server dies | Wrap mỗi tool handler trong try/catch |
| process.exit(0) missing | Hook hangs indefinitely | Always explicit exit |
| Unicode in regex | Regex fails trên tiếng Việt | Dùng NFD normalize trước khi match |
| Timeout too short | Hook killed mid-write | Tăng timeout hoặc optimize |
| Circular dependency | server.js crash on require | Separate helpers into modules |

## 8. Continuous Audit (CI/CD)

```yaml
# .github/workflows/audit.yml
- name: Syntax check hooks
  run: |
    for f in .claude/hooks/*.js; do node --check "$f"; done
- name: Verify file references in settings.json
  run: node scripts/audit-settings.js
- name: Test MCP server startup
  run: timeout 5 node mcp-server/server.js || true
```

## Sources
- Claude Code Hooks Guide: https://code.claude.com/docs/en/hooks-guide
- MCP Testing Tools: https://testomat.io/blog/mcp-server-testing-tools/
- Parallel Agent Review: https://hamy.xyz/blog/2026-02_code-reviews-claude-subagents
- MCP Inspector: https://github.com/modelcontextprotocol/inspector
