/**
 * seed-edubusan-2026-05.js
 *
 * 최윤홍(edubusan) 영상/뉴스 최신화 시드 — Upstash REST API 직접 호출 (의존성 없음)
 *  - 비디오: 새 4개로 강제 덮어쓰기
 *  - 뉴스: 핵심 5개 (출판기념회 '부산교육 체인지' 등)로 강제 덮어쓰기 + og:image 자동 수집
 *
 * 사용법:
 *   set -a && source .env.local && set +a && node scripts/seed-edubusan-2026-05.js
 */

const URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
if (!URL || !TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN 환경변수 필요');
  process.exit(1);
}

const CODE = 'edubusan';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const wrap = (arr) => arr.map((x, i) => ({ id: genId(), ...x, order: i, createdAt: new Date().toISOString() }));

async function kvSet(key, value) {
  const res = await fetch(`${URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  if (!res.ok) {
    throw new Error(`SET ${key} failed: ${res.status} ${await res.text()}`);
  }
}

const videos = [
  {
    videoId: 'VY9yMTVGIxs',
    title: '부산교육감 재선거 방송연설 | 최윤홍 후보',
    desc: 'KBS 공식 방송연설 — 35년 교육 외길의 약속',
  },
  {
    videoId: 'rMjVUq2gqsU',
    title: '주요 공약 인터뷰 | 헬로이슈토크',
    desc: '부산시교육감 재선거 시동, 최윤홍 예비후보 주요 공약',
  },
  {
    videoId: 'sLKULgvwYik',
    title: '후보 등록 인터뷰',
    desc: '최윤홍 부산교육감 재선거 후보 등록 현장',
  },
  {
    videoId: 'WxMgz23Glnc',
    title: '부산교육감 재선거 공약 — 후보 비교',
    desc: '최윤홍·정승윤·김석준 공약 비교 보도',
  },
];

const news = [
  {
    title: "최윤홍 부산교육감 후보, 출판기념회서 '부산교육 체인지' 선언",
    source: '울산뉴스넷',
    url: 'https://ulsannews.net/12292',
    date: '2026-04-15',
  },
  {
    title: "'부산 교육, 더는 미룰 수 없다'…최윤홍 '기본부터 다시'",
    source: '문화뉴스',
    url: 'https://www.mhns.co.kr/news/articleView.html?idxno=744629',
    date: '2026-04-10',
  },
  {
    title: '최윤홍 부산교육감 예비후보, 부산 교실환경 바꾸겠다',
    source: '매일신문',
    url: 'https://www.imaeil.com/page/view/2026030415441866386',
    date: '2026-03-04',
  },
  {
    title: '부산 보수 교육감 후보 단일화 평행선, 3자 구도로 가나',
    source: '부산일보',
    url: 'https://mobile.busan.com/view/busan/view.php?code=2026050609292758011',
    date: '2026-05-06',
  },
  {
    title: '김석준·최윤홍 후보 등록… 부산교육감 3자 구도 현실로?',
    source: '부산일보',
    url: 'https://mobile.busan.com/view/busan/view.php?code=2025031318295100896',
    date: '2025-03-13',
  },
];

async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']*)["']/i) ||
      html.match(/<meta\s+content=["']([^"']*)["']\s+(?:property|name)=["']og:image["']/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('🎬 영상 4개 강제 덮어쓰기...');
  await kvSet(`${CODE}:videos`, wrap(videos));
  console.log('  ✅ videos 저장 완료');

  console.log('\n📰 뉴스 5개 강제 덮어쓰기 + og:image 수집...');
  const newsItems = wrap(news);
  for (const item of newsItems) {
    const og = await fetchOgImage(item.url);
    if (og) {
      item.imageUrl = og;
      console.log(`  ✅ ${item.title.substring(0, 35)}... → 썸네일 OK`);
    } else {
      console.log(`  ⚠️  ${item.title.substring(0, 35)}... → og:image 없음`);
    }
  }
  await kvSet(`${CODE}:news`, newsItems);
  console.log('  ✅ news 저장 완료');

  console.log('\n🎉 완료!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
