---
tags: [learning, v98, image-generation, b64_json, rate-limit, admin-panel]
date: 2026-05-21
project: "[[admin-panel]]"
---

# v98 gpt-image-1 tra b64_json khong phai url - phai convert

## Boi canh
Admin panel image-gen API gọi v98 images/generations với gpt-image-1. Code chỉ handle item.url nhưng gpt-image-1 trả b64_json. Kết quả: urls: [] (empty). Thêm vào đó, hầu hết v98 image models (gpt-image-1, nano-banana-2, grok-3, dall-e-3, flux-kontext-pro) bị 429 rate limit. Chỉ z-image-turbo hoạt động.

## Giai phap
1. Handle cả url và b64_json: if (item.url) push url, else if (item.b64_json) save to file + return local URL. 2. Đổi default model sang z-image-turbo (duy nhất hoạt động). 3. Save ảnh generated vào persistent dir /root/admin-panel/persistent-uploads/generated/.

## Duc ket
Image generation API có thể trả url HOẶC b64_json — LUÔN handle cả 2 format. v98 hay bị 429 → có fallback model (z-image-turbo). Kiểm tra model status trước khi hardcode.

## Source Code

```typescript
// image-gen/route.ts
for (const item of data.data || []) {
  if (item.url) {
    urls.push(item.url);
  } else if (item.b64_json) {
    await mkdir(PERSISTENT_DIR, { recursive: true });
    const filename = `gen-${randomUUID().slice(0, 8)}.png`;
    await writeFile(path.join(PERSISTENT_DIR, filename), Buffer.from(item.b64_json, 'base64'));
    urls.push(`/api/uploads/generated/${filename}`);
  }
}
```

v98 image model status (2026-05-21):
- z-image-turbo: OK (trả URL trực tiếp)
- gpt-image-1: 429 (khi OK trả b64_json)
- nano-banana-2, grok-3, dall-e-3, flux-kontext-pro: 429

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[admin-panel]]
