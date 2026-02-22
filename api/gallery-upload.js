import { Redis } from '@upstash/redis';
import { put } from '@vercel/blob';
import jwt from 'jsonwebtoken';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const config = {
  api: { bodyParser: false },
};

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: '인증 필요' });

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('image/')) {
    return res.status(400).json({ error: '이미지 파일만 업로드 가능합니다' });
  }

  const alt = req.headers['x-alt'] || '';
  const category = req.headers['x-category'] || 'activity';

  // req body를 Buffer로 수집
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: '파일 크기는 5MB 이하여야 합니다' });
  }

  const id = generateId();
  const ext = contentType.split('/')[1] === 'png' ? 'png' : 'jpg';
  const pathname = `${user.code}/gallery/${id}.${ext}`;

  // Blob 업로드
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });

  // KV 메타데이터 추가
  const gallery = await redis.get(`${user.code}:gallery`) || [];
  const newItem = {
    id,
    url: blob.url,
    alt,
    category,
    order: gallery.length,
    createdAt: new Date().toISOString(),
  };
  gallery.push(newItem);
  await redis.set(`${user.code}:gallery`, gallery);

  return res.status(200).json(newItem);
}
