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


## Source Code

parser_logic.py:
```python
import re
from bs4 import BeautifulSoup

class FlashscoreParser:
    """
    Hệ thống phân tích dữ liệu Flashscore.
    [UPDATED] Thêm ngày thi đấu vào Upcoming Match.
    [FIXED 1] Sửa lỗi xG bị ghi đè bởi xGOT (Target).
    [FIXED 2] Sửa lỗi xG bị ghi đè bởi xGOT faced (Thủ môn).
    [FIXED 3] Hiển thị tên cột đầy đủ (Stats_Match, 1st_Half, Shots...).
    """

    STAT_KEYWORDS = {
        "Expected Goals (xG)": ["expected goals", "xg"],
        "Ball Possession": ["ball possession", "possession"],
        "Total shots": ["total shots", "goal attempts"],
        "Shots on target": ["shots on target", "shots on goal"],
        "Shots off target": ["shots off target", "shots off goal"],
        "Blocked shots": ["blocked shots"],
        "Corner kicks": ["corner kicks", "corners"],
        "Offsides": ["offsides"],
        "Fouls committed": ["fouls", "fouls committed"],
        "Goalkeeper saves": ["goalkeeper saves"],
        "Big chances": ["big chances"]
    }

    @staticmethod
    def parse_summary(html_content):
        soup = BeautifulSoup(html_content, 'html.parser')
        data = {}
        
        tourn_elem = soup.select_one(".tournamentHeader__country")
        if tourn_elem:
            text = tourn_elem.get_text(strip=True)
            parts = text.split(":")
            if len(parts) > 1:
                data["Country"] = parts[0].strip()
                data["League"] = parts[1].strip()
            else:
                data["League"] = text
        
        time_elem = soup.select_one(".duelParticipant__startTime")
        if time_elem:
            data["Date_Time"] = time_elem.get_text(strip=True)

        home = soup.select_one(".duelParticipant__home .participant__participantName")
        away = soup.select_one(".duelParticipant__away .participant__participantName")
        data["Home_Team"] = home.get_text(strip=True) if home else "N/A"
        data["Away_Team"] = away.get_text(strip=True) if away else "N/A"

        score_wrap = soup.select_one(".detailScore__wrapper")
        if score_wrap:
            data["Final_Score"] = score_wrap.get_text(strip=True).replace("\n", "-")
        return data

    @staticmethod
    def parse_events(html_content):
        soup = BeautifulSoup(html_content, 'html.parser')
        home_goals, away_goals, home_cards, away_cards = [], [], [], []
        home_subs, away_subs = [], [] 
        
        rows = soup.select(".smv__participantRow")
        
        for row in rows:
            try:
                is_home = "smv__homeParticipant" in row.get("class", [])
                
                time_box = row.select_one(".smv__timeBox")
                if not time_box: continue
                mn = time_box.get_text(strip=True).replace("'", "")
                
                player_elem = row.select_one(".smv__playerName")
                pl = player_elem.get_text(strip=True) if player_elem else "Unknown"

                icon = row.find("svg")
                if not icon: continue
                
                tid = icon.get("data-testid", "")
                cls = str(icon.get("class", ""))
                
```
