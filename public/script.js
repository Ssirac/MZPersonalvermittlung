var currentLang = 'de';
    function setLang(lang) {
      currentLang = lang;
      document.querySelectorAll('[data-lang]').forEach(function (el) {
        el.classList.toggle('active', el.getAttribute('data-lang') === lang);
      });
      document.querySelectorAll('.lang-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === lang);
      });
      document.querySelectorAll('.nav-link[data-de][data-en]').forEach(function (el) {
        el.textContent = el.getAttribute('data-' + lang);
      });
      var tooltip = document.getElementById('wa-tooltip');
      if (tooltip) tooltip.textContent = lang === 'de' ? 'WhatsApp uns' : 'Chat on WhatsApp';
      document.documentElement.lang = lang;
    }
    var currentTheme = 'light';
    try { currentTheme = localStorage.getItem('mz-theme') || 'light'; } catch (e) { }
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      currentTheme = theme;
      try { localStorage.setItem('mz-theme', theme); } catch (e) { }
      var isDark = theme === 'dark';
      var icon = isDark ? '☀️' : '🌙';
      var label = isDark ? 'Hell' : 'Dark';
      ['themeIcon', 'themeIconMob', 'themeIconMobile'].forEach(function (id) { var e = document.getElementById(id); if (e) e.textContent = icon; });
      var tl = document.getElementById('themeLabel'); if (tl) tl.textContent = label;
      var tml = document.getElementById('themeLabelMobile'); if (tml) tml.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }
    function toggleTheme() { applyTheme(currentTheme === 'light' ? 'dark' : 'light'); }
    applyTheme(currentTheme);
    function toggleMobile() {
      document.getElementById('mobileMenu').classList.toggle('open');
      document.querySelector('.hamburger').classList.toggle('active');
    }
    function closeMobile() {
      document.getElementById('mobileMenu').classList.remove('open');
      document.querySelector('.hamburger').classList.remove('active');
    }
    function showOverlay(id) {
      document.getElementById(id).classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function hideOverlay(id) {
      document.getElementById(id).classList.remove('active');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('.overlay').forEach(function (o) {
      o.addEventListener('click', function (e) { if (e.target === o) hideOverlay(o.id); });
    });
    function openCardModal(id) {
      document.getElementById('modal-' + id).classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeCardModal(id) {
      document.getElementById('modal-' + id).classList.remove('active');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('.card-modal').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target === m) { m.classList.remove('active'); document.body.style.overflow = ''; }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.overlay.active, .card-modal.active').forEach(function (o) {
          o.classList.remove('active');
        });
        document.body.style.overflow = '';
      }
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-in').forEach(function (el) { observer.observe(el); });
    var unsplashFallbacks = [
      "/public/img/Teacher.jpg",
      "/public/img/iş2.jpg",
      "/public/img/iş3.jpg",
      "/public/img/iş4.jpg",
      "/public/img/doctor2.jpg",
      "/public/img/iş6.jpg",
      "/public/img/iş7.jpg",
      "/public/img/iş8.jpg",
      "/public/img/iş9.jpg",
      "/public/img/smm.webp",
      "/public/img/doctor.jpg",
    ];
    function createMarqueeSlider() {
      var track = document.getElementById('marqueeTrack');
      if (!track) return;
      var html = '';
      for (var i = 0; i < 2; i++) {
        unsplashFallbacks.forEach(function (src) {
          html += '<div class="marquee-item"><img src="' + src + '" alt="MZ Kandidat" loading="lazy"></div>';
        });
      }
      track.innerHTML = html;
    }
    window.addEventListener('load', function () {
      createMarqueeSlider();
    });

    // Copyright ili avtomatik yenilənir
    document.addEventListener('DOMContentLoaded', function () {
      const yearElement = document.getElementById('currentYear');
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }
    });