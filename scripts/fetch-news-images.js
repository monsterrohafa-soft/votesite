import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const news = await redis.get('css:news');
console.log('현재 기사:', news.length, '개\n');

for (const item of news) {
  if (item.imageUrl) {
    console.log('  스킵 (이미지 있음):', item.title);
    continue;
  }
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
      console.log('  ❌ 응답 실패:', item.title, res.status);
      continue;
    }
    const html = await res.text();
    const m = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i) ||
              html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:image"/i);
    if (m) {
      item.imageUrl = m[1];
      console.log('  ✅', item.title);
      console.log('     ->', m[1].substring(0, 100));
    } else {
      console.log('  ⚠️  og:image 없음:', item.title);
    }
  } catch (e) {
    console.log('  ❌ 실패:', item.title, e.message);
  }
}

await redis.set('css:news', news);
console.log('\n✅ 업데이트 완료');
