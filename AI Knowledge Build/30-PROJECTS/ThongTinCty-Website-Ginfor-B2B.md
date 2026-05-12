---
tags: [project, thongtincty-website-ginfor-b2b]
status: dang-lam
started: 2026-04-25
client: ThongTinCty (Ginfor)
stack: [React 19, Vite 6, TypeScript 5.8, Tailwind CSS 4, shadcn/ui, Supabase, React Query, React Hook Form, Zod, Wouter, Lucide Icons, i18next, Motion]
updated: 2026-05-09
---

# ThongTinCty-Website-Ginfor-B2B

## Mo ta
Ginfor B2B — nền tảng kết nối doanh nghiệp và đấu thầu B2B. Frontend-only React SPA + Supabase backend (Auth + Postgres + Storage). 7 pages chính: Auth, Profile, Feed, Network, Opportunities, Events. 4 feature modules: auth, feed, network, opportunities. Đã hoàn thiện 95% feature code, đang chờ migrate dữ liệu và deploy. Light theme, blue+gray palette, shadcn/ui components, Tailwind v4, i18n (EN/VI).

## Stack
- React 19
- Vite 6
- TypeScript 5.8
- Tailwind CSS 4
- shadcn/ui
- Supabase
- React Query
- React Hook Form
- Zod
- Wouter
- Lucide Icons
- i18next
- Motion

## Quyet dinh quan trong
Lựa chọn Supabase thay vì custom backend để giảm phức tạp và tăng tốc độ phát triển. Frontend-only SPA với Supabase RLS bảo vệ data. Dùng factory pattern (createCrud) cho CRUD operations thay vì viết hàm lặp. Tailwind v4 + @theme tokens thay vì CSS-in-JS. Wouter thay vì React Router để giảm bundle size. Icons dùng lucide-react duy nhất (không heroicons hay material-symbols). Mobile-first responsive design. i18n với dictionary modular cho EN/VI. Light theme duy nhất (không dark mode).

## Bai hoc rut ra
Field naming convention rất quan trọng: 1 field logic = 1 camelCase app name + 1 snake_case DB name, không dùng alias. Mapper dùng strip-undefined pattern thay vì ?? null để tránh wipe field khác. Upload avatar cần dùng UploadsService thay vì base64 trong DB. Login redirect cần delay 500ms để đợi user state sync từ session. localStorage tracking prevention (Edge) → dùng createSafeStorage() fallback in-memory. Database trigger handle_new_user cần defensive try/catch. Tailwind v4 @theme tokens giảm custom CSS. shadcn/ui components rất mạnh, không nên tự viết lại Button/Card/Input/Dialog. React Query persist client cần caution với cross-user cache invalidation.

## Ket qua
Codebase sạch, full TypeScript strict, 0 errors. 7 pages + 4 features hoàn thiện. 60+ shadcn/ui components. 16 dòng lệnh npm + Supabase CLI. 6 email templates (EN/VI). 19 bảng Supabase với RLS. Mock server cho dev. Design System doc + CLAUDE.md guide. Sẵn sàng deploy. Chờ: (1) migrate dữ liệu real từ old system, (2) setup Resend SMTP (đã config domain thongtincty.com), (3) deploy lên Vercel/VPS. Code quality cao, maintenance dễ, scalable cho team phát triển tiếp.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
