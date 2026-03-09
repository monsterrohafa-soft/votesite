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

const VALID_TYPES = ['education', 'career'];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type } = req.query;
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'type 파라미터 필요 (education 또는 career)' });
  }

  // GET: 학력/경력 목록 (인증 불필요)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const items = await redis.get(`${code}:${type}`) || [];
    const sorted = items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return res.status(200).json(sorted);
  }

  // POST: 추가 (인증 필요)
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { title, isCurrent } = req.body;
    if (!title) return res.status(400).json({ error: '내용은 필수입니다' });

    const items = await redis.get(`${user.code}:${type}`) || [];
    const newItem = {
      id: generateId(),
      title,
      ...(type === 'career' ? { isCurrent: !!isCurrent } : {}),
      order: items.length,
      createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    await redis.set(`${user.code}:${type}`, items);

    return res.status(200).json(newItem);
  }

  // PUT: 수정 (인증 필요)
  if (req.method === 'PUT') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id, title, isCurrent, order } = req.body;
    if (!id) return res.status(400).json({ error: 'id 필수' });

    const items = await redis.get(`${user.code}:${type}`) || [];
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: '항목을 찾을 수 없습니다' });

    if (title !== undefined) items[idx].title = title;
    if (type === 'career' && isCurrent !== undefined) items[idx].isCurrent = !!isCurrent;
    if (order !== undefined) items[idx].order = order;

    await redis.set(`${user.code}:${type}`, items);
    return res.status(200).json(items[idx]);
  }

  // DELETE: 삭제 (인증 필요)
  if (req.method === 'DELETE') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id 파라미터 필요' });

    const items = await redis.get(`${user.code}:${type}`) || [];
    const updated = items.filter(p => p.id !== id);

    if (updated.length === items.length) {
      return res.status(404).json({ error: '항목을 찾을 수 없습니다' });
    }

    await redis.set(`${user.code}:${type}`, updated);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
