/* Experiment 02: builds every figure on experiments-cycles.html from window.WNF (cycles-data.js). Counts only; no conclusions. */
(function () {
  "use strict";
  const W = window.WNF;
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const NS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  /* ---------- lookups ---------- */
  const INC = W.incidents;
  const byId = {}; INC.forEach(i => { byId[i.id] = i; });
  const CYC = {}; W.cycles.forEach(c => { CYC[c.id] = c; });
  const JX = {}; W.junctures.forEach(j => { JX[j.id] = j; });
  const LANE = {}; W.lanes.forEach(l => { LANE[l.id] = l; });
  const grp = i => W.outcomes[i.out].group;
  const GROUPS = ["inc", "ext", "brk"];
  const prev = {}; INC.forEach(i => i.next.forEach(n => { (prev[n] = prev[n] || []).push(i.id); }));
  const vsOf = id => { const s = new Set(byId[id].vs); INC.forEach(i => { if (i.vs.includes(id)) s.add(i.id); }); return [...s]; };
  const members = cid => INC.filter(i => i.cyc.includes(cid));
  const jmembers = jid => INC.filter(i => i.jx === jid);
  const SHARED = W.junctures.filter(j => jmembers(j.id).length >= 2).sort((a, b) => a.year - b.year);

  const yr = y => y < 0 ? (-y) + " BC" : String(y);
  const span = i => {
    if (i.y1 == null || i.y1 === i.y0) return yr(i.y0);
    if (i.y0 < 0 && i.y1 < 0) return (-i.y0) + "–" + (-i.y1) + " BC";
    if (i.y0 < 0) return (-i.y0) + " BC–AD " + i.y1;
    return i.y0 + "–" + i.y1;
  };
  const chap = i => i.ch === 0 ? "Preface" : "Ch. " + i.ch;
  const outTag = i => `<span class="otag ${grp(i)}"><i class="dot ${grp(i)}"></i>${esc(W.outcomes[i.out].label)}</span>`;
  const incBtn = id => `<button class="lnk" type="button" data-inc="${id}">${esc(byId[id].name)}</button>`;
  const pct = (a, b) => b ? Math.round(100 * a / b) + "%" : "";

  /* ---------- tooltip ---------- */
  const tip = $("#tip");
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let left = x + 14, top = y + 14;
    if (left + r.width > innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > innerHeight - 8) top = y - r.height - 14;
    tip.style.left = Math.max(8, left) + "px"; tip.style.top = Math.max(8, top) + "px";
  }
  const hideTip = () => { tip.hidden = true; };

  /* ---------- tiles ---------- */
  const links = INC.reduce((n, i) => n + i.next.length, 0);
  const pairs = new Set(); INC.forEach(i => i.vs.forEach(v => pairs.add([i.id, v].sort().join("|"))));
  $("#tiles").innerHTML = [
    [INC.length, "incidents, from 9500 BC to 2011"],
    [W.cycles.length, "cycles: " + W.cycles.filter(c => c.kind === "loop").length + " loops, " + W.cycles.filter(c => c.kind === "turn").length + " turns"],
    [SHARED.length, "shocks that hit more than one society"],
    [links + pairs.size, "links the book makes: " + links + " sequences, " + pairs.size + " comparisons"]
  ].map(([n, t]) => `<div class="tile"><b>${n}</b><span>${t}</span></div>`).join("");

  /* ---------- state ---------- */
  const state = { sel: null, cycle: null, jx: null };

  /* ---------- network ---------- */
  const svg = $("#net");
  const STOPS = [[-10000, 0], [-600, .06], [600, .15], [1300, .26], [1500, .36], [1700, .49], [1800, .6], [1900, .77], [2015, 1]];
  const TICKS = [-9500, -500, 500, 1000, 1300, 1500, 1600, 1700, 1800, 1850, 1900, 1950, 2000];
  function frac(y) {
    for (let k = 1; k < STOPS.length; k++) {
      const [y0, f0] = STOPS[k - 1], [y1, f1] = STOPS[k];
      if (y <= y1) return f0 + (f1 - f0) * (y - y0) / (y1 - y0);
    }
    return 1;
  }
  let POS = {}, JPOS = {};

  function drawNet() {
    const width = Math.max(980, svg.parentNode.clientWidth - 40);
    const LABW = 168, X0 = LABW + 14, X1 = width - 18, ROW = 17, GAP = 16;
    const xf = y => X0 + (X1 - X0) * frac(y);
    svg.innerHTML = "";
    POS = {}; JPOS = {};

    /* shock diamonds on two rows so neighbours do not collide */
    const jtop = 18, jrow = 16;
    const jlast = [-1e9, -1e9];
    W.junctures.slice().sort((a, b) => a.year - b.year).forEach(j => {
      const x = xf(j.year);
      let r = jlast[0] < x - 14 ? 0 : jlast[1] < x - 14 ? 1 : 0;
      jlast[r] = x;
      JPOS[j.id] = { x, y: jtop + 8 + r * jrow };
    });
    const top = jtop + 2 * jrow + 18;

    /* lanes: within each, dots that would touch move to the next row down */
    let y = top;
    const laneBox = [];
    W.lanes.forEach((ln, li) => {
      const items = INC.filter(i => i.lane === ln.id).map(i => ({ i, x: xf(i.y0) })).sort((a, b) => a.x - b.x);
      const last = [];
      items.forEach(it => {
        let r = last.findIndex(lx => lx < it.x - GAP);
        if (r < 0) { r = last.length; last.push(it.x); } else last[r] = it.x;
        it.r = r;
      });
      const rows = Math.max(1, last.length);
      const h = rows * ROW + 16;
      laneBox.push({ ln, y, h, li });
      items.forEach(it => { POS[it.i.id] = { x: it.x, y: y + 8 + it.r * ROW + ROW / 2 }; });
      y += h + 4;
    });
    const bottom = y;
    const height = bottom + 30;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.minWidth = width + "px";

    const gBack = sv("g", {}, svg);
    laneBox.forEach(b => {
      if (b.li % 2 === 0) sv("rect", { class: "lane-bg", x: 0, y: b.y, width, height: b.h, rx: 6 }, gBack);
      const words = b.ln.label.split(", ");
      const lines = words.length > 1 && b.ln.label.length > 20 ? [words.slice(0, Math.ceil(words.length / 2)).join(", ") + ",", words.slice(Math.ceil(words.length / 2)).join(", ")] : [b.ln.label];
      const t = sv("text", { class: "lane-lb", x: 10, y: b.y + b.h / 2 - (lines.length - 1) * 7 + 4 }, gBack);
      lines.forEach((l, k) => { const ts = sv("tspan", { x: 10, dy: k ? 14 : 0 }, t); ts.textContent = l; });
    });
    TICKS.forEach(tk => {
      const x = xf(tk);
      sv("line", { class: "tick", x1: x, x2: x, y1: top - 6, y2: bottom }, gBack);
      const t = sv("text", { class: "tick-lb", x, y: bottom + 18 }, gBack); t.textContent = yr(tk);
    });
    const jb = sv("text", { class: "jx-band-lb", x: 10, y: jtop + 18 }, gBack); jb.textContent = "Shocks";

    /* edges */
    const gEdge = sv("g", {}, svg);
    const curve = (a, b) => {
      const mx = (a.x + b.x) / 2, dy = Math.abs(b.y - a.y);
      const bow = Math.min(40, 10 + Math.abs(b.x - a.x) * .08) * (a.y <= b.y ? -1 : 1) * (dy < 4 ? 1 : .4);
      return `M${a.x},${a.y} Q${mx},${(a.y + b.y) / 2 + bow} ${b.x},${b.y}`;
    };
    INC.forEach(i => {
      if (i.jx && JPOS[i.jx]) {
        const a = JPOS[i.jx], b = POS[i.id];
        sv("line", { class: "e-jx", x1: a.x, y1: a.y, x2: b.x, y2: b.y, "data-a": i.jx, "data-b": i.id }, gEdge);
      }
    });
    pairs.forEach(p => {
      const [a, b] = p.split("|");
      sv("path", { class: "e-vs", d: curve(POS[a], POS[b]), "data-a": a, "data-b": b }, gEdge);
    });
    INC.forEach(i => i.next.forEach(n => {
      sv("path", { class: "e-next", d: curve(POS[i.id], POS[n]), "data-a": i.id, "data-b": n }, gEdge);
    }));

    /* shock diamonds */
    const gJ = sv("g", {}, svg);
    W.junctures.forEach(j => {
      const p = JPOS[j.id];
      const g = sv("g", { class: "jx", transform: `translate(${p.x},${p.y})`, tabindex: 0, role: "button", "data-jx": j.id, "aria-label": `Shock: ${j.name}, ${yr(j.year)}` }, gJ);
      sv("rect", { x: -5.5, y: -5.5, width: 11, height: 11, transform: "rotate(45)" }, g);
    });

    /* dots */
    const gN = sv("g", {}, svg);
    INC.forEach(i => {
      const p = POS[i.id];
      const g = sv("g", { class: "nd " + grp(i), transform: `translate(${p.x},${p.y})`, tabindex: 0, role: "button", "data-id": i.id, "aria-label": `${i.name}, ${i.place}, ${span(i)}` }, gN);
      sv("circle", { r: 6.5 }, g);
    });
    sv("g", { id: "netLabels" }, svg);
    paint();
  }

  /* highlight state: selected dot, chosen cycle or shock */
  function paint() {
    const sel = state.sel, onSet = new Set();
    if (sel) { onSet.add(sel); byId[sel].next.forEach(n => onSet.add(n)); (prev[sel] || []).forEach(n => onSet.add(n)); vsOf(sel).forEach(n => onSet.add(n)); }
    let keep = null;
    if (state.cycle) keep = new Set(members(state.cycle).map(i => i.id));
    if (state.jx) keep = new Set(jmembers(state.jx).map(i => i.id));
    svg.querySelectorAll(".nd").forEach(g => {
      const id = g.dataset.id;
      g.classList.toggle("sel", id === sel);
      g.classList.toggle("dim", !!keep && !keep.has(id) && !onSet.has(id));
    });
    svg.querySelectorAll(".jx").forEach(g => {
      g.classList.toggle("sel", g.dataset.jx === state.jx);
      g.classList.toggle("dim", !!keep && state.jx && g.dataset.jx !== state.jx);
    });
    svg.querySelectorAll(".e-next, .e-vs, .e-jx").forEach(e => {
      const a = e.dataset.a, b = e.dataset.b, isJ = e.classList.contains("e-jx");
      let on = false, off = false;
      if (sel) { on = isJ ? b === sel : a === sel || b === sel; off = !on; }
      else if (state.jx) { on = isJ && a === state.jx; off = !on; }
      else if (keep) off = isJ ? !keep.has(b) : !(keep.has(a) && keep.has(b));
      e.classList.toggle("e-on", on);
      e.classList.toggle("e-off", off);
    });
    /* names for the selected dot and its neighbours, or for a chosen shock's members */
    const gl = $("#netLabels"); if (!gl) return;
    gl.innerHTML = "";
    const named = sel ? [...onSet] : state.jx ? [...keep] : [];
    named.forEach(id => {
      const p = POS[id]; if (!p) return;
      const right = p.x < svg.viewBox.baseVal.width - 220;
      const t = sv("text", { class: "lb", x: p.x + (right ? 10 : -10), y: p.y - 9, "text-anchor": right ? "start" : "end" }, gl);
      t.textContent = byId[id].name;
    });
  }

  function select(id, scroll) {
    state.sel = id;
    paint();
    renderDetail();
    if (scroll) $("#fig-net").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  function renderDetail() {
    const d = $("#detail");
    if (state.sel) {
      const i = byId[state.sel];
      const fv = W.factors.map(f => `<dt>${esc(f.label)}</dt><dd>${i.f[f.key] == null ? '<span class="small">Not stated</span>' : esc(f.values[i.f[f.key]])}</dd>`).join("");
      const list = ids => ids.length ? ids.map(incBtn).join(", ") : '<span class="small">None in the book</span>';
      d.innerHTML = `
        <h3>${esc(i.name)}</h3>
        <p class="meta">${esc(i.place)} · ${span(i)} · ${chap(i)}, pp. ${esc(i.pp)}</p>
        <p class="sum">${esc(i.sum)}</p>
        <dl>
          <dt>Cycles</dt><dd class="otags">${i.cyc.length ? i.cyc.map(c => `<button class="pick" type="button" data-cyc="${c}">${esc(CYC[c].name)}</button>`).join("") : '<span class="small">None coded</span>'}</dd>
          <dt>Outcome</dt><dd>${outTag(i)}</dd>
          ${i.jx ? `<dt>Shared shock</dt><dd><button class="lnk" type="button" data-jx="${i.jx}">${esc(JX[i.jx].name)}</button></dd>` : ""}
          ${i.drift ? `<dt>The small difference</dt><dd>${esc(i.drift)}</dd>` : ""}
          <dt>Came before</dt><dd>${list(prev[i.id] || [])}</dd>
          <dt>Followed by</dt><dd>${list(i.next)}</dd>
          <dt>Set against</dt><dd>${list(vsOf(i.id))}</dd>
          ${fv}
        </dl>`;
    } else if (state.jx) {
      const j = JX[state.jx], ms = jmembers(j.id);
      d.innerHTML = `<h3>${esc(j.name)}</h3><p class="meta">${yr(j.year)} · pp. ${esc(j.pages)}</p><p class="sum">${esc(j.shock)}</p>
        <dl>${ms.map(i => `<dt>${incBtn(i.id)}</dt><dd>${i.drift ? esc(i.drift) + " " : ""}${outTag(i)}</dd>`).join("")}</dl>`;
    } else if (state.cycle) {
      const c = CYC[state.cycle], ms = members(c.id);
      d.innerHTML = `<h3>${esc(c.name)}</h3><p class="meta">${c.kind === "loop" ? "Loop" : "Turn"} · ${ms.length} incidents · pp. ${esc(c.pages)}</p><p class="sum">${esc(c.gist)}</p>`;
    } else {
      d.innerHTML = '<p class="empty">Pick a dot, a diamond or a name anywhere on the page.</p>';
    }
  }

  /* network events */
  svg.addEventListener("click", e => {
    const n = e.target.closest(".nd"), j = e.target.closest(".jx");
    if (n) select(state.sel === n.dataset.id ? null : n.dataset.id);
    else if (j) { state.sel = null; state.cycle = null; state.jx = state.jx === j.dataset.jx ? null : j.dataset.jx; syncPicks(); paint(); renderDetail(); }
    else if (state.sel) select(null);
  });
  svg.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target.closest(".nd, .jx"); if (!t) return;
    e.preventDefault(); t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  svg.addEventListener("pointermove", e => {
    const n = e.target.closest(".nd"), j = e.target.closest(".jx");
    if (n) { const i = byId[n.dataset.id]; showTip(`<b>${esc(i.name)}</b>${esc(i.place)} · ${span(i)}`, e.clientX, e.clientY); }
    else if (j) { const x = JX[j.dataset.jx]; showTip(`<b>${esc(x.name)}</b>${yr(x.year)} · ${jmembers(x.id).length} incidents`, e.clientX, e.clientY); }
    else hideTip();
  });
  svg.addEventListener("pointerleave", hideTip);

  /* legend and cycle chips */
  const gCount = g => INC.filter(i => grp(i) === g).length;
  $("#netLegend").innerHTML = GROUPS.map(g => `<span><i class="dot ${g}"></i>${W.groups[g]} (${gCount(g)})</span>`).join("") +
    `<span><i class="dia"></i>Shared shock</span><span><i class="ln-next"></i>Followed in the same place</span><span><i class="ln-vs"></i>Set against</span>`;
  const picks = $("#cyclePicks");
  picks.innerHTML = `<button class="pick" type="button" data-cyc="" aria-pressed="true">All</button>` +
    W.cycles.map(c => `<button class="pick" type="button" data-cyc="${c.id}" aria-pressed="false">${esc(c.name)} <small>${members(c.id).length}</small></button>`).join("");
  function syncPicks() { picks.querySelectorAll(".pick").forEach(b => b.setAttribute("aria-pressed", (b.dataset.cyc || null) === state.cycle && !state.jx ? "true" : "false")); }
  function chooseCycle(cid) { state.cycle = cid || null; state.jx = null; state.sel = null; syncPicks(); paint(); renderDetail(); }
  picks.addEventListener("click", e => { const b = e.target.closest(".pick"); if (b) chooseCycle(b.dataset.cyc); });

  /* any incident name or cycle chip on the page */
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-inc]");
    if (b && !b.closest("#net")) { state.cycle = null; state.jx = null; syncPicks(); select(b.dataset.inc, !b.closest("#detail")); return; }
    const c = e.target.closest("#detail [data-cyc], .cyc [data-cyc]");
    if (c) { chooseCycle(c.dataset.cyc); if (c.closest(".cyc")) $("#fig-net").scrollIntoView({ block: "start" }); return; }
    const j = e.target.closest("#detail [data-jx], .shock [data-jx]");
    if (j) { state.sel = null; state.cycle = null; state.jx = j.dataset.jx; syncPicks(); paint(); renderDetail(); if (j.closest(".shock")) $("#fig-net").scrollIntoView({ block: "start" }); }
  });

  /* ---------- one shock, several paths ---------- */
  $("#shocks").innerHTML = SHARED.map(j => {
    const ms = jmembers(j.id).sort((a, b) => a.y0 - b.y0);
    return `<div class="card shock">
      <h3>${esc(j.name)} <span>${yr(j.year)} · pp. ${esc(j.pages)}</span></h3>
      <p>${esc(j.shock)} <button class="lnk" type="button" data-jx="${j.id}">Show on the network</button></p>
      <table class="tbl"><thead><tr><th>Incident</th><th>The small difference</th><th>Outcome</th></tr></thead><tbody>
      ${ms.map(i => `<tr><td>${incBtn(i.id)}<div class="small">${esc(i.place)}</div></td><td>${i.drift ? esc(i.drift) : '<span class="small">Not named</span>'}</td><td>${outTag(i)}</td></tr>`).join("")}
      </tbody></table></div>`;
  }).join("");

  /* ---------- the cycles ---------- */
  $("#cycleCards").innerHTML = W.cycles.map(c => {
    const ms = members(c.id).sort((a, b) => a.y0 - b.y0);
    const stages = c.loop.map(s => `<li><span>${esc(s)}</span></li>`).join("") + (c.kind === "loop" ? `<li class="back">↺ back to the start</li>` : "");
    return `<div class="card cyc" id="cyc-${c.id}">
      <span class="kind">${c.kind === "loop" ? "Loop" : "Turn"} · ${ms.length} incidents</span>
      <h3>${esc(c.name)}</h3>
      <p class="cterm">${c.term ? "The book's term: " + esc(c.term) : "Described in the book, not named"} · pp. ${esc(c.pages)}</p>
      <p>${esc(c.gist)}</p>
      <ol class="loop">${stages}</ol>
      <div class="members">${ms.map(i => incBtn(i.id)).join("")}</div>
      <div><button class="pick" type="button" data-cyc="${c.id}">Show on the network</button></div>
    </div>`;
  }).join("");

  /* ---------- outcomes by cycle ---------- */
  $("#outLegend").innerHTML = GROUPS.map(g => `<span><i class="dot ${g}"></i>${W.groups[g]}</span>`).join("");
  $("#outBars").innerHTML = W.cycles.map(c => {
    const ms = members(c.id), n = ms.length;
    const k = GROUPS.map(g => ms.filter(i => grp(i) === g).length);
    const segs = GROUPS.map((g, x) => k[x] ? `<i class="${g}" style="width:${(100 * k[x] / n).toFixed(2)}%" title="${W.groups[g]}: ${k[x]}"></i>` : "").join("");
    return `<div class="sbar"><span class="nm">${esc(c.name)}</span><span class="trk" role="img" aria-label="${GROUPS.map((g, x) => W.groups[g] + " " + k[x]).join(", ")}">${segs}</span><span class="val">${k.join(" · ")} of ${n}</span></div>`;
  }).join("");

  /* ---------- factors in each cycle ---------- */
  let fKey = "coal";
  const fp = $("#factorPicks");
  fp.innerHTML = W.factors.map(f => `<button class="pick" type="button" data-f="${f.key}" aria-pressed="${f.key === fKey}">${esc(f.label)}</button>`).join("");
  fp.addEventListener("click", e => { const b = e.target.closest(".pick"); if (!b) return; fKey = b.dataset.f; fp.querySelectorAll(".pick").forEach(x => x.setAttribute("aria-pressed", x.dataset.f === fKey)); drawFCycle(); });
  function tint(share, g) {
    const col = g === "inc" ? "var(--g-inc)" : g === "brk" ? "var(--g-brk)" : g === "ext" ? "var(--g-ext)" : "var(--accent)";
    return share ? `background: color-mix(in srgb, ${col} ${Math.round(8 + 42 * share)}%, transparent)` : "";
  }
  function drawFCycle() {
    const f = W.factors.find(x => x.key === fKey), vals = Object.keys(f.values);
    const head = `<thead><tr><th>Cycle</th><th class="num">n</th>${vals.map(v => `<th class="num">${esc(f.values[v])}</th>`).join("")}<th class="num">Not stated</th></tr></thead>`;
    const rows = W.cycles.map(c => {
      const ms = members(c.id), n = ms.length;
      const cells = vals.map(v => { const k = ms.filter(i => i.f[fKey] === v).length; return `<td class="cell" style="${tint(k / n)}">${k || ""}${k ? `<small>${pct(k, n)}</small>` : ""}</td>`; }).join("");
      const nil = ms.filter(i => i.f[fKey] == null).length;
      return `<tr><td>${esc(c.name)}</td><td class="num">${n}</td>${cells}<td class="cell nil">${nil || ""}</td></tr>`;
    }).join("");
    $("#fcycle").innerHTML = head + `<tbody>${rows}</tbody>`;
  }
  drawFCycle();

  /* ---------- factors by outcome ---------- */
  (function () {
    const head = `<thead><tr><th>Factor</th><th class="num">n</th>${GROUPS.map(g => `<th class="num"><i class="dot ${g}"></i> ${W.groups[g]}</th>`).join("")}</tr></thead>`;
    let body = "";
    W.factors.forEach(f => {
      body += `<tr class="grp"><th colspan="5">${esc(f.label)}</th></tr>`;
      const vals = Object.keys(f.values).concat([null]);
      vals.forEach(v => {
        const ms = INC.filter(i => (i.f[f.key] == null ? null : i.f[f.key]) === v), n = ms.length;
        if (!n) return;
        const cells = GROUPS.map(g => {
          const k = ms.filter(i => grp(i) === g).length;
          return `<td class="cell" style="${tint(k / n, g)}">${k ? `<button type="button" data-fk="${f.key}" data-fv="${v == null ? "" : v}" data-g="${g}">${k}<small>${pct(k, n)}</small></button>` : ""}</td>`;
        }).join("");
        body += `<tr><td${v == null ? ' class="muted"' : ""}>${v == null ? "Not stated" : esc(f.values[v])}</td><td class="num">${n}</td>${cells}</tr>`;
      });
    });
    $("#factors").innerHTML = head + `<tbody>${body}</tbody>`;
    $("#factors").addEventListener("click", e => {
      const b = e.target.closest("button[data-fk]"); if (!b) return;
      const f = W.factors.find(x => x.key === b.dataset.fk), v = b.dataset.fv || null, g = b.dataset.g;
      const ms = INC.filter(i => (i.f[f.key] == null ? null : i.f[f.key]) === v && grp(i) === g).sort((a, c) => a.y0 - c.y0);
      const box = $("#factorList");
      box.hidden = false;
      box.innerHTML = `<h4>${esc(f.label)}: ${v == null ? "not stated" : esc(f.values[v])} · ${esc(W.groups[g])} · ${ms.length}</h4><div class="members">${ms.map(i => incBtn(i.id)).join("")}</div>`;
    });
  })();

  /* ---------- cycles together ---------- */
  (function () {
    const C = W.cycles;
    const max = Math.max(...C.map(a => members(a.id).length));
    const head = `<thead><tr><th></th>${C.map((c, k) => `<th class="num" title="${esc(c.name)}">${k + 1}</th>`).join("")}</tr></thead>`;
    const rows = C.map((a, r) => `<tr><td><span class="small">${r + 1}</span> ${esc(a.name)}</td>${C.map((b, k) => {
      if (k > r) return `<td class="cell"></td>`;
      const n = INC.filter(i => i.cyc.includes(a.id) && i.cyc.includes(b.id)).length;
      return `<td class="cell" style="${tint(n / max)}${k === r ? ";font-weight:700" : ""}">${n || ""}</td>`;
    }).join("")}</tr>`).join("");
    $("#cooc").innerHTML = head + `<tbody>${rows}</tbody>`;
  })();

  /* ---------- what followed what ---------- */
  (function () {
    const codes = Object.keys(W.outcomes);
    const m = {}; let used = new Set();
    INC.forEach(i => i.next.forEach(n => { const k = i.out + ">" + byId[n].out; m[k] = (m[k] || 0) + 1; used.add(i.out); used.add(byId[n].out); }));
    const cs = codes.filter(c => used.has(c));
    const max = Math.max(...Object.values(m));
    const head = `<thead><tr><th>Before ↓ · After →</th>${cs.map(c => `<th class="num" title="${esc(W.outcomes[c].label)}">${esc(W.outcomes[c].short)}</th>`).join("")}</tr></thead>`;
    const rows = cs.map(a => `<tr><td><i class="dot ${W.outcomes[a].group}"></i> ${esc(W.outcomes[a].label)}</td>${cs.map(b => { const n = m[a + ">" + b] || 0; return `<td class="cell" style="${tint(n / max, W.outcomes[b].group)}">${n || ""}</td>`; }).join("")}</tr>`).join("");
    $("#trans").innerHTML = head + `<tbody>${rows}</tbody>`;

    /* every maximal sequence of three or more */
    const out = [];
    const walk = (path) => {
      const last = byId[path[path.length - 1]];
      const nx = last.next.filter(n => !path.includes(n));
      if (!nx.length) { if (path.length >= 3) out.push(path); return; }
      nx.forEach(n => walk(path.concat(n)));
    };
    INC.filter(i => !(prev[i.id] || []).length && i.next.length).forEach(i => walk([i.id]));
    out.sort((a, b) => b.length - a.length || byId[a[0]].y0 - byId[b[0]].y0);
    $("#chains").innerHTML = out.map(p => `<div class="chain">${p.map(id => `<button class="lnk" type="button" data-inc="${id}"><i class="dot ${grp(byId[id])}"></i>${esc(byId[id].name)}</button>`).join('<span class="ar">→</span>')}</div>`).join("");
  })();

  /* ---------- all incidents ---------- */
  (function () {
    const sel = $("#allCycle");
    sel.innerHTML = `<option value="">Every cycle</option>` + W.cycles.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    const rows = INC.slice().sort((a, b) => a.y0 - b.y0);
    const text = i => (i.name + " " + i.place + " " + i.sum + " " + (i.drift || "")).toLowerCase();
    function draw() {
      const q = $("#allSearch").value.trim().toLowerCase(), c = sel.value;
      const list = rows.filter(i => (!q || text(i).includes(q)) && (!c || i.cyc.includes(c)));
      $("#allCount").textContent = list.length + " of " + INC.length;
      $("#all").innerHTML = `<thead><tr><th>Incident</th><th>Years</th><th>Cycles</th><th>Outcome</th><th>Pages</th></tr></thead><tbody>` +
        list.map(i => `<tr><td>${incBtn(i.id)}<div class="small">${esc(i.place)}</div></td><td class="small" style="white-space:nowrap">${span(i)}</td><td class="small">${i.cyc.map(x => esc(CYC[x].name)).join(", ") || "—"}</td><td>${outTag(i)}</td><td class="small">${chap(i)}, ${esc(i.pp)}</td></tr>`).join("") + `</tbody>`;
    }
    $("#allSearch").addEventListener("input", draw);
    sel.addEventListener("change", draw);
    draw();
  })();

  /* ---------- draw, and redraw when the width changes ---------- */
  drawNet();
  let lastW = svg.parentNode.clientWidth, rt = 0;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { const w = svg.parentNode.clientWidth; if (Math.abs(w - lastW) > 30) { lastW = w; drawNet(); } }, 150);
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && (state.sel || state.cycle || state.jx)) { state.sel = state.cycle = state.jx = null; syncPicks(); paint(); renderDetail(); } });
})();
