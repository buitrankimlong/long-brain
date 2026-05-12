---
tags: [project, soccer-data-analytics-flashscore-scraper]
status: hoan-thanh
started: 2026-05-09
stack: [Python 3, BeautifulSoup4, regex]
updated: 2026-05-09
---

# Soccer-Data-Analytics-Flashscore-Scraper

## Mo ta
Hệ thống phân tích dữ liệu bóng đá từ Flashscore. Module parser_logic.py chứa FlashscoreParser class với 10+ methods parse HTML từ match details: tóm tắt, sự kiện (bàn, thẻ, thay người), stats (xG, possession, shots...), lineup, standings, odds (1X2/OU/AH), player stats chi tiết, upcoming fixtures.

## Stack
- Python 3
- BeautifulSoup4
- regex

## Quyet dinh quan trong
- CSS selector strategy: data-testid, class names (robust vs layout changes)\n- Stat keywords mapping: \"Expected Goals (xG)\" → dạy chuẩn hóa tên (xG vs xGOT faced)\n- Fix bug xG ghi đè: check \"target\" hoặc \"xgot\" in raw_lower để skip\n- Prefix auto-rename: Full→Match, 1H→1st_Half, 2H→2nd_Half\n- Player stats: extract Rating from badge, đổi viết tắt thành tên đầy đủ (xg→Expected_Goals)\n- Upcoming matches: format \"Team A vs Team B (DD/MM/YYYY)\" từ 3 trận sắp tới\n- Standings: normalize team names (lower().strip()) để match home/away teams chính xác

## Bai hoc rut ra
Web scraping Flashscore: 1) CSS class names thay đổi qua updates → luôn cần fallback selectors; 2) Xử lý xG duplicate bug (xGOT là variant, không phải xG thực); 3) Player rating extract từ span con trong badge; 4) Upcoming matches: check class \"event__match--scheduled\" và empty score_el; 5) Format ngày: dots→slashes \"24.12.\"→\"24/12\"

## Ket qua
Parser hoàn chỉnh, trích xuất 12+ data points/match (summary, events, stats 3 phases, lineups, standings, odds, player ratings, upcoming).

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
