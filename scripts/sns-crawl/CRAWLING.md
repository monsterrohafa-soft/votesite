# SNS 크롤링 도구 (2026 지방선거)

## 개요
2026 지방선거 예비후보자 2,810명의 SNS 계정(인스타그램, 페이스북, 블로그, 유튜브, 트위터)과 전화번호를 자동으로 검색하는 도구.

## 핵심 파일

| 파일 | 용도 |
|------|------|
| `sns_search_chrome.py` | **메인 스크립트** - Chrome 자동화로 Google 검색하여 SNS 추출 |
| `SNS_Chrome_Search.bat` | Windows 더블클릭 실행용 배치파일 |
| `merge_to_excel.py` | SNS 결과 → 엑셀 통합 (독립 실행 가능) |
| `sns_search_all.py` | Claude Agent용 DuckDuckGo 검색 (토큰 필요) |
| `run.sh` | Linux/WSL 실행 스크립트 |

## 실행 방법

### 방법 1: Windows 더블클릭 (권장)
```
SNS_Chrome_Search.bat 더블클릭
```
- pip 패키지 자동 설치
- 4가지 메뉴: 미완료 배치 / 전체 재검색 / 엑셀만 / 특정 배치

### 방법 2: 직접 실행
```bash
# 필수 패키지
pip install undetected-chromedriver selenium webdriver-manager openpyxl

# 미완료 배치만
python sns_search_chrome.py

# 전체 재처리
python sns_search_chrome.py --reprocess

# 특정 배치
python sns_search_chrome.py --batch 11

# 엑셀 통합만
python sns_search_chrome.py --merge-only

# 옵션
python sns_search_chrome.py --headless --delay 3 --engine naver
```

## 아키텍처

### 검색 전략
1. `undetected-chromedriver`로 Chrome 실행 (Google 봇탐지 우회)
2. 검색 쿼리: `{이름}+{정당}+{지역}+인스타그램+페이스북+SNS`
3. 페이지 소스에서 후보자 이름 근처(1000자 이내) SNS URL만 추출
4. 이름 근처 필터링으로 무관한 SNS 계정 배제

### Chrome 버전 자동 감지
`detect_chrome_version()` 함수가 설치된 Chrome 버전을 자동 감지하여 맞는 ChromeDriver를 다운로드. 버전 불일치 에러 방지.

### SNS URL 추출 패턴
```
instagram.com/{username}  → 인스타그램
facebook.com/{username}   → 페이스북
x.com/{username}          → 트위터
youtube.com/@{channel}    → 유튜브
blog.naver.com/{id}       → 블로그
{id}.tistory.com          → 블로그
```

### 전화번호 추출
- 한국 전화번호 패턴: `02-xxxx-xxxx`, `010-xxxx-xxxx`, `031-xxx-xxxx`
- 후보자 이름 근처 200~300자 범위에서만 추출

### 배치 구조
- 총 2,810명 → 17개 배치 (각 ~200명)
- 배치별 입력: `batch_{N}.json`
- 배치별 결과: `result_batch_{N}.json`
- 10명마다 자동 저장 + 이어하기 지원

### 엑셀 출력
- 시트: 요약 / 시도지사 / 교육감 / 구시군의장 / 시도의회의원 / 구시군의회의원
- 정당별 색상 (민주당 파랑, 국민의힘 빨강 등)
- SNS URL 하이퍼링크 자동 연결
- 필터, 틀고정, 열너비 자동 설정

## 데이터 파일 경로
```
바탕화면/
├── election_2026_전체후보자.json      ← 원본 후보자 데이터
├── election_2026_전체후보자_SNS포함.xlsx ← 최종 결과
└── sns_search/
    ├── sns_search_chrome.py           ← 메인 스크립트
    ├── SNS_Chrome_Search.bat          ← 실행 배치
    ├── batch_{1~17}.json              ← 배치 입력
    ├── result_batch_{1~17}.json       ← 배치 결과
    └── chrome_search_progress.json    ← 진행상황
```

## 주의사항
- Chrome 브라우저 필수 (Edge 불가)
- Google 검색 간격 최소 2초 (`--delay 2`) 권장 - 너무 빠르면 CAPTCHA
- `undetected-chromedriver`가 없으면 일반 selenium으로 폴백 (봇탐지 당할 수 있음)
- 한자 이름 자동 제거: `김형남(金炯男)` → `김형남`
- 시도+선거구 중복 자동 제거: 시도지사는 `서울특별시 서울특별시` → `서울특별시`

## 재활용 가이드
다른 선거/대상에 재활용 시:
1. `SOURCE_FILE` 경로를 새 JSON으로 변경
2. `batch_{N}.json` 형식으로 대상 목록 분할
3. `search_one_candidate()`의 검색 쿼리 패턴 조정
4. `SNS_FIELDS` 필요시 확장
