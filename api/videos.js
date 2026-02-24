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

  // GET: 영상 목록 (인증 불필요)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const videos = await redis.get(`${code}:videos`) || [];
    const sorted = videos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return res.status(200).json(sorted);
  }

  // POST: 영상 추가 (인증 필요)
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { videoId, title, desc } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: '유튜브 영상 ID는 필수입니다' });
    }

    const videos = await redis.get(`${user.code}:videos`) || [];
    const newItem = {
      id: generateId(),
      videoId,
      title: title || '',
      desc: desc || '',
      order: videos.length,
      createdAt: new Date().toISOString(),
    };
    videos.push(newItem);
    await redis.set(`${user.code}:videos`, videos);

    return res.status(200).json(newItem);
  }

  // PUT: 영상 수정 (인증 필요)
  if (req.method === 'PUT') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id, videoId, title, desc, order } = req.body;
    if (!id) return res.status(400).json({ error: 'id 필수' });

    const videos = await redis.get(`${user.code}:videos`) || [];
    const idx = videos.findIndex(v => v.id === id);
    if (idx === -1) return res.status(404).json({ error: '영상을 찾을 수 없습니다' });

    if (videoId !== undefined) videos[idx].videoId = videoId;
    if (title !== undefined) videos[idx].title = title;
    if (desc !== undefined) videos[idx].desc = desc;
    if (order !== undefined) videos[idx].order = order;

    await redis.set(`${user.code}:videos`, videos);
    return res.status(200).json(videos[idx]);
  }

  // DELETE: 영상 삭제 (인증 필요)
  if (req.method === 'DELETE') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id 파라미터 필요' });

    const videos = await redis.get(`${user.code}:videos`) || [];
    const updated = videos.filter(v => v.id !== id);

    if (updated.length === videos.length) {
      return res.status(404).json({ error: '영상을 찾을 수 없습니다' });
    }

    await redis.set(`${user.code}:videos`, updated);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
