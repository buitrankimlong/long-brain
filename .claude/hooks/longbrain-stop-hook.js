#!/usr/bin/env node
/**
 * Longbrain Stop Hook — Synthesized v2.0
 * ========================================
 * Kết hợp tốt nhất từ 2 implementations:
 *   - Core: buildToolPairMap + 5 extractors (BashSuccess, BugFix, Decision, Learning, Config)
 *   - Extras: extractMcpCalls, extractFileChanges, extractUserGoal, large file handling
 *
 * Input (stdin): JSON từ Claude Code Stop hook
 * { hook_event_name: "Stop", session_id, transcript_path, cwd, stop_reason }
 *
 * Output: Markdown file trong 32-LEARNINGS/ (chỉ khi đủ chất lượng)
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────
const VAULT_DIR     = path.join("C:", "AI Build Learning", "AI Knowledge Build");
const LEARNINGS_DIR = path.join(VAULT_DIR, "32-LEARNINGS");

// Giới hạn file size để tránh OOM (10 MB)
const MAX_TRANSCRIPT_BYTES = 10 * 1024 * 1024;
const MAX_LINES = 2000;

// Commands trivial — bỏ qua
const TRIVIAL_COMMANDS = /^(ls|dir|pwd|cd\s|echo\s|cat\s|type\s|head\s|tail\s|which\s|where\s|whoami|date|time|clear|cls|history|env|set\s|export\s|alias\s*$)/i;

// Commands có giá trị cao cho BashSuccess
const VALUABLE_BASH = [
  /\b(npm|yarn|pnpm)\s+(install|add|build|run|publish)/i,
  /\b(pip|pip3|uv)\s+(install|add)/i,
  /\b(apt|apt-get|brew|yum|dnf)\s+(install|update|upgrade)/i,
  /\b(docker|docker-compose|compose)\s+(build|up|down|run|push|pull)/i,
  /\b(git)\s+(clone|init|commit|push|pull|merge|checkout\s+-b)/i,
  /\b(systemctl|service)\s+(start|stop|restart|enable|disable)/i,
  /\b(nginx|pm2|caddy)\s+(start|stop|restart|reload)/i,
  /\b(psql|mysql|redis-cli|createdb|dropdb)\b/i,
  /\b(kubectl|helm|terraform|ansible)\b/i,
  /\b(certbot|openssl)\b/i,
  /\b(ssh-keygen|ssh-copy-id)\b/i,
  />(\/etc\/|\.env|\.conf|\.service|\.timer|nginx\.conf)/i,
  /\b(chmod|chown)\s+/i,
  /\b(node|python|python3)\s+\S+\.(?:js|py)\b/i,
];

// Patterns phát hiện lỗi
const BUG_INDICATORS = [
  /\b(error|lỗi|failed|fail|không hoạt động|không chạy|crash|exception|traceback|undefined|null pointer)/i,
  /\b(fix|sửa|debug|resolve|giải quyết|khắc phục|workaround)\b/i,
  /exit code [1-9]/i,
  /command not found/i,
  /permission denied/i,
  /ENOENT|EACCES|EADDRINUSE/i,
];

// Patterns phát hiện Decision
const DECISION_PATTERNS = [
  /\b(sẽ dùng|thay vì|chọn|quyết định|thay thế|instead of|rather than|we'll use|going with|prefer|tốt hơn là|better to)\b/i,
  /\b(không dùng|bỏ|loại bỏ|not using|avoid|skip)\b.*\b(vì|because|do|since)\b/i,
];

// Patterns phát hiện Learning / Insight
const LEARNING_PATTERNS = [
  /\b(vì|because|do đó|therefore|hence|lưu ý|note:|important:|chú ý|nhớ rằng|key insight|bài học|lesson)\b/i,
  /\b(phải|must|cần|need to|should|nên)\s+.{10,}/i,
  /\b(lý do|reason|tại sao|why)\b/i,
];

// Config patterns
const CONFIG_PATTERNS = [
  /\b(nginx|docker|docker-compose|ssh|systemctl|pm2|gunicorn|uwsgi|caddy)\b/i,
  /\.(env|conf|config|yaml|yml|toml|ini|service|timer)\b/i,
  /\b(PORT|HOST|DATABASE_URL|REDIS_URL|SECRET_KEY|API_KEY)\b/i,
];

// Longbrain MCP tools đáng ghi lại
const IMPORTANT_MCP_TOOLS = new Set([
  "mcp__longbrain__add_knowledge",
  "mcp__longbrain__add_learning",
  "mcp__longbrain__add_project",
  "mcp__longbrain__update_knowledge",
  "mcp__longbrain__init_project",
  "mcp__longbrain__log_progress",
  "add_knowledge", "add_learning", "add_project", // backward compat
]);

// File tools đáng theo dõi
const FILE_TOOLS = new Set(["Write", "Edit", "NotebookEdit"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

function nowTs() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

function snippet(text, maxLen = 300) {
  if (!text) return "";
  const s = String(text).trim();
  return s.length > maxLen ? s.substring(0, maxLen - 3) + "..." : s;
}

function isValuableBash(cmd) {
  if (!cmd) return false;
  if (TRIVIAL_COMMANDS.test(cmd.trim())) return false;
  return VALUABLE_BASH.some(p => p.test(cmd));
}

function looksLikeError(text) {
  if (!text) return false;
  return BUG_INDICATORS.slice(0, 3).some(p => p.test(text.substring(0, 600)));
}

// ─── Transcript Parser ────────────────────────────────────────────────────────

/**
 * Đọc JSONL với large file handling, parse thành events array.
 */
