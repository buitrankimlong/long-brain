# Second Brain - Bộ Não Thứ 2

## ĐÂY LÀ GÌ
Bộ não thứ 2 trọn đời. Mọi kiến thức, dự án, bài học, ý tưởng đều ở đây.
MCP Server "second-brain" cung cấp tools truy xuất từ BẤT KỲ dự án nào.

## GIAO THỨC 1: RESEARCH-FIRST (BẮT BUỘC)
Khi gặp kỹ thuật phức tạp, PHẢI theo thứ tự:
1. `search_knowledge("từ khóa")` → Tìm trong vault
2. `search_projects("từ khóa")` → Đã từng build chưa?
3. `search_learnings("từ khóa")` → Có bài học cũ không?
4. Không có → Deep research (WebSearch/WebFetch) → `add_knowledge` để lưu
5. Code xong → `add_learning` để đúc kết

## GIAO THỨC 2: PARALLEL RESEARCH (Khi cần nhiều kiến thức)
Khi task cần >= 3 kỹ thuật/kiến thức khác nhau:
1. Xác định các chủ đề cần research
2. Spawn nhiều `deep-researcher` agents SONG SONG (mỗi agent 1 chủ đề)
3. Thu thập kết quả → Tổng hợp → Bắt đầu code
Ví dụ: Build chatbot Zalo cần [Zalo API, LangGraph, PostgreSQL] → 3 agents song song

## GIAO THỨC 3: PROJECT DECOMPOSITION (Khi project lớn)
Khi project có >= 5 files hoặc >= 3 modules:
1. Spawn `project-analyzer` agent để phân tích codebase
2. Nhận danh sách tasks đã chia theo batch (độc lập, không conflict)
3. Chạy `search_projects` xem đã build tương tự chưa → `get_project_blueprint`
4. Batch 1: Spawn agents song song cho các tasks độc lập
5. Batch 2+: Tasks phụ thuộc, chạy tuần tự

## GIAO THỨC 4: QUALITY GATE (Lọc rác)
Sau khi code hoặc research xong:
1. Spawn `quality-reviewer` agent để review
2. Reviewer cho điểm: PASS / NEEDS_FIX / CRITICAL
3. NEEDS_FIX → sửa rồi review lại
4. CRITICAL → dừng, phân tích root cause
5. PASS → tiếp tục

## GIAO THỨC 5: AUTO-RETROSPECTIVE (Tự đúc kết)
Sau mỗi milestone quan trọng (hoàn thành feature, fix bug lớn, deploy):
1. Spawn `retrospective` agent chạy background
2. Agent phân tích: đã làm gì, gặp gì, giải quyết sao
3. Tự động gọi `add_learning` cho mỗi bài học
4. Update project file nếu cần

## CẤU TRÚC VAULT
- Knowledge (01-20): 20 categories kiến thức AI/tech
- Projects (30): Mọi dự án đã/đang làm
- Journal (31): Nhật ký làm việc
- Learnings (32): Bài học đúc kết (quý giá nhất)
- Contacts (33): Khách hàng, đối tác
- Ideas (34): Ý tưởng chưa thực hiện

## CUSTOM AGENTS (.claude/agents/)
- `deep-researcher` - Research sâu 1 chủ đề, lưu vào vault
- `project-analyzer` - Phân tích project lớn, chia tasks
- `quality-reviewer` - Review code/knowledge, lọc rác
- `retrospective` - Đúc kết bài học sau mỗi milestone

## QUY TẮC VÀNG
- Sonnet cho agents con (tiết kiệm 5x), Opus cho reasoning phức tạp
- Mỗi agent PHẢI có file boundaries rõ ràng (tránh conflict)
- Knowledge mới PHẢI có: concept + code example + best practices
- Không lưu rác: chỉ lưu kiến thức đã validate, có giá trị tái sử dụng
