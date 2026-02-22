import { Redis } from '@upstash/redis';
import { del as blobDel } from '@vercel/blob';
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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: 갤러리 목록 (인증 불필요)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const gallery = await redis.get(`${code}:gallery`);
    return res.status(200).json(gallery || []);
  }

  // DELETE: 사진 삭제 (인증 필요)
  if (req.method === 'DELETE') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id 파라미터 필요' });

    const gallery = await redis.get(`${user.code}:gallery`) || [];
    const item = gallery.find(g => g.id === id);
    if (!item) return res.status(404).json({ error: '사진을 찾을 수 없습니다' });

    // Blob에서 삭제
    if (item.url) {
      try { await blobDel(item.url); } catch {}
    }

    // KV에서 제거
    const updated = gallery.filter(g => g.id !== id);
    await redis.set(`${user.code}:gallery`, updated);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
