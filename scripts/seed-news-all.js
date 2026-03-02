import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function genId(offset = 0) {
  return (Date.now() + offset).toString(36) + Math.random().toString(36).slice(2, 8);
}

function buildNews(items) {
  return items.map((item, i) => ({
    id: genId(i),
    ...item,
    imageUrl: '',
    order: i,
    createdAt: new Date().toISOString(),
  }));
}

const allNews = {
  lsh: [
    { title: '이상호 민주당 정책위 부의장, 부산진구청장 예비후보자자격심사 신청 완료', source: '국제뉴스', url: 'https://www.gukjenews.com/news/articleView.html?idxno=3485245', date: '2026-01-19' },
    { title: '이상호, 6·3 지방선거 전 부울경 통합 결단을 촉구', source: 'GNA', url: 'https://www.globalnewsagency.kr/news/articleView.html?idxno=458082', date: '2025-12-15' },
    { title: '부산·경남 행정통합 추진 — 박형준 시장 사퇴 요구', source: '부산일보', url: 'https://www.busan.com/view/busan/view.php?code=2024011418142033797', date: '2024-01-14' },
  ],
  njh: [
    { title: '진보당 노정현 다시 연제 출사표…이번에도 단일화 이뤄낼까', source: 'CBS 노컷뉴스', url: 'https://www.nocutnews.co.kr/news/6451998', date: '2025-11-20' },
    { title: '달아오르는 연제구청장 선거…부산 유일 4개 정당 맞붙나', source: '국제신문', url: 'https://www.kookje.co.kr/news2011/asp/newsbody.asp?code=0100&key=20251125.22005008024', date: '2025-11-25' },
    { title: "'연제 삼국지' 예고… 친여권 단일화냐, 보수 진영 반전 카드냐", source: '이투데이', url: 'https://www.etoday.co.kr/news/view/2540101', date: '2025-12-01' },
    { title: "'졌잘싸' 진보당 노정현 부산서 소수정당 가능성 보여", source: 'SBS', url: 'https://news.sbs.co.kr/news/endPage.do?news_id=N1007606730', date: '2024-04-11' },
  ],
  jdm: [
    { title: '정동만 의원, 내년도 기장군 국비 2067억원 확보', source: '머니S', url: 'https://www.moneys.co.kr/article/2025120409294636783', date: '2025-12-04' },
    { title: '정동만 의원, 국민의힘 부산시당 위원장으로 선출', source: '겟뉴스', url: 'https://www.getnews.co.kr/news/articleView.html?idxno=830905', date: '2025-07-13' },
    { title: '정동만 의원, 국회의원 소통대상 수상', source: '머니S', url: 'https://www.moneys.co.kr/article/2025111413350268641', date: '2025-11-14' },
    { title: '기장군 산단 공업용수 공급 방안 확정', source: '겟뉴스', url: 'https://www.getnews.co.kr/news/articleView.html?idxno=814551', date: '2025-04-02' },
  ],
  lhs: [
    { title: '4선 이헌승 의원, 국민의힘 원내대표 선거 출마', source: 'KNN', url: 'https://news.knn.co.kr/news/article/173903', date: '2025-06-14' },
    { title: '부산 4선 이헌승, 국힘 원내대표 출마···김성원·송언석과 3파전', source: '경향신문', url: 'https://www.khan.co.kr/article/202506141633001', date: '2025-06-14' },
    { title: '4선 이헌승, 국민의힘 원내대표 출마…김성원·송언석과 3파전', source: '헤럴드경제', url: 'https://biz.heraldcorp.com/article/10509217', date: '2025-06-14' },
    { title: '4선 이헌승 의원, 국민의힘 원내대표 선거 출마‥3파전', source: 'MBC', url: 'https://imnews.imbc.com/news/2025/politics/article/6725584_36711.html', date: '2025-06-14' },
  ],
  ysh: [
    { title: '윤성환 "멈춰 선 동안성, 이제는 뚫겠다"… 경기도의원 안성 제2선거구 출마 선언', source: '경기신문', url: 'https://www.kgnews.co.kr/news/article.html?no=883722', date: '2026-02-05' },
    { title: '윤성환 국민의힘 안성 당협위 부위원장, 경기도의원 출마 선언', source: '스마트비즈', url: 'https://www.smartbizn.com/news/articleView.html?idxno=135010', date: '2026-02-05' },
    { title: '안성 6.3 지방선거 30·40대 정치 신인 대거 도전···지역 정치 세대교체 신호탄', source: '스마트에프엔', url: 'https://www.smartfn.co.kr/news/articleView.html?idxno=132134', date: '2026-01-20' },
  ],
  jws: [
    { title: "'을숙도 장비' 전원석, 사하구청장 출마 수면 위로", source: '이투데이', url: 'https://www.etoday.co.kr/news/view/2545633', date: '2026-01-15' },
    { title: '전원석 시의원 "다대 한진 부지, 1,700억 공공기여 이행 검증 촉구"', source: '이투데이', url: 'https://www.etoday.co.kr/news/view/2522989', date: '2025-11-10' },
    { title: '전원석 시의원, 하수관로·건설 하자 등 부산 도시 문제 전방위 질타', source: '아주경제', url: 'https://www.ajunews.com/view/20250901152141875', date: '2025-09-01' },
    { title: '전원석 의원 "삼정 더파크 동물원, 껍데기뿐인 재개장 안 돼"', source: '내외일보', url: 'https://www.naewoeilbo.com/news/articleView.html?idxno=2298410', date: '2026-01-20' },
    { title: '"부산 사하구, 민주당 국회의원·시의원 동시 배출 목표"', source: '뉴시스', url: 'https://www.newsis.com/view/NISX20240316_0002663103', date: '2024-03-16' },
  ],
  yjg: [
    { title: "유지곤 \"낡은 엔진 떼고, 대전 서구 재창업하겠다\"", source: '굿모닝충청', url: 'https://www.goodmorningcc.com/news/articleView.html?idxno=441412', date: '2026-02-23' },
    { title: '조국혁신당 유지곤, 대전 한민시장서 서구청장 출마 선언', source: '굿모닝충청', url: 'https://www.goodmorningcc.com/news/articleView.html?idxno=441117', date: '2026-02-21' },
    { title: '유지곤 조국혁신당 위원장, 대전 서구청장 출마 공식화', source: '충청투데이', url: 'https://www.cctoday.co.kr/news/articleView.html?idxno=2226031', date: '2026-02-23' },
    { title: "조국혁신당 유지곤 \"서구 재창업 엔진 켜겠다\"", source: '금강일보', url: 'https://www.ggilbo.com/news/articleView.html?idxno=1143087', date: '2026-02-21' },
    { title: "\"정치는 삶의 공학\"…창업가에서 정치인으로, 유지곤의 도전", source: '굿모닝충청', url: 'https://www.goodmorningcc.com/news/articleView.html?idxno=433238', date: '2025-09-01' },
  ],
};

