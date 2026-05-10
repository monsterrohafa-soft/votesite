import { Redis } from '@upstash/redis';
import { del as blobDel } from '@vercel/blob';
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

  // GET: 공보 메타 조회 (공개)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const data = await redis.get(`${code}:brochure`);
    return res.status(200).json(data || null);
  }

  // POST: 메타 업데이트 (관리자 인증)
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const body = await parseJSON(req);
    const { pdfUrl, fileName, pageCount, coverUrl, pages } = body;

    const existing = (await redis.get(`${user.code}:brochure`)) || {};

    // pdfUrl이 새로 들어오고 기존 Blob URL이 있으면 기존 PDF 삭제
    if (pdfUrl !== undefined && existing.pdfUrl &&
        existing.pdfUrl !== pdfUrl &&
        existing.pdfUrl.includes('blob.vercel-storage.com')) {
      try { await blobDel(existing.pdfUrl); } catch {}
    }

    const merged = {
      pdfUrl: pdfUrl !== undefined ? pdfUrl : (existing.pdfUrl || ''),
      fileName: fileName !== undefined ? fileName : (existing.fileName || ''),
      pageCount: pageCount !== undefined ? Number(pageCount) || 0 : (existing.pageCount || 0),
      coverUrl: coverUrl !== undefined ? coverUrl : (existing.coverUrl || ''),
      pages: Array.isArray(pages) ? pages : (existing.pages || []),
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`${user.code}:brochure`, merged);
    return res.status(200).json(merged);
  }

  // DELETE: 공보 삭제
  if (req.method === 'DELETE') {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: '인증 필요' });

    const existing = await redis.get(`${user.code}:brochure`);
    if (existing && existing.pdfUrl && existing.pdfUrl.includes('blob.vercel-storage.com')) {
      try { await blobDel(existing.pdfUrl); } catch {}
    }
    await redis.del(`${user.code}:brochure`);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
