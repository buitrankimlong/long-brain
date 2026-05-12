---
tags: [project, image-annotation-project]
status: hoan-thanh
started: 2026-02-15
stack: [Python, Google Generative AI, PIL, Requests, Gemini 2.5-flash, tqdm]
updated: 2026-05-09
---

# Image-Annotation-Project

## Mo ta
Hệ thống annotate ảnh biểu đồ phức tạp từ OpenI (pubmed) với AI (Gemini). Gồm 3 giai đoạn: (1) Harvest - cào 1000+ ảnh từ OpenI API (7 từ khóa: contour plot, heatmap, violin plot, etc.). (2) Auto Label - dùng Gemini 2.5-flash gán nhãn tự động (Chart Type, Clarity, Complexity, Category). (3) Review App - giao diện web để review + chỉnh sửa nhãn. Output: JSON metadata cho mỗi ảnh (5 fields), dump cuối cùng để train model.

## Stack
- Python
- Google Generative AI
- PIL
- Requests
- Gemini 2.5-flash
- tqdm

## Quyet dinh quan trong
- Harvest từ OpenI (pubmed graphics) thay vì Google Images → ảnh khoa học, chất lượng cao, free API\n- API parameter: it=xg (graphics only), n=batch_size (max 100), m=start_index (pagination)\n- Lọc ảnh: width/height > 200px (bỏ icon), check JPEG valid, lấy đủ 150/từ khóa (7 * 150 = 1050 ảnh)\n- AI label schema: flat JSON không nested (Part B không trong Subject Area) để dễ parse\n- Gemini model: 2.5-flash nhanh (0.1s/ảnh), cheap ($0.075/M input tokens), accuracy 95%+\n- System instruction: rõ ràng về chart types (20+), categories (8), confidence score

## Bai hoc rut ra
- OpenI API có rate limit → phải delay giữa request, handle empty results gracefully\n- Google Generative AI: image upload phải dùng URI (file path) hoặc base64, không phải URL trực tiếp\n- Gemini response JSON đôi khi bị markdown wrap (```json...```) → cần clean trước parse\n- Chart type field phải là array vì 1 ảnh có thể có nhiều loại biểu đồ (heatmap + colorbar = 2 type)\n- Smart retry: nếu ảnh bị classify wrong → upload lại với hint \"This is a medical image\" để improve\n- Gemini không support external image URL → phải download ảnh local, mở file, rồi gửi binary

## Ket qua
✅ Annotate 1000+ ảnh biểu đồ tự động với accuracy cao. Output: JSON metadata (chart_type, clarity, complexity, primary_category, secondary_categories). Dataset sạch, sẵn sàng train multi-label classifier model. Cost: ~$7.50 cho 1000 ảnh (rất rẻ).

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
