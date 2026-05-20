# votesite CLAUDE.md

## 기본 원칙
- 항상 한국어로 답하고, 사용자는 `상규형`이라고 부른다.
- 작업 전 `PROJECT_STATUS.md`, 최근 `logs/`, `SESSION_HANDOFF.md`, `HARNESS.md`를 먼저 확인한다.
- 후보별 콘텐츠는 사실 확인 없는 추정 반영 금지.

## 프로젝트 정보
- 프로젝트명: votesite
- 저장소 경로: `/Users/riky/project/votesite`
- GitHub: `monsterrohafa-soft/votesite`
- 기술 스택: Vercel Functions + Vanilla JS + Upstash Redis + Vercel Blob
- 관련 문서: `/home/riky/nas-obsidian/02. share/00. 프로젝트관리/votesite/`

## 구조 메모
- `admin/`: 관리자 화면
- `api/`: Vercel Serverless Functions
- 후보별 폴더: 정적 사이트 엔트리
- `shared/`: 공용 로더/유틸
- `scripts/`: 시드/보조 스크립트

## 작업 규칙
- 후보별 폴더 구조를 섞지 않는다.
- 관리자 데이터/연락처/공약/뉴스/영상은 사실 확인 후 반영한다.
- `package.json` scripts가 비어 있으므로 실행/배포 명령은 추정하지 말고 실제 방식 기준으로 다룬다.

## 배포 메모
- Vercel 배포 기반
- SSH git remote 사용
- 배포 전 변경 후보/관리자 반영 범위를 확인한다.

## 작업 후
- 변경 파일/검증 결과/남은 이슈를 정리한다.
- 옵시디언 프로젝트 문서에 로그와 상태를 업데이트한다.
