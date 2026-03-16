import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function verifyAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return false;
  return auth.slice(7) === process.env.CONTRACT_ADMIN_TOKEN;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const DEFAULT_TEMPLATE = {
  sections: [
    {
      id: 'header',
      type: 'header',
      title: '선거 유세 홈페이지 제작 및 유지보수 계약서',
    },
    {
      id: 'parties',
      type: 'text',
      title: '계약 당사자',
      content: '갑(의뢰인): {{candidateName}} ({{partyName}}, {{region}} {{position}})\n을(수급인): 에이젠(AZEN)',
    },
    {
      id: 'purpose',
      type: 'text',
      title: '제1조 (계약의 목적)',
      content: '을은 갑의 선거 유세를 위한 모바일 반응형 홈페이지를 제작하고, 계약 기간 동안 유지보수 서비스를 제공한다.',
    },
    {
      id: 'scope',
      type: 'list',
      title: '제2조 (제작 범위)',
      items: [
        '후보 소개 페이지 (프로필, 학력, 경력)',
        '공약 페이지',
        '활동 사진 갤러리',
        '일정 안내',
        '뉴스/기사 연동',
        '영상 섹션 (YouTube 연동)',
        '연락처 및 SNS 링크',
        '관리자 패널 (콘텐츠 실시간 수정)',
      ],
    },
    {
      id: 'fees',
      type: 'fees',
      title: '제3조 (계약 금액)',
      content: '1. 홈페이지 제작비: {{createdFee}}원 (VAT 별도)\n2. 월 유지보수비: {{monthlyFee}}원 (VAT 별도)\n3. 계약 기간: {{startDate}}부터 {{contractMonths}}개월',
    },
    {
      id: 'payment',
      type: 'text',
      title: '제4조 (대금 지급)',
      content: '1. 제작비는 계약 체결 시 50%, 홈페이지 납품 완료 시 50%를 지급한다.\n2. 유지보수비는 매월 1일에 선불로 지급한다.',
    },
    {
      id: 'maintenance',
      type: 'list',
      title: '제5조 (유지보수 범위)',
      items: [
        '서버 및 도메인 관리',
        '기술적 오류 수정',
        '보안 업데이트',
      ],
    },
    {
      id: 'obligations',
      type: 'text',
      title: '제6조 (갑의 의무)',
      content: '갑은 홈페이지 제작에 필요한 자료(사진, 공약, 프로필 등)를 을에게 제공하여야 한다.',
    },
    {
      id: 'termination',
      type: 'text',
      title: '제7조 (계약 해지)',
      content: '1. 쌍방 합의 시 계약을 해지할 수 있다.\n2. 갑의 일방적 해지 시 기 납부한 제작비는 반환하지 않는다.\n3. 유지보수비는 해지 월까지 일할 정산한다.',
    },
    {
      id: 'special',
      type: 'text',
      title: '특약사항',
      content: '{{specialTerms}}',
    },
  ],
  updatedAt: new Date().toISOString(),
};