function parseTranscript(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];
  try {
    let raw;
    const stat = fs.statSync(transcriptPath);
    if (stat.size > MAX_TRANSCRIPT_BYTES) {
      // Chỉ đọc phần cuối nếu file quá lớn
      const buf = Buffer.alloc(MAX_TRANSCRIPT_BYTES);
      const fd  = fs.openSync(transcriptPath, "r");
      fs.readSync(fd, buf, 0, MAX_TRANSCRIPT_BYTES, stat.size - MAX_TRANSCRIPT_BYTES);
      fs.closeSync(fd);
      raw = buf.toString("utf-8");
    } else {
      raw = fs.readFileSync(transcriptPath, "utf-8");
    }

    const lines = raw.split("\n").filter(l => l.trim());
    const limited = lines.slice(-MAX_LINES);
    const events = [];
    for (const line of limited) {
      try { events.push(JSON.parse(line)); } catch { /* skip malformed */ }
    }
    return events;
  } catch {
    return [];
  }
}

/**
 * Chuẩn hóa events thành messages array.
 * Mỗi message: { role, contents[], timestamp }
 * contents[i] = { type: "text"|"tool_use"|"tool_result"|"thinking", ... }
 */
function extractMessages(events) {
  const messages = [];
  for (const ev of events) {
    if (ev.type !== "user" && ev.type !== "assistant") continue;
    const msg = ev.message;
    if (!msg) continue;

    const parsed = typeof msg === "string" ? tryParse(msg) : msg;
    if (!parsed || !parsed.content) continue;

    const role = parsed.role || ev.type;
    const contentRaw = parsed.content;

    let contents = [];
    if (typeof contentRaw === "string") {
      if (contentRaw.trim()) contents.push({ type: "text", text: contentRaw });
    } else if (Array.isArray(contentRaw)) {
      for (const c of contentRaw) {
        if (!c || !c.type) continue;
        contents.push(c);
      }
    }

    if (contents.length > 0) {
      messages.push({ role, contents, timestamp: ev.timestamp });
    }
  }
  return messages;
}

function tryParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * Build lookup map: tool_use_id → { name, input, result, isError }
 * Ghép cặp tool_use (assistant) với tool_result (user) qua tool_use_id.
 */
