import json
import os

# ── 경로 설정 ──────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "..", "data")

SITES_PATH   = os.path.join(DATA, "heritages_data", "historic_sites",   "sites.json")
PALACES_PATH = os.path.join(DATA, "heritages_data", "palaces_jongmyo",  "palaces_raw.json")
TOMBS_PATH   = os.path.join(DATA, "heritages_data", "royal_tombs",      "royal_tombs.json")

OUT_SITES   = os.path.join(BASE, "normalized_sites.json")
OUT_PALACES = os.path.join(BASE, "normalized_palaces.json")
OUT_TOMBS   = os.path.join(BASE, "normalized_tombs.json")

SITES_PREFIX = {
    "사적":  "sajuk",
    "궁궐":  "site_palace",
    "왕릉":  "site_tomb",
    "종묘":  "jongmyo",
    "박물관": "museum",
}

# ── 1. royal_tombs.json ───────────────────────────────
with open(TOMBS_PATH, encoding="utf-8") as f:
    tombs = json.load(f)

normalized_tombs = []
for idx, item in enumerate(tombs, start=1):
    normalized_tombs.append({
        "id":          f"tomb_{idx}",
        "name":        item.get("tomb_name", ""),
        "category":    "왕릉",
        "description": "",
        "image_url":   "",
        "lat":         None,
        "lng":         None,
        "address":     item.get("address", ""),
        "tags":        [],
        "extra": {
            "kings_name":    item.get("name", ""),
            "order":         item.get("order", ""),
            "heritage_name": item.get("heritage_name", ""),
            "phone":         item.get("phone", "")
        }
    })

with open(OUT_TOMBS, "w", encoding="utf-8") as f:
    json.dump(normalized_tombs, f, ensure_ascii=False, indent=2)
print(f"왕릉 완료: {len(normalized_tombs)}개")


# ── 2. palaces_raw.json ───────────────────────────────
with open(PALACES_PATH, encoding="utf-8") as f:
    palaces = json.load(f)

normalized_palaces = []
for item in palaces:
    normalized_palaces.append({
        "id":          f"palace_{item['serial_number']}",
        "name":        item["name"],
        "category":    item.get("category", "궁궐"),
        "description": item.get("description", ""),
        "image_url":   item.get("image_url", ""),
        "lat":         item.get("lat"),
        "lng":         item.get("lng"),
        "address":     item.get("address") or "",
        "tags":        item.get("tags") or [],
        "extra": {
            "gung_name":     item.get("gung_name", ""),
            "gung_number":   item.get("gung_number"),
            "name_en":       item.get("name_en") or "",
            "detail_images": item.get("detail_images")
        }
    })

with open(OUT_PALACES, "w", encoding="utf-8") as f:
    json.dump(normalized_palaces, f, ensure_ascii=False, indent=2)
print(f"궁궐 완료: {len(normalized_palaces)}개")


# ── 3. sites.json ─────────────────────────────────────
with open(SITES_PATH, encoding="utf-8") as f:
    sites = json.load(f)

category_counter = {}
normalized_sites = []

for item in sites:
    category = item.get("category", "사적")
    prefix   = SITES_PREFIX.get(category, "place")
    category_counter[category] = category_counter.get(category, 0) + 1
    num = category_counter[category]

    normalized_sites.append({
        "id":          f"{prefix}_{num}",
        "name":        item["name"],
        "category":    category,
        "description": item.get("description", ""),
        "image_url":   item.get("image_url", ""),
        "lat":         float(item["lat"]) if item.get("lat") else None,
        "lng":         float(item["lng"]) if item.get("lng") else None,
        "address":     item.get("address", ""),
        "tags":        item.get("tags") or [],
        "extra": {
            "era": item.get("era", "")
        }
    })

with open(OUT_SITES, "w", encoding="utf-8") as f:
    json.dump(normalized_sites, f, ensure_ascii=False, indent=2)

print(f"sites.json 완료:")
for cat, cnt in category_counter.items():
    prefix = SITES_PREFIX.get(cat, "place")
    print(f"  {cat}: {cnt}개  ({prefix}_1 ~ {prefix}_{cnt})")


# ── 4. 중복 id 검사 ───────────────────────────────────
all_data = normalized_tombs + normalized_palaces + normalized_sites
all_ids  = [d["id"] for d in all_data]
dupes    = [i for i in set(all_ids) if all_ids.count(i) > 1]

if dupes:
    print(f"\n경고: 중복 id 발견 → {dupes}")
else:
    print(f"\n전체 {len(all_ids)}개 — id 중복 없음 ✓")