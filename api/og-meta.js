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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: OG 메타 조회
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const data = await redis.get(`${code}:og-meta`);
    return res.status(200).json(data || null);
  }

  // POST: OG 메타 저장
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { title, description, imageUrl } = req.body;

    const ogData = {
      title: title || '',
      description: description || '',
      imageUrl: imageUrl || '',
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`${user.code}:og-meta`, ogData);
    return res.status(200).json(ogData);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
