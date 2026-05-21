/**
 * Longbrain MCP Server v7.0
 * 23 tools for Second Brain knowledge management
 * Transport: stdio (Claude Code auto-connect via .mcp.json)
 * New in v7:
 *   - Hybrid search: FTS5 (BM25) + sqlite-vec (cosine) + RRF fusion
 *   - Auto-indexing: SHA-256 change detection, incremental embedding
 *   - New tools: reindex_vault, search_semantic
 *   - All search tools upgraded to hybrid search
 *   - All write tools auto-index after file creation
 * v6: source_code field, github_url field
 * v5: never_again, decisions, mine_patterns, pre-flight checklist
 */

"use strict";
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const fs = require("fs");
const path = require("path");
const { LongbrainDB } = require("./db");
const { reindexVault, indexSingleFile } = require("./indexer");
const { hybridSearch, quickSearch } = require("./hybrid-search");

// --- Config ---
const VAULT_ROOT = path.resolve(process.env.AI_KNOWLEDGE_VAULT || ".");
const VAULT_DIR = path.join(VAULT_ROOT, "AI Knowledge Build");
const RESEARCH_DIR = path.join(VAULT_ROOT, "research");
const DB_PATH = path.join(VAULT_ROOT, "mcp-server", "longbrain.db");

// --- Hybrid Search DB (initialized after server setup) ---
let db = null;
let dbReady = false;

function initDB() {
  try {
    db = new LongbrainDB(DB_PATH);
    dbReady = true;
    process.stderr.write("[Longbrain v7.0] DB initialized\n");
  } catch (e) {
    process.stderr.write(`[Longbrain v7.0] DB init error: ${e.message}\n`);
  }
}

const CATEGORIES = {
  "01": { folder: "01-AI-FOUNDATIONS",     moc: "01 Nen Tang AI",         desc: "Khoa hoc, khai niem AI co ban" },
  "02": { folder: "02-AGENT-FRAMEWORKS",   moc: "02 Agent Frameworks",    desc: "LangChain, CrewAI, LangGraph, OpenAI, Google ADK" },
  "03": { folder: "03-LLM-MODELS",         moc: "03 Mo Hinh LLM",         desc: "Models commercial + open source" },
  "04": { folder: "04-PROTOCOLS",          moc: "04 Giao Thuc MCP A2A",   desc: "MCP, A2A, function calling" },
  "05": { folder: "05-PLATFORMS",          moc: "05 Nen Tang Chatbot",    desc: "Chatbot platforms, AI builders" },
  "06": { folder: "06-KNOWLEDGE-MEMORY",   moc: "06 RAG va Bo Nho AI",    desc: "RAG, GraphRAG, vector DB, research" },
  "07": { folder: "07-MARKETING",          moc: "07 Marketing Tu Dong",   desc: "Tu dong marketing, social, content" },
  "08": { folder: "08-SALES",              moc: "08 Ban Hang Tu Dong",    desc: "Chatbot ban hang, CRM, lead gen" },
  "09": { folder: "09-CONTENT-PRODUCTION", moc: "09 San Xuat Noi Dung",   desc: "Video, blog, social media workflows" },
  "10": { folder: "10-EMAIL-MARKETING",    moc: "10 Email Marketing",     desc: "Platforms, design, automation" },
  "11": { folder: "11-SYSTEM-DESIGN",      moc: "11 Thiet Ke He Thong",   desc: "Architecture, patterns, scaling" },
  "12": { folder: "12-DEPLOYMENT",         moc: "12 Trien Khai",          desc: "Docker, K8s, cloud, CI/CD" },
  "13": { folder: "13-PACKAGING",          moc: "13 Dong Goi San Pham",   desc: "White-label, SaaS, multi-tenant" },
  "14": { folder: "14-CLAUDE-CODE",        moc: "14 Claude Code",         desc: "Multi-agent, hooks, optimization" },
  "15": { folder: "15-OBSIDIAN-BRAIN",     moc: "15 Bo Nao Obsidian",     desc: "Second brain, memory systems" },
  "16": { folder: "16-VIETNAM-MARKET",     moc: "16 Thi Truong Viet Nam", desc: "Zalo, PhoBERT, MoMo/VNPay" },
  "17": { folder: "17-AI-MODELS-CATALOG",  moc: "17 Catalog Mo Hinh AI",  desc: "Image, video, audio, LLM pricing" },
  "18": { folder: "18-TOOLS-CATALOG",      moc: "18 Catalog Cong Cu",     desc: "Scraping, monitoring, CRM, email" },
  "19": { folder: "19-BUSINESS-AGENCY",    moc: "19 Kinh Doanh Agency",   desc: "Client acquisition, contracts, SOPs" },
  "20": { folder: "20-TRENDS-RESOURCES",   moc: "20 Xu Huong va Tai Nguyen", desc: "Xu huong 2026-2027, communities" },
};

const LIFE_SECTIONS = {
  "30": { folder: "30-PROJECTS",       moc: "30 Du An",            desc: "Du an da lam, dang lam" },
  "31": { folder: "31-JOURNAL",        moc: "31 Nhat Ky",          desc: "Nhat ky lam viec" },
  "32": { folder: "32-LEARNINGS",      moc: "32 Bai Hoc Duc Ket",  desc: "Kinh nghiem thuc te" },
  "33": { folder: "33-PEOPLE-CONTACTS",moc: "33 Quan He",          desc: "Contacts, clients" },
  "34": { folder: "34-IDEAS",          moc: "34 Y Tuong",          desc: "Y tuong san pham, kinh doanh" },
};

// --- Helpers ---
function readFileSafe(filePath) {
  try { return fs.readFileSync(filePath, "utf-8"); } catch { return null; }
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function getAllKnowledgeFiles() {
  const files = [];
  for (const [id, cat] of Object.entries(CATEGORIES)) {
    const catDir = path.join(VAULT_DIR, cat.folder);
    if (!fs.existsSync(catDir)) continue;
    for (const f of fs.readdirSync(catDir)) {
      if (f.endsWith("-Knowledge.md")) {
        files.push({
          category_id: id,
          category: cat.moc,
          filename: f,
          name: f.replace("-Knowledge.md", "").replace(/-/g, " "),
          path: path.join(catDir, f),
        });
      }
    }
  }
  return files;
}

function getAllResearchFiles() {
  if (!fs.existsSync(RESEARCH_DIR)) return [];
  return fs.readdirSync(RESEARCH_DIR)
    .filter(f => f.endsWith(".md") || f.endsWith(".txt"))
    .map(f => ({
      filename: f,
      name: f.replace(/\.(md|txt)$/, "").replace(/[-_]/g, " "),
      path: path.join(RESEARCH_DIR, f),
      category: "research",
    }));
}

function getAllProjectFiles() {
  const projDir = path.join(VAULT_DIR, "30-PROJECTS");
  if (!fs.existsSync(projDir)) return [];
  return fs.readdirSync(projDir)
    .filter(f => f.endsWith(".md") && f !== "30 Du An.md")
    .map(f => ({
      filename: f,
      name: f.replace(".md", ""),
      path: path.join(projDir, f),
      category: "project",
    }));
}

function getAllLearningFiles() {
  const dir = path.join(VAULT_DIR, "32-LEARNINGS");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".md") && f !== "32 Bai Hoc Duc Ket.md")
    .map(f => ({
      filename: f,
      name: f.replace(".md", ""),
      path: path.join(dir, f),
      category: "learning",
    }));
}

function getAllDecisionFiles() {
  const dir = path.join(VAULT_DIR, "35-DECISIONS");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".md") && f !== "index.md")
    .map(f => ({
      filename: f,
      name: f.replace(".md", ""),
      path: path.join(dir, f),
      category: "decision",
    }));
}

