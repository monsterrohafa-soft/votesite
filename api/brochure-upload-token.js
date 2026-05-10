import { handleUpload } from '@vercel/blob/client';
import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 클라이언트 업로드 흐름 1단계: 인증 + 토큰 발급, 2단계: blob → 우리 서버 onUploadCompleted 콜백
  // 1단계 요청은 Authorization 헤더 보유, 2단계는 Vercel이 보냄(헤더 없음 → tokenPayload로 사용자 식별)

  // 사용자 코드: 1단계엔 JWT, 2단계엔 tokenPayload
  let userCode = null;
  const user = verifyToken(req.headers.authorization);
  if (user) userCode = user.code;

  try {
    const body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
      req.on('error', reject);
    });

    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!userCode) {
          throw new Error('인증 필요');
        }
        const safeName = (pathname || 'brochure.pdf').replace(/[^\w.\-]/g, '_');
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 80 * 1024 * 1024, // 80MB 상한
          tokenPayload: JSON.stringify({
            code: userCode,
            originalName: safeName,
            clientPayload: clientPayload || null,
          }),
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const meta = JSON.parse(tokenPayload || '{}');
          if (!meta.code) return;

          const existing = (await redis.get(`${meta.code}:brochure`)) || {};
          const merged = {
            pdfUrl: blob.url,
            fileName: meta.originalName || 'brochure.pdf',
            pageCount: existing.pageCount || 0,
            coverUrl: existing.coverUrl || '',
            pages: existing.pages || [],
            updatedAt: new Date().toISOString(),
          };
          await redis.set(`${meta.code}:brochure`, merged);
        } catch (err) {
          console.error('brochure onUploadCompleted error', err);
        }
      },
    });

    return res.status(200).json(json);
  } catch (err) {
    console.error('brochure upload error', err);
    return res.status(400).json({ error: err.message || '업로드 실패' });
  }
}

export const config = {
  api: { bodyParser: false },
};
