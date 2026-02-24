import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: 관련기사 목록 (인증 불필요)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const news = await redis.get(`${code}:news`) || [];
    const sorted = news.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return res.status(200).json(sorted);
  }

  // POST: 관련기사 추가 (인증 필요)
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { title, source, url, date, imageUrl } = req.body;
    if (!title) {
      return res.status(400).json({ error: '기사 제목은 필수입니다' });
    }
    if (!url) {
      return res.status(400).json({ error: '기사 링크 URL은 필수입니다' });
    }

    const news = await redis.get(`${user.code}:news`) || [];
    const newItem = {
      id: generateId(),
      title,
      source: source || '',
      url,
      date: date || '',
      imageUrl: imageUrl || '',
      order: news.length,
      createdAt: new Date().toISOString(),
    };
    news.push(newItem);
    await redis.set(`${user.code}:news`, news);

    return res.status(200).json(newItem);
  }

  // PUT: 관련기사 수정 (인증 필요)
  if (req.method === 'PUT') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id, title, source, url, date, imageUrl, order } = req.body;
    if (!id) return res.status(400).json({ error: 'id 필수' });

    const news = await redis.get(`${user.code}:news`) || [];
    const idx = news.findIndex(n => n.id === id);
    if (idx === -1) return res.status(404).json({ error: '기사를 찾을 수 없습니다' });

    if (title !== undefined) news[idx].title = title;
    if (source !== undefined) news[idx].source = source;
    if (url !== undefined) news[idx].url = url;
    if (date !== undefined) news[idx].date = date;
    if (imageUrl !== undefined) news[idx].imageUrl = imageUrl;
    if (order !== undefined) news[idx].order = order;

    await redis.set(`${user.code}:news`, news);
    return res.status(200).json(news[idx]);
  }

  // DELETE: 관련기사 삭제 (인증 필요)
  if (req.method === 'DELETE') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id 파라미터 필요' });

    const news = await redis.get(`${user.code}:news`) || [];
    const updated = news.filter(n => n.id !== id);

    if (updated.length === news.length) {
      return res.status(404).json({ error: '기사를 찾을 수 없습니다' });
    }

    await redis.set(`${user.code}:news`, updated);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