function buildToolPairMap(messages) {
  const toolUseMap = {};
  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    for (const c of msg.contents) {
      if (c.type === "tool_use" && c.id) {
        toolUseMap[c.id] = { name: c.name, input: c.input || {} };
      }
    }
  }

  const toolResultMap = {};
  for (const msg of messages) {
    if (msg.role !== "user") continue;
    for (const c of msg.contents) {
      if (c.type === "tool_result" && c.tool_use_id) {
        let resultText = "";
        if (typeof c.content === "string") {
          resultText = c.content;
        } else if (Array.isArray(c.content)) {
          resultText = c.content.map(x => x.text || "").join("\n");
        }
        toolResultMap[c.tool_use_id] = {
          content: resultText,
          isError: c.is_error === true,
        };
      }
    }
  }

  const pairs = {};
  for (const [id, toolDef] of Object.entries(toolUseMap)) {
    const result = toolResultMap[id];
    pairs[id] = {
      name: toolDef.name,
      input: toolDef.input,
      result: result ? result.content : null,
      isError: result ? result.isError : null,
    };
  }
  return pairs;
}

// ─── Session Quality Check ────────────────────────────────────────────────────

function isSessionWorthProcessing(events, messages) {
  const humanTurns = messages.filter(m => m.role === "user" && m.contents.some(c => c.type === "text")).length;
  if (humanTurns < 3) return false;

  if (events.length >= 2) {
    const firstTs = new Date(events[0].timestamp || 0).getTime();
    const lastTs  = new Date(events[events.length - 1].timestamp || 0).getTime();
    const durationMs = lastTs - firstTs;
    if (durationMs < 3 * 60 * 1000) return false;
  }

  return true;
}

// ─── Extractors ───────────────────────────────────────────────────────────────

/** A. User Goals — 3 tin nhắn đầu của user */
function extractUserGoal(messages) {
  return messages
    .filter(m => m.role === "user")
    .slice(0, 3)
    .flatMap(m => m.contents
      .filter(c => c.type === "text" && c.text && c.text.trim().length > 10)
      .map(c => snippet(c.text, 200))
    )
    .filter(Boolean)
    .slice(0, 3);
}

/** B. BashSuccess — Bash commands có giá trị chạy thành công */
function extractBashSuccess(toolPairs) {
  const items = [];
  for (const [, pair] of Object.entries(toolPairs)) {
    if (pair.name !== "Bash") continue;

    const cmd = pair.input.command || pair.input.cmd || "";
    if (!isValuableBash(cmd)) continue;
    if (pair.isError === true) continue;
    if (pair.result && looksLikeError(pair.result)) continue;
    if (pair.result === null) continue;

    const title = inferBashTitle(cmd);
    const resultSnippet = getUsefulOutputSnippet(pair.result);

    items.push({
      type: "BashSuccess",
      title,
      command: cmd.trim().split("\n")[0].substring(0, 150),
      result: resultSnippet,
    });
  }
  return items;
}

function inferBashTitle(cmd) {
  cmd = cmd.trim();
  const npmMatch = cmd.match(/\b(npm|yarn|pnpm)\s+(install|add|build|run)\s+([\w@/-]+)?/i);
  if (npmMatch) return `${npmMatch[1]} ${npmMatch[2]} ${npmMatch[3] || ""}`.trim();

  const aptMatch = cmd.match(/\b(apt|apt-get|brew)\s+install\s+([\w-]+)/i);
  if (aptMatch) return `${aptMatch[1]} install ${aptMatch[2]}`;

  const dockerMatch = cmd.match(/\bdocker(?:-compose|compose)?\s+(\w+)/i);
  if (dockerMatch) return `docker ${dockerMatch[1]}`;

  const gitMatch = cmd.match(/\bgit\s+(\w+)/i);
  if (gitMatch) return `git ${gitMatch[1]}`;

  const sysMatch = cmd.match(/\b(systemctl|service)\s+(\w+)\s+(\w+)/i);
  if (sysMatch) return `${sysMatch[1]} ${sysMatch[2]} ${sysMatch[3]}`;

  return cmd.substring(0, 60).replace(/\s+/g, " ");
}

function getUsefulOutputSnippet(output) {
  if (!output) return "";
  const text = String(output).trim();
  if (!text) return "";
  const lines = text.split("\n").filter(l => l.trim() && !l.startsWith("     "));
  if (lines.length === 0) return "";
  const last = lines[lines.length - 1].trim();
  if (last.length > 10) return snippet(last, 200);
  return snippet(text, 200);
}

