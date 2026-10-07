/* Atlas shell for the risks guide: builds the risk-path rail from the top bar's chapter links, keeps it in step
   with the page, plays specimens only while they are on screen, and draws specimen 04 from the case matrix. */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const guide = $("#guideView > .wrap"), chapters = $("#chapters");
  if (!guide || !chapters) return;

  /* ---------- risk-path rail ---------- */
  // The numbered links in the top bar are the single list of chapters; the rail mirrors them.
  const links = $$("a", chapters).filter(a => $(".n", a));
  const stops = links.map(a => {
    const section = document.getElementById(a.hash.slice(1));
    const subs = $$(".local-nav a", section).map(s => ({ href: s.getAttribute("href"), label: s.textContent, el: document.getElementById(s.hash.slice(1)) }));
    return { link: a, section, subs, n: $(".n", a).textContent, label: a.textContent.replace(/^\d+/, "").replace("(visited)", "").trim() };
  });

  const rail = document.createElement("nav");
  rail.className = "rail";
  rail.setAttribute("aria-label", "Risk path");
  rail.innerHTML = '<div class="rail-path"><span class="rail-line"></span><span class="rail-fill"></span><ol>' + stops.map(s =>
    `<li class="rail-stop"><a href="${s.link.hash}"><span class="rail-n">${s.n}</span><span>${s.label}</span></a>` +
    (s.subs.length ? `<div class="rail-subs"><div>${s.subs.map(x => `<a href="${x.href}">${x.label}</a>`).join("")}</div></div>` : "") + "</li>").join("") + "</ol></div>";
  guide.insertBefore(rail, $("section.chapter", guide));
  document.documentElement.classList.add("atlas-on");

  const path = $(".rail-path", rail), line = $(".rail-line", rail), fill = $(".rail-fill", rail);
  const items = $$(".rail-stop", rail);
  const TRIGGER = 160; // same line the top bar uses to decide which chapter is being read
  let active = -2, activeSub = null, ticking = false;

  const centre = i => items[i].offsetTop + 20; // each stop's number sits in a 40px row

  function syncDone() {
    stops.forEach((s, i) => {
      const done = s.link.classList.contains("done");
      if (done === items[i].classList.contains("done")) return;
      items[i].classList.toggle("done", done);
      if (done) $("a", items[i]).insertAdjacentHTML("beforeend", '<span class="vh"> (visited)</span>');
    });
  }

  function update() {
    ticking = false;
    if (!rail.offsetParent) return; // narrow screen, or the primer is showing
    let idx = -1;
    stops.forEach((s, i) => { if (s.section.getBoundingClientRect().top < TRIGGER) idx = i; });
    if (idx !== active) {
      active = idx;
      items.forEach((li, i) => {
        li.classList.toggle("active", i === idx);
        const a = $("a", li);
        if (i === idx) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    }
    // which part of the active chapter is on screen
    let sub = null;
    if (idx >= 0) stops[idx].subs.forEach(x => { if (x.el && x.el.getBoundingClientRect().top < TRIGGER + 40) sub = x.href; });
    if (sub !== activeSub) {
      activeSub = sub;
      $$(".rail-subs a", rail).forEach(a => {
        if (a.getAttribute("href") === sub && a.closest(".rail-stop") === items[idx]) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }
    // the filled part of the line follows the reader between one stop and the next
    const first = centre(0), last = centre(items.length - 1);
    line.style.top = first + "px";
    line.style.height = (last - first) + "px";
    let y = first;
    if (idx >= 0) {
      const from = stops[idx].section.getBoundingClientRect(), next = stops[idx + 1];
      const span = next ? next.section.getBoundingClientRect().top - from.top : from.height;
      const t = Math.min(1, Math.max(0, (TRIGGER - from.top) / Math.max(1, span)));
      y = next ? centre(idx) + (centre(idx + 1) - centre(idx)) * t : last;
    }
    // the fill is the full line scaled down, so following the reader costs no layout
    fill.style.top = first + "px";
    fill.style.height = (last - first) + "px";
    fill.style.transform = "scaleY(" + Math.min(1, Math.max(0, (y - first) / Math.max(1, last - first))).toFixed(4) + ")";
  }
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("hashchange", () => { active = -2; queue(); });
  // the open list of parts changes the rail's height, so the line is measured again once it settles
  path.addEventListener("transitionend", queue);
  new MutationObserver(syncDone).observe(chapters, { attributes: true, attributeFilter: ["class"], subtree: true });
  syncDone();
  update();

  /* ---------- specimens ---------- */
  // Specimen 04 is the case matrix in miniature: one row per case, one column per failure mode or risk factor.
  const grid = $('[data-specimen="cases"]'), matrix = $("#matrix");
  function drawCases() {
    const rows = $$("tr[data-row]", matrix);
    if (!grid || !rows.length) return;
    const X = i => 82 + i * 24 + (i > 2 ? 16 : 0), Y = r => 50 + r * 16.5;
    const kinds = ["mis", "con", "col"];
    let g = `<text x="${X(0) - 8}" y="16">3 modes</text><text x="${X(3) - 8}" y="16">7 risk factors</text>` +
      kinds.map((k, i) => `<line class="sp-${k}" x1="${X(i) - 8}" y1="28" x2="${X(i) + 8}" y2="28"/>`).join("") +
      `<line class="sp-acc" x1="${X(3) - 8}" y1="28" x2="${X(9) + 8}" y2="28"/>`;
    rows.forEach((tr, r) => {
      const cells = $$("td", tr).slice(2);
      g += `<g class="sp-row" data-r="${r}"><rect class="sp-band" x="48" y="${Y(r) - 8}" width="274" height="16" rx="3"/>` +
        `<text x="66" y="${Y(r) + 3.5}" text-anchor="end">${String(r + 1).padStart(2, "0")}</text>` +
        cells.map((td, i) => $(".dot", td)
          ? `<circle class="f-${i < 3 ? kinds[i] : "acc"} f-none" cx="${X(i)}" cy="${Y(r)}" r="4.6"/>`
          : `<circle class="sp-none" cx="${X(i)}" cy="${Y(r)}" r="1.1"/>`).join("") + "</g>";
    });
    $("svg", grid).innerHTML = g;
    grid.hidden = false;
    syncCases();
  }
  function syncCases() {
    $$("tr[data-row]", matrix).forEach((tr, r) => {
      const row = $(`.sp-row[data-r="${r}"]`, grid);
      if (!row) return;
      row.classList.toggle("dim", tr.classList.contains("dim"));
      row.classList.toggle("picked", tr.classList.contains("picked"));
    });
  }
  if (grid && matrix) {
    drawCases();
    new MutationObserver(m => { if (m.some(x => x.type === "childList")) drawCases(); else syncCases(); })
      .observe(matrix, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- what each step of a dossier rating means ---------- */
  // The dossier says a risk is "Tight" or "Fast" without saying what the other steps were. The wording is
  // already in the table, one label per measure per step, so the key is read back out of it rather than
  // written again: anything the author changes in a row changes here too. A step no row uses is left out,
  // because an empty step is a gap in the reading, not a word this script should invent.
  const boxes = $$(".dossier").filter(box => $("table", box));
  if (boxes.length) {
    // The measures are the same in every dossier, and a single risk only uses one step of each, so the wording is
    // pooled from every row on the page before it is written out. One dossier on its own would show a near-empty key.
    const heads = $$("thead th", $("table", boxes[0])).slice(1).map(th => {
      const copy = th.cloneNode(true), small = $("small", copy);
      if (small) small.remove();
      return { name: copy.textContent.trim(), asks: $("small", th) ? $("small", th).textContent.trim() : "" };
    });
    let steps = 0;
    const seen = heads.map(() => ({}));
    boxes.forEach(box => $$("tbody tr", $("table", box)).forEach(tr => $$("td", tr).forEach((td, i) => {
      const pips = $(".pips", td), vh = $(".vh", td);
      if (!pips || !seen[i]) return;
      const of = /\((\d+) of (\d+)\)/.exec(vh ? vh.textContent : "");
      if (of) steps = Math.max(steps, +of[2]);
      const copy = td.cloneNode(true);
      $$(".pips, .vh, small", copy).forEach(x => x.remove());
      const label = copy.textContent.trim();
      if (label) seen[i][pips.dataset.level] = label;
    })));
    if (heads.length && steps) {
      const rows = heads.map((h, i) => {
        let cells = "";
        for (let s = 1; s <= steps; s++) {
          const label = seen[i][String(s)];
          // a step no risk reaches is shown as the gap it is, rather than given a word the guide never wrote
          cells += label
            ? `<td><span class="pips" data-level="${s}" aria-hidden="true">${"<i></i>".repeat(steps)}</span>${label}</td>`
            : '<td><span class="small">no risk in this guide sits here</span></td>';
        }
        return `<tr><th scope="row">${h.name}${h.asks ? `<small>${h.asks}</small>` : ""}</th>${cells}</tr>`;
      }).join("");
      const body = `<div class="layer-body"><table class="dkey-table"><tbody>${rows}</tbody></table>` +
        '<p class="small">Read back from the ratings in this guide. The reading is the guide\'s own, not a figure from Hammond et al.</p></div>';
      const inside = heads.map(h => h.name).join(" · ");
      boxes.forEach((box, n) => {
        if ($(".dkey", box)) return;
        const key = document.createElement("details");
        key.className = "layer dkey";
        key.id = "dkey-" + (n + 1);
        key.innerHTML = '<summary><span class="layer-kind">The scale</span><span class="layer-what">' +
          `<span class="layer-title">What each step means</span><span class="layer-inside">${inside}</span></span></summary>` + body;
        box.appendChild(key);
        // explore.js has already settled the page by the time this runs, so match whatever the reader chose
        if (window.Explore && window.Explore.isAllOpen()) key.open = true;
      });
    }
  }

  // Specimens animate only while they are on screen.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("in-view", e.isIntersecting)), { rootMargin: "80px" });
    $$(".specimen").forEach(f => io.observe(f));
  } else {
    $$(".specimen").forEach(f => f.classList.add("in-view"));
  }
})();
