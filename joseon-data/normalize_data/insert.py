import json
import os
import pymysql

BASE = os.path.dirname(os.path.abspath(__file__))

conn = pymysql.connect(
    host="localhost",
    port=3306,
    user="root",
    password="1024",
    database="joseon_db",
    charset="utf8mb4"
)
cursor = conn.cursor()

def insert_place(place: dict):
    sql = """
        INSERT INTO places
            (id, name, category, description, image_url, lat, lng, address, tags, extra)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name)
    """
    cursor.execute(sql, (
        place["id"],
        place["name"],
        place["category"],
        place.get("description", ""),
        place.get("image_url", ""),
        place.get("lat"),
        place.get("lng"),
        place.get("address", ""),
        json.dumps(place.get("tags", []),  ensure_ascii=False),
        json.dumps(place.get("extra", {}), ensure_ascii=False),
    ))

# 3개 파일 순서대로 INSERT
files = [
    "normalized_tombs.json",
    "normalized_palaces.json",
    "normalized_sites.json",
]

for filename in files:
    filepath = os.path.join(BASE, filename)
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)
    for item in data:
        insert_place(item)
    print(f"{filename}: {len(data)}개 삽입 완료")

conn.commit()
cursor.close()
conn.close()
print("\nMySQL 저장 완료 ✓")