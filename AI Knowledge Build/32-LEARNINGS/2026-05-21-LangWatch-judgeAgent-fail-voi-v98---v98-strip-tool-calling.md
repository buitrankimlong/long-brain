---
tags: [learning, langwatch, testing, vitest, tool-calling, v98]
date: 2026-05-21
project: "[[ai-system-v2]]"
---

# LangWatch judgeAgent fail voi v98 - v98 strip tool calling

## Boi canh
LangWatch Scenario 0.4.x dùng judgeAgent để đánh giá agent responses. judgeAgent dùng native tool calling nội bộ để trả structured verdict. v98store API strip tools parameter → judge output "No tool call found in LLM output" → tất cả 7 tests fail dù agent hoạt động đúng.

## Giai phap
Bỏ LangWatch judgeAgent, viết deterministic assertions: 1) Check imagesToSend.length > 0 cho gallery tests. 2) Check keyword matching (mệnh, ship, giá) cho text tests. 3) Check r.text.length > 2 cho non-empty response. 4) AI judge chỉ dùng cho complex multi-turn (text-based JSON evaluation, không tool calling).

## Duc ket
LangWatch judgeAgent yêu cầu native tool calling. Nếu API provider strip tools → dùng deterministic assertions (keyword matching, output count) thay vì AI judge. AI judge chỉ dùng cho subjective criteria phức tạp.

## Source Code

```typescript
// Deterministic test — không cần AI judge
it('Khách muốn xem gallery → agent gửi ảnh NGAY', async () => {
  const r = await chat('thuymac', 'Cho mình xem tranh phong thủy đi');
  expect(r.imagesToSend.length).toBeGreaterThan(0);
});

it('Khách hỏi FAQ shipping', async () => {
  const r = await chat('thuymac', 'Ship hàng mất bao lâu vậy shop?');
  const textLower = r.text.toLowerCase();
  const shippingKeywords = ['giao', 'ship', 'ngày', 'miễn phí'];
  const hasShippingInfo = shippingKeywords.some(k => textLower.includes(k));
  expect(hasShippingInfo).toBe(true);
});
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[ai-system-v2]]
