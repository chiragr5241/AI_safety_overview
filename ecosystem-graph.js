/* The interactive map at the top of ecosystem.html.
   Bubbles are actors, grouped by category and set out in the order the zoomed-in field is read. Arrows are documented ties, drawn from -> to.
   Bubble size is chosen by the reader: people employed (the default), one yearly money figure, names on a published list of
   influential people, documented ties, or sources cited. The figures and their sources are in size-data.js. An actor with no
   figure under the chosen measure is drawn as a small dashed ring: unknown is not shown as small, and never as zero.
   Arrows that carry money (investment, grants, donations, credits) show a small money sign moving from giver to receiver, and their
   width is the largest single amount stated on the tie, one step wider for every tenfold increase, with larger steps for the
   larger sums. Amounts are never summed.
   A money tie with no disclosed amount is drawn thin with a fainter sign. Every other arrow is a plain line.
   People are not bubbles. A named person with a role or interest in two organisations is drawn as a dotted link between them,
   and every person can be found in the map's search box, alongside the actors and groups.
   The map has two zoom levels. The first is the whole industry. Zooming in opens up the AI safety field: every entry on the AISafety.com
   field map takes the plate in that map's own categories, the groups from the industry map that it does not list move to a band underneath,
   and arrows are added for the money that four public grant records show passing between the bubbles. From there the plate itself zooms and pans.
   Needs ecosystem-data.js (window.ECOSYSTEM), size-data.js (window.ECO_SIZE) and the helpers the page script exports as window.ECO_UI.
   field-data.js (window.FIELD) is optional: without it the map stays at the first level. */
