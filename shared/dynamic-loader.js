/* =============================================
   Votesite Dynamic Loader
   갤러리/일정/공약/연락처/영상/D-day/방문자수 동적 렌더링
   ============================================= */

(function () {
  const script = document.currentScript;
  const code = script && script.dataset.code;
  if (!code) return;

  const API = '/api';

  document.addEventListener('DOMContentLoaded', () => {
    loadDynamicHero();
    loadDynamicEducation();
    loadDynamicCareer();
    loadDynamicGallery();
    loadDynamicSchedule();
    loadDynamicPledges();
    loadDynamicContacts();
    loadDynamicNews();
    loadDynamicVideos();
    initDday();
    trackVisit();
  });

  /* 히어로 이미지 동적 교체 */
  async function loadDynamicHero() {
    try {
      const res = await fetch(`${API}/hero?code=${code}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.url) return;

      // .hero-img (일반 후보) 또는 .hero-poster-img (포스터형) 찾기
      const heroImg = document.querySelector('.hero-img') || document.querySelector('.hero-poster-img');
      if (heroImg) {
        heroImg.src = data.url;
      }
    } catch {
      // 데이터 없으면 기존 정적 이미지 유지
    }
  }

  /* D-day 카운트다운 */
  function initDday() {
    const container = document.getElementById('dday');
    if (!container) return;

    const ELECTION_DATE = new Date('2026-06-03T00:00:00+09:00');
    const PRE_VOTE_START = new Date('2026-05-29T00:00:00+09:00');
    const PRE_VOTE_END = new Date('2026-05-30T23:59:59+09:00');

    function update() {
      const now = new Date();
      const diff = ELECTION_DATE - now;

      if (diff <= 0) {
        container.innerHTML = '<div class="dday-number">투표일</div>';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      let prevote = '';
      if (now >= PRE_VOTE_START && now <= PRE_VOTE_END) {
        prevote = '<div class="dday-prevote">사전투표 진행 중!</div>';
      } else if (days <= 14) {
        prevote = '<div class="dday-prevote">사전투표 5.29 ~ 5.30</div>';
      }

      container.innerHTML = `
        <div class="dday-label">6.3 지방선거</div>
        <div class="dday-number">D-${days}</div>
        ${prevote}
      `;
    }

    update();
    setInterval(update, 60000);
  }

  /* 방문자 추적 */
  async function trackVisit() {
    try {
      await fetch(`${API}/visit?code=${code}`, { method: 'POST' });
    } catch {}
  }

  /* 동적 학력 로드 */
  async function loadDynamicEducation() {
    const sections = document.querySelectorAll('.timeline-section');
    let eduSection = null;
    for (const s of sections) {
      const title = s.querySelector('.subsection-title');
      if (title && title.textContent.includes('학력')) { eduSection = s; break; }
    }
    if (!eduSection) return;

    const list = eduSection.querySelector('.timeline');
    if (!list) return;

    const staticHTML = list.innerHTML;

    try {
      const res = await fetch(`${API}/profile?code=${code}&type=education`);
      if (!res.ok) throw new Error('API error');
      const items = await res.json();

      if (!items || items.length === 0) return;

      list.innerHTML = items.map(item => `
        <li class="timeline-item">
          <span class="timeline-dot"></span>
          <div class="timeline-content">
            <strong>${item.title}</strong>
          </div>
        </li>
      `).join('');

    } catch {
      list.innerHTML = staticHTML;
    }
  }

  /* 동적 경력 로드 */
  async function loadDynamicCareer() {
    const sections = document.querySelectorAll('.timeline-section');
    let careerSection = null;
    for (const s of sections) {
      const title = s.querySelector('.subsection-title');
      if (title && title.textContent.includes('경력')) { careerSection = s; break; }
    }
    if (!careerSection) return;

    const list = careerSection.querySelector('.timeline');
    if (!list) return;

    const staticHTML = list.innerHTML;

    try {
      const res = await fetch(`${API}/profile?code=${code}&type=career`);
      if (!res.ok) throw new Error('API error');
      const items = await res.json();

      if (!items || items.length === 0) return;

      list.innerHTML = items.map(item => `
        <li class="timeline-item${item.isCurrent ? ' current' : ''}">
          <span class="timeline-dot"></span>
          <div class="timeline-content">
            <strong>${item.title}</strong>
            ${item.isCurrent ? '<span class="badge">현재</span>' : ''}
          </div>
        </li>
      `).join('');

    } catch {
      list.innerHTML = staticHTML;
    }
  }

  /* 동적 갤러리 로드 */
  async function loadDynamicGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const staticHTML = grid.innerHTML;

    try {
      const res = await fetch(`${API}/gallery?code=${code}`);
      if (!res.ok) throw new Error('API error');
      const items = await res.json();

      if (!items || items.length === 0) return;

      grid.innerHTML = items.map(item => `
        <div class="gallery-item" data-category="${item.category || 'activity'}">
          <img src="${item.url}" alt="${item.alt || ''}" loading="lazy">
        </div>
      `).join('');

      // 라이트박스 클릭 바인딩
      grid.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
          const img = item.querySelector('img');
          if (img && typeof openLightbox === 'function') {
            openLightbox(img.src, img.alt);
          }
        });
      });

      // 갤러리 필터 재바인딩 (동적 로드 후 DOM이 바뀌므로)
      rebindGalleryFilter();

    } catch {
      grid.innerHTML = staticHTML;
    }
  }

  /* 갤러리 필터 재바인딩 */
  function rebindGalleryFilter() {
    const tabs = document.querySelectorAll('.gallery-tab');
    const grid = document.getElementById('galleryGrid');
    if (!tabs.length || !grid) return;

    tabs.forEach(tab => {
      const clone = tab.cloneNode(true);
      tab.parentNode.replaceChild(clone, tab);
      clone.addEventListener('click', () => {
        const filter = clone.dataset.filter;
        document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
        clone.classList.add('active');
        grid.querySelectorAll('.gallery-item').forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
            item.style.animation = 'fadeIn 0.3s ease forwards';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  /* 동적 일정 로드 */
  async function loadDynamicSchedule() {
    const section = document.getElementById('schedule');
    if (!section) return;

    const list = section.querySelector('.schedule-list');
    if (!list) return;

    try {
      const res = await fetch(`${API}/schedule?code=${code}`);
      if (!res.ok) throw new Error('API error');
      const items = await res.json();

      if (!items || items.length === 0) {
        section.style.display = 'none';
        return;
      }

      section.style.display = '';
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      list.innerHTML = items.map(item => {
        const d = new Date(item.date);
        const isPast = d < now;
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];

        return `
          <div class="schedule-item${isPast ? ' past' : ''}">
            <div class="schedule-date">
              <span class="schedule-month">${month}월</span>
              <span class="schedule-day">${day}</span>
              <span class="schedule-weekday">${weekday}</span>
            </div>
            <div class="schedule-info">
              <div class="schedule-title">${item.title}</div>
              ${item.time ? `<div class="schedule-time">${item.time}</div>` : ''}
              ${item.location ? `<div class="schedule-location">${item.location}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');

    } catch {
      section.style.display = 'none';
    }
  }

  /* 동적 공약 로드 */
  async function loadDynamicPledges() {
    const section = document.getElementById('pledges');
    if (!section) return;

    const container = section.querySelector('.pledge-cards');
    if (!container) return;

    const staticHTML = container.innerHTML;

    try {
      const res = await fetch(`${API}/pledges?code=${code}`);
      if (!res.ok) throw new Error('API error');
      const items = await res.json();

      if (!items || items.length === 0) return;

      container.innerHTML = items.map((item, i) => `
        <div class="pledge-card">
          <div class="pledge-icon">
            <i class="${item.icon || 'fas fa-bullhorn'}" aria-hidden="true"></i>
          </div>
          <div class="pledge-number">${String(i + 1).padStart(2, '0')}</div>
          <h3 class="pledge-title">${item.title}</h3>
          ${item.desc ? `<p class="pledge-desc">${item.desc}</p>` : ''}
          ${item.details && item.details.length ? `
            <ul class="pledge-details">
              ${item.details.map(d => `<li>${d}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('');

    } catch {
      container.innerHTML = staticHTML;
    }
  }

  /* 동적 연락처 로드 */
  async function loadDynamicContacts() {
    const section = document.getElementById('contact');
    if (!section) return;

    const container = section.querySelector('.contact-cards');
    if (!container) return;

    const staticHTML = container.innerHTML;

    const iconMap = {
      phone: 'fas fa-phone-alt',
      email: 'fas fa-envelope',
      address: 'fas fa-map-marker-alt',
      instagram: 'fab fa-instagram',
      facebook: 'fab fa-facebook-f',
      youtube: 'fab fa-youtube',
      blog: 'fas fa-blog',
    };

    function getHref(item) {
      if (item.url) return item.url;
      if (item.type === 'phone') return `tel:${item.value.replace(/[^0-9+]/g, '')}`;
      if (item.type === 'email') return `mailto:${item.value}`;
      return '#';
    }

    try {
      const res = await fetch(`${API}/contacts?code=${code}`);
      if (!res.ok) throw new Error('API error');
      const items = await res.json();

      if (!items || items.length === 0) return;

      container.innerHTML = items.map(item => {
        const icon = iconMap[item.type] || 'fas fa-link';
        const href = getHref(item);
        const target = (item.url || ['instagram', 'facebook', 'youtube', 'blog'].includes(item.type)) ? ' target="_blank"' : '';

        return `
          <a href="${href}" class="contact-card"${target}>
            <div class="contact-icon">
              <i class="${icon}" aria-hidden="true"></i>
            </div>
            <div class="contact-info">
              <h4>${item.label || item.type}</h4>
              <p>${item.value}</p>
            </div>
          </a>
        `;
      }).join('');

    } catch {
      container.innerHTML = staticHTML;
    }
  }

  /* 동적 관련기사 로드 */
  async function loadDynamicNews() {
    const section = document.getElementById('news');
    if (!section) return;

    const container = section.querySelector('.news-list');
    if (!container) return;

    try {
      const res = await fetch(`${API}/news?code=${code}`);
      if (!res.ok) throw new Error('API error');
      const items = await res.json();

      if (!items || items.length === 0) {
        section.style.display = 'none';
        return;
      }

      section.style.display = '';
      container.innerHTML = items.map(item => `
        <a href="${item.url}" class="news-card" target="_blank" rel="noopener">
          ${item.imageUrl
            ? `<img src="${item.imageUrl}" alt="" class="news-thumb" loading="lazy">`
            : `<div class="news-icon-placeholder"><i class="fas fa-newspaper" aria-hidden="true"></i></div>`}
          <div class="news-card-body">
            <div class="news-card-title">${item.title}</div>
            <div class="news-card-meta">${item.source || ''}${item.date ? ' · ' + item.date : ''}</div>
          </div>
          <i class="fas fa-chevron-right news-card-arrow" aria-hidden="true"></i>
        </a>
      `).join('');

    } catch {
      section.style.display = 'none';
    }
  }

  /* 동적 영상 로드 */
  async function loadDynamicVideos() {
    const section = document.getElementById('video');
    if (!section) return;

    const container = section.querySelector('.video-list');
    if (!container) return;

    const staticHTML = container.innerHTML;

    try {
      const res = await fetch(`${API}/videos?code=${code}`);
      if (!res.ok) throw new Error('API error');
      const items = await res.json();

      if (!items || items.length === 0) return;

      container.innerHTML = items.map(item => `
        <div class="video-card">
          <div class="video-wrapper">
            <div class="video-placeholder" data-video-id="${item.videoId}" role="button" aria-label="영상 재생: ${item.title || ''}">
              <img src="https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg" alt="" class="video-thumb" loading="lazy">
              <i class="fas fa-play-circle" aria-hidden="true"></i>
            </div>
          </div>
          <div class="video-info">
            <h4>${item.title || ''}</h4>
            ${item.desc ? `<p>${item.desc}</p>` : ''}
          </div>
        </div>
      `).join('');

      // 유튜브 클릭 이벤트 재바인딩
      container.querySelectorAll('.video-placeholder').forEach(placeholder => {
        const videoId = placeholder.dataset.videoId;
        if (!videoId) return;
        placeholder.addEventListener('click', () => {
          const wrapper = placeholder.parentElement;
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen = true;
          iframe.title = '유튜브 영상';
          wrapper.innerHTML = '';
          wrapper.appendChild(iframe);
        });
      });

    } catch {
      container.innerHTML = staticHTML;
    }
  }
})();
