---
tags: [learning, agent, methodology, multi-agent, workflow, quality]
date: 2026-05-13
---

# Nhiều agent cùng làm 1 việc phức tạp tốt hơn chia nhiều việc cho nhiều agent

## Boi canh
Khi gặp task lớn hoặc phức tạp, thường có xu hướng chia nhỏ thành nhiều phần rồi giao mỗi agent 1 phần. Nhưng cách này dễ dẫn đến kết quả không nhất quán, thiếu context tổng thể, và mỗi agent chỉ giải quyết được bề mặt vấn đề của mình.

## Giai phap
Khi gặp 1 vấn đề lớn/phức tạp: spawn nhiều agent cùng làm CÙNG 1 vấn đề đó, sau đó tổng hợp kết quả tốt nhất. Xử lý tuần tự từng vấn đề (không song song nhiều vấn đề). Luôn verify sau mỗi item xong trước khi chuyển sang item tiếp theo.

## Duc ket
Quy tắc: "Nhiều người cùng làm 1 việc, từ việc này sang việc khác" — KHÔNG phải "mỗi người 1 việc". Task phức tạp → 2-3 agent cùng design/implement → synthesize → verify → mới chuyển task tiếp. Đảm bảo chất lượng tốt hơn nhiều so với chia nhỏ song song.

## Lien ket
-> [[32 Bai Hoc Duc Ket]]
