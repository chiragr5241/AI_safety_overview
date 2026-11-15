/* Data for reports.html, read on 12 November 2026; grant figures rebuilt on 15 November 2026.
   'fund' is itemised grants to each organisation in AISafety.fund's database (CC BY-NC-SA 4.0). Each figure adds every spelling of the recipient the database lists
   ("X", "X (via Jaan Tallinn)", an earlier name). Rows the database leaves out of its totals (conditional matching pledges,
   repeats of one gift) are left out here too. An entry with no figure has no grant row.
   A bubble on the page is sized by this figure (a lower bound), or the money an organisation reports itself ('reported'),
   plus any published investment ('invest' below). The site's own grant records are compared with it in the data audit on experiments.html. Keys are the field map ids without the "f_" prefix. */
window.REPORT = {
  read: "2026-11-12",
  fundSource: { name: "AISafety.fund", url: "https://aisafety.fund/", licence: "CC BY-NC-SA 4.0", version: 16714 },

  /* Technical safety research: each of the 50 looked up by name. */
  /* Every entry's counted grants in AISafety.fund, from the local copy of its database (evidence/aisafety_fund, pulled through its MCP server
     on 15 November 2026, data version 16714) and matched to map entries by evidence/aisafety_fund/build.py. An entry not listed has no row. */
  fund: {
    lawzero: 228985396, resolution: 160000000, redwood_research: 139324971, cset: 122073000, epoch_ai: 94761872, rand: 83430751,
    far_ai: 66639276, mats: 58711127, kairos: 53437080, govai: 48608352, iaps: 35256182, bluedot: 30149324, openai: 30000000,
    longview: 29729707, constellation: 26250000, miri: 23662373, metr: 23417000, lightcone: 18694765, cais: 17647788,
    ai_digest: 16633505, beri: 15466022, aigi: 14833018, geodesic: 14296046, lawai: 12879479, palisade: 12244177,
    arcadia_impact: 12229609, caif: 11422847, cltr: 10816746, cbai: 10726303, simon_institute: 10003633, ought: 9328333,
    metaculus: 8194788, talos_fellowship: 7589189, chai: 6747550, apollo: 6672180, arc: 5785043, aifp: 5389022, aiss: 5235352,
    averi: 5000000, lisa: 4702962, ai_impacts: 4536210, meridian: 4299534, era_ai_fellowship: 4172685, successif: 4054570,
    iaseai: 4000000, pivotal_fellowship: 3751690, ashgro: 3718896, princint: 3644555, simplex: 3355700, acs: 3318700,
    pai: 3305000, fli: 3239000, foresight_institute: 3148000, clr: 3136627, manifold_markets: 3084000, heron: 3055164,
    chinatalk: 3020017, encode: 3000000, ari: 3000000, vista_institute: 2989873, good_impressions: 2835000, eip: 2790000,
    aoi: 2752000, fri: 2747850, eleutherai: 2642273, lesswrong: 2303760, carma: 2300000, good_ancestors: 2278356, aipi: 2277000,
    pauseai: 2120574, nightingale: 1963400, rational_animations: 1946249, tfs: 1879000, ist: 1840773, saif: 1747513,
    saferai: 1669515, tfi: 1633659, aiaf: 1570000, fig_fellowship: 1552586, arena: 1435258, apart: 1428838, catalyze: 1415963,
    pibbss: 1411000, secure_ai_project: 1241064, aisc: 1221938, lasst: 1218000, ceealar: 1185046, iliad: 1175496,
    conjecture: 1149083, ai_standards_lab: 1130000, ml4good: 1095293, cesia: 1034310, dovetail: 1019000, gcp: 1008465,
    mai: 831196, legal_safety_lab: 811000, cltc: 808353, sash: 779167, ilina: 764170, aether: 756570, orthogonal: 753000,
    nonlinear: 599000, gcri: 575850, modeling_cooperation: 571416, coral: 560300, neo_research: 553000, alter: 552800,
    caml: 534000, rob_miles: 507537, aistof: 500000, forethought: 483899, affine: 477000, lens: 452000, cadenza_labs: 441549,
    roman_yampolskiy: 429000, equistamp: 400000, non_trivial: 350195, convergence: 338000, xlab_fellowship: 329000,
    future_matters: 299460, lasr_labs: 288732, cser: 283500, aiwi: 251000, founders_pledge: 232668, cfg: 223834,
    algoverse: 216769, vanessa_kosoy: 200000, zvi_mowshowitz: 200000, aed: 190330, spar: 189350, aisafety_info: 162000,
    manifund: 155000, luthien: 150000, aisafety_com: 150000, dylan_hadfield_menell: 134175, evitable: 111802, athena: 91600,
    softmax: 90000, cavendish_labs: 88000, formation_research: 87300, ero: 78484, harmony: 54270, axrp: 51102,
    humans_in_control: 48000, transluce: 40250, gwwc: 36000, tmp: 31000, tara: 14901, base: 14100, dr_waku: 10000,
    odyssean_institute: 7900, ai_plans: 5370
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
    ae_studio: "One undisclosed row of $75,000 matches the name; it is not counted here.",
    aisafety_com: "One row: SFF's 2026 main round, $150,000 through Ashgro. AISafety.com's own about page says it runs on about $150k a year of SFF funding, which pays one full-time and one part-time salary.",
    aed: "LTFF ($99k) and SFF ($91k). AED builds AISafety.com and AISafety.info; their own grants are counted under them.",
    pibbss: "Rows under PIBBSS. Principles of Intelligence, the organisation that runs it, is counted apart.",
    sash: "Leaves out $553k to Neo Research that passed through it as fiscal sponsor.",
    gcri: "Leaves out grants to Lens Academy and AFFINE through the Beacon Institute, and Beacon's own grant.",
    convergence: "Leaves out a grant to Modeling Cooperation that passed through it.",
    alter: "Rows named ALTER only; the name search also matched unrelated recipients.",
    aiwi: "Recorded under its former name, OAISIS, through Whistleblower Netzwerk.",
    aisc: "Leaves out the Swiss AI Safety Summer Camp and AI Safety Camp Toronto, separate events."
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
