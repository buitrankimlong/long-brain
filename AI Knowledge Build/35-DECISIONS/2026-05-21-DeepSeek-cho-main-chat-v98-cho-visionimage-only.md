---
tags: [decision, architecture]
date: 2026-05-21
status: accepted
project: "[[ai-system-v2]]"
---

# [Decision] DeepSeek cho main chat, v98 cho vision/image only

## Boi canh
Sales Agent v4 cần LLM API ổn định cho main chat (tư vấn phong thủy, gọi tools). v98store API trả empty response ~30%, latency 5-15s. Cần tìm alternative.

## Quyet dinh
Dùng DeepSeek (deepseek-chat / deepseek-v4-flash) cho main agent chat. Giữ v98 CHỈ cho vision (classify_image_intent) và image generation (mockup_on_wall, admin panel).

## Phuong an da xem xet
1. Giữ v98 + tăng retry (đã thử, vẫn flaky). 2. Dùng Anthropic API trực tiếp (đắt, chưa có key). 3. Dùng OpenAI API (đắt). 4. DeepSeek (rẻ, nhanh, ổn định).

## Ly do chon
DeepSeek: 0% empty response, 580-900ms latency (vs 5-15s), tiếng Việt + phong thủy xuất sắc, giá rẻ. Nhược điểm duy nhất: không hỗ trợ vision → giữ v98 cho vision.

## Trade-offs
DeepSeek không hỗ trợ vision → vẫn phụ thuộc v98 cho ảnh. DeepSeek model deepseek-v4-flash có thể thay đổi behavior giữa các version.

---
> Date: 2026-05-21 | Status: Accepted
> Project: [[ai-system-v2]]
