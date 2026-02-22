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

  // GET: 일정 목록 (인증 불필요)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const schedule = await redis.get(`${code}:schedule`) || [];

    // 날짜순 정렬 (가까운 미래 먼저)
    const sorted = schedule.sort((a, b) => new Date(a.date) - new Date(b.date));
    return res.status(200).json(sorted);
  }

  // POST: 일정 추가 (인증 필요)
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { date, title, location, time } = req.body;
    if (!date || !title) {
      return res.status(400).json({ error: '날짜와 제목은 필수입니다' });
    }

    const schedule = await redis.get(`${user.code}:schedule`) || [];
    const newItem = {
      id: generateId(),
      date,
      title,
      location: location || '',
      time: time || '',
      createdAt: new Date().toISOString(),
    };
    schedule.push(newItem);
    await redis.set(`${user.code}:schedule`, schedule);

    return res.status(200).json(newItem);
  }

  // DELETE: 일정 삭제 (인증 필요)
  if (req.method === 'DELETE') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id 파라미터 필요' });

    const schedule = await redis.get(`${user.code}:schedule`) || [];
    const updated = schedule.filter(s => s.id !== id);

    if (updated.length === schedule.length) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다' });
    }

    await redis.set(`${user.code}:schedule`, updated);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
