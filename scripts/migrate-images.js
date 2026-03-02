/**
 * migrate-images.js - 기존 정적 갤러리 이미지를 Blob으로 마이그레이션
 *
 * 사용법:
 *   KV_REST_API_URL=... KV_REST_API_TOKEN=... BLOB_READ_WRITE_TOKEN=... node scripts/migrate-images.js
 */

import { Redis } from '@upstash/redis';
import { put } from '@vercel/blob';
import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const candidates = ['lsh', 'njh', 'jdm', 'lhs', 'css', 'ysh', 'yjg', 'jws', 'jhh'];
const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

// 후보별 사진 메타데이터 (category + alt)
// 새 후보 추가 시 여기에 매핑 추가. 없으면 기본값(activity) 적용
const photoMeta = {
  lhs: [
    { alt: '국회 본회의 필리버스터 발언', category: 'activity' },
    { alt: '국민의힘 전국위원회 의장 발언', category: 'activity' },
    { alt: '위원회 의사봉', category: 'activity' },
    { alt: '국회 본청 이동', category: 'campaign' },
    { alt: '전국위원회 발언', category: 'campaign' },
    { alt: '의원총회 국민의례', category: 'event' },
    { alt: '원내대표 경선 의원총회', category: 'event' },
    { alt: '국회 본회의 발언', category: 'media' },
    { alt: '국회 기자들 앞', category: 'media' },
    { alt: '원내대표 선출 의원총회 정견발표', category: 'campaign' },
  ],
  jdm: [
    { alt: '기장군 현장 방문', category: 'activity' },
    { alt: '국회 의정활동', category: 'activity' },
    { alt: '선거운동 유세', category: 'campaign' },
    { alt: '나는 후보자다 국민의힘 정동만', category: 'media' },
    { alt: '지역 행사 참석', category: 'event' },
  ],
  lsh: [
    { alt: '의정활동', category: 'activity' },
    { alt: '선거운동', category: 'campaign' },
    { alt: '지역 행사', category: 'event' },
    { alt: '언론 인터뷰', category: 'media' },
    { alt: '현장 방문', category: 'activity' },
  ],
  njh: [
    { alt: '의정활동', category: 'activity' },
    { alt: '선거운동', category: 'campaign' },
    { alt: '지역 행사', category: 'event' },
    { alt: '언론 활동', category: 'media' },
    { alt: '현장 방문', category: 'activity' },
  ],
  css: [
    { alt: 'KBC 인터뷰', category: 'media' },
    { alt: '더불어민주당 부대변인 임명장 수여식', category: 'activity' },
    { alt: '광산구청장 출마 선언 MBC 뉴스', category: 'campaign' },
    { alt: '출판기념회 다시 노무현 바보 차승세', category: 'event' },
    { alt: '민주당 평당원 최고위원 도전 MBC 뉴스', category: 'media' },
    { alt: '광산구청장 출마선언 기자회견 현장', category: 'campaign' },
  ],
  ysh: [
    { alt: '안성시 현장 방문', category: 'activity' },
    { alt: '선거 활동', category: 'campaign' },
    { alt: '지역 행사', category: 'event' },
    { alt: '언론 활동', category: 'media' },
    { alt: '주민 만남', category: 'campaign' },
  ],
  yjg: [
    { alt: '대전 서구 활동', category: 'activity' },
    { alt: '출마선언 기자회견', category: 'campaign' },
    { alt: '한민시장 출마선언', category: 'campaign' },
    { alt: '지역 행사 참석', category: 'event' },
    { alt: '조국혁신당 활동', category: 'activity' },
    { alt: '언론 인터뷰', category: 'media' },
    { alt: '창업 활동', category: 'event' },
    { alt: '정치 입문', category: 'campaign' },
    { alt: '시민 활동', category: 'activity' },
    { alt: '미디어 출연', category: 'media' },
  ],
  jws: [
    { alt: '사하구청장 출마 서류 제출', category: 'campaign' },
    { alt: '보궐선거 유세 현장', category: 'campaign' },
    { alt: 'Btv 뉴스 인터뷰', category: 'media' },
    { alt: '신평 한신아파트 현수막', category: 'campaign' },
    { alt: '공식 프로필 사진', category: 'media' },
    { alt: '사상하단선 피해보상 주민간담회', category: 'event' },
    { alt: '부산시의회 발언', category: 'activity' },
    { alt: '싱크홀 방지 간담회', category: 'event' },
    { alt: '시의회 회의 전경', category: 'activity' },
    { alt: '퐁피두 분관 철회 기자회견', category: 'activity' },
  ],
  jhh: [
    { alt: '국회 의정활동', category: 'activity' },
    { alt: '국회 질의', category: 'activity' },
    { alt: '서울시장 출마선언', category: 'campaign' },
    { alt: '유세 현장', category: 'campaign' },
    { alt: '출판기념회', category: 'event' },
    { alt: '행사 참석', category: 'event' },
    { alt: '3대특검 대응특위', category: 'activity' },
    { alt: '기자회견', category: 'media' },
    { alt: '인터뷰', category: 'media' },
    { alt: '당대회 참석', category: 'event' },
  ],
};

async function migrate() {
  console.log('📦 이미지 마이그레이션 시작...\n');

  for (const code of candidates) {
    const galleryDir = join(PROJECT_ROOT, code, 'assets', 'gallery');
    if (!existsSync(galleryDir)) {
      console.log(`  ⏭️  ${code}/assets/gallery 없음, 건너뜀`);
      continue;
    }

    console.log(`  📂 ${code} 갤러리 마이그레이션...`);
    const items = [];
    const meta = photoMeta[code] || [];

    for (let i = 1; i <= 10; i++) {
      const filename = `photo${i}.jpg`;
      const filepath = join(galleryDir, filename);
      if (!existsSync(filepath)) continue;

      const buffer = readFileSync(filepath);
      const id = `static${i}`;
      const pathname = `${code}/gallery/${id}.jpg`;
      const m = meta[i - 1] || { alt: `${code} photo ${i}`, category: 'activity' };

      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: 'image/jpeg',
        addRandomSuffix: false,
      });

      items.push({
        id,
        url: blob.url,
        alt: m.alt,
        category: m.category,
        order: i - 1,
        createdAt: new Date().toISOString(),
      });

      console.log(`    ✅ ${filename} [${m.category}] → ${blob.url}`);
    }

    if (items.length > 0) {
      await redis.set(`${code}:gallery`, items);
      console.log(`    📝 KV에 ${items.length}개 메타데이터 저장`);
    }
  }

  console.log('\n🎉 마이그레이션 완료!');
}

migrate().catch(console.error);
