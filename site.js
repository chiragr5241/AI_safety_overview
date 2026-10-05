/* Shared page chrome for index.html and ecosystem.html: theme switch, Contents menu, active section, reading progress. */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const root = document.documentElement;

  /* ---------- theme toggle (same storage key as the risks guide, so the choice carries across pages) ---------- */
  const themeBtn = $("#themeBtn");
  const isDark = () => root.getAttribute("data-theme") === "dark" ||
    (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  function labelTheme() {
    const label = isDark() ? "Switch to light theme" : "Switch to dark theme";
    themeBtn.setAttribute("aria-label", label);
    themeBtn.title = label;
  }
  if (themeBtn) {
    labelTheme();
    themeBtn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("wam-theme", next); } catch (e) {}
      labelTheme();
    });
  }

  /* ---------- Contents menu (narrow screens) ---------- */
  const chapters = $("#chapters"), tocBtn = $("#tocBtn");
  if (!chapters || !tocBtn) return;
  function tocOpen(open) {
    chapters.classList.toggle("open", open);
    tocBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  tocBtn.addEventListener("click", () => tocOpen(!chapters.classList.contains("open")));
  chapters.addEventListener("click", e => { if (e.target.closest("a")) tocOpen(false); });
  document.addEventListener("click", e => { if (!e.target.closest(".topbar")) tocOpen(false); });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape" || !chapters.classList.contains("open")) return;
    tocOpen(false);
    tocBtn.focus();
  });

  /* ---------- progress and active section, for in-page links only ---------- */
  const navLinks = $$('a[href^="#"]', chapters);
  const sections = navLinks.map(a => document.getElementById(a.hash.slice(1)));
  const progress = $("#progress"), tocName = $("#tocName");
  if (!navLinks.length) return;
  let activeIdx = -2;
  function onScroll() {
    const h = document.documentElement;
    if (progress) progress.style.transform = "scaleX(" + (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)).toFixed(4) + ")";
    let idx = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 160) idx = i; });
    if (idx === activeIdx) return;
    activeIdx = idx;
    navLinks.forEach((a, i) => {
      a.classList.toggle("active", i === idx);
      if (i === idx) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    if (tocName) tocName.textContent = idx < 0 ? "Contents" : navLinks[idx].textContent.trim();
    if (idx < 0) return;
    const a = navLinks[idx], x = a.offsetLeft - chapters.offsetLeft;
    if (x < chapters.scrollLeft || x + a.offsetWidth > chapters.scrollLeft + chapters.clientWidth) chapters.scrollLeft = x - 24;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
