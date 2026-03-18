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

  // GET: 공약 목록 (인증 불필요)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const pledges = await redis.get(`${code}:pledges`) || [];
    // order가 없는 항목에 인덱스 기반 order 자동 부여
    let needsSave = false;
    pledges.forEach((p, i) => {
      if (p.order === undefined || p.order === null) {
        p.order = i;
        needsSave = true;
      }
    });
    if (needsSave) {
      await redis.set(`${code}:pledges`, pledges);
    }
    const sorted = pledges.sort((a, b) => a.order - b.order);
    return res.status(200).json(sorted);
  }

  // POST: 공약 추가 (인증 필요)
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { title, desc, icon, details } = req.body;
    if (!title) {
      return res.status(400).json({ error: '제목은 필수입니다' });
    }

    const pledges = await redis.get(`${user.code}:pledges`) || [];
    const newItem = {
      id: generateId(),
      title,
      desc: desc || '',
      icon: icon || 'fas fa-bullhorn',
      details: Array.isArray(details) ? details : [],
      order: pledges.length,
      createdAt: new Date().toISOString(),
    };
    pledges.push(newItem);
    await redis.set(`${user.code}:pledges`, pledges);

    return res.status(200).json(newItem);
  }

  // PUT: 공약 수정 (인증 필요)
  if (req.method === 'PUT') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id, title, desc, icon, details, order } = req.body;
    if (!id) return res.status(400).json({ error: 'id 필수' });

    const pledges = await redis.get(`${user.code}:pledges`) || [];
    const idx = pledges.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: '공약을 찾을 수 없습니다' });

    if (title !== undefined) pledges[idx].title = title;
    if (desc !== undefined) pledges[idx].desc = desc;
    if (icon !== undefined) pledges[idx].icon = icon;
    if (details !== undefined) pledges[idx].details = details;
    if (order !== undefined) pledges[idx].order = order;

    await redis.set(`${user.code}:pledges`, pledges);
    return res.status(200).json(pledges[idx]);
  }

  // PATCH: 공약 순서 변경 (인증 필요)
  if (req.method === 'PATCH') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids 배열 필수' });

    const pledges = await redis.get(`${user.code}:pledges`) || [];
    ids.forEach((id, i) => {
      const p = pledges.find(p => p.id === id);
      if (p) p.order = i;
    });

    await redis.set(`${user.code}:pledges`, pledges);
    return res.status(200).json({ success: true });
  }

  // DELETE: 공약 삭제 (인증 필요)
  if (req.method === 'DELETE') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id 파라미터 필요' });

    const pledges = await redis.get(`${user.code}:pledges`) || [];
    const updated = pledges.filter(p => p.id !== id);

    if (updated.length === pledges.length) {
      return res.status(404).json({ error: '공약을 찾을 수 없습니다' });
    }

    await redis.set(`${user.code}:pledges`, updated);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
