function setCSSVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function initIntersectionAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".feature, .card").forEach((el) => observer.observe(el));
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

function init() {
  initIntersectionAnimations();
  initActiveNav();
  initKeyboardNav();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  setSoftPinkTheme();
  setBackgroundFromHeroImage();
}

document.addEventListener("DOMContentLoaded", init);

// ==== Background from hero image ====
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


