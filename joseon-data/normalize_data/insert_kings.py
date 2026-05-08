import json
import os
import csv
import pymysql

BASE = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE, "..", "data", "kings_data", "kings_data.json")
CSV_PATH  = os.path.join(BASE, "..", "data", "kings_data", "kings.csv")

conn = pymysql.connect(
    host="localhost",
    port=3306,
    user="root",
    password="1024",
    database="joseon_db",
    charset="utf8mb4"
)
cursor = conn.cursor()

# ── 1. CSV에서 tags만 추출 ─────────────────────────────
with open(CSV_PATH, encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    csv_tags_map = {}
    for row in reader:
        king_id = int(row["king_id"])
        raw = row.get("tags", "")
        csv_tags_map[king_id] = [t.strip() for t in raw.split("/")] if raw else []

print(f"CSV tags 로드 완료: {len(csv_tags_map)}명")

# ── 2. JSON 기준으로 INSERT ────────────────────────────
with open(JSON_PATH, encoding="utf-8") as f:
    kings_json = json.load(f)

# 중복 제거
kings_map = {}
for k in kings_json:
    kings_map[k["id"]] = k

sql = """
    INSERT INTO kings (id, name, birth, death, reign, era, description, tags, url)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
"""

for king_id, king in kings_map.items():
    json_tags = king.get("tags", [])

    if json_tags:
        final_tags = json_tags          # JSON tags 있으면 그대로
        source = "json"
    else:
        final_tags = csv_tags_map.get(king_id, [])  # 없으면 CSV에서 보완
        source = "csv"

    print(f"  {king['name']} ({king_id}): [{source}] {final_tags}")

    cursor.execute(sql, (
        king_id,
        king["name"],
        king.get("birth"),
        king.get("death"),
        king.get("reign", ""),
        king.get("era", ""),
        king.get("desc", ""),
        json.dumps(final_tags, ensure_ascii=False),
        king.get("url", "")
    ))

conn.commit()
cursor.close()
conn.close()
print(f"\nkings 테이블 저장 완료 ✓ ({len(kings_map)}명)")