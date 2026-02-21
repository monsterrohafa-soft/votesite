/* =============================================
   이상호 선거유세 홈페이지 - JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollTop();
  initGalleryFilter();
  initYouTubeEmbed();
  initFadeAnimations();
});

/* ==================
   하단 네비게이션 활성 상태
   ================== */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('section[id]');

  // IntersectionObserver로 현재 보이는 섹션 감지
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
    {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));

  // 네비 클릭 시 부드러운 스크롤
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

/* ==================
   맨 위로 가기 버튼
   ================== */
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

/* ==================
   갤러리 필터
   ================== */
function initGalleryFilter() {
  const tabs = document.querySelectorAll('.gallery-tab');
  const items = document.querySelectorAll('.gallery-item');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      // 활성 탭 변경
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // 필터링
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

  // 갤러리 아이템 클릭 시 라이트박스
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) {
        openLightbox(img.src, img.alt);
      }
    });
  });
}

/* ==================
   라이트박스
   ================== */
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

/* ==================
   유튜브 임베드 (지연 로딩)
   ================== */
function initYouTubeEmbed() {
  const placeholders = document.querySelectorAll('.video-placeholder');

  placeholders.forEach((placeholder) => {
    const videoId = placeholder.dataset.videoId;

    // 유효한 유튜브 ID가 있을 때만 클릭 이벤트 추가
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

/* ==================
   스크롤 페이드 애니메이션
   ================== */
function initFadeAnimations() {
  // 각 섹션의 주요 요소에 fade-in 클래스 추가
  const targets = document.querySelectorAll(
    '.pledge-card, .contact-card, .video-card, .timeline-section, .about-intro, .profile-card, .support-banner'
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
    {
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1,
    }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ==================
   카카오톡 공유
   ================== */
function shareKakao() {
  // 카카오 SDK 로드 확인
  if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '이상호 | 부산진구청장 예비후보',
        description: '기본사회가 강한 도시, 진짜 사람중심 부산진구 - 더불어민주당',
        imageUrl: '', // OG 이미지 URL
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
    // 카카오 SDK 미로드 시 일반 공유
    if (navigator.share) {
      navigator.share({
        title: '이상호 | 부산진구청장 예비후보',
        text: '기본사회가 강한 도시, 진짜 사람중심 부산진구',
        url: window.location.href,
      });
    } else {
      copyLink();
    }
  }
}

/* ==================
   링크 복사
   ================== */
function copyLink() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => {
      showToast();
    })
    .catch(() => {
      // fallback
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

/* ==================
   fadeIn 키프레임 (CSS에 없을 경우)
   ================== */
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
