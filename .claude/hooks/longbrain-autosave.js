#!/usr/bin/env node
/**
 * Longbrain Auto-Save Hook (PostToolUse)
 * Tự động ghi lại các bước quan trọng vào progress.md sau mỗi Bash command thành công.
 * Không làm gián đoạn workflow — chỉ ghi file, không output gì.
 *
 * Input (stdin): JSON từ Claude Code
 * {
 *   hook_event_name: "PostToolUse",
 *   tool_name: "Bash",
 *   tool_input: { command: "..." },
 *   tool_response: "output...",
 *   cwd: "C:\\path\\to\\project",
 *   session_id: "..."
 * }
 */

"use strict";
const fs   = require("fs");
const path = require("path");

const VAULT_DIR  = path.join("C:", "AI Build Learning", "AI Knowledge Build");
const PROJ_DIR   = path.join(VAULT_DIR, "30-PROJECTS");
const SESSION_LOG = path.join(VAULT_DIR, "31-JOURNAL", "auto-session-log.md");

// Commands đáng ghi lại (có tác động thực sự đến hệ thống)
const SIGNIFICANT_PATTERNS = [
  // Package management
  /\b(apt|apt-get|yum|dnf|brew|pip|pip3|npm|yarn|pnpm|npx|uv)\s+(install|update|upgrade|add|remove)/i,
  // System services
  /\b(systemctl|service)\s+(start|stop|restart|enable|disable)/i,
  // Server / process management
  /\b(pm2|nginx|apache2|caddy)\s+(start|stop|restart|reload|save)/i,
  // Security / network
  /\b(ufw|iptables|firewall-cmd)\s+(allow|deny|enable|disable|add)/i,
  /\b(certbot|openssl)\b/i,
  // Git
  /\bgit\s+(clone|init|push|pull|commit|merge|checkout\s+-b)/i,
  // Docker
  /\b(docker|docker-compose|compose)\s+(build|up|down|run|push|pull)/i,
  // Database
  /\b(psql|mysql|redis-cli|mongo)\b.*(-c|--command|<)/i,
  /\b(createdb|dropdb|pg_restore|mysqldump)\b/i,
  // File operations có tác động
  /\b(chmod|chown|ln\s+-s|mv|cp)\s+.*\//i,
  /\b(mkdir|rmdir|rm\s+-rf)\b/i,
  // Config / deploy
  /\b(ssh-keygen|ssh-copy-id)\b/i,
  />(\/etc\/|~\/\.|\.env|\.conf|\.service|\.timer)/i,
  /\b(kubectl|helm|terraform|ansible)\b/i,
];

// Errors / failures — KHÔNG ghi (để tránh noise)
const ERROR_PATTERNS = [
  /command not found/i,
  /no such file/i,
  /permission denied/i,
  /error:/i,
  /exit code [1-9]/i,
  /failed/i,
];

function isSignificant(command) {
  return SIGNIFICANT_PATTERNS.some(p => p.test(command));
}

function looksLikeError(output) {
  if (!output || typeof output !== "string") return false;
  const first500 = output.substring(0, 500);
  return ERROR_PATTERNS.some(p => p.test(first500));
}

function now() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function getOutputSnippet(output) {
  if (!output || typeof output !== "string") return "";
  // Last meaningful line (usually the result)
  const lines = output.trim().split("\n").filter(l => l.trim());
  if (lines.length === 0) return "";
  const last = lines[lines.length - 1].trim();
  return last.length > 200 ? last.substring(0, 197) + "..." : last;
}

function findProjectProgressFile(cwd) {
  if (!cwd || !fs.existsSync(PROJ_DIR)) return null;
  const folderName = path.basename(cwd);

  // Tìm subfolder khớp tên
  const progressFile = path.join(PROJ_DIR, folderName, "progress.md");
  if (fs.existsSync(progressFile)) return progressFile;

  // Tìm gần đúng (case-insensitive)
  try {
    const entries = fs.readdirSync(PROJ_DIR, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.toLowerCase() === folderName.toLowerCase()) {
        const pf = path.join(PROJ_DIR, e.name, "progress.md");
        if (fs.existsSync(pf)) return pf;
      }
    }
  } catch { /* ignore */ }

  return null;
}

function appendToLog(filePath, entry) {
  try {
    const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
    fs.writeFileSync(filePath, existing + entry, "utf-8");
  } catch { /* ignore */ }
}

async function main() {
  let input = "";
  process.stdin.setEncoding("utf-8");
  for await (const chunk of process.stdin) input += chunk;

  let data;
  try { data = JSON.parse(input); } catch { process.exit(0); }

  // Chỉ xử lý Bash tool
  if (data.tool_name !== "Bash") process.exit(0);

  const command = data.tool_input?.command || data.tool_input?.cmd || "";
  const output  = typeof data.tool_response === "string"
    ? data.tool_response
    : JSON.stringify(data.tool_response || "");
  const cwd     = data.cwd || "";

  // Skip nếu không quan trọng
  if (!isSignificant(command)) process.exit(0);

  // Skip nếu command bị lỗi (không lưu thất bại vào progress)
  if (looksLikeError(output)) process.exit(0);

  const snippet = getOutputSnippet(output);
  const shortCmd = command.length > 200 ? command.substring(0, 197) + "..." : command;
  const entry = `\n### [AUTO] ${now()}\n\`\`\`bash\n${shortCmd}\n\`\`\`\n${snippet ? `> ${snippet}\n` : ""}\n`;

  // Ưu tiên ghi vào project progress.md
  const progressFile = findProjectProgressFile(cwd);
  if (progressFile) {
    appendToLog(progressFile, entry);
    process.exit(0);
  }

  // Fallback: ghi vào session log chung
  const journalDir = path.join(VAULT_DIR, "31-JOURNAL");
  if (!fs.existsSync(journalDir)) {
    try { fs.mkdirSync(journalDir, { recursive: true }); } catch { process.exit(0); }
  }

  // Tạo header ngày nếu file mới hoặc ngày mới
  const existingLog = fs.existsSync(SESSION_LOG) ? fs.readFileSync(SESSION_LOG, "utf-8") : "";
  const todayHeader = `## ${today()}`;
  const header = existingLog.includes(todayHeader)
    ? ""
    : `${todayHeader} — ${path.basename(cwd) || "session"}\n`;

  appendToLog(SESSION_LOG, header + entry);
}

main().catch(() => process.exit(0));
