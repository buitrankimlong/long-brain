---
tags: [learning, lark, website, image-proxy, redis-cache, express-static, thuymac]
date: 2026-05-13
project: "[[AI Marketing Sales 3 Brands]]"
---

# Website dùng Lark Bitable làm CMS — pattern image proxy + cache

## Boi canh
Build website Thủy Mạc với sản phẩm tự động sync từ Lark Bitable (thay Supabase). Lark attachment trả về file_token, tmp_download_url chỉ valid 24h.

## Giai phap
1. GET /api/products: searchAllRecords từ Lark → filter status !== 'Đã bán' → cache Redis 10min (cacheSet/cacheGet). 2. GET /api/image/:fileToken: gọi getAttachmentTmpUrls() → redirect 302 → cache tmp_url 23h trong Redis. 3. POST /api/invalidate-cache: cacheDel khi Lark Automation trigger khi có sản phẩm mới. 4. website/ static folder serve bởi express.static, mount trước 404 handler.

## Duc ket
Lark tmp_download_url valid ~24h, cache Redis 23h là an toàn. Image proxy dùng redirect 302 — browser tự follow, không cần pipe bytes. Static website cần mount express.static TRƯỚC route 404. Lark Automation webhook gọi /api/invalidate-cache để bust cache ngay khi có tranh mới.

## Code mau
```
// website-api.js pattern
router.get('/image/:fileToken', async (req, res) => {
  const cacheKey = `website:img:${fileToken}`;
  let tmpUrl = await cacheGet(cacheKey);
  if (!tmpUrl) {
    const results = await lark.getAttachmentTmpUrls([fileToken]);
    tmpUrl = results[0]?.tmp_download_url;
    await cacheSet(cacheKey, tmpUrl, 23 * 3600);
  }
  return res.redirect(302, tmpUrl);
});
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Marketing Sales 3 Brands]]
