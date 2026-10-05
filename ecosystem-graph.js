/* The interactive map at the top of ecosystem.html.
   Bubbles are actors, grouped by category around the frontier developers. Arrows are documented ties, drawn from -> to.
   Bubble area counts an organisation's documented ties. It does not encode money or influence.
   Arrows that carry money (investment, grants, donations, credits) show a small money sign moving from giver to receiver, and their
   width is the largest single amount stated on the tie, one step wider for every tenfold increase. Amounts are never summed.
   A money tie with no disclosed amount is drawn thin with a fainter sign: unknown is not shown as small. Every other arrow is a plain line.
   People are not bubbles. A named person with a role or interest in two organisations is drawn as a dotted link between them,
   and every person can be found in the search box under the map, alongside the actors and groups.
   Needs ecosystem-data.js (window.ECOSYSTEM) and the helpers the page script exports as window.ECO_UI. */
(function () {
  "use strict";
  const D = window.ECOSYSTEM, U = window.ECO_UI, svg = document.getElementById("webStage");
  if (!D || !U || !svg) return;
  const NS = "http://www.w3.org/2000/svg", W = 1080, H = 870;
  const $ = id => document.getElementById(id);
  const esc = U.esc, tidy = U.tidy;
  const el = (name, attrs, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  // The control and incentives evidence adds ties between actors already on the map (drawn dashed, kept out of the base counts)
  // and people with roles in more than one place.
  const X = (window.CONTROL && window.CONTROL.graph) || { people: [], edges: [] };
  const EDGES = D.edges.concat(X.edges);
  // A person is a property of the links between organisations, not a node: the one individual in the base data and the people in the evidence.
  const PEOPLE = D.nodes.filter(n => n.orgType === "Individual").map(n => ({ id: n.id, name: n.name })).concat(X.people)
    .map(p => ({ id: p.id, name: p.name, roles: EDGES.filter(e => e.from === p.id) }));
  const personById = new Map(PEOPLE.map(p => [p.id, p]));
  const ORG_EDGES = EDGES.filter(e => !personById.has(e.from) && !personById.has(e.to));
  const EXT_FAM = { access_in_kind: "access", commissioned_work: "access", access_mou: "access", compute_credits: "access", grant_paid: "grants", grant_recommended: "grants",
    political_contribution: "politics", role_board: "people", role_adviser: "people", role_former: "people", role_executive: "people", role_staff: "people",
    role_regrantor: "people", role_funder: "people", disclosed_investment: "people" };
  const EXT_LABEL = { access_in_kind: "Model access in kind", commissioned_work: "Commissioned work", access_mou: "Access under a voluntary MoU", compute_credits: "Compute credits",
    grant_paid: "Grant or gift, paid", grant_recommended: "Grant, recommended", political_contribution: "Political contribution", role_board: "Board or committee seat",
    role_adviser: "Adviser", role_former: "Former role", role_executive: "Executive", role_staff: "Staff role", role_regrantor: "Regrantor", role_funder: "Funder",
    disclosed_investment: "Disclosed investment" };
  const FAMS = U.FAMILIES.concat([
    { id: "access", label: "Access and contracts", blurb: "What evaluators and training programmes receive from the labs: model access, compute credits and commissioned work. The executed agreements, with any limits on publication, were not obtained." },
    { id: "people", label: "People and interests", blurb: "Each dotted link joins two organisations where the same named person holds a documented role or a disclosed investment. That establishes an interest, not a motive, and it is not control." }
  ]);
  const famOf = t => EXT_FAM[t.type] || U.famOf[t.type];
  // Ties where money, or credit with a stated money value, moves in the direction of the arrow. Supply and lobbying are left out:
  // there the payment runs the other way, or to third parties.
  const MONEY = new Set(["equity_investment", "grant_recommendation", "philanthropic_support", "philanthropic_or_public_support", "research_grant",
    "matching_offer", "restricted_policy_donation", "grant_paid", "grant_recommended", "political_contribution", "compute_credits"]);
  // Amounts on the map run from tens of thousands to tens of billions, so width goes up one step per power of ten.
  const STEPS = ["under 100k", "100k to 1m", "1m to 10m", "10m to 100m", "100m to 1bn", "1bn to 10bn", "10bn or more"];
  const stepOf = v => Math.max(0, Math.min(STEPS.length - 1, Math.floor(Math.log10(v)) - 4));
  const widthOf = step => 1.8 + 1.05 * step;
  const W_PLAIN = 1.1, W_UNKNOWN = 1.4, W_WIDE = 5.5;   // from W_WIDE up, the arrowhead grows with the line
  const STILL = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const typeLabel = t => EXT_LABEL[t.type] || U.typeLabel(t.type);

  // One cluster per category. Colour marks the group; arrows take the colour of the group they start from.
  const CLUSTERS = [
    { cat: 3, label: "Frontier developers", color: "#F3F6F8", x: 540, y: 410 },
    { cat: 2, label: "Cloud and energy", color: "#7CCBFF", x: 545, y: 122 },
    { cat: 1, label: "Chip supply chain", color: "#4F9DFF", x: 205, y: 150 },
    { cat: 4, label: "Capital", color: "#F7A93B", x: 880, y: 140 },
    { cat: 5, label: "Safety funders", color: "#2EE6C8", x: 925, y: 395 },
    { cat: 6, label: "Research and think tanks", color: "#C6E86B", x: 800, y: 705 },
    { cat: 10, label: "Talent pipeline", color: "#E6F2A8", x: 530, y: 790 },
    { cat: 9, label: "Critical voices and the public", color: "#FF8A70", x: 290, y: 725 },
    { cat: 11, label: "Standards, insurers and users", color: "#F3C9A2", x: 125, y: 590 },
    { cat: 7, label: "Public authority", color: "#B79CFF", x: 150, y: 372 },
    { cat: 8, label: "Advocacy and political money", color: "#FF6FB1", x: 400, y: 288 }
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
  ORG_EDGES.forEach(e => { deg.set(e.from, (deg.get(e.from) || 0) + 1); deg.set(e.to, (deg.get(e.to) || 0) + 1); });
  const nodes = D.nodes.filter(n => !personById.has(n.id)).map(n => {
    const d = deg.get(n.id) || 0;
    const short = SHORT[n.id] || n.name;
    return { id: n.id, name: n.name, short, lines: wrap(short), cat: n.cat, deg: d, r: Math.max(5, 8.2 * Math.sqrt(d)), always: d >= 2, data: n };
  });
  const byId = new Map(nodes.map(n => [n.id, n]));
  const pairs = new Map();
  ORG_EDGES.forEach(e => {
    const k = e.from + ">" + e.to;
    if (!pairs.has(k)) pairs.set(k, { s: byId.get(e.from), t: byId.get(e.to), ties: [] });
    pairs.get(k).ties.push(e);
  });
  // one undirected link per pair of organisations that share a person; the link carries the names
  const shared = new Map();
  PEOPLE.forEach(p => {
    const orgs = Array.from(new Set(p.roles.map(r => r.to))).filter(id => byId.has(id));
    for (let i = 0; i < orgs.length; i++) for (let j = i + 1; j < orgs.length; j++) {
      const k = [orgs[i], orgs[j]].sort().join("~");
      if (!shared.has(k)) shared.set(k, { s: byId.get(orgs[i]), t: byId.get(orgs[j]), ties: [], inter: true, people: [] });
      shared.get(k).people.push(p);
    }
  });
  const links = Array.from(pairs.values()).concat(Array.from(shared.values()));
  const nInter = shared.size;

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
    // wide money arrows get a head that grows with the line
    const wide = el("marker", { id: "wmw-" + c.cat, markerUnits: "strokeWidth", viewBox: "0 0 10 10", markerWidth: 2, markerHeight: 2, refX: 7.5, refY: 5, orient: "auto" }, defs);
    el("path", { d: "M0,0.4 L10,5 L0,9.6 Z", fill: c.color }, wide);
  });
  // names sit in their own top layer so a neighbouring bubble never covers them
  const gLinks = el("g", {}, svg), gFlow = el("g", {}, svg), gHit = el("g", {}, svg), gTitles = el("g", {}, svg), gNodes = el("g", {}, svg), gLabels = el("g", {}, svg);
  // gHit holds a wide invisible copy of every arrow, so a thin line is easy to point at
  // (person-link names are added to gLabels before the bubble names, so a bubble name wins where they meet)

  function linkPath(l) {
    const a = l.s, b = l.t, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const bend = Math.min(64, len * 0.17);
    const mx = (a.x + b.x) / 2 - dy / len * bend, my = (a.y + b.y) / 2 + dx / len * bend;
    const sa = Math.atan2(my - a.y, mx - a.x), ea = Math.atan2(my - b.y, mx - b.x);
    const f = v => v.toFixed(1);
    l.mid = [(a.x + 2 * mx + b.x) / 4, (a.y + 2 * my + b.y) / 4];
    const end = l.inter ? 2 : 5 + (l.w >= W_WIDE ? l.w * 0.5 : 0);   // arrows stop short to leave room for the head; person links have none
    return `M${f(a.x + Math.cos(sa) * (a.r + 2))},${f(a.y + Math.sin(sa) * (a.r + 2))}Q${f(mx)},${f(my)} ${f(b.x + Math.cos(ea) * (b.r + end))},${f(b.y + Math.sin(ea) * (b.r + end))}`;
  }
  let linkN = 0;
  links.forEach((l, i) => {
    l.hit = el("path", { class: "hit", "data-link": i }, gHit);
    if (l.inter) {
      l.el = el("path", { class: "link inter", "stroke-width": (1.6 + 0.9 * (l.people.length - 1)).toFixed(1) }, gLinks);
      l.label = el("text", { class: "plab", "text-anchor": "middle" }, gLabels);
      // surnames on the map keep the links readable; full names are in the row under the map and in the panel
      l.label.textContent = l.people.map(p => p.name.split(" ").pop()).join(", ");
      l.draw = () => { const d = linkPath(l); l.el.setAttribute("d", d); l.hit.setAttribute("d", d); l.label.setAttribute("x", l.mid[0].toFixed(1)); l.label.setAttribute("y", (l.mid[1] - 4).toFixed(1)); };
      l.draw();
      return;
    }
    l.color = C.get(l.s.cat).color;
    l.w = W_PLAIN;
    l.el = el("path", { id: "wl-" + (++linkN), class: "link" + (l.ties.every(t => t.ext) ? " ext" : ""), stroke: l.color, "stroke-width": l.w, "marker-end": `url(#wm-${l.s.cat})` }, gLinks);
    // the money signs that ride a money arrow; styleLink fills this in once the filter state exists
    l.flow = el("g", { class: "flow" }, gFlow);
    l.coins = [];
    l.draw = () => { const d = linkPath(l); l.el.setAttribute("d", d); l.hit.setAttribute("d", d); if (STILL) parkCoins(l); };
    l.draw();
  });

  /* ---------- money on the arrows ---------- */
  // The money ties on one arrow under the current filter, and the largest single amount stated on any of them.
  function moneyOn(l) {
    const ties = l.ties.filter(t => MONEY.has(t.type) && inFam(t));
    const top = ties.reduce((a, t) => t.amount != null && (!a || t.amount > a.amount) ? t : a, null);
    return { n: ties.length, top };
  }
  // without motion the signs sit evenly along the arrow
  function parkCoins(l) {
    if (!l.coins.length) return;
    const len = l.el.getTotalLength();
    l.coins.forEach((g, i) => { const p = l.el.getPointAtLength(len * (i + 0.5) / l.coins.length); g.setAttribute("transform", `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`); });
  }
  function styleLink(l) {
    const m = moneyOn(l), step = m.top ? stepOf(m.top.amount) : -1;
    const key = !m.n ? "plain" : m.top ? step + m.top.currency : "unknown";
    if (key === l.key) return;
    l.key = key;
    l.w = !m.n ? W_PLAIN : m.top ? widthOf(step) : W_UNKNOWN;
    l.el.setAttribute("stroke-width", l.w.toFixed(1));
    l.el.setAttribute("marker-end", `url(#${l.w >= W_WIDE ? "wmw" : "wm"}-${l.s.cat})`);
    l.el.classList.toggle("money", !!m.n);
    // ties from the control evidence stay dashed; the dashes grow with the line so a wide arrow still reads as one arrow
    if (l.el.classList.contains("ext")) l.el.style.strokeDasharray = l.w > 2.5 ? `${(l.w * 2.4).toFixed(1)} ${(l.w * 0.8).toFixed(1)}` : "";
    l.draw();
    l.flow.textContent = "";
    l.coins = [];
    if (!m.n) return;
    // one to three signs per arrow, all moving at one slow speed, so only width and size say how much
    const len = l.el.getTotalLength(), n = m.top ? Math.max(1, Math.min(3, Math.round(len / 130))) : 1, dur = Math.max(4, len / 15);
    const size = m.top ? 9.5 + 0.55 * l.w : 8.5;
    for (let i = 0; i < n; i++) {
      const g = el("g", { class: "coin" + (m.top ? "" : " faint") }, l.flow);
      el("text", { "text-anchor": "middle", dy: ".36em", "font-size": size.toFixed(1), fill: l.color }, g).textContent = m.top && m.top.currency === "EUR" ? "€" : "$";
      if (!STILL) {
        const am = el("animateMotion", { dur: dur.toFixed(2) + "s", begin: (-dur * (i + 0.37) / n).toFixed(2) + "s", repeatCount: "indefinite" }, g);
        const mp = el("mpath", { href: "#" + l.el.id }, am);
        mp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + l.el.id);
      }
      l.coins.push(g);
    }
    if (STILL) parkCoins(l);
  }

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
  const famLabel = id => { const f = FAMS.find(x => x.id === id); return f ? f.label : ""; };
  const inFam = t => state.fam === "all" || famOf(t) === state.fam;
  const touches = (l, f) => f.type === "person" ? (!!l.inter && l.people.some(p => p.id === f.id)) : f.type === "node" ? (l.s.id === f.id || l.t.id === f.id) : (l.s.cat === f.id || l.t.cat === f.id);
  const linkVisible = l => l.inter ? (state.fam === "all" || state.fam === "people") : l.ties.some(inFam);

  function refresh() {
    const focus = state.hover || state.sel, onNodes = new Set();
    links.forEach(l => {
      if (!l.inter) styleLink(l);
      const vis = linkVisible(l), on = vis && (!focus || touches(l, focus));
      [l.el, l.flow, l.label, l.hit].forEach(p => { if (p) { p.classList.toggle("off", !vis); p.classList.toggle("on", on); } });
      if (on) { onNodes.add(l.s.id); onNodes.add(l.t.id); }
    });
    if (focus && focus.type !== "person") (focus.type === "node" ? [byId.get(focus.id)] : C.get(focus.id).nodes).forEach(n => onNodes.add(n.id));
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
  const panel = $("webPanel"), blurb = $("webBlurb"), lens = $("webLens"), search = $("webSearch"), options = $("webOptions");
  const count = fn => ORG_EDGES.filter(fn).length, baseCount = fn => D.edges.filter(fn).length;
  const catOf = id => { const n = byId.get(id); return n ? n.cat : 0; };   // a person has no group

  function tieItem(t, out) {
    const other = byId.get(out ? t.to : t.from), bits = [typeLabel(t)];
    if (t.amount != null) bits.push(U.fmtAmount(t.amount, t.currency));
    if (t.date) bits.push(U.fmtDate(t.date));
    return `<li><button type="button" class="web-jump" data-node="${esc(other.id)}"><i style="background:${C.get(other.cat).color}"></i>${tidy(other.name)}</button><span>${esc(bits.join(", "))}${t.ext ? ` <em class="wp-ext">control evidence</em>` : ""}</span></li>`;
  }
  const roleBits = r => [typeLabel(r)].concat(r.date ? [U.fmtDate(r.date)] : []).join(", ");
  // a person's role at an organisation: listed under the organisation with the name, and under the person with the organisation
  function roleItem(r, showPerson) {
    const org = byId.get(r.to), p = personById.get(r.from);
    const who = showPerson ? `<button type="button" class="web-jump" data-person="${esc(p.id)}"><i class="who"></i>${tidy(p.name)}</button>`
      : `<button type="button" class="web-jump" data-node="${esc(org.id)}"><i style="background:${C.get(org.cat).color}"></i>${tidy(org.name)}</button>`;
    const note = (r.note || "").replace(typeLabel(r) + ". ", "");   // some notes open by repeating the role
    return `<li>${who}<span>${esc(roleBits(r))}${showPerson ? "" : `. ${tidy(note)}`}</span></li>`;
  }
  function tieBlock(title, list, out) {
    return `<div><h3>${title} (${list.length})</h3>${list.length ? `<ul>${list.map(t => tieItem(t, out)).join("")}</ul>` : `<p class="wp-none">None recorded${state.fam !== "all" ? " for this kind of tie" : ""}.</p>`}</div>`;
  }
  function renderPanel() {
    const s = state.sel, filt = state.fam !== "all" ? ` Showing only: ${esc(famLabel(state.fam).toLowerCase())}.` : "";
    if (s && s.type === "person") {
      const p = personById.get(s.id), roles = p.roles.filter(r => byId.has(r.to));
      panel.innerHTML = `<div class="wp-main">
          <span class="web-eyebrow">Person · drawn as a link, not a bubble</span>
          <h2>${tidy(p.name)}</h2>
          <p>The dotted links join the organisations where this person holds a documented role or interest. That establishes a specific interest, not a motive, and it is not control.</p>
          <p class="wp-small"><a href="#dp-people">See the people evidence</a></p>
        </div>
        <div class="wp-ties one"><div><h3>Roles and interests (${roles.length})</h3><ul>${roles.map(r => roleItem(r, false)).join("")}</ul></div></div>`;
    } else if (s && s.type === "node") {
      const n = byId.get(s.id), c = C.get(n.cat);
      const out = ORG_EDGES.filter(t => t.from === n.id && inFam(t)), inc = ORG_EDGES.filter(t => t.to === n.id && inFam(t));
      const here = PEOPLE.reduce((a, p) => a.concat(p.roles.filter(r => r.to === n.id)), []);
      panel.innerHTML = `<div class="wp-main">
          <span class="web-eyebrow" style="color:${c.color}">${tidy(c.label)} · ${tidy(n.data.subtype)} · ${tidy(n.data.country)}</span>
          <h2>${tidy(n.name)}</h2>
          <p><span class="wp-lbl">Stake, as read by this map</span>${tidy(n.data.stake)}</p>
          <p class="wp-small">${n.deg} documented ${n.deg === 1 ? "tie" : "ties"} to other organisations.${filt} <a href="#a-${esc(n.id)}">Open the full profile</a></p>
        </div>
        <div class="wp-ties">${tieBlock("Arrows going out to", out, true)}${tieBlock("Arrows coming in from", inc, false)}${here.length ? `<div><h3>People with a role or interest here (${here.length})</h3><ul>${here.map(r => roleItem(r, true)).join("")}</ul></div>` : ""}</div>`;
    } else if (s) {
      const c = C.get(s.id), ids = new Set(c.nodes.map(n => n.id));
      const out = count(t => ids.has(t.from) && !ids.has(t.to) && inFam(t)), inc = count(t => !ids.has(t.from) && ids.has(t.to) && inFam(t)), within = count(t => ids.has(t.from) && ids.has(t.to) && inFam(t));
      const about = document.querySelector(`#cat-${c.cat} .oneline`);
      const top = c.nodes.filter(n => n.deg).slice(0, 8);
      panel.innerHTML = `<div class="wp-main">
          <span class="web-eyebrow" style="color:${c.color}">Group · ${c.nodes.length} actors</span>
          <h2>${tidy(c.label)}</h2>
          <p>${about ? tidy(about.textContent) : ""}</p>
          <p class="wp-small">${out} ties go out to other groups, ${inc} come in, and ${within} stay inside the group.${filt} <a href="#cat-${c.cat}">Read about this category</a></p>
        </div>
        <div class="wp-ties"><div><h3>Most documented ties in this group</h3><ul>${top.map(n => `<li><button type="button" class="web-jump" data-node="${esc(n.id)}"><i style="background:${c.color}"></i>${tidy(n.name)}</button><span>${n.deg} ${n.deg === 1 ? "tie" : "ties"}</span></li>`).join("")}</ul></div></div>`;
    } else {
      const labs = t => catOf(t.from) === 3 || catOf(t.to) === 3;
      const two = t => t.from === "openai" || t.to === "openai" || t.from === "anthropic" || t.to === "anthropic";
      const grants = t => catOf(t.from) === 5 && catOf(t.to) === 6;
          panel.innerHTML = `<div class="wp-notes">
          <div><h2>The labs sit in the middle</h2><p>${baseCount(labs)} of the ${D.edges.length} ties in the base map touch a frontier developer, and ${baseCount(two)} touch OpenAI or Anthropic. Those two also disclose the most, so part of this is documentation.</p><button type="button" class="web-act" data-group="3">Show the labs' ties</button></div>
          <div><h2>Safety research has few paymasters</h2><p>${baseCount(grants)} base ties run from a safety funder to a research organisation. In one published list, a single funder accounts for about 72% of the 2025 estimates.</p><button type="button" class="web-act" data-lens="grants">Show grants and philanthropy</button></div>
          <div><h2>Evaluators depend on the labs they test</h2><p>${count(t => famOf(t) === "access")} dashed arrows show model access, compute credits and commissioned work flowing from labs to evaluators and training programmes. No executed agreement was obtained.</p><button type="button" class="web-act" data-lens="access">Show access and contracts</button></div>
          <div><h2>A few people sit in more than one place</h2><p>${PEOPLE.length} named people hold roles or disclosed interests in more than one organisation. They are drawn as ${nInter} dotted links between those organisations and can be found in the search under the map.</p><button type="button" class="web-act" data-lens="people">Show the people links</button></div>
        </div>`;
    }
    const fam = FAMS.find(f => f.id === state.fam);
    blurb.textContent = fam ? `${fam.label}. ${fam.blurb}` : "Pick a bubble or a group name, or search for an actor, a group or a person, to follow the ties. Pick a kind of tie above the map to see only those arrows. Drag a bubble to untangle it.";
    $("webClear").hidden = !state.sel && state.fam === "all";
  }

  /* ---------- controls ---------- */
  function select(sel, fromPick) {
    state.sel = sel && state.sel && sel.type === state.sel.type && sel.id === state.sel.id && !fromPick ? null : sel;
    state.hover = null;
    search.value = state.sel ? labelOf(state.sel) : "";
    refresh();
    renderPanel();
    // on a narrow screen the map scrolls sideways; bring the chosen bubble into view
    const sc = svg.parentNode;
    if (state.sel && state.sel.type !== "person" && sc.scrollWidth > sc.clientWidth) {
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
  const LENS = { control: "Ownership and control", invest: "Investment", supply: "Supply", grants: "Grants", public: "Public authority", politics: "Advocacy", field: "Standards and training", access: "Access and contracts", people: "People and interests" };
  lens.innerHTML = [{ id: "all", label: "All ties" }].concat(FAMS).map(f =>
    `<button type="button" data-v="${f.id}" aria-pressed="${f.id === "all"}" title="${esc(f.label)}">${esc(LENS[f.id] || f.label)}<span class="c">${f.id === "all" ? ORG_EDGES.length + nInter : f.id === "people" ? nInter : count(t => famOf(t) === f.id)}</span></button>`).join("");
  lens.addEventListener("click", e => { const b = e.target.closest("button"); if (b) setFam(b.dataset.v); });

  /* One search box for everything that can be selected: groups, actors and people. Typing filters the list, the list scrolls,
     and the row under the pointer or the arrow keys previews on the map before it is chosen. */
  const ITEMS = CLUSTERS.map(c => ({ type: "group", id: c.cat, label: c.label, head: "Whole groups", mark: `<i class="grp-mark" style="background:${c.color}"></i>`, find: c.label }))
    .concat(CLUSTERS.reduce((a, c) => a.concat(c.nodes.slice().sort((x, y) => x.name.localeCompare(y.name)).map(n =>
      ({ type: "node", id: n.id, label: n.name, head: c.label, mark: `<i style="background:${c.color}"></i>`, find: n.name + " " + n.short + " " + c.label }))), []))
    .concat(PEOPLE.map(p => ({ type: "person", id: p.id, label: p.name, head: "People who link organisations", mark: `<i class="who"></i>`, find: p.name + " person people" })));
  ITEMS.forEach(it => { it.find = it.find.toLowerCase(); });
  const sameSel = (a, b) => !!a && !!b && a.type === b.type && String(a.id) === String(b.id);
  const labelOf = sel => { const it = ITEMS.find(x => sameSel(x, sel)); return it ? it.label : ""; };
  let shown = [], active = -1;
  function preview(it) {
    const next = it ? { type: it.type, id: it.id } : null;
    if (sameSel(next, state.hover) || (!next && !state.hover)) return;
    state.hover = next;
    refresh();
  }
  function setActive(i, scroll) {
    active = i;
    Array.from(options.querySelectorAll('[role="option"]')).forEach((o, k) => {
      o.classList.toggle("active", k === i);
      if (k === i && scroll) o.scrollIntoView({ block: "nearest" });
    });
    if (i >= 0) search.setAttribute("aria-activedescendant", "wo-" + i); else search.removeAttribute("aria-activedescendant");
    preview(i >= 0 ? shown[i] : null);
  }
  function openList() {
    // a name already in the box is the current selection, not a query, so the whole list shows until the reader types
    const q = state.sel && search.value === labelOf(state.sel) ? "" : search.value.trim().toLowerCase();
    shown = q ? ITEMS.filter(it => q.split(/\s+/).every(w => it.find.indexOf(w) >= 0)) : ITEMS;
    let head = "";
    options.innerHTML = shown.length ? shown.map((it, i) => {
      const h = it.head !== head ? `<li class="grp" role="presentation">${esc(it.head)}</li>` : "";
      head = it.head;
      return `${h}<li role="option" id="wo-${i}" data-i="${i}" aria-selected="${sameSel(it, state.sel)}">${it.mark}<span>${tidy(it.label)}</span></li>`;
    }).join("") : `<li class="none" role="presentation">Nothing on the map matches.</li>`;
    options.hidden = false;
    search.setAttribute("aria-expanded", "true");
    setActive(q && shown.length ? 0 : -1, false);
  }
  function closeList() {
    if (options.hidden) return;
    options.hidden = true;
    search.setAttribute("aria-expanded", "false");
    search.removeAttribute("aria-activedescendant");
    active = -1;
    preview(null);
  }
  function choose(it) {
    closeList();
    select({ type: it.type, id: it.id }, true);
  }
  search.addEventListener("focus", () => { search.select(); openList(); });
  search.addEventListener("click", () => { if (options.hidden) openList(); });
  search.addEventListener("input", () => {
    if (!search.value && state.sel) { select(null); }
    openList();
  });
  search.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (options.hidden) { openList(); return; }
      if (shown.length) setActive((active + (e.key === "ArrowDown" ? 1 : shown.length - 1) + (active < 0 && e.key === "ArrowUp" ? 1 : 0)) % shown.length, true);
    } else if (e.key === "Enter") {
      if (!options.hidden && active >= 0) { e.preventDefault(); choose(shown[active]); }
    } else if (e.key === "Escape") {
      if (!options.hidden) { e.preventDefault(); closeList(); search.value = state.sel ? labelOf(state.sel) : ""; }
    }
  });
  // leaving the box closes the list and puts the current selection's name back
  search.addEventListener("blur", () => { closeList(); search.value = state.sel ? labelOf(state.sel) : ""; });
  options.addEventListener("pointerdown", e => e.preventDefault());   // keep focus in the box while the list is clicked or scrolled
  options.addEventListener("click", e => { const o = e.target.closest('[role="option"]'); if (o) { choose(shown[+o.dataset.i]); search.blur(); } });
  options.addEventListener("pointermove", e => {
    const o = e.target.closest('[role="option"]');
    if (o && e.pointerType === "mouse" && +o.dataset.i !== active) setActive(+o.dataset.i, false);
  });
  const setText = (id, v) => { const x = $(id); if (x) x.textContent = v; };
  const scale = $("webScale");
  if (scale) {
    const row = (w, label, faint) => `<li><svg viewBox="0 0 34 14" aria-hidden="true"><path d="M1 7h32" stroke-width="${w}"/>${faint ? '<text x="17" y="11.4" text-anchor="middle" class="k-sign faint">$</text>' : ""}</svg><span>${label}</span></li>`;
    const used = Array.from(new Set(ORG_EDGES.filter(t => MONEY.has(t.type) && t.amount != null).map(t => stepOf(t.amount)))).sort((a, b) => a - b);
    scale.innerHTML = row(W_UNKNOWN, "amount not disclosed", true) + used.map(st => row(widthOf(st), STEPS[st])).join("");
  }
  const asOf = /^(\d{4})-(\d{2})/.exec(D.asOf || "");
  if (asOf) setText("webAsOf", ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][+asOf[2] - 1] + " " + asOf[1]);
  const moneyTies = ORG_EDGES.filter(t => MONEY.has(t.type));
  setText("nMoney", moneyTies.length);
  setText("nMoneyAmt", moneyTies.filter(t => t.amount != null).length);
  setText("nExtTies", X.edges.filter(e => !personById.has(e.from)).length);
  setText("nExtPeople", PEOPLE.length);
  $("webClear").addEventListener("click", () => { state.sel = null; search.value = ""; setFam("all"); });
  panel.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.node) select({ type: "node", id: b.dataset.node }, true);
    else if (b.dataset.person) select({ type: "person", id: b.dataset.person }, true);
    else if (b.dataset.group) select({ type: "group", id: +b.dataset.group }, true);
    else if (b.dataset.lens) setFam(b.dataset.lens);
  });
  const motion = $("webMotion");
  motion.addEventListener("click", () => {
    const paused = svg.classList.toggle("paused");
    if (paused) svg.pauseAnimations(); else svg.unpauseAnimations();
    motion.setAttribute("aria-pressed", paused ? "true" : "false");
    motion.textContent = paused ? "Play motion" : "Pause motion";
  });
  if (STILL) motion.hidden = true;

  /* ---------- pointing at an arrow says what it is and how much money is stated on it ---------- */
  const tip = document.createElement("div");
  tip.className = "web-tip";
  tip.hidden = true;
  svg.closest(".web").appendChild(tip);
  let tipLink = null;
  function tipHtml(l) {
    const head = `<b>${tidy(l.s.name)} ${l.inter ? "and" : "→"} ${tidy(l.t.name)}</b>`;
    if (l.inter) return head + `<ul>${l.people.map(p => `<li><span>${tidy(p.name)}</span><em>shared person</em></li>`).join("")}</ul>`;
    return head + `<ul>${l.ties.filter(inFam).map(t => {
      const what = [typeLabel(t)].concat(t.date ? [U.fmtDate(t.date)] : []).join(", ");
      const amt = t.amount != null ? `<strong>${esc(U.fmtAmount(t.amount, t.currency))}</strong>` : MONEY.has(t.type) ? "<em>amount not disclosed</em>" : "<em>no payment along this arrow</em>";
      return `<li><span>${esc(what)}${t.status && t.amount != null ? `<small>${tidy(t.status)}</small>` : ""}</span>${amt}</li>`;
    }).join("")}</ul>`;
  }
  function moveTip(e) {
    const w = tip.offsetWidth, h = tip.offsetHeight, vw = document.documentElement.clientWidth;
    tip.style.left = Math.max(8, Math.min(e.clientX + 14, vw - w - 8)) + "px";
    tip.style.top = (e.clientY + h + 22 > window.innerHeight ? e.clientY - h - 12 : e.clientY + 16) + "px";
  }
  function showTip(l, e) {
    if (tipLink && tipLink !== l) tipLink.el.classList.remove("hot");
    tipLink = l;
    l.el.classList.add("hot");
    tip.innerHTML = tipHtml(l);
    tip.hidden = false;
    moveTip(e);
  }
  function hideTip() {
    if (!tipLink) return;
    tipLink.el.classList.remove("hot");
    tipLink = null;
    tip.hidden = true;
  }
  const linkAt = e => { const h = e.target.closest && e.target.closest(".hit"); return h ? links[+h.getAttribute("data-link")] : null; };
  svg.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || drag) return;
    const l = linkAt(e);
    if (l) showTip(l, e); else hideTip();
  });
  svg.addEventListener("pointerleave", hideTip);
  let lastPointer = "mouse";   // click events do not carry the pointer type in every browser
  svg.addEventListener("pointerdown", e => { lastPointer = e.pointerType; }, true);
  window.addEventListener("scroll", hideTip, { passive: true });

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
    hideTip();
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
    const n = nodeAt(e), t = e.target.closest && e.target.closest(".ctitle"), l = linkAt(e);
    // a tap on an arrow shows its card (there is no hover on a touch screen) and leaves the selection alone
    if (l && !n) { if (tipLink === l && lastPointer !== "mouse") hideTip(); else showTip(l, e); return; }
    hideTip();
    if (n) select({ type: "node", id: n.id });
    else if (t) select({ type: "group", id: +t.getAttribute("data-cat") });
    else if (state.sel) select(null);
  });

  refresh();
  renderPanel();
})();
