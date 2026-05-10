/* =============================================
   최윤홍 부산교육감 후보 홈페이지 - JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollTop();
  initGalleryFilter();
  initYouTubeEmbed();
  initFadeAnimations();
  initBrochureViewer();
});

/* 하단 네비게이션 활성 상태 */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navItems.forEach((item) => {
            item.classList.toggle('active', item.dataset.section === id);
          });
        }
      });
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* 맨 위로 가기 버튼 */
function initScrollTop() {
  const scrollTopBtn = document.getElementById('scrollTop');
  if (!scrollTopBtn) return;

  window.addEventListener(
    'scroll',
    () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    },
    { passive: true }
  );

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* 갤러리 필터 */
function initGalleryFilter() {
  const tabs = document.querySelectorAll('.gallery-tab');
  const items = document.querySelectorAll('.gallery-item');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      items.forEach((item) => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = '';
          item.style.animation = 'fadeIn 0.3s ease forwards';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  items.forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) openLightbox(img.src, img.alt);
    });
  });
}

/* 라이트박스 */
function openLightbox(src, alt) {
  let lightbox = document.querySelector('.lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="닫기">&times;</button>
      <img src="" alt="">
    `;
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        lightbox.classList.remove('active');
      }
    });
  }

  lightbox.querySelector('img').src = src;
  lightbox.querySelector('img').alt = alt || '';
  lightbox.classList.add('active');
}

/* 유튜브 임베드 (지연 로딩) */
function initYouTubeEmbed() {
  const placeholders = document.querySelectorAll('.video-placeholder');

  placeholders.forEach((placeholder) => {
    const videoId = placeholder.dataset.videoId;

    if (videoId && !videoId.startsWith('YOUR_')) {
      placeholder.addEventListener('click', () => {
        const wrapper = placeholder.parentElement;
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
        iframe.allow =
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.title = '유튜브 영상';
        wrapper.innerHTML = '';
        wrapper.appendChild(iframe);
      });
    }
  });
}

/* 스크롤 페이드 애니메이션 */
function initFadeAnimations() {
  const targets = document.querySelectorAll(
    '.pledge-card, .contact-card, .video-card, .timeline-section, .profile-card'
  );

  targets.forEach((el) => el.classList.add('fade-in'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* 공보 PDF 뷰어 모달 */
function initBrochureViewer() {
  const cover = document.getElementById('brochureCover');
  const viewBtn = document.getElementById('brochureViewBtn');
  const modal = document.getElementById('brochureModal');
  const closeBtn = document.getElementById('brochureModalClose');
  const pagesContainer = document.getElementById('brochureModalPages');
  if (!modal || !pagesContainer) return;

  // 정적 기본값: assets/brochure/page-01.jpg ~ page-12.jpg
  let staticPageCount = 12;
  let staticPagePath = 'assets/brochure/page-';

  function renderPages(pages) {
    pagesContainer.innerHTML = '';
    pages.forEach((src, idx) => {
      const img = document.createElement('img');
      img.className = 'brochure-modal-page';
      img.src = src;
      img.loading = idx < 2 ? 'eager' : 'lazy';
      img.alt = `공보 ${idx + 1}페이지`;
      pagesContainer.appendChild(img);
    });
  }

  function getStaticPages() {
    const arr = [];
    for (let i = 1; i <= staticPageCount; i++) {
      arr.push(`${staticPagePath}${String(i).padStart(2, '0')}.jpg`);
    }
    return arr;
  }

  function open() {
    if (!pagesContainer.children.length) {
      // KV에 동적 페이지가 있으면 그것 사용 (window.__brochurePages 가 dynamic-loader에서 설정됨)
      const dynamic = window.__brochurePages;
      renderPages(dynamic && dynamic.length ? dynamic : getStaticPages());
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (cover) cover.addEventListener('click', open);
  if (viewBtn) viewBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) close();
  });
}

/* 카카오톡 공유 */
function shareKakao() {
  const SHARE_TITLE = '최윤홍 | 부산교육감 후보';
  const SHARE_DESC = '교육현장 해결사 최윤홍, 부산교육 체인지를 약속합니다';
  if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
    const ogImg = document.querySelector('meta[property="og:image"]');
    const imageUrl = ogImg ? new URL(ogImg.getAttribute('content'), location.href).href : '';
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: SHARE_TITLE,
        description: SHARE_DESC,
        imageUrl,
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
      buttons: [
        {
          title: '홈페이지 방문',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
      ],
    });
  } else {
    if (navigator.share) {
      navigator.share({
        title: SHARE_TITLE,
        text: SHARE_DESC,
        url: window.location.href,
      });
    } else {
      copyLink();
    }
  }
}

/* 링크 복사 */
function copyLink() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => showToast())
    .catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast();
    });
}

function showToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

/* fadeIn 키프레임 */
if (!document.querySelector('#fadeInStyle')) {
  const style = document.createElement('style');
  style.id = 'fadeInStyle';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
