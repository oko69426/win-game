"""
WINGAME AI - 文字解析工具
從 OCR 提取的原始文字中解析: 隊名、賠率、比賽時間、運動類型
"""
import re

# 足球相關關鍵字 (繁簡中英)
SOCCER_KEYWORDS = [
    'FC', 'United', 'City', 'Real', 'Bayern', 'Arsenal', 'Chelsea',
    'Liverpool', 'Barcelona', 'Madrid', 'PSG', 'Juventus', 'Milan',
    '聯隊', '城市', '皇家', '米蘭', '巴塞羅那', '利物浦', '切爾西',
    '足球', 'EPL', 'UEFA', 'FIFA', '世界杯', '英超', '西甲', '甲級',
    '平局', '讓球', '全場', '半場', '角球'
]

# 棒球相關關鍵字 (MLB / CPBL)
BASEBALL_KEYWORDS = [
    'Yankees', 'Red Sox', 'Dodgers', 'Cubs', 'Mets', 'Giants',
    'Braves', 'Astros', 'Cardinals', 'Phillies', 'Padres',
    '洋基', '紅襪', '道奇', '小熊', '巨人', '勇士', 'MLB',
    '棒球', '局', '投手', '打者', '全壘打', 'CPBL',
    '統一', '中信', '富邦', '樂天', '味全', '台鋼'
]

# 小數賠率模式: 1.75 ~ 9.99
DECIMAL_ODDS_PATTERN = re.compile(r'\b([1-9]\.\d{2})\b')

# 香港盤賠率模式: +150 / -115
HK_ODDS_PATTERN = re.compile(r'[+-](\d{3,4})')

# 日期模式
DATE_PATTERN = re.compile(
    r'\d{4}[-/]\d{1,2}[-/]\d{1,2}|'
    r'\d{1,2}月\d{1,2}日|'
    r'\d{1,2}/\d{1,2}'
)

# 時間模式
TIME_PATTERN = re.compile(r'\b\d{2}:\d{2}\b')

# VS 分隔符模式 — 修正: 不使用 \b，讓中文字元也能正確分割
# 支援: vs / VS / V.S. / v.s. / 對戰 / 對陣 / 對 / ～ 以及前後有空白的版本
VS_PATTERN = re.compile(
    r'(?i)\s*[Vv]\.?[Ss]\.?\s*|'  # vs, VS, V.S., v.s.
    r'\s*對戰\s*|\s*對陣\s*|'      # 中文「對戰」「對陣」
    r'(?<=\S)\s+[vV][sS]\s+(?=\S)|'  # 兩側有空白的 vs
    r'\s*～\s*'                    # 波浪號分隔
)

# 僅用於整行比對（方法2）
VS_FULL_LINE = re.compile(r'^(?:vs\.?|VS\.?|V\.S\.?|對戰|對陣)$', re.IGNORECASE)

# 雜訊行（不可能是隊名）
NOISE_PATTERN = re.compile(
    r'^[\d\s.:/+\-@#$%^&*()（）【】\[\]{}|\\,，。、！!？?]+$'
)

# 賠率數字特徵（含有這些的行很可能是賠率行）
ODDS_LINE_PATTERN = re.compile(r'\b[1-9]\.\d{2}\b')


def detect_sport_type(text: str) -> str:
    """根據文字內容自動偵測運動類型，返回 'soccer' 或 'baseball'"""
    text_upper = text.upper()
    baseball_score = sum(1 for kw in BASEBALL_KEYWORDS if kw.upper() in text_upper)
    soccer_score = sum(1 for kw in SOCCER_KEYWORDS if kw.upper() in text_upper)
    return 'baseball' if baseball_score > soccer_score else 'soccer'


def parse_team_names(text: str, sport_type: str = 'soccer') -> dict:
    """
    解析主客隊名稱 — 多策略依序嘗試
    """
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    # ── 方法1: 同行含 vs 分隔符（支援中文前後無空白） ──
    for line in lines:
        if VS_PATTERN.search(line):
            parts = VS_PATTERN.split(line)
            if len(parts) >= 2:
                home = _clean_team_name(parts[0])
                away = _clean_team_name(parts[-1])
                if home and away and len(home) >= 2 and len(away) >= 2:
                    return {'home': home, 'away': away}

    # ── 方法2: vs 單獨成行（前後行是隊名） ──
    for i, line in enumerate(lines):
        if VS_FULL_LINE.match(line.strip()):
            if i > 0 and i < len(lines) - 1:
                home = _clean_team_name(lines[i - 1])
                away = _clean_team_name(lines[i + 1])
                if home and away and len(home) >= 2 and len(away) >= 2:
                    return {'home': home, 'away': away}

    # ── 方法3: 「主隊:」「客隊:」標籤 ──
    home_team = None
    away_team = None
    for line in lines:
        if re.search(r'主隊|主場|HOME|Home team', line, re.IGNORECASE):
            cleaned = re.sub(r'主隊[：:]\s*|主場[：:]\s*|HOME[：:]?\s*|Home team[：:]?\s*', '', line, flags=re.IGNORECASE)
            t = _clean_team_name(cleaned)
            if t:
                home_team = t
        elif re.search(r'客隊|客場|AWAY|Away team', line, re.IGNORECASE):
            cleaned = re.sub(r'客隊[：:]\s*|客場[：:]\s*|AWAY[：:]?\s*|Away team[：:]?\s*', '', line, flags=re.IGNORECASE)
            t = _clean_team_name(cleaned)
            if t:
                away_team = t

    if home_team and away_team:
        return {'home': home_team, 'away': away_team}

    # ── 方法4: 尋找兩個相鄰的「看起來像隊名」的行 ──
    # 過濾掉純數字行、賠率行、太短的行
    candidate_lines = []
    for line in lines:
        if _looks_like_team_name(line):
            candidate_lines.append(line)

    # 若找到至少 2 個候選隊名行，取前兩個
    if len(candidate_lines) >= 2:
        home = _clean_team_name(candidate_lines[0])
        away = _clean_team_name(candidate_lines[1])
        if home and away and len(home) >= 2 and len(away) >= 2:
            return {'home': home, 'away': away}

    # ── 方法5: 合併所有行成單一字串後再試 vs 分割 ──
    merged = ' '.join(lines)
    if VS_PATTERN.search(merged):
        parts = VS_PATTERN.split(merged)
        if len(parts) >= 2:
            home = _clean_team_name(parts[0].split()[-1] if parts[0].split() else parts[0])
            away = _clean_team_name(parts[-1].split()[0] if parts[-1].split() else parts[-1])
            if home and away and len(home) >= 2 and len(away) >= 2:
                return {'home': home, 'away': away}

    return {'home': None, 'away': None}


