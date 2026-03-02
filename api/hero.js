import { Redis } from '@upstash/redis';
import { put, del as blobDel } from '@vercel/blob';
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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: hero 이미지 URL 반환 (인증 불필요)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const hero = await redis.get(`${code}:hero`);
    return res.status(200).json(hero || null);
  }

  // POST: hero 이미지 업로드 (인증 필요)
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('image/')) {
      return res.status(400).json({ error: '이미지 파일만 업로드 가능합니다' });
    }

    // req body를 Buffer로 수집
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: '파일 크기는 2MB 이하여야 합니다' });
    }

    // 기존 hero 이미지가 있으면 Blob에서 삭제
    const existing = await redis.get(`${user.code}:hero`);
    if (existing && existing.url) {
      try { await blobDel(existing.url); } catch {}
    }

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const pathname = `${user.code}/hero/main.${ext}`;

    // Blob 업로드
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });

    // KV에 저장
    const heroData = {
      url: blob.url,
      updatedAt: new Date().toISOString(),
    };
    await redis.set(`${user.code}:hero`, heroData);

    return res.status(200).json(heroData);
  }

  // DELETE: hero 이미지 삭제 (기본 이미지로 복원, 인증 필요)
  if (req.method === 'DELETE') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const existing = await redis.get(`${user.code}:hero`);
    if (existing && existing.url) {
      try { await blobDel(existing.url); } catch {}
    }

    await redis.del(`${user.code}:hero`);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
