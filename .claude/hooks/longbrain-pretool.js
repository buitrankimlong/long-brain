#!/usr/bin/env node
/**
 * Longbrain PreToolUse Hook — Proactive Warning System
 * ======================================================
 * Chạy TRƯỚC mỗi Bash/Write tool call.
 * Phát hiện các lệnh nguy hiểm và cảnh báo Claude trước khi thực thi.
 *
 * Input (stdin): JSON từ Claude Code
 * {
 *   hook_event_name: "PreToolUse",
 *   tool_name: "Bash" | "Write" | ...,
 *   tool_input: { command: "...", file_path: "..." },
 *   cwd: "...",
 *   session_id: "..."
 * }
 *
 * Output (stdout): Warning text → Claude thấy trước khi chạy tool
 * Exit 0: proceed normally
 * Exit 2: block tool (chỉ dùng cho destructive operations rất nguy hiểm)
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const VAULT_DIR        = path.join("C:", "AI Build Learning", "AI Knowledge Build");
const NEVER_AGAIN_INDEX = path.join(VAULT_DIR, "00-NEVER-AGAIN", "index.md");

// ─── Danger Patterns Library ──────────────────────────────────────────────────
// { pattern, level: "BLOCK"|"WARN", message, suggestion }

const BASH_DANGER_PATTERNS = [
  // ── CRITICAL: Block completely ──────────────────────────────────────────
  {
    pattern: /\brm\s+-rf\s+(\/|~\/?\s*$|\/home|\/etc|\/usr|\/var|\/boot|C:\\)/i,
    level: "BLOCK",
    message: "Lenh nay se xoa toan bo he thong!",
    suggestion: "Kiem tra lai duong dan. Chi xoa thu muc cu the, khong xoa root.",
  },
  {
    pattern: /\bDROP\s+DATABASE\b/i,
    level: "BLOCK",
    message: "Lenh nay se xoa toan bo database!",
    suggestion: "Backup truoc: pg_dump dbname > backup.sql",
  },
  {
    pattern: /\bgit\s+push\s+.*--force\s+.*\b(main|master)\b|\bgit\s+push\s+.*\b(main|master)\b.*--force/i,
    level: "BLOCK",
    message: "Force push len main/master se xoa lich su commit cua team!",
    suggestion: "Dung git push --force-with-lease thay the, hoac tao branch moi.",
  },

  // ── HIGH: Warn strongly ─────────────────────────────────────────────────
  {
    pattern: /\bgit\s+add\s+\.env\b|git\s+add\s+-A.*\.env|git\s+commit.*\.env/i,
    level: "WARN_HIGH",
    message: "NGUY HIEM: Dang commit file .env chua credentials!",
    suggestion: "Them .env vao .gitignore truoc. Dung: echo '.env' >> .gitignore",
  },
  {
    pattern: /\bDROP\s+TABLE\b/i,
    level: "WARN_HIGH",
    message: "Lenh DROP TABLE se xoa vinh vien du lieu!",
    suggestion: "Backup truoc: pg_dump -t table_name dbname > backup.sql",
  },
  {
    pattern: /\bTRUNCATE\s+TABLE\b/i,
    level: "WARN_HIGH",
    message: "TRUNCATE se xoa toan bo data trong bang!",
    suggestion: "Chac chan day la y dinh? Xem xet dung DELETE voi WHERE clause.",
  },
  {
    pattern: /\bgit\s+reset\s+--hard\b/i,
    level: "WARN_HIGH",
    message: "git reset --hard se xoa moi thay doi chua commit!",
    suggestion: "Luu work-in-progress truoc: git stash save 'WIP before reset'",
  },
  {
    pattern: /\brm\s+-rf\s+node_modules.*&&.*rm.*package-lock/i,
    level: "WARN",
    message: "Xoa node_modules va package-lock se can reinstall toan bo dependencies.",
    suggestion: "Chac chan muon clean install? Lenh se mat vai phut.",
  },

  // ── MEDIUM: Warn ────────────────────────────────────────────────────────
  {
    pattern: /\bkill\s+-9\b|\bkillall\b/i,
    level: "WARN",
    message: "kill -9 / killall tat process ma khong cho cleanup.",
    suggestion: "Thu SIGTERM truoc: kill -15 <pid> hoac pm2 stop <name>",
  },
  {
    pattern: /\bchmod\s+777\b/i,
    level: "WARN",
    message: "chmod 777 cho phep moi nguoi doc/ghi/execute — khong an toan!",
    suggestion: "Dung quyen toi thieu: 755 cho thu muc, 644 cho file.",
  },
  {
    pattern: /ngrok.*start|ngrok.*http/i,
    level: "WARN",
    message: "Ngrok free tier bi chan boi Lark/Zalo cho production webhook!",
    suggestion: "Dung server co IP public hoac domain that. Xem bai hoc ve webhook.",
  },
  {
    pattern: /\bcurl\b.*(-o|--output)\s+.*\|\s*bash|\bwget\b.*-q.*\|\s*bash/i,
    level: "WARN",
    message: "Chay script tu internet truc tiep co the nguy hiem!",
    suggestion: "Download truoc, kiem tra noi dung, sau do moi chay.",
  },
  {
    pattern: /\bapt[-\s]+remove\s+--purge|\bdpkg\s+--purge/i,
    level: "WARN",
    message: "Purge package se xoa ca config files!",
    suggestion: "Dung apt remove (khong purge) neu muon giu config de cai lai sau.",
  },
  {
    pattern: /\bsystemctl\s+disable\s+(nginx|ssh|sshd|ufw|firewalld)\b/i,
    level: "WARN",
    message: "Disable service quan trong co the mat ket noi server!",
    suggestion: "Chac chan day la y dinh? Backup SSH session truoc.",
  },
  {
    pattern: />\s*\/etc\/|tee\s+\/etc\//i,
    level: "WARN",
    message: "Ghi vao /etc/ se anh huong den cau hinh he thong.",
    suggestion: "Backup truoc: cp /etc/file /etc/file.bak",
  },
];

const WRITE_DANGER_PATTERNS = [
  {
    pattern: /\.(env|env\.local|env\.production|env\.staging)$/i,
    check: (filePath) => !filePath.includes(".example") && !filePath.includes(".template"),
    level: "WARN",
    message: "Ghi vao file .env — dam bao da them vao .gitignore!",
    suggestion: "Kiem tra: cat .gitignore | grep .env",
  },
  {
    pattern: /\/etc\/(nginx|apache|ssh|sudoers|cron)/i,
    level: "WARN",
    message: "Chinh sua config he thong quan trong!",
    suggestion: "Backup truoc khi ghi de.",
  },
];

// ─── Never Again pattern loader ────────────────────────────────────────────────
function loadNeverAgainPatterns() {
  try {
    const content = fs.readFileSync(NEVER_AGAIN_INDEX, "utf-8");
    const blocks = content.split(/\n(?=## \[NA-)/).filter(b => b.includes("[NA-"));
    const patterns = [];

    for (const block of blocks) {
      const titleMatch = block.match(/^## (\[NA-\d+\] .+)$/m);
      const mistakeMatch = block.match(/\*\*Sai lam\*\*: (.+)/);
      const preventMatch = block.match(/\*\*Phong tranh\*\*: (.+)/);
      if (!titleMatch || !mistakeMatch) continue;

      // Extract technical terms from mistake description for matching
      const mistakeText = mistakeMatch[1];
      const techTerms = mistakeText.match(/\b(git|npm|docker|nginx|ssh|rm|chmod|kill|curl|wget|sudo|apt|pip|python|node)\b/gi);
      if (!techTerms || techTerms.length === 0) continue;

      patterns.push({
        id: titleMatch[1],
        mistakeKeywords: techTerms.map(t => t.toLowerCase()),
        prevention: preventMatch ? preventMatch[1] : "",
        title: titleMatch[1],
      });
    }
    return patterns;
  } catch {
    return [];
  }
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

function analyzeCommand(command) {
  const warnings = [];
  let shouldBlock = false;

  for (const danger of BASH_DANGER_PATTERNS) {
    if (!danger.pattern.test(command)) continue;

    if (danger.level === "BLOCK") {
      shouldBlock = true;
      warnings.push({ level: "BLOCK", message: danger.message, suggestion: danger.suggestion });
    } else {
      warnings.push({ level: danger.level, message: danger.message, suggestion: danger.suggestion });
    }
  }

  // Check Never Again patterns
  const neverAgainPatterns = loadNeverAgainPatterns();
  const cmdLower = command.toLowerCase();
  for (const na of neverAgainPatterns) {
    const matches = na.mistakeKeywords.filter(kw => cmdLower.includes(kw));
    if (matches.length >= 2) {
      warnings.push({
        level: "WARN",
        message: `Lien quan den: ${na.title}`,
        suggestion: na.prevention || "Xem chi tiet trong 00-NEVER-AGAIN/",
      });
    }
  }

  return { warnings, shouldBlock };
}

function analyzeFilePath(filePath) {
  const warnings = [];

  for (const danger of WRITE_DANGER_PATTERNS) {
    if (!danger.pattern.test(filePath)) continue;
    if (danger.check && !danger.check(filePath)) continue;
    warnings.push({ level: danger.level, message: danger.message, suggestion: danger.suggestion });
  }

  return { warnings, shouldBlock: false };
}

function formatWarnings(warnings, toolName, target) {
  if (warnings.length === 0) return "";

  const hasBlock = warnings.some(w => w.level === "BLOCK");
  const hasHigh  = warnings.some(w => w.level === "WARN_HIGH");

  let header = hasBlock
    ? `[LONGBRAIN] CANH BAO NGHIEM TRONG — ${toolName}: ${target.substring(0, 60)}\n`
    : hasHigh
      ? `[LONGBRAIN] CANH BAO CAO — ${toolName}: ${target.substring(0, 60)}\n`
      : `[LONGBRAIN] Luuy truoc khi chay — ${toolName}\n`;

  let body = "";
  for (const w of warnings) {
    const icon = w.level === "BLOCK" ? "!! BLOCK !!" : w.level === "WARN_HIGH" ? "! CAO" : "~ Luu y";
    body += `\n[${icon}] ${w.message}\n`;
    if (w.suggestion) body += `  → ${w.suggestion}\n`;
  }

  return header + body + "\n";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let input = "";
  process.stdin.setEncoding("utf-8");
  for await (const chunk of process.stdin) input += chunk;

  let data;
  try { data = JSON.parse(input); } catch { process.exit(0); }

  const toolName = data.tool_name || "";

  // Only process Bash and Write tools
  if (toolName === "Bash") {
    const command = data.tool_input?.command || data.tool_input?.cmd || "";
    if (!command) process.exit(0);

    const { warnings, shouldBlock } = analyzeCommand(command);
    if (warnings.length === 0) process.exit(0);

    const output = formatWarnings(warnings, "Bash", command);
    process.stdout.write(output, () => process.exit(shouldBlock ? 2 : 0));
    return;
  }

  if (toolName === "Write") {
    const filePath = data.tool_input?.file_path || "";
    if (!filePath) process.exit(0);

    const { warnings } = analyzeFilePath(filePath);
    if (warnings.length === 0) process.exit(0);

    const output = formatWarnings(warnings, "Write", filePath);
    process.stdout.write(output, () => process.exit(0));
    return;
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
