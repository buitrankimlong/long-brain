---
tags: [learning, pillow, image, facebook, anti-aliasing, png, social-media]
date: 2026-05-13
project: "[[Thong-Tin-Thue-Luat-Kinh-Doanh]]"
---

# Pillow ảnh sắc nét: render 3x scale xuống LANCZOS + PNG thay JPEG

## Boi canh
Ảnh generate bằng Pillow bị mờ khi upload lên Facebook. Dùng JPEG quality=97 vẫn blur. Shadow effect dùng RGBA draw trên RGB canvas gây artifact.

## Giai phap
1) Render ở 3x resolution (3600px), scale xuống 1200px bằng LANCZOS. 2) Lưu PNG thay JPEG (lossless). 3) Dùng Image.new("RGBA") thay RGB khi cần alpha. 4) KHÔNG dùng shadow — gây blur. Output 1200x1200 PNG để Facebook ít nén hơn 1080x1080.

## Duc ket
Text image cho social media: luôn render 3x → scale LANCZOS → lưu PNG. Tránh shadow effect khi dùng alpha trên RGB canvas. 1200px là sweet spot cho Facebook (ít nén nhất).

## Code mau
```
SCALE = 3
C = SIZE * SCALE  # render at 3600px
img = Image.new("RGBA", (C, C), (*BG_COLOR, 255))
# ... vẽ text ...
img_rgb = img.convert("RGB")
img_rgb = img_rgb.resize((SIZE, SIZE), Image.LANCZOS)
img_rgb.save(out_path, "PNG", optimize=False)
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thong-Tin-Thue-Luat-Kinh-Doanh]]