function searchInFiles(files, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
  const results = [];

  for (const file of files) {
    const content = readFileSafe(file.path);
    if (!content) continue;
    const lower = content.toLowerCase();
    const nameMatch = terms.some(t => file.name.toLowerCase().includes(t));
    const contentMatch = terms.filter(t => lower.includes(t)).length;

    if (!nameMatch && contentMatch === 0) continue;

    const lines = content.split("\n");
    const snippets = [];
    for (let i = 0; i < lines.length && snippets.length < 5; i++) {
      const lineLower = lines[i].toLowerCase();
      if (terms.some(t => lineLower.includes(t))) {
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length, i + 2);
        snippets.push(lines.slice(start, end).join("\n"));
      }
    }

    results.push({
      file: file.filename,
      name: file.name,
      category: file.category || "research",
      score: (nameMatch ? 10 : 0) + contentMatch,
      snippets,
      path: file.path,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

/**
 * Auto-generate pre-flight checklist cho du an moi.
 * Nguon: Never Again items + Learnings + Stack-specific best practices.
 */
function buildPreflightChecklist({ name, description, stack }) {
  const stackStr = (stack || []).join(" ").toLowerCase();
  const descLower = (description || "").toLowerCase();
  let items = "";

  // --- Never Again warnings ---
  const neverAgainDir = path.join(VAULT_DIR, "00-NEVER-AGAIN");
  const neverAgainIndex = path.join(neverAgainDir, "index.md");
  if (fs.existsSync(neverAgainIndex)) {
    const indexContent = readFileSafe(neverAgainIndex) || "";
    const blocks = indexContent.split(/\n(?=## \[NA-)/).filter(b => b.includes("[NA-"));
    if (blocks.length > 0) {
      items += `## Canh bao KHONG BAO GIO LAP LAI\n`;
      for (const block of blocks) {
        const titleMatch = block.match(/^## (\[NA-\d+\] .+)$/m);
        const preventMatch = block.match(/\*\*Phong tranh\*\*: (.+)/);
        if (!titleMatch) continue;
        const prevention = preventMatch ? preventMatch[1] : "Xem chi tiet trong 00-NEVER-AGAIN/";
        items += `- [ ] ${titleMatch[1]}: ${prevention}\n`;
      }
      items += "\n";
    }
  }

  // --- Stack-specific checks ---
  items += `## Chuan bi ky thuat\n`;

  if (stackStr.includes("docker") || stackStr.includes("docker-compose")) {
    items += `- [ ] docker-compose.yml da setup port mapping dung\n`;
    items += `- [ ] .env file da tao va them vao .gitignore\n`;
  }
  if (stackStr.includes("postgres") || stackStr.includes("postgresql")) {
    items += `- [ ] DATABASE_URL da config dung format postgres://\n`;
    items += `- [ ] Migration scripts da san sang\n`;
  }
  if (stackStr.includes("nginx") || stackStr.includes("reverse proxy")) {
    items += `- [ ] Nginx config co proxy_pass dung port\n`;
    items += `- [ ] SSL certificate da setup (certbot hoac tu ky)\n`;
  }
  if (stackStr.includes("webhook") || descLower.includes("webhook")) {
    items += `- [ ] Webhook URL public va accessible (khong dung ngrok free cho production)\n`;
    items += `- [ ] Webhook verification (HMAC/token) da implement\n`;
  }
  if (stackStr.includes("zalo") || descLower.includes("zalo")) {
    items += `- [ ] Zalo OA da verify domain webhook\n`;
    items += `- [ ] Access token refresh strategy da co\n`;
  }
  if (stackStr.includes("telegram") || descLower.includes("telegram")) {
    items += `- [ ] Telegram bot token da tao va test\n`;
    items += `- [ ] Webhook URL da set qua setWebhook API\n`;
  }
  if (stackStr.includes("langchain") || stackStr.includes("langgraph")) {
    items += `- [ ] LangSmith tracing da setup (LANGCHAIN_TRACING_V2=true)\n`;
    items += `- [ ] State schema da define ro rang\n`;
  }
  if (stackStr.includes("openai") || stackStr.includes("claude") || stackStr.includes("anthropic")) {
    items += `- [ ] API key da set trong .env (khong hardcode)\n`;
    items += `- [ ] Rate limit + retry logic da implement\n`;
    items += `- [ ] Cost monitoring da setup\n`;
  }
  if (stackStr.includes("node") || stackStr.includes("express") || stackStr.includes("fastapi")) {
    items += `- [ ] Error handling middleware da setup\n`;
    items += `- [ ] Environment variables validation khi startup\n`;
  }

  // --- Universal checks ---
  items += `\n## Kiem tra chung\n`;
  items += `- [ ] .gitignore da co: .env, node_modules, __pycache__, *.log\n`;
  items += `- [ ] README.md co huong dan setup co ban\n`;
  items += `- [ ] Test endpoint don gian truoc khi build features\n`;
  items += `- [ ] Backup/restore strategy da nghi den\n`;
  items += `- [ ] Logging co du thong tin de debug production issues\n`;

  // --- Past learnings relevant to this project ---
  const learnings = getAllLearningFiles();
  const keywords = [...(stack || []), ...description.split(/\s+/)].filter(w => w.length >= 3);
  if (keywords.length > 0) {
    const relevant = searchInFiles(learnings, keywords.join(" ")).slice(0, 3);
    if (relevant.length > 0) {
      items += `\n## Bai hoc tu du an cu (review truoc khi code)\n`;
      for (const r of relevant) {
        items += `- [ ] Doc: ${r.name}\n`;
        if (r.snippets[0]) {
          const firstLine = r.snippets[0].split("\n")[0].trim();
          if (firstLine.length > 5 && !firstLine.startsWith("---")) {
            items += `      → ${firstLine.substring(0, 100)}\n`;
          }
        }
      }
    }
  }

  return items;
}

// --- MCP Server ---
const server = new McpServer({
  name: "longbrain",
  version: "7.0.0",
});

// ============================================================
// KNOWLEDGE TOOLS
// ============================================================

server.tool(
  "search_knowledge",
  "Tim kiem trong TOAN BO second brain: knowledge files, research, projects, bai hoc. " +
  "LUON dung tool nay TRUOC khi code bat ky ky thuat phuc tap nao. " +
  "v7: Hybrid search (BM25 + semantic vector + RRF fusion).",
  { query: z.string().describe("Tu khoa tim kiem (VD: 'LangGraph state', 'Lark API', 'chatbot Zalo')") },
  async ({ query }) => {
    // v7: Use hybrid search if DB is ready
    if (dbReady && db) {
      try {
        const { results, strategy } = await hybridSearch(db, query, { limit: 10 });
        if (results.length === 0) {
          return {
            content: [{
              type: "text",
              text: `KHONG TIM THAY kien thuc ve "${query}" trong Longbrain.\n\nHANH DONG TIEP THEO:\n1. Dung WebSearch/WebFetch de research\n2. Sau do dung add_knowledge de luu vao vault`,
            }],
          };
        }
        let output = `Tim thay ${results.length} ket qua cho "${query}" [${strategy}]:\n\n`;
        for (const r of results) {
          output += `## ${r.title} [${r.category}] (RRF: ${r.rrf_score.toFixed(4)} | FTS: ${r.fts_rank || '-'} | Vec: ${r.vec_rank || '-'})\n`;
          output += `\`\`\`\n${r.snippet}\n\`\`\`\n\n`;
        }
        return { content: [{ type: "text", text: output }] };
      } catch (e) {
        process.stderr.write(`[Longbrain] Hybrid search error, falling back: ${e.message}\n`);
      }
    }

    // Fallback: old regex search
    const allFiles = [
      ...getAllKnowledgeFiles(),
      ...getAllResearchFiles(),
      ...getAllProjectFiles(),
      ...getAllLearningFiles(),
    ];
    const results = searchInFiles(allFiles, query);

    if (results.length === 0) {
      return {
        content: [{
          type: "text",
          text: `KHONG TIM THAY kien thuc ve "${query}" trong Longbrain.\n\nHANH DONG TIEP THEO:\n1. Dung WebSearch/WebFetch de research\n2. Sau do dung add_knowledge de luu vao vault`,
        }],
      };
    }

    let output = `Tim thay ${results.length} ket qua cho "${query}" [FALLBACK]:\n\n`;
    for (const r of results) {
      output += `## ${r.file} [${r.category}] (score: ${r.score})\n`;
      for (const s of r.snippets) {
        output += `\`\`\`\n${s}\n\`\`\`\n`;
      }
      output += "\n";
    }
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "get_context_for_task",
  "Tool QUAN TRONG NHAT. Dung khi bat dau bat ky task nao. " +
  "Tim tat ca kien thuc lien quan: knowledge + projects da lam + bai hoc - tat ca trong 1 lan goi. " +
  "Giup Claude hieu context day du truoc khi code, tranh bug da gap. " +
  "v7: Hybrid search (BM25 + semantic vector + RRF fusion).",
  {
    task_description: z.string().describe(
      "Mo ta task can lam (VD: 'build chatbot Zalo su dung LangGraph va PostgreSQL')"
    ),
  },
  async ({ task_description }) => {
    // v7: Use hybrid search if DB is ready
    if (dbReady && db) {
      try {
        const { results } = await hybridSearch(db, task_description, { limit: 15 });
        if (results.length === 0) {
          return {
            content: [{
              type: "text",
              text: `Chua co kien thuc ve task nay trong vault.\n\nGoi y:\n- Dung WebSearch de research truoc\n- Sau khi hoan thanh, dung add_learning de luu bai hoc`,
            }],
          };
        }

        // Group by category
        const knowledge = results.filter(r => !["30-PROJECTS","32-LEARNINGS","35-DECISIONS"].includes(r.category));
        const projects  = results.filter(r => r.category === "30-PROJECTS");
        const learnings = results.filter(r => r.category === "32-LEARNINGS");
        const decisions = results.filter(r => r.category === "35-DECISIONS");

        let output = `# Longbrain Context cho task: "${task_description}"\n\n`;

        if (knowledge.length > 0) {
          output += `## Kien thuc lien quan (${knowledge.length} files)\n`;
          for (const r of knowledge.slice(0, 5)) {
            output += `### ${r.title} [${r.category}] (RRF: ${r.rrf_score.toFixed(4)})\n`;
            output += `\`\`\`\n${r.snippet}\n\`\`\`\n`;
            output += `> Doc day du: get_knowledge_file("${path.basename(r.path)}")\n\n`;
          }
        }

        if (projects.length > 0) {
          output += `## Du an da tung build tuong tu (${projects.length})\n`;
          for (const r of projects.slice(0, 3)) {
            output += `### ${r.title} (RRF: ${r.rrf_score.toFixed(4)})\n`;
            output += `\`\`\`\n${r.snippet}\n\`\`\`\n\n`;
          }
        }

        if (decisions.length > 0) {
          output += `## Quyet dinh kien truc lien quan (${decisions.length})\n`;
          for (const r of decisions.slice(0, 3)) {
            output += `### ${r.title} (RRF: ${r.rrf_score.toFixed(4)})\n`;
            output += `\`\`\`\n${r.snippet}\n\`\`\`\n\n`;
          }
        }

        if (learnings.length > 0) {
          output += `## Bai hoc da duc ket (${learnings.length} - QUAN TRONG: doc de tranh bug)\n`;
          for (const r of learnings.slice(0, 5)) {
            output += `### ${r.title} (RRF: ${r.rrf_score.toFixed(4)})\n`;
            output += `\`\`\`\n${r.snippet}\n\`\`\`\n\n`;
          }
        }

        output += `---\n> Sau khi hoan thanh task → PHAI goi add_learning() de luu bai hoc moi.`;
        return { content: [{ type: "text", text: output }] };
      } catch (e) {
        process.stderr.write(`[Longbrain] Hybrid search error in get_context, falling back: ${e.message}\n`);
      }
    }

    // Fallback: old regex search
    const allFiles = [
      ...getAllKnowledgeFiles(),
      ...getAllResearchFiles(),
      ...getAllProjectFiles(),
      ...getAllLearningFiles(),
      ...getAllDecisionFiles(),
    ];

    const results = searchInFiles(allFiles, task_description);

    if (results.length === 0) {
      return {
        content: [{
          type: "text",
          text: `Chua co kien thuc ve task nay trong vault.\n\nGoi y:\n- Dung WebSearch de research truoc\n- Sau khi hoan thanh, dung add_learning de luu bai hoc`,
        }],
      };
    }

    const knowledge  = results.filter(r => !["project","learning","research","decision"].includes(r.category));
    const projects   = results.filter(r => r.category === "project");
    const learnings  = results.filter(r => r.category === "learning");
    const decisions  = results.filter(r => r.category === "decision");

    let output = `# Longbrain Context cho task: "${task_description}" [FALLBACK]\n\n`;

    if (knowledge.length > 0) {
      output += `## Kien thuc lien quan (${knowledge.length} files)\n`;
      for (const r of knowledge.slice(0, 5)) {
        output += `### ${r.name} [${r.category}]\n`;
        if (r.snippets.length > 0) output += `\`\`\`\n${r.snippets[0]}\n\`\`\`\n`;
        output += `> Doc day du: get_knowledge_file("${r.file}")\n\n`;
      }
    }

    if (projects.length > 0) {
      output += `## Du an da tung build tuong tu (${projects.length})\n`;
      for (const r of projects.slice(0, 3)) {
        output += `### ${r.name}\n`;
        if (r.snippets.length > 0) output += `\`\`\`\n${r.snippets[0]}\n\`\`\`\n`;
        output += "\n";
      }
    }

    if (decisions.length > 0) {
      output += `## Quyet dinh kien truc lien quan (${decisions.length})\n`;
      for (const r of decisions.slice(0, 3)) {
        output += `### ${r.name}\n`;
        if (r.snippets.length > 0) output += `\`\`\`\n${r.snippets[0]}\n\`\`\`\n`;
        output += "\n";
      }
    }

    if (learnings.length > 0) {
      output += `## Bai hoc da duc ket (${learnings.length} - QUAN TRONG: doc de tranh bug)\n`;
      for (const r of learnings.slice(0, 5)) {
        output += `### ${r.name}\n`;
        for (const s of r.snippets.slice(0, 2)) output += `\`\`\`\n${s}\n\`\`\`\n`;
        output += "\n";
      }
    }

    output += `---\n> Sau khi hoan thanh task → PHAI goi add_learning() de luu bai hoc moi.`;
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "get_moc",
  "Doc noi dung 1 MOC (Map of Content). Dung de xem tong quan 1 category.",
  { category_id: z.string().describe("ID category: '01'-'20' (knowledge) hoac '30'-'34' (life)") },
  async ({ category_id }) => {
    const cat = CATEGORIES[category_id] || LIFE_SECTIONS[category_id];
    if (!cat) {
      return { content: [{ type: "text", text: `Category "${category_id}" khong ton tai. Dung list_categories de xem.` }] };
    }
    const mocPath = path.join(VAULT_DIR, cat.folder, `${cat.moc}.md`);
    const content = readFileSafe(mocPath);
    return { content: [{ type: "text", text: content || `MOC chua co noi dung: ${cat.moc}` }] };
  }
);

server.tool(
  "get_knowledge_file",
  "Doc noi dung 1 file cu the (knowledge, research, project, learning).",
  { filename: z.string().describe("Ten file (VD: 'LangGraph-Code-Knowledge.md' hoac 'LangGraph-Code')") },
  async ({ filename }) => {
    if (!filename.endsWith(".md")) filename += ".md";

    const searchDirs = [
      ...Object.values(CATEGORIES).map(c => path.join(VAULT_DIR, c.folder)),
      ...Object.values(LIFE_SECTIONS).map(c => path.join(VAULT_DIR, c.folder)),
      RESEARCH_DIR,
    ];

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      const filePath = path.join(dir, filename);
      const content = readFileSafe(filePath);
      if (content) return { content: [{ type: "text", text: content }] };
    }

    return { content: [{ type: "text", text: `Khong tim thay: ${filename}\nDung search_knowledge de tim ten chinh xac.` }] };
  }
);

server.tool(
  "list_categories",
  "Liet ke tat ca categories (knowledge + life sections) va so files moi category.",
  {},
  async () => {
    const knowledgeFiles = getAllKnowledgeFiles();
    let output = "# Longbrain - Categories\n\n## KIEN THUC\n";
    output += "| ID | Category | Files | Mo ta |\n|-----|----------|-------|-------|\n";
    for (const [id, cat] of Object.entries(CATEGORIES)) {
      const count = knowledgeFiles.filter(f => f.category_id === id).length;
      output += `| ${id} | ${cat.moc} | ${count} | ${cat.desc} |\n`;
    }
    output += "\n## CUOC SONG & SU NGHIEP\n";
    output += "| ID | Category | Files | Mo ta |\n|-----|----------|-------|-------|\n";
    for (const [id, sec] of Object.entries(LIFE_SECTIONS)) {
      const dir = path.join(VAULT_DIR, sec.folder);
      let count = 0;
      if (fs.existsSync(dir)) {
        count = fs.readdirSync(dir).filter(f => f.endsWith(".md") && f !== `${sec.moc}.md`).length;
      }
      output += `| ${id} | ${sec.moc} | ${count} | ${sec.desc} |\n`;
    }
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "add_knowledge",
  "Them 1 knowledge file moi vao vault. Dung sau khi research xong de luu kien thuc. " +
  "BAT BUOC phai co source_code de lan sau co the copy va trien khai lai.",
  {
    category_id: z.string().describe("ID category: '01'-'20'"),
    name: z.string().describe("Ten file (VD: 'Zalo-API' -> tao Zalo-API-Knowledge.md)"),
    content: z.string().describe("Noi dung markdown day du"),
    tags: z.array(z.string()).optional().describe("Tags (VD: ['zalo', 'api', 'vietnam'])"),
    source_code: z.string().optional().describe(
      "QUAN TRONG: Source code day du de co the trien khai lai. " +
      "Bao gom: main files, config, key functions. " +
      "Neu la research thi bao gom code examples tu docs."
    ),
    github_url: z.string().optional().describe("Link GitHub repo/folder chua source code day du"),
  },
  async ({ category_id, name, content, tags, source_code, github_url }) => {
    const cat = CATEGORIES[category_id];
    if (!cat) return { content: [{ type: "text", text: `Category "${category_id}" khong ton tai. Dung list_categories.` }] };

    const safeName = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const filename = `${safeName}-Knowledge.md`;
    const filePath = path.join(VAULT_DIR, cat.folder, filename);

    if (fs.existsSync(filePath)) {
      return { content: [{ type: "text", text: `Da ton tai: ${filename}.\nDung update_knowledge de cap nhat.` }] };
    }

    const tagList = tags || [safeName.toLowerCase()];
    const fm = `---\ntags: [${tagList.join(", ")}]\ndescription: ${name}\ncreated: ${today()}\nmoc: "[[${cat.moc}]]"\n${github_url ? `github: ${github_url}\n` : ""}---\n\n`;

    let body = content;
    if (source_code) {
      body += `\n\n## Source Code\n\n${source_code}\n`;
    }
    if (github_url) {
      body += `\n## GitHub\n${github_url}\n`;
    }

    fs.writeFileSync(filePath, fm + body, "utf-8");

    // v7: Auto-index into hybrid search DB
    if (dbReady && db) {
      indexSingleFile(db, VAULT_DIR, filePath).catch(e =>
        process.stderr.write(`[Longbrain] Index error: ${e.message}\n`)
      );
    }

    const warning = !source_code ? "\n⚠️ CANH BAO: Khong co source_code — lan sau kho trien khai lai!" : "";
    return { content: [{ type: "text", text: `Da tao: ${filename}\nPath: ${cat.folder}/${filename}${warning}` }] };
  }
);

server.tool(
  "update_knowledge",
  "Cap nhat 1 knowledge file da ton tai. Co the them noi dung moi hoac ghi de toan bo.",
  {
    filename: z.string().describe("Ten file (VD: 'LangGraph-Code-Knowledge.md')"),
    content: z.string().describe("Noi dung moi"),
    mode: z.enum(["append", "overwrite"]).default("append").describe(
      "append: them vao cuoi file | overwrite: ghi de (giu nguyen frontmatter)"
    ),
  },
  async ({ filename, content, mode }) => {
    if (!filename.endsWith(".md")) filename += ".md";

    const searchDirs = Object.values(CATEGORIES).map(c => path.join(VAULT_DIR, c.folder));
    for (const dir of searchDirs) {
      const filePath = path.join(dir, filename);
      const existing = readFileSafe(filePath);
      if (!existing) continue;

      if (mode === "overwrite") {
        // Keep frontmatter, replace body
        const fmMatch = existing.match(/^---[\s\S]*?---\n/);
        const fm = fmMatch ? fmMatch[0] : "";
        fs.writeFileSync(filePath, fm + content, "utf-8");
        // v7: Auto-index
        if (dbReady && db) {
          indexSingleFile(db, VAULT_DIR, filePath).catch(e =>
            process.stderr.write(`[Longbrain] Index error: ${e.message}\n`)
          );
        }
        return { content: [{ type: "text", text: `Da ghi de noi dung: ${filename}` }] };
      } else {
        // Append
        fs.writeFileSync(filePath, existing + "\n\n" + content, "utf-8");
        // v7: Auto-index
        if (dbReady && db) {
          indexSingleFile(db, VAULT_DIR, filePath).catch(e =>
            process.stderr.write(`[Longbrain] Index error: ${e.message}\n`)
          );
        }
        return { content: [{ type: "text", text: `Da them noi dung vao: ${filename}` }] };
      }
    }

    return { content: [{ type: "text", text: `Khong tim thay: ${filename}\nDung add_knowledge neu muon tao moi.` }] };
  }
);

// ============================================================
// PROJECT TOOLS
// ============================================================

server.tool(
  "init_project",
  "Khoi tao du an moi trong Longbrain. " +
  "GOI NGAY khi user noi 'bat dau du an moi', 'start new project', 'khoi tao project'. " +
  "Tao folder rieng + cac file template (overview, architecture, progress, resources) ben trong 30-PROJECTS.",
  {
    name: z.string().describe("Ten du an, dung lam ten folder (VD: 'Chatbot-Zalo', 'GrowBiz-CRM')"),
    description: z.string().describe("Mo ta ngan ve du an nay la gi, muc tieu la gi"),
    client: z.string().optional().describe("Ten khach hang (neu co)"),
    stack: z.array(z.string()).optional().describe("Tech stack du kien (VD: ['Node.js', 'LangGraph', 'PostgreSQL'])"),
  },
  async ({ name, description, client, stack }) => {
    const safeName = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const projRoot = path.join(VAULT_DIR, "30-PROJECTS");
    const projDir  = path.join(projRoot, safeName);
    const projFile = path.join(projRoot, `${safeName}.md`);

    // Tao folder du an
    if (!fs.existsSync(projDir)) fs.mkdirSync(projDir, { recursive: true });

    // --- File 1: Overview (root-level, de search functions tim duoc) ---
    const stackLine = stack ? `stack: [${stack.join(", ")}]\n` : "";
    const clientLine = client ? `client: ${client}\n` : "";
    const overviewFm = `---\ntags: [project, ${safeName.toLowerCase()}]\nstatus: dang-lam\nstarted: ${today()}\n${clientLine}${stackLine}updated: ${today()}\nvault: "[[${safeName}]]"\n---\n\n`;
    const overviewBody =
      `# ${name}\n\n` +
      `## Mo ta\n${description}\n\n` +
      (stack ? `## Stack\n${stack.map(s => `- ${s}`).join("\n")}\n\n` : "") +
      `## Trang thai\n- [ ] Setup project\n- [ ] Core features\n- [ ] Testing\n- [ ] Deploy\n\n` +
      `## Lien ket\n` +
      `- [[${safeName}/architecture|Architecture]]\n` +
      `- [[${safeName}/progress|Progress Log]]\n` +
      `- [[${safeName}/resources|Resources]]\n` +
      `-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]\n`;
    fs.writeFileSync(projFile, overviewFm + overviewBody, "utf-8");

    // --- File 2: Architecture ---
    const archContent =
      `# ${name} — Architecture\n\n` +
      `## Tong quan he thong\n> Mo ta kien truc tong the o day\n\n` +
      `## Components\n\`\`\`\n[Component A] → [Component B] → [Component C]\n\`\`\`\n\n` +
      `## Cac quyet dinh kien truc\n| Quyet dinh | Ly do | Trade-off |\n|-----------|-------|----------|\n| | | |\n\n` +
      `## Data Flow\n> Mo ta luong du lieu\n\n` +
      `## Database Schema\n\`\`\`sql\n-- Tables chinh\n\`\`\`\n\n` +
      `## API Endpoints\n| Method | Endpoint | Mo ta |\n|--------|----------|-------|\n| | | |\n`;
    fs.writeFileSync(path.join(projDir, "architecture.md"), archContent, "utf-8");

    // --- File 3: Progress Log ---
    const progressContent =
      `# ${name} — Progress Log\n\n` +
      `## ${today()}\n### Da lam\n- [ ] Khoi tao project\n\n### Van de / Blockers\n- Khong co\n\n### Ke hoach ngay mai\n- [ ] \n\n---\n`;
    fs.writeFileSync(path.join(projDir, "progress.md"), progressContent, "utf-8");

    // --- File 4: Resources ---
    const resourcesContent =
      `# ${name} — Resources\n\n` +
      `## Docs chinh thuc\n- \n\n` +
      `## Reference repos\n- \n\n` +
      `## Contacts / APIs\n| Service | URL / Key | Ghi chu |\n|---------|-----------|--------|\n| | | |\n\n` +
      `## Kien thuc lien quan trong Longbrain\n` +
      `> Dung search_knowledge("ten du an") de tim\n`;
    fs.writeFileSync(path.join(projDir, "resources.md"), resourcesContent, "utf-8");

    // --- File 5: Pre-flight Checklist (auto-generated from learnings + never-again) ---
    const checklistItems = buildPreflightChecklist({ name, description, stack });
    const checklistContent =
      `# ${name} — Pre-flight Checklist\n\n` +
      `> Auto-generated tu Longbrain khi init_project.\n` +
      `> PHAI review truoc khi bat dau code!\n\n` +
      checklistItems +
      `\n## Sau khi bat dau\n` +
      `- [ ] Goi get_context_for_task("${description}") de tim kien thuc lien quan\n` +
      `- [ ] Log progress hang ngay vao progress.md\n` +
      `- [ ] add_learning() sau moi bug fix hoac milestone quan trong\n`;
    fs.writeFileSync(path.join(projDir, "checklist.md"), checklistContent, "utf-8");

    const output =
      `Du an "${name}" da duoc khoi tao trong Longbrain!\n\n` +
      `Duong dan: AI Knowledge Build/30-PROJECTS/${safeName}/\n\n` +
      `Files da tao:\n` +
      `- 30-PROJECTS/${safeName}.md               (overview, index tu dong)\n` +
      `- 30-PROJECTS/${safeName}/architecture.md  (kien truc he thong)\n` +
      `- 30-PROJECTS/${safeName}/progress.md      (nhat ky tien do)\n` +
      `- 30-PROJECTS/${safeName}/resources.md     (tai nguyen, links)\n` +
      `- 30-PROJECTS/${safeName}/checklist.md     (pre-flight checklist tu Longbrain)\n\n` +
      `Buoc tiep theo:\n` +
      `1. Doc checklist.md — co ${checklistItems.split("- [ ]").length - 1} items tu kinh nghiem cu\n` +
      `2. Dung get_context_for_task("${description}") de tim kien thuc lien quan\n` +
      `3. Cap nhat architecture.md khi thiet ke he thong\n` +
      `4. Log tien do vao progress.md moi ngay`;

    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "log_progress",
  "Them nhat ky tien do vao progress.md cua du an hien tai. " +
  "Dung cuoi ngay hoac sau khi hoan thanh milestone quan trong.",
  {
    project_name: z.string().describe("Ten du an (VD: 'Chatbot-Zalo')"),
    done: z.array(z.string()).describe("Nhung viec da hoan thanh hom nay"),
    blockers: z.array(z.string()).optional().describe("Van de / blocker dang gap"),
    next: z.array(z.string()).optional().describe("Ke hoach buoi tiep theo"),
  },
  async ({ project_name, done, blockers, next }) => {
    const safeName = project_name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const progressFile = path.join(VAULT_DIR, "30-PROJECTS", safeName, "progress.md");

    if (!fs.existsSync(progressFile)) {
      return { content: [{ type: "text", text: `Khong tim thay progress.md cho: ${project_name}\nDung init_project truoc.` }] };
    }

    const existing = readFileSafe(progressFile) || "";
    let entry = `\n## ${today()}\n`;
    entry += `### Da lam\n${done.map(d => `- [x] ${d}`).join("\n")}\n\n`;
    if (blockers?.length) entry += `### Blockers\n${blockers.map(b => `- ${b}`).join("\n")}\n\n`;
    if (next?.length)    entry += `### Tiep theo\n${next.map(n => `- [ ] ${n}`).join("\n")}\n\n`;
    entry += "---";

    fs.writeFileSync(progressFile, existing + entry, "utf-8");
    return { content: [{ type: "text", text: `Da log progress cho ${project_name} ngay ${today()}` }] };
  }
);

server.tool(
  "add_project",
  "Ghi lai 1 du an (moi hoac cu). Luu: stack, quyet dinh, bai hoc, ket qua. " +
  "BAT BUOC phai co source_code de lan sau co the trien khai lai thay vi code tu dau.",
  {
    name: z.string().describe("Ten du an (VD: 'AI-Chatbot-Zalo')"),
    status: z.enum(["dang-lam", "hoan-thanh", "tam-dung"]).describe("Trang thai"),
    started: z.string().optional().describe("Ngay bat dau (YYYY-MM-DD)"),
    client: z.string().optional().describe("Ten khach hang"),
    stack: z.array(z.string()).optional().describe("Tech stack (VD: ['Node.js', 'LangGraph', 'PostgreSQL'])"),
    description: z.string().describe("Mo ta du an"),
    decisions: z.string().optional().describe("Cac quyet dinh kien truc quan trong"),
    learnings: z.string().optional().describe("Bai hoc rut ra"),
    outcome: z.string().optional().describe("Ket qua / impact"),
    source_code: z.string().optional().describe(
      "QUAN TRONG: Source code chinh cua du an. " +
      "Bao gom: main entry point, core logic, config, key modules. " +
      "Day la phan THIET YEU de co the trien khai lai du an."
    ),
    github_url: z.string().optional().describe("Link GitHub repo/folder (VD: 'https://github.com/buitrankimlong/Projects/tree/main/...')"),
  },
  async ({ name, status, started, client, stack, description, decisions, learnings, outcome, source_code, github_url }) => {
    const dir = path.join(VAULT_DIR, "30-PROJECTS");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const safeName = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const filePath = path.join(dir, `${safeName}.md`);

    let body = `---\ntags: [project, ${safeName.toLowerCase()}]\nstatus: ${status}\nstarted: ${started || today()}\n`;
    if (client) body += `client: ${client}\n`;
    if (stack)  body += `stack: [${stack.join(", ")}]\n`;
    if (github_url) body += `github: ${github_url}\n`;
    body += `updated: ${today()}\n---\n\n`;
    body += `# ${name}\n\n## Mo ta\n${description}\n\n`;
    if (stack)      body += `## Stack\n${stack.map(s => `- ${s}`).join("\n")}\n\n`;
    if (decisions)  body += `## Quyet dinh quan trong\n${decisions}\n\n`;
    if (learnings)  body += `## Bai hoc rut ra\n${learnings}\n\n`;
    if (outcome)    body += `## Ket qua\n${outcome}\n\n`;
    if (source_code) body += `## Source Code\n\n${source_code}\n\n`;
    if (github_url) body += `## GitHub\n${github_url}\n\n`;
    body += `## Lien ket\n-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]\n`;

    fs.writeFileSync(filePath, body, "utf-8");

    // v7: Auto-index into hybrid search DB
    if (dbReady && db) {
      indexSingleFile(db, VAULT_DIR, filePath).catch(e =>
        process.stderr.write(`[Longbrain] Index error: ${e.message}\n`)
      );
    }

    const warning = !source_code ? "\n⚠️ CANH BAO: Khong co source_code — lan sau kho trien khai lai!" : "";
    return { content: [{ type: "text", text: `Da luu du an: ${safeName}.md${warning}` }] };
  }
);

server.tool(
  "search_projects",
  "Tim kiem trong cac du an da lam. Dung khi muon biet 'da tung build cai nay chua?' hoac 'du an nao dung tech X?' " +
  "v7: Hybrid search.",
  { query: z.string().describe("Tu khoa (VD: 'chatbot', 'Lark', 'NextJS', 'CRM')") },
  async ({ query }) => {
    if (dbReady && db) {
      try {
        const { results, strategy } = await hybridSearch(db, query, { limit: 10, category: "30-PROJECTS" });
        if (results.length === 0) {
          return { content: [{ type: "text", text: `Khong tim thay du an lien quan den "${query}".` }] };
        }
        let output = `Tim thay ${results.length} du an lien quan den "${query}" [${strategy}]:\n\n`;
        for (const r of results) {
          output += `## ${r.title} (RRF: ${r.rrf_score.toFixed(4)})\n`;
          output += `\`\`\`\n${r.snippet}\n\`\`\`\n\n`;
        }
        return { content: [{ type: "text", text: output }] };
      } catch (e) {
        process.stderr.write(`[Longbrain] search_projects hybrid error: ${e.message}\n`);
      }
    }
    // Fallback
    const projects = getAllProjectFiles();
    if (projects.length === 0) {
      return { content: [{ type: "text", text: "Chua co du an nao. Dung add_project de them." }] };
    }
    const results = searchInFiles(projects, query);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `Khong tim thay du an lien quan den "${query}".` }] };
    }
    let output = `Tim thay ${results.length} du an lien quan den "${query}" [FALLBACK]:\n\n`;
    for (const r of results) {
      output += `## ${r.file}\n`;
      for (const s of r.snippets) output += `\`\`\`\n${s}\n\`\`\`\n`;
      output += "\n";
    }
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "list_projects",
  "Liet ke tat ca du an trong vault kem trang thai va stack.",
  {},
  async () => {
    const projDir = path.join(VAULT_DIR, "30-PROJECTS");
    if (!fs.existsSync(projDir)) return { content: [{ type: "text", text: "Chua co du an." }] };
    const files = fs.readdirSync(projDir).filter(f => f.endsWith(".md") && f !== "30 Du An.md");
    if (files.length === 0) return { content: [{ type: "text", text: "Chua co du an nao." }] };

    let output = "# Tat ca du an\n\n| Du an | Status | Stack |\n|-------|--------|-------|\n";
    for (const f of files) {
      const content = readFileSafe(path.join(projDir, f)) || "";
      const status = (content.match(/status:\s*(.+)/) || [])[1]?.trim() || "?";
      const stack  = (content.match(/stack:\s*\[(.+)\]/) || [])[1] || "?";
      output += `| ${f.replace(".md", "")} | ${status} | ${stack} |\n`;
    }
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "get_project_blueprint",
  "Tao blueprint tai su dung tu 1 du an cu. Rut trich stack, decisions, lessons de lam template cho du an moi.",
  { project_name: z.string().describe("Ten du an (VD: 'AI-Chatbot-Zalo')") },
  async ({ project_name }) => {
    const projDir = path.join(VAULT_DIR, "30-PROJECTS");
    const files = fs.existsSync(projDir) ? fs.readdirSync(projDir) : [];
    const match = files.find(f =>
      f.toLowerCase().includes(project_name.toLowerCase().replace(/\s+/g, "-"))
    );
    if (!match) {
      return { content: [{ type: "text", text: `Khong tim thay: ${project_name}. Dung list_projects.` }] };
    }

    const content = readFileSafe(path.join(projDir, match)) || "";
    const stack     = content.match(/## Stack[\s\S]*?(?=##|$)/)?.[0] || "";
    const decisions = content.match(/## Quyet dinh[\s\S]*?(?=##|$)/)?.[0] || "";
    const lessons   = content.match(/## Bai hoc[\s\S]*?(?=##|$)/)?.[0] || "";
    const related   = searchInFiles(getAllLearningFiles(), project_name);

    let blueprint = `# Blueprint: ${match.replace(".md", "")}\n\n`;
    blueprint += `> Template tai su dung tu du an da lam.\n\n`;
    if (stack)     blueprint += stack + "\n";
    if (decisions) blueprint += decisions + "\n";
    if (lessons)   blueprint += lessons + "\n";

    if (related.length > 0) {
      blueprint += `## Bai hoc lien quan\n`;
      for (const r of related) {
        blueprint += `- ${r.file}\n`;
        if (r.snippets[0]) blueprint += `  ${r.snippets[0].split("\n")[0]}\n`;
      }
      blueprint += "\n";
    }

    blueprint += `## Checklist khi build lai\n`;
    blueprint += `- [ ] Setup project structure\n`;
    blueprint += `- [ ] Install dependencies (xem Stack)\n`;
    blueprint += `- [ ] Apply architecture decisions\n`;
    blueprint += `- [ ] Review bai hoc de tranh sai lam cu\n`;
    blueprint += `- [ ] Test core functionality\n`;

    return { content: [{ type: "text", text: blueprint }] };
  }
);

// ============================================================
// LEARNING TOOLS
// ============================================================

server.tool(
  "add_learning",
  "Ghi lai 1 bai hoc rut ra. Day la noi QUY GIA NHAT cua second brain. " +
  "Phai goi sau moi bug fix, feature hoan thanh, hoac pattern moi phat hien. " +
  "BAT BUOC phai co source_code day du de lan sau co the COPY VA TRIEN KHAI LAI ngay, thay vi code tu dau.",
  {
    title: z.string().describe("Mo ta ngan (VD: 'Cach xu ly rate limit Lark API')"),
    context: z.string().describe("Boi canh CHI TIET: van de gap phai, stack dang dung, loi cu the"),
    solution: z.string().describe("Giai phap CHI TIET: tung buoc da lam, config da thay doi, commands da chay"),
    takeaway: z.string().describe("Duc ket: lan sau gap tuong tu thi lam gi? Buoc nao KHONG duoc bo qua?"),
    project: z.string().optional().describe("Ten du an lien quan"),
    tags: z.array(z.string()).optional().describe("Tags"),
    source_code: z.string().optional().describe(
      "QUAN TRONG — Source code/config DAY DU de co the trien khai lai. " +
      "Bao gom: file chinh, config, commands, env vars. " +
      "Format: ten_file: \\n```lang\\ncode\\n``` cho moi file. " +
      "Neu la bug fix: bao gom code TRUOC va SAU khi fix."
    ),
  },
  async ({ title, context, solution, takeaway, project, tags, source_code }) => {
    const dir = path.join(VAULT_DIR, "32-LEARNINGS");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const safeName = title.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").substring(0, 60);
    const filename = `${today()}-${safeName}.md`;
    const filePath = path.join(dir, filename);

    const tagList = tags || ["learning"];
    let body = `---\ntags: [learning, ${tagList.join(", ")}]\ndate: ${today()}\n`;
    if (project) body += `project: "[[${project}]]"\n`;
    body += `---\n\n`;
    body += `# ${title}\n\n`;
    body += `## Boi canh\n${context}\n\n`;
    body += `## Giai phap\n${solution}\n\n`;
    body += `## Duc ket\n${takeaway}\n\n`;
    if (source_code) {
      body += `## Source Code\n\n${source_code}\n\n`;
    }
    body += `## Lien ket\n-> [[32 Bai Hoc Duc Ket]]`;
    if (project) body += ` | [[${project}]]`;
    body += "\n";

    fs.writeFileSync(filePath, body, "utf-8");

    // v7: Auto-index into hybrid search DB
    if (dbReady && db) {
      indexSingleFile(db, VAULT_DIR, filePath).catch(e =>
        process.stderr.write(`[Longbrain] Index error: ${e.message}\n`)
      );
    }

    const warning = !source_code ? "\n⚠️ CANH BAO: Khong co source_code — bai hoc nay se kho ap dung lai!" : "";
    return { content: [{ type: "text", text: `Da luu bai hoc: ${filename}${warning}` }] };
  }
);

server.tool(
  "search_learnings",
  "Tim kiem trong cac bai hoc da duc ket. " +
  "Dung khi gap bug/van de va muon biet 'minh da giai quyet cai nay bao gio chua?' " +
  "v7: Hybrid search.",
  { query: z.string().describe("Tu khoa (VD: 'rate limit', 'webhook', 'postgres connection')") },
  async ({ query }) => {
    if (dbReady && db) {
      try {
        const { results, strategy } = await hybridSearch(db, query, { limit: 10, category: "32-LEARNINGS" });
        if (results.length === 0) {
          return { content: [{ type: "text", text: `Khong tim thay bai hoc lien quan den "${query}".` }] };
        }
        let output = `Tim thay ${results.length} bai hoc lien quan [${strategy}]:\n\n`;
        for (const r of results) {
          output += `## ${r.title} (RRF: ${r.rrf_score.toFixed(4)})\n`;
          output += `\`\`\`\n${r.snippet}\n\`\`\`\n\n`;
        }
        return { content: [{ type: "text", text: output }] };
      } catch (e) {
        process.stderr.write(`[Longbrain] search_learnings hybrid error: ${e.message}\n`);
      }
    }
    // Fallback
    const learnings = getAllLearningFiles();
    if (learnings.length === 0) {
      return { content: [{ type: "text", text: "Chua co bai hoc nao. Dung add_learning de them." }] };
    }
    const results = searchInFiles(learnings, query);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `Khong tim thay bai hoc lien quan den "${query}".` }] };
    }
    let output = `Tim thay ${results.length} bai hoc lien quan [FALLBACK]:\n\n`;
    for (const r of results) {
      output += `## ${r.file}\n`;
      for (const s of r.snippets) output += `\`\`\`\n${s}\n\`\`\`\n`;
      output += "\n";
    }
    return { content: [{ type: "text", text: output }] };
  }
);

// ============================================================
// PATTERN MINING
// ============================================================

server.tool(
  "mine_patterns",
  "Phan tich TOAN BO vault de tim cac pattern lap di lap lai: " +
  "loi thuong gap, tech hay dung, quyet dinh thuong xuyen, config hay sai. " +
  "Dung khi muon hieu 'minh hay gap van de gi nhat?' hoac review suc khoe cua second brain.",
  {
    focus: z.enum(["bugs", "tech", "decisions", "all"]).default("all").describe(
      "bugs: loi thuong gap | tech: cong nghe hay dung | decisions: quyet dinh lap lai | all: tat ca"
    ),
  },
  async ({ focus }) => {
    const learnings  = getAllLearningFiles();
    const decisions  = getAllDecisionFiles();

    // ── Keyword frequency analysis ──────────────────────────────────────────
    const techKeywords = [
      "docker","nginx","postgresql","postgres","redis","mongodb","mysql",
      "node","nodejs","python","typescript","react","nextjs","fastapi","express",
      "langchain","langgraph","crewai","openai","claude","anthropic",
      "telegram","zalo","lark","webhook","api","momo","vnpay",
      "ssh","vps","ubuntu","linux","pm2","certbot","ssl",
      "kubernetes","helm","terraform","ansible","github","ci/cd",
    ];

    const bugKeywords = [
      "lỗi","error","failed","fix","bug","khong chay","khong hoat dong",
      "permission denied","enoent","eacces","rate limit","timeout","crash",
      "undefined","null","exception","traceback","exit code",
    ];

    const configKeywords = [
      "config","env","port","host","url","token","key","secret",
      ".env","nginx","docker-compose","systemd","service","proxy",
    ];

    // Count occurrences across all content
    function countKeywords(files, keywords) {
      const counts = {};
      for (const kw of keywords) counts[kw] = { count: 0, files: [] };

      for (const file of files) {
        const content = (readFileSafe(file.path) || "").toLowerCase();
        const fname   = file.name.toLowerCase();
        for (const kw of keywords) {
          const inName    = fname.includes(kw) ? 2 : 0;
          const inContent = (content.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
          const total     = inName + inContent;
          if (total > 0) {
            counts[kw].count += total;
            counts[kw].files.push(file.name.replace(".md", "").substring(0, 40));
          }
        }
      }

      return Object.entries(counts)
        .filter(([, v]) => v.count > 0)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([kw, v]) => ({ keyword: kw, count: v.count, examples: v.files.slice(0, 3) }));
    }

    // Temporal pattern: cluster files by date → find "active periods"
    function getTemporalClusters(files) {
      const byMonth = {};
      for (const file of files) {
        const m = file.filename.match(/^(\d{4}-\d{2})/);
        if (!m) continue;
        const month = m[1];
        byMonth[month] = (byMonth[month] || 0) + 1;
      }
      return Object.entries(byMonth)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 5)
        .map(([month, count]) => `${month}: ${count} items`);
    }

    const allFiles = [...learnings, ...decisions];
    let output = `# Pattern Mining Report — ${today()}\n\n`;
    output += `> Analyzed: ${learnings.length} learnings + ${decisions.length} decisions\n\n`;

    // ── Tech Patterns ──────────────────────────────────────────────────────
    if (focus === "tech" || focus === "all") {
      const techPatterns = countKeywords(allFiles, techKeywords);
      if (techPatterns.length > 0) {
        output += `## Tech hay dung nhat\n`;
        output += `| Tech | Tan suat | Vi du |\n|------|----------|-------|\n`;
        for (const p of techPatterns.slice(0, 8)) {
          output += `| **${p.keyword}** | ${p.count}x | ${p.examples.join(", ")} |\n`;
        }
        output += "\n";
      }
    }

    // ── Bug Patterns ───────────────────────────────────────────────────────
    if (focus === "bugs" || focus === "all") {
      const bugPatterns = countKeywords(learnings, bugKeywords);
      if (bugPatterns.length > 0) {
        output += `## Loai loi hay gap nhat\n`;
        output += `| Loai loi | Tan suat | Vi du |\n|----------|----------|-------|\n`;
        for (const p of bugPatterns.slice(0, 8)) {
          output += `| **${p.keyword}** | ${p.count}x | ${p.examples.join(", ")} |\n`;
        }
        output += "\n";
        output += `> **Goi y**: Nhung loi nay hay xay ra nhat → uu tien viet test va validation cho chung.\n\n`;
      }
    }

    // ── Decision Patterns ──────────────────────────────────────────────────
    if (focus === "decisions" || focus === "all") {
      const decPatterns = countKeywords(decisions, techKeywords);
      if (decPatterns.length > 0) {
        output += `## Tech hay phai quyet dinh\n`;
        output += `| Tech | So lan quyet dinh |\n|------|------------------|\n`;
        for (const p of decPatterns.slice(0, 6)) {
          output += `| **${p.keyword}** | ${p.count}x |\n`;
        }
        output += "\n";
      } else if (decisions.length === 0) {
        output += `## Decisions\n> Chua co decision nao. Dung add_decision() de ghi lai.\n\n`;
      }
    }

    // ── Config Issues ──────────────────────────────────────────────────────
    if (focus === "all") {
      const configPatterns = countKeywords(learnings, configKeywords);
      if (configPatterns.length > 0) {
        output += `## Config hay gap van de\n`;
        output += `| Config area | Tan suat |\n|-------------|----------|\n`;
        for (const p of configPatterns.slice(0, 6)) {
          output += `| **${p.keyword}** | ${p.count}x |\n`;
        }
        output += "\n";
      }
    }

    // ── Temporal clusters ──────────────────────────────────────────────────
    if (focus === "all" && allFiles.length > 3) {
      const clusters = getTemporalClusters(allFiles);
      if (clusters.length > 0) {
        output += `## Activity theo thoi gian\n`;
        for (const c of clusters) output += `- ${c}\n`;
        output += "\n";
      }
    }

    // ── Recommendations ────────────────────────────────────────────────────
    output += `## Khuyen nghi\n`;
    const bugCount = learnings.filter(f =>
      (readFileSafe(f.path) || "").toLowerCase().match(/\b(error|lỗi|failed|fix|bug)\b/)
    ).length;
    const bugRatio = learnings.length > 0 ? Math.round(bugCount / learnings.length * 100) : 0;
    output += `- ${bugRatio}% bai hoc la ve bug fix (${bugCount}/${learnings.length})\n`;
    if (bugRatio > 60) output += `  → Qua nhieu bug! Nen viet tests va validation nhieu hon\n`;
    if (learnings.length < 10) output += `- Vault con it bai hoc (${learnings.length}). Hay dung add_learning() thuong xuyen hon.\n`;
    if (decisions.length < 3) output += `- Chi co ${decisions.length} decision duoc ghi lai. Dung add_decision() cho cac quyet dinh ky thuat.\n`;

    return { content: [{ type: "text", text: output }] };
  }
);

// ============================================================
// CURATION & ANALYTICS
// ============================================================

server.tool(
  "curate_vault",
  "Quet toan bo vault, phan tich chat luong, tim files can cai thien va co the trung lap.",
  {},
  async () => {
    const knowledgeFiles = getAllKnowledgeFiles();
    const learnings = getAllLearningFiles();
    const projects = getAllProjectFiles();

    const issues = [];
    for (const f of knowledgeFiles) {
      const content = readFileSafe(f.path) || "";
      const lines = content.split("\n").length;
      const words = content.split(/\s+/).length;
      const hasCode = content.includes("```");
      const hasFm = content.startsWith("---");
      const fileIssues = [];

      if (words < 100) fileIssues.push("STUB: it hon 100 tu");
      else if (lines < 20) fileIssues.push("THIN: it hon 20 dong");
      if (!hasCode) fileIssues.push("khong co code examples");
      if (!hasFm) fileIssues.push("thieu frontmatter");

      if (fileIssues.length > 0) {
        issues.push({ file: f.filename, cat: f.category, lines, words, issues: fileIssues });
      }
    }

    let output = `# Vault Curation Report - ${today()}\n\n`;
    output += `## Thong ke\n`;
    output += `- Knowledge: ${knowledgeFiles.length} files\n`;
    output += `- Learnings: ${learnings.length} files\n`;
    output += `- Projects: ${projects.length} files\n\n`;

    if (issues.length > 0) {
      output += `## Files can cai thien (${issues.length})\n`;
      output += `| File | Lines | Words | Issues |\n|------|-------|-------|--------|\n`;
      for (const i of issues) {
        output += `| ${i.file} | ${i.lines} | ${i.words} | ${i.issues.join("; ")} |\n`;
      }
      output += "\n";
    } else {
      output += `## Tat ca files deu ok!\n\n`;
    }

    output += `## Categories trong\n`;
    for (const [id, cat] of Object.entries(CATEGORIES)) {
      const count = knowledgeFiles.filter(f => f.category_id === id).length;
      if (count === 0) output += `- [${id}] ${cat.moc}\n`;
    }

    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "vault_stats",
  "Thong ke nhanh: tong so files, categories, du an, bai hoc trong Longbrain.",
  {},
  async () => {
    const k = getAllKnowledgeFiles().length;
    const r = getAllResearchFiles().length;
    const p = getAllProjectFiles().length;
    const l = getAllLearningFiles().length;

    const jDir = path.join(VAULT_DIR, "31-JOURNAL");
    const j = fs.existsSync(jDir) ? fs.readdirSync(jDir).filter(f => f.endsWith(".md") && f !== "31 Nhat Ky.md").length : 0;
    const iDir = path.join(VAULT_DIR, "34-IDEAS");
    const i = fs.existsSync(iDir) ? fs.readdirSync(iDir).filter(f => f.endsWith(".md") && f !== "34 Y Tuong.md").length : 0;

    const total = k + r + p + l + j + i;
    let output = `# Longbrain Stats\n\n`;
    output += `| Loai | So luong |\n|------|----------|\n`;
    output += `| Knowledge files | ${k} |\n`;
    output += `| Research files | ${r} |\n`;
    output += `| Du an | ${p} |\n`;
    output += `| Bai hoc | ${l} |\n`;
    output += `| Journal | ${j} |\n`;
    output += `| Y tuong | ${i} |\n`;
    output += `| **TONG CONG** | **${total}** |\n`;

    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "get_dashboard",
  "Doc Dashboard tong quan cua Longbrain.",
  {},
  async () => {
    // Try multiple possible locations
    const candidates = [
      path.join(VAULT_DIR, "00-HOME", "Dashboard.md"),
      path.join(VAULT_DIR, "Dashboard.md"),
      path.join(VAULT_ROOT, "AI Knowledge Build", "Dashboard.md"),
    ];
    for (const p of candidates) {
      const content = readFileSafe(p);
      if (content) return { content: [{ type: "text", text: content }] };
    }

    // Auto-generate basic stats if dashboard missing
    const k = getAllKnowledgeFiles().length;
    const l = getAllLearningFiles().length;
    const pr = getAllProjectFiles().length;
    return {
      content: [{
        type: "text",
        text: `# Longbrain Dashboard\n\n- Knowledge files: ${k}\n- Learnings: ${l}\n- Projects: ${pr}\n\nDashboard.md chua ton tai. Dung vault_stats de xem chi tiet.`,
      }],
    };
  }
);

// ============================================================
// DECISION LOG (35-DECISIONS)
// ============================================================

server.tool(
  "add_decision",
  "Ghi lai quyet dinh kien truc/ky thuat quan trong voi ly do ro rang. " +
  "Dung khi chon A thay vi B, thay doi tech stack, hoac quyet dinh co anh huong lon den du an. " +
  "Giup team hieu 'tai sao' sau nay, tranh quay lai cac quyet dinh da bi bac bo.",
  {
    title: z.string().describe("Ten quyet dinh (VD: 'Dung LangGraph thay vi CrewAI')"),
    context: z.string().describe("Boi canh: dang o buoc nao cua du an, can giai quyet van de gi?"),
    decision: z.string().describe("Quyet dinh cu the la gi?"),
    alternatives: z.string().optional().describe("Cac phuong an khac da xem xet"),
    reasons: z.string().describe("Ly do chon phuong an nay"),
    tradeoffs: z.string().optional().describe("Trade-off, nhuoc diem cua quyet dinh nay"),
    project: z.string().optional().describe("Ten du an lien quan"),
  },
  async ({ title, context, decision, alternatives, reasons, tradeoffs, project }) => {
    const dir = path.join(VAULT_DIR, "35-DECISIONS");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const safeName = title.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9-]/g, "").substring(0, 60);
    const filename = `${today()}-${safeName}.md`;
    const filePath = path.join(dir, filename);

    let body = `---\ntags: [decision, architecture]\ndate: ${today()}\nstatus: accepted\n`;
    if (project) body += `project: "[[${project}]]"\n`;
    body += `---\n\n`;
    body += `# [Decision] ${title}\n\n`;
    body += `## Boi canh\n${context}\n\n`;
    body += `## Quyet dinh\n${decision}\n\n`;
    if (alternatives) body += `## Phuong an da xem xet\n${alternatives}\n\n`;
    body += `## Ly do chon\n${reasons}\n\n`;
    if (tradeoffs) body += `## Trade-offs\n${tradeoffs}\n\n`;
    body += `---\n> Date: ${today()} | Status: Accepted\n`;
    if (project) body += `> Project: [[${project}]]\n`;

    fs.writeFileSync(filePath, body, "utf-8");

    // v7: Auto-index into hybrid search DB
    if (dbReady && db) {
      indexSingleFile(db, VAULT_DIR, filePath).catch(e =>
        process.stderr.write(`[Longbrain] Index error: ${e.message}\n`)
      );
    }

    return {
      content: [{
        type: "text",
        text: `Da luu decision: ${filename}\n\nQuyet dinh "${title}" da duoc ghi lai voi ly do ro rang.`,
      }],
    };
  }
);

server.tool(
  "search_decisions",
  "Tim kiem trong lich su quyet dinh kien truc. " +
  "Dung khi muon biet 'truoc day da quyet dinh gi ve X?' hoac 'tai sao khong dung Y?' " +
  "v7: Hybrid search.",
  { query: z.string().describe("Tu khoa (VD: 'database', 'framework', 'API')") },
  async ({ query }) => {
    if (dbReady && db) {
      try {
        const { results, strategy } = await hybridSearch(db, query, { limit: 10, category: "35-DECISIONS" });
        if (results.length === 0) {
          return { content: [{ type: "text", text: `Khong tim thay decision lien quan den "${query}".` }] };
        }
        let output = `Tim thay ${results.length} decisions lien quan [${strategy}]:\n\n`;
        for (const r of results) {
          output += `## ${r.title} (RRF: ${r.rrf_score.toFixed(4)})\n`;
          output += `\`\`\`\n${r.snippet}\n\`\`\`\n\n`;
        }
        return { content: [{ type: "text", text: output }] };
      } catch (e) {
        process.stderr.write(`[Longbrain] search_decisions hybrid error: ${e.message}\n`);
      }
    }
    // Fallback
    const dir = path.join(VAULT_DIR, "35-DECISIONS");
    if (!fs.existsSync(dir)) {
      return { content: [{ type: "text", text: "Chua co decision nao. Dung add_decision de them." }] };
    }
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith(".md") && f !== "index.md")
      .map(f => ({ filename: f, name: f.replace(".md", ""), path: path.join(dir, f), category: "decision" }));

    if (files.length === 0) {
      return { content: [{ type: "text", text: "Chua co decision nao." }] };
    }

    const results = searchInFiles(files, query);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `Khong tim thay decision lien quan den "${query}".` }] };
    }

    let output = `Tim thay ${results.length} decisions lien quan [FALLBACK]:\n\n`;
    for (const r of results) {
      output += `## ${r.name}\n`;
      for (const s of r.snippets) output += `\`\`\`\n${s}\n\`\`\`\n`;
      output += "\n";
    }
    return { content: [{ type: "text", text: output }] };
  }
);

