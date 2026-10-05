/* The interactive map at the top of ecosystem.html.
   Bubbles are actors, grouped by category around the frontier developers. Arrows are documented ties, drawn from -> to.
   Bubble size is chosen by the reader: people employed (the default), one yearly money figure, names on a published list of
   influential people, documented ties, or sources cited. The figures and their sources are in size-data.js. An actor with no
   figure under the chosen measure is drawn as a small dashed ring: unknown is not shown as small, and never as zero.
   Arrows that carry money (investment, grants, donations, credits) show a small money sign moving from giver to receiver, and their
   width is the largest single amount stated on the tie, one step wider for every tenfold increase, with larger steps for the
   larger sums. Amounts are never summed.
   A money tie with no disclosed amount is drawn thin with a fainter sign. Every other arrow is a plain line.
   People are not bubbles. A named person with a role or interest in two organisations is drawn as a dotted link between them,
   and every person can be found in the search box under the map, alongside the actors and groups.
   Needs ecosystem-data.js (window.ECOSYSTEM), size-data.js (window.ECO_SIZE) and the helpers the page script exports as window.ECO_UI. */
(function () {
  "use strict";
  const D = window.ECOSYSTEM, U = window.ECO_UI, svg = document.getElementById("webStage");
  if (!D || !U || !svg) return;
  const NS = "http://www.w3.org/2000/svg", W = 1080, H0 = 870;
  let H = H0;   // the plate grows taller when a measure draws bubbles too large for the usual height
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
  // The steps grow as the sums do, so the big sums stand clear of the small ones. The widths were set by the author.
  const STEPS = ["under 100k", "100k to 1m", "1m to 10m", "10m to 100m", "100m to 1bn", "1bn to 10bn", "10bn or more"];
  const stepOf = v => Math.max(0, Math.min(STEPS.length - 1, Math.floor(Math.log10(v)) - 4));
  const WIDTHS = [2.34, 3.71, 5.07, 6.8, 13.5, 18, 25];
  const widthOf = step => WIDTHS[step];
  const W_PLAIN = 1.1, W_UNKNOWN = 1.4, W_WIDE = 5.5, W_BROAD = 12;   // from W_WIDE up, the arrowhead grows with the line; from W_BROAD up it grows more slowly
  const headOf = w => w >= W_BROAD ? "wmx" : w >= W_WIDE ? "wmw" : "wm";
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
    const short = SHORT[n.id] || n.name;
    return { id: n.id, name: n.name, short, lines: wrap(short), cat: n.cat, deg: deg.get(n.id) || 0, data: n };
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
  CLUSTERS.forEach(c => { c.ax = c.x; c.ay = c.y; c.nodes = nodes.filter(n => n.cat === c.cat); });

  /* ---------- what a bubble's size stands for ---------- */
  // Each measure reads one figure per actor and turns it into a radius. of(n) returns null where no figure was found.
  // People and money run over five or more powers of ten, so there the radius goes up one even step per tenfold increase.
  const S = window.ECO_SIZE || { fx: { USD: 1 }, people: {}, money: {}, worth: {}, time100: { matches: {}, groupActors: [] } };
  const finById = new Map(D.financials.map(f => [f.id, f]));
  const SYM = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", KRW: "₩", CNY: "CN¥", SGD: "S$" };
  const big = v => { for (const [k, u] of [[1e12, "tn"], [1e9, "bn"], [1e6, "m"], [1e3, "k"]]) if (v >= k) return +(v / k).toPrecision(v / k >= 100 ? 3 : 2) + u; return String(v); };
  const srcLink = (url, label) => url ? `<a href="${esc(url)}">${tidy(label || "Source")}</a>` : "";
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const sentence = s => /[.!?]$/.test(s) ? s : s + ".";
  const T100 = S.time100;
  const t100Date = U.fmtDate(T100.date || "");
  // a money figure from one of the two money tables: yearly flows (S.money) or what an actor is worth (S.worth)
  const moneyOf = table => n => {
    const m = (table || {})[n.id];
    if (!m) return null;
    const f = m.fin ? finById.get(m.fin) : null;
    if (m.fin && (!f || f.amount == null)) return null;
    const amount = f ? f.amount : m.v, cur = f ? f.currency : m.cur, src = f ? D.sources[f.sources[0]] : null;
    return { v: amount * (m.times || 1) * (S.fx[cur] || 1), num: (SYM[cur] || cur + " ") + big(amount * (m.times || 1)), text: `${m.kind}: ${U.fmtAmount(amount, cur)}`,
      when: f ? f.period : m.when, basis: f ? f.basis : m.basis, est: !!m.est, note: [m.note, f && !m.note ? f.caveat : ""].filter(Boolean).join(" "),
      url: src ? src.url : m.url, srcTitle: src ? src.title : "" };
  };
  // The two money measures widen faster at the top, so the largest sums stand clear: a bubble is 1.5 times as wide at 100bn
  // and twice as wide at 1tn and above as the even scale would draw it. Below 10bn nothing changes. Set by the author.
  const lift = v => 1 + 0.5 * Math.max(0, Math.min(2, Math.log10(v) - 10));
  const MEASURES = [
    { id: "people", pill: "Organisation size", key: "size = people employed", unit: "people", log: true,
      keyText: "people employed, where a figure is published; each step up in size is ten times more",
      of: n => { const p = S.people[n.id]; return p ? { v: p.v, num: big(p.v), text: p.text, when: p.when, basis: p.basis, est: !!p.est, note: p.note || "", url: p.url } : null; },
      r: v => Math.max(6, 7 + 6 * (Math.log10(v) - 1)), ticks: [[10, "10"], [1000, "1,000"], [100000, "100,000 people"]],
      note: k => `Bubble size shows people employed, on a scale where each step is ten times more, so a bubble twice as wide is a far larger employer than twice. ${k} of the ${nodes.length} actors have a figure. A dashed ring means none was found, which does not mean the organisation is small. Figures cover whole organisations, so Amazon's includes its warehouses, and a few are outside estimates. Size here is not influence.`,
      about: "Employees or staff, from a company filing or annual report where there is one, from the organisation's own team page for small research groups, and from a press report or an outside tracker for private companies that publish nothing. Each line says which. Groups of many organisations, and bodies such as a committee or a legislature, have no single headcount and are left as not stated." },
    { id: "money", pill: "Money (revenue or budget)", key: "size = yearly revenue or budget", unit: "a year", log: true,
      keyText: "money through the organisation in a year: revenue for a company, budget or funding for others; each step up in size is ten times more",
      of: moneyOf(S.money),
      r: v => Math.max(6, 6 + 5.4 * (Math.log10(v) - 6)) * lift(v), ticks: [[1e6, "1m"], [1e9, "1bn"], [1e11, "100bn a year, in US dollars"]],
      note: k => `Bubble size shows money through each actor in a year: revenue for a company, expenses or budget for a nonprofit or public body, safety funding given for a funder, receipts for a political committee. It is not what the actor is worth, which is the next measure along. These are unlike kinds of money, set side by side and never added up. Each step in size is ten times more, and the steps are larger above 10bn so the biggest sums stand clear. ${k} of the ${nodes.length} actors have a figure, and a dashed ring means none was found. Financing rounds and multi-year totals are left out. Size here is not influence.`,
      about: "One figure per actor, covering a year or less. Microsoft's figure of about USD 332bn, for example, is its revenue for fiscal 2026, not its value on the stock market. Figures already in this page's financial observations are reused as stated. The rest come from company filings, tax filings and budget documents collected on 5 October 2026. A figure in another currency is shown as stated and placed on the scale at a rough exchange rate. Company revenue covers the whole business, not its AI or safety work." },
    { id: "worth", pill: "Money (worth)", key: "size = what it is worth", unit: "", log: true,
      keyText: "what the organisation is worth on paper: stock-market value for a listed company, the latest round's valuation for a private one; each step up in size is ten times more",
      of: moneyOf(S.worth),
      r: v => Math.max(6, 12.5 + 9 * (Math.log10(v) - 10)) * lift(v), ticks: [[1e10, "10bn"], [1e11, "100bn"], [1e12, "1tn, in US dollars"]],
      note: k => `Bubble size shows what each actor is worth on paper: the stock-market value of a listed company on 5 October 2026, or the valuation set at a private company's latest financing round. A share price moves every day and a private valuation is agreed by a few investors, so the two are not like for like, and neither is cash, revenue or spending. Each step in size is ten times more, and the steps are larger above 10bn so the biggest sums stand clear. ${k} of the ${nodes.length} actors have a figure. Nonprofits, public bodies and units inside a larger company have no market value and are dashed rings. Size here is not influence.`,
      about: "Stock-market value for listed companies, read on 5 October 2026 from a public tracker, and the valuations of private companies already recorded in this page's financial observations, with Mistral's added from press reports of its September 2026 round. Two entries are not valuations of the actor itself and say so: the OpenAI Foundation's figure is the implied value of its stake in OpenAI, and Temasek's is the value of what it holds. A company's worth covers its whole business, not its AI or safety work." },
    { id: "influence", pill: "Influence", key: "size = names on TIME100 AI 2026", unit: "people named", log: false,
      keyText: `people named on TIME's TIME100 AI 2026 list. Influence has no agreed measure, so this borrows one published judgement`,
      of: n => { const m = T100.matches[n.id] || []; return { v: m.length, num: String(m.length), text: m.length ? `${m.length} ${m.length === 1 ? "person" : "people"} on the list: ${m.join("; ")}` : "No one on the list", when: `published ${t100Date}`, basis: T100.title, est: false,
        note: T100.groupActors.indexOf(n.id) >= 0 ? "This bubble is a group of organisations. Matching the name to it is this map's reading, not TIME's." : "", url: T100.url }; },
      r: v => v ? 5 + 12 * Math.sqrt(v) : 4, ticks: [[1, "1"], [3, "3 people named"]],
      note: k => `Influence has no agreed measure. Here bubble size counts the people TIME named on its TIME100 AI 2026 list, published ${t100Date}, whose title on the list names the organisation. That is one magazine's editorial judgement about individuals. It is not a finding of this map and it is not a ranking. ${k} of the ${T100.people} names fall on an actor shown here. A small dot means no one from that actor is on the list.`,
      about: `TIME's editors and reporters choose 100 people each year as the most influential in AI. The 2026 list was published on ${t100Date}. A person counts towards a bubble only where the title TIME prints names that organisation, or an office inside one of the map's group actors. Most of the 100 work at organisations that are not on this map, and several large actors here have no one on the 2026 list.` },
    { id: "ties", pill: "Documented ties", key: "size = ties", unit: "ties", log: false,
      keyText: "number of documented ties",
      of: n => ({ v: n.deg, num: String(n.deg), text: `${n.deg} documented ${n.deg === 1 ? "tie" : "ties"} to other organisations`, when: "", basis: "", est: false, note: "", url: "" }),
      r: v => Math.max(5, 8.2 * Math.sqrt(v)), ticks: [[1, "1"], [10, "10"], [25, "25 ties"]],
      note: () => "Bubble size counts documented ties. A large bubble has many ties recorded in this map, which partly reflects how much an organisation discloses. Size here is not influence.",
      about: "Counted from the arrows on this map: the ties in the base dataset plus the ties added from the control evidence. Links through a shared person are not counted." },
    { id: "sources", pill: "Sources cited", key: "size = sources cited", unit: "sources", log: false,
      keyText: "number of sources this map cites for the actor",
      of: n => { const k = (n.data.sources || []).length; return { v: k, num: String(k), text: `${k} ${k === 1 ? "source" : "sources"} cited for this actor in the base dataset`, when: "", basis: "", est: false, note: "", url: "" }; },
      r: v => Math.max(4, 3 + 6.5 * Math.sqrt(v)), ticks: [[1, "1"], [4, "4"], [9, "9 sources"]],
      note: () => "Bubble size counts the sources this map cites for the actor. It shows where the evidence behind the map is thick and where it is thin, not how much an actor matters.",
      about: "Counted from the source list attached to each actor in the base dataset. An actor with few sources is one this version documents lightly." }
  ];
  const measureById = new Map(MEASURES.map(m => [m.id, m]));
  const R_UNKNOWN = 7.5;
  // ecosystem.html?size=money opens the map on that measure, so a view can be linked to
  let measure = measureById.get(new URLSearchParams(location.search).get("size")) || MEASURES[0];

  // widths come from the browser, so a name is only set inside a bubble when it really fits
  const gMeasure = el("g", { visibility: "hidden", "aria-hidden": "true" }, svg), widths = new Map();
  function textW(cls, str) {
    const k = cls + "|" + str;
    if (!widths.has(k)) {
      const t = el("text", { class: cls }, gMeasure);
      t.textContent = str;
      widths.set(k, t.getComputedTextLength());
      gMeasure.removeChild(t);
    }
    return widths.get(k);
  }
  function sizeNodes() {
    nodes.forEach(n => {
      const val = n.val = measure.of(n);
      n.unk = !val;
      n.R = val ? measure.r(val.v) : R_UNKNOWN;
      // the name and the figure go inside when both fit across the bubble at the height they sit; a long name may be set a little smaller
      const fits = (w, dy) => n.R > dy && w <= 2 * Math.sqrt(n.R * n.R - dy * dy) - 5;
      n.fs = !val || n.R < 17 || !fits(textW("in num", val.num), 14) ? 0 : [12.5, 11.5, 10.5].find(f => fits(textW("in", n.short) * f / 12.5, 10)) || 0;
      n.inside = n.fs > 0;
      n.always = n.inside || n.deg >= 2 || (!!val && n.R >= 12);
      // a name under the bubble reserves a box so that no neighbour is placed over it
      n.lw = n.always && !n.inside ? Math.max.apply(null, n.lines.map(l => textW("lab", l))) : 0;
      n.lh = n.lw ? 14 * n.lines.length + 3 : 0;
    });
  }

  /* ---------- layout: pack each group on a spiral, then push the groups apart until none overlap ---------- */
  const PAD = 5;
  const nearRect = (cx, cy, cr, x0, y0, x1, y1) => { const dx = cx - Math.max(x0, Math.min(x1, cx)), dy = cy - Math.max(y0, Math.min(y1, cy)); return dx * dx + dy * dy < (cr + PAD) * (cr + PAD); };
  // does bubble a at (ax, ay), with its name box, touch bubble b at (bx, by) with its name box?
  function clash(a, ax, ay, b, bx, by) {
    if (Math.hypot(ax - bx, ay - by) < a.R + b.R + PAD + 1) return true;
    const ra = a.lw ? [ax - a.lw / 2, ay + a.R + 1, ax + a.lw / 2, ay + a.R + 1 + a.lh] : null;
    const rb = b.lw ? [bx - b.lw / 2, by + b.R + 1, bx + b.lw / 2, by + b.R + 1 + b.lh] : null;
    if (ra && nearRect(bx, by, b.R, ra[0], ra[1], ra[2], ra[3])) return true;
    if (rb && nearRect(ax, ay, a.R, rb[0], rb[1], rb[2], rb[3])) return true;
    return !!ra && !!rb && ra[0] < rb[2] + PAD && rb[0] < ra[2] + PAD && ra[1] < rb[3] + PAD && rb[1] < ra[3] + PAD;
  }
  function layout() {
    CLUSTERS.forEach(c => {
      const list = c.nodes.slice().sort((a, b) => b.R - a.R || b.deg - a.deg || a.name.localeCompare(b.name)), placed = [];
      list.forEach((n, i) => {
        n.ox = 0; n.oy = 0;
        if (i) for (let t = 1; t < 9000; t++) {
          const a = t * 0.33, d = 2 + t * 0.42, x = Math.cos(a) * d * 1.12, y = Math.sin(a) * d * 0.9;
          if (placed.every(p => !clash(n, x, y, p, p.ox, p.oy))) { n.ox = x; n.oy = y; break; }
        }
        placed.push(n);
      });
      // the box around the group: every bubble and name, with the group's title on top
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      list.forEach(n => {
        const hw = Math.max(n.R, n.lw / 2);
        x0 = Math.min(x0, n.ox - hw); x1 = Math.max(x1, n.ox + hw); y0 = Math.min(y0, n.oy - n.R); y1 = Math.max(y1, n.oy + n.R + (n.lh ? n.lh + 1 : 0));
      });
      const mx = (x0 + x1) / 2;
      c.hw = Math.max((x1 - x0) / 2, c.tw / 2) + 4;
      y0 -= 24;   // room for the title
      const my = (y0 + y1) / 2;
      c.hh = (y1 - y0) / 2 + 2;
      list.forEach(n => { n.ox -= mx; n.oy -= my; });
      c.x = c.ax; c.y = c.ay;
    });
    // groups start at their anchors and are nudged apart along the shallower overlap; a weak pull keeps them near home.
    // If they still overlap at the end, the plate is made a little taller and the groups are spread down it and tried again,
    // each time leaning further towards moving groups up and down, where the new room is, and not sideways into the edges.
    for (H = H0; ; H += 50) {
      const ky = H / H0, lean = Math.pow(0.8, (H - H0) / 50);
      let left = 0;
      CLUSTERS.forEach(c => { c.x = c.ax; c.y = c.ay * ky; });
      for (let it = 0; it < 420; it++) {
        const pull = it < 300 ? 0.035 : 0;
        left = 0;
        for (let i = 0; i < CLUSTERS.length; i++) for (let j = i + 1; j < CLUSTERS.length; j++) {
          const a = CLUSTERS[i], b = CLUSTERS[j];
          const px = a.hw + b.hw + 10 - Math.abs(a.x - b.x), py = a.hh + b.hh + 8 - Math.abs(a.y - b.y);
          if (px <= 0 || py <= 0) continue;
          left = Math.max(left, Math.min(px, py));
          if (px < py * lean) { const s = (a.x < b.x ? -1 : 1) * px / 2; a.x += s; b.x -= s; } else { const s = (a.y < b.y ? -1 : 1) * py / 2; a.y += s; b.y -= s; }
        }
        CLUSTERS.forEach(c => {
          c.x += (c.ax - c.x) * pull; c.y += (c.ay * ky - c.y) * pull;
          c.x = Math.max(c.hw + 6, Math.min(W - c.hw - 6, c.x)); c.y = Math.max(c.hh + 6, Math.min(H - c.hh - 6, c.y));
        });
      }
      if (left < 2 || H >= 1700) break;
    }
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    CLUSTERS.forEach(c => {
      c.nodes.forEach(n => { n.tx = c.x + n.ox; n.ty = c.y + n.oy; });
      c.titleX = c.x; c.titleY = c.y - c.hh + 14;
    });
  }
  CLUSTERS.forEach(c => { c.titleText = `${c.label} · ${c.nodes.length}`; c.tw = textW("ctitle", c.titleText); });
  sizeNodes();
  layout();
  nodes.forEach(n => { n.x = n.tx; n.y = n.ty; n.r = n.R; });

  /* ---------- drawing ---------- */
  const defs = el("defs", {}, svg);
  CLUSTERS.forEach(c => {
    const m = el("marker", { id: "wm-" + c.cat, markerUnits: "userSpaceOnUse", markerWidth: 11, markerHeight: 11, refX: 8, refY: 5.5, orient: "auto" }, defs);
    el("path", { d: "M0,1 L10,5.5 L0,10 Z", fill: c.color }, m);
    // wide money arrows get a head that grows with the line
    const wide = el("marker", { id: "wmw-" + c.cat, markerUnits: "strokeWidth", viewBox: "0 0 10 10", markerWidth: 2, markerHeight: 2, refX: 7.5, refY: 5, orient: "auto" }, defs);
    el("path", { d: "M0,0.4 L10,5 L0,9.6 Z", fill: c.color }, wide);
    const broad = el("marker", { id: "wmx-" + c.cat, markerUnits: "strokeWidth", viewBox: "0 0 10 10", markerWidth: 1.5, markerHeight: 1.5, refX: 7.5, refY: 5, orient: "auto" }, defs);
    el("path", { d: "M0,0.4 L10,5 L0,9.6 Z", fill: c.color }, broad);
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
    const end = l.inter ? 2 : 5 + (l.w >= W_BROAD ? l.w * 0.375 : l.w >= W_WIDE ? l.w * 0.5 : 0);   // arrows stop short to leave room for the head; person links have none
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
    l.el.setAttribute("marker-end", `url(#${headOf(l.w)}-${l.s.cat})`);
    l.el.classList.toggle("money", !!m.n);
    // ties from the control evidence stay dashed; the dashes grow with the line so a wide arrow still reads as one arrow
    if (l.el.classList.contains("ext")) l.el.style.strokeDasharray = l.w > 2.5 ? `${(l.w * 2.4).toFixed(1)} ${(l.w * 0.8).toFixed(1)}` : "";
    l.draw();
    l.flow.textContent = "";
    l.coins = [];
    if (!m.n) return;
    // one to three signs per arrow, all moving at one slow speed, so only width and size say how much
    const len = l.el.getTotalLength(), n = m.top ? Math.max(1, Math.min(3, Math.round(len / 130))) : 1, dur = Math.max(4, len / 15);
    const size = m.top ? Math.min(18, 9.5 + 0.55 * l.w) : 8.5;
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
    c.title = el("text", { class: "ctitle", x: c.titleX.toFixed(1), y: c.titleY.toFixed(1), "text-anchor": "middle", fill: c.color, "data-cat": c.cat }, gTitles);
    c.title.textContent = c.titleText;
  });

  nodes.forEach(n => {
    const c = C.get(n.cat);
    const g = n.el = el("g", { class: "node", "data-id": n.id, style: `color:${c.color}` }, gNodes);
    n.circle = el("circle", { r: n.r.toFixed(1), fill: c.color }, g);
    n.lab = el("g", { class: "nlabel" }, gLabels);
    n.place = () => { const t = `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`; g.setAttribute("transform", t); n.lab.setAttribute("transform", t); };
    n.place();
  });
  // the name sits inside a bubble with its figure when both fit, and underneath when they do not
  function labelNodes() {
    nodes.forEach(n => {
      n.el.classList.toggle("unk", n.unk);
      n.lab.textContent = "";
      n.lab.classList.toggle("always", n.always);
      if (n.inside) {
        el("text", { class: "in", y: -1, "text-anchor": "middle", style: n.fs < 12.5 ? `font-size:${n.fs}px` : "" }, n.lab).textContent = n.short;
        el("text", { class: "in num", y: 13, "text-anchor": "middle" }, n.lab).textContent = n.val.num;
      } else {
        n.lines.forEach((line, i) => { el("text", { class: "lab", y: (n.R + 14 + i * 14).toFixed(1), "text-anchor": "middle" }, n.lab).textContent = line; });
      }
      n.el.setAttribute("aria-label", `${n.name}: ${n.val ? n.val.text : "no figure found"}`);
    });
  }
  labelNodes();

  // move every bubble, title and arrow from where it is to where the layout now puts it
  let frame = 0;
  function settle(ms) {
    cancelAnimationFrame(frame);
    if (STILL || document.hidden) ms = 0;
    const from = nodes.map(n => [n.x, n.y, n.r]), tf = CLUSTERS.map(c => [+c.title.getAttribute("x"), +c.title.getAttribute("y")]), t0 = performance.now();
    const step = now => {
      const k = ms ? Math.min(1, Math.max(0, (now - t0) / ms)) : 1, e = 1 - Math.pow(1 - k, 3);
      nodes.forEach((n, i) => {
        n.x = from[i][0] + (n.tx - from[i][0]) * e; n.y = from[i][1] + (n.ty - from[i][1]) * e; n.r = from[i][2] + (n.R - from[i][2]) * e;
        n.circle.setAttribute("r", n.r.toFixed(1));
        n.place();
      });
      CLUSTERS.forEach((c, i) => { c.title.setAttribute("x", (tf[i][0] + (c.titleX - tf[i][0]) * e).toFixed(1)); c.title.setAttribute("y", (tf[i][1] + (c.titleY - tf[i][1]) * e).toFixed(1)); });
      links.forEach(l => l.draw());
      if (k < 1) frame = requestAnimationFrame(step);
    };
    step(t0);
  }

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
          ${measure.id === "ties" ? "" : `<p class="wp-small"><span class="wp-lbl">Bubble size · ${esc(measure.pill)}</span>${valueLine(n)}</p>`}
          <p class="wp-small">${n.deg} documented ${n.deg === 1 ? "tie" : "ties"} to other organisations.${filt} <a href="#a-${esc(n.id)}">Open the full profile</a></p>
        </div>
        <div class="wp-ties">${tieBlock("Arrows going out to", out, true)}${tieBlock("Arrows coming in from", inc, false)}${here.length ? `<div><h3>People with a role or interest here (${here.length})</h3><ul>${here.map(r => roleItem(r, true)).join("")}</ul></div>` : ""}</div>`;
    } else if (s) {
      const c = C.get(s.id), ids = new Set(c.nodes.map(n => n.id));
      const out = count(t => ids.has(t.from) && !ids.has(t.to) && inFam(t)), inc = count(t => !ids.has(t.from) && ids.has(t.to) && inFam(t)), within = count(t => ids.has(t.from) && ids.has(t.to) && inFam(t));
      const about = document.querySelector(`#cat-${c.cat} .oneline`);
      const top = c.nodes.filter(n => n.deg).sort((a, b) => b.deg - a.deg || a.name.localeCompare(b.name)).slice(0, 8);
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
  const setText = (id, v) => { const x = $(id); if (x) x.textContent = v; };
  /* ---------- the size selector: what a bubble's size stands for ---------- */
  const sizePills = $("webSize"), sizeScale = $("webSizeScale"), sizeAbout = $("webSizeAbout");
  // one actor's figure in words, with when, where from and a link
  function valueLine(n) {
    const v = n.val;
    if (!v) return "No figure found for this measure. That is not zero, and it does not mean the organisation is small.";
    return `${tidy(sentence(cap(v.text) + (v.est ? " (estimate)" : "")))} ${tidy(cap([v.basis, v.when].filter(Boolean).join(", ")))}${v.basis || v.when ? ". " : ""}${v.note ? tidy(sentence(v.note)) + " " : ""}${srcLink(v.url, v.srcTitle || "Source")}`;
  }
  // the scale is drawn at the size the map is shown, so its circles match the bubbles
  function drawScale() {
    if (!sizeScale) return;
    const k = svg.getBoundingClientRect().width / W || 1;
    const dot = (r, label, cls) => { const d = Math.max(4, 2 * r * k + 3); return `<li><svg width="${d.toFixed(1)}" height="${d.toFixed(1)}" viewBox="${-d / 2} ${-d / 2} ${d} ${d}" aria-hidden="true"><circle r="${(r * k).toFixed(1)}" class="${cls || ""}"/></svg>${esc(label)}</li>`; };
    sizeScale.innerHTML = measure.ticks.map(t => dot(measure.r(t[0]), t[1])).join("")
      + (measure.id === "influence" ? dot(measure.r(0), "no one named") : "")
      + (nodes.some(n => n.unk) ? dot(R_UNKNOWN, "no figure found", "unk") : "");
  }
  function renderSize() {
    const known = nodes.filter(n => !n.unk), k = measure.id === "influence" ? known.reduce((a, n) => a + n.val.v, 0) : known.length;
    Array.from(sizePills.querySelectorAll("button")).forEach(b => b.setAttribute("aria-pressed", b.dataset.v === measure.id ? "true" : "false"));
    setText("webSizeKey", measure.key);
    setText("webSizeKeyFull", measure.keyText);
    setText("webSizeNote", measure.note(k));
    drawScale();
    if (!sizeAbout) return;
    const listed = measure.id === "ties" || measure.id === "sources" ? [] : known.filter(n => n.val.v > 0), missing = nodes.filter(n => n.unk);
    sizeAbout.innerHTML = `<p class="web-sub">${tidy(measure.about)}${measure.id === "influence" ? ` ${srcLink(T100.url, "The list at TIME")}` : ""}</p>`
      + (listed.length ? `<div class="web-sizelist">${CLUSTERS.filter(c => listed.some(n => n.cat === c.cat)).map(c =>
        `<div><h3 style="color:${c.color}">${tidy(c.label)}</h3><ul>${listed.filter(n => n.cat === c.cat).sort((a, b) => a.name.localeCompare(b.name)).map(n =>
          `<li><button type="button" class="web-jump" data-node="${esc(n.id)}"><i style="background:${c.color}"></i>${tidy(n.name)}</button><span>${valueLine(n)}</span></li>`).join("")}</ul></div>`).join("")}</div>` : "")
      + (missing.length ? `<p class="note"><b>No figure found for ${missing.length} actors:</b> ${missing.map(n => tidy(n.short)).join(", ")}.</p>` : "");
  }
  function setSize(id, ms) {
    measure = measureById.get(id) || measure;
    sizeNodes();
    layout();
    labelNodes();
    settle(ms);
    renderSize();
    renderPanel();
  }
  if (sizePills) {
    sizePills.innerHTML = MEASURES.map(m => `<button type="button" data-v="${m.id}" aria-pressed="${m === measure}">${esc(m.pill)}</button>`).join("");
    sizePills.addEventListener("click", e => { const b = e.target.closest("button"); if (b && b.dataset.v !== measure.id) setSize(b.dataset.v, 650); });
  }
  if (sizeAbout) sizeAbout.addEventListener("click", e => { const b = e.target.closest("button[data-node]"); if (b) { select({ type: "node", id: b.dataset.node }, true); svg.scrollIntoView({ block: "center", behavior: STILL ? "auto" : "smooth" }); } });
  if (window.ResizeObserver) new ResizeObserver(drawScale).observe(svg);
  // text is measured to lay the map out, so lay it out again once the web fonts have arrived
  const probe = () => textW("in", "OpenAI Anthropic") + textW("lab", "Coefficient Giving");
  const before = probe();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
    widths.clear();
    if (Math.abs(probe() - before) < 0.5) return;
    CLUSTERS.forEach(c => { c.tw = textW("ctitle", c.titleText); });
    setSize(measure.id, 0);
  });

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
  const scale = $("webScale");
  if (scale) {
    const h = w => Math.max(14, Math.ceil(w) + 2);
    const row = (w, label, faint) => `<li><svg viewBox="0 ${-h(w) / 2} 34 ${h(w)}" style="height:${h(w)}px" aria-hidden="true"><path d="M1 0h32" stroke-width="${w}"/>${faint ? '<text x="17" y="4.4" text-anchor="middle" class="k-sign faint">$</text>' : ""}</svg><span>${label}</span></li>`;
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
  // pointing at a bubble says what it is and what its size stands for under the chosen measure
  function nodeTipHtml(n) {
    const c = C.get(n.cat), v = n.val, where = v ? [v.basis, v.when].filter(Boolean).join(", ") : "";
    const fig = `<li><span>${esc(measure.pill)}<small>${v ? tidy(sentence(cap(v.text) + (v.est ? " (estimate)" : ""))) + (where ? " " + tidy(sentence(cap(where))) : "") : "Not zero, and not a sign that the organisation is small."}</small></span>${v ? `<strong>${esc(v.num)}</strong>` : "<em>no figure found</em>"}</li>`;
    const ties = measure.id === "ties" ? "" : `<li><span>Documented ties</span><strong>${n.deg}</strong></li>`;
    return `<b>${tidy(n.name)}</b><span class="tip-grp"><i style="background:${c.color}"></i>${tidy(c.label)} · ${tidy(n.data.subtype)}</span><ul>${fig}${ties}</ul><span class="tip-more">Select the bubble for its ties and sources.</span>`;
  }
  function showNodeTip(n, e) {
    if (tipLink) { tipLink.el.classList.remove("hot"); tipLink = null; }
    tip.innerHTML = nodeTipHtml(n);
    tip.hidden = false;
    moveTip(e);
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
    if (tip.hidden) return;
    if (tipLink) tipLink.el.classList.remove("hot");
    tipLink = null;
    tip.hidden = true;
  }
  const linkAt = e => { const h = e.target.closest && e.target.closest(".hit"); return h ? links[+h.getAttribute("data-link")] : null; };
  svg.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || drag) return;
    const n = nodeAt(e), l = n ? null : linkAt(e);
    if (n) showNodeTip(n, e); else if (l) showTip(l, e); else hideTip();
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
  renderSize();
  renderPanel();
})();
