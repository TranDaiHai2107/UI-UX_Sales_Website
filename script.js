function setCSSVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

// ===== Reveal & Section visibility =====
function initIntersectionAnimations() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Element-level reveal (cards, items, etc.)
  const itemObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      if (entry.isIntersecting) {
        const idx = Number(el.getAttribute('data-idx') || 0);
        const delay = idx * 70;
        if (!reduce && delay) el.style.transitionDelay = `${delay}ms`;
        el.classList.add('revealed', 'visible');
      } else {
        el.classList.remove('revealed', 'visible');
        el.style.transitionDelay = '';
      }
    });
  }, { threshold: 0.18 });

  const toReveal = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom, .feature, .product-card, .service-card, .tc-item, .explore-card, .cta-inner');
  toReveal.forEach((el, i) => { el.setAttribute('data-idx', String(i % 10)); itemObserver.observe(el); });

  // Section-level active state for nav and transitions
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const section = entry.target;
      if (entry.isIntersecting) section.classList.add('section-inview');
      else section.classList.remove('section-inview');
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('section.section').forEach((s) => sectionObserver.observe(s));
}

// ===== Lightweight parallax (hero only) =====
function initParallax() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const hero = document.querySelector('.hero-graphic');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      if (hero) hero.style.transform = `translateY(${y * -0.03}px) scale(1.06)`;
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initActiveNav() {
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.remove('active'));
        const link = links.find((l) => l.getAttribute('href') === `#${entry.target.id}`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.6 });
  sections.forEach((s) => observer.observe(s));
}

function initKeyboardNav() {
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      const next = document.querySelector("#about");
      if (next) next.scrollIntoView({ behavior: "smooth" });
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

function setSoftPinkTheme() {
  setCSSVar("--brand", "#ff8ccf");
}

// ===== Color helpers (sampling) =====
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

// === Palette sampling from DaIU images ===
async function averageColorsFromImages(paths) {
  const samples = [];
  for (const src of paths) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      // decode can throw if file not found; wrap in await
      await img.decode();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const w = canvas.width = 24; // tiny for speed
      const h = canvas.height = 24;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const aa = data[i+3];
        if (aa < 200) continue;
        r += data[i]; g += data[i+1]; b += data[i+2]; n++;
      }
      if (n) {
        samples.push([Math.round(r/n), Math.round(g/n), Math.round(b/n)]);
      }
    } catch (e) {
      // ignore missing images
    }
  }
  if (!samples.length) return null;
  let r=0,g=0,b=0;
  samples.forEach(([rr,gg,bb])=>{ r+=rr; g+=gg; b+=bb; });
  r = Math.round(r / samples.length);
  g = Math.round(g / samples.length);
  b = Math.round(b / samples.length);
  return [r,g,b];
}

async function setBackgroundFromDaIUImages() {
  const base = "DaIU/";
  const files = [
    "Trang chủ.png",
    "Trang chủ (2).png",
    "Trang chủ (3).png",
    "Trang chủ (4).png",
    "Trang chủ (5).png",
    "Trang chủ (6).png",
    "Trang chủ (7).png",
    "Trang chủ (8).png",
    "Trang chủ (9).png",
    "Trang chủ (10).png",
    "Trang chủ (11).png",
    "Trang chủ (12).png",
    "Trang chủ (13).png",
    "Trang chủ (14).png"
  ].map(f => base + f);

  const avg = await averageColorsFromImages(files);
  if (!avg) return;
  const [r, g, b] = avg;
  let [hH, sH, lH] = rgbToHsl(r, g, b);
  // Derive three stops along one hue for a global vertical gradient
  const stops = [
    { s: clamp01(sH * 0.9),  l: clamp01(lH * 0.5) }, // top darker
    { s: clamp01(sH * 0.85), l: clamp01(lH * 0.65) }, // mid
    { s: clamp01(sH * 0.75), l: clamp01(Math.min(0.88, lH + 0.18)) } // bottom lighter
  ].map(({s,l}) => hslToRgb(hH, s, l));
  const [tR,tG,tB] = stops[0];
  const [mR,mG,mB] = stops[1];
  const [bR,bG,bB] = stops[2];
  setCSSVar("--bg", `rgb(${tR}, ${tG}, ${tB})`);
  setCSSVar("--bg-mid", `rgb(${mR}, ${mG}, ${mB})`);
  setCSSVar("--bg-2", `rgb(${bR}, ${bG}, ${bB})`);
}

function setBackgroundFromHeroImage() {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = "DaIU/Trang chủ.png";
  img.decode().then(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const w = canvas.width = 40;
    const h = canvas.height = 40;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const rr = data[i], gg = data[i+1], bb = data[i+2], aa = data[i+3];
      if (aa < 220) continue; // bỏ pixel quá trong suốt
      r += rr; g += gg; b += bb; n++;
    }
    if (!n) return;
    r = Math.round(r/n); g = Math.round(g/n); b = Math.round(b/n);
    let [hH, sH, lH] = rgbToHsl(r, g, b);
    // làm nền dịu và có chiều sâu
    const l1 = clamp01(lH - 0.22);
    const l2 = clamp01(lH + 0.06);
    const s1 = clamp01(sH * 0.8);
    const s2 = clamp01(sH * 0.6);
    const [r1, g1, b1] = hslToRgb(hH, s1, l1);
    const [r2, g2, b2] = hslToRgb(hH, s2, l2);
    setCSSVar("--bg", `rgb(${r1}, ${g1}, ${b1})`);
    setCSSVar("--bg-2", `rgb(${r2}, ${g2}, ${b2})`);
  }).catch(() => {
    // giữ màu mặc định nếu không đọc được ảnh
  });
}

// ===== Gift glow (hero special) =====
function initGiftGlow() {
  // target element should have [data-gift] attribute
  const gift = document.querySelector('[data-gift]');
  if (!gift) return;
  gift.addEventListener('pointerenter', () => gift.classList.add('glow'));
  gift.addEventListener('pointerleave', () => gift.classList.remove('glow'));
}

async function init() {
  initIntersectionAnimations();
  initActiveNav();
  initKeyboardNav();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  setSoftPinkTheme();
  await setBackgroundFromDaIUImages();
  initParallax();
  initGiftGlow();
}

document.addEventListener("DOMContentLoaded", init);


