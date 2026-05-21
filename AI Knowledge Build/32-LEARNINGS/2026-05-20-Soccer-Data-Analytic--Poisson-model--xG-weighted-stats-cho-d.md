---
tags: [learning, football, analytics, poisson, xg, prediction, python, data-science, home-pc]
date: 2026-05-20
project: "[[Soccer-Data-Analytic]]"
---

# Soccer Data Analytic — Poisson model + xG weighted stats cho dự đoán bóng đá

## Boi canh
Tìm thấy trên PC nhà tại C:\Soccer Data Analytic and Scraping - Copy. Hệ thống phân tích dữ liệu bóng đá dùng Poisson distribution + Expected Goals (xG) weighted stats. Có Analyzer.py (Poisson prediction), Scarper_fast.py, link_finder.py. Output: SUMMARY_PREDICTIONS.csv với AI Pick, Confidence, Over/Under.

## Giai phap
FootballAnalyzer class: preprocess → calculate_weighted_stats (trọng số giảm dần theo thời gian) → Poisson probability → prediction. HOME_ADVANTAGE = 0.25 xG. Confidence levels: >55% = High, >45% = Medium. Over/Under threshold: xG > 2.85 = OVER, < 2.15 = UNDER. Export CSV với utf-8-sig cho Excel VN.

## Duc ket
Poisson distribution + weighted xG là cách phân tích bóng đá chuẩn. Trọng số giảm dần theo thời gian (np.arange(n,0,-1)). HOME_ADVANTAGE ~0.25 xG. utf-8-sig khi xuất CSV cho Excel tiếng Việt.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Soccer-Data-Analytic]]
