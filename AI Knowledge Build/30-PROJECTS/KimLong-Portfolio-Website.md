---
tags: [project, kimlong-portfolio-website]
status: hoan-thanh
started: 2026-05-09
stack: [HTML5, CSS3, JavaScript, Tailwind CSS, AOS (Animate On Scroll), Font Awesome Icons]
updated: 2026-05-09
---

# KimLong-Portfolio-Website

## Mo ta
Portfolio cá nhân của Bùi Trần Kim Long - trang web Glassmorphism hiển thị 3 dự án chính (Data Analysis, Fintech, Finance). Tính năng chuyển ngôn ngữ EN/VN với toggle button có icon cờ, animations smooth, dark theme chuyên nghiệp.

## Stack
- HTML5
- CSS3
- JavaScript
- Tailwind CSS
- AOS (Animate On Scroll)
- Font Awesome Icons

## Quyet dinh quan trong
- Dùng Glassmorphism + dark background (#0f172a) cho vẻ hiện đại\n- Implement toggle EN/VN với CSS transitions smooth (0.4s cubic-bezier)\n- Cấu trúc folder tách riêng images, projects để dễ scale\n- Icon swap bằng CSS transforms (scale, rotate) thay vì JavaScript\n- Tailwind + custom theme color (accent-blue, accent-cyan, accent-purple)

## Bai hoc rut ra
Thiết kế toggle button ngôn ngữ chuyên nghiệp: xử lý state CSS checked, icon transitions (opacity + rotate), text swap (position absolute + transform), border/background color changes. Đã patch bug: tăng transform value (2.5rem) để match thumb position chính xác.

## Ket qua
Portfolio hoàn chỉnh, responsive, 4 trang HTML (index + 3 project detail pages), visual branding rõ ràng, UX toggle ngôn ngữ intuitif.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

index.html:
```html
<!DOCTYPE html>
<html lang="vi" class="scroll-smooth overflow-x-hidden">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bùi Trần Kim Long - Data & Fintech Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'], display: ['Space Grotesk', 'sans-serif'] },
                    colors: { dark: { 900: '#0f172a', 800: '#1e293b', 700: '#334155' }, accent: { blue: '#3b82f6', cyan: '#06b6d4', purple: '#8b5cf6' } }
                }
            }
        }
    </script>
    <style>
        body { background-color: #0f172a; color: #e2e8f0; }
        /* Hiệu ứng kính nâng cao */
        .glass { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
        .glass-nav { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .text-gradient { background: linear-gradient(to right, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hover-card:hover { transform: translateY(-5px); border-color: #3b82f6; box-shadow: 0 10px 40px -10px rgba(59, 130, 246, 0.4); }
        /* Animated Background Mesh */
        .bg-mesh {
            background-image: radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
                              radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.15) 0px, transparent 50%),
                              radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%);
            background-size: 100% 100%;
            background-attachment: fixed;
        }

        /* --- LANGUAGE TOGGLE CSS --- */
        .thumb { transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1); }
        #language-toggle:checked + .toggle-label .thumb { transform: translateX(2.5rem); }
        .toggle-label { transition: background-color 0.4s ease; }
        #language-toggle:checked + .toggle-label { background-color: #7f1d1d; border-color: #991b1b; }
        .icon-us, .icon-vn { transition: all 0.4s ease-in-out; position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .icon-us { opacity: 1; transform: scale(1) rotate(0deg); }
        .icon-vn { opacity: 0; transform: scale(0.5) rotate(-90deg); }
        #language-toggle:checked + .toggle-label .icon-us { opacity: 0; transform: scale(0.5) rotate(90deg); }
        #language-toggle:checked + .toggle-label .icon-vn { opacity: 1; transform: scale(1) rotate(0deg); }
        .text-en, .text-vn { transition: opacity 0.3s ease; position: absolute; top: 50%; transform: translateY(-50%); font-size: 0.75rem; font-weight: 700; }
        .text-en { right: 0.6rem; opacity: 1; color: #94a3b8; }
        .text-vn { left: 0.6rem;  opacity: 0; color: #ef4444; }
        #language-toggle:checked + .toggle-label .text-en { opacity: 0; }
        #language-toggle:checked + .toggle-label .text-vn { opacity: 1; color: #fca5a5; }

        /* Mobile Menu Animation */
        #mobile-menu { transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out; }
        .mobile-menu-closed { transform: translateY(-100%); opacity: 0; pointer-events: none; }
        .mobile-menu-open { transform: translateY(0); opacity: 1; pointer-events: auto; }
    </style>
</head>
<body class="overflow-x-hidden bg-mesh relative">

    <nav class="fixed w-full z-50 glass-nav transition-all duration-300">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <a href="#" class="text-xl font-display font-bold text-white tracking-wider relative z-50">KIM<span class="text-accent-cyan">LONG</span>.</a>
            
            <!-- Desktop Menu -->
            <div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                <a href="#about" class="hover:text-white transition" data-i18n="nav_about">Về Tôi</a>
                <a href="#projects" class="hover:text-white transition" data-i18n="nav_projects">Dự Án</a>
                <a href="#testimonials" class="hover:text-white transition" data-i18n="nav_testimonials">Đánh Giá</a>
                <a href="#certificates" class="hover:text-white transition" data-i18n="nav_certificates">Chứng Chỉ</a>
                <a href="#contact" class="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition border border-white/5" data-i18n="nav_contact">Liên Hệ</a>
            </div>
            
            <!-- Right Side: Language + Menu Btn -->
            <div class="flex items-center gap-4 relative z-50">
                <!-- LANGUAGE TOGGLE -->
                <div class="relative inline-block w-20 h-10 align-middle select-none">
                    <input type="checkbox" id="language-toggle" class="absolute block w-full h-full opacity-0 cursor-pointer z-20" checked/>
                    <label for="language-toggle" class="toggle-label block w-full h-full rounded-full bg-slate-700 border border-slate-600 shadow-inner relative z-10 overflow-hidden">
                        <span class="text-en">EN</span>
```