/** C. BugFix — Error → Fix sequence */
function extractBugFix(messages, toolPairs) {
  const items = [];
  const seenErrors = new Set();

  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    if (msg.role !== "user") continue;

    for (const c of msg.contents) {
      if (c.type !== "tool_result") continue;
      const pair = toolPairs[c.tool_use_id];
      if (!pair) continue;
      if (!pair.isError && !looksLikeError(pair.result)) continue;

      const errorText = pair.result || "";
      const errorKey = errorText.substring(0, 100);
      if (seenErrors.has(errorKey)) continue;

      let fixDescription = "";
      let fixCommand = "";

      for (let j = i + 1; j < Math.min(i + 6, messages.length); j++) {
        const nextMsg = messages[j];
        if (nextMsg.role !== "assistant") continue;

        for (const nc of nextMsg.contents) {
          if (nc.type === "text" && nc.text) {
            const hasFix = /\b(fix|sửa|thay|đổi|update|change|remove|add|vấn đề|issue|lỗi là|problem is)\b/i.test(nc.text);
            if (hasFix && !fixDescription) {
              fixDescription = snippet(nc.text, 300);
            }
          }
          if (nc.type === "tool_use" && nc.name === "Bash") {
            const fixCmd = (nc.input || {}).command || "";
            if (fixCmd && !TRIVIAL_COMMANDS.test(fixCmd.trim())) {
              fixCommand = fixCmd.trim().substring(0, 150);
            }
          }
        }
        if (fixDescription || fixCommand) break;
      }

      if (!fixDescription && !fixCommand) continue;

      seenErrors.add(errorKey);
      items.push({
        type: "BugFix",
        title: inferErrorTitle(errorText, pair.name, (pair.input || {}).command),
        problem: snippet(errorText, 250),
        fix: fixDescription || fixCommand,
        fixCommand,
      });

      if (items.length >= 5) return items;
    }
  }
  return items;
}

function inferErrorTitle(errorText, toolName, command) {
  const nodeErrMatch = errorText.match(/\b(ENOENT|EACCES|EADDRINUSE|ECONNREFUSED|MODULE_NOT_FOUND)\b/);
  if (nodeErrMatch) return `Fix ${nodeErrMatch[1]}`;

  if (/command not found/i.test(errorText)) {
    const m = errorText.match(/(\S+): command not found/i);
    return m ? `Fix: '${m[1]}' command not found` : "Fix: command not found";
  }

  if (/permission denied/i.test(errorText)) return "Fix: Permission denied";

  const exitMatch = errorText.match(/exit code ([1-9]\d*)/i);
  if (exitMatch) {
    const cmdSnip = command ? command.split(/\s+/).slice(0, 3).join(" ") : toolName;
    return `Fix exit code ${exitMatch[1]}: ${cmdSnip}`;
  }

  if (command) {
    const cmdWords = command.trim().split(/\s+/).slice(0, 4).join(" ");
    return `Fix error in: ${cmdWords.substring(0, 50)}`;
  }

  return "Fix: Runtime error";
}

/** D. Decisions — Quyết định kỹ thuật */
function extractDecisions(messages) {
  const items = [];
  const seenDecisions = new Set();

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;

    for (const c of msg.contents) {
      if (c.type !== "text" || !c.text) continue;

      const lines = c.text.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length < 20 || trimmed.length > 400) continue;
        if (!DECISION_PATTERNS.some(p => p.test(trimmed))) continue;

        const key = trimmed.substring(0, 80).toLowerCase();
        if (seenDecisions.has(key)) continue;
        seenDecisions.add(key);

        const lineIdx = lines.indexOf(line);
        const context = [];
        if (lineIdx > 0 && lines[lineIdx - 1].trim()) context.push(lines[lineIdx - 1].trim());
        if (lineIdx < lines.length - 1 && lines[lineIdx + 1].trim()) context.push(lines[lineIdx + 1].trim());

        items.push({
          type: "Decision",
          title: inferDecisionTitle(trimmed),
          decision: snippet(trimmed, 300),
          context: context.join(" | ").substring(0, 200),
        });

        if (items.length >= 5) return items;
      }
    }
  }
  return items;
}

