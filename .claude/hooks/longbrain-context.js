#!/usr/bin/env node
/**
 * Longbrain Auto-Context Hook
 * UserPromptSubmit hook - tự động search vault trước mỗi message
 *
 * Input (stdin): JSON từ Claude Code { prompt, cwd, session_id, ... }
 * Output (stdout): Context text → Claude nhận qua <user-prompt-submit-hook>
 */

"use strict";
const fs = require("fs");
const path = require("path");

// --- Config ---
const VAULT_DIR = path.join("C:", "AI Build Learning", "AI Knowledge Build");
const NEVER_AGAIN_INDEX = path.join(VAULT_DIR, "00-NEVER-AGAIN", "index.md");

const KNOWLEDGE_CATS = [
  "01-AI-FOUNDATIONS", "02-AGENT-FRAMEWORKS", "03-LLM-MODELS",
  "04-PROTOCOLS", "05-PLATFORMS", "06-KNOWLEDGE-MEMORY",
  "07-MARKETING", "08-SALES", "09-CONTENT-PRODUCTION", "10-EMAIL-MARKETING",
  "11-SYSTEM-DESIGN", "12-DEPLOYMENT", "13-PACKAGING", "14-CLAUDE-CODE",
  "15-OBSIDIAN-BRAIN", "16-VIETNAM-MARKET", "17-AI-MODELS-CATALOG",
  "18-TOOLS-CATALOG", "19-BUSINESS-AGENCY", "20-TRENDS-RESOURCES",
];

// Stop words (Vietnamese + English)
const STOP = new Set([
  // English
  "the","a","an","is","it","to","do","how","what","where","when","why",
  "can","could","should","would","will","for","with","this","that","from",
  "into","about","and","or","but","in","on","at","by","of","up","as","be",
  "my","me","i","we","you","he","she","they","are","was","were","has","have",
  "had","not","get","use","all","new","add","fix","run","let","now","one",
  "make","help","need","want","try","see","also","just","more","then","than",
  "its","our","their","there","here","does","did","very","too","only","any",
  "so","no","yes","ok","hi","hey","please","thanks","hello",
  // Vietnamese common
  "tôi","bạn","của","và","là","có","cho","với","trong","một","các","này",
  "đó","như","làm","hãy","được","không","hay","thì","vào","ra","lại","đã",
  "sẽ","đây","khi","nếu","thế","nào","gì","xem","tất","cả","để","về","bị",
  "theo","từ","trên","dưới","sau","trước","nên","vì","đến","cần","muốn",
  "mình","họ","ta","chúng","còn","rồi","nhưng","mà","hoặc","cũng","vẫn",
  "giúp","hỏi","nói","thêm","xóa","tìm","tạo","update","build","check",
]);

// --- Helpers ---
function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP.has(w))
    .slice(0, 10);
}

function readSafe(filePath) {
  try { return fs.readFileSync(filePath, "utf-8"); } catch { return null; }
}

function getSnippet(content, keywords) {
  const lines = content.split("\n");
  for (const line of lines) {
    const l = line.trim();
    if (l.length < 10 || l.startsWith("---") || l.startsWith("tags:") || l.startsWith("#")) continue;
    if (keywords.some(kw => l.toLowerCase().includes(kw))) {
      return l.length > 160 ? l.substring(0, 157) + "..." : l;
    }
  }
  // Fallback: first non-header line with content
  for (const line of lines) {
    const l = line.trim();
    if (l.length > 20 && !l.startsWith("---") && !l.startsWith("#") && !l.startsWith("tags:")) {
      return l.length > 160 ? l.substring(0, 157) + "..." : l;
    }
  }
  return "";
}

function searchDir(dirPath, keywords, categoryLabel) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;

  let files;
  try { files = fs.readdirSync(dirPath); } catch { return results; }

  for (const file of files) {
    // Skip MOC files (e.g. "01 Nen Tang AI.md") and non-md files
    if (!file.endsWith(".md") && !file.endsWith(".txt")) continue;
    if (/^\d{2}\s/.test(file)) continue; // skip MOC files like "01 Nen Tang AI.md"

    const content = readSafe(path.join(dirPath, file));
    if (!content) continue;

    const lower = content.toLowerCase();
    const nameLower = file.toLowerCase();
    let score = 0;
    const matched = new Set();

    for (const kw of keywords) {
      if (nameLower.includes(kw)) { score += 12; matched.add(kw); }
      const count = (lower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
      if (count > 0) { score += Math.min(count * 2, 8); matched.add(kw); }
    }

    // Must match at least 1 keyword meaningfully, or 2+ keywords
    if (matched.size === 0) continue;
    if (matched.size === 1 && score < 12) continue;

    results.push({
      file: file.replace(/(-Knowledge)?\.md$/, "").replace(/-/g, " "),
      filename: file,
      score,
      snippet: getSnippet(content, keywords),
      category: categoryLabel,
    });
  }

  return results;
}

