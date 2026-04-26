var currentLang = 'de';
function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-lang]').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-lang') === lang);
  });
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === lang);
  });
  document.querySelectorAll('.nav-link[data-de][data-en]').forEach(function(el) {
    el.textContent = el.getAttribute('data-' + lang);
  });
  var tooltip = document.getElementById('wa-tooltip');
  if (tooltip) tooltip.textContent = lang === 'de' ? 'WhatsApp uns' : 'Chat on WhatsApp';
  document.documentElement.lang = lang;
}
var currentTheme = 'light';
try { currentTheme = localStorage.getItem('mz-theme') || 'light'; } catch(e) {}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  try { localStorage.setItem('mz-theme', theme); } catch(e) {}
  var isDark = theme === 'dark';
  var icon = isDark ? '☀️' : '🌙';
  var label = isDark ? 'Hell' : 'Dark';
  ['themeIcon','themeIconMob','themeIconMobile'].forEach(function(id){ var e=document.getElementById(id); if(e) e.textContent=icon; });
  var tl=document.getElementById('themeLabel'); if(tl) tl.textContent=label;
  var tml=document.getElementById('themeLabelMobile'); if(tml) tml.textContent=isDark?'Light Mode':'Dark Mode';
}
function toggleTheme() { applyTheme(currentTheme==='light'?'dark':'light'); }
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
document.querySelectorAll('.overlay').forEach(function(o) {
  o.addEventListener('click', function(e) { if (e.target===o) hideOverlay(o.id); });
});
function openCardModal(id) {
  document.getElementById('modal-'+id).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCardModal(id) {
  document.getElementById('modal-'+id).classList.remove('active');
  document.body.style.overflow = '';
}
document.querySelectorAll('.card-modal').forEach(function(m) {
  m.addEventListener('click', function(e) {
    if (e.target===m) { m.classList.remove('active'); document.body.style.overflow = ''; }
  });
});
document.addEventListener('keydown', function(e) {
  if (e.key==='Escape') {
    document.querySelectorAll('.overlay.active, .card-modal.active').forEach(function(o) {
      o.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(function(el) { observer.observe(el); });
var unsplashFallbacks = [
  "/img/iş1.jpg",
  "/img/iş2.jpg",
  "/img/iş3.jpg",
  "/img/iş4.jpg",
  "/img/iş5.jpg",
  "/img/iş6.jpg",
  "/img/iş7.jpg",
  "/img/iş8.jpg",
  "/img/iş9.jpg",
  "/img/iş10.jpg",
  "/img/iş11.jpg",
  "/img/iş12.jpg",
  "/img/iş13.jpg",
  "/img/iş14.jpg",
  "/img/iş15.jpg",
  "/img/iş16.jpg",
  "/img/iş17.jpg",
  "/img/iş18.jpg",
  "/img/iş19.jpg",
  "/img/iş20.jpg",
];
function createMarqueeSlider() {
  var track = document.getElementById('marqueeTrack');
  if (!track) return;
  var html = '';
  for (var i = 0; i < 2; i++) {
    unsplashFallbacks.forEach(function(src) {
      html += '<div class="marquee-item"><img src="' + src + '" alt="MZ Kandidat" loading="lazy"></div>';
    });
  }
  track.innerHTML = html;
}
window.addEventListener('load', function() {
  createMarqueeSlider();
});


// ====================== CV CARD RENDER ======================
async function loadCandidates() {
  const grid = document.getElementById('cvGrid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:#64748B;">CV-lər yüklənir...</div>';

  try {
    const response = await fetch('candidates.json');
    const candidates = await response.json();

    let html = '';

    candidates.forEach(c => {
      const skillsHTML = c.skills 
        ? c.skills.split(',').map(skill => `<span class="cv-skill-tag">${skill.trim()}</span>`).join('')
        : '';

      const langHTML = c.languages 
        ? c.languages.split('|').map(item => {
            const [lang, style = "background:#E6F1FB; color:#185FA5;"] = item.split('§');
            return `<span class="cv-lang-tag" style="${style}">${lang.trim()}</span>`;
          }).join('')
        : '';

      html += `
        <div class="cv-card fade-in">
          <div class="cv-card-header">
            <div class="cv-avatar">
              <img src="${c.img}" alt="${c.name}">
            </div>
            <div class="cv-card-name">${c.name}</div>
            <div class="cv-card-location">${c.location || ''}</div>
            <span class="cv-type-badge" style="${c.badgeStyle || ''}">
              <span data-lang="de" class="active">${c.badgeDE || ''}</span>
              <span data-lang="en">${c.badgeEN || ''}</span>
            </span>
          </div>
          <div class="cv-card-body">
            <p class="cv-tagline">
              <span data-lang="de" class="active">${c.taglineDE || ''}</span>
              <span data-lang="en">${c.taglineEN || ''}</span>
            </p>
            <div class="cv-section-title"><span data-lang="de" class="active">Kompetenzen</span><span data-lang="en">Skills</span></div>
            <div class="cv-skills-wrap">${skillsHTML}</div>
            <div class="cv-section-title"><span data-lang="de" class="active">Sprachen</span><span data-lang="en">Languages</span></div>
            <div class="cv-lang-wrap">${langHTML}</div>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html || '<p style="grid-column:1/-1;text-align:center;color:#64748B;">Hələ CV yoxdur.</p>';
  } catch (e) {
    grid.innerHTML = `<p style="color:#e74c3c; grid-column:1/-1;text-align:center;">Xəta: candidates.json tapılmadı.</p>`;
  }
}

// Səhifə yüklənən kimi işləsin
window.addEventListener('load', loadCandidates);