function inferDecisionTitle(text) {
  const techMatch = text.match(/\b(PostgreSQL|MySQL|MongoDB|Redis|Docker|Kubernetes|Node\.js|Python|TypeScript|React|Vue|Next\.js|FastAPI|Express|nginx|pm2|LangChain|LangGraph|CrewAI|OpenAI|Claude|Zalo|MoMo|VNPay)\b/i);
  if (techMatch) return `Chọn ${techMatch[1]}`;

  const thayViMatch = text.match(/(.{5,30})\s+thay vì\s+(.{5,30})/i);
  if (thayViMatch) return `Dùng ${thayViMatch[1].trim()} thay vì ${thayViMatch[2].trim()}`.substring(0, 60);

  const insteadMatch = text.match(/(.{5,30})\s+instead of\s+(.{5,30})/i);
  if (insteadMatch) return `Use ${insteadMatch[1].trim()} instead of ${insteadMatch[2].trim()}`.substring(0, 60);

  return text.substring(0, 50) + (text.length > 50 ? "..." : "");
}

/** E. Learnings / Insights */
function extractLearnings(messages, toolPairs) {
  const items = [];
  const seenInsights = new Set();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;

    for (const c of msg.contents) {
      if (c.type !== "text" || !c.text) continue;

      const sentences = c.text
        .split(/(?<=[.!?。])\s+|[\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 500);

      for (const sentence of sentences) {
        if (!LEARNING_PATTERNS.some(p => p.test(sentence))) continue;

        const key = sentence.substring(0, 80).toLowerCase();
        if (seenInsights.has(key)) continue;

        const hasTechContext = /\b(file|server|port|path|config|npm|node|python|docker|git|api|database|install|build|deploy|error|hook|script|env|command|function|module|package)\b/i.test(sentence);
        if (!hasTechContext) continue;

        seenInsights.add(key);

        let relatedCmd = "";
        for (let j = Math.max(0, i - 2); j < Math.min(messages.length, i + 2); j++) {
          for (const nc of messages[j].contents) {
            if (nc.type === "tool_use" && nc.name === "Bash") {
              const cmd = (nc.input || {}).command || "";
              if (isValuableBash(cmd)) {
                relatedCmd = cmd.trim().substring(0, 100);
                break;
              }
            }
          }
          if (relatedCmd) break;
        }

        items.push({
          type: "Learning",
          title: inferLearningTitle(sentence),
          insight: snippet(sentence, 300),
          relatedCommand: relatedCmd,
        });

        if (items.length >= 5) return items;
      }
    }
  }
  return items;
}

function inferLearningTitle(text) {
  const subjectMatch = text.match(/^([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9_$][\w\s\-\.]{0,40}?)\s+(?:vì|because|do|phải|must|cần|need)/i);
  if (subjectMatch) return `Note: ${subjectMatch[1].trim()}`.substring(0, 60);

  const noteMatch = text.match(/\b(?:lưu ý|note:|important:|chú ý)[:：]?\s*(.{10,60})/i);
  if (noteMatch) return noteMatch[1].trim();

  return text.substring(0, 55) + (text.length > 55 ? "..." : "");
}

