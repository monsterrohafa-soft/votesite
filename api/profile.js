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

const VALID_TYPES = ['education', 'career', 'intro'];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type } = req.query;
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'type 파라미터 필요 (education, career, intro)' });
  }

  // intro: 단일 객체 (GET/POST만 지원)
  if (type === 'intro') {
    if (req.method === 'GET') {
      const { code } = req.query;
      if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });
      const data = await redis.get(`${code}:intro`) || {};
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const user = verifyToken(req);
      if (!user) return res.status(401).json({ error: '인증 필요' });
      const { subtitle, text } = req.body;
      const data = { subtitle: subtitle || '', text: text || '', updatedAt: new Date().toISOString() };
      await redis.set(`${user.code}:intro`, data);
      return res.status(200).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
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
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order ?? 0)) : -1;
    const newItem = {
      id: generateId(),
      title,
      ...(type === 'career' ? { isCurrent: !!isCurrent } : {}),
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    await redis.set(`${user.code}:${type}`, items);

    return res.status(200).json(newItem);
  }

  // PUT: 수정 또는 순서 변경 (인증 필요)
  if (req.method === 'PUT') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id, title, isCurrent, direction } = req.body;
    if (!id) return res.status(400).json({ error: 'id 필수' });

    const items = await redis.get(`${user.code}:${type}`) || [];

    // 순서 변경 (direction: 'up' | 'down')
    if (direction) {
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const idx = items.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: '항목을 찾을 수 없습니다' });

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= items.length) {
        return res.status(200).json(items); // 이동 불가, 현재 상태 반환
      }

      // order 값 스왑
      const tmpOrder = items[idx].order;
      items[idx].order = items[swapIdx].order;
      items[swapIdx].order = tmpOrder;

      await redis.set(`${user.code}:${type}`, items);
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return res.status(200).json(items);
    }

    // 일반 수정
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: '항목을 찾을 수 없습니다' });

    if (title !== undefined) items[idx].title = title;
    if (type === 'career' && isCurrent !== undefined) items[idx].isCurrent = !!isCurrent;

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

    // 삭제 후 order 재정렬
    updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    updated.forEach((item, i) => { item.order = i; });

    await redis.set(`${user.code}:${type}`, updated);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
