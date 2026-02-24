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

  // GET: 연락처 목록 (인증 불필요)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const contacts = await redis.get(`${code}:contacts`) || [];
    const sorted = contacts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return res.status(200).json(sorted);
  }

  // POST: 연락처 추가 (인증 필요)
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { type, label, value, url } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: '타입과 값은 필수입니다' });
    }

    const contacts = await redis.get(`${user.code}:contacts`) || [];
    const newItem = {
      id: generateId(),
      type,
      label: label || '',
      value,
      url: url || '',
      order: contacts.length,
      createdAt: new Date().toISOString(),
    };
    contacts.push(newItem);
    await redis.set(`${user.code}:contacts`, contacts);

    return res.status(200).json(newItem);
  }

  // PUT: 연락처 수정 (인증 필요)
  if (req.method === 'PUT') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id, type, label, value, url, order } = req.body;
    if (!id) return res.status(400).json({ error: 'id 필수' });

    const contacts = await redis.get(`${user.code}:contacts`) || [];
    const idx = contacts.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: '연락처를 찾을 수 없습니다' });

    if (type !== undefined) contacts[idx].type = type;
    if (label !== undefined) contacts[idx].label = label;
    if (value !== undefined) contacts[idx].value = value;
    if (url !== undefined) contacts[idx].url = url;
    if (order !== undefined) contacts[idx].order = order;

    await redis.set(`${user.code}:contacts`, contacts);
    return res.status(200).json(contacts[idx]);
  }

  // DELETE: 연락처 삭제 (인증 필요)
  if (req.method === 'DELETE') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id 파라미터 필요' });

    const contacts = await redis.get(`${user.code}:contacts`) || [];
    const updated = contacts.filter(c => c.id !== id);

    if (updated.length === contacts.length) {
      return res.status(404).json({ error: '연락처를 찾을 수 없습니다' });
    }

    await redis.set(`${user.code}:contacts`, updated);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
