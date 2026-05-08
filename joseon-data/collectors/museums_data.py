import requests
import pandas as pd
import json
from pathlib import Path


SERVICE_KEY = "8234266696e38191164dd04df31ce2fdaf12e2bf614697db409906a0cc2d5c40"

URL = "https://apis.data.go.kr/1741000/museums_and_art_galleries/info"


params = {
    "ServiceKey": SERVICE_KEY,
    "pageNo": 1,
    "numOfRows": 100,
    "resultType": "json"
}


response = requests.get(URL, params=params)

data = response.json()


# 실제 데이터 위치 접근
items = data["response"]["body"]["items"]["item"]


df = pd.DataFrame(items)


# 저장 경로 자동 생성
BASE_DIR = Path(__file__).resolve().parent.parent
SAVE_DIR = BASE_DIR / "data" / "heritages_data" / "museums"

SAVE_DIR.mkdir(parents=True, exist_ok=True)


csv_path = SAVE_DIR / "museums_data.csv"
json_path = SAVE_DIR / "museums_data.json"


df.to_csv(csv_path, index=False, encoding="utf-8-sig")

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, indent=4)


print("저장 완료 위치:")
print(csv_path)
print(json_path)