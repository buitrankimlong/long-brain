---
tags: [project, ai-knowledge-mcp]
status: hoan-thanh
started: 2026-04-15
client: Personal / Internal
stack: [Node.js, MCP (Model Context Protocol), Zod validation, File system API, Markdown processing]
updated: 2026-05-09
---

# AI-Knowledge-MCP

## Mo ta
MCP server cung cấp các tools để quản lý, tìm kiếm và cập nhật Second Brain - một hệ thống lưu trữ kiến thức toàn diện (20 categories kiến thức + 5 sections cuộc sống). Server exposes 15+ tools để làm việc với vault Obsidian, hỗ trợ search, read, add knowledge files, quản lý projects, learnings, và curation vault.

## Stack
- Node.js
- MCP (Model Context Protocol)
- Zod validation
- File system API
- Markdown processing

## Quyet dinh quan trong
1. Dùng MCP SDK làm giao thức - cho phép Claude + tools khác giao tiếp chuẩn hóa. 2. 20 knowledge categories + 5 life sections riêng biệt - structure rõ ràng, dễ navigate. 3. Mỗi knowledge file phải có "-Knowledge.md" suffix để phân biệt. 4. Project, Learning files riêng folder - dễ aggregate + tìm kiếm. 5. Frontmatter YAML cho metadata (tags, date, MOC links) - dễ parse, dễ extend. 6. Search dùng simple keyword matching + scoring - nhanh, đủ dùng cho vault nhỏ-vừa. 7. Tools hỗ trợ Vietnamese descriptions - match với use case local. 8. Curate vault tool để phát hiện duplicates, thin files, missing frontmatter.

## Bai hoc rut ra
1. File system là best choice cho Second Brain - no vendor lock-in, dễ backup + version control với Git. 2. Frontmatter YAML + Obsidian links [[...]] cho phép inter-file connections mạnh mẽ. 3. Search scoring dựa name + content match đủ tốt cho 500-1000 files, không cần vector DB lúc này. 4. Separate tools cho add_knowledge vs update_knowledge - prevent overwrite accidents. 5. Project blueprint extraction rất hữu ích - capture lại stack + decisions từ projects cũ để reuse. 6. Learnings file naming (YYYY-MM-DD prefix) tự động sort by date, dễ browse recent lessons. 7. MCP protocol standardization cho phép tools này tái sử dụng cho multiple AI agents (Claude, local models, etc). 8. Vault stats + curate_vault tools là critical cho maintenance - prevent knowledge base decay.

## Ket qua
✅ Server hoàn thành + đang sử dụng. 15 MCP tools đang active: search_knowledge, get_moc, get_knowledge_file, list_categories, add_knowledge, update_knowledge, add_project, search_projects, list_projects, add_learning, search_learnings, curate_vault, get_project_blueprint, vault_stats, get_dashboard. Tích hợp thành công với Claude Code - dùng làm Second Brain MCP cho toàn bộ development workflow. Vault hiện chứa 20+ knowledge files, 10+ projects, 30+ learnings - kích thước ~ 500KB, tốc độ search < 100ms.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
