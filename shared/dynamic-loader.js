/* =============================================
   Votesite Dynamic Loader
   갤러리/일정/D-day/방문자수 동적 렌더링
   ============================================= */

(function () {
  const script = document.currentScript;
  const code = script && script.dataset.code;
  if (!code) return;

  const API = '/api';

  document.addEventListener('DOMContentLoaded', () => {
    loadDynamicGallery();
    loadDynamicSchedule();
    initDday();
    trackVisit();
  });

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
})();
