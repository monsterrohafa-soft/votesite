import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, password } = req.body;
  if (!code || !password) {
    return res.status(400).json({ error: '후보코드와 비밀번호를 입력하세요' });
  }

  const auth = await redis.get(`${code}:auth`);
  if (!auth) {
    return res.status(401).json({ error: '등록되지 않은 후보입니다' });
  }

  const valid = await bcrypt.compare(password, auth.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' });
  }

  const token = jwt.sign(
    { code, name: auth.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.status(200).json({ token, name: auth.name, party: auth.party });
}
