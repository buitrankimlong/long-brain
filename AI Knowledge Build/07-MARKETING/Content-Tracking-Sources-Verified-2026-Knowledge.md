---
tags: [content-tracking, scraping, sources, reddit, youtube, twitter, linkedin, facebook, cdp, verified]
description: Content-Tracking-Sources-Verified-2026
created: 2026-05-20
moc: "[[07 Marketing Tu Dong]]"
---

# Nguồn theo dõi content đa kênh — Verified 2026-05-20

## Tổng: ~118 sources trên 5 nền tảng

### Reddit (20 subreddits)
**AI/ML:** artificial, MachineLearning, LocalLLaMA (xuất sắc), LLMDevs, AI_Agents, ClaudeAI, singularity, StableDiffusion, datascience, learnmachinelearning
**Business:** Entrepreneur, SideProject, SaaS, indiehackers, startups, nocode, automation, buildinpublic, growthhacking, DigitalMarketing
**Blocked:** r/ChatGPT, r/OpenAI (cả RSS, JSON, old.reddit đều fail)

### YouTube (24 channels — all verified)
**AI News:** Matt Wolfe, AI Explained, Wes Roth, The AI Advantage (@aiadvantage), Two Minute Papers, Matthew Berman, WorldofAI, AI Jason, Yannic Kilcher
**AI Biz:** Liam Ottley, Nick Saraev, Corbin Brown (@Corbin_Brown), Nate Herk, Sabrina Ramonov, Greg Isenberg, Sam Witteveen
**Tech:** Fireship, Theo, NetworkChuck, Traversy Media, Code With Antonio, Tina Huang, David Ondrej, Ali Abdaal

### X/Twitter (28 accounts — verified by CDP)
**Xuất sắc:** @karpathy (136K likes), @chipro (8000-word AI agent notes), @emollick
**Tốt:** @levelsio, @arvidkahl, @csallen, @fchollet, @AndrewYNg, @jeremyphoward, @demishassabis, @Whats_AI, @swyx, @goodside
**Handle lessons:** chiphuyen→chipro, demaborsh→demishassabis, whaborov→Whats_AI, DannyPostmaDev→dannypostmaa(broken)→sabrina_ramonov

### LinkedIn (31 creators)
**Xuất sắc:** Zain Kahn (zainkahn), Jason Lemkin (jasonmlemkin), Cassie Kozyrkov (kozyrkov)
**Tốt:** Andrej Karpathy, Andrew Ng, Ethan Mollick, Allie K Miller, Arvid Kahl, etc.
**Cần verify:** Ruben Hassid (ruben-hassid), Steve Nouri, Bernard Marr, Amy Webb

### Facebook (13 groups + 5 fanpages)
**Groups VN tốt:** Cộng đồng AI Lò (comailo) — chia sẻ kiến thức thực
**Groups VN trung bình:** AI ứng dụng KD (congdongaiviet) — nhiều quảng cáo khóa học
**Fanpages tốt:** VietAI4all — lộ trình Deep Learning, LLM agents chất lượng
**Đã loại:** AI for Vietnamese (share crack accounts), Nguyen Thieu Toan (profile cá nhân ko scrape được)

## Kỹ thuật scraping
- Reddit: JSON API (RSS dead 2026)
- YouTube: yt-dlp extract_flat
- X/LinkedIn/Facebook: Chrome CDP port 9222, cùng 1 Chrome instance
- Facebook: JS inject (CSS selectors dead), click See More, VN timestamps
- X: click Show More cho long tweets
- LinkedIn: delay 12s, reactions count thấp hơn thực tế
