/**
 * seed-content.js - 기존 정적 HTML 데이터를 KV에 시딩
 *
 * 공약, 연락처, 영상 데이터를 Redis에 저장하여
 * Admin에서 기존 목록이 보이도록 합니다.
 *
 * 사용법:
 *   set -a && source .env.local && set +a && node scripts/seed-content.js
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function buildItems(arr) {
  return arr.map((item, i) => ({
    id: genId(),
    ...item,
    order: i,
    createdAt: new Date().toISOString(),
  }));
}

const candidateData = {
  lsh: {
    pledges: [
      { icon: 'fas fa-hand-holding-heart', title: '촘촘한 돌봄 복지', desc: '모든 구민이 삶의 기본을 보장받는 부산진구', details: ['부산진구형 통합돌봄 서비스 확대', '어르신·장애인 맞춤형 돌봄 강화', '아이 키우기 좋은 보육 환경 조성', '취약계층 긴급복지 지원 체계 구축'] },
      { icon: 'fas fa-store', title: '기회의 지역경제', desc: '경제는 기회로! 골목경제 살리기', details: ['부전역복합환승센터 완성 (KTX·BuTX·도심공항)', '전통시장·소상공인 지원 확대', '청년 창업 지원 및 일자리 창출', '도심균형발전과 상권 재생'] },
      { icon: 'fas fa-users', title: '주민 참여 행정', desc: '행정은 참여로! 생활 속 민주주의', details: ['주민참여 예산제 확대 운영', '동 단위 주민자치회 활성화', '구민 소통 플랫폼 구축', '투명한 행정 정보 공개 강화'] },
      { icon: 'fas fa-book-reader', title: '교육·문화 도시', desc: '배움과 문화가 넘치는 부산진구', details: ['평생학습 프로그램 확대', '지역 문화공간 확충', '청소년 활동 지원 강화', '생활체육 인프라 개선'] },
      { icon: 'fas fa-shield-alt', title: '안전하고 깨끗한 도시', desc: '안심하고 살 수 있는 부산진구', details: ['CCTV 확충 및 안전 인프라 강화', '노후 도로·주거환경 개선', '공원·녹지 확대 조성', '재난 안전 대응 체계 강화'] },
    ],
    contacts: [
      { type: 'phone', label: '전화', value: '010-4582-4106', url: 'tel:010-4582-4106' },
      { type: 'email', label: '이메일', value: 'jininews@gmail.com', url: 'mailto:jininews@gmail.com' },
      { type: 'address', label: '선거사무소', value: '부산광역시 부산진구 (상세 주소 입력)' },
      { type: 'instagram', label: '인스타그램', value: '@leesangho1979', url: 'https://www.instagram.com/leesangho1979' },
    ],
    videos: [
      { videoId: 'cSlO5oNLzPk', title: '부산·경남 행정통합 추진 — 박형준 시장 사퇴 요구', desc: '더불어민주당 6·3 지방선거 부산 구청장 출마 예정자들' },
      { videoId: 'NQooNKL91I0', title: '이상호 직격 — "합법 가장한 부공정 정치"', desc: '"변명 말고 시민 앞에 투명하게 해명하라"' },
      { videoId: 'TReQWsiZXs8', title: '"우리 친구, 이상호 화이팅!"', desc: '선거사무소를 방문한 당원들과 함께' },
      { videoId: 'vg6cEX9Gv7c', title: '박형준 부산시장 사퇴 촉구 기자회견', desc: '정진우·이상호·전원석 공동 기자회견' },
    ],
  },

  njh: {
    pledges: [
      { icon: 'fas fa-wallet', title: '민생경제 살리기', desc: '서민과 소상공인이 체감하는 경제', details: ['골목상권·전통시장 긴급 지원 확대', '청년 일자리·창업 지원 체계 구축', '지역화폐 활성화로 소비 순환 촉진', '생활물가 안정 대책 마련'] },
      { icon: 'fas fa-home', title: '주거 안정', desc: '집 걱정 없는 연제구를 만들겠습니다', details: ['공공임대주택 확충', '청년·신혼부부 주거비 지원', '노후 주거환경 개선 사업', '전·월세 안정 대책 추진'] },
      { icon: 'fas fa-hand-holding-heart', title: '촘촘한 돌봄', desc: '누구도 소외되지 않는 복지 연제', details: ['무상급식·무상교육 확대', '어르신 통합 돌봄 서비스 강화', '장애인 이동권·자립 지원', '아이 키우기 좋은 보육 체계 구축'] },
      { icon: 'fas fa-bullhorn', title: '주민이 결정하는 행정', desc: '구청장이 아닌 주민이 주인인 구정', details: ['주민참여예산 대폭 확대', '동네 단위 주민총회 정례화', '구정 정보 전면 공개', '주민 발의 조례 제정 지원'] },
      { icon: 'fas fa-leaf', title: '안전하고 쾌적한 연제', desc: '기후위기에 대응하는 친환경 도시', details: ['생활안전 인프라 강화', '공원·녹지 확충 및 도시숲 조성', '탄소중립 실천 마을 만들기', '재난 대응 체계 강화'] },
    ],
    contacts: [
      { type: 'phone', label: '전화', value: '051-000-0000' },
      { type: 'email', label: '이메일', value: 'nojh@example.com' },
      { type: 'address', label: '선거사무소', value: '부산광역시 연제구 (상세 주소 입력)' },
    ],
    videos: [
      { videoId: '6K6jAKDYIhs', title: '2026 새해 노정현의 연제 한바퀴', desc: '새해를 맞아 연제구 곳곳을 달리며 주민과 함께' },
      { videoId: 'JdDJe5Aj5lo', title: '[선거송] 사랑스러워 - 노정현', desc: '민주당·진보당 단일후보 노정현 선거 캠페인 송' },
      { videoId: '-X9OG14pNJA', title: '"유권자와의 약속" 부산 연제구 노정현 후보', desc: '제22대 총선 유권자 약속 영상' },
      { videoId: 'WuMqfsn0xm4', title: '[CF] 연제를 맑게 만드는 노정현의 소리', desc: '바람길숲편 — 연제를 맑게 만드는 소리' },
    ],
  },

  jdm: {
    pledges: [
      { icon: 'fas fa-subway', title: '교통 인프라 혁신', desc: '기장군민의 교통 불편을 해소하는 철도·도로 확충', details: ['도시철도 정관선·기장선 조기 유치', '오시리아선 연장 추진', '반송터널 건설 추진', 'KTX-이음 기장군 정차 실현'] },
      { icon: 'fas fa-atom', title: '원전·첨단 산업 중심지', desc: '부산을 원전 산업 중심지로 육성', details: ['전력반도체 특화단지 조성', '기장군 기회발전특구 지정', '동부산 E-Park 산업단지 조성', '방사선 의과학 산업단지 유치'] },
      { icon: 'fas fa-hospital', title: '의료·교육 도시', desc: '아시아 핵의학 메카, 기장', details: ['방사선 의학전문대학원 설립', '부경대 핵의학 전문의대 유치', '기장군 공공의료 인프라 강화', '평생교육·청소년 지원 확대'] },
      { icon: 'fas fa-film', title: '문화·관광 도시', desc: 'K컬쳐와 해양관광의 중심 기장', details: ['K컬쳐 유니버셜 스튜디오 조성', '오시리아 관광단지 활성화', '해양레저 관광 인프라 구축', '기장 전통시장·특산물 브랜드화'] },
      { icon: 'fas fa-fish', title: '어민 생계·먹거리 안전', desc: '기장 어민의 생계와 국민 먹거리 최우선', details: ['기장 미역·멸치 등 수산업 보호', '어민 소득 안정 지원', '수산물 안전관리 체계 강화', '해양환경 보전 사업 추진'] },
    ],
    contacts: [
      { type: 'phone', label: '전화', value: '02-6788-2114', url: 'tel:02-6788-2114' },
      { type: 'email', label: '이메일', value: 'jdm@assembly.go.kr', url: 'mailto:jdm@assembly.go.kr' },
      { type: 'address', label: '의원회관', value: '서울 영등포구 의사당대로 1' },
    ],
    videos: [
      { videoId: '_yvPSDddtb0', title: '기장군민 여러분께 드리는 신년인사', desc: '정동만 국회의원' },
      { videoId: 'du8epVRec9Y', title: '기장어민 생계와 국민 먹거리 안전 최우선', desc: '정동만 국회의원 현장 활동' },
      { videoId: '-6jGG1xN1J0', title: '"부산을 원전 산업 중심지로"', desc: '헬로TV뉴스 국회는지금' },
      { videoId: 'l0TfkaESbvI', title: '국민경선은 정동만 — 기장군 국회의원 후보', desc: '미래통합당 후보 시절' },
    ],
  },

  lhs: {
    pledges: [
      { icon: 'fas fa-subway', title: '철도부지 랜드마크 개발', desc: '부산진구 철도 관련 부지를 활용한 새로운 랜드마크', details: ['부전역 복합환승센터 조기 완공', '철도부지 활용 신도심 개발', '부전-마산 광역철도 예산 확보', '서면 도심 교통체계 혁신'] },
      { icon: 'fas fa-plane-departure', title: '가덕도 신공항 건설', desc: '동남권 관문공항으로 부산 경제 도약', details: ['가덕도신공항건설공단법 대표발의', '2035년 개항 목표 차질없는 추진', '공항 연계 물류·관광 산업 육성', '부산 글로벌 허브도시 기반 마련'] },
      { icon: 'fas fa-bus', title: '대중교통 개선', desc: '부산진구민의 교통 불편 해소', details: ['61번 버스 노선 존치 성공', '59번 노선 남포동 연장 실현', '부산진구 마을버스 확충', '고령자·교통약자 이동권 보장'] },
      { icon: 'fas fa-building', title: '도시재생·생활인프라', desc: '노후 주거환경 개선과 생활 편의 확대', details: ['개금·당감·범천동 도시재생 추진', '주거환경 개선 특별지구 지정', '공원·녹지 확충 및 보행환경 개선', '공공임대주택 공급 확대'] },
      { icon: 'fas fa-hand-holding-heart', title: '복지·민생 안정', desc: '누구도 소외되지 않는 부산진구', details: ['어르신 돌봄·건강관리 강화', '청년 일자리·주거 지원 확대', '아이 키우기 좋은 환경 조성', '전통시장·소상공인 지원 강화'] },
    ],
    contacts: [
      { type: 'phone', label: '전화', value: '02-784-7911', url: 'tel:02-784-7911' },
      { type: 'instagram', label: '인스타그램', value: '@ilovebusanjin', url: 'https://www.instagram.com/ilovebusanjin' },
      { type: 'facebook', label: '페이스북', value: 'ilovebusanjin', url: 'https://www.facebook.com/ilovebusanjin' },
      { type: 'blog', label: '블로그', value: '네이버 블로그', url: 'https://blog.naver.com/g7member' },
    ],
    videos: [
      { videoId: 'eSYO_vwFHtU', title: '의정보고 — 부산진구가 낳고 키운 이헌승', desc: '국민의힘 전국위원회 의장' },
      { videoId: 'h8-LRloOc-g', title: '원포인트공약 — 철도부지 활용 랜드마크 개발', desc: '부산진구을 국민의힘 이헌승 후보' },
      { videoId: 'cPAnSdva6LY', title: '제22대 국회의원선거 부산진구을 후보자 토론회', desc: '국민의힘 이헌승 vs 민주당 이현' },
      { videoId: 'BaGiW8YjDCY', title: 'KNN 후보자 토론회 부산진구을', desc: '민주당 이현 vs 국민의힘 이헌승' },
    ],
  },

  ysh: {
    pledges: [
      { icon: 'fas fa-unlock', title: '규제 혁파 · 경제 성장', desc: '중첩 규제를 돌파해 동안성의 성장 엔진을 되살리겠습니다', details: ['반도체 소부장 특화단지 조성 규제 혁파', '제2안성테크노밸리 조성 추진', '신안성 변전소 활용 안성 전력 우선 공급권 확보', '미래형 스마트팜 혁신밸리 조성'] },
      { icon: 'fas fa-road', title: '교통 · 기초 인프라', desc: '동안성의 교통과 생활 인프라를 근본적으로 개선하겠습니다', details: ['반도체 고속도로 조기 착공', '동부권 도로망 반도체 비즈니스 로드 격상', '광역 상·하수도 현대화 및 도시가스 공급망 확대', '세종-포천 고속도로 연계 서울 직행 광역버스 신설'] },
      { icon: 'fas fa-water', title: '관광 · 돌봄', desc: '자연과 사람이 조화로운 안성을 만들겠습니다', details: ['5대 호수(금광·고삼·마둔·용설·청룡) 수변 관광 벨트 조성', '경기도립 안성병원 24시간 소아 응급 의료 시스템 구축', '경기도형 24시간 돌봄 시스템 도입'] },
    ],
    contacts: [
      { type: 'address', label: '선거구', value: '안성시 제2선거구 (보개·금광·서운·일죽·죽산·삼죽면, 안성1·2동)' },
      { type: 'landmark', label: '소속', value: '국민의힘 안성시 당협위' },
    ],
    videos: [
      { videoId: 'pXGbCk3H5Ds', title: '국민의힘 안성시당원협의회 설 명절 거리 출근인사', desc: '안성시 당협위 활동' },
      { videoId: 'QESVhvB0pmU', title: '국민의힘 안성시당원협의회 길거리 서명운동', desc: '안성시 당협위 활동' },
    ],
  },

  jws: {
    pledges: [
      { icon: 'fas fa-city', title: '도시재생 · 주거환경', desc: '낙후된 주거환경을 개선하고 삶의 질을 높이겠습니다', details: ['다대동 한진 부지 공공성 확보 및 개발', '노후 주거환경 정비 및 도시재생', '공공임대주택 공급 확대', '생활 SOC 인프라 확충'] },
      { icon: 'fas fa-shield-alt', title: '안전 · 도시 인프라', desc: '시민 안전을 최우선으로, 든든한 도시를 만들겠습니다', details: ['하수관로 현대화 및 침수 예방', '건설 하자·지반침하 근본 대책 마련', 'CCTV 확충 및 안전 인프라 강화', '보행자 중심 도로 환경 개선'] },
      { icon: 'fas fa-leaf', title: '해양 · 환경', desc: '을숙도와 낙동강 생태를 지키는 친환경 사하구', details: ['을숙도 생태공원 보전 및 활성화', '낙동강 하구 해양환경 보호', '탄소중립 실천 마을 만들기', '공원·녹지 확충'] },
      { icon: 'fas fa-hand-holding-heart', title: '복지 · 교육', desc: '누구도 소외되지 않는 따뜻한 사하구', details: ['사회적경제 활성화로 일자리 창출', '어르신·장애인 맞춤형 돌봄 강화', '아이 키우기 좋은 보육 환경 조성', '평생교육 인프라 확충'] },
      { icon: 'fas fa-palette', title: '문화 · 관광', desc: '사하구만의 매력으로 활기찬 지역을 만들겠습니다', details: ['삼정 더파크 동물원 정상화', '감천문화마을 관광 활성화', '지역 문화·예술 공간 확충', '전통시장·소상공인 지원 강화'] },
    ],
    contacts: [
      { type: 'phone', label: '전화', value: '010-2561-3401', url: 'tel:010-2561-3401' },
      { type: 'address', label: '출마 지역', value: '부산광역시 사하구 사하구청장' },
    ],
    videos: [
      { videoId: 'spyvDIwWKOE', title: "'을숙도 장비' 전원석 \"사하구청장 검증 서류 제출\"", desc: '사하구청장 출마 비전 발표' },
      { videoId: '5HJOBo2iqyk', title: '찾아가는 정책 인터뷰 - 전원석 부산시의원', desc: '대한민국유권자총연맹' },
      { videoId: '07Ew5RqKfqM', title: '부산시의원 보궐선거 민주당 전원석 당선', desc: '부산MBC 뉴스투데이' },
      { videoId: 'VuDeOhAmbxo', title: '"퐁피두 분관 즉각 철회하라" - 전원석 시의원', desc: '부산MBC 뉴스데스크' },
    ],
  },

  yjg: {
    pledges: [
      { icon: 'fas fa-store', title: '서구경제혁신', desc: '소상공인과 자영업자의 목소리를 서구 행정의 최우선 가치로', details: ['시장 상인·소상공인 디지털 전환 지원', '실제 매출이 오르는 행정 실현', '청년 창업 지원 및 스타트업 생태계 구축', '대전 서구 창업 일자리 혁신도시 조성'] },
      { icon: 'fas fa-hand-holding-heart', title: '서구복지혁신', desc: '복지와 기술이 융합된 따뜻한 서구를 만들겠습니다', details: ['복지·기술 융합 스마트 돌봄 시스템 구축', '어르신·장애인 맞춤형 복지 강화', '아이 키우기 좋은 보육 환경 조성', '취약계층 긴급복지 지원 체계 확대'] },
      { icon: 'fas fa-cogs', title: '서구행정혁신', desc: '관성적 관리 행정을 끝내고 현장과 데이터로 성과를 만들겠습니다', details: ['데이터 기반 성과 중심 행정 전환', '주민 참여형 예산·정책 결정 확대', '투명한 행정 정보 공개 및 소통 강화', '창업가 정신으로 구정 혁신'] },
    ],
    contacts: [
      { type: 'address', label: '출마 지역', value: '대전광역시 서구 서구청장' },
      { type: 'instagram', label: '인스타그램', value: '@j_i_g_o_n_y', url: 'https://www.instagram.com/j_i_g_o_n_y/' },
    ],
    videos: [
      { videoId: '1ZzqZZRiPxk', title: '유지곤 창업가 서구청장 기자간담회', desc: '대전 서구청장 출마 비전 발표' },
      { videoId: 'HU2TdWopbvs', title: '여성 장애인의 정치 - 조국혁신당 유지곤 강연', desc: '조국혁신당 전국장애인위원회 부위원장' },
      { videoId: 'Qg1T9b54gMA', title: 'CMB 명불허전人 - 유지곤 대표 편', desc: '불꽃연출가에서 창업가로, 유지곤의 이야기' },
      { videoId: 'zP0EQT0QynU', title: 'KBS 세상의아침 - 대전갑천 불꽃프로포즈', desc: '레전드 불꽃 프로포즈 영상' },
    ],
  },

  jhh: {
    pledges: [
      { icon: 'fas fa-building', title: '서울돔 아레나', desc: 'DDP를 해체하고 K-콘텐츠 랜드마크를 건설하겠습니다', details: ['동대문디자인플라자(DDP) 해체 후 서울돔 건설', '2030 서울엑스포 개최지로 활용', 'K-콘텐츠 상시 공연·관광 인프라 조성', '관광 수입으로 서울 경제 성장 견인'] },
      { icon: 'fas fa-robot', title: 'AI 서울 신문고', desc: '시민 민원을 AI가 자동 배분하고 실시간 추적합니다', details: ['AI 기반 민원 자동 분류·배분 시스템 구축', '민원 처리 실시간 추적·알림 서비스', '시민 체감형 행정 서비스 혁신', '데이터 기반 도시 문제 예측·대응'] },
      { icon: 'fas fa-bus', title: '서울버스 준공영제 개편', desc: '적자 구조를 개선하고 시민 교통 편의를 높이겠습니다', details: ['준공영제 구조 개편으로 적자 해소', '야간 노선 확대 및 심야버스 운행', '교통 사각지대 해소', '수요응답형 대중교통 도입'] },
      { icon: 'fas fa-coins', title: '서울형 기본소득', desc: '청년과 어르신에게 최소한의 생활비를 보장하겠습니다', details: ['청년 기본소득 도입', '어르신 기초생활 보장 강화', '서울사랑상품권 연계 지역경제 활성화', '취약계층 긴급복지 지원 확대'] },
      { icon: 'fas fa-wifi', title: '초연결 서울', desc: '제4이동통신사 도입으로 통신비를 혁신적으로 낮추겠습니다', details: ['클라우드형 5G SA 인프라 구축', '3만 원대 데이터 무제한 요금제 도입', '서울 전역 공공 와이파이 확대', 'AI·6G 시대 선도 기반 마련'] },
    ],
    contacts: [
      { type: 'phone', label: '전화', value: '02-6788-2114', url: 'tel:02-6788-2114' },
      { type: 'address', label: '출마 지역', value: '서울특별시 서울시장' },
    ],
    videos: [
      { videoId: 'CYD6IgAfKGE', title: '전현희 "돈 벌어오는 CEO 서울시장 되겠다" 출마선언', desc: '서울시장 출마 비전 발표' },
      { videoId: 'gYuXbwv4K7I', title: '전현희 의원 "DDP 해체하고 서울돔 짓겠다"', desc: '서울돔 아레나 비전' },
      { videoId: 'Yas0xb55iNU', title: '전현희 "클라우드형 5G로 통신비 절반"', desc: '초연결 서울 정책 발표' },
      { videoId: 'b2nPAEwee84', title: '전현희 의원 서울시장 출마 기자회견 풀영상', desc: '출마 기자회견 전체' },
      { videoId: 'DB8siXUN7_I', title: '전현희 "서울버스 준공영제 전면 개편하겠다"', desc: '교통 정책 발표' },
    ],
  },

  ssw: {
    pledges: [
      { icon: 'fas fa-city', title: '청주특별시 추진', desc: '인구 88만 청주의 위상에 맞는 특례시 지정을 추진합니다', details: ['비수도권 특례시 기준 완화 추진', '청주·청원 통합 효과 극대화', '자치분권 역량 강화'] },
      { icon: 'fas fa-users', title: '100만 광역시 실현', desc: '청주·세종·증평을 연결한 100만 생활 광역시를 만들겠습니다', details: ['청주-세종-증평 일일 생활권 구축', '충청메가시티 거점도시 역할', '광역 교통 인프라 연결'] },
      { icon: 'fas fa-microchip', title: 'AI 스마트시티 조성', desc: '인공지능 기반의 미래형 스마트 도시를 구현합니다', details: ['AI 기반 스마트 행정 시스템', '디지털 시민 서비스 플랫폼', '첨단 ICT 산업 육성'] },
      { icon: 'fas fa-plane-departure', title: '교통·물류 국제 허브', desc: '청주공항·오송역·GTX를 연결하는 교통 허브를 만듭니다', details: ['청주국제공항 활성화', '오송역 KTX 연계 교통망', '충청권 광역급행철도(GTX) 추진'] },
      { icon: 'fas fa-water', title: '수변 감성 도시', desc: '미호강·무심천 중심의 수변 감성 도시를 조성합니다', details: ['사직동 센트럴파크 조성', '미호강·무심천 수변 공간 정비', '시민 여가·문화 공간 확충'] },
    ],
    contacts: [
      { type: 'phone', label: '전화', value: '010-3466-1660', url: 'tel:010-3466-1660' },
      { type: 'instagram', label: '인스타그램', value: '@seungwoocityboy', url: 'https://www.instagram.com/seungwoocityboy' },
      { type: 'facebook', label: '페이스북', value: '서승우', url: 'https://www.facebook.com/seoseung.u.904831' },
      { type: 'address', label: '출마 지역', value: '충북 청주시장' },
    ],
    videos: [
      { videoId: 'juTxJKmQ5tg', title: '서승우 청주시장 출마 선언', desc: '청주시장 출마 선언 보도' },
      { videoId: '-OA99ceWyjw', title: '서승우 전 충북도당위원장 청주시장 출마 기자회견', desc: '출마 기자회견 전문' },
      { videoId: 'HBoOqqlkIO0', title: '제1호 공약 "청주 특례시" 추진 발표', desc: '핵심 공약 발표' },
      { videoId: 'EXEqh0IK2mk', title: "서승우, '내일이 더 기대되는 청주' 출마선언", desc: 'CBMTV 보도' },
    ],
  },

  css: {
    pledges: [
      { icon: 'fas fa-rocket', title: '미래산업 관문', desc: '일자리가 넘치는 역동적인 도시', details: ['AI 기반 혁신산업 유치 및 일자리 창출', '자율주행·미래 모빌리티 실증 거점 조성', '청년 창업 지원 및 스타트업 생태계 구축', '소상공인·전통시장 디지털 전환 지원'] },
      { icon: 'fas fa-hand-holding-heart', title: '사람 사는 관문', desc: '누구도 소외받지 않는 든든한 광산', details: ['광산구형 통합돌봄 서비스 확대', '어르신·장애인 맞춤형 복지 강화', '아이 키우기 좋은 보육 환경 조성', '취약계층 긴급복지 지원 체계 구축'] },
      { icon: 'fas fa-route', title: '교통 관문', desc: '어디서나 통하는 30분 생활권', details: ['광산 전역 30분 내 접근 가능한 교통망 구축', '광역교통 연계 강화 및 환승 편의 개선', '마을버스·수요응답형 교통 확충', '보행자 친화 도로 및 자전거 인프라 확대'] },
      { icon: 'fas fa-palette', title: '문화 관문', desc: '일상이 여행이 되는 품격 있는 도시', details: ['지역 문화·관광 자원 활성화', '생활문화센터 및 공연장 확충', '청소년 문화 활동 지원 강화', '도농복합 관광벨트 조성'] },
      { icon: 'fas fa-brain', title: 'AI 스마트 행정', desc: '사람의 삶을 보듬는 따뜻한 기술', details: ['데이터 기반 AI 행정 도입으로 도시 문제 해결', '주민 맞춤형 행정 서비스 제공', '투명한 행정 정보 공개 및 소통 강화', '대한민국 지방정부 혁신 모델 구축'] },
    ],
    contacts: [
      { type: 'phone', label: '전화', value: '(연락처 입력)' },
      { type: 'email', label: '이메일', value: '(이메일 입력)' },
      { type: 'address', label: '선거사무소', value: '광주광역시 광산구 (상세 주소 입력)' },
      { type: 'facebook', label: '페이스북', value: '(SNS 입력)' },
    ],
    videos: [
      { videoId: 'IXsIjWoK9ls', title: '차승세 민주당 당대표 정무특보, 광주 광산구청장 출마 선언', desc: 'AI와 사람이 함께하는 광산 미래도시 비전 제시' },
      { videoId: 'Ggm2ZTsmhIQ', title: '"다시 노무현, 바보 차승세" 출판기념회', desc: '3,000명의 시민이 함께한 출판기념회 현장' },
      { videoId: 'bJ1V0ls5fCE', title: '차승세 노무현시민학교장, 민주당 평당원 최고위원 도전', desc: '호남 당원의 목소리를 최고위원회에 전달하겠다' },
      { videoId: 'O6P5ePHnFzE', title: '차승세 광산구청장 출마선언 — 내 삶을 위한 탁월한 선택', desc: '광주시의회 기자실 출마선언 전체 영상' },
    ],
  },
};

// 학력/경력 데이터 (프로필 탭용)
const allEducation = {
  lsh: [
    { title: '양정초등학교' },
    { title: '동의중학교' },
    { title: '양정고등학교' },
    { title: '국립부경대학교' },
  ],
  njh: [
    { title: '동명초등학교' },
    { title: '연산중학교' },
    { title: '양정고등학교' },
    { title: '부산대학교 경영학과' },
  ],
  jdm: [
    { title: '장안중학교' },
    { title: '부산대학교사범대학부설고등학교' },
    { title: '대구대학교 산업복지학과' },
    { title: '부산대학교 경영대학원 경영학 석사' },
  ],
  lhs: [
    { title: '개금국민학교' },
    { title: '부산개성중학교' },
    { title: '금성고등학교' },
    { title: '고려대학교 사회학과' },
    { title: '노스웨스턴대학교 대학원 사회학 석사' },
    { title: '조지워싱턴대학교 대학원 정치관리학 석사' },
    { title: '한국해양대학교 대학원 무역학 박사과정 수료' },
  ],
  css: [
    { title: '국제고등학교' },
    { title: '조선대학교 경제학과' },
  ],
  ysh: [],
  yjg: [
    { title: '대전도마초등학교 · 대전도마중학교' },
    { title: '대전공업고등학교' },
    { title: '한양대학교 공과대학 응용시스템학 공학사' },
    { title: 'KAIST 문술미래전략대학원 석사과정' },
  ],
  jws: [
    { title: '부산 수성초등학교 · 초량중학교' },
    { title: '동아고등학교' },
    { title: '부경대학교 경제학사' },
    { title: '부경대학교 국제대학원 정치학 석사' },
    { title: '동아대학교 국제전문대학원 국제학 박사' },
  ],
  jhh: [
    { title: '충렬국민학교 · 통영여중 · 데레사여고' },
    { title: '서울대학교 치과대학' },
    { title: '고려대학교 법무대학원' },
  ],
  ssw: [
    { title: '북이초 · 내수중 · 청주 세광고' },
    { title: '서울대학교 외교학과' },
    { title: '서울대학교 행정대학원 (석사)' },
    { title: 'KDI 국제정책대학원 (석사)' },
    { title: '행정고시 합격 (37회)' },
  ],
};

const allCareer = {
  lsh: [
    { title: '제17대 국회의원 비서관' },
    { title: '문재인정부 대통령비서실 행정관' },
    { title: '부산광역시 정무보좌관' },
    { title: '제21대 대선 부산선대위 전략기획본부장' },
    { title: '제22대 부산진구(을) 국회의원선거 예비후보' },
    { title: '더불어민주당 정책위원회 부의장', isCurrent: true },
  ],
  njh: [
    { title: '부산대학교 등록금 인하 투쟁' },
    { title: '제6대 부산 연제구의회 의원' },
    { title: '제7대 부산 연제구의회 의원' },
    { title: '제22대 총선 부산 연제 야권단일후보' },
    { title: '진보당 부산시당위원장', isCurrent: true },
  ],
  jdm: [
    { title: '부산기장 청년회의소 회장' },
    { title: '제6대 기장군의회 의원' },
    { title: '제7대 부산광역시의회 의원' },
    { title: '제21대 국회의원' },
    { title: '국민의힘 부산시당 위원장' },
    { title: '제22대 국회의원(부산 기장군)', isCurrent: true },
  ],
  lhs: [
    { title: '대한민국 육군 카투사 병장 만기전역' },
    { title: '건국대학교 겸임교수' },
    { title: '부산광역시청 대외협력보좌관' },
    { title: '제19대 국회의원' },
    { title: '새누리당 부산시당 위원장' },
    { title: '제21대 국회 국토교통위원회 위원장' },
    { title: '제21대 국회 국방위원회 위원장' },
    { title: '대통령직인수위 부산엑스포유치TF 팀장' },
    { title: '제22대 국회의원 (4선)', isCurrent: true },
  ],
  css: [
    { title: '광주 광산구청 비서실장' },
    { title: '광주광역시 정무특별보좌관' },
    { title: '국회의원 조오섭 보좌관' },
    { title: '사람사는세상 노무현재단 광주시민학교장' },
    { title: '제21대 대선 중앙선대위 조직팀장' },
    { title: '더불어민주당 중앙당 부대변인' },
    { title: '더불어민주당 당대표 정무특보', isCurrent: true },
  ],
  ysh: [
    { title: '국민의힘 안성시 당협위 부위원장', isCurrent: true },
  ],
  yjg: [
    { title: '유지곤폭죽연구소 창업' },
    { title: '대한민국 대표 불꽃축제 연출' },
    { title: '방송 50여회 출연' },
    { title: '와디즈 크라우드펀딩 베스트메이커' },
    { title: '카이로보틱스 창업' },
    { title: '조국혁신당 대전 서구 지역위원장', isCurrent: true },
  ],
  jws: [
    { title: '최인호 국회의원 보좌관' },
    { title: '부산 사하구의원 (6대·7대 재선)' },
    { title: '사하구의회 의장' },
    { title: '국립한국해양대학교 · 동아대학교 겸임교수' },
    { title: '더불어민주당 중앙당 사회적경제위원회 부위원장' },
    { title: '부산광역시의원 (사하구2)', isCurrent: true },
  ],
  jhh: [
    { title: '치과의사 · 제38회 사법시험 합격' },
    { title: '제18대 국회의원 (비례대표)' },
    { title: '제20대 국회의원 (강남 을)' },
    { title: '국민권익위원회 위원장' },
    { title: '더불어민주당 최고위원' },
    { title: '제22대 국회의원 (중구·성동구 갑)', isCurrent: true },
  ],
  ssw: [
    { title: '주 호주시드니 총영사관 부총영사' },
    { title: '대통령 행정자치비서관실 선임행정관' },
    { title: '행정안전부 지방행정정책관' },
    { title: '대통령 정무수석실 자치행정비서관' },
    { title: '충청북도 행정부지사' },
    { title: '충청북도당 위원장' },
    { title: '청주시 상당구 당협위원장 · 국민의힘 지방자치위원장', isCurrent: true },
  ],
};

async function seedContent() {
  console.log('🌱 기존 컨텐츠 시딩 시작...\n');

  for (const [code, data] of Object.entries(candidateData)) {
    // 공약
    const existingPledges = await redis.get(`${code}:pledges`);
    if (!existingPledges || existingPledges.length === 0) {
      await redis.set(`${code}:pledges`, buildItems(data.pledges));
      console.log(`  ✅ ${code}: 공약 ${data.pledges.length}개 시딩`);
    } else {
      console.log(`  ⏭️  ${code}: 공약 이미 존재 (${existingPledges.length}개) - 스킵`);
    }

    // 연락처
    const existingContacts = await redis.get(`${code}:contacts`);
    if (!existingContacts || existingContacts.length === 0) {
      await redis.set(`${code}:contacts`, buildItems(data.contacts));
      console.log(`  ✅ ${code}: 연락처 ${data.contacts.length}개 시딩`);
    } else {
      console.log(`  ⏭️  ${code}: 연락처 이미 존재 (${existingContacts.length}개) - 스킵`);
    }

    // 영상
    const existingVideos = await redis.get(`${code}:videos`);
    if (!existingVideos || existingVideos.length === 0) {
      await redis.set(`${code}:videos`, buildItems(data.videos));
      console.log(`  ✅ ${code}: 영상 ${data.videos.length}개 시딩`);
    } else {
      console.log(`  ⏭️  ${code}: 영상 이미 존재 (${existingVideos.length}개) - 스킵`);
    }

    console.log('');
  }

  // 학력/경력 시딩
  console.log('📚 학력/경력 시딩...\n');
  for (const [code, items] of Object.entries(allEducation)) {
    if (!items.length) { console.log(`  ⏭️  ${code}: 학력 데이터 없음`); continue; }
    const existing = await redis.get(`${code}:education`);
    if (existing && existing.length > 0) {
      console.log(`  ⏭️  ${code}: 학력 이미 존재 (${existing.length}개) - 스킵`);
    } else {
      await redis.set(`${code}:education`, buildItems(items));
      console.log(`  ✅ ${code}: 학력 ${items.length}개 시딩`);
    }
  }
  console.log('');
  for (const [code, items] of Object.entries(allCareer)) {
    if (!items.length) { console.log(`  ⏭️  ${code}: 경력 데이터 없음`); continue; }
    const existing = await redis.get(`${code}:career`);
    if (existing && existing.length > 0) {
      console.log(`  ⏭️  ${code}: 경력 이미 존재 (${existing.length}개) - 스킵`);
    } else {
      await redis.set(`${code}:career`, buildItems(items));
      console.log(`  ✅ ${code}: 경력 ${items.length}개 시딩`);
    }
  }

  console.log('\n🎉 컨텐츠 시딩 완료!');
}

seedContent().catch(console.error);
