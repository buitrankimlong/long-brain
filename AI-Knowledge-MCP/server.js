const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const fs = require("fs");
const path = require("path");

// --- Config ---
const VAULT_ROOT = process.env.AI_KNOWLEDGE_VAULT || "C:\\AI Build Learning";
const VAULT_DIR = path.join(VAULT_ROOT, "AI Knowledge Build");
const RESEARCH_DIR = path.join(VAULT_ROOT, "research");

const CATEGORIES = {
  "01": { folder: "01-AI-FOUNDATIONS", moc: "01 Nen Tang AI", desc: "Khoa hoc, khai niem AI co ban" },
  "02": { folder: "02-AGENT-FRAMEWORKS", moc: "02 Agent Frameworks", desc: "LangChain, CrewAI, LangGraph, OpenAI, Google ADK" },
  "03": { folder: "03-LLM-MODELS", moc: "03 Mo Hinh LLM", desc: "Models commercial + open source" },
  "04": { folder: "04-PROTOCOLS", moc: "04 Giao Thuc MCP A2A", desc: "MCP, A2A, function calling" },
  "05": { folder: "05-PLATFORMS", moc: "05 Nen Tang Chatbot", desc: "Chatbot platforms, AI builders" },
  "06": { folder: "06-KNOWLEDGE-MEMORY", moc: "06 RAG va Bo Nho AI", desc: "RAG, GraphRAG, vector DB, research" },
  "07": { folder: "07-MARKETING", moc: "07 Marketing Tu Dong", desc: "Tu dong marketing, social, content" },
  "08": { folder: "08-SALES", moc: "08 Ban Hang Tu Dong", desc: "Chatbot ban hang, CRM, lead gen" },
  "09": { folder: "09-CONTENT-PRODUCTION", moc: "09 San Xuat Noi Dung", desc: "Video, blog, social media workflows" },
  "10": { folder: "10-EMAIL-MARKETING", moc: "10 Email Marketing", desc: "Platforms, design, automation" },
  "11": { folder: "11-SYSTEM-DESIGN", moc: "11 Thiet Ke He Thong", desc: "Architecture, patterns, scaling" },
  "12": { folder: "12-DEPLOYMENT", moc: "12 Trien Khai", desc: "Docker, K8s, cloud, CI/CD" },
  "13": { folder: "13-PACKAGING", moc: "13 Dong Goi San Pham", desc: "White-label, SaaS, multi-tenant" },
  "14": { folder: "14-CLAUDE-CODE", moc: "14 Claude Code", desc: "Multi-agent, hooks, optimization" },
  "15": { folder: "15-OBSIDIAN-BRAIN", moc: "15 Bo Nao Obsidian", desc: "Second brain, memory systems" },
  "16": { folder: "16-VIETNAM-MARKET", moc: "16 Thi Truong Viet Nam", desc: "Zalo, PhoBERT, MoMo/VNPay" },
  "17": { folder: "17-AI-MODELS-CATALOG", moc: "17 Catalog Mo Hinh AI", desc: "Image, video, audio, LLM pricing" },
  "18": { folder: "18-TOOLS-CATALOG", moc: "18 Catalog Cong Cu", desc: "Scraping, monitoring, CRM, email" },
  "19": { folder: "19-BUSINESS-AGENCY", moc: "19 Kinh Doanh Agency", desc: "Client acquisition, contracts, SOPs" },
  "20": { folder: "20-TRENDS-RESOURCES", moc: "20 Xu Huong va Tai Nguyen", desc: "Xu huong 2026-2027, communities" },
};

const LIFE_SECTIONS = {
  "30": { folder: "30-PROJECTS", moc: "30 Du An", desc: "Du an da lam, dang lam" },
  "31": { folder: "31-JOURNAL", moc: "31 Nhat Ky", desc: "Nhat ky lam viec" },
  "32": { folder: "32-LEARNINGS", moc: "32 Bai Hoc Duc Ket", desc: "Kinh nghiem thuc te" },
  "33": { folder: "33-PEOPLE-CONTACTS", moc: "33 Quan He", desc: "Contacts, clients" },
  "34": { folder: "34-IDEAS", moc: "34 Y Tuong", desc: "Y tuong san pham, kinh doanh" },
};

