---
tags: [learning, facebook-api, ai-rewriter, auto-comment, tran-bang-viet, strip-markdown]
date: 2026-05-15
project: "[[Thong-Tin-Cong-Ty-FB-Fanpage]]"
---

# Pipeline FB Fanpage: van phong DrNeo + auto-comment co nguon

## Boi canh
User muon tat ca bai dang FB Fanpage dung van phong Tran Bang Viet (DrNeo) voi it emoji. Dong thoi muon tu dong binh luan ben duoi bai voi noi dung chi tiet hon + ghi nguon (nhung KHONG co link nao).

## Giai phap
1. Rewriter: thay system prompt mac dinh sang DrNeo style (phan tich quan tri, chin chan, co phan "Binh:" cuoi bai, cau hoi goi mo). Chi 2-4 emoji toan bai. Them SYSTEM_PROMPT_COMMENT rieng de sinh comment chi tiet + nguon (chi ten bao, khong URL). 2. Publisher: them ham comment_on_post() goi /{post_id}/comments API. Tu dong comment ngay sau khi dang bai thanh cong. 3. DB: them cot rewritten_comment de luu comment cung luc voi post content. 4. Them strip_markdown() de tu dong xoa ** ## - tu output AI.

## Duc ket
Khi AI sinh content cho FB: (1) Luon strip markdown vi AI hay them ** du da noi khong. (2) Comment API la POST /{post_id}/comments voi message + access_token. (3) Ghi nguon chi can ten bao + ngay, TUYET DOI khong link vi Meta giam reach. (4) Tach system prompt rieng cho post va comment de kiem soat chat luong tung phan.

## Code mau
```
def strip_markdown(text):
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'^#{1,3}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*[-*]\s+', '', text, flags=re.MULTILINE)
    return text

# Comment API
def comment_on_post(post_id, message):
    url = f"{GRAPH_API_BASE}/{post_id}/comments"
    data = {"message": message, "access_token": ACCESS_TOKEN}
    resp = requests.post(url, data=data, timeout=30)
    return resp.json().get("id")
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thong-Tin-Cong-Ty-FB-Fanpage]]
