---
tags: [project, tnh-bo-ai-facebook-agent]
status: hoan-thanh
started: 2025-01-10
client: Tình Báo AI - Media Channel
stack: [Python, Telegram Bot API, Facebook Graph API, Instagram Graph API, Cloudinary, Aiohttp]
updated: 2026-05-09
---

# Tình Báo AI Facebook Agent

## Mo ta
Telegram bot đắc lực đăng bài lên Facebook Page "Tình Báo AI" qua Facebook Graph API + Instagram. Nhận ảnh kèm caption → đăng Facebook + Instagram cùng lúc

## Stack
- Python
- Telegram Bot API
- Facebook Graph API
- Instagram Graph API
- Cloudinary
- Aiohttp

## Quyet dinh quan trong
Dùng Graph API thay vì Playwright (chính thức, ổn định); Tải ảnh về file tạm trước khi đăng; Xác thực admin qua user ID; Đăng song song Facebook + Instagram; Upload ảnh qua Cloudinary nếu cần lưu URL dài hạn

## Bai hoc rut ra
Facebook Graph API v18+ yêu cầu Page Access Token với scope publish_pages; Instagram API riêng, cần separate token; Cần bỏ temp file sau đăng (finally: os.unlink); Xử lý lỗi Instagram riêng (trả về warning chứ không fail)

## Ket qua
Bot hoạt động ổn định, đăng bài FB + IG cùng lúc, hỗ trợ error handling riêng cho từng platform, tối giản UI cho admin

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

bot.py:
```python
import os
import tempfile
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

from config import TELEGRAM_TOKEN, ADMIN_USER_ID
from facebook import post_to_facebook
from instagram import post_to_instagram


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message

    # Chỉ admin mới được dùng
    if message.from_user.id != ADMIN_USER_ID:
        return

    # Ảnh không có caption → nhắc
    if not message.caption:
        await message.reply_text("Vui lòng gửi ảnh kèm nội dung bài viết!")
        return

    caption = message.caption
    await message.reply_text("Đang đăng bài lên Facebook + Instagram...")

    # Tải ảnh về file tạm
    photo = message.photo[-1]  # Lấy ảnh chất lượng cao nhất
    file = await context.bot.get_file(photo.file_id)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    tmp_path = tmp.name
    tmp.close()

    await file.download_to_drive(tmp_path)

    try:
        # Đăng Facebook
        link = await post_to_facebook(caption, tmp_path)
        result_text = f"✅ Đã đăng Facebook: {link}"

        # Đăng Instagram
        try:
            ig_success, ig_result = await post_to_instagram(tmp_path, caption)
            if ig_success:
                result_text += f"\n✅ Đã đăng Instagram: {ig_result}"
            else:
                result_text += f"\n⚠️ Instagram: {ig_result}"
        except Exception as ig_err:
            result_text += f"\n⚠️ Instagram: {ig_err}"

        await message.reply_text(result_text)
    except Exception as e:
        await message.reply_text(f"❌ Lỗi Facebook: {e}")
    finally:
        os.unlink(tmp_path)


def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    # Chỉ xử lý tin nhắn có ảnh
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    print("Bot đang chạy...")
    app.run_polling()


if __name__ == "__main__":
    main()
```
