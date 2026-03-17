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

async function parseJSON(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
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

  // POST: OG 메타 저장 (JSON) 또는 이미지 업로드
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const contentType = req.headers['content-type'] || '';

    // 이미지 업로드
    if (contentType.includes('image/')) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      if (buffer.length > 2 * 1024 * 1024) {
        return res.status(400).json({ error: '파일 크기는 2MB 이하여야 합니다' });
      }

      // 기존 OG 이미지가 Blob이면 삭제
      const existing = await redis.get(`${user.code}:og-meta`);
      if (existing && existing.imageUrl && existing.imageUrl.includes('blob.vercel-storage.com')) {
        try { await blobDel(existing.imageUrl); } catch {}
      }

      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const blob = await put(`${user.code}/og/og-image.${ext}`, buffer, {
        access: 'public',
        contentType,
        addRandomSuffix: true,
      });

      // KV 업데이트 (기존 title/description 유지, imageUrl만 교체)
      const ogData = {
        title: (existing && existing.title) || '',
        description: (existing && existing.description) || '',
        imageUrl: blob.url,
        updatedAt: new Date().toISOString(),
      };
      await redis.set(`${user.code}:og-meta`, ogData);

      return res.status(200).json(ogData);
    }

    // JSON 저장 (title, description)
    const body = await parseJSON(req);
    const { title, description, imageUrl } = body;

    // 기존 데이터 가져와서 병합
    const existing = await redis.get(`${user.code}:og-meta`);
    const ogData = {
      title: title || '',
      description: description || '',
      imageUrl: imageUrl !== undefined ? imageUrl : (existing && existing.imageUrl) || '',
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`${user.code}:og-meta`, ogData);
    return res.status(200).json(ogData);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
