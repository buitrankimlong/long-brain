# Never Again List

> Danh sach SAI LAM KHONG BAO GIO LAP LAI.
> Tu dong inject vao dau moi Claude session qua longbrain-context.js hook.
> Them muc moi: dung `add_never_again()` MCP tool.


## [NA-001] Unicode regex khong match tieng Viet
**Sai lam**: Dung /bats*dau/ truc tiep thay vi NFD normalize
**Hau qua**: Hook khong kich hoat khi user nhan tieng Viet — mat 2 gio debug
**Phong tranh**: Luon dung p.normalize("NFD").replace(/[̀-ͯ]/g, "") truoc khi match

## [NA-002] PHẢI deep research trước khi build bất kỳ hệ thống nào
**Sai lam**: Nhảy vào code ngay khi nhận task mà không research kỹ trước. Không tìm hiểu kinh nghiệm người khác, giới hạn kỹ thuật, edge cases, và các điểm cần lưu ý. Build xong mới phát hiện approach sai hoặc không hoạt động.
**Hau qua**: Build xong hệ thống nhưng không hoạt động, phải làm lại từ đầu. Mất thời gian, công sức. Ví dụ: build auto post FB Group bằng API mà không biết API đã bị xóa, hoặc build bằng Playwright mà không biết cần anti-detection → bị ban account ngay.
**Phong tranh**: LUÔN LUÔN deep research TRƯỚC KHI viết dòng code đầu tiên:

## [NA-003] PHẢI test model AI trước khi cho vào hệ thống
**Sai lam**: Đưa model AI (flux-kontext-pro) vào code production mà không test trước xem model đó có hoạt động với API key hiện tại, có bị rate limit, hay có support endpoint cần dùng không.
**Hau qua**: Chức năng tạo ảnh bị lỗi 429 trên production. User không dùng được tính năng. Mất thời gian debug và deploy lại.
**Phong tranh**: LUÔN test model AI bằng curl/script TRƯỚC khi hardcode vào hệ thống: 1) Test API key còn quota không, 2) Test model cụ thể có support endpoint cần dùng (images/edits, images/generations, chat/completions), 3) Test với dữ liệu thật (ảnh thật, prompt thật), 4) Chỉ sau khi test OK mới đưa vào code.

## [NA-004] KHONG copy .next/ tu Windows sang Linux deploy
**Sai lam**: Build Next.js trên Windows, copy .next/ folder lên VPS Linux. Prisma binary mismatch (windows vs debian-openssl-3.0.x). Next.js compile Windows absolute paths (C:\Abuss\) vào JS bundles. PM2 cache config cũ (standalone/server.js) không bị override bởi pm2 restart.
**Hau qua**: Admin panel crash loop (55 restarts). Mất ~2 giờ debug. UI hiển thị unstyled HTML (no CSS). Tất cả trang "Đang tải..." vô hạn.
**Phong tranh**: 1. CHỈ copy SOURCE code lên VPS (src/, prisma/, package.json). 2. Build TRÊN VPS (npm install + npx prisma generate + npx next build). 3. KHÔNG bao giờ copy .next/ folder cross-platform. 4. PM2: dùng pm2 delete + pm2 start ecosystem.config.js (KHÔNG pm2 restart khi đổi config).