/** F. Config Files */
function extractConfigs(toolPairs) {
  const items = [];

  for (const [, pair] of Object.entries(toolPairs)) {
    if (pair.name !== "Bash") continue;
    const cmd = pair.input.command || pair.input.cmd || "";

    if (!CONFIG_PATTERNS.some(p => p.test(cmd))) continue;
    if (pair.isError === true) continue;
    if (pair.result && looksLikeError(pair.result)) continue;
    if (pair.result === null) continue;

    const isRead = /^(cat|less|more|head|tail|type)\s/i.test(cmd.trim());
    if (isRead) continue;

    const hasContent = cmd.includes("\n") && cmd.length > 100;
    const isWrite = /(tee|>|>>|cat <<|heredoc|write|echo.*>|printf.*>)/i.test(cmd);
    if (!hasContent && !isWrite) continue;

    const title = inferConfigTitle(cmd);

    let configContent = "";
    const heredocMatch = cmd.match(/<<\s*['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1/);
    if (heredocMatch) configContent = heredocMatch[2].trim();

    items.push({
      type: "Config",
      title,
      command: cmd.substring(0, 150).trim(),
      config: snippet(configContent || pair.result || "", 400),
    });

    if (items.length >= 3) return items;
  }
  return items;
}

function inferConfigTitle(cmd) {
  if (/nginx/i.test(cmd)) return "Nginx config";
  if (/docker-compose|compose/i.test(cmd)) return "Docker Compose config";
  if (/\.env/i.test(cmd)) return "Environment variables (.env)";
  if (/\.service/i.test(cmd)) return "Systemd service file";
  if (/ssh/i.test(cmd)) return "SSH config";
  if (/pm2/i.test(cmd)) return "PM2 process config";
  const fileMatch = cmd.match(/([\/\\][\w\/\\.\-]+\.(?:conf|config|yaml|yml|toml|ini))/i);
  if (fileMatch) return `Config: ${path.basename(fileMatch[1])}`;
  return "Config file";
}

/** G. MCP Tool Calls — Longbrain tools đã được gọi */
function extractMcpCalls(messages) {
  const calls = [];

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    for (const c of msg.contents) {
      if (c.type !== "tool_use" || !c.name) continue;
      if (!IMPORTANT_MCP_TOOLS.has(c.name)) continue;

      const input = c.input || {};
      const label = input.title || input.name || input.query || JSON.stringify(input).substring(0, 80);
      calls.push({
        tool: c.name.replace("mcp__longbrain__", ""),
        label: snippet(label, 120),
      });
    }
  }

  // Dedup
  const seen = new Set();
  return calls.filter(c => {
    const key = `${c.tool}::${c.label.substring(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

/** H. File Changes — Write/Edit/NotebookEdit tool calls */
function extractFileChanges(messages) {
  const changes = [];

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    for (const c of msg.contents) {
      if (c.type !== "tool_use" || !c.name) continue;
      if (!FILE_TOOLS.has(c.name)) continue;

      const filePath = (c.input || {}).file_path || (c.input || {}).path || "";
      if (!filePath) continue;
      if (/\.(log|tmp|cache)$/i.test(filePath)) continue;

      changes.push({ tool: c.name, filePath: snippet(filePath, 120) });
    }
  }

  // Dedup theo filePath
  const seen = new Set();
  return changes.filter(c => {
    if (seen.has(c.filePath)) return false;
    seen.add(c.filePath);
    return true;
  }).slice(0, 10);
}

// ─── Dedup ────────────────────────────────────────────────────────────────────

function deduplicateItems(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.type}::${item.title.toLowerCase().substring(0, 60)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Output Builder ───────────────────────────────────────────────────────────

function formatItem(item) {
  const lines = [`## [${item.type}] ${item.title}`, ""];

  switch (item.type) {
    case "BashSuccess":
      if (item.command) lines.push(`**Command:** \`${item.command}\``);
      if (item.result)  lines.push(`**Result:** ${item.result}`);
      break;

    case "BugFix":
      if (item.problem)    lines.push(`**Problem:** ${item.problem}`);
      if (item.fixCommand) lines.push(`**Fix command:** \`${item.fixCommand}\``);
      if (item.fix && item.fix !== item.fixCommand)
                           lines.push(`**Solution:** ${item.fix}`);
      break;

    case "Decision":
      if (item.decision) lines.push(`**Decision:** ${item.decision}`);
      if (item.context)  lines.push(`**Context:** ${item.context}`);
      break;

    case "Learning":
      if (item.insight)        lines.push(`**Insight:** ${item.insight}`);
      if (item.relatedCommand) lines.push(`**Context command:** \`${item.relatedCommand}\``);
      break;

    case "Config":
      if (item.command) lines.push(`**Command:** \`${item.command}\``);
      if (item.config)  lines.push("**Config:**", "```", item.config, "```");
      break;
  }

  lines.push("");
  return lines.join("\n");
}

function buildOutputFile({ allItems, userGoals, mcpCalls, fileChanges, sessionId, cwd }) {
  const projectName = path.basename(cwd || "unknown");
  const ts = today();
  const sessionShort = (sessionId || "").substring(0, 8);

  let md = `---\ntags: [auto-learning, longbrain]\ndate: ${ts}\nsession: ${sessionShort}\ncwd: ${cwd || ""}\n---\n\n`;
  md += `# Auto-Learnings — ${projectName} — ${ts}\n\n`;
  md += `> Session: \`${sessionShort}\` | Generated: ${nowTs()} | Items: ${allItems.length}\n\n`;
  md += "---\n\n";

  // User goals section
  if (userGoals.length > 0) {
    md += `## Mục tiêu session\n`;
    for (const g of userGoals) md += `- ${g}\n`;
    md += "\n";
  }

  // File changes summary
  if (fileChanges.length > 0) {
    md += `## Files đã thay đổi\n`;
    for (const c of fileChanges) md += `- \`${c.tool}\` → \`${c.filePath}\`\n`;
    md += "\n";
  }

  // MCP tools used summary
  if (mcpCalls.length > 0) {
    md += `## Longbrain tools đã dùng\n`;
    for (const c of mcpCalls) md += `- \`${c.tool}\`: ${c.label}\n`;
    md += "\n";
  }

  if (allItems.length > 0) {
    md += "---\n\n";
    md += allItems.map(formatItem).join("\n---\n\n");
  }

  md += `\n---\n> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]\n`;
  return md;
}

function getOutputFilePath(sessionId, cwd) {
  const projectName = path.basename(cwd || "session")
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9_\-]/g, "-")
    .substring(0, 40);
  const ts = today();
  const sessionShort = (sessionId || "unknown").substring(0, 8);
  return path.join(LEARNINGS_DIR, `${ts}-${projectName}-${sessionShort}.md`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let input = "";
  process.stdin.setEncoding("utf-8");
  for await (const chunk of process.stdin) input += chunk;

  let hookData;
  try { hookData = JSON.parse(input); } catch { process.exit(0); }

  const transcriptPath = hookData.transcript_path || hookData.transcriptPath;
  const sessionId      = hookData.session_id      || hookData.sessionId || "";
  const cwd            = hookData.cwd             || "";

  if (!transcriptPath) process.exit(0);

  // 1. Parse transcript
  const events   = parseTranscript(transcriptPath);
  const messages = extractMessages(events);

  if (!isSessionWorthProcessing(events, messages)) process.exit(0);

  // 2. Build tool pair map
  const toolPairs = buildToolPairMap(messages);

  // 3. Run all extractors
  const userGoals     = extractUserGoal(messages);
  const bashItems     = extractBashSuccess(toolPairs);
  const bugItems      = extractBugFix(messages, toolPairs);
  const decisionItems = extractDecisions(messages);
  const learningItems = extractLearnings(messages, toolPairs);
  const configItems   = extractConfigs(toolPairs);
  const mcpCalls      = extractMcpCalls(messages);
  const fileChanges   = extractFileChanges(messages);

  // 4. Merge, dedup
  const allItems = deduplicateItems([
    ...bashItems,
    ...bugItems,
    ...decisionItems,
    ...learningItems,
    ...configItems,
  ]);

  // 5. Quality gate — phải có ít nhất một loại nội dung nào đó
  const hasContent = allItems.length >= 1 || mcpCalls.length > 0 || fileChanges.length > 2;
  if (!hasContent) process.exit(0);

  // 6. Ensure output dir
  try {
    if (!fs.existsSync(LEARNINGS_DIR)) {
      fs.mkdirSync(LEARNINGS_DIR, { recursive: true });
    }
  } catch { process.exit(0); }

  // 7. Write output
  const outputPath = getOutputFilePath(sessionId, cwd);
  const content    = buildOutputFile({ allItems, userGoals, mcpCalls, fileChanges, sessionId, cwd });

  try {
    fs.writeFileSync(outputPath, content, "utf-8");
  } catch { /* ignore */ }

  process.exit(0);
}

main().catch(() => process.exit(0));