def _looks_like_team_name(line: str) -> bool:
    """判斷一行文字是否可能是隊名"""
    line = line.strip()
    # 長度過短或過長
    if len(line) < 2 or len(line) > 40:
        return False
    # 純數字/符號
    if NOISE_PATTERN.match(line):
        return False
    # 含有賠率數字（例如 1.75）的行不是隊名
    if ODDS_LINE_PATTERN.search(line):
        return False
    # 含有這些關鍵字的行不是隊名
    skip_keywords = ['讓球', '大小', '賠率', '全場', '半場', '時間', '日期',
                     '聯賽', '賽事', '盤口', 'odds', 'handicap', '返還',
                     '主勝', '平局', '客勝', 'WIN', 'DRAW', 'LOSS']
    line_lower = line.lower()
    for kw in skip_keywords:
        if kw.lower() in line_lower:
            return False
    # 至少有一個中文字或英文字母（不是純符號）
    if re.search(r'[\u4e00-\u9fff\u3400-\u4dbfA-Za-z]', line):
        return True
    return False


def _clean_team_name(name: str) -> str:
    """清理隊名，移除多餘字元"""
    if not name:
        return ''
    # 移除括號內容
    name = re.sub(r'[（(【\[\{].*?[）)\]】\}]', '', name)
    # 移除前後空白
    name = re.sub(r'\s+', ' ', name).strip()
    # 移除行尾的賠率數字（例如 "曼城 1.75"）
    name = re.sub(r'\s+[\d.]+$', '', name).strip()
    # 移除純數字或過短的結果
    if not name or re.fullmatch(r'[\d\s.:/+\-@#$%^&*]+', name):
        return ''
    return name[:30]  # 限制長度


def parse_odds(text: str) -> dict:
    """
    解析賠率數值
    返回: {home_win, draw, away_win, over, under}
    """
    # 先嘗試小數賠率 (歐洲盤 1.75 格式)
    decimal_odds = DECIMAL_ODDS_PATTERN.findall(text)

    # 過濾不合理的賠率 (太小或太大)
    valid_odds = [float(o) for o in decimal_odds if 1.01 <= float(o) <= 20.0]

    result = {}
    if len(valid_odds) >= 1:
        result['home_win'] = valid_odds[0]
    if len(valid_odds) >= 2:
        result['draw'] = valid_odds[1]
    if len(valid_odds) >= 3:
        result['away_win'] = valid_odds[2]
    if len(valid_odds) >= 4:
        result['over'] = valid_odds[3]
    if len(valid_odds) >= 5:
        result['under'] = valid_odds[4]

    # 嘗試識別明確的大/小標記
    over_match = re.search(r'大[球分]?\s*([\d.]+)|Over\s*([\d.]+)|([\d.]+)\s*大', text, re.IGNORECASE)
    under_match = re.search(r'小[球分]?\s*([\d.]+)|Under\s*([\d.]+)|([\d.]+)\s*小', text, re.IGNORECASE)

    if over_match:
        val = next(v for v in over_match.groups() if v is not None)
        result['total_line'] = float(val)  # 大小球盤口 (e.g., 2.5)

    return result


def parse_handicap(text: str) -> dict:
    """
    解析讓分盤 (Asian Handicap) 數值
    支援格式: 讓1球, 讓0.5球, AHC -1, 亞盤 -0.5, -1球, +0.5球
    返回: {value, display, side} 或 {}
    """
    HANDICAP_PATTERN = re.compile(
        r'讓\s*([+-]?\d+(?:\.\d+)?)\s*球?|'  # 讓1球, 讓0.5球
        r'AHC\s*([+-]?\d+(?:\.\d+)?)|'        # AHC -1
        r'亞盤\s*([+-]?\d+(?:\.\d+)?)|'        # 亞盤 -0.5
        r'([+-]\d+(?:\.\d+)?)\s*球',            # -1球, +0.5球
        re.IGNORECASE,
    )
    m = HANDICAP_PATTERN.search(text)
    if m:
        val_str = next((v for v in m.groups() if v is not None), None)
        if val_str:
            try:
                val = float(val_str)
                disp = f'{val:+.1f}' if (val != int(val)) else f'{val:+.0f}'
                return {
                    'value': val,
                    'display': disp,
                    'side': 'home' if val < 0 else 'away',
                }
            except (ValueError, TypeError):
                pass
    return {}


def parse_match_time(text: str) -> str:
    """解析比賽時間"""
    date_match = DATE_PATTERN.search(text)
    time_match = TIME_PATTERN.search(text)

    parts = []
    if date_match:
        parts.append(date_match.group())
    if time_match:
        parts.append(time_match.group())

    return ' '.join(parts) if parts else '時間未知'
