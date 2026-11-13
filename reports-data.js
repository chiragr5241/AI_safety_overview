/* Data for reports.html, read on 12 November 2026.
   'fund' is the audit: itemised grants to each organisation in AISafety.fund's database, read through its MCP server
   (data version 14388, CC BY-NC-SA 4.0). Each figure adds every spelling of the recipient the database lists
   ("X", "X (via Jaan Tallinn)", an earlier name). Rows the database leaves out of its totals (conditional matching pledges,
   repeats of one gift) are left out here too. Null means the organisation was looked up and no grant row was found.
   A bubble on the page is sized by the larger of this figure and the site's own five grant records (field-data.js),
   both being lower bounds, plus any published investment ('invest' below). Keys are the field map ids without the "f_" prefix. */
window.REPORT = {
  read: "2026-11-12",
  fundSource: { name: "AISafety.fund", url: "https://aisafety.fund/", licence: "CC BY-NC-SA 4.0", version: 14388 },

  /* Technical safety research: each of the 50 looked up by name. */
  fund: {
    lawzero: 228985396, resolution: 160000000, redwood_research: 139324971, far_ai: 65956276, metr: 23417000,
    cais: 16740788, geodesic: 14295046, palisade: 12244177, arcadia_impact: 12229609, ought: 8536333,
    apollo: 6672180, averi: 5000000, eleutherai: 2923273, aoi: 2752000, simplex: 2634700, saferai: 1669515,
    conjecture: 1221910, mai: 831196, cltc: 808353, aether: 756570, neo_research: 553000, caml: 477000,
    cadenza_labs: 441549, luthien: 150000, softmax: 90000, cavendish_labs: 88000, formation_research: 87300,
    harmony: 54270, transluce: 40250,
    truthfulai: null, aligned_ai: null, goodfire: null, gray_swan: null, neuronpedia: null, generality: null,
    contramont: null, eurosafeai: null, paradigm_3: null, ssi: null, baif: null, ae_studio: null, casp: null,
    arg: null, aag: null, fair: null, safl: null, beijing_aisi: null, cbl: null, janus: null, alignment_forum: null,

    /* The rest of the map: matched by name against the database's 200 largest recipients (every recipient above about $1.3M). */
    cset: 122073000, epoch_ai: 93309897, rand: 83430751, mats: 56307205, kairos: 53437080, govai: 47107352,
    iaps: 34316132, bluedot: 30136024, openai: 30000000, longview: 29429707, constellation: 26250000, miri: 21678379,
    lightcone: 17956300, ai_digest: 16040775, beri: 14595184, aigi: 14128018, lawai: 12401954, caif: 11422847,
    cbai: 10230303, simon_institute: 8858633, cltr: 8401746, talos_fellowship: 7466189, metaculus: 6678400,
    arc: 5785043, aifp: 5345000, aiss: 4960352, lisa: 4702962, meridian: 4299534, era_ai_fellowship: 4172685,
    successif: 4054570, iaseai: 3800000, pivotal_fellowship: 3751690, princint: 3491355, pai: 3305000,
    manifold_markets: 3084000, heron: 3055164, chinatalk: 3000000, ari: 3000000, vista_institute: 2989873,
    ai_impacts: 2972578, good_impressions: 2835000, clr: 2574627, fli: 2364000, carma: 2300000, aipi: 2077000,
    foresight_institute: 2022000, encode: 2000000, nightingale: 1963400, rational_animations: 1946249,
    fri: 1879850, eip: 1876000, aiaf: 1570000, pauseai: 1497000, arena: 1435258, acs: 3260700, catalyze: 1341963
  },

  /* Notes shown beside a figure in the audit table. */
  fundNote: {
    metr: "Eight counted rows: the Audacious Project ($17M, 2024), SFF and Jaan Tallinn, the Future of Life Institute, Longview. METR says it raised about $71M in the six months to 14 August 2026; most of that is not itemised by donor.",
    truthfulai: "No row under this name. Three grants to its director, Owain Evans, come to $0.7M. The site’s Coefficient Giving record has $7.8M.",
    resolution: "One row: Coefficient Giving’s announced $160M. The site’s record keeps a $52M conditional tranche apart.",
    goodfire: "A company funded by investors.",
    ssi: "A company funded by investors. No grant row.",
    gray_swan: "A company funded by investors. No grant row.",
    conjecture: "Grants from Coefficient Giving, and venture investors.",
    apollo: "Includes a grant from the AI Safety Fund, which the Frontier Model Forum’s member companies pay for. Its 2026 seed round, led by 50Y, has no published amount.",
    softmax: "Backed by Andreessen Horowitz and others; no published amount.",
    lawzero: "Four rows, mostly government commitments from Germany and Canada.",
    ae_studio: "One undisclosed row of $75,000 matches the name; it is not counted here."
  },

  /* Venture and other investment, counted in a bubble's size beside grants. Only published rounds. */
  invest: {
    ssi: { usd: 3000000000, what: "At least $3B in two disclosed rounds ($1B in 2024, $2B in 2025). Press reports of more are not corroborated.", url: "https://www.maginative.com/article/sutskevers-safe-superintelligence-raises-another-2b-at-32b-valuation//" },
    goodfire: { usd: 200000000, what: "A $50M Series A and a $150M Series B.", url: "https://finance.yahoo.com/news/ai-lab-goodfire-raises-150m-150100095.html" },
    gray_swan: { usd: 50000000, what: "A $40M Series A in 2026 and $10M of earlier capital.", url: "https://www.grayswan.ai/news/gray-swan-announces-series-a" },
    conjecture: { usd: 25000000, what: "About $25M of venture money, reported in 2022.", url: "https://www.longtermwiki.com/organizations/conjecture" }
  },
  /* Money an organisation reports itself, where grant records itemise less. Used in place of the grant figure, not added to it. */
  reported: { metr: 71000000 },

  /* The gaps third parties say they fill, with the technical organisations whose own descriptions make each claim. */
  promises: [
    { label: "A lab's self-assessment is not enough", orgs: ["averi", "metr", "transluce"] },
    { label: "Safety measurements are unreliable", orgs: ["generality", "neo_research", "saferai"] },
    { label: "Compliance can hide deception", orgs: ["apollo", "cadenza_labs", "aether", "contramont"] },
    { label: "A safe test is not control in deployment", orgs: ["redwood_research", "luthien", "gray_swan"] },
    { label: "We do not understand how models work", orgs: ["simplex", "goodfire"] },
    { label: "Mainstream alignment is too narrow", orgs: ["ae_studio", "resolution", "geodesic"] },
    { label: "Today's architectures are unsafe by design", orgs: ["conjecture", "lawzero", "ssi"] },
    { label: "Alignment neglects institutions and values", orgs: ["aoi", "mai", "formation_research", "caml"] },
    { label: "Evidence does not become policy", orgs: ["casp", "cltc"] },
    { label: "Access and talent are uneven", orgs: ["eleutherai", "neuronpedia", "arcadia_impact", "fair", "safl"] }
  ],

  /* The four a reader can choose between, with the gap each claims. Only METR is written. */
  choices: {
    metr: { gap: "Developer self-assessment is insufficient.", ready: true },
    apollo: { gap: "Apparent compliance can conceal deception or dangerous capabilities." },
    goodfire: { gap: "We lack scientific understanding of how models work." },
    redwood_research: { gap: "Safe behavior in a test does not establish control during deployment." }
  },

  /* SB 315's test for a "large frontier developer": over $500M in annual gross revenue, affiliates included,
     or training compute above 10^26 operations. Figures are the ones already on the ecosystem map (size-data.js). */
  /* 'safe' is the lab's own safety work: AISafety.fund's estimate of 2026 spending ($2,483M across labs, full-year estimate),
     split by its 2026 shares (Anthropic 64.84%, OpenAI 21.14%, Google DeepMind 7.53%, xAI 0.56%; Microsoft and Meta are not on the map).
     Read from the site's chart data on 13 November 2026. 'safePct' is the share of money raised ('raised') assumed for safety where there is no estimate.
     'val' is what a lab's bubble is sized by on the opening steps: its valuation, in US dollars. 'est' marks an outside estimate for a lab with no valuation of its own. */
  labs: [
    { id: "anthropic", meets: true, why: "Revenue run-rate far above $500M", val: 965000000000, valNote: "Post-money valuation, May 2026 round", safe: 1610000000 },
    { id: "deepmind", meets: true, why: "Part of Alphabet: $402.8B revenue in 2025", val: 900000000000, est: true, valNote: "Analyst estimate (DA Davidson) for DeepMind together with Google's chip business as a standalone company. DeepMind has no valuation of its own, so this overstates it", url: "https://rallies.ai/news/deepmind-ceo-forecasts-ai-renaissance-as-shares-trade-67-above-286-value", safe: 187000000 },
    { id: "openai", meets: true, why: "Revenue far above $500M a year", val: 852000000000, valNote: "Post-money valuation, March 2026 round", safe: 525000000 },
    { id: "spacexai", meets: true, why: "SpaceX's AI segment: about $3.2B revenue in 2025 (press reports on its S-1)", val: 250000000000, est: true, valNote: "Value put on xAI when SpaceX absorbed it in February 2026, as reported by Bloomberg", url: "https://news.bloomberglaw.com/tech-and-telecom-law/elon-musks-spacex-said-to-combine-with-xai-ahead-of-mega-ipo", safe: 13900000 },
    { id: "deepseek", meets: false, aside: true, head: "Just under the revenue line", why: "Run-rate reported as approaching $500M (one press report, July 2026). Compute not published", val: 49000000000, est: true, valNote: "About 351 billion yuan, implied by a filing (press estimate)", raised: 7400000000, raisedNote: "Its first outside round, about $7.4B in June 2026, as reported from filings", raisedUrl: "https://www.trendingtopics.eu/deepseek-raises-7-4-billion-only-the-chinese-state-gets-voting-rights/", safePct: 0.01 },
    { id: "ssi", meets: false, aside: true, head: "The only “frontier” lab with a safety focus", why: "No revenue. Compute not published", val: 32000000000, valNote: "Valuation at its April 2025 round. It has raised at least $3B", raised: 3000000000, raisedNote: "Two disclosed rounds, $1B in 2024 and $2B in 2025", raisedUrl: "https://www.maginative.com/article/sutskevers-safe-superintelligence-raises-another-2b-at-32b-valuation//", safePct: 0.1 }
  ],


  /* The seven groups the chart sorts third parties into, in the order of the brief. */
  groups: ["training_and_education", "governance", "empirical_research", "funding", "conceptual_research", "advocacy", "strategy"],

  /* The four organisations the report follows, one for each of four claimed gaps. */
  picks: ["metr", "apollo", "goodfire", "redwood_research"]
};
