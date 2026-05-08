# summarize_places.py
# 실행: python summarize_places.py
# 역할: places 테이블의 description을 Claude API로 3~4줄 요약 → summary 컬럼에 저장

import anthropic
import pymysql
import time
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host':     os.getenv('DB_HOST'),
    'port':     int(os.getenv('DB_PORT')),
    'user':     os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'charset':  'utf8mb4',
}

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# ... 나머지 코드 동일

def summarize(name, description):
    """Claude API로 설명 요약"""
    try:
        message = client.messages.create(
            model='claude-haiku-4-5-20251001',  # 빠르고 저렴한 모델
            max_tokens=300,
            messages=[{
                'role': 'user',
                'content': f"""다음 한국 역사 유적지 설명을 3~4문장으로 간결하게 요약해줘.
핵심 역사적 의미와 특징만 담아서 일반 방문객이 읽기 쉽게 써줘.
요약문만 출력하고 다른 말은 하지 마.

장소명: {name}
설명: {description}"""
            }]
        )
        return message.content[0].text.strip()
    except Exception as e:
        print(f'  ⚠️  API 오류: {e}')
        return None

def main():
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # summary가 없고 description이 있는 장소 조회
    cursor.execute("""
        SELECT id, name, description 
        FROM places 
        WHERE (summary IS NULL OR summary = '')
          AND description IS NOT NULL 
          AND description != ''
        ORDER BY id
    """)
    rows = cursor.fetchall()
    print(f'📝 요약할 장소: {len(rows)}개\n')

    success = fail = 0
    for i, (place_id, name, description) in enumerate(rows):
        print(f'  [{i+1}/{len(rows)}] {name} ({place_id})...')
        summary = summarize(name, description)

        if summary:
            cursor.execute(
                'UPDATE places SET summary=%s WHERE id=%s',
                (summary, place_id)
            )
            conn.commit()
            print(f'  ✅ 완료: {summary[:50]}...')
            success += 1
        else:
            print(f'  ❌ 실패: {name}')
            fail += 1

        time.sleep(0.3)  # API 요청 간격

    cursor.close()
    conn.close()
    print(f'\n완료! 성공: {success}개 / 실패: {fail}개')

if __name__ == '__main__':
    main()