// --- Helpers ---
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
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

function searchInFiles(files, query) {
  const terms = query.toLowerCase().split(/\s+/);
  const results = [];

  for (const file of files) {
    const content = readFileSafe(file.path);
    if (!content) continue;
    const lower = content.toLowerCase();
    const nameMatch = terms.some(t => file.name.toLowerCase().includes(t));
    const contentMatch = terms.filter(t => lower.includes(t)).length;

    if (nameMatch || contentMatch > 0) {
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
        category: file.category || "research",
        score: (nameMatch ? 10 : 0) + contentMatch,
        snippets,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// --- MCP Server ---
const server = new McpServer({
  name: "second-brain",
  version: "2.0.0",
});

// ==========================================
// KNOWLEDGE TOOLS
// ==========================================

server.tool(
  "search_knowledge",
  "Tim kiem trong TOAN BO second brain: knowledge files, research, projects, bai hoc. Luon dung tool nay TRUOC khi code bat ky ky thuat phuc tap nao.",
  { query: z.string().describe("Tu khoa tim kiem (VD: 'LangGraph state', 'Lark API', 'chatbot Zalo')") },
  async ({ query }) => {
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
          text: `KHONG TIM THAY kien thuc ve "${query}" trong second brain.\n\nHANH DONG: Dung WebSearch/WebFetch de research, roi dung add_knowledge de luu vao vault.`,
        }],
      };
    }

    let output = `Tim thay ${results.length} ket qua cho "${query}":\n\n`;
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
  "get_moc",
  "Doc noi dung 1 MOC (Map of Content). Dung de xem tong quan 1 category.",
  { category_id: z.string().describe("ID category: '01'-'20' (knowledge) hoac '30'-'34' (life)") },
  async ({ category_id }) => {
    const cat = CATEGORIES[category_id] || LIFE_SECTIONS[category_id];
    if (!cat) {
      return { content: [{ type: "text", text: `Category "${category_id}" khong ton tai. Dung list_categories.` }] };
    }
    const mocPath = path.join(VAULT_DIR, cat.folder, `${cat.moc}.md`);
    const content = readFileSafe(mocPath);
    return { content: [{ type: "text", text: content || `MOC khong ton tai: ${cat.moc}` }] };
  }
);

server.tool(
  "get_knowledge_file",
  "Doc noi dung 1 file cu the (knowledge, research, project, learning).",
  { filename: z.string().describe("Ten file (VD: 'LangGraph-Code-Knowledge.md')") },
  async ({ filename }) => {
    if (!filename.endsWith(".md")) filename += ".md";

    // Search in all locations
    const searchDirs = [
      ...Object.values(CATEGORIES).map(c => path.join(VAULT_DIR, c.folder)),
      ...Object.values(LIFE_SECTIONS).map(c => path.join(VAULT_DIR, c.folder)),
      RESEARCH_DIR,
    ];

    for (const dir of searchDirs) {
      const filePath = path.join(dir, filename);
      const content = readFileSafe(filePath);
      if (content) return { content: [{ type: "text", text: content }] };
    }

    return { content: [{ type: "text", text: `Khong tim thay: ${filename}` }] };
  }
);

