/* Explore layer, shared by every page. The page shows a picture and something to try for each idea;
   the full text sits one click behind it. Nothing is removed: without this script every layer is a
   plain <details> and every folded region is ordinary page content.

   Four jobs:
   1. reveal    a link, a hash or a search hit that points inside a closed layer opens it first
   2. fold      wraps the body of a long section behind a "Show the detail" button (used where the
                markup is not written as <details>)
   3. open all  one switch that opens every layer on the page, for readers who want the full text
   4. Visuals   the registry that mounts a drawing or toy model into its [data-visual] slot */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const root = document.documentElement;
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /* ---------- 2. fold ---------- */
  let foldN = 0;
  function setFold(region, open) {
    region.hidden = !open;
    const btn = region.previousElementSibling;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    $(".fold-verb", btn).textContent = open ? btn.dataset.close : btn.dataset.open;
    region.parentElement.classList.toggle("is-open", open);
  }
  // Everything after `head` inside each host moves into a region that starts closed. The region is
  // display: contents when open, so the host's own grid or flow layout still applies to what is inside.
  function fold(selector, head, opts) {
    opts = opts || {};
    $$(selector).forEach(host => {
      if (host.dataset.folded) return;
      const headEl = $(":scope > " + head, host);
      if (!headEl) return;
      const rest = [];
      for (let n = headEl.nextSibling; n; n = n.nextSibling) rest.push(n);
      if (!rest.some(n => n.nodeType === 1)) return;
      const region = document.createElement("div");
      region.className = "fold-region";
      region.id = "fold-" + (host.id || ++foldN);
      rest.forEach(n => region.appendChild(n));
      const name = ($("h2, h3, h4", headEl) || headEl).textContent.trim();
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fold-toggle";
      btn.dataset.open = opts.open || "Show the detail";
      btn.dataset.close = opts.close || "Hide the detail";
      btn.setAttribute("aria-controls", region.id);
      btn.innerHTML = '<span class="fold-verb"></span><span class="vh">: ' + name.replace(/</g, "&lt;") + "</span>";
      btn.addEventListener("click", () => { setFold(region, region.hidden); if (!region.hidden) markSeen(region.id); });
      host.append(btn, region);
      host.dataset.folded = "1";
      host.classList.add("fold-host");
      setFold(region, false);
    });
    if (allOpen) setAll(true);
    else revealHash();
  }

  /* ---------- 1. reveal ---------- */
  function reveal(el) {
    let changed = false;
    if (el.dataset.folded) {
      const own = $(":scope > .fold-region", el);
      if (own && own.hidden) { setFold(own, true); changed = true; markSeen(own.id); }
    }
    for (let p = el; p; p = p.parentElement) {
      if (p.tagName === "DETAILS" && !p.open) { p.open = true; changed = true; if (p.classList.contains("layer")) markSeen(p.id); }
      if (p.classList.contains("fold-region") && p.hidden) { setFold(p, true); changed = true; markSeen(p.id); }
    }
    return changed;
  }
  const target = hash => { try { return hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; } catch (e) { return null; } };
  function revealHash() {
    const el = target(location.hash);
    if (el && reveal(el)) requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
  }
  window.addEventListener("hashchange", revealHash);
  // Capture phase: the layer is open before the browser (or the page's own router) scrolls to the target.
  document.addEventListener("click", e => {
    const a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    const el = a ? target(a.getAttribute("href")) : null;
    if (el) reveal(el);
  }, true);

  /* ---------- layers the reader has opened keep a filled marker ---------- */
  let seen = read("wam-layers", []);
  function markSeen(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) (el.classList.contains("fold-region") ? el.parentElement : el).classList.add("seen");
    if (seen.includes(id)) return;
    seen.push(id);
    write("wam-layers", seen);
  }
  // only a layer the reader opened counts: by its own row, or by following a link into it
  document.addEventListener("click", e => {
    const sum = e.target.closest ? e.target.closest("details.layer > summary") : null;
    if (sum && !sum.parentElement.open) markSeen(sum.parentElement.id);
  });
  function paintSeen() {
    seen.forEach(id => {
      const el = document.getElementById(id);
      if (el) (el.classList.contains("fold-region") ? el.parentElement : el).classList.add("seen");
    });
  }

  /* ---------- 3. open all ---------- */
  let allOpen = read("wam-open-all", false) === true;
  const modeBtns = [];
  function setAll(open) {
    // closing returns each layer to how the page was written: a few inner lists start open
    $$("main details").forEach(d => { d.open = open || d.hasAttribute("data-open-default"); });
    $$(".fold-region").forEach(r => setFold(r, open));
    allOpen = open;
    root.classList.toggle("explore-all", open);
    modeBtns.forEach(b => {
      b.setAttribute("aria-pressed", open ? "true" : "false");
      const label = open ? "Close all the layers on this page" : "Open all the layers on this page";
      if (b.classList.contains("icon-btn")) { b.setAttribute("aria-label", label); b.title = label; }
      else $("span", b).textContent = open ? "Close everything" : "Open everything";
    });
  }
  function modeButton(cls, html) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.innerHTML = html;
    b.addEventListener("click", () => { setAll(!allOpen); write("wam-open-all", allOpen); });
    modeBtns.push(b);
    return b;
  }
  // two chevrons: pointing apart to open everything, pointing together to close it again
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="i-open" d="M7 9l5-5 5 5M7 15l5 5 5-5"/><path class="i-close" d="M7 4l5 5 5-5M7 20l5-5 5 5"/></svg>';
  const bar = $(".sitebar-in");
  if (bar) {
    const b = modeButton("icon-btn mode-btn", ICON);
    const theme = $("#themeBtn", bar);
    if (theme) bar.insertBefore(b, theme); else bar.appendChild(b);
    // the site bar has no room for it on a phone, so the same switch floats in the corner there
    document.body.appendChild(modeButton("icon-btn mode-btn mode-fab", ICON));
  }
  // A page can also place a labelled switch in its own copy: <span data-explore-switch></span>
  $$("[data-explore-switch]").forEach(slot => slot.appendChild(modeButton("btn ghost sm mode-text", "<span></span>")));

  // Printing a page prints all of it.
  let beforePrint = null;
  window.addEventListener("beforeprint", () => { beforePrint = allOpen; setAll(true); });
  window.addEventListener("afterprint", () => { if (beforePrint === false) setAll(false); beforePrint = null; });

  /* ---------- 4. Visuals ---------- */
  // visuals.js calls Visuals.register(id, init) once per slot. `init(slot, ctx)` draws into the element
  // that carries data-visual="id" and wires up whatever it needs. Pass { html, init } instead to replace
  // the slot's fallback markup first. A slot with nothing registered keeps its fallback, or stays hidden
  // if it is empty. One visual that throws does not stop the others.
  const themeFns = [];
  new MutationObserver(() => themeFns.forEach(f => f())).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => themeFns.forEach(f => f()));
  const ctx = slot => ({
    slot,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    // current value of a colour or font token, for canvas and generated SVG
    css: name => getComputedStyle(root).getPropertyValue(name).trim(),
    onTheme: fn => themeFns.push(fn),
    // runs fn the first time the slot is on screen with a real size (it may start inside a closed layer)
    whenVisible: fn => {
      if (!("IntersectionObserver" in window)) { fn(); return; }
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: "120px" });
      io.observe(slot);
    },
    // segmented control: buttons with data-v inside el; returns a getter for the pressed value
    seg: (el, onChange) => {
      $$("button", el).forEach(b => b.addEventListener("click", () => {
        $$("button", el).forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        onChange(b.dataset.v);
      }));
      return () => $("button[aria-pressed='true']", el).dataset.v;
    }
  });
  const registered = {};
  function register(id, def) {
    if (typeof def === "function") def = { init: def };
    registered[id] = def;
    $$('[data-visual="' + id + '"]').forEach(slot => {
      const fallback = slot.innerHTML, wasHidden = slot.hidden;
      try {
        if (def.html != null) slot.innerHTML = def.html;
        slot.hidden = false;
        if (def.init) def.init(slot, ctx(slot));
        slot.classList.add("is-mounted");
      } catch (err) {
        console.error('Visual "' + id + '" failed, keeping the fallback.', err);
        slot.innerHTML = fallback;
        slot.hidden = wasHidden;
      }
    });
  }
  window.Visuals = { register, has: id => !!registered[id] };

  window.Explore = { reveal, fold, setAll, isAllOpen: () => allOpen };

  $$("main details[open]").forEach(d => d.setAttribute("data-open-default", ""));
  paintSeen();
  setAll(allOpen);
  if (!allOpen) revealHash();
})();
