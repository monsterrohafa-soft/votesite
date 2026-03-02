#!/bin/bash
# ============================================================
# 2026 지방선거 후보자 SNS 검색 실행 스크립트
# ============================================================
# 사용법:
#   bash run.sh              # 미완료 배치만 처리 (기본)
#   bash run.sh all          # 전체 재처리
#   bash run.sh 11           # 특정 배치만
#   bash run.sh merge        # 엑셀 통합만
# ============================================================

cd /home/rohafa/sns_search

case "${1}" in
  all)
    echo "=== 전체 2,810명 재처리 ==="
    python3 -u sns_search_all.py --reprocess --delay 2
    ;;
  merge)
    echo "=== 엑셀 통합만 ==="
    python3 -u sns_search_all.py --merge-only
    ;;
  [0-9]*)
    echo "=== 배치 ${1} 처리 ==="
    python3 -u sns_search_all.py --batch "${1}" --delay 2
    ;;
  *)
    echo "=== 미완료 배치 처리 ==="
    python3 -u sns_search_all.py --delay 2
    ;;
esac