function replacePlaceholders(sections, data) {
  const map = {
    '{{candidateName}}': data.candidateName || '',
    '{{partyName}}': data.partyName || '',
    '{{region}}': data.region || '',
    '{{position}}': data.position || '',
    '{{createdFee}}': data.createdFee ? Number(data.createdFee).toLocaleString() : '',
    '{{monthlyFee}}': data.monthlyFee ? Number(data.monthlyFee).toLocaleString() : '',
    '{{contractMonths}}': data.contractMonths || '',
    '{{startDate}}': data.startDate || '',
    '{{specialTerms}}': data.specialTerms || '없음',
  };

  return sections.map(s => {
    const section = { ...s };
    if (section.content) {
      for (const [key, val] of Object.entries(map)) {
        section.content = section.content.replaceAll(key, val);
      }
    }
    return section;
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, code, list } = req.query;

  // === 템플릿 관리 ===
  if (action === 'template') {
    if (req.method === 'GET') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: '인증 필요' });
      const template = await redis.get('contract:template') || DEFAULT_TEMPLATE;
      return res.status(200).json(template);
    }
    if (req.method === 'POST') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: '인증 필요' });
      const { sections } = req.body;
      if (!sections) return res.status(400).json({ error: 'sections 필수' });
      const template = { sections, updatedAt: new Date().toISOString() };
      await redis.set('contract:template', template);
      return res.status(200).json(template);
    }
  }

  // === 전자서명 ===
  if (action === 'sign' && req.method === 'POST') {
    const { code: signCode, signatureDataUrl, signerName, signerPhone } = req.body;
    if (!signCode || !signatureDataUrl || !signerName || !signerPhone) {
      return res.status(400).json({ error: '서명 정보 필수 (code, signatureDataUrl, signerName, signerPhone)' });
    }

    const contract = await redis.get(`contract:${signCode}`);
    if (!contract) return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });
    if (contract.status === 'signed') {
      return res.status(400).json({ error: '이미 서명된 계약서입니다' });
    }

    contract.status = 'signed';
    contract.signature = {
      dataUrl: signatureDataUrl,
      signerName,
      signerPhone,
      signedAt: new Date().toISOString(),
    };
    contract.updatedAt = new Date().toISOString();

    await redis.set(`contract:${signCode}`, contract);
    return res.status(200).json({ success: true, status: 'signed' });
  }

  // === GET ===
  if (req.method === 'GET') {
    // 전체 목록 (관리자)
    if (list === 'true') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: '인증 필요' });
      const keys = await redis.keys('contract:*');
      const contractKeys = keys.filter(k => k !== 'contract:template');
      const contracts = [];
      for (const key of contractKeys) {
        const c = await redis.get(key);
        if (c) {
          contracts.push({
            code: c.code,
            candidateName: c.candidateName,
            partyName: c.partyName,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          });
        }
      }
      contracts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json(contracts);
    }

    // 단일 계약서 조회 (공개)
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });
    const contract = await redis.get(`contract:${code}`);
    if (!contract) return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });
    return res.status(200).json(contract);
  }

  // === POST: 계약서 생성 ===
  if (req.method === 'POST') {
    if (!verifyAdmin(req)) return res.status(401).json({ error: '인증 필요' });

    const { code: newCode, candidateName, partyName, region, position, createdFee, monthlyFee, contractMonths, startDate, specialTerms } = req.body;
    if (!newCode || !candidateName) {
      return res.status(400).json({ error: 'code, candidateName 필수' });
    }

    const existing = await redis.get(`contract:${newCode}`);
    if (existing) {
      return res.status(400).json({ error: '이미 해당 후보의 계약서가 존재합니다' });
    }

    const template = await redis.get('contract:template') || DEFAULT_TEMPLATE;
    const data = { candidateName, partyName, region, position, createdFee, monthlyFee, contractMonths, startDate, specialTerms };
    const sections = replacePlaceholders(template.sections, data);

    const contract = {
      id: generateId(),
      code: newCode,
      candidateName,
      partyName: partyName || '',
      region: region || '',
      position: position || '',
      createdFee: createdFee || '',
      monthlyFee: monthlyFee || '',
      contractMonths: contractMonths || '',
      startDate: startDate || '',
      specialTerms: specialTerms || '',
      sections,
      status: 'draft',
      signature: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`contract:${newCode}`, contract);
    return res.status(200).json(contract);
  }

  // === PUT: 계약서 수정 ===
  if (req.method === 'PUT') {
    if (!verifyAdmin(req)) return res.status(401).json({ error: '인증 필요' });

    const { code: editCode, candidateName, partyName, region, position, createdFee, monthlyFee, contractMonths, startDate, specialTerms, status } = req.body;
    if (!editCode) return res.status(400).json({ error: 'code 필수' });

    const contract = await redis.get(`contract:${editCode}`);
    if (!contract) return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });
    if (contract.status === 'signed') {
      return res.status(400).json({ error: '서명 완료된 계약서는 수정할 수 없습니다' });
    }

    if (candidateName !== undefined) contract.candidateName = candidateName;
    if (partyName !== undefined) contract.partyName = partyName;
    if (region !== undefined) contract.region = region;
    if (position !== undefined) contract.position = position;
    if (createdFee !== undefined) contract.createdFee = createdFee;
    if (monthlyFee !== undefined) contract.monthlyFee = monthlyFee;
    if (contractMonths !== undefined) contract.contractMonths = contractMonths;
    if (startDate !== undefined) contract.startDate = startDate;
    if (specialTerms !== undefined) contract.specialTerms = specialTerms;
    if (status !== undefined) contract.status = status;

    // 섹션 재생성 (변수 치환)
    const template = await redis.get('contract:template') || DEFAULT_TEMPLATE;
    contract.sections = replacePlaceholders(template.sections, contract);
    contract.updatedAt = new Date().toISOString();

    await redis.set(`contract:${editCode}`, contract);
    return res.status(200).json(contract);
  }

  // === DELETE ===
  if (req.method === 'DELETE') {
    if (!verifyAdmin(req)) return res.status(401).json({ error: '인증 필요' });
    if (!code) return res.status(400).json({ error: 'code 파라미터 필요' });

    const contract = await redis.get(`contract:${code}`);
    if (!contract) return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });

    await redis.del(`contract:${code}`);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