async function seedNews() {
  console.log('🌱 뉴스 기사 시딩 시작...\n');

  for (const [code, items] of Object.entries(allNews)) {
    const existing = await redis.get(`${code}:news`);
    if (existing && existing.length > 0) {
      console.log(`  ⏭️  ${code}: 뉴스 이미 존재 (${existing.length}개) - 스킵`);
      continue;
    }
    const newsItems = buildNews(items);
    await redis.set(`${code}:news`, newsItems);
    console.log(`  ✅ ${code}: 뉴스 ${items.length}개 시딩`);
  }

  console.log('\n📸 og:image 썸네일 가져오기...\n');

  for (const code of Object.keys(allNews)) {
    const news = await redis.get(`${code}:news`);
    let updated = false;
    for (const item of news) {
      if (item.imageUrl) continue;
      try {
        const res = await fetch(item.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept-Language': 'ko-KR,ko;q=0.9',
            'Accept': 'text/html',
          },
          redirect: 'follow',
        });
        if (!res.ok) {
          console.log(`  ❌ ${code}: ${item.title.substring(0, 30)}... (${res.status})`);
          continue;
        }
        const html = await res.text();
        const m = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i) ||
                  html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:image"/i);
        if (m) {
          item.imageUrl = m[1];
          updated = true;
          console.log(`  ✅ ${code}: ${item.title.substring(0, 40)}...`);
        } else {
          console.log(`  ⚠️  ${code}: og:image 없음 - ${item.title.substring(0, 30)}...`);
        }
      } catch (e) {
        console.log(`  ❌ ${code}: ${item.title.substring(0, 30)}... (${e.message})`);
      }
    }
    if (updated) await redis.set(`${code}:news`, news);
  }

  console.log('\n🎉 뉴스 시딩 완료!');
}

seedNews().catch(console.error);
