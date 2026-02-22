# Votesite - 선거유세 홈페이지 통합 플랫폼

## Skills

새 후보 홈페이지 생성 시 반드시 `votesite-generator` skill을 참조:

```
~/.claude/skills/votesite-generator/SKILL.md
```

**자동 트리거**: "후보 추가", "선거 홈페이지", "votesite", "유세 페이지" 요청 시 skill 자동 실행.

## 프로젝트 구조

```
votesite/
├── api/              ← Vercel Serverless Functions
├── admin/            ← 관리자 SPA
├── shared/           ← dynamic-loader.js (공용)
├── scripts/          ← seed.js, migrate-images.js
├── [후보코드]/       ← 후보별 사이트 (lsh, njh, jdm, lhs 등)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── assets/
└── vercel.json
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
git add [후보코드]/ scripts/seed.js
git commit -m "add: [후보이름] ([정당])"
git push origin main
npx vercel --prod --yes
```

배포 URL: `https://votesite-phi.vercel.app/{code}/`
