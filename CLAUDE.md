# Votesite - 선거유세 홈페이지 통합 플랫폼

## Skills

새 후보 홈페이지 생성 시 반드시 `votesite-generator` skill을 참조:

```
~/.claude/skills/votesite-generator/SKILL.md
```

**자동 트리거**: "후보 추가", "선거 홈페이지", "votesite", "유세 페이지" 요청 시 skill 자동 실행.
**정적 콘텐츠 수정**: OG 태그, hero, about 섹션 등은 Skills로 수정 (SKILL.md 참조)

## 현재 후보 (9명)

| 코드 | 이름 | 정당 | 지역 |
|------|------|------|------|
| lsh | 이상호 | 더불어민주당 | 부산진구 |
| njh | 노정현 | 진보당 | 연제구 |
| jdm | 정동만 | 국민의힘 | 기장군 |
| lhs | 이헌승 | 국민의힘 | 부산진구을 |
| css | 차승세 | 더불어민주당 | 해운대구을 |
| ysh | 윤성환 | 국민의힘 | 안성시 제2선거구 |
| yjg | 유지곤 | 조국혁신당 | 대전 서구 |
| jws | 전원석 | 더불어민주당 | 사하구 |
| jhh | 전현희 | 더불어민주당 | 서울시장 |

## 프로젝트 구조

```
votesite/
├── api/              ← Vercel Serverless Functions
│   ├── auth.js           로그인 (JWT)
│   ├── gallery.js        사진 CRUD
│   ├── schedule.js       일정 CRUD
│   ├── pledges.js        공약 CRUD
│   ├── contacts.js       연락처 CRUD
│   ├── videos.js         영상 CRUD
│   ├── news.js           뉴스 CRUD
│   ├── news-meta.js      URL → og:image/title/source
│   ├── youtube-info.js   videoId → title/desc
│   ├── upload.js         Vercel Blob 업로드
│   ├── hero.js           메인 이미지 관리
│   ├── dday.js           D-day 설정
│   └── stats.js          조회수/공유수
├── admin/            ← 관리자 SPA (9탭: 통계/메인이미지/사진/일정/공약/연락처/기사/영상/QR)
├── shared/           ← dynamic-loader.js (히어로이미지/갤러리/일정/공약/연락처/뉴스/영상 동적 로딩)
├── scripts/          ← seed.js, seed-content.js, seed-news-all.js
├── [후보코드]/       ← 후보별 사이트
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── assets/
└── vercel.json
```

## HTML 섹션 순서

hero → about → pledges → gallery → schedule → news → video → contact(+share) → footer

## KV 스키마

```
${code}:password  → bcrypt hash
${code}:gallery   → [{ id, url, caption, order, createdAt }]
${code}:schedule  → [{ id, date, time, title, location, memo, order }]
${code}:pledges   → [{ id, icon, title, desc, details[], order }]
${code}:contacts  → [{ id, type, label, value, url, order }]
${code}:videos    → [{ id, videoId, title, desc, order }]
${code}:news      → [{ id, title, source, url, date, imageUrl, order }]
${code}:hero      → { url, updatedAt }
${code}:dday      → { targetDate, label }
${code}:stats     → { views, shares }
```

## 기술 스택

| 구성요소 | 기술 |
|---------|------|
| 호스팅 | Vercel |
| DB (KV) | Upstash Redis |
| 파일 저장 | Vercel Blob |
| 인증 | bcryptjs + JWT |
| 프론트엔드 | Vanilla JS |

## 배포

```bash
git remote set-url origin git@github.com:monsterrohafa-soft/votesite.git  # SSH 사용 (HTTPS 인증 안됨)
git add [후보코드]/ scripts/seed.js
git commit -m "add: [후보이름] ([정당])"
git push origin main
npx vercel --prod --yes
```

**주의**: HTTPS push 안됨 → SSH remote 필수. skills 실행 시 반드시 git push + vercel deploy까지 완료할 것.

배포 URL: `https://votesite-phi.vercel.app/{code}/`
Admin URL: `https://votesite-phi.vercel.app/admin/`

## 용량 체크 (배포 후 필수)

배포 후 `du -sh .git` 및 `du -ch */assets | tail -1`로 용량 확인.

| 서비스 | ⚠️ 경고 | 🚨 위험 | 한도 |
|--------|---------|---------|------|
| Git 레포 (.git) | 500MB | 800MB | 권장 1GB |
| 이미지 합계 | 200MB | 400MB | - |
| Vercel Blob | 50GB | 80GB | Pro 100GB |

임계값 초과 시 사용자에게 경고 메시지 출력. 위험 기준 초과 시 이미지 Blob 이전 권장.
