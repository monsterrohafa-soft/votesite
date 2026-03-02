/* =============================================
   윤성환 경기도의원 예비후보 홈페이지 - JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollTop();
  initGalleryFilter();
  initYouTubeEmbed();
  initFadeAnimations();
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

/* 카카오톡 공유 */
function shareKakao() {
  if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '윤성환 | 경기도의원 예비후보(안성시 제2선거구)',
        description: '멈춰 선 동안성, 이제는 뚫겠다 - 국민의힘 윤성환',
        imageUrl: '',
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
        title: '윤성환 | 경기도의원 예비후보(안성시 제2선거구)',
        text: '멈춰 선 동안성, 이제는 뚫겠다',
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