server.tool(
  "list_categories",
  "Liet ke tat ca categories (knowledge + life sections).",
  {},
  async () => {
    const knowledgeFiles = getAllKnowledgeFiles();
    let output = "# Second Brain - Categories\n\n## KIEN THUC\n";
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
  "Them 1 knowledge file moi vao vault. Dung sau khi research xong.",
  {
    category_id: z.string().describe("ID category: '01'-'20'"),
    name: z.string().describe("Ten (VD: 'Lark-API' -> tao Lark-API-Knowledge.md)"),
    content: z.string().describe("Noi dung markdown"),
    tags: z.array(z.string()).optional().describe("Tags"),
  },
  async ({ category_id, name, content, tags }) => {
    const cat = CATEGORIES[category_id];
    if (!cat) return { content: [{ type: "text", text: `Category khong ton tai.` }] };

    const safeName = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const filename = `${safeName}-Knowledge.md`;
    const filePath = path.join(VAULT_DIR, cat.folder, filename);

    if (fs.existsSync(filePath)) {
      return { content: [{ type: "text", text: `Da ton tai: ${filename}. Dung update_knowledge.` }] };
    }

    const tagList = tags || [safeName.toLowerCase()];
    const fm = `---\ntags: [${tagList.join(", ")}]\ndescription: ${name}\ncreated: ${today()}\nmoc: "[[${cat.moc}]]"\n---\n\n`;
    fs.writeFileSync(filePath, fm + content, "utf-8");

    return { content: [{ type: "text", text: `Da tao: ${filename} trong ${cat.folder}` }] };
  }
);

server.tool(
  "update_knowledge",
  "Them noi dung vao cuoi 1 knowledge file da ton tai.",
  {
    filename: z.string().describe("Ten file"),
    content: z.string().describe("Noi dung moi"),
  },
  async ({ filename, content }) => {
    if (!filename.endsWith(".md")) filename += ".md";

    const searchDirs = Object.values(CATEGORIES).map(c => path.join(VAULT_DIR, c.folder));
    for (const dir of searchDirs) {
      const filePath = path.join(dir, filename);
      const existing = readFileSafe(filePath);
      if (existing) {
        fs.writeFileSync(filePath, existing + "\n\n" + content, "utf-8");
        return { content: [{ type: "text", text: `Da cap nhat: ${filename}` }] };
      }
    }
    return { content: [{ type: "text", text: `Khong tim thay: ${filename}` }] };
  }
);

// ==========================================
// PROJECT TOOLS
// ==========================================

server.tool(
  "add_project",
  "Ghi lai 1 du an (moi hoac cu). Luu toan bo thong tin: stack, quyet dinh, bai hoc, ket qua.",
  {
    name: z.string().describe("Ten du an (VD: 'AI-Chatbot-Zalo')"),
    status: z.enum(["dang-lam", "hoan-thanh", "tam-dung"]).describe("Trang thai"),
    started: z.string().optional().describe("Ngay bat dau (YYYY-MM-DD)"),
    client: z.string().optional().describe("Ten khach hang"),
    stack: z.array(z.string()).optional().describe("Tech stack"),
    description: z.string().describe("Mo ta du an"),
    decisions: z.string().optional().describe("Cac quyet dinh quan trong"),
    learnings: z.string().optional().describe("Bai hoc rut ra"),
    outcome: z.string().optional().describe("Ket qua"),
  },
  async ({ name, status, started, client, stack, description, decisions, learnings, outcome }) => {
    const safeName = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const filename = `${safeName}.md`;
    const filePath = path.join(VAULT_DIR, "30-PROJECTS", filename);

    let content = `---\ntags: [project, ${safeName.toLowerCase()}]\nstatus: ${status}\nstarted: ${started || today()}\n`;
    if (client) content += `client: ${client}\n`;
    if (stack) content += `stack: [${stack.join(", ")}]\n`;
    content += `updated: ${today()}\n---\n\n`;
    content += `# ${name}\n\n`;
    content += `## Mo ta\n${description}\n\n`;
    if (stack) content += `## Stack\n${stack.map(s => `- ${s}`).join("\n")}\n\n`;
    if (decisions) content += `## Quyet dinh quan trong\n${decisions}\n\n`;
    if (learnings) content += `## Bai hoc rut ra\n${learnings}\n\n`;
    if (outcome) content += `## Ket qua\n${outcome}\n\n`;
    content += `## Lien ket\n-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]\n`;

    fs.writeFileSync(filePath, content, "utf-8");
    return { content: [{ type: "text", text: `Da luu du an: ${filename}\nPath: ${filePath}` }] };
  }
);

server.tool(
  "search_projects",
  "Tim kiem trong cac du an da lam. Dung khi can biet 'toi da tung build cai nay chua?' hoac 'du an nao dung tech nay?'",
  { query: z.string().describe("Tu khoa (VD: 'chatbot', 'Lark', 'NextJS', 'CRM')") },
  async ({ query }) => {
    const projects = getAllProjectFiles();
    if (projects.length === 0) {
      return { content: [{ type: "text", text: "Chua co du an nao trong vault. Dung add_project de them." }] };
    }

    const results = searchInFiles(projects, query);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `Khong tim thay du an lien quan den "${query}".` }] };
    }

    let output = `Tim thay ${results.length} du an lien quan den "${query}":\n\n`;
    for (const r of results) {
      output += `## ${r.file}\n`;
      for (const s of r.snippets) {
        output += `\`\`\`\n${s}\n\`\`\`\n`;
      }
      output += "\n";
    }
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "list_projects",
  "Liet ke tat ca du an trong vault voi trang thai.",
  {},
  async () => {
    const projDir = path.join(VAULT_DIR, "30-PROJECTS");
    if (!fs.existsSync(projDir)) return { content: [{ type: "text", text: "Chua co du an." }] };

    const files = fs.readdirSync(projDir).filter(f => f.endsWith(".md") && f !== "30 Du An.md");
    if (files.length === 0) return { content: [{ type: "text", text: "Chua co du an nao." }] };

    let output = "# Tat ca du an\n\n| Du an | Status | Stack |\n|-------|--------|-------|\n";
    for (const f of files) {
      const content = readFileSafe(path.join(projDir, f)) || "";
      const statusMatch = content.match(/status:\s*(.+)/);
      const stackMatch = content.match(/stack:\s*\[(.+)\]/);
      const status = statusMatch ? statusMatch[1].trim() : "?";
      const stack = stackMatch ? stackMatch[1] : "?";
      output += `| ${f.replace(".md", "")} | ${status} | ${stack} |\n`;
    }
    return { content: [{ type: "text", text: output }] };
  }
);