// ============================================================
// NEVER AGAIN SYSTEM
// ============================================================

const NEVER_AGAIN_DIR = path.join(VAULT_DIR, "00-NEVER-AGAIN");
const NEVER_AGAIN_INDEX = path.join(NEVER_AGAIN_DIR, "index.md");

server.tool(
  "add_never_again",
  "Luu vao danh sach 'KHONG BAO GIO LAP LAI'. Day la loai ky uc QUAN TRONG NHAT. " +
  "Goi khi gap loi nghiem trong, mat nhieu gio debug, hoac sai lam anh huong den client. " +
  "Hook se tu dong inject canh bao nay vao dau MOI session de Claude khong bao gio lap lai.",
  {
    title: z.string().describe("Ten loi ngan gon (VD: 'Unicode regex khong match tieng Viet')"),
    mistake: z.string().describe("Da lam gi sai? Mo ta cu the."),
    consequence: z.string().describe("Hau qua la gi? Mat bao nhieu gio? Anh huong gi?"),
    prevention: z.string().describe("Lan sau phai lam gi de tranh? Cach dung la gi?"),
    tags: z.array(z.string()).optional().describe("Tags (VD: ['regex', 'vietnamese', 'hook'])"),
  },
  async ({ title, mistake, consequence, prevention, tags }) => {
    if (!fs.existsSync(NEVER_AGAIN_DIR)) fs.mkdirSync(NEVER_AGAIN_DIR, { recursive: true });

    // Read existing index to get next ID
    const existingIndex = readFileSafe(NEVER_AGAIN_INDEX) || "# Never Again List\n\n";
    const matches = [...existingIndex.matchAll(/## \[NA-(\d+)\]/g)];
    const nextId = matches.length > 0
      ? String(Math.max(...matches.map(m => parseInt(m[1]))) + 1).padStart(3, "0")
      : "001";
    const id = `NA-${nextId}`;

    // Write individual file
    const safeName = title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, "-").substring(0, 50);
    const filename = `${id}-${safeName}.md`;
    const filePath = path.join(NEVER_AGAIN_DIR, filename);

    const tagList = tags ? tags.join(", ") : "never-again";
    let body = `---\ntags: [never-again, ${tagList}]\nid: ${id}\ndate: ${today()}\n---\n\n`;
    body += `# [${id}] ${title}\n\n`;
    body += `## Sai lam\n${mistake}\n\n`;
    body += `## Hau qua\n${consequence}\n\n`;
    body += `## Phong tranh\n${prevention}\n\n`;
    body += `---\n> Added: ${today()} | Severity: HIGH\n`;
    fs.writeFileSync(filePath, body, "utf-8");

    // Update master index (hook reads this for fast injection)
    const newEntry = `\n## [${id}] ${title}\n**Sai lam**: ${mistake.split("\n")[0]}\n**Hau qua**: ${consequence.split("\n")[0]}\n**Phong tranh**: ${prevention.split("\n")[0]}\n`;
    const updatedIndex = existingIndex.trimEnd() + "\n" + newEntry;
    fs.writeFileSync(NEVER_AGAIN_INDEX, updatedIndex, "utf-8");

    // v7: Auto-index into hybrid search DB
    if (dbReady && db) {
      indexSingleFile(db, VAULT_DIR, filePath).catch(e =>
        process.stderr.write(`[Longbrain] Index error: ${e.message}\n`)
      );
    }

    return {
      content: [{
        type: "text",
        text: `Da luu [${id}]: "${title}"\n\nCanh bao nay se duoc inject tu dong vao dau moi Claude session.\nFile: ${filename}`,
      }],
    };
  }
);

server.tool(
  "list_never_again",
  "Liet ke tat ca cac loi 'KHONG BAO GIO LAP LAI'. Xem danh sach canh bao dang duoc inject vao moi session.",
  {},
  async () => {
    const content = readFileSafe(NEVER_AGAIN_INDEX);
    if (!content || content.trim() === "# Never Again List") {
      return {
        content: [{
          type: "text",
          text: "Danh sach Never Again dang trong.\nDung add_never_again() khi gap loi nghiem trong.",
        }],
      };
    }
    return { content: [{ type: "text", text: content }] };
  }
);

// ============================================================
// HYBRID SEARCH TOOLS (v7)
// ============================================================

server.tool(
  "reindex_vault",
  "Index lai toan bo vault vao hybrid search DB. " +
  "Dung khi: lan dau chay v7, them nhieu files thu cong, hoac nghi DB bi loi.",
  {
    mode: z.enum(["incremental", "full"]).default("incremental").describe(
      "incremental: chi index files moi/thay doi | full: rebuild toan bo (xoa DB cu)"
    ),
  },
  async ({ mode }) => {
    if (!db) {
      initDB();
      if (!db) return { content: [{ type: "text", text: "Khong the khoi tao DB. Kiem tra better-sqlite3 va sqlite-vec." }] };
    }

    const startTime = Date.now();
    try {
      const stats = await reindexVault(db, VAULT_DIR, {
        forceAll: mode === "full",
        onProgress: (p) => process.stderr.write(`[Longbrain] Indexing: ${p.done}/${p.total}\n`),
      });
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      let output = `# Reindex Complete (${mode}) — ${elapsed}s\n\n`;
      output += `| Metric | Value |\n|--------|-------|\n`;
      output += `| Total files scanned | ${stats.total} |\n`;
      output += `| Added | ${stats.added} |\n`;
      output += `| Updated | ${stats.updated} |\n`;
      output += `| Skipped (unchanged) | ${stats.skipped} |\n`;
      output += `| Deleted | ${stats.deleted} |\n`;
      output += `| Embedded | ${stats.embedded} |\n`;
      if (stats.tokensUsed) output += `| Tokens used | ${stats.tokensUsed} |\n`;
      output += `\nDB: ${db.getDocCount()} docs, ${db.getVecCount()} vectors`;

      return { content: [{ type: "text", text: output }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Reindex error: ${e.message}` }] };
    }
  }
);

server.tool(
  "search_semantic",
  "Tim kiem thuan vector (semantic). Dung khi can tim y nghia tuong tu thay vi keyword chinh xac. " +
  "Tot cho: cau hoi tieng Viet, cross-language, mo ta khai niem.",
  {
    query: z.string().describe("Cau hoi hoac mo ta (VD: 'cach trien khai ung dung len server')"),
    limit: z.number().optional().default(10).describe("So ket qua toi da"),
  },
  async ({ query, limit }) => {
    if (!dbReady || !db) {
      return { content: [{ type: "text", text: "DB chua san sang. Chay reindex_vault truoc." }] };
    }

    try {
      const { embedSingle } = require("./embeddings");
      const queryEmbedding = await embedSingle(query);
      const vecResults = db.searchVector(queryEmbedding, limit);

      if (vecResults.length === 0) {
        return { content: [{ type: "text", text: `Khong tim thay ket qua semantic cho "${query}".` }] };
      }

      let output = `Tim thay ${vecResults.length} ket qua semantic cho "${query}":\n\n`;
      for (const r of vecResults) {
        const doc = db.getDocumentById(Number(r.id));
        if (!doc) continue;
        output += `## ${doc.title} [${doc.category}] (distance: ${r.distance.toFixed(4)})\n`;
        output += `\`\`\`\n${doc.content.substring(0, 500)}\n\`\`\`\n\n`;
      }
      return { content: [{ type: "text", text: output }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Semantic search error: ${e.message}` }] };
    }
  }
);

// --- Update vault_stats to include DB info ---
// (vault_stats already exists above, we enhance it via the DB)

// --- Start ---
async function main() {
  const transport = new StdioServerTransport();

  // Initialize hybrid search DB
  initDB();

  await server.connect(transport);
  process.stderr.write("[Longbrain v7.0] MCP Server started (23 tools, hybrid search)\n");

  // Background: incremental reindex
  if (dbReady && db) {
    (async () => {
      try {
        const stats = await reindexVault(db, VAULT_DIR, {
          onProgress: (p) => process.stderr.write(`[Longbrain] Indexing: ${p.done}/${p.total}\n`),
        });
        process.stderr.write(
          `[Longbrain] Index complete: ${stats.added} added, ${stats.updated} updated, ` +
          `${stats.skipped} skipped, ${stats.embedded} embedded\n`
        );
      } catch (e) {
        process.stderr.write(`[Longbrain] Background index error: ${e.message}\n`);
      }
    })();
  }
}

main().catch(err => {
  process.stderr.write(`[Longbrain] Fatal error: ${err.message}\n`);
  process.exit(1);
});
