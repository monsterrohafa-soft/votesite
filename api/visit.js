import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'code 필요' });

  // POST: 방문 기록
  if (req.method === 'POST') {
    const today = new Date().toISOString().slice(0, 10);
    await redis.incr(`${code}:visits:total`);
    await redis.incr(`${code}:visits:${today}`);
    return res.status(200).json({ ok: true });
  }

  // GET: 통계 조회 (Admin용)
  if (req.method === 'GET') {
    const total = await redis.get(`${code}:visits:total`) || 0;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = await redis.get(`${code}:visits:${today}`) || 0;

    // 최근 7일 통계
    const daily = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = await redis.get(`${code}:visits:${dateStr}`) || 0;
      daily.push({ date: dateStr, count: Number(count) });
    }

    return res.status(200).json({ total: Number(total), today: Number(todayCount), daily });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