// ==========================================
// LEARNING TOOLS
// ==========================================

server.tool(
  "add_learning",
  "Ghi lai 1 bai hoc rut ra tu qua trinh lam viec. Day la noi quy gia nhat cua second brain.",
  {
    title: z.string().describe("Mo ta ngan (VD: 'Cach xu ly rate limit Lark API')"),
    context: z.string().describe("Boi canh: van de gap phai la gi?"),
    solution: z.string().describe("Giai phap da ap dung"),
    takeaway: z.string().describe("Duc ket: lan sau gap tuong tu thi lam gi?"),
    project: z.string().optional().describe("Ten du an lien quan"),
    tags: z.array(z.string()).optional().describe("Tags"),
    code_snippet: z.string().optional().describe("Code/config mau"),
  },
  async ({ title, context, solution, takeaway, project, tags, code_snippet }) => {
    const safeName = title.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").substring(0, 60);
    const filename = `${today()}-${safeName}.md`;
    const filePath = path.join(VAULT_DIR, "32-LEARNINGS", filename);

    const tagList = tags || ["learning"];
    let content = `---\ntags: [learning, ${tagList.join(", ")}]\ndate: ${today()}\n`;
    if (project) content += `project: "[[${project}]]"\n`;
    content += `---\n\n`;
    content += `# ${title}\n\n`;
    content += `## Boi canh\n${context}\n\n`;
    content += `## Giai phap\n${solution}\n\n`;
    content += `## Duc ket\n${takeaway}\n\n`;
    if (code_snippet) content += `## Code mau\n\`\`\`\n${code_snippet}\n\`\`\`\n\n`;
    content += `## Lien ket\n-> [[32 Bai Hoc Duc Ket]]`;
    if (project) content += ` | [[${project}]]`;
    content += "\n";

    fs.writeFileSync(filePath, content, "utf-8");
    return { content: [{ type: "text", text: `Da luu bai hoc: ${filename}` }] };
  }
);

server.tool(
  "search_learnings",
  "Tim kiem trong cac bai hoc da duc ket. Dung khi gap van de va muon biet 'minh da giai quyet cai nay bao gio chua?'",
  { query: z.string().describe("Tu khoa") },
  async ({ query }) => {
    const learnings = getAllLearningFiles();
    if (learnings.length === 0) {
      return { content: [{ type: "text", text: "Chua co bai hoc nao. Dung add_learning de them." }] };
    }
    const results = searchInFiles(learnings, query);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `Khong tim thay bai hoc lien quan den "${query}".` }] };
    }

    let output = `Tim thay ${results.length} bai hoc lien quan:\n\n`;
    for (const r of results) {
      output += `## ${r.file}\n`;
      for (const s of r.snippets) {
        output += `\`\`\`\n${s}\n\`\`\`\n`;
      }
      output += "\n";
    }
    return { content: [{ type: "text", text: output }] };
  }
);