(function () {
  "use strict";
  const D = window.ECOSYSTEM, U = window.ECO_UI, F = window.FIELD || null, svg = document.getElementById("webStage");
  if (!D || !U || !svg) return;
  const NS = "http://www.w3.org/2000/svg", W = 1080, H0 = 870;
  let H = H0;   // the plate grows taller when a measure draws bubbles too large for the usual height
  let level = 0;   // 0 is the whole industry, 1 is zoomed into the AI safety field
  // The map is drawn in a frame on the page, and the view is the part of the plate that the frame shows. The view always has the frame's own
  // shape. At its widest it holds the whole plate, which is zoom 1; at its closest it is W / ZMAX wide.
  // For the whole industry the frame fits in the window, so all of it is seen at once. Zoomed into the field the frame grows downwards
  // until the whole field is in it at full width, and the page under the map moves down to make room; zooming back out brings it up again.
  // Zoomed into the field the frame can also be made shorter again, down to the height that fits the window, which draws the whole field
  // small enough to be seen at once: fieldF is how much of its full height the frame has, and 1 is the height the field opens at.
  const cam = { x: 0, y: 0, w: W, h: H0 }, view = { ar: W / H0 }, own = { w: 0, h: 0, vh: 0 }, ZMAX = 5;
  let zoom = 1, fieldF = 1;
  let boxing = null;   // the frame's change of height while it is under way: { h0, h1, w } in page pixels, with how far the page comes up
  const easeOut = k => 1 - Math.pow(1 - k, 3), easeInOut = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(2 - 2 * k, 3) / 2;
  const LEVEL_MS = 1100;   // how long a change of zoom level takes
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
    role_regrantor: "people", role_funder: "people", disclosed_investment: "people", grants_on_record: "grants", company_money: "corp" };
  const EXT_LABEL = { access_in_kind: "Model access in kind", commissioned_work: "Commissioned work", access_mou: "Access under a voluntary MoU", compute_credits: "Compute credits",
    grant_paid: "Grant or gift, paid", grant_recommended: "Grant, recommended", political_contribution: "Political contribution", role_board: "Board or committee seat",
    role_adviser: "Adviser", role_former: "Former role", role_executive: "Executive", role_staff: "Staff role", role_regrantor: "Regrantor", role_funder: "Funder",
    disclosed_investment: "Disclosed investment" };
  const FAMS = U.FAMILIES.concat([
    { id: "access", label: "Access and contracts", blurb: "What evaluators and training programmes receive from the labs: model access, compute credits and commissioned work. The executed agreements, with any limits on publication, were not obtained." },
    { id: "corp", label: "Company money", blurb: "Money leaving an AI company, an investor or a company foundation for work outside the companies: grants, fellowships, pooled funds, credits and political donations. Zoomed in, this adds what the companies have announced for safety research and fellowships. Most figures are commitments from the company's own announcement and not confirmed payments. What a company spends on its own safety teams is not published, so it is not on the map." },
    { id: "people", label: "People and interests", blurb: "Each dotted link joins two organisations where the same named person holds a documented role or a disclosed investment. That establishes an interest, not a motive, and it is not control." }
  ]);
  const famOf = t => EXT_FAM[t.type] || U.famOf[t.type];
  // Ties where money, or credit with a stated money value, moves in the direction of the arrow. Supply and lobbying are left out:
  // there the payment runs the other way, or to third parties.
  const MONEY = new Set(["equity_investment", "grant_recommendation", "philanthropic_support", "philanthropic_or_public_support", "research_grant",
    "matching_offer", "restricted_policy_donation", "grant_paid", "grant_recommended", "political_contribution", "compute_credits", "grants_on_record", "company_money"]);
  // Amounts on the map run from tens of thousands to tens of billions, so width goes up one step per power of ten.
  // The steps grow as the sums do, so the big sums stand clear of the small ones. The widths were set by the author.
  const STEPS = ["under 100k", "100k to 1m", "1m to 10m", "10m to 100m", "100m to 1bn", "1bn to 10bn", "10bn or more"];
  const stepOf = v => Math.max(0, Math.min(STEPS.length - 1, Math.floor(Math.log10(v)) - 4));
  const WIDTHS = [2.34, 3.71, 5.07, 6.8, 13.5, 18, 25];
  const widthOf = step => WIDTHS[step];
  const W_PLAIN = 1.1, W_UNKNOWN = 1.4, W_WIDE = 5.5, W_BROAD = 12;   // from W_WIDE up, the arrowhead grows with the line; from W_BROAD up it grows more slowly
  const headOf = w => w >= W_BROAD ? "wmx" : w >= W_WIDE ? "wmw" : "wm";
  // How far the head's point reaches past the end of the line. The line ends inside the wide part of the head, so its square end never shows beside the point.
  const tipOf = w => w >= W_BROAD ? w * 1.35 : w >= W_WIDE ? w * 1.6 : 8;
  const STILL = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const typeLabel = t => t.flow ? flowLabel(t.flow) : t.corp ? KIND[t.corp.kind] : EXT_LABEL[t.type] || U.typeLabel(t.type);

  // One cluster per category. Colour marks the group; arrows take the colour of the group they start from.
  // The anchors set the groups out in the order the zoomed-in field is read, so that zooming in opens the map up where it stands and
  // does not deal it out again: funders and research along the top, as the field's funding and research rows are; the developers,
  // public bodies and advocacy under them, as capabilities research, governance and advocacy are; then the talent pipeline and the
  // critical voices, as training and the media rows are; and along the bottom the groups the field map does not list, where the band
  // for the rest of the industry sits when zoomed in.
  const C0 = [
    { cat: 3, label: "Frontier developers", color: "#F3F6F8", x: 330, y: 345 },
    { cat: 2, label: "Cloud and energy", color: "#7CCBFF", x: 620, y: 760 },
    { cat: 1, label: "Chip supply chain", color: "#4F9DFF", x: 370, y: 760 },
    { cat: 4, label: "Capital", color: "#F7A93B", x: 870, y: 760 },
    { cat: 5, label: "Safety funders", color: "#2EE6C8", x: 220, y: 110 },
    { cat: 6, label: "Research and think tanks", color: "#C6E86B", x: 760, y: 120 },
    { cat: 10, label: "Talent pipeline", color: "#E6F2A8", x: 120, y: 560 },
    { cat: 9, label: "Critical voices and the public", color: "#FF8A70", x: 800, y: 555 },
    { cat: 11, label: "Standards, insurers and users", color: "#F3C9A2", x: 130, y: 770 },
    { cat: 7, label: "Public authority", color: "#B79CFF", x: 640, y: 345 },
    { cat: 8, label: "Advocacy and political money", color: "#FF6FB1", x: 930, y: 345 }
  ];
  // Zoomed in, there is one cluster per category on the AISafety.com map. Where a category lines up with a group on the industry map
  // it keeps that group's colour, so a bubble that sits on both maps does not change colour. The one-line descriptions are this map's own.
  const FIELD_CATS = {
    funding: ["#2EE6C8", "Funds, grantmakers and donor advisers that pay for AI safety work, and guides to them."],
    empirical_research: ["#C6E86B", "Groups that run experiments on AI systems: evaluations, interpretability, control and robustness."],
    conceptual_research: ["#6FCF97", "Groups and individual researchers working on the theory of alignment and agency."],
    strategy: ["#F2D15C", "Research on how the arrival of advanced AI could go, and what would make it go well."],
    forecasting: ["#FFB86B", "Forecasters and trackers of AI progress and its effects."],
    research_support: ["#7CCBFF", "Offices, fiscal sponsors, operations and other services that safety researchers rely on."],
    capabilities_research: ["#F3F6F8", "Companies that build frontier AI systems. The field map lists them because they also run safety teams."],
    governance: ["#B79CFF", "Policy institutes, public bodies and standards work on how AI is governed."],
    advocacy: ["#FF6FB1", "Campaigns and groups that press governments, companies or the public to act."],
    training_and_education: ["#E6F2A8", "Fellowships, courses and bootcamps that bring people into the field."],
    career_support: ["#F3C9A2", "Advice, job boards and coaching for people moving into AI safety work."],
    blog: ["#FF8A70", "Blogs that follow AI safety."],
    newsletter: ["#FFA98F", "Newsletters that follow AI safety."],
    podcast: ["#E58FB0", "Podcasts that cover AI safety."],
    video: ["#FF9F68", "Video channels that cover AI safety."],
    resource: ["#9CB6FF", "Reference sites, forums, tools and directories."],
    company_programmes: ["#DCE6EE", "Grant funds and fellowships that an AI company or its foundation has announced for work outside the company. This map added them from the companies' own announcements. They are not entries on the AISafety.com map."],
    gone: ["#8A94A6", "Projects the field map marks as no longer active. They stay on record because grants to them do."]
  };
  const C1F = F ? F.cats.map(c => ({ cat: "f-" + c.id, fid: c.id, label: c.label, color: (FIELD_CATS[c.id] || ["#A3B5C1", ""])[0], about: (FIELD_CATS[c.id] || ["", ""])[1], field: true, x: 0, y: 0 })) : [];
  const EVERY = C0.concat(C1F);
  let CLUSTERS = C0;   // the clusters on the plate at the current zoom level
  const C = new Map(EVERY.map(c => [c.cat, c]));
  const catKey = k => C.has(+k) ? +k : k;   // a group's key as read back from an attribute

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
  const base = D.nodes.filter(n => !personById.has(n.id)).map(n => {
    const short = SHORT[n.id] || n.name;
    return { id: n.id, name: n.name, short, lines: wrap(short), cat: n.cat, deg0: deg.get(n.id) || 0, deg: deg.get(n.id) || 0, data: n };
  });
  const byId = new Map(base.map(n => [n.id, n]));
  // The AI safety field. An entry that is the same organisation as a bubble on the industry map is attached to that bubble; every other entry is a new bubble.
  const catLabel = new Map(F ? F.cats.map(c => [c.id, c.label]) : []), fieldNodes = [];
  if (F) F.entries.forEach(e => {
    const own = e.node ? byId.get(e.node) : null;
    if (own) { own.entry = e; own.fcat = e.cats[0]; return; }
    const n = { id: e.id, name: e.name, short: e.short, lines: wrap(e.short), cat: 0, fcat: e.cats[0], deg0: 0, deg: 0, field: true, entry: e, x: 0, y: 0, r: 0, R: 0,
      data: { subtype: e.cats.map(c => catLabel.get(c)).join(", "), country: "", stake: e.desc, sources: [] } };
    n.c = C.get("f-" + n.fcat);
    fieldNodes.push(n);
    byId.set(n.id, n);
  });
  const all = base.concat(fieldNodes);
  let nodes = base;   // the bubbles on the plate at the current zoom level
  // Money between bubbles in the public grant records. One tie per funder's record per recipient: its amount is that record's total for that recipient.
  const FLOWS = F ? F.flows.filter(f => byId.has(f.from) && byId.has(f.to)) : [];
  const FLOW_TIES = FLOWS.map((f, i) => ({ id: "G" + (i + 1), from: f.from, to: f.to, type: "grants_on_record", amount: f.total || null, currency: "USD", date: "", status: "", field: true, flow: f }));
  // Money that AI companies and their foundations have announced for work outside the company: one tie to an announcement, each with its own source.
  const KIND = { grant: "Grant", commitment: "Commitment announced", credits: "Credits committed", equity: "Equity investment", pool: "Share of a joint fund, not stated", open: "Programme funded, budget not published" };
  const CORP_TIES = F ? (F.company || []).filter(c => byId.has(c.from) && byId.has(c.to)).map((c, i) =>
    ({ id: "K" + (i + 1), from: c.from, to: c.to, type: "company_money", amount: c.amount, currency: c.currency, date: c.date, status: c.what, field: true, corp: c })) : [];
  const FIELD_TIES = FLOW_TIES.concat(CORP_TIES);
  const CIN = new Map(), COUT = new Map();
  CORP_TIES.forEach(t => { if (!CIN.has(t.to)) CIN.set(t.to, []); CIN.get(t.to).push(t); if (!COUT.has(t.from)) COUT.set(t.from, []); COUT.get(t.from).push(t); });
  const NFIELD = F ? F.entries.filter(e => !e.own).length : 0, NSHARED = base.filter(n => n.entry).length;   // entries on the AISafety.com map, and how many are also industry-map bubbles
  // the "Company money" filter: ties from a company announcement, and money ties in the base map that leave a company, an investor or a company foundation
  const COMPANY = new Set(base.filter(n => n.cat >= 1 && n.cat <= 4).map(n => n.id)), GIVER = new Set(Array.from(COMPANY).concat(["foundation", "fmf", "aisf"]));
  const isCorp = t => !!t.corp || (MONEY.has(t.type) && GIVER.has(t.from) && !COMPANY.has(t.to));
  all.forEach(n => { n.deg1 = n.deg0; });
  FIELD_TIES.forEach(t => { byId.get(t.from).deg1++; byId.get(t.to).deg1++; });
  const recOf = f => F.records[f.src];
  const yrs = f => f.first === f.last ? f.first : `${f.first} to ${f.last}`;
  const UNIT = { cg: "listed", sff: "recommended", ltff: "paid out", eaif: "paid out" };
  function flowLabel(f) {
    return f.src === "manifund" ? `${f.n} project ${f.n === 1 ? "page" : "pages"} funded, ${yrs(f)}` : `${f.n} ${f.n === 1 ? "grant" : "grants"} ${UNIT[f.src] || "on record"}, ${yrs(f)}`;
  }
  const GIN = new Map(), GOUT = new Map();
  FLOWS.forEach(f => { if (!GIN.has(f.to)) GIN.set(f.to, []); GIN.get(f.to).push(f); if (!GOUT.has(f.from)) GOUT.set(f.from, []); GOUT.get(f.from).push(f); });
  const pairs = new Map();
  ORG_EDGES.concat(FIELD_TIES).forEach(e => {
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
  pairs.forEach(l => { l.twin = l.s.id > l.t.id && pairs.has(l.t.id + ">" + l.s.id); });   // the second of two arrows that run opposite ways between one pair
  const nInter = shared.size;
  C0.forEach(c => { c.ax = c.x; c.ay = c.y; });
  // Which bubbles and groups are on the plate, and which group each bubble sits in, at the current zoom level.
  function assign() {
    nodes = level ? all : base;
    nodes.forEach(n => { n.c = level && n.fcat ? C.get("f-" + n.fcat) : n.field ? n.c : C.get(n.cat); n.deg = level ? n.deg1 : n.deg0; });
    EVERY.forEach(c => { c.nodes = []; });
    nodes.forEach(n => n.c.nodes.push(n));
    CLUSTERS = (level ? C1F.concat(C0) : C0).filter(c => c.nodes.length);
    CLUSTERS.forEach(c => { c.titleText = `${c.label} · ${c.nodes.length}`; c.tw = textW("ctitle", c.titleText); });
  }

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
      about: "Employees or staff, from a company filing or annual report where there is one, from a US nonprofit's tax filing, from the organisation's own team page for small research groups, and from a press report or an outside tracker for private companies that publish nothing. Each line says which. Groups of many organisations, and bodies such as a committee or a legislature, have no single headcount and are left as not stated." },
    { id: "money", pill: "Money (revenue or budget)", key: "size = yearly revenue or budget", unit: "a year", log: true,
      keyText: "money through the organisation in a year: revenue for a company, budget or funding for others; each step up in size is ten times more",
      of: moneyOf(S.money),
      r: v => Math.max(6, 6 + 5.4 * (Math.log10(v) - 6)) * lift(v), ticks: [[1e6, "1m"], [1e9, "1bn"], [1e11, "100bn a year, in US dollars"]],
      note: k => `Bubble size shows money through each actor in a year: revenue for a company, expenses or budget for a nonprofit or public body, safety funding given for a funder, receipts for a political committee. It is not what the actor is worth, which is the next measure along. These are unlike kinds of money, set side by side and never added up. Each step in size is ten times more, and the steps are larger above 10bn so the biggest sums stand clear. ${k} of the ${nodes.length} actors have a figure, and a dashed ring means none was found. Financing rounds and multi-year totals are left out. Size here is not influence.`,
      about: "One figure per actor, covering a year or less. Microsoft's figure of about USD 332bn, for example, is its revenue for fiscal 2026, not its value on the stock market. Figures already in this page's financial observations are reused as stated. The rest come from company filings, tax filings and budget documents collected on 5 and 6 October 2026. A figure in another currency is shown as stated and placed on the scale at a rough exchange rate. Company revenue covers the whole business, not its AI or safety work." },
    { id: "worth", pill: "Money (worth)", key: "size = what it is worth", unit: "", log: true,
      keyText: "what the organisation is worth on paper: stock-market value for a listed company, the latest round's valuation for a private one; each step up in size is ten times more",
      of: moneyOf(S.worth),
      r: v => Math.max(6, 12.5 + 9 * (Math.log10(v) - 10)) * lift(v), ticks: [[1e10, "10bn"], [1e11, "100bn"], [1e12, "1tn, in US dollars"]],
      note: k => `Bubble size shows what each actor is worth on paper: the stock-market value of a listed company on 5 or 6 October 2026, or the valuation set at a private company's latest financing round. A share price moves every day and a private valuation is agreed by a few investors, so the two are not like for like, and neither is cash, revenue or spending. Each step in size is ten times more, and the steps are larger above 10bn so the biggest sums stand clear. ${k} of the ${nodes.length} actors have a figure. Nonprofits, public bodies and units inside a larger company have no market value and are dashed rings. Size here is not influence.`,
      about: "Stock-market value for listed companies, read on 5 and 6 October 2026 from a public tracker, and the valuations of private companies already recorded in this page's financial observations, with Mistral's added from press reports of its September 2026 round and Goodfire's from the announcement of its February 2026 round. Two entries are not valuations of the actor itself and say so: the OpenAI Foundation's figure is the implied value of its stake in OpenAI, and Temasek's is the value of what it holds. A company's worth covers its whole business, not its AI or safety work." },
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
      about: "Counted from the source list attached to each actor in the base dataset. An actor with few sources is one this version documents lightly." },
    // the two measures below exist only when the map is zoomed into the AI safety field
    { id: "gin", field: true, pill: "Grants received", key: "size = grants received", unit: "", log: true,
      keyText: "the largest total that any one funder's public record lists for the organisation; each step up in size is ten times more",
      of: n => {
        // one candidate for each funder's record, each company announcement and, for a joint programme, its stated size; the largest is drawn
        const c = (GIN.get(n.id) || []).filter(f => f.total > 0).map(f => ({ v: f.total, text: `USD ${big(f.total)} from ${byId.get(f.from).short}: ${flowLabel(f)}`, short: `${byId.get(f.from).short} USD ${big(f.total)}`, basis: recOf(f).title, url: recOf(f).url }))
          .concat((CIN.get(n.id) || []).filter(t => t.amount && (t.corp.kind === "grant" || t.corp.kind === "commitment")).map(t => ({ v: t.amount, text: `USD ${big(t.amount)} from ${byId.get(t.from).short}: ${KIND[t.corp.kind].toLowerCase()}, ${U.fmtDate(t.date)}`, short: `${byId.get(t.from).short} USD ${big(t.amount)}`, basis: t.corp.src.title, url: t.corp.src.url })))
          .concat(n.entry && n.entry.stated ? [{ v: n.entry.stated.v, text: n.entry.stated.text, short: "", basis: n.entry.src.title, url: n.entry.src.url }] : [])
          .sort((a, b) => b.v - a.v);
        if (!c.length) return null;
        const rest = c.slice(1).filter(x => x.short);
        return { v: c[0].v, num: "$" + big(c[0].v), text: c[0].text, when: "", basis: c[0].basis, est: false,
          note: rest.length ? `Other sources list money for it: ${rest.map(x => x.short).join(", ")}. They are not added together` : "", url: c[0].url };
      },
      r: v => Math.max(4.5, 4.5 + 4.3 * (Math.log10(v) - 3)), ticks: [[1e4, "10k"], [1e6, "1m"], [1e8, "100m, in US dollars"]],
      note: k => `Bubble size shows the most money that any one funder's public record lists for the organisation, on a scale where each step is ten times more. Four records are read: Coefficient Giving's AI fund list, the Survival and Flourishing Fund's recommendations, the two Effective Altruism Funds payout lists and Manifund's project pages. They cover different years and different kinds of money (listed, recommended, paid out, raised), and one funder's grant can be passed on by another, so the records are not added together. A company's announced grant or commitment counts in the same way, as one more source. ${k} of the ${nodes.length} bubbles have a figure. A dashed ring means no grant in these records, which is not the same as no funding: company revenue, government budgets and most private gifts are in none of them. Size here is not influence.`,
      about: "For each organisation, the map takes one funder's record at a time and adds up the rows in that record that name the organisation, over all the years the record covers. The bubble shows the largest of those totals. A recipient is matched by its name or by the web address the record links to. A grant to a university counts for a lab there only where the record names the lab. Grants to individuals are left out, because people are not bubbles on this map." },
    { id: "gout", field: true, pill: "Grants given", key: "size = grants given", unit: "", log: true,
      keyText: "what a funder's own public record lists for organisations on this map; each step up in size is ten times more",
      of: n => {
        const fs = (GOUT.get(n.id) || []).filter(f => f.total > 0);
        if (fs.length) {
          const r = recOf(fs[0]), v = fs.reduce((a, f) => a + f.total, 0);
          return { v, num: "$" + big(v), text: `USD ${big(v)} to ${fs.length} ${fs.length === 1 ? "organisation" : "organisations"} on this map`, when: "", basis: r.title, est: false,
            note: `The whole record holds ${r.rows} rows worth USD ${big(r.listed)}; the rest goes to individuals and to organisations that are not on this map`, url: r.url };
        }
        // a company has no grant record, only announcements, and separate announcements are not added together: the largest one is drawn
        const cs = (COUT.get(n.id) || []).filter(t => t.amount).sort((a, b) => b.amount - a.amount);
        if (!cs.length) return null;
        const t = cs[0];
        return { v: t.amount, num: "$" + big(t.amount), text: `Largest single amount announced: USD ${big(t.amount)} to ${byId.get(t.to).short} (${KIND[t.corp.kind].toLowerCase()}, ${U.fmtDate(t.date)})`, when: "", basis: t.corp.src.title, est: false,
          note: cs.length > 1 ? `Other announcements on this map: ${cs.slice(1).map(x => `USD ${big(x.amount)} to ${byId.get(x.to).short}`).join(", ")}. They are not added together` : "", url: t.corp.src.url };
      },
      r: v => Math.max(6, 9 + 7 * (Math.log10(v) - 6)), ticks: [[1e6, "1m"], [1e7, "10m"], [1e9, "1bn, in US dollars"]],
      note: k => `Bubble size shows what a funder gives to bubbles on this map. For the five funders with a public grant record it is that record's total for organisations shown here, which is part of what each one gives. For an AI company or its foundation it is the largest single amount it has announced for outside work, because separate announcements are not added together and most are commitments, not payments. ${k} bubbles have a figure. Every other bubble is a dashed ring, which says only that no record or announcement was read for it. Size here is not influence.`,
      about: "Five funders publish a record that this map reads row by row: Coefficient Giving (its AI fund only), the Survival and Flourishing Fund, the Long-Term Future Fund, the EA Infrastructure Fund and Manifund. Longview, the AI Safety Tactical Opportunities Fund, Founders Pledge, Schmidt Sciences, the Future of Life Institute, government programmes and the AI companies' own grant schemes are on the map but publish no list that was read for this version." }
  ];
  const measureById = new Map(MEASURES.map(m => [m.id, m]));
  const rUnknown = () => level ? 4.2 : 7.5;
  // ecosystem.html?size=money opens the map on that measure and ?view=field opens it zoomed into the AI safety field, so a view can be linked to
  const QS = new URLSearchParams(location.search), asked = measureById.get(QS.get("size"));
  let measure = asked && !asked.field ? asked : MEASURES[0];
  // The measure is one choice for the whole map and does not change with the zoom level. The grant measures can only be drawn zoomed in,
  // so on the way back out the map returns to the last measure that both levels share.
  let bothLevels = measure;

  // widths come from the browser, so a name is only set inside a bubble when it really fits
  const gMeasure = el("g", { visibility: "hidden", "aria-hidden": "true" }, svg), widths = new Map();
  function textW(cls, str) {
    const k = level + cls + "|" + str;   // names are set in smaller type when zoomed in, so each level keeps its own measurements
    if (!widths.has(k)) {
      const t = el("text", { class: cls }, gMeasure);
      t.textContent = str;
      widths.set(k, t.getComputedTextLength());
      gMeasure.removeChild(t);
    }
    return widths.get(k);
  }
  function sizeNodes() {
    PAD = level ? 3 : 5;
    nodes.forEach(n => {
      const val = n.val = measure.of(n);
      n.unk = !val;
      n.R = val ? measure.r(val.v) : rUnknown();
      // the name and the figure go inside when both fit across the bubble at the height they sit; a long name may be set a little smaller
      const fits = (w, dy) => n.R > dy && w <= 2 * Math.sqrt(n.R * n.R - dy * dy) - 5;
      n.fs = !val || n.R < 17 || !fits(textW("in num", val.num), 14) ? 0 : [12.5, 11.5, 10.5].find(f => fits(textW("in", n.short) * f / 12.5, 10)) || 0;
      n.inside = n.fs > 0;
      // zoomed in, every bubble is named: the larger ones at reading size, the rest in small type that zooming the plate brings up to size
      n.always = level ? true : n.inside || n.deg >= 2 || (!!val && n.R >= 12);
      n.tiny = !!level && !n.inside && !(!!val && n.R >= 11) && n.deg < 6;
      n.LH = n.tiny ? 8.5 : level ? 12 : 14;
      // a name under the bubble reserves a box so that no neighbour is placed over it
      n.lw = n.always && !n.inside ? Math.max.apply(null, n.lines.map(l => textW(n.tiny ? "lab sm" : "lab", l))) : 0;
      n.lh = n.lw ? n.LH * n.lines.length + 3 : 0;
    });
  }

  /* ---------- layout: pack each group on a spiral, then push the groups apart until none overlap ---------- */
  let PAD = 5, bandY = 0, band = null;
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
  // one group: the largest bubble in the middle, the rest on a spiral, each with room for its name
  function pack(c) {
    const list = c.nodes.slice().sort((a, b) => b.R - a.R || b.deg - a.deg || a.name.localeCompare(b.name)), placed = [];
    const sx = level ? 1.5 : 1.12, sy = level ? 0.7 : 0.9;   // zoomed in, groups are packed wider and flatter so they sit in rows
    list.forEach((n, i) => {
      n.ox = 0; n.oy = 0;
      if (i) for (let t = 1; t < 9000; t++) {
        const a = t * 0.33, d = 2 + t * 0.42, x = Math.cos(a) * d * sx, y = Math.sin(a) * d * sy;
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
  }
  // The whole industry: groups start at their anchors and are nudged apart along the shallower overlap; a weak pull keeps them near home.
  // If they still overlap at the end, the plate is made a little taller and the groups are spread down it and tried again,
  // each time leaning further towards moving groups up and down, where the new room is, and not sideways into the edges.
  function spread() {
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
  }
  // Zoomed into the AI safety field: the field's groups are set out in rows in reading order, funders first, then research, governance,
  // training and media. The groups from the industry map that the field map does not list follow in a band underneath.
  function flow() {
    const M = 10, GX = 18, GY = 14;
    let y = 30;
    const place = list => {
      const rows = [];
      let row = [], w = 0;
      list.forEach(c => {
        if (row.length && w + GX + 2 * c.hw > W - 2 * M) { rows.push(row); row = []; w = 0; }
        w += (row.length ? GX : 0) + 2 * c.hw;
        row.push(c);
      });
      if (row.length) rows.push(row);
      rows.forEach(r => {
        const total = r.reduce((a, c) => a + 2 * c.hw, 0), gap = Math.min(70, (W - 2 * M - total) / (r.length + 1));
        let x = (W - total - gap * (r.length - 1)) / 2;
        r.forEach(c => { c.x = x + c.hw; c.y = y + c.hh; x += 2 * c.hw + gap; });
        y += 2 * Math.max.apply(null, r.map(c => c.hh)) + GY;
      });
    };
    place(CLUSTERS.filter(c => c.field));
    bandY = y + 18;
    y += 34;
    // the band is read in the same order as the whole-industry map, so what is left of each group drops more or less straight down into it
    place(CLUSTERS.filter(c => !c.field).sort((a, b) => a.ay - b.ay || a.ax - b.ax));
    H = Math.ceil(y);
  }
  function layout() {
    CLUSTERS.forEach(pack);
    if (level) flow(); else spread();
    if (band) {
      band.g.classList.toggle("off", !level);
      band.line.setAttribute("d", `M10,${(bandY - 16).toFixed(1)}H${W - 10}`);
      band.text.setAttribute("y", bandY.toFixed(1));
    }
    CLUSTERS.forEach(c => {
      c.nodes.forEach(n => { n.tx = c.x + n.ox; n.ty = c.y + n.oy; });
      c.titleX = c.x; c.titleY = c.y - c.hh + 14;
    });
  }
  /* ---------- the part of the plate in view ---------- */
  // How wide the widest view is. It holds the whole plate. Zoomed into the field it is also never closer than the scale the reader has set
  // the frame to (fieldF), so a change of measure that makes the plate shorter leaves room under the map and does not draw it larger.
  const fitW = () => Math.max(W, H * view.ar, level ? W / fieldF : 0);
  const zmax = () => fitW() * ZMAX / W;
  // a view no wider than the plate stays inside it; a wider one keeps the plate in its middle
  const hold = (at, size, full) => size >= full ? (full - size) / 2 : Math.max(0, Math.min(full - size, at));
  // where on the plate a point stays put, or lands, when the zoom changes: fx and fy are fractions of the view
  function camTarget(z, px, py, fx, fy) {
    z = Math.max(1, Math.min(zmax(), z));
    const w = fitW() / z, h = w / view.ar;
    return { x: hold(px - fx * w, w, W), y: h >= H ? 0 : hold(py - fy * h, h, H), w, h };   // a plate shorter than the view sits at its top
  }
  const camFit = () => camTarget(1, W / 2, H / 2, 0.5, 0.5);
  // Where each level opens: across the full width of the plate from the top. With the frame at the height its level asks for, that is the
  // whole plate at both levels. The field is drawn closer in than the industry was, so going into it is a move towards the map.
  const homeZoom = () => level ? fitW() / W : 1;
  const camHome = () => level ? camTarget(homeZoom(), W / 2, 0, 0.5, 0) : camFit();
  function applyCam() {
    svg.setAttribute("viewBox", `${cam.x.toFixed(1)} ${cam.y.toFixed(1)} ${cam.w.toFixed(1)} ${cam.h.toFixed(1)}`);
    svg.classList.toggle("zoomed", zoom > 1.01);
    const at = $("webZoomAt"), out = $("webZoomOut"), inn = $("webZoomIn");
    // The figure is the scale the map is drawn at, against the scale at which the plate is as wide as the frame. It does not depend on how
    // tall the plate is, so it stays put when only the measure changes. It is left off where a level opens.
    // and while the map is travelling between levels, when the figure would only flicker past
    const rel = W / cam.w, opens = !!boxing || svg.classList.contains("moving") || (level ? Math.abs(rel - 1) <= 0.04 : zoom <= 1.01);
    if (at) at.textContent = (level ? "AI safety field" : "Whole industry") + (opens ? "" : " ×" + (+rel.toFixed(1)));
    const t0 = zoom <= 1.01 ? camFit() : null, moved = !!t0 && (Math.abs(t0.x - cam.x) > 1 || Math.abs(t0.y - cam.y) > 1);   // carried off its place by a drag
    if (out) { out.disabled = !level && zoom <= 1.01 && !moved; out.title = !level && moved ? "Put the map back in the middle" : level && zoom <= 1.01 ? (fieldF > frameLo() + 0.001 ? "Zoom out until the whole field fits in the window" : "Zoom out to the whole industry") : "Zoom out"; }
    if (inn) { inn.disabled = level ? zoom >= zmax() - 0.01 : !F; inn.title = level ? "Zoom in" : "Zoom into the AI safety field"; }
  }
  // how tall the frame stands for the level and for fieldF, and the least fieldF can be: the frame is never shorter than the stylesheet makes it
  const frameH = () => level ? Math.max(own.h, own.w * H / W * fieldF) : own.h;
  const frameLo = () => own.w > 0 && own.h > 0 ? Math.min(1, own.h / (own.w * H / W)) : 1;
  /* Zoomed into the field, the frame is taller than the window and the page scrolls down it. When its foot reaches the foot of the window it
     is held there, and scrolling on draws the map in until the whole field fits in the window; it stays held for a little more scrolling
     and then the page moves on. Scrolling back up runs the same thing the other way.
     None of this listens to the wheel. The frame sits in a track that is longer than the frame by the distance the reader scrolls while
     the map is held, and the browser's own sticky positioning keeps the foot of the frame at the foot of the window for that distance. The
     height of the frame is then read off how far down the track the page has got. So it works the same for a wheel, a trackpad, a touch,
     the keyboard and the scrollbar, the foot of the frame cannot wobble, and nothing under the track moves while the frame changes height. */
  const scrollBox = svg.parentNode, track = scrollBox.parentNode && scrollBox.parentNode.classList.contains("web-track") ? scrollBox.parentNode : null;
  const PIN_GAP = 16, HOLD_PX = 360;   // how far the foot of the frame is held above the foot of the window, and how long it stays held
  const tallH = () => own.w * H / W;   // the height of the frame with the whole field in it at full width
  const pinOn = () => !!track && !!track.style.height;
  // how far the page has gone past the point where the foot of the full-height frame meets the foot of the window
  const pinAt = () => (own.vh - PIN_GAP - tallH()) - track.getBoundingClientRect().top;
  const pinTop = h => { if (pinOn()) scrollBox.style.top = (own.vh - PIN_GAP - h).toFixed(1) + "px"; };
  // The whole-industry frame already fits in the window, so its track is only as much longer as the frame is held for: scrolling down the
  // page, the map stays in the window for that little while before it goes.
  function pinTrack() {
    if (!track) return;
    const tall = tallH(), lo = frameLo();
    if (!(own.w > 0) || !(own.h > 0)) { track.style.height = ""; scrollBox.style.top = ""; return; }
    track.style.height = (level && lo < 0.9995 ? tall + tall * (1 - lo) + HOLD_PX : frameH() + HOLD_PX).toFixed(1) + "px";
  }
  // The page is put where the reader's scale says it should be on the track. A change of measure changes the height of the field and with
  // it the length of the track, and this keeps the map at the scale it had.
  // held says the foot of the frame was being held at the foot of the window before the change, and then it still is afterwards.
  function pinSync(held) {
    if (!pinOn()) return;
    const tall = tallH(), lo = frameLo(), out = tall * (1 - lo), at = pinAt();
    const want = fieldF >= 0.9995 ? (held ? 0 : Math.min(at, 0))
      : fieldF > lo + 0.0005 ? tall * (1 - fieldF)
      : held ? Math.max(out, Math.min(out + HOLD_PX - 1, at)) : Math.max(at, out);
    if (Math.abs(want - at) > 0.5) window.scrollBy(0, want - at);
  }
  // The track is taken away again, as it is on the way out to the whole industry. If the frame was being held part of the way down it, the
  // page is moved up by the same distance, so the map does not jump in the window.
  function pinClear() {
    if (!pinOn()) return;
    const held = scrollBox.getBoundingClientRect().top - track.getBoundingClientRect().top;
    track.style.height = ""; scrollBox.style.top = "";
    if (held > 0.5) window.scrollBy(0, -held);
  }
  // the reader's scale for the field, read off how far down the track the page is
  let scaleSoon = 0;
  function pinScroll() {
    if (!level || boxing || !pinOn()) return;
    const tall = tallH(), lo = frameLo(), at = pinAt();
    const f = at <= 0 ? 1 : at < tall * (1 - lo) ? 1 - at / tall : Math.min(fieldF, lo);
    if (Math.abs(f - fieldF) < 0.0003) return;
    const wide = zoom <= 1.01, cx = cam.x + cam.w / 2, cy = cam.y + cam.h / 2, w0 = cam.w;
    fieldF = f;
    const h = frameH();
    svg.style.height = h.toFixed(1) + "px";
    pinTop(h);
    view.ar = own.w / h;
    const t = wide ? camFit() : camTarget(fitW() / w0, cx, cy, 0.5, 0.5);
    cam.x = t.x; cam.y = t.y; cam.w = t.w; cam.h = t.h; zoom = fitW() / cam.w;
    applyCam();
    clearTimeout(scaleSoon);
    scaleSoon = setTimeout(drawScale, 140);
  }
  window.addEventListener("scroll", pinScroll, { passive: true });
  // zoomed into the field the frame has a height of its own, so a change in the height of the window does not reach it by itself
  window.addEventListener("resize", () => { if (level && !boxing && window.innerHeight !== own.vh) reframe(false); });
  // After a new layout, or when the window changes, the frame and the view are set again. The frame takes the height its level asks for:
  // the stylesheet's own for the whole industry, and as tall as the whole field needs at full width when zoomed in. The view goes to where
  // the level opens if asked; otherwise the widest view stays the widest and a closer one keeps its middle and its scale as far as it can.
  // Given a time, the frame and the view travel there together, and the frame grows or shrinks from its bottom edge.
  // lift is how far the page has to come up for the frame to be back under the zoom strip: on the way out from far down the field the page
  // travels that far in the same steps as the frame shortens, so the two arrive together and the map does not slide about under the reader.
  function reframe(home, ms, ease, lift) {
    const held = pinOn() && Math.abs(svg.getBoundingClientRect().bottom - (own.vh - PIN_GAP)) < 3;
    const keep = svg.style.height;
    svg.style.height = "";
    const box = svg.getBoundingClientRect(), bw = box.width, bh = box.height;
    svg.style.height = keep;
    own.w = bw; own.h = bh; own.vh = window.innerHeight;   // the frame as the stylesheet sizes it
    // the reader's scale for the field is kept as it is: only zooming changes it, never a change of measure, tie filter or window
    const sized = bw > 0 && bh > 0, h0 = sized ? (keep ? parseFloat(keep) : bh) : 0, h1 = sized ? frameH() : 0;
    const cx = cam.x + cam.w / 2, cy = cam.y + cam.h / 2, wide = zoom <= 1.01, w0 = cam.w;
    if (sized) view.ar = bw / h1;
    const t = home ? camHome() : wide ? camFit() : camTarget(fitW() / w0, cx, cy, 0.5, 0.5);
    if (ms && sized && !STILL && !document.hidden) {
      view.ar = bw / h0;
      // On the way into the field the track is laid once the frame has grown, so the page under the map moves down with the frame and not
      // all at once. A change of measure inside the field keeps the track, and the page is put where the scale it had says.
      if (level && !home) { pinTrack(); pinSync(held); }
      camGo(t, ms, ease, Math.abs(h1 - h0) > 1 ? { h0, h1, w: bw, y0: window.scrollY, lift: lift || 0 } : null);
      if (home && !boxing) { pinTrack(); pinTop(h1); if (lift) followUp(); }
      return;
    }
    if (sized) svg.style.height = level ? h1.toFixed(1) + "px" : "";
    if (sized) { pinTrack(); pinTop(h1); if (level) pinSync(held); }
    cam.x = t.x; cam.y = t.y; cam.w = t.w; cam.h = t.h; zoom = fitW() / cam.w;
    applyCam();
  }
  assign();
  sizeNodes();
  layout();
  reframe(true);
  nodes.forEach(n => { n.x = n.tx; n.y = n.ty; n.r = n.R; });

  /* ---------- drawing ---------- */
  const defs = el("defs", {}, svg);
  EVERY.forEach(c => {
    const m = el("marker", { id: "wm-" + c.cat, markerUnits: "userSpaceOnUse", markerWidth: 11, markerHeight: 11, refX: 2, refY: 5.5, orient: "auto" }, defs);
    el("path", { d: "M0,1 L10,5.5 L0,10 Z", fill: c.color }, m);
    // wide money arrows get a head that grows with the line
    const wide = el("marker", { id: "wmw-" + c.cat, markerUnits: "strokeWidth", viewBox: "0 0 10 10", markerWidth: 2, markerHeight: 2, refX: 2, refY: 5, orient: "auto" }, defs);
    el("path", { d: "M0,0.4 L10,5 L0,9.6 Z", fill: c.color }, wide);
    const broad = el("marker", { id: "wmx-" + c.cat, markerUnits: "strokeWidth", viewBox: "0 0 10 10", markerWidth: 1.5, markerHeight: 1.5, refX: 1, refY: 5, orient: "auto" }, defs);
    el("path", { d: "M0,0.4 L10,5 L0,9.6 Z", fill: c.color }, broad);
  });
  // names sit in their own top layer so a neighbouring bubble never covers them
  const gBand = el("g", { class: "off" }, svg), gLinks = el("g", {}, svg), gFlow = el("g", {}, svg), gHit = el("g", {}, svg), gTitles = el("g", {}, svg), gNodes = el("g", {}, svg), gLabels = el("g", {}, svg);
  [gBand, gLinks, gFlow, gTitles, gLabels].forEach(g => g.classList.add("rest"));   // everything but the bubbles: see settle()
  // the rule and heading over the groups carried down from the industry map when the plate is zoomed into the field
  band = { g: gBand, line: el("path", { class: "bandline" }, gBand), text: el("text", { class: "band", x: 10 }, gBand) };
  band.text.textContent = "From the industry map · actors with no entry on the AISafety.com map";
  // (person-link names are added to gLabels before the bubble names, so a bubble name wins where they meet)

  // Two bubbles packed side by side leave no room between them for a line and its head, and the direct curve would run backwards.
  // Such a link leaves the first bubble, arches over the gap and comes down on the second, on the side away from the middle of their group.
  const HOP_TURNS = [0, 0.45, -0.45, 0.9, -0.9, Math.PI, Math.PI - 0.45, Math.PI + 0.45];   // leans to try, in radians, when the arch would leave the plate
  function hopPath(l, end) {
    const a = l.s, b = l.t, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, w = l.w || 0;
    let nx = -dy / len, ny = dx / len;
    const out = ((a.x + b.x - a.c.x - b.c.x) * nx + (a.y + b.y - a.c.y - b.c.y) * ny) / 2;
    if ((out < 0) !== !!l.twin) { nx = -nx; ny = -ny; }   // the arrow back the other way, if there is one, takes the other side
    const ha = a.r + 2, hb = b.r + end, top = Math.max(ha, hb) + Math.max(10, len * 0.4, w * 1.5);
    const mid = 0.75 * top + (ha + hb) / 8, m = w / 2 + 2;
    let ux = nx, uy = ny, px = 0, py = 0;
    for (const t of HOP_TURNS) {
      ux = nx * Math.cos(t) - ny * Math.sin(t); uy = nx * Math.sin(t) + ny * Math.cos(t);
      px = (a.x + b.x) / 2 + ux * mid; py = (a.y + b.y) / 2 + uy * mid;
      if (px > m && px < W - m && py > m && py < H - m) break;
    }
    const f = v => v.toFixed(1), at = (n, h) => `${f(n.x + ux * h)},${f(n.y + uy * h)}`;
    l.mid = [px, py];
    return `M${at(a, ha)}C${at(a, top)} ${at(b, top)} ${at(b, hb)}`;
  }
  function linkPath(l) {
    const a = l.s, b = l.t, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const end = l.inter ? 2 : (l.w >= W_WIDE ? 5 : 3) + tipOf(l.w);   // arrows stop short to leave room for the head; person links have none
    const vis = len - a.r - 2 - b.r - end;   // the length left between the two bubbles for the line itself
    if (vis < Math.max(6, (l.w || 0) / 2)) return hopPath(l, end);
    // The curve turns over the middle of that length. Taken between the two centres, the turning point could fall inside a large bubble and hook the arrow back out of it.
    const along = a.r + 2 + vis / 2, bend = Math.min(64, len * 0.17, vis * 0.4);
    const mx = a.x + (dx * along - dy * bend) / len, my = a.y + (dy * along + dx * bend) / len;
    const sa = Math.atan2(my - a.y, mx - a.x), ea = Math.atan2(my - b.y, mx - b.x);
    const sx = a.x + Math.cos(sa) * (a.r + 2), sy = a.y + Math.sin(sa) * (a.r + 2), ex = b.x + Math.cos(ea) * (b.r + end), ey = b.y + Math.sin(ea) * (b.r + end);
    const f = v => v.toFixed(1);
    l.mid = [(sx + 2 * mx + ex) / 4, (sy + 2 * my + ey) / 4];
    return `M${f(sx)},${f(sy)}Q${f(mx)},${f(my)} ${f(ex)},${f(ey)}`;
  }
  let linkN = 0;
  // gHit holds a wide invisible copy of every arrow, so a thin line is easy to point at
  links.forEach((l, i) => {
    l.hit = el("path", { class: "hit", "data-link": i }, gHit);
    if (l.inter) {
      l.el = el("path", { class: "link inter", "stroke-width": (1.6 + 0.9 * (l.people.length - 1)).toFixed(1) }, gLinks);
      l.label = el("text", { class: "plab", "text-anchor": "middle" }, gLabels);
      // surnames on the map keep the links readable; full names are in the row under the map and in the panel
      l.label.textContent = l.people.map(p => p.name.split(" ").pop()).join(", ");
      l.parts = [l.el, l.label, l.hit];
      l.draw = () => { const d = linkPath(l); l.el.setAttribute("d", d); l.hit.setAttribute("d", d); l.label.setAttribute("x", l.mid[0].toFixed(1)); l.label.setAttribute("y", (l.mid[1] - 4).toFixed(1)); };
      l.draw();
      return;
    }
    l.w = W_PLAIN;
    l.el = el("path", { id: "wl-" + (++linkN), class: "link", "stroke-width": l.w }, gLinks);   // styleLink sets the colour, the dashes and the head
    // the money signs that ride a money arrow; styleLink fills this in once the filter state exists
    l.flow = el("g", { class: "flow" }, gFlow);
    l.coins = [];
    l.parts = [l.el, l.flow, l.hit];
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
    const m = moneyOn(l), step = m.top ? stepOf(m.top.amount) : -1, shown = l.ties.filter(inFam), ext = shown.length > 0 && shown.every(t => t.ext);
    const key = [level, l.s.c.cat, !m.n ? "plain" : m.top ? step + m.top.currency : "unknown", ext].join("|");
    if (key === l.key) return;
    l.key = key;
    l.color = l.s.c.color;
    l.w = !m.n ? W_PLAIN : m.top ? widthOf(step) : W_UNKNOWN;
    l.el.setAttribute("stroke", l.color);
    l.el.setAttribute("stroke-width", l.w.toFixed(1));
    l.el.setAttribute("marker-end", `url(#${headOf(l.w)}-${l.s.c.cat})`);
    l.el.classList.toggle("money", !!m.n);
    // ties from the control evidence stay dashed; the dashes grow with the line so a wide arrow still reads as one arrow
    l.el.classList.toggle("ext", ext);
    l.el.style.strokeDasharray = ext && l.w > 2.5 ? `${(l.w * 2.4).toFixed(1)} ${(l.w * 0.8).toFixed(1)}` : "";
    l.draw();
    l.m = m;
    l.flow.textContent = "";
    l.coins = [];
    l.coinKey = "";
  }
  // The money signs are built only for arrows that will show them: all of them on the whole-industry view,
  // and only the arrows of a chosen bubble or group when zoomed into the field, where there are several hundred money arrows.
  function ensureCoins(l) {
    if (l.coinKey === l.key) return;
    l.coinKey = l.key;
    const m = l.m;
    if (!m || !m.n) return;
    // one to three signs per arrow, all moving at one slow speed, so only width and size say how much
    const len = l.el.getTotalLength(), dur = Math.max(4, len / 15);
    const n = level ? 1 : m.top ? Math.max(1, Math.min(3, Math.round(len / 130))) : 1;
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

  EVERY.forEach(c => {
    const on = CLUSTERS.indexOf(c) >= 0;
    c.title = el("text", { class: "ctitle" + (on ? "" : " off"), x: (c.titleX || 0).toFixed(1), y: (c.titleY || 0).toFixed(1), "text-anchor": "middle", fill: c.color, "data-cat": c.cat }, gTitles);
    c.title.textContent = c.titleText || "";
  });

  // every bubble is drawn once; the ones that belong only to the zoomed-in field stay hidden until the map zooms in
  all.forEach(n => {
    const c = n.c;
    const g = n.el = el("g", { class: "node" + (n.field ? " away" : ""), "data-id": n.id, style: `color:${c.color}` }, gNodes);
    n.circle = el("circle", { r: n.r.toFixed(1), fill: c.color }, g);
    n.lab = el("g", { class: "nlabel" + (n.field ? " away" : "") }, gLabels);
    n.place = () => { const t = `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`; g.setAttribute("transform", t); n.lab.setAttribute("transform", t); };
    n.place();
  });
  // the name sits inside a bubble with its figure when both fit, and underneath when they do not
  function labelNodes() {
    nodes.forEach(n => {
      n.el.classList.toggle("unk", n.unk);
      n.lab.textContent = "";
      n.lab.classList.toggle("always", n.always);
      n.lab.classList.toggle("tiny", !!n.tiny);
      if (n.inside) {
        el("text", { class: "in", y: -1, "text-anchor": "middle", style: n.fs < 12.5 ? `font-size:${n.fs}px` : "" }, n.lab).textContent = n.short;
        el("text", { class: "in num", y: 13, "text-anchor": "middle" }, n.lab).textContent = n.val.num;
      } else {
        n.lines.forEach((line, i) => { el("text", { class: n.tiny ? "lab sm" : "lab", y: (n.R + n.LH * (i + 1)).toFixed(1), "text-anchor": "middle" }, n.lab).textContent = line; });
      }
      n.el.setAttribute("aria-label", `${n.name}: ${n.val ? n.val.text : "no figure found"}`);
    });
  }
  labelNodes();

  // move every bubble, title and arrow from where it is to where the layout now puts it
  // A change of zoom level passes move = { gone }. Then only the bubbles are drawn while they travel: the arrows, names and group titles are
  // put away for the journey and come back in once everything has arrived, so several hundred of them are neither redrawn on every frame
  // nor seen sliding through each other. The bubbles in gone are not part of the new layout: they shrink away where they stand.
  let frame = 0, unfinished = null;
  function settle(ms, done, move) {
    cancelAnimationFrame(frame);
    if (unfinished) { const f = unfinished; unfinished = null; f(); }   // a move cut short by the next one still has to tidy up
    if (STILL || document.hidden) ms = 0;
    if (!ms) move = null;
    svg.classList.toggle("moving", !!move);
    unfinished = done || null;
    const gone = move ? move.gone : [], ease = move ? easeInOut : easeOut;
    const from = nodes.map(n => [n.x, n.y, n.r]), gf = gone.map(n => [n.y, n.r]), tf = CLUSTERS.map(c => [+c.title.getAttribute("x"), +c.title.getAttribute("y")]), t0 = performance.now();
    const step = now => {
      const k = ms ? Math.min(1, Math.max(0, (now - t0) / ms)) : 1, e = ease(k);
      nodes.forEach((n, i) => {
        n.x = from[i][0] + (n.tx - from[i][0]) * e; n.y = from[i][1] + (n.ty - from[i][1]) * e; n.r = from[i][2] + (n.R - from[i][2]) * e;
        n.circle.setAttribute("r", n.r.toFixed(1));
        n.place();
      });
      gone.forEach((n, i) => {
        n.y = gf[i][0] + (n.gy - gf[i][0]) * e; n.r = gf[i][1] * (1 - e);
        n.circle.setAttribute("r", n.r.toFixed(1));
        n.place();
      });
      CLUSTERS.forEach((c, i) => { c.title.setAttribute("x", (tf[i][0] + (c.titleX - tf[i][0]) * e).toFixed(1)); c.title.setAttribute("y", (tf[i][1] + (c.titleY - tf[i][1]) * e).toFixed(1)); });
      if (!move || k >= 1) links.forEach(l => { if (l.vis !== false) l.draw(); });
      if (k < 1) { frame = requestAnimationFrame(step); return; }
      unfinished = null;
      if (done) done();
      svg.classList.remove("moving");
    };
    step(t0);
  }

  /* ---------- state ---------- */
  const state = { sel: null, hover: null, fam: "all" };
  const famLabel = id => { const f = FAMS.find(x => x.id === id); return f ? f.label : ""; };
  const inLens = (t, id) => id === "all" || (id === "corp" ? isCorp(t) : famOf(t) === id);
  const inFam = t => (!t.field || level === 1) && inLens(t, state.fam);   // the grant records and company announcements show only when zoomed into the field
  const touches = (l, f) => f.type === "person" ? (!!l.inter && l.people.some(p => p.id === f.id)) : f.type === "node" ? (l.s.id === f.id || l.t.id === f.id) : (l.s.c.cat === f.id || l.t.c.cat === f.id);
  const linkVisible = l => l.inter ? (state.fam === "all" || state.fam === "people") : l.ties.some(inFam);

  // An arrow's look can change only when the zoom level or the tie filter changes. Those bump the epoch, and refresh restyles then and not on
  // every selection. The classes on arrows and bubbles are written only where they differ from what is already there.
  let epoch = 1;
  function refresh() {
    const focus = state.hover || state.sel, onNodes = new Set(), dim = !!focus || state.fam !== "all";
    links.forEach(l => {
      if (l.epoch !== epoch) {
        l.epoch = epoch;
        l.vis = linkVisible(l);
        if (l.vis) { if (!l.inter) styleLink(l); l.draw(); }
      }
      const on = l.vis && (!focus || touches(l, focus));
      if (l.visDom !== l.vis) { l.visDom = l.vis; l.parts.forEach(p => p.classList.toggle("off", !l.vis)); }
      if (l.onDom !== on) { l.onDom = on; l.parts.forEach(p => p.classList.toggle("on", on)); }
      if (on) {
        onNodes.add(l.s.id); onNodes.add(l.t.id);
        if (!l.inter && (!level || focus)) ensureCoins(l);
      }
    });
    if (focus && focus.type !== "person") (focus.type === "node" ? [byId.get(focus.id)] : C.get(focus.id).nodes).forEach(n => onNodes.add(n.id));
    svg.classList.toggle("has-focus", dim);
    svg.classList.toggle("has-pick", !!focus);
    const selId = state.sel && state.sel.type === "node" ? state.sel.id : null;
    nodes.forEach(n => {
      const on = dim && onNodes.has(n.id), sel = n.id === selId;
      if (n.onDom !== on) { n.onDom = on; n.el.classList.toggle("on", on); n.lab.classList.toggle("on", on); }
      if (n.selDom !== sel) { n.selDom = sel; n.el.classList.toggle("sel", sel); }
    });
    CLUSTERS.forEach(c => c.title.classList.toggle("sel", !!state.sel && state.sel.type === "group" && state.sel.id === c.cat));
  }

  /* ---------- the panel under the map ---------- */
  const panel = $("webPanel"), blurb = $("webBlurb"), lens = $("webLens"), search = $("webSearch"), options = $("webOptions"), fig = svg.closest(".web");
  // what the line beside the search says while nothing narrows the map, for the whole industry and for the field
  const BLURBS = [
    "Pick a bubble or a group name, or search for an actor, a group or a person, to follow the ties. Pick a kind of tie to see only those arrows. Scroll over the map to zoom, and drag to move it.",
    "Pick a bubble, a group name or a funder to follow the money. Scrolling past the foot of the map draws it in until the whole field fits in the window, and + or a pinch brings the small names up to reading size. Search finds any entry."
  ];
  const LIVE = [ORG_EDGES, ORG_EDGES.concat(FIELD_TIES)];
  const liveEdges = () => LIVE[level];
  const count = fn => liveEdges().filter(fn).length, baseCount = fn => D.edges.filter(fn).length;
  // Every row of one funder's record for one recipient, behind a fold. A large funder has hundreds of rows across its arrows,
  // so the rows are written only when a fold is first opened.
  function grantList(f) {
    return `<details class="wp-grants" data-flow="${FLOWS.indexOf(f)}"><summary>${f.n === 1 ? "The row" : `All ${f.n} rows`} in the record</summary></details>`;
  }
  function grantRows(f) {
    const r = recOf(f);
    return `<ol>${f.grants.map(g =>
      `<li><b>${esc(g[0])}</b><strong>${g[1] ? esc(U.fmtAmount(g[1], "USD")) : "pledge only"}</strong><em>${tidy(g[2])}${g[3] ? ` Plus a matching pledge of up to ${esc(U.fmtAmount(g[3], "USD"))}, paid only if outside money is raised.` : ""}</em></li>`).join("")}</ol>
      <p>${tidy(r.note)} <a href="${esc(r.url)}" rel="noopener">${tidy(r.title)}</a></p>`;
  }
  panel.addEventListener("toggle", e => {
    const d = e.target;
    if (!d.open || !d.dataset || d.dataset.flow == null || d.dataset.filled) return;
    d.dataset.filled = "1";
    d.insertAdjacentHTML("beforeend", grantRows(FLOWS[+d.dataset.flow]));
  }, true);
  const catOf = id => { const n = byId.get(id); return n ? n.cat : 0; };   // a person has no group
  function tieItem(t, out) {
    const other = byId.get(out ? t.to : t.from), bits = [typeLabel(t)];
    if (t.amount != null) bits.push(U.fmtAmount(t.amount, t.currency));
    if (t.date) bits.push(U.fmtDate(t.date));
    return `<li><button type="button" class="web-jump" data-node="${esc(other.id)}"><i style="background:${other.c.color}"></i>${tidy(other.name)}</button><span>${esc(bits.join(", "))}${t.ext ? ` <em class="wp-ext">control evidence</em>` : ""}${t.flow ? ` <em class="wp-ext">grant record</em>` : ""}${t.corp ? ` <em class="wp-ext">company announcement</em>` : ""}</span>${t.flow ? grantList(t.flow) : ""}${t.corp ? `<span>${tidy(t.corp.what)} <a href="${esc(t.corp.src.url)}" rel="noopener">${tidy(t.corp.src.title)}</a></span>` : ""}</li>`;
  }
  const roleBits = r => [typeLabel(r)].concat(r.date ? [U.fmtDate(r.date)] : []).join(", ");
  // a person's role at an organisation: listed under the organisation with the name, and under the person with the organisation
  function roleItem(r, showPerson) {
    const org = byId.get(r.to), p = personById.get(r.from);
    const who = showPerson ? `<button type="button" class="web-jump" data-person="${esc(p.id)}"><i class="who"></i>${tidy(p.name)}</button>`
      : `<button type="button" class="web-jump" data-node="${esc(org.id)}"><i style="background:${org.c.color}"></i>${tidy(org.name)}</button>`;
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
      const n = byId.get(s.id), c = n.c, e = n.entry, edges = liveEdges();
      const bySum = (a, b) => (b.amount || 0) - (a.amount || 0);   // zoomed in a funder can have dozens of arrows, so the largest stated amounts come first
      const out = edges.filter(t => t.from === n.id && inFam(t)), inc = edges.filter(t => t.to === n.id && inFam(t));
      if (level) { out.sort(bySum); inc.sort(bySum); }
      const here = PEOPLE.reduce((a, p) => a.concat(p.roles.filter(r => r.to === n.id)), []);
      const listed = e ? e.cats.map(k => catLabel.get(k)).join(", ") : "";
      // a bubble that exists only on the field map is described in that map's words; one from the industry map keeps this map's reading of its stake
      const head = n.field && e.own
        ? `<span class="web-eyebrow" style="color:${c.color}">${tidy(c.label)} · added by this map</span>
          <h2>${tidy(n.name)}</h2>
          <p><span class="wp-lbl">What it is, from the announcement</span>${tidy(e.desc)}</p>
          <p class="wp-small">This programme is not an entry on the AISafety.com map. <a href="${esc(e.src.url)}" rel="noopener">${tidy(e.src.title)}</a></p>`
        : n.field
        ? `<span class="web-eyebrow" style="color:${c.color}">${tidy(c.label)} · on the AISafety.com map</span>
          <h2>${tidy(n.name)}</h2>
          <p><span class="wp-lbl">What it is, in the AISafety.com map's words</span>${tidy(e.desc)}</p>
          <p class="wp-small">${e.cats.length > 1 ? `Listed under: ${tidy(listed)}. ` : ""}<a href="${esc(e.url)}" rel="noopener">Its own site</a> · <a href="${esc(F.source.url)}" rel="noopener">The AISafety.com map</a></p>`
        : `<span class="web-eyebrow" style="color:${c.color}">${tidy(c.label)} · ${tidy(n.data.subtype)} · ${tidy(n.data.country)}</span>
          <h2>${tidy(n.name)}</h2>
          <p><span class="wp-lbl">Stake, as read by this map</span>${tidy(n.data.stake)}</p>
          ${level && e ? `<p class="wp-small"><span class="wp-lbl">On the AISafety.com map · ${tidy(listed)}</span>${tidy(e.desc)}</p>` : ""}`;
      const none = level && !GIN.has(n.id) && !GOUT.has(n.id) && !CIN.has(n.id) && !COUT.has(n.id) ? " No grant to or from it appears in the four grant records or the company announcements read here, which is not the same as no funding." : "";
      panel.innerHTML = `<div class="wp-main">
          ${head}
          ${measure.id === "ties" ? "" : `<p class="wp-small"><span class="wp-lbl">Bubble size · ${esc(measure.pill)}</span>${valueLine(n)}</p>`}
          <p class="wp-small">${n.deg} documented ${n.deg === 1 ? "tie" : "ties"} to other organisations.${none}${filt} ${n.field ? "" : `<a href="#a-${esc(n.id)}">Open the full profile</a>`}</p>
        </div>
        <div class="wp-ties">${tieBlock("Arrows going out to", out, true)}${tieBlock("Arrows coming in from", inc, false)}${here.length ? `<div><h3>People with a role or interest here (${here.length})</h3><ul>${here.map(r => roleItem(r, true)).join("")}</ul></div>` : ""}</div>`;
    } else if (s) {
      const c = C.get(s.id), ids = new Set(c.nodes.map(n => n.id));
      const out = count(t => ids.has(t.from) && !ids.has(t.to) && inFam(t)), inc = count(t => !ids.has(t.from) && ids.has(t.to) && inFam(t)), within = count(t => ids.has(t.from) && ids.has(t.to) && inFam(t));
      const about = c.field ? c.about : (document.querySelector(`#cat-${c.cat} .oneline`) || {}).textContent;
      const top = c.nodes.filter(n => n.deg).sort((a, b) => b.deg - a.deg || a.name.localeCompare(b.name)).slice(0, 8);
      panel.innerHTML = `<div class="wp-main">
          <span class="web-eyebrow" style="color:${c.color}">Group · ${c.nodes.length} ${c.field ? "entries on the AISafety.com map" : "actors"}</span>
          <h2>${tidy(c.label)}</h2>
          <p>${about ? tidy(about) : ""}</p>
          <p class="wp-small">${out} ties go out to other groups, ${inc} come in, and ${within} stay inside the group.${filt} ${c.field ? `<a href="#field">Read every entry</a>` : `<a href="#cat-${c.cat}">Read about this category</a>`}</p>
          ${level ? `<p><button type="button" class="web-act" data-zoomto="${esc(c.cat)}">Zoom to this group</button></p>` : ""}
        </div>
        <div class="wp-ties"><div><h3>Most documented ties in this group</h3>${top.length ? `<ul>${top.map(n => `<li><button type="button" class="web-jump" data-node="${esc(n.id)}"><i style="background:${c.color}"></i>${tidy(n.name)}</button><span>${n.deg} ${n.deg === 1 ? "tie" : "ties"}</span></li>`).join("")}</ul>` : `<p class="wp-none">None recorded in this version.</p>`}</div></div>`;
    } else if (level) {
      const got = new Set(FLOWS.map(f => f.to)), gives = new Set(FLOWS.map(f => f.from)), R = F.records;
      const cgN = FLOWS.filter(f => f.src === "cg").length, chained = FLOWS.filter(f => gives.has(f.to)).length;
      panel.innerHTML = `<div class="wp-notes">
          <div><h2>Four public records, one dominant funder</h2><p>${FLOWS.length} arrows join a funder to an organisation on this plate. ${cgN} of them come from Coefficient Giving's AI fund list, which holds ${R.cg.rows} grants worth USD ${big(R.cg.listed)}. USD ${big(R.cg.matchedTotal)} of that goes to organisations shown here.</p><button type="button" class="web-act" data-node="cg">Show Coefficient Giving's grants</button></div>
          <div><h2>Most bubbles show no grant</h2><p>${all.length - got.size} of the ${all.length} bubbles receive nothing in these records. That is a limit of the records and not a finding: company revenue, government budgets and most private gifts are in none of them.</p><button type="button" class="web-act" data-lens="grants">Show only the grants</button></div>
          <div><h2>Funders fund funders</h2><p>${chained} arrows end at an organisation that itself gives grants, so the same money can appear on two arrows. This is why totals from different records are never added together.</p><button type="button" class="web-act" data-group="f-funding">Show the funders</button></div>
          <div><h2>Company money is small on the public record</h2><p>${CORP_TIES.length} arrows carry money that an AI company or its foundation has announced for work outside the company. The largest are commitments to the companies' own programmes, and several are not safety research. What a company spends on its own safety teams is not published.</p><button type="button" class="web-act" data-lens="corp">Show company money</button></div>
        </div>`;
    } else {
      const labs = t => catOf(t.from) === 3 || catOf(t.to) === 3;
      const two = t => t.from === "openai" || t.to === "openai" || t.from === "anthropic" || t.to === "anthropic";
      const grants = t => catOf(t.from) === 5 && catOf(t.to) === 6;
          panel.innerHTML = `<div class="wp-notes">
          <div><h2>The labs sit at the centre of the ties</h2><p>${baseCount(labs)} of the ${D.edges.length} ties in the base map touch a frontier developer, and ${baseCount(two)} touch OpenAI or Anthropic. Those two also disclose the most, so part of this is documentation.</p><button type="button" class="web-act" data-group="3">Show the labs' ties</button></div>
          <div><h2>Safety research has few paymasters</h2><p>${baseCount(grants)} base ties run from a safety funder to a research organisation. In one published list, a single funder accounts for about 72% of the 2025 estimates.</p><button type="button" class="web-act" data-lens="grants">Show grants and philanthropy</button></div>
          <div><h2>Evaluators depend on the labs they test</h2><p>${count(t => famOf(t) === "access")} dashed arrows show model access, compute credits and commissioned work flowing from labs to evaluators and training programmes. No executed agreement was obtained.</p><button type="button" class="web-act" data-lens="access">Show access and contracts</button></div>
          <div><h2>A few people sit in more than one place</h2><p>${PEOPLE.length} named people hold roles or disclosed interests in more than one organisation. They are drawn as ${nInter} dotted links between those organisations and can be found in the map's search box.</p><button type="button" class="web-act" data-lens="people">Show the people links</button></div>
          ${F ? `<div class="wp-wide"><h2>The AI safety field has its own map inside this one</h2><p>Zoom in and the ${NFIELD} organisations, programmes and resources on the AISafety.com field map take the plate, with ${FLOWS.length} arrows for the money that four public grant records show passing between them and ${CORP_TIES.length} for money the AI companies have announced.</p><button type="button" class="web-act" data-level="1">Zoom into the AI safety field</button></div>` : ""}
        </div>`;
    }
    // zoomed in, the panel for a chosen bubble stays at the foot of the window, so it carries its own way out
    if (level && s) panel.insertAdjacentHTML("afterbegin", `<button type="button" class="wp-close" data-close="1">Close</button>`);
    const fam = FAMS.find(f => f.id === state.fam);
    // every wording this line can take is always laid out, so it keeps one height at either zoom level and whichever kind of tie is chosen
    stack(blurb, BLURBS.concat(FAMS.map(f => `${f.label}. ${f.blurb}`)), fam ? BLURBS.length + FAMS.indexOf(fam) : level);
    $("webClear").hidden = !state.sel && state.fam === "all";
    fig.classList.toggle("has-sel", !!state.sel);
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
      const k = svg.getBoundingClientRect().width / cam.w;
      sc.scrollTo({ left: ((state.sel.type === "node" ? byId.get(state.sel.id).x : C.get(state.sel.id).x) - cam.x) * k - sc.clientWidth / 2 });
    }
    if (state.sel && state.sel.type !== "person" && fromPick) reveal(state.sel);
  }
  // A bubble or group picked from a list or the search is brought into view: a zoomed plate moves to it, and the page scrolls if it is
  // still off screen.
  function reveal(sel) {
    const o = sel.type === "node" ? byId.get(sel.id) : C.get(sel.id);
    const px = sel.type === "node" ? o.tx : o.x, py = sel.type === "node" ? o.ty : o.y, m = 30 * cam.w / W;
    let t = cam;
    if (zoom > 1.01 && (px < cam.x + m || px > cam.x + cam.w - m || py < cam.y + m || py > cam.y + cam.h - m)) { t = camTarget(zoom, px, py, 0.5, viewFrac()); camGo(t, 260); }
    const r = svg.getBoundingClientRect(), sy = r.top + (py - t.y) / t.h * r.height;
    // zoomed in, the panel for the chosen bubble covers the foot of the window, so the bubble is brought into the upper part
    const low = level ? 0.5 : 0.76, to = level ? 0.3 : 0.4;
    if (sy < 130 || sy > window.innerHeight * low) window.scrollBy({ top: sy - window.innerHeight * to, behavior: STILL ? "auto" : "smooth" });
  }
  function setFam(v) {
    state.fam = v;
    epoch++;
    showLens();
    refresh();
    renderPanel();
  }
  const setText = (id, v) => { const x = $(id); if (x) x.textContent = v; };
  // Several wordings for one place, laid out one over the other with only the current one shown and read out. The place is then as tall
  // as the longest of them, so swapping the wording does not move anything under it.
  function stack(box, texts, at) {
    if (box) box.innerHTML = texts.map((t, i) => `<span${i === at ? "" : ' aria-hidden="true"'}>${esc(t)}</span>`).join("");
  }
  /* ---------- the size selector: what a bubble's size stands for ---------- */
  const sizePills = $("webSize"), sizeScale = $("webSizeScale"), sizeAbout = $("webSizeAbout");
  // one actor's figure in words, with when, where from and a link
  function valueLine(n) {
    const v = n.val;
    if (!v) return "No figure found for this measure. That is not zero, and it does not mean the organisation is small.";
    return `${tidy(sentence(cap(v.text) + (v.est ? " (estimate)" : "")))} ${tidy(cap([v.basis, v.when].filter(Boolean).join(", ")))}${v.basis || v.when ? ". " : ""}${v.note ? tidy(sentence(v.note)) + " " : ""}${srcLink(v.url, v.srcTitle || "Source")}`;
  }
  // The scale is drawn at the size the map is shown, so its circles match the bubbles. Zoomed far in, the largest circle would outgrow the
  // space the key has, so past KEY_MAX across the whole key is drawn smaller by one ratio and says by how much: the key then keeps its
  // size on the page whatever the zoom, and never shows a circle at a size it does not own up to.
  const KEY_MAX = 64;
  function drawScale() {
    if (!sizeScale) return;
    const real = svg.getBoundingClientRect().width / cam.w || 1;
    const shown = measure.ticks.map(t => measure.r(t[0])).concat(nodes.some(n => n.unk) ? [rUnknown()] : []);
    const k = Math.min(real, (KEY_MAX - 3) / (2 * Math.max.apply(null, shown)));
    const dot = (r, label, cls) => { const d = Math.max(4, 2 * r * k + 3); return `<li><svg width="${d.toFixed(1)}" height="${d.toFixed(1)}" viewBox="${-d / 2} ${-d / 2} ${d} ${d}" aria-hidden="true"><circle r="${(r * k).toFixed(1)}" class="${cls || ""}"/></svg>${esc(label)}</li>`; };
    sizeScale.innerHTML = measure.ticks.map(t => dot(measure.r(t[0]), t[1])).join("")
      + (measure.id === "influence" ? dot(measure.r(0), "no one named") : "")
      + (nodes.some(n => n.unk) ? dot(rUnknown(), "no figure found", "unk") : "")
      + (k < real * 0.97 ? `<li class="shrunk">key drawn ${+(real / k).toFixed(1)}× smaller than the map</li>` : "");
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
      + (listed.length ? `<div class="web-sizelist">${CLUSTERS.filter(c => listed.some(n => n.c === c)).map(c =>
        `<div><h3 style="color:${c.color}">${tidy(c.label)}</h3><ul>${listed.filter(n => n.c === c).sort((a, b) => a.name.localeCompare(b.name)).map(n =>
          `<li><button type="button" class="web-jump" data-node="${esc(n.id)}"><i style="background:${c.color}"></i>${tidy(n.name)}</button><span>${valueLine(n)}</span></li>`).join("")}</ul></div>`).join("")}</div>` : "")
      + (missing.length ? `<p class="note"><b>No figure found for ${missing.length} actors:</b> ${missing.map(n => tidy(n.short)).join(", ")}.</p>` : "");
  }
  function setSize(id, ms) {
    measure = measureById.get(id) || measure;
    if (!measure.field) bothLevels = measure;
    sizeNodes();
    layout();
    reframe(false, ms);
    labelNodes();
    settle(ms);
    renderSize();
    renderPanel();
  }
  // The grant measures can be chosen only when the map is zoomed into the field, where the grant records are drawn. Zoomed out they
  // stay in the row, switched off, so the row is the same at both levels and nothing under it moves.
  function renderPills() {
    if (sizePills) sizePills.innerHTML = MEASURES.map(m => `<button type="button" data-v="${m.id}" aria-pressed="${m === measure}"${m.field && !level ? ' disabled title="Zoom into the AI safety field to size bubbles by grants"' : ""}>${esc(m.pill)}</button>`).join("");
  }
  renderPills();
  if (sizePills) sizePills.addEventListener("click", e => { const b = e.target.closest("button"); if (b && b.dataset.v !== measure.id) setSize(b.dataset.v, 650); });
  if (sizeAbout) sizeAbout.addEventListener("click", e => { const b = e.target.closest("button[data-node]"); if (b) { select({ type: "node", id: b.dataset.node }, true); if (!level) svg.scrollIntoView({ block: "center", behavior: STILL ? "auto" : "smooth" }); } });
  // the frame changes shape with the window, and the view is fitted to it again
  // (the frame also changes height when the reader zooms it, which is not a change of window and needs no second look)
  if (window.ResizeObserver) new ResizeObserver(() => {
    if (boxing) return;
    if (Math.abs(svg.getBoundingClientRect().width - own.w) > 0.5 || window.innerHeight !== own.vh) reframe(false);
    drawScale();
  }).observe(svg);
  // text is measured to lay the map out, so lay it out again once the web fonts have arrived
  const probe = () => textW("in", "OpenAI Anthropic") + textW("lab", "Coefficient Giving");
  const before = probe();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
    widths.clear();
    if (Math.abs(probe() - before) < 0.5) return;
    CLUSTERS.forEach(c => { c.tw = textW("ctitle", c.titleText); });
    setSize(measure.id, 0);
  });

  const LENS = { control: "Ownership and control", invest: "Investment", supply: "Supply", grants: "Grants", public: "Public authority", politics: "Advocacy", field: "Standards and training", access: "Access and contracts", people: "People and interests", corp: "Company money" };
  /* The kinds of tie sit in a search box like the one for actors: typing filters the list, and each row carries its count. */
  const lensOptions = $("webLensOptions");
  let LENSES = [], lensShown = [], lensActive = -1;
  const lensText = () => { const it = LENSES.find(x => x.id === state.fam); return it ? `${it.label} · ${it.n}` : ""; };
  function showLens() { lens.value = lensText(); lens.classList.toggle("on", state.fam !== "all"); }
  function renderLens() {
    LENSES = [{ id: "all", label: "All ties" }].concat(FAMS).map(f => ({ id: f.id, label: LENS[f.id] || f.label, find: ((LENS[f.id] || "") + " " + f.label).toLowerCase(),
      n: f.id === "all" ? liveEdges().length + nInter : f.id === "people" ? nInter : count(t => inLens(t, f.id)) }));
    showLens();
  }
  renderLens();
  function lensMark(i, scroll) {
    lensActive = i;
    Array.from(lensOptions.querySelectorAll('[role="option"]')).forEach((o, k) => {
      o.classList.toggle("active", k === i);
      if (k === i && scroll) o.scrollIntoView({ block: "nearest" });
    });
    if (i >= 0) lens.setAttribute("aria-activedescendant", "wk-" + i); else lens.removeAttribute("aria-activedescendant");
  }
  function openLens() {
    // the kind already in the box is the current choice, not a query, so the whole list shows until the reader types
    const q = lens.value === lensText() ? "" : lens.value.trim().toLowerCase();
    lensShown = q ? LENSES.filter(it => q.split(/\s+/).every(w => it.find.indexOf(w) >= 0)) : LENSES;
    lensOptions.innerHTML = lensShown.length ? lensShown.map((it, i) =>
      `<li role="option" id="wk-${i}" data-i="${i}" aria-selected="${it.id === state.fam}"><span>${esc(it.label)}</span><span class="c">${it.n}</span></li>`).join("")
      : `<li class="none" role="presentation">No kind of tie matches.</li>`;
    lensOptions.hidden = false;
    lens.setAttribute("aria-expanded", "true");
    lensMark(q && lensShown.length ? 0 : -1, false);
  }
  function closeLens() {
    if (lensOptions.hidden) return;
    lensOptions.hidden = true;
    lens.setAttribute("aria-expanded", "false");
    lens.removeAttribute("aria-activedescendant");
    lensActive = -1;
  }
  lens.addEventListener("focus", () => { lens.select(); openLens(); });
  lens.addEventListener("click", () => { if (lensOptions.hidden) openLens(); });
  lens.addEventListener("input", openLens);
  lens.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (lensOptions.hidden) { openLens(); return; }
      if (lensShown.length) lensMark((lensActive + (e.key === "ArrowDown" ? 1 : lensShown.length - 1) + (lensActive < 0 && e.key === "ArrowUp" ? 1 : 0)) % lensShown.length, true);
    } else if (e.key === "Enter") {
      if (!lensOptions.hidden && lensActive >= 0) { e.preventDefault(); const it = lensShown[lensActive]; closeLens(); setFam(it.id); lens.select(); }
    } else if (e.key === "Escape") {
      if (!lensOptions.hidden) { e.preventDefault(); closeLens(); showLens(); }
    }
  });
  // leaving the box closes the list and puts the current kind back
  lens.addEventListener("blur", () => { closeLens(); showLens(); });
  lensOptions.addEventListener("pointerdown", e => e.preventDefault());   // keep focus in the box while the list is clicked or scrolled
  lensOptions.addEventListener("click", e => { const o = e.target.closest('[role="option"]'); if (o) { setFam(lensShown[+o.dataset.i].id); lens.blur(); } });
  lensOptions.addEventListener("pointermove", e => {
    const o = e.target.closest('[role="option"]');
    if (o && e.pointerType === "mouse" && +o.dataset.i !== lensActive) lensMark(+o.dataset.i, false);
  });

  /* One search box for everything that can be selected: groups, actors and people. Typing filters the list, the list scrolls,
     and the row under the pointer or the arrow keys previews on the map before it is chosen. */
  let ITEMS = [];
  function buildItems() {
    const byName = (x, y) => x.name.localeCompare(y.name);
    const nd = (n, head) => ({ type: "node", id: n.id, label: n.name, head, mark: `<i style="background:${n.c.color}"></i>`, find: n.name + " " + n.short + " " + n.c.label });
    ITEMS = CLUSTERS.map(c => ({ type: "group", id: c.cat, label: c.label, head: !level ? "Whole groups" : c.field ? "Groups in the AI safety field" : "Groups from the industry map", mark: `<i class="grp-mark" style="background:${c.color}"></i>`, find: c.label }))
      .concat(CLUSTERS.reduce((a, c) => a.concat(c.nodes.slice().sort(byName).map(n => nd(n, c.label))), []))
      // from the whole-industry view the field's entries can still be found; choosing one zooms in
      .concat(level ? [] : fieldNodes.slice().sort(byName).map(n => nd(n, "In the AI safety field · choosing one zooms in")))
      .concat(PEOPLE.map(p => ({ type: "person", id: p.id, label: p.name, head: "People who link organisations", mark: `<i class="who"></i>`, find: p.name + " person people" })));
    ITEMS.forEach(it => { it.find = it.find.toLowerCase(); });
  }
  buildItems();
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
    if (it.type === "node" && nodes.indexOf(byId.get(it.id)) < 0) setLevel(1, 0);
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
  function renderScale() {
    if (!scale) return;
    const h = w => Math.max(14, Math.ceil(w) + 2);
    const row = (w, label, faint) => `<li><svg viewBox="0 ${-h(w) / 2} 34 ${h(w)}" style="height:${h(w)}px" aria-hidden="true"><path d="M1 0h32" stroke-width="${w}"/>${faint ? '<text x="17" y="4.4" text-anchor="middle" class="k-sign faint">$</text>' : ""}</svg><span>${label}</span></li>`;
    const used = Array.from(new Set(liveEdges().filter(t => MONEY.has(t.type) && t.amount != null).map(t => stepOf(t.amount)))).sort((a, b) => a - b);
    scale.innerHTML = row(W_UNKNOWN, "amount not disclosed", true) + used.map(st => row(widthOf(st), STEPS[st])).join("");
  }
  renderScale();
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
    else if (b.dataset.group) select({ type: "group", id: catKey(b.dataset.group) }, true);
    else if (b.dataset.lens) setFam(b.dataset.lens);
    else if (b.dataset.level) { setLevel(+b.dataset.level, LEVEL_MS); svg.scrollIntoView({ block: "start", behavior: STILL ? "auto" : "smooth" }); }
    else if (b.dataset.zoomto) zoomToGroup(C.get(catKey(b.dataset.zoomto)));
    else if (b.dataset.close) select(null);
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
  let tipAt = null, tipW = 0, tipH = 0;   // the bubble or arrow the card is showing
  function tipHtml(l) {
    const head = `<b>${tidy(l.s.name)} ${l.inter ? "and" : "→"} ${tidy(l.t.name)}</b>`;
    if (l.inter) return head + `<ul>${l.people.map(p => `<li><span>${tidy(p.name)}</span><em>shared person</em></li>`).join("")}</ul>`;
    return head + `<ul>${l.ties.filter(inFam).map(t => {
      const what = [typeLabel(t)].concat(t.date ? [U.fmtDate(t.date)] : []).join(", ");
      const amt = t.amount != null ? `<strong>${esc(U.fmtAmount(t.amount, t.currency))}</strong>` : t.flow ? "<em>matching pledge only</em>" : MONEY.has(t.type) ? "<em>amount not disclosed</em>" : "<em>no payment along this arrow</em>";
      // a tie from a grant record names the record, and one from a company announcement carries its note
      const small = t.flow ? `Total in ${recOf(t.flow).title}` : t.corp ? t.corp.what : t.status && t.amount != null ? t.status : "";
      return `<li><span>${esc(what)}${small ? `<small>${tidy(small)}</small>` : ""}</span>${amt}</li>`;
    }).join("")}</ul>`;
  }
  function moveTip(e) {
    const w = tipW, h = tipH, vw = document.documentElement.clientWidth;
    tip.style.left = Math.max(8, Math.min(e.clientX + 14, vw - w - 8)) + "px";
    tip.style.top = (e.clientY + h + 22 > window.innerHeight ? e.clientY - h - 12 : e.clientY + 16) + "px";
  }
  // pointing at a bubble says what it is and what its size stands for under the chosen measure
  function nodeTipHtml(n) {
    const c = n.c, v = n.val, where = v ? [v.basis, v.when].filter(Boolean).join(", ") : "";
    const fig = `<li><span>${esc(measure.pill)}<small>${v ? tidy(sentence(cap(v.text) + (v.est ? " (estimate)" : ""))) + (where ? " " + tidy(sentence(cap(where))) : "") : "Not zero, and not a sign that the organisation is small."}</small></span>${v ? `<strong>${esc(v.num)}</strong>` : "<em>no figure found</em>"}</li>`;
    const ties = measure.id === "ties" ? "" : `<li><span>Documented ties</span><strong>${n.deg}</strong></li>`;
    // the bubble's card names its largest stated amounts, so the money can be read without picking out each arrow
    const money = liveEdges().filter(t => (t.from === n.id || t.to === n.id) && MONEY.has(t.type) && t.amount != null && inFam(t)).sort((a, b) => b.amount * (S.fx[b.currency] || 1) - a.amount * (S.fx[a.currency] || 1)).slice(0, 3)
      .map(t => `<li><span>${t.from === n.id ? "To " + tidy(byId.get(t.to).short) : "From " + tidy(byId.get(t.from).short)}<small>${esc(typeLabel(t))}</small></span><strong>${esc(U.fmtAmount(t.amount, t.currency))}</strong></li>`).join("");
    // a bubble from the field map carries that map's one-line description, since its name alone often says little
    const what = n.field ? `<span class="tip-what">${tidy(n.entry.desc)}</span>` : "";
    return `<b>${tidy(n.name)}</b><span class="tip-grp"><i style="background:${c.color}"></i>${tidy(c.label)}${n.field && n.entry.cats.length < 2 ? "" : ` · ${tidy(n.data.subtype)}`}</span>${what}<ul>${fig}${ties}${money}</ul><span class="tip-more">Select the bubble to follow its arrows and see every amount and source.</span>`;
  }
  function hideTip() {
    if (tip.hidden) return;
    if (tipAt && tipAt.hit) tipAt.el.classList.remove("hot");
    tipAt = null;
    tip.hidden = true;
  }
  // Pointing shows a card for the bubble or the arrow under the pointer. It does not fade the rest of the map: that happens only when a bubble is chosen.
  function showTip(at, e) {
    if (at !== tipAt) {
      if (tipAt && tipAt.hit) tipAt.el.classList.remove("hot");
      tipAt = at;
      if (at.hit) at.el.classList.add("hot");
      tip.innerHTML = at.hit ? tipHtml(at) : nodeTipHtml(at);
      tip.hidden = false;
      tipW = tip.offsetWidth; tipH = tip.offsetHeight;
    }
    moveTip(e);
  }
  const linkAt = e => { const h = e.target.closest && e.target.closest(".hit"); return h ? links[+h.getAttribute("data-link")] : null; };
  svg.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || drag || pan) return;
    const at = nodeAt(e) || linkAt(e);
    if (at) showTip(at, e); else hideTip();
  });
  svg.addEventListener("pointerleave", hideTip);
  let lastPointer = "mouse";   // click events do not carry the pointer type in every browser
  svg.addEventListener("pointerdown", e => { lastPointer = e.pointerType; }, true);
  window.addEventListener("scroll", hideTip, { passive: true });

  /* ---------- pointer: point for a bubble's card, click to follow its arrows, drag a bubble (mouse) to untangle ---------- */
  const nodeAt = e => { const g = e.target.closest && e.target.closest(".node"); return g ? byId.get(g.getAttribute("data-id")) : null; };
  let drag = null, pan = null, camFrame = 0;
  function toStage(e) {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  // A press that is not on a bubble drags the map. With a mouse that works at any zoom and from anywhere, a group name or an arrow included:
  // the pointer is only taken once it has moved, so a plain click still reaches what it was on. A finger drags the map only when it is
  // zoomed in, and otherwise scrolls the page as it does anywhere else.
  // What a drag moves depends on what there is to move. Zoomed in, it is the view inside the frame. With the whole field in a frame taller
  // than the window, it is the page, which is how that map is travelled. With the whole industry in view it is the plate, loosely.
  svg.addEventListener("pointerdown", e => {
    const n = nodeAt(e);
    if (!n && !boxing && (e.pointerType === "mouse" ? e.button === 0 : zoom > 1.01)) {
      pan = { id: e.pointerId, x0: e.clientX, y0: e.clientY, cx: cam.x, cy: cam.y, k: cam.w / svg.getBoundingClientRect().width, moved: false,
        page: !!level && zoom <= 1.01, loose: zoom <= 1.01, lastY: e.clientY };
      cancelAnimationFrame(camFrame);
      goal = null;
      return;
    }
    if (!n || e.pointerType !== "mouse" || e.button !== 0) return;
    const p = toStage(e);
    hideTip();
    drag = { n, dx: n.x - p.x, dy: n.y - p.y, x0: e.clientX, y0: e.clientY, moved: false };
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  svg.addEventListener("pointermove", e => {
    if (pan) {
      if (!pan.moved) {
        if (Math.hypot(e.clientX - pan.x0, e.clientY - pan.y0) < 4) return;
        pan.moved = true;
        svg.classList.add("panning");
        try { svg.setPointerCapture(pan.id); } catch (err) {}
      }
      hideTip();
      if (pan.page) {
        window.scrollBy(0, pan.lastY - e.clientY);
        pan.lastY = e.clientY;
        return;
      }
      const x = pan.cx - (e.clientX - pan.x0) * pan.k, y = pan.cy - (e.clientY - pan.y0) * pan.k;
      // with everything in view the plate can be carried until its edge is at the middle of the frame, so it can never be lost
      cam.x = pan.loose ? Math.max(-cam.w / 2, Math.min(W - cam.w / 2, x)) : hold(x, cam.w, W);
      cam.y = pan.loose ? Math.max(-cam.h / 2, Math.min(H - cam.h / 2, y)) : hold(y, cam.h, H);
      applyCam();
      return;
    }
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
  const endPan = e => {
    if (!pan) return;
    justDragged = pan.moved;
    pan = null;
    svg.classList.remove("panning");
    try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
    setTimeout(() => { justDragged = false; }, 60);
  };
  svg.addEventListener("pointerup", endPan);
  svg.addEventListener("pointercancel", endPan);
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
    if (l && !n) { if (tipAt === l && lastPointer !== "mouse") hideTip(); else showTip(l, e); return; }
    hideTip();
    if (n) select({ type: "node", id: n.id });
    else if (t) select({ type: "group", id: catKey(t.getAttribute("data-cat")) });
    else if (state.sel) select(null);
  });

  /* ---------- zoom: from the whole industry into the AI safety field, then closer ---------- */
  let goal = null;   // where the view is heading while it moves, so a second press of + starts from there
  function camGo(t, ms, ease, box) {
    cancelAnimationFrame(camFrame);
    // a change of height cut short by a move that has none is finished on the spot, so the frame is never left part of the way
    if (boxing && !box) { svg.style.height = level ? boxing.h1.toFixed(1) + "px" : ""; view.ar = boxing.w / boxing.h1; pinTrack(); pinTop(boxing.h1); }
    goal = t;
    boxing = box || null;
    if (STILL || document.hidden) ms = 0;
    const a = { x: cam.x, y: cam.y, w: cam.w, h: cam.h }, t0 = performance.now();
    const step = now => {
      const k = ms ? Math.min(1, Math.max(0, (now - t0) / ms)) : 1, e = (ease || easeOut)(k);
      ["x", "y", "w", "h"].forEach(p => { cam[p] = a[p] + (t[p] - a[p]) * e; });
      if (box) {
        // the view keeps the frame's shape at every step, so the map is never squeezed or boxed in while the frame changes height
        const bh = box.h0 + (box.h1 - box.h0) * e;
        svg.style.height = k < 1 || level ? bh.toFixed(1) + "px" : "";
        pinTop(bh);
        if (box.lift) window.scrollTo(0, box.y0 + box.lift * e);
        view.ar = box.w / bh;
        cam.h = cam.w / view.ar;
      }
      zoom = fitW() / cam.w;
      applyCam();
      if (k < 1) { camFrame = requestAnimationFrame(step); return; }
      goal = null;
      if (boxing) { boxing = null; pinTrack(); pinTop(frameH()); }
      drawScale();
    };
    step(t0);
  }
  // the plate can be taller than the window, so "the middle" is the middle of the part of it on screen
  function viewFrac() {
    const r = svg.getBoundingClientRect();
    return Math.max(0.05, Math.min(0.95, ((Math.max(r.top, 0) + Math.min(r.bottom, window.innerHeight)) / 2 - r.top) / (r.height || 1)));
  }
  function zoomBy(f) {
    if (boxing) return;   // the frame is still changing height
    const c = goal || cam, fy = viewFrac();
    camGo(camTarget(fitW() / c.w * f, c.x + c.w / 2, c.y + c.h * fy, 0.5, fy), 260);
  }
  // + and − walk one ladder: whole industry, the AI safety field, then closer in on the field. On the way back out, − widens the view
  // until the whole plate is in it and only then changes level. The wheel and the pinch zoom the plate and never change level.
  // Zoomed into the field there is one more step on the way out: the frame shortens until the whole field fits in the window.
  function zoomStep(dir) {
    hideTip();
    const wide = (goal ? fitW() / goal.w : zoom) <= 1.01;
    if (dir > 0) { if (!level) setLevel(1, LEVEL_MS); else if (wide && fieldF < 0.999) frameTo(1); else zoomBy(1.6); }
    else if (!wide) zoomBy(1 / 1.6);
    else if (!level) camGo(camFit(), 260);   // the plate was carried off its place by a drag: put it back
    else if (level && fieldF > frameLo() + 0.001) frameTo(frameLo());
    else if (level) setLevel(0, LEVEL_MS);
  }
  // when the frame gets shorter while the reader is far down it, the page follows it up, so the map is still in the window afterwards
  // where the top of the frame sits when the zoom strip is held under the page's top bar
  function topEdge() {
    const bar = document.querySelector(".topbar"), strip = fig.querySelector(".web-zoom");
    return (bar ? bar.getBoundingClientRect().bottom : 0) + (strip ? strip.offsetHeight : 0);
  }
  function followUp() {
    const edge = topEdge(), top = svg.getBoundingClientRect().top;
    if (top < edge - 2) window.scrollBy({ top: top - edge, behavior: STILL || document.hidden ? "auto" : "smooth" });
  }
  // The frame goes to a new share of its full height by moving the page to the place on the track that gives it, so the buttons and
  // scrolling are one and the same thing.
  function frameTo(f) {
    if (boxing || !pinOn()) return;
    window.scrollBy({ top: tallH() * (1 - f) - pinAt(), behavior: STILL || document.hidden ? "auto" : "smooth" });
  }
  function zoomToGroup(c) {
    if (!c || CLUSTERS.indexOf(c) < 0) return;
    // the group is fitted into the part of the window that the panel under it leaves free
    const r = svg.getBoundingClientRect(), top = 130, room = window.innerHeight * (state.sel ? 0.56 : 0.9) - top, mid = top + room / 2;
    const w = Math.min(fitW(), Math.max(W / ZMAX, 2 * c.hw + 30, (r.width || W) * (2 * c.hh + 24) / room));
    const t = camTarget(fitW() / w, c.x, c.y, 0.5, Math.max(0, Math.min(1, (mid - r.top) / (r.height || 1))));
    camGo(t, 320);
    const sy = r.top + (c.y - t.y) / t.h * r.height;
    if (Math.abs(sy - mid) > 30) window.scrollBy({ top: sy - mid, behavior: STILL ? "auto" : "smooth" });
  }
  const levelPills = $("webLevel");
  function renderLevel() {
    if (levelPills) levelPills.innerHTML = [["Whole industry", base.length], ["AI safety field", all.length]].map((p, i) =>
      `<button type="button" data-v="${i}" aria-pressed="${i === level}">${p[0]}<span class="c">${p[1]}</span></button>`).join("");
    // Both wordings are kept to three lines at full width and both are laid out, so the row is the same height at either level.
    // The counts that used to sit in the zoomed-in wording are in the caption under the map.
    stack($("webLevelNote"), [
      `The whole AI industry. Zooming in opens up the AI safety field: the ${NFIELD} organisations, programmes and resources on the AISafety.com map, and the money on public record between them.`,
      `Zoomed into the AI safety field: ${NFIELD} entries from the AISafety.com map, in that map's own categories. Money arrows come from four public grant records and from what AI companies have announced. The rest of the industry map is in the band at the bottom.`
    ], level);
    setText("nFieldShared", NSHARED); setText("nFieldAll", NFIELD); setText("nFieldFlows", FLOWS.length); setText("nFieldCorp", CORP_TIES.length);
    const note = $("webFieldNote");
    if (note) note.hidden = !level;
    if (!svg.dataset.label0) svg.dataset.label0 = svg.getAttribute("aria-label") || "";
    svg.setAttribute("aria-label", level ? `Network map zoomed into the AI safety field: ${all.length} bubbles. ${NFIELD} entries from the AISafety.com field map are grouped under its categories, with the companies' own grant programmes in a group of their own, and the groups of the industry map that it does not list sit in a band underneath. ${FLOWS.length} arrows from four public grant records and ${CORP_TIES.length} from company announcements join funders to recipients, wider for larger amounts, next to the ties of the industry map. The same information is in the lists and tables below.` : svg.dataset.label0);
  }
  function setLevel(v, ms) {
    v = v && F ? 1 : 0;
    if (v === level) return;
    const was = new Set(CLUSTERS), h0 = H;
    level = v;
    if (!level && measure.field) measure = bothLevels;
    svg.classList.toggle("lv1", !!level);
    fig.classList.toggle("lv1", !!level);
    assign();
    epoch++;
    // going out, the field's own bubbles stay on the plate until they have shrunk away; settle() takes them off at the end
    fieldNodes.forEach(n => {
      if (level) n.el.classList.remove("away");
      n.lab.classList.toggle("away", !level);
    });
    base.forEach(n => { n.circle.setAttribute("fill", n.c.color); n.el.style.color = n.c.color; });
    if (state.sel && ((state.sel.type === "node" && nodes.indexOf(byId.get(state.sel.id)) < 0) || (state.sel.type === "group" && CLUSTERS.indexOf(C.get(state.sel.id)) < 0))) { state.sel = null; search.value = ""; }
    state.hover = null;
    renderPills();
    renderLens();
    buildItems();
    sizeNodes();
    layout();
    // The field's own bubbles grow where they will stand: each starts at its place on the taller plate, scaled back onto the plate as it
    // stood, so it moves in step with everything around it while the plate opens out. Going back out they shrink the same way.
    if (level) fieldNodes.forEach(n => { n.x = n.tx; n.y = n.ty * h0 / H; n.r = 0; });
    else fieldNodes.forEach(n => { n.gy = n.y * H / h0; });
    EVERY.forEach(c => {
      const on = CLUSTERS.indexOf(c) >= 0;
      c.title.classList.toggle("off", !on);
      c.title.textContent = c.titleText || "";
      if (on && !was.has(c)) { c.title.setAttribute("x", c.titleX.toFixed(1)); c.title.setAttribute("y", c.titleY.toFixed(1)); }
    });
    labelNodes();
    refresh();
    // the view travels to where the new level opens while the bubbles travel to their places, on one easing
    fieldF = 1;   // the field always opens at its full height
    // The track belongs to the level being left, so it goes; the new one is laid when the frame has reached its new height.
    pinClear();
    let lift = 0;
    if (!level) {
      // where the whole-industry frame comes to rest: under the zoom strip, or with its foot at the foot of the window if that is lower
      const gap = svg.getBoundingClientRect().top - Math.max(topEdge(), own.vh - PIN_GAP - own.h);
      if (gap < -2) lift = gap;
    }
    reframe(true, ms, easeInOut, lift);
    if (!level && lift && !boxing) followUp();   // nothing is travelling, so the page is put there at once
    // the number of money signs on an arrow follows its length, so they are set again once the bubbles have arrived
    settle(ms, () => {
      fieldNodes.forEach(n => n.el.classList.toggle("away", !level));
      links.forEach(l => { if (!l.inter) { l.flow.textContent = ""; l.coins = []; l.coinKey = ""; } });
      refresh();
    }, { gone: level ? [] : fieldNodes });
    renderSize();
    renderPanel();
    renderScale();
    renderLevel();
    try {
      const u = new URL(location.href);
      if (level) u.searchParams.set("view", "field"); else u.searchParams.delete("view");
      history.replaceState(null, "", u);
    } catch (err) {}
  }
  if (F) {
    if (levelPills) levelPills.addEventListener("click", e => { const b = e.target.closest("button"); if (b) setLevel(+b.dataset.v, LEVEL_MS); });
    const zi = $("webZoomIn"), zo = $("webZoomOut");
    // the zoom strip stays directly under the bar at the top of the page, whatever height that bar is at this width
    const bar = document.querySelector(".topbar");
    if (bar && window.ResizeObserver) new ResizeObserver(() => fig.style.setProperty("--zoom-top", Math.floor(bar.getBoundingClientRect().height) + "px")).observe(bar);
    if (zi) zi.addEventListener("click", () => zoomStep(1));
    if (zo) zo.addEventListener("click", () => zoomStep(-1));
  } else if ($("webZoomIn")) {
    fig.classList.add("no-field");
  }

  // The wheel zooms the whole-industry map about the pointer, and a pinch on a trackpad, which arrives as a wheel with the control key down,
  // zooms at either level. Zoomed into the field the frame is taller than the window, so there a plain wheel always scrolls the page: going
  // down the map, and drawing it in at its foot, are both done by scrolling (see the track above).
  // The map must not trap the page, so two more kinds of wheel are left to scroll it: one that was already scrolling the page when the
  // pointer came over the map, and one that asks for a wider view when nothing wider is left.
  let wheelOff = -1e9;
  window.addEventListener("wheel", e => { if (!(e.target instanceof Node) || !svg.contains(e.target)) wheelOff = performance.now(); }, { passive: true, capture: true });
  svg.addEventListener("wheel", e => {
    const pinch = e.ctrlKey || e.metaKey, now = performance.now();
    if (boxing) return;
    const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY, factor = Math.exp(-dy * (pinch ? 0.012 : 0.0022));
    if (level && !pinch) return;
    if (!pinch && now - wheelOff < 350) { wheelOff = now; return; }
    if (zoom <= 1.001 && dy >= 0) { if (pinch) e.preventDefault(); return; }
    e.preventDefault();
    const p = toStage(e), r = svg.getBoundingClientRect();
    const t = camTarget(zoom * factor, p.x, p.y, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    cancelAnimationFrame(camFrame);
    goal = null;
    cam.x = t.x; cam.y = t.y; cam.w = t.w; cam.h = t.h; zoom = fitW() / cam.w;
    applyCam();
    hideTip();
    clearTimeout(scaleSoon);
    scaleSoon = setTimeout(drawScale, 140);
  }, { passive: false });
  svg.addEventListener("dblclick", e => {
    if (boxing || nodeAt(e) || (e.target.closest && e.target.closest(".ctitle"))) return;
    const p = toStage(e), r = svg.getBoundingClientRect();
    camGo(camTarget(zoom * 1.8, p.x, p.y, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height), 260);
  });

  // the lists further down the page can ask the map to show a bubble: it zooms in if it has to, picks the bubble and brings it into view
  window.ECO_MAP = { show(id) {
    const n = byId.get(id);
    if (!n) return;
    if (nodes.indexOf(n) < 0) setLevel(1, 0);
    select({ type: "node", id }, true);
  } };

  refresh();
  renderSize();
  renderPanel();
  // a link that asks for a grant measure can only be honoured zoomed in, so it is applied as the map opens on the field
  if (F) { renderLevel(); if (QS.get("view") === "field") { if (asked && asked.field) measure = asked; setLevel(1, 0); } }
  applyCam();
})();
