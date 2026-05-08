# geocode_fill.py
# lat/lng 없는 것 + address 없는 것 모두 채우기

import requests
import pymysql
import time
import os
from dotenv import load_dotenv

load_dotenv()

KAKAO_REST_KEY = os.getenv('KAKAO_REST_KEY')
DB_CONFIG = {
    'host':     os.getenv('DB_HOST'),
    'port':     int(os.getenv('DB_PORT')),
    'user':     os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'charset':  'utf8mb4',
}

def geocode_keyword(query):
    url = 'https://dapi.kakao.com/v2/local/search/keyword.json'
    headers = {'Authorization': f'KakaoAK {KAKAO_REST_KEY}'}
    try:
        res = requests.get(url, headers=headers, params={'query': query, 'size': 1}, timeout=5)
        docs = res.json().get('documents', [])
        if docs:
            lat = float(docs[0]['y'])
            lng = float(docs[0]['x'])
            addr = docs[0].get('road_address_name') or docs[0].get('address_name', '')
            return lat, lng, addr
    except: pass
    return None, None, None

def main():
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # lat/lng NULL 이거나 address NULL인 것 전체
    cursor.execute("""
        SELECT id, name, address 
        FROM places 
        WHERE lat IS NULL OR lng IS NULL OR address IS NULL OR address = ''
        ORDER BY id
    """)
    rows = cursor.fetchall()
    print(f'📍 처리할 장소: {len(rows)}개\n')

    success = fail = 0
    for place_id, name, address in rows:
        lat, lng, found_address = None, None, None

        # 1차: 이름으로 검색
        lat, lng, found_address = geocode_keyword(name)

        # 2차: 조선 + 이름
        if not lat:
            lat, lng, found_address = geocode_keyword(f'조선 {name}')

        # 3차: 주소로 검색 (주소는 있고 좌표만 없는 경우)
        if not lat and address:
            lat, lng, found_address = geocode_keyword(address)

        if lat and lng:
            new_address = found_address if (not address or address == '') else address
            cursor.execute(
                'UPDATE places SET lat=%s, lng=%s, address=%s WHERE id=%s',
                (lat, lng, new_address, place_id)
            )
            conn.commit()
            print(f'  ✅ {name} ({place_id})')
            print(f'     좌표: {lat:.5f}, {lng:.5f}')
            print(f'     주소: {new_address}')
            success += 1
        else:
            print(f'  ❌ {name} ({place_id}) — 못 찾음')
            fail += 1

        time.sleep(0.15)

    cursor.close()
    conn.close()
    print(f'\n완료! 성공: {success}개 / 실패: {fail}개')

if __name__ == '__main__':
    main()