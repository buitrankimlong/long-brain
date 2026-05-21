---
tags: [learning, scraping, thumbnail, json-ld, og-image, vietnam-news]
date: 2026-05-15
project: "[[Thong Tin Cong Ty FB Fanpage]]"
---

# Lay thumbnail bai viet VN: JSON-LD image + og:image fallback

## Boi canh
Khi cao bai tu bao VN, thumbnail tu RSS khong luon co (CafeF khong co enclosure, chi co img trong description CDATA). Va khi fetch detail page, ban dau khong lay thumbnail tu JSON-LD hay og:image.

## Giai phap
3 lop lay thumbnail theo thu tu uu tien: (1) JSON-LD NewsArticle.image - co the la string, list, hoac dict co url/contentUrl. (2) meta[property=og:image] content - fallback luon co. (3) RSS enclosure hoac parse img tu description CDATA. Ket qua: 135/135 bai deu co thumbnail.

## Duc ket
Luon lay thumbnail tu 3 nguon: JSON-LD image > og:image > RSS. Tat ca bao VN deu co it nhat 1 trong 3 nguon nay.

## Code mau
```
// JSON-LD thumbnail extraction\nimg = data.get('image')\nif isinstance(img, list): img = img[0]\nif isinstance(img, dict): thumb = img.get('url') or img.get('contentUrl')\nelif isinstance(img, str): thumb = img\n\n// og:image fallback\nog_img = soup.find('meta', property='og:image')\nif og_img: thumb = og_img['content']
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thong Tin Cong Ty FB Fanpage]]
