/* The interactive map at the top of ecosystem.html.
   Bubbles are actors, grouped by category around the frontier developers. Arrows are documented ties, drawn from -> to.
   Bubble area counts an actor's documented ties; arrow width counts the ties between one pair. Neither encodes money or influence.
   Needs ecosystem-data.js (window.ECOSYSTEM) and the helpers the page script exports as window.ECO_UI. */
(function () {
  "use strict";
  const D = window.ECOSYSTEM, U = window.ECO_UI, svg = document.getElementById("webStage");
  if (!D || !U || !svg) return;
  const NS = "http://www.w3.org/2000/svg", W = 1080, H = 820;
  const $ = id => document.getElementById(id);
  const esc = U.esc, tidy = U.tidy;
  const el = (name, attrs, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  // One cluster per category. Colour marks the group; arrows take the colour of the group they start from.
  const CLUSTERS = [
    { cat: 3, label: "Frontier developers", color: "#F3F6F8", x: 540, y: 415 },
    { cat: 2, label: "Cloud and energy", color: "#7CCBFF", x: 545, y: 122 },
    { cat: 1, label: "Chip supply chain", color: "#4F9DFF", x: 205, y: 150 },
    { cat: 4, label: "Capital", color: "#F7A93B", x: 880, y: 140 },
    { cat: 5, label: "Safety funders", color: "#2EE6C8", x: 925, y: 395 },
    { cat: 6, label: "Research and think tanks", color: "#C6E86B", x: 790, y: 690 },
    { cat: 10, label: "Talent pipeline", color: "#E6F2A8", x: 528, y: 735 },
    { cat: 9, label: "Critical voices and the public", color: "#FF8A70", x: 300, y: 705 },
    { cat: 11, label: "Standards, insurers and users", color: "#F3C9A2", x: 125, y: 590 },
    { cat: 7, label: "Public authority", color: "#B79CFF", x: 150, y: 372 },
    { cat: 8, label: "Advocacy and political money", color: "#FF6FB1", x: 372, y: 292 }
  ];
  const C = new Map(CLUSTERS.map(c => [c.cat, c]));

  const SHORT = {
    openai: "OpenAI", anthropic: "Anthropic", ltbt: "Anthropic LTBT", openai_ssc: "OpenAI safety committee", deepmind: "Google DeepMind", mistral: "Mistral",
    qwen: "Qwen", moonshot: "Moonshot", google: "Google", amazon: "Amazon", stargate: "Stargate", energy: "Grids and host communities",
    samsung: "Samsung", cg: "Coefficient Giving", sff: "SFF", fmf: "Frontier Model Forum", aisf: "AI Safety Fund", longview: "Longview",
    schmidt: "Schmidt Sciences", foundation: "OpenAI Foundation", ltff: "LTFF", aistof: "AISTOF", taif: "TAI Fund", iaps: "IAPS", govai: "GovAI",
    cuellar: "M.-F. Cuéllar", miri: "MIRI", carnegie: "Carnegie", chai: "Berkeley CHAI", uiuc: "UIUC", redwood: "Redwood", apollo: "Apollo",
    epoch: "Epoch AI", cset: "CSET", rand: "RAND", brookings: "Brookings", cais: "CAIS", aisi: "UK AISI", uspolicy: "US federal policy",
    caisi: "US CAISI", eu: "EU AI Office", ftc: "US FTC", bis: "US BIS", california: "California", ny: "New York", china: "China TC260",
    oecd: "OECD", un: "UN panel", iasr: "Intl AI Safety Report", chamber: "US Chamber", pfa: "Public First Action", publicfirst: "Public First PAC",
    leading: "Leading the Future", cais_pac: "CAIS Action PAC", public: "The public", ainow: "AI Now", labor: "AFL-CIO", ada: "Ada Lovelace Inst.",
    journalism: "Journalism", university: "University groups", bluedot: "BlueDot", enterprise: "Enterprise users", iso: "ISO/IEC", cen: "CEN-CENELEC",
    insurance: "Munich Re aiSure", auditors: "Auditors", a16z: "a16z", softbank: "SoftBank", qia: "QIA", capital: "Other investors", macro: "Macroscopic"
  };

  /* ---------- model ---------- */
  // a long name breaks at the space nearest its middle, so names stay narrow enough to sit under a bubble
  function wrap(s) {
    if (s.length <= 13 || s.indexOf(" ") < 0) return [s];
    let cut = -1;
    for (let i = 0; i < s.length; i++) if (s[i] === " " && (cut < 0 || Math.abs(i - s.length / 2) < Math.abs(cut - s.length / 2))) cut = i;
    return [s.slice(0, cut), s.slice(cut + 1)];
  }
  const deg = new Map();
  D.edges.forEach(e => { deg.set(e.from, (deg.get(e.from) || 0) + 1); deg.set(e.to, (deg.get(e.to) || 0) + 1); });
  const nodes = D.nodes.map(n => {
    const d = deg.get(n.id) || 0;
    const short = SHORT[n.id] || n.name;
    return { id: n.id, name: n.name, short, lines: wrap(short), cat: n.cat, deg: d, r: Math.max(5, 8.2 * Math.sqrt(d)), always: d >= 2, data: n };
  });
  const byId = new Map(nodes.map(n => [n.id, n]));
  const pairs = new Map();
  D.edges.forEach(e => {
    const k = e.from + ">" + e.to;
    if (!pairs.has(k)) pairs.set(k, { s: byId.get(e.from), t: byId.get(e.to), ties: [] });
    pairs.get(k).ties.push(e);
  });
  const links = Array.from(pairs.values());

  /* ---------- layout: pack each cluster on a spiral, biggest bubble in the middle ---------- */
  CLUSTERS.forEach(c => {
    const list = nodes.filter(n => n.cat === c.cat).sort((a, b) => b.r - a.r || a.name.localeCompare(b.name));
    const placed = [];
    // labelled bubbles reserve room for the name underneath
    const reach = n => n.always ? Math.max(n.r, Math.min(46, Math.max.apply(null, n.lines.map(l => l.length)) * 3.4)) : n.r;
    list.forEach((n, i) => {
      if (!i) { n.x = c.x; n.y = c.y; placed.push(n); return; }
      for (let t = 1; t < 6000; t++) {
        const a = t * 0.31, d = 3 + t * 0.4;
        const x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d * 0.86;
        if (placed.every(p => Math.hypot(p.x - x, (p.y - y) * 0.74) >= reach(p) + reach(n) + 6)) { n.x = x; n.y = y; placed.push(n); return; }
      }
    });
    // slide the whole cluster back inside the plate if a bubble or its name would cross the edge
    const lo = Math.min.apply(null, list.map(n => n.x - reach(n))), hi = Math.max.apply(null, list.map(n => n.x + reach(n)));
    const shift = lo < 10 ? 10 - lo : hi > W - 10 ? W - 10 - hi : 0;
    list.forEach(n => { n.x += shift; });
    c.x += shift;
    c.nodes = list;
    c.top = Math.min.apply(null, list.map(n => n.y - n.r));
  });

  /* ---------- drawing ---------- */
  const defs = el("defs", {}, svg);
  CLUSTERS.forEach(c => {
    const m = el("marker", { id: "wm-" + c.cat, markerUnits: "userSpaceOnUse", markerWidth: 11, markerHeight: 11, refX: 8, refY: 5.5, orient: "auto" }, defs);
    el("path", { d: "M0,1 L10,5.5 L0,10 Z", fill: c.color }, m);
  });
  // names sit in their own top layer so a neighbouring bubble never covers them
  const gLinks = el("g", {}, svg), gFlow = el("g", {}, svg), gTitles = el("g", {}, svg), gNodes = el("g", {}, svg), gLabels = el("g", {}, svg);

  function linkPath(l) {
    const a = l.s, b = l.t, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const bend = Math.min(64, len * 0.17);
    const mx = (a.x + b.x) / 2 - dy / len * bend, my = (a.y + b.y) / 2 + dx / len * bend;
    const sa = Math.atan2(my - a.y, mx - a.x), ea = Math.atan2(my - b.y, mx - b.x);
    const f = v => v.toFixed(1);
    return `M${f(a.x + Math.cos(sa) * (a.r + 2))},${f(a.y + Math.sin(sa) * (a.r + 2))}Q${f(mx)},${f(my)} ${f(b.x + Math.cos(ea) * (b.r + 5))},${f(b.y + Math.sin(ea) * (b.r + 5))}`;
  }
  links.forEach(l => {
    const color = C.get(l.s.cat).color;
    const w = 1.5 + 1.3 * (l.ties.length - 1);
    l.el = el("path", { class: "link", stroke: color, "stroke-width": w.toFixed(1), "marker-end": `url(#wm-${l.s.cat})` }, gLinks);
    // the moving dots are the arrow's own colour, a little brighter and wider than the line they ride on
    l.flow = el("path", { class: "flow", stroke: color, "stroke-width": (w + 0.8).toFixed(1) }, gFlow);
    l.draw = () => { const d = linkPath(l); l.el.setAttribute("d", d); l.flow.setAttribute("d", d); };
    l.draw();
  });

  CLUSTERS.forEach(c => {
    c.title = el("text", { class: "ctitle", x: c.x, y: Math.max(16, c.top - 12), "text-anchor": "middle", fill: c.color, "data-cat": c.cat }, gTitles);
    c.title.textContent = `${c.label} · ${c.nodes.length}`;
    // keep a long group name inside the plate
    const half = c.title.getComputedTextLength() / 2 + 10;
    c.title.setAttribute("x", Math.max(half, Math.min(W - half, c.x)).toFixed(1));
  });

  nodes.forEach(n => {
    const c = C.get(n.cat);
    const g = n.el = el("g", { class: "node", "data-id": n.id }, gNodes);
    el("circle", { r: n.r.toFixed(1), fill: c.color }, g);
    const inside = n.r >= 20 && n.short.length * 6.2 <= 2 * n.r - 4;
    n.lab = el("g", { class: "nlabel" + (n.always || inside ? " always" : "") }, gLabels);
    if (inside) {
      el("text", { class: "in", y: -1, "text-anchor": "middle" }, n.lab).textContent = n.short;
      el("text", { class: "in num", y: 13, "text-anchor": "middle" }, n.lab).textContent = n.deg;
    } else {
      n.lines.forEach((line, i) => { el("text", { class: "lab", y: (n.r + 14 + i * 14).toFixed(1), "text-anchor": "middle" }, n.lab).textContent = line; });
    }
    n.place = () => { const t = `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`; g.setAttribute("transform", t); n.lab.setAttribute("transform", t); };
    n.place();
    el("title", {}, g).textContent = `${n.name}: ${n.deg} documented ${n.deg === 1 ? "tie" : "ties"}`;
  });

  /* ---------- state ---------- */
  const state = { sel: null, hover: null, fam: "all" };
  const famLabel = id => { const f = U.FAMILIES.find(x => x.id === id); return f ? f.label : ""; };
  const inFam = t => state.fam === "all" || U.famOf[t.type] === state.fam;
  const touches = (l, f) => f.type === "node" ? (l.s.id === f.id || l.t.id === f.id) : (l.s.cat === f.id || l.t.cat === f.id);

  function refresh() {
    const focus = state.hover || state.sel, onNodes = new Set();
    links.forEach(l => {
      const vis = l.ties.some(inFam), on = vis && (!focus || touches(l, focus));
      [l.el, l.flow].forEach(p => { p.classList.toggle("off", !vis); p.classList.toggle("on", on); });
      if (on) { onNodes.add(l.s.id); onNodes.add(l.t.id); }
    });
    if (focus) (focus.type === "node" ? [byId.get(focus.id)] : C.get(focus.id).nodes).forEach(n => onNodes.add(n.id));
    const dim = !!focus || state.fam !== "all";
    svg.classList.toggle("has-focus", dim);
    nodes.forEach(n => {
      n.el.classList.toggle("on", dim && onNodes.has(n.id));
      n.lab.classList.toggle("on", dim && onNodes.has(n.id));
      n.el.classList.toggle("sel", !!state.sel && state.sel.type === "node" && state.sel.id === n.id);
    });
    CLUSTERS.forEach(c => c.title.classList.toggle("sel", !!state.sel && state.sel.type === "group" && state.sel.id === c.cat));
  }

  /* ---------- the panel under the map ---------- */
  const panel = $("webPanel"), blurb = $("webBlurb"), lens = $("webLens"), pick = $("webPick");
  const count = fn => D.edges.filter(fn).length;
  const catOf = id => byId.get(id).cat;

  function tieItem(t, out) {
    const other = byId.get(out ? t.to : t.from), bits = [U.typeLabel(t.type)];
    if (t.amount != null) bits.push(U.fmtAmount(t.amount, t.currency));
    if (t.date) bits.push(U.fmtDate(t.date));
    return `<li><button type="button" class="web-jump" data-node="${esc(other.id)}"><i style="background:${C.get(other.cat).color}"></i>${tidy(other.name)}</button><span>${esc(bits.join(", "))}</span></li>`;
  }
  function tieBlock(title, list, out) {
    return `<div><h4>${title} (${list.length})</h4>${list.length ? `<ul>${list.map(t => tieItem(t, out)).join("")}</ul>` : `<p class="wp-none">None recorded${state.fam !== "all" ? " for this kind of tie" : ""}.</p>`}</div>`;
  }
  function renderPanel() {
    const s = state.sel, filt = state.fam !== "all" ? ` Showing only: ${esc(famLabel(state.fam).toLowerCase())}.` : "";
    if (s && s.type === "node") {
      const n = byId.get(s.id), c = C.get(n.cat);
      const out = D.edges.filter(t => t.from === n.id && inFam(t)), inc = D.edges.filter(t => t.to === n.id && inFam(t));
      panel.innerHTML = `<div class="wp-main">
          <span class="web-eyebrow" style="color:${c.color}">${tidy(c.label)} · ${tidy(n.data.subtype)} · ${tidy(n.data.country)}</span>
          <h3>${tidy(n.name)}</h3>
          <p><span class="wp-lbl">Stake, as read by this map</span>${tidy(n.data.stake)}</p>
          <p class="wp-small">${n.deg} documented ${n.deg === 1 ? "tie" : "ties"} in total.${filt} <a href="#a-${esc(n.id)}">Open the full profile</a></p>
        </div>
        <div class="wp-ties">${tieBlock("Arrows going out to", out, true)}${tieBlock("Arrows coming in from", inc, false)}</div>`;
    } else if (s) {
      const c = C.get(s.id), ids = new Set(c.nodes.map(n => n.id));
      const out = count(t => ids.has(t.from) && !ids.has(t.to) && inFam(t)), inc = count(t => !ids.has(t.from) && ids.has(t.to) && inFam(t)), within = count(t => ids.has(t.from) && ids.has(t.to) && inFam(t));
      const about = document.querySelector(`#cat-${c.cat} .oneline`);
      const top = c.nodes.filter(n => n.deg).slice(0, 8);
      panel.innerHTML = `<div class="wp-main">
          <span class="web-eyebrow" style="color:${c.color}">Group · ${c.nodes.length} actors</span>
          <h3>${tidy(c.label)}</h3>
          <p>${about ? tidy(about.textContent) : ""}</p>
          <p class="wp-small">${out} ties go out to other groups, ${inc} come in, and ${within} stay inside the group.${filt} <a href="#cat-${c.cat}">Read about this category</a></p>
        </div>
        <div class="wp-ties"><div><h4>Most documented ties in this group</h4><ul>${top.map(n => `<li><button type="button" class="web-jump" data-node="${esc(n.id)}"><i style="background:${c.color}"></i>${tidy(n.name)}</button><span>${n.deg} ${n.deg === 1 ? "tie" : "ties"}</span></li>`).join("")}</ul></div></div>`;
    } else {
      const labs = t => catOf(t.from) === 3 || catOf(t.to) === 3;
      const two = t => t.from === "openai" || t.to === "openai" || t.from === "anthropic" || t.to === "anthropic";
      const grants = t => catOf(t.from) === 5 && catOf(t.to) === 6;
      const pub = t => catOf(t.from) === 7 && catOf(t.to) === 3;
      panel.innerHTML = `<div class="wp-notes">
          <div><h3>The labs sit in the middle</h3><p>${count(labs)} of the ${D.edges.length} ties touch a frontier developer, and ${count(two)} touch OpenAI or Anthropic. Those two also disclose the most, so part of this is documentation.</p><button type="button" class="web-act" data-group="3">Show the labs' ties</button></div>
          <div><h3>Safety research has few paymasters</h3><p>${count(grants)} ties run from a safety funder to a research organisation. In one published list, a single funder accounts for about 72% of the 2025 estimates.</p><button type="button" class="web-act" data-lens="grants">Show grants and philanthropy</button></div>
          <div><h3>Public bodies test and set scope</h3><p>${count(pub)} ties run from a public authority to a lab. The testing agreements among them are voluntary and are not regulatory approval.</p><button type="button" class="web-act" data-lens="public">Show public authority</button></div>
        </div>`;
    }
    const fam = U.FAMILIES.find(f => f.id === state.fam);
    blurb.textContent = fam ? `${fam.label}. ${fam.blurb}` : "Pick a bubble or a group name to follow its ties. Pick a kind of tie above the map to see only those arrows. Drag a bubble to untangle it.";
    $("webClear").hidden = !state.sel && state.fam === "all";
  }

  /* ---------- controls ---------- */
  function select(sel, fromPick) {
    state.sel = sel && state.sel && sel.type === state.sel.type && sel.id === state.sel.id && !fromPick ? null : sel;
    state.hover = null;
    pick.value = state.sel ? (state.sel.type === "node" ? state.sel.id : "g:" + state.sel.id) : "";
    refresh();
    renderPanel();
    // on a narrow screen the map scrolls sideways; bring the chosen bubble into view
    const sc = svg.parentNode;
    if (state.sel && sc.scrollWidth > sc.clientWidth) {
      const k = svg.getBoundingClientRect().width / W;
      sc.scrollTo({ left: (state.sel.type === "node" ? byId.get(state.sel.id).x : C.get(state.sel.id).x) * k - sc.clientWidth / 2 });
    }
  }
  function setFam(v) {
    state.fam = v;
    Array.from(lens.querySelectorAll("button")).forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v ? "true" : "false"));
    refresh();
    renderPanel();
  }
  const LENS = { control: "Ownership and control", invest: "Investment", supply: "Supply", grants: "Grants", public: "Public authority", politics: "Advocacy", field: "Standards and training" };
  lens.innerHTML = [{ id: "all", label: "All ties" }].concat(U.FAMILIES).map(f =>
    `<button type="button" data-v="${f.id}" aria-pressed="${f.id === "all"}" title="${esc(f.label)}">${esc(LENS[f.id] || f.label)}<span class="c">${f.id === "all" ? D.edges.length : count(t => U.famOf[t.type] === f.id)}</span></button>`).join("");
  lens.addEventListener("click", e => { const b = e.target.closest("button"); if (b) setFam(b.dataset.v); });

  pick.innerHTML = `<option value="">Choose an actor or a group</option><optgroup label="Whole groups">${CLUSTERS.map(c => `<option value="g:${c.cat}">${esc(c.label)}</option>`).join("")}</optgroup>` +
    CLUSTERS.map(c => `<optgroup label="${esc(c.label)}">${c.nodes.slice().sort((a, b) => a.name.localeCompare(b.name)).map(n => `<option value="${esc(n.id)}">${tidy(n.name)}</option>`).join("")}</optgroup>`).join("");
  pick.addEventListener("change", () => {
    const v = pick.value;
    select(!v ? null : v.indexOf("g:") === 0 ? { type: "group", id: +v.slice(2) } : { type: "node", id: v }, true);
  });
  $("webClear").addEventListener("click", () => { state.sel = null; pick.value = ""; setFam("all"); });
  panel.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.node) select({ type: "node", id: b.dataset.node }, true);
    else if (b.dataset.group) select({ type: "group", id: +b.dataset.group }, true);
    else if (b.dataset.lens) setFam(b.dataset.lens);
  });
  const motion = $("webMotion");
  motion.addEventListener("click", () => {
    const paused = svg.classList.toggle("paused");
    motion.setAttribute("aria-pressed", paused ? "true" : "false");
    motion.textContent = paused ? "Play motion" : "Pause motion";
  });
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) motion.hidden = true;

  /* ---------- pointer: hover to preview, click to keep, drag a bubble (mouse) to untangle ---------- */
  const nodeAt = e => { const g = e.target.closest && e.target.closest(".node"); return g ? byId.get(g.getAttribute("data-id")) : null; };
  let drag = null;
  function toStage(e) {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  svg.addEventListener("pointerover", e => {
    const n = nodeAt(e);
    if (!n || drag || e.pointerType !== "mouse") return;
    state.hover = { type: "node", id: n.id };
    refresh();
  });
  svg.addEventListener("pointerout", e => {
    if (!nodeAt(e) || drag || !state.hover) return;
    state.hover = null;
    refresh();
  });
  svg.addEventListener("pointerdown", e => {
    const n = nodeAt(e);
    if (!n || e.pointerType !== "mouse" || e.button !== 0) return;
    const p = toStage(e);
    drag = { n, dx: n.x - p.x, dy: n.y - p.y, x0: e.clientX, y0: e.clientY, moved: false };
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  svg.addEventListener("pointermove", e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 4) return;
    drag.moved = true;
    const p = toStage(e), n = drag.n;
    n.x = Math.max(n.r, Math.min(W - n.r, p.x + drag.dx));
    n.y = Math.max(n.r, Math.min(H - n.r, p.y + drag.dy));
    n.place();
    links.forEach(l => { if (l.s === n || l.t === n) l.draw(); });
  });
  let justDragged = false;
  svg.addEventListener("pointerup", e => {
    if (!drag) return;
    justDragged = drag.moved;
    const n = drag.n;
    drag = null;
    try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
    // with the pointer captured the click lands on the svg, so a press without movement selects here
    if (!justDragged) { select({ type: "node", id: n.id }); justDragged = true; }
    setTimeout(() => { justDragged = false; }, 60);
  });
  svg.addEventListener("click", e => {
    if (justDragged) { justDragged = false; return; }
    const n = nodeAt(e), t = e.target.closest && e.target.closest(".ctitle");
    if (n) select({ type: "node", id: n.id });
    else if (t) select({ type: "group", id: +t.getAttribute("data-cat") });
    else if (state.sel) select(null);
  });

  refresh();
  renderPanel();
})();
