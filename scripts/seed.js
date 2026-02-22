/**
 * seed.js - 후보별 초기 인증 데이터 KV에 저장
 *
 * 사용법:
 *   KV_REST_API_URL=... KV_REST_API_TOKEN=... node scripts/seed.js
 *
 * 또는 .env.local 파일이 있으면:
 *   npx vercel env pull .env.local
 *   node -e "require('dotenv').config({path:'.env.local'})" -e "require('./scripts/seed.js')"
 */

import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// 후보 목록 (새 후보 추가 시 여기에 추가)
const candidates = [
  { code: 'lsh', name: '이상호', party: '더불어민주당', password: '1234' },
  { code: 'njh', name: '노정현', party: '진보당', password: '1234' },
  { code: 'jdm', name: '정동만', party: '국민의힘', password: '1234' },
  { code: 'lhs', name: '이헌승', party: '국민의힘', password: '1234' },
];

async function seed() {
  console.log('🌱 Seeding KV store...\n');

  for (const c of candidates) {
    const passwordHash = await bcrypt.hash(c.password, 10);
    await redis.set(`${c.code}:auth`, {
      passwordHash,
      name: c.name,
      party: c.party,
    });

    // gallery/schedule 키가 없으면 빈 배열로 초기화
    const gallery = await redis.get(`${c.code}:gallery`);
    if (!gallery) {
      await redis.set(`${c.code}:gallery`, []);
    }
    const schedule = await redis.get(`${c.code}:schedule`);
    if (!schedule) {
      await redis.set(`${c.code}:schedule`, []);
    }

    console.log(`  ✅ ${c.name} (${c.code}) - 비밀번호: ${c.password}`);
  }

  console.log('\n🎉 Seed 완료!');
  console.log('\n📋 Admin 접속 정보:');
  candidates.forEach(c => {
    console.log(`  ${c.name}: /admin?code=${c.code} | 비밀번호: ${c.password}`);
  });
}

seed().catch(console.error);
