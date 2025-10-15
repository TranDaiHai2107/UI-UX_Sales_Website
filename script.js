// Cấu hình danh sách ảnh theo đúng thứ tự yêu cầu (từ thư mục DaIU)
// Lưu ý tên file có dấu và khoảng trắng: dùng đúng chuỗi như trong hệ thống file
const daiUImages = [
  "DaIU/Trang chủ.png",
  "DaIU/Trang chủ (2).png",
  "DaIU/Trang chủ (3).png",
  "DaIU/Trang chủ (4).png",
  "DaIU/Trang chủ (5).png",
  "DaIU/Trang chủ (6).png",
  "DaIU/Trang chủ (7).png",
  "DaIU/Trang chủ (8).png",
  "DaIU/Trang chủ (9).png",
  "DaIU/Trang chủ (10).png",
  "DaIU/Trang chủ (11).png",
  "DaIU/Trang chủ (12).png",
  "DaIU/Trang chủ (13).png",
  "DaIU/Trang chủ (14).png"
];

// Màu nhấn có thể tùy biến sau dựa trên ảnh nổi bật
const brandColorOptions = ["#7aa2ff", "#9b9eff", "#7fffd4", "#ffb86b", "#ffd166"];

function pickBrandColor(index) {
  return brandColorOptions[index % brandColorOptions.length];
}

function setCSSVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function createSection(src, index) {
  const section = document.createElement("section");
  section.className = "section";
  section.id = `section-${index + 1}`;
  section.setAttribute("aria-label", `Phần ${index + 1}`);

  const frame = document.createElement("div");
  frame.className = "frame";

  const imgWrap = document.createElement("div");
  imgWrap.className = "img-wrap";

  const img = document.createElement("img");
  img.loading = index <= 1 ? "eager" : "lazy"; // ảnh đầu tiên/tiếp theo ưu tiên
  img.decoding = "async";
  img.src = src;
  img.alt = `Trang chủ - hình ${index + 1}`;

  imgWrap.appendChild(img);
  frame.appendChild(imgWrap);

  const caption = document.createElement("p");
  caption.className = "caption";
  caption.textContent = `Hình ${index + 1} / ${daiUImages.length}`;

  section.appendChild(frame);
  section.appendChild(caption);
  return section;
}

function buildDotNav(total) {
  const container = document.getElementById("dotNav");
  container.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const btn = document.createElement("button");
    btn.className = "dot-btn";
    btn.setAttribute("aria-label", `Đi đến phần ${i + 1}`);
    btn.addEventListener("click", () => {
      document.getElementById(`section-${i + 1}`).scrollIntoView({ behavior: "smooth" });
    });
    container.appendChild(btn);
  }
}

function highlightDot(index) {
  const dots = document.querySelectorAll(".dot-btn");
  dots.forEach((d, i) => d.classList.toggle("active", i === index));
  setCSSVar("--brand", pickBrandColor(index));
}

function initScrollButtons() {
  const up = document.getElementById("scrollUp");
  const down = document.getElementById("scrollDown");
  up.addEventListener("click", () => scrollByViewport(-1));
  down.addEventListener("click", () => scrollByViewport(1));
}

function scrollByViewport(direction) {
  const sections = [
    ...document.querySelectorAll(".section")
  ];
  const current = getCurrentSectionIndex(sections);
  const nextIndex = Math.min(
    sections.length - 1,
    Math.max(0, current + direction)
  );
  sections[nextIndex].scrollIntoView({ behavior: "smooth" });
}

function getCurrentSectionIndex(sections) {
  const viewportCenter = window.scrollY + window.innerHeight / 2;
  let closestIndex = 0;
  let closestDistance = Infinity;
  for (let i = 0; i < sections.length; i++) {
    const rect = sections[i].getBoundingClientRect();
    const center = rect.top + window.scrollY + rect.height / 2;
    const dist = Math.abs(center - viewportCenter);
    if (dist < closestDistance) {
      closestDistance = dist;
      closestIndex = i;
    }
  }
  return closestIndex;
}

function initIntersectionAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, {
    threshold: 0.25
  });

  document.querySelectorAll(".frame").forEach((el) => observer.observe(el));
}

function initActiveSectionObserver() {
  const sections = document.querySelectorAll(".section");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id; // section-1 ...
        const index = parseInt(id.split("-")[1], 10) - 1;
        highlightDot(index);
      }
    });
  }, { threshold: 0.6 });

  sections.forEach((s) => observer.observe(s));
}

function initKeyboardNav() {
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      scrollByViewport(1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      scrollByViewport(-1);
    }
  });
}

function init() {
  const main = document.querySelector("main");
  daiUImages.forEach((src, i) => {
    const section = createSection(src, i);
    main.appendChild(section);
  });
  buildDotNav(daiUImages.length);
  initScrollButtons();
  initIntersectionAnimations();
  initActiveSectionObserver();
  initKeyboardNav();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Đặt màu đầu tiên
  highlightDot(0);
}

document.addEventListener("DOMContentLoaded", init);