// ==========================================
// CURATION & CONSOLIDATION TOOLS
// ==========================================

server.tool(
  "curate_vault",
  "Quet toan bo vault, phan tich chat luong, tim duplicates, files outdated. Tra ve bao cao de quyet dinh giu/xoa/merge.",
  {},
  async () => {
    const knowledgeFiles = getAllKnowledgeFiles();
    const learnings = getAllLearningFiles();
    const projects = getAllProjectFiles();

    // Analyze knowledge files
    const analysis = [];
    const wordCounts = {};
    for (const f of knowledgeFiles) {
      const content = readFileSafe(f.path) || "";
      const lines = content.split("\n").length;
      const words = content.split(/\s+/).length;
      const hasCodeExamples = content.includes("```");
      const hasFrontmatter = content.startsWith("---");
      const created = content.match(/created:\s*(\S+)/);
      const hasLinks = content.includes("[[");

      // Track potential duplicates by keywords
      const nameKey = f.name.toLowerCase().replace(/\s+/g, " ");
      if (!wordCounts[nameKey]) wordCounts[nameKey] = [];
      wordCounts[nameKey].push(f.filename);

      let quality = "GOOD";
      const issues = [];
      if (lines < 20) { quality = "THIN"; issues.push("it hon 20 dong"); }
      if (!hasCodeExamples) { issues.push("khong co code examples"); }
      if (!hasFrontmatter) { issues.push("thieu frontmatter"); }
      if (words < 100) { quality = "STUB"; issues.push("it hon 100 tu"); }

      if (issues.length > 0) {
        analysis.push({ file: f.filename, category: f.category, quality, lines, words, issues });
      }
    }

    // Find potential duplicates (similar names)
    const dupes = [];
    const allFiles = [...knowledgeFiles, ...learnings, ...projects];
    for (let i = 0; i < allFiles.length; i++) {
      for (let j = i + 1; j < allFiles.length; j++) {
        const a = allFiles[i].name.toLowerCase();
        const b = allFiles[j].name.toLowerCase();
        const commonWords = a.split(" ").filter(w => w.length > 3 && b.includes(w));
        if (commonWords.length >= 2) {
          dupes.push({ file1: allFiles[i].filename, file2: allFiles[j].filename, common: commonWords.join(", ") });
        }
      }
    }

    let output = `# Vault Curation Report\n\n`;
    output += `## Thong ke\n`;
    output += `- Knowledge files: ${knowledgeFiles.length}\n`;
    output += `- Learning files: ${learnings.length}\n`;
    output += `- Project files: ${projects.length}\n\n`;

    if (analysis.length > 0) {
      output += `## Files can cai thien (${analysis.length})\n`;
      output += `| File | Category | Quality | Lines | Issues |\n|------|----------|---------|-------|--------|\n`;
      for (const a of analysis) {
        output += `| ${a.file} | ${a.category} | ${a.quality} | ${a.lines} | ${a.issues.join(", ")} |\n`;
      }
      output += "\n";
    }

    if (dupes.length > 0) {
      output += `## Co the trung lap (${dupes.length})\n`;
      output += `| File 1 | File 2 | Tu chung |\n|--------|--------|----------|\n`;
      for (const d of dupes.slice(0, 20)) {
        output += `| ${d.file1} | ${d.file2} | ${d.common} |\n`;
      }
      output += "\n";
    }

    output += `## Empty categories\n`;
    for (const [id, cat] of Object.entries(CATEGORIES)) {
      const count = knowledgeFiles.filter(f => f.category_id === id).length;
      if (count === 0) output += `- ${cat.moc} (${id})\n`;
    }

    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "get_project_blueprint",
  "Tao blueprint tai su dung tu 1 du an cu. Rut trich stack, architecture, patterns, config de dung lam template cho du an moi tuong tu.",
  { project_name: z.string().describe("Ten du an (VD: 'AI-Chatbot-Zalo')") },
  async ({ project_name }) => {
    const projDir = path.join(VAULT_DIR, "30-PROJECTS");
    const files = fs.existsSync(projDir) ? fs.readdirSync(projDir) : [];

    // Find matching project
    const match = files.find(f => f.toLowerCase().includes(project_name.toLowerCase().replace(/\s+/g, "-")));
    if (!match) {
      return { content: [{ type: "text", text: `Khong tim thay du an: ${project_name}. Dung list_projects de xem.` }] };
    }

    const content = readFileSafe(path.join(projDir, match)) || "";

    // Extract blueprint components
    const stackMatch = content.match(/## Stack[\s\S]*?(?=##|$)/);
    const decisionsMatch = content.match(/## Quyet dinh[\s\S]*?(?=##|$)/);
    const learningsMatch = content.match(/## Bai hoc[\s\S]*?(?=##|$)/);

    // Find related learnings
    const learnings = getAllLearningFiles();
    const related = searchInFiles(learnings, project_name);

    let blueprint = `# Blueprint: ${match.replace(".md", "")}\n\n`;
    blueprint += `> Template tai su dung tu du an da lam thanh cong.\n\n`;
    if (stackMatch) blueprint += stackMatch[0] + "\n";
    if (decisionsMatch) blueprint += decisionsMatch[0] + "\n";
    if (learningsMatch) blueprint += learningsMatch[0] + "\n";

    if (related.length > 0) {
      blueprint += `## Bai hoc lien quan\n`;
      for (const r of related) {
        blueprint += `- ${r.file}\n`;
        if (r.snippets.length > 0) blueprint += `  ${r.snippets[0].split("\n")[0]}\n`;
      }
    }

    blueprint += `\n## Checklist khi build lai\n`;
    blueprint += `- [ ] Setup project structure\n`;
    blueprint += `- [ ] Install dependencies (xem Stack)\n`;
    blueprint += `- [ ] Apply architecture decisions\n`;
    blueprint += `- [ ] Review bai hoc de tranh sai lam cu\n`;
    blueprint += `- [ ] Test core functionality\n`;

    return { content: [{ type: "text", text: blueprint }] };
  }
);

server.tool(
  "vault_stats",
  "Thong ke nhanh toan bo second brain: so files, categories, du an, bai hoc.",
  {},
  async () => {
    const k = getAllKnowledgeFiles().length;
    const r = getAllResearchFiles().length;
    const p = getAllProjectFiles().length;
    const l = getAllLearningFiles().length;

    // Count journal entries
    const journalDir = path.join(VAULT_DIR, "31-JOURNAL");
    const j = fs.existsSync(journalDir) ? fs.readdirSync(journalDir).filter(f => f.endsWith(".md") && f !== "31 Nhat Ky.md").length : 0;

    // Count ideas
    const ideasDir = path.join(VAULT_DIR, "34-IDEAS");
    const i = fs.existsSync(ideasDir) ? fs.readdirSync(ideasDir).filter(f => f.endsWith(".md") && f !== "34 Y Tuong.md").length : 0;

    const total = k + r + p + l + j + i;
    let output = `# Second Brain Stats\n\n`;
    output += `| Loai | So luong |\n|------|----------|\n`;
    output += `| Knowledge files | ${k} |\n`;
    output += `| Research files | ${r} |\n`;
    output += `| Du an | ${p} |\n`;
    output += `| Bai hoc | ${l} |\n`;
    output += `| Journal entries | ${j} |\n`;
    output += `| Y tuong | ${i} |\n`;
    output += `| **TONG** | **${total}** |\n`;

    return { content: [{ type: "text", text: output }] };
  }
);

// ==========================================
// DASHBOARD
// ==========================================

server.tool(
  "get_dashboard",
  "Doc Dashboard - trang tong quan cua second brain.",
  {},
  async () => {
    const content = readFileSafe(path.join(VAULT_DIR, "00-HOME", "Dashboard.md"));
    return { content: [{ type: "text", text: content || "Dashboard khong ton tai." }] };
  }
);

// --- Start ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