function searchVault(keywords, maxResults = 5) {
  const all = [];

  // Search knowledge categories
  for (const cat of KNOWLEDGE_CATS) {
    const catResults = searchDir(path.join(VAULT_DIR, cat), keywords, "knowledge");
    all.push(...catResults);
  }

  // Search projects
  all.push(...searchDir(path.join(VAULT_DIR, "30-PROJECTS"), keywords, "project"));

  // Search learnings
  all.push(...searchDir(path.join(VAULT_DIR, "32-LEARNINGS"), keywords, "learning"));

  return all.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

// Detect "new project" intent — match both Unicode and ASCII-folded variants
function isNewProjectIntent(prompt) {
  const p = prompt.toLowerCase();
  // Normalize: remove diacritics for ASCII comparison
  const ascii = p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const patterns = [
    // Vietnamese (normalized)
    /bat\s*dau\s*du\s*an/,
    /khoi\s*tao\s*(project|du\s*an)/,
    /tao\s*(moi\s*)?(project|du\s*an)/,
    // English
    /start\s*new\s*project/,
    /init\s*(project|new)/,
    /new\s*project/,
    /create\s*(new\s*)?project/,
  ];
  return patterns.some(r => r.test(ascii));
}

// --- Never Again Loader ---
function loadNeverAgainWarnings() {
  try {
    const content = fs.readFileSync(NEVER_AGAIN_INDEX, "utf-8");
    // Count actual items (lines starting with ## [NA-)
    const items = content.match(/^## \[NA-\d+\].+$/mg);
    if (!items || items.length === 0) return "";

    // Extract compact warning block (title + prevention only for brevity)
    const blocks = content.split(/\n(?=## \[NA-)/).filter(b => b.includes("[NA-"));
    if (blocks.length === 0) return "";

    let out = `[LONGBRAIN-WARNING] CANH BAO: ${items.length} LOI KHONG BAO GIO LAP LAI:\n`;
    for (const block of blocks) {
      const titleMatch = block.match(/^## (\[NA-\d+\] .+)$/m);
      const preventMatch = block.match(/\*\*Phong tranh\*\*: (.+)/);
      if (!titleMatch) continue;
      out += `\n! ${titleMatch[1]}`;
      if (preventMatch) out += `\n  → ${preventMatch[1]}`;
    }
    out += "\n";
    return out;
  } catch {
    return "";
  }
}

// --- Main ---
async function main() {
  let input = "";
  process.stdin.setEncoding("utf-8");
  for await (const chunk of process.stdin) input += chunk;

  let prompt = "", cwd = "";
  try {
    const data = JSON.parse(input);
    prompt = data.prompt || data.message || "";
    cwd = data.cwd || "";
  } catch {
    process.exit(0);
  }

  // Skip trivial prompts
  if (prompt.trim().length < 10) process.exit(0);

  // --- Always prepend Never Again warnings ---
  const neverAgainBlock = loadNeverAgainWarnings();

  // --- Detect "new project" intent → inject folder name ---
  if (isNewProjectIntent(prompt) && cwd) {
    const folderName = path.basename(cwd);
    let out = neverAgainBlock;
    out += `[LONGBRAIN] PHAT HIEN Y DINH TAO DU AN MOI\n`;
    out += `TEN_FOLDER_HIEN_TAI: "${folderName}"\n`;
    out += `DUONG_DAN: ${cwd}\n\n`;
    out += `→ Dung folderName nay lam ten du an, KHONG hoi user.\n`;
    out += `→ Goi ngay: init_project("${folderName}", mo_ta, stack, client)\n`;
    out += `→ Sau do: get_context_for_task(mo_ta) de tim kien thuc lien quan.`;
    process.stdout.write(out);
    return;
  }

  const keywords = extractKeywords(prompt);

  // If no useful keywords but have warnings, still inject them
  if (keywords.length < 1) {
    if (neverAgainBlock) {
      process.stdout.write(neverAgainBlock, () => process.exit(0));
    } else {
      process.exit(0);
    }
    return;
  }

  const results = searchVault(keywords);

  // Build output
  let out = neverAgainBlock;

  if (results.length > 0) {
    const kwDisplay = keywords.slice(0, 5).join(", ");
    out += `[LONGBRAIN] Tim thay kien thuc lien quan (tu khoa: "${kwDisplay}"):\n`;

    for (const r of results) {
      const icon = r.category === "learning" ? "L" : r.category === "project" ? "P" : "K";
      out += `\n[${icon}] ${r.file}`;
      if (r.snippet) out += `\n    ${r.snippet}`;
    }

    out += `\n\nDung search_knowledge() hoac get_knowledge_file() de doc chi tiet.`;
    out += `\nSau khi hoan thanh task → dung add_learning() de luu bai hoc.`;
  }

  if (out.trim()) {
    process.stdout.write(out, () => process.exit(0));
  } else {
    process.exit(0);
  }
}

main().catch(() => process.exit(0));
