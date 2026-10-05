/* What a bubble's size can stand for on the map at the top of ecosystem.html, and the figure behind each bubble.
   Collected on 5 October 2026 and kept apart from ecosystem-data.js, which is the version 1.0 stakeholder dataset.
   Rules, in keeping with that dataset:
   - every figure carries where it comes from, what it counts and when; nothing here is added up;
   - an actor with no entry under a measure is "not stated", which is not zero;
   - "est" marks a press report or a third-party tracker, where the organisation itself publishes no figure;
   - "fin" points at a financial observation already in ecosystem-data.js instead of repeating it.
   Money in another currency is given as stated. FX is used only to place a bubble on the shared scale. */
window.ECO_SIZE = {
  retrieved: "2026-10-05",
  // rough US dollars per unit, for placing a bubble on a scale where one step is ten times more
  fx: { USD: 1, EUR: 1.1, GBP: 1.3, CNY: 0.14, JPY: 0.0067, KRW: 0.0007 },

  /* ---------- people: employees or staff ---------- */
  people: {
    nvidia: { v: 42000, text: "about 42,000 employees", when: "end of fiscal 2026 (January 2026)", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm" },
    amd: { v: 31000, text: "about 31,000 employees", when: "27 December 2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/2488/000000248826000018/amd-20251227.htm" },
    tsmc: { v: 90557, text: "90,557 employees", when: "31 December 2025", basis: "2025 annual report", url: "https://investor.tsmc.com/static/annualReports/2025/english/index.html" },
    asml: { v: 44000, text: "more than 44,000 employees (full-time equivalents)", when: "end of 2025", basis: "2025 annual report", url: "https://www.asml.com/en/investors/annual-report/2025" },
    sk: { v: 34549, text: "34,549 employees", when: "end of 2025", basis: "Press report (The Korea Herald)", est: true, url: "https://www.koreaherald.com/article/10771107" },
    samsung: { v: 262647, text: "262,647 employees worldwide", when: "as given in the 2025 report", basis: "Sustainability Report 2025", url: "https://www.samsung.com/global/sustainability/media/pdf/Samsung_Electronics_Sustainability_Report_2025_ENG.pdf" },
    intel: { v: 85100, text: "85,100 employees", when: "27 December 2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/50863/000005086326000011/intc-20251227.htm" },
    broadcom: { v: 33000, text: "about 33,000 employees", when: "2 November 2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/1730168/000173016825000121/avgo-20251102.htm" },
    huawei: { v: 213000, text: "about 213,000 employees", when: "2025", basis: "Press report on the 2025 annual report (Light Reading)", est: true, url: "https://www.lightreading.com/5g/huawei-sales-growth-plummeted-in-2025-as-it-gained-5-000-workers" },
    microsoft: { v: 223000, text: "about 223,000 full-time employees", when: "30 June 2026", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/0000789019/000119312526323660/msft-20260630.htm" },
    google: { v: 190820, text: "190,820 employees", when: "31 December 2025", basis: "Form 10-K (Alphabet)", url: "https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm" },
    amazon: { v: 1576000, text: "about 1,576,000 full-time and part-time employees", when: "31 December 2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm" },
    oracle: { v: 141000, text: "about 141,000 full-time employees", when: "31 May 2026", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/0001341439/000119312526277521/orcl-20260531.htm" },
    coreweave: { v: 2189, text: "2,189 employees", when: "31 December 2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000104/crwv-20251231.htm" },
    spacex: { v: 22000, text: "more than 22,000 full-time employees", when: "31 March 2026", basis: "Form S-1", url: "https://www.sec.gov/Archives/edgar/data/0001181412/000162828026036936/spaceexplorationtechnologi.htm" },
    meta: { v: 78865, text: "78,865 employees", when: "31 December 2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/1326801/000162828026003942/meta-20251231.htm" },
    softbank: { v: 76866, text: "76,866 employees across the consolidated group", when: "end of the fiscal year in the report", basis: "SoftBank Group annual report", url: "https://group.softbank/media/Project/sbg/sbg/pdf/ir/financials/annual_reports/annual-report_fy2025_07_en.pdf" },
    openai: { v: 4500, text: "about 4,500 employees", when: "early 2026", basis: "Financial Times report, as relayed by SQ Magazine", est: true, note: "The same report describes a plan to reach about 8,000 by the end of 2026.", url: "https://sqmagazine.co.uk/how-many-people-work-at-openai/" },
    anthropic: { v: 3950, text: "about 3,950 employees", when: "March 2026", basis: "Third-party tracker (Revelio Labs)", est: true, note: "Anthropic publishes no headcount. Other estimates run from about 2,500 to about 5,000.", url: "https://www.reveliolabs.com/companies/anthropic-pbc/employees" },
    deepmind: { v: 5090, text: "about 5,090 employees", when: "March 2026", basis: "Third-party tracker (Revelio Labs)", est: true, note: "A unit of Google, with no separate filing. Other trackers put it as high as about 10,300.", url: "https://www.reveliolabs.com/companies/deepmind/employees" },
    mistral: { v: 1258, text: "about 1,260 employees", when: "March 2026", basis: "Third-party tracker (Revelio Labs)", est: true, note: "Other trackers put it at 1,500 to 1,600 by August 2026.", url: "https://www.reveliolabs.com/companies/mistral-ai/employees" },
    deepseek: { v: 452, text: "about 450 employees", when: "March 2026", basis: "Third-party tracker (Revelio Labs)", est: true, note: "Other sources report 150 to 200 before an expansion announced in June 2026.", url: "https://www.reveliolabs.com/companies/deepseek/employees" },
    moonshot: { v: 300, text: "about 300 employees", when: "2026", basis: "Wikipedia entry for Moonshot AI", est: true, url: "https://en.wikipedia.org/wiki/Moonshot_AI" },
    rand: { v: 2000, text: "about 2,000 staff", when: "2024", basis: "Wikipedia entry for RAND", est: true, note: "All of RAND, not only its AI work.", url: "https://en.wikipedia.org/wiki/RAND_Corporation" },
    metr: { v: 46, text: "46 staff listed", when: "October 2026", basis: "Count of its own team page, advisers left out", url: "https://metr.org/about" },
    far: { v: 48, text: "48 people listed, six of them collaborators", when: "October 2026", basis: "Count of its own team page, board and adviser left out", url: "https://far.ai/about/team" },
    epoch: { v: 51, text: "51 staff listed", when: "October 2026", basis: "Count of its own team page, board and advisers left out", url: "https://epoch.ai/about/team" },
    govai: { v: 57, text: "57 staff listed", when: "October 2026", basis: "Count of its own people page, affiliates and board left out", url: "https://www.governance.ai/people" },
    miri: { v: 27, text: "about 27 staff listed", when: "October 2026", basis: "Count of its own team page, board left out", url: "https://intelligence.org/team/" },
    iaps: { v: 38, text: "38 staff listed", when: "October 2026", basis: "Count of its own team page, board and affiliates left out", url: "https://www.iaps.ai/our-team" },
    cset: { v: 51, text: "51 staff listed", when: "October 2026", basis: "Count of its own team page", url: "https://cset.georgetown.edu/team/" },
    ada: { v: 33, text: "33 staff listed", when: "October 2026", basis: "Count of its own people page, board and fellows left out", url: "https://www.adalovelaceinstitute.org/about/our-people/" },
    mats: { v: 54, text: "about 54 staff listed", when: "October 2026", basis: "Count of its own team page, board and mentors left out", est: true, note: "The page lists teams of different sizes and the count is approximate.", url: "https://www.matsprogram.org/team" },
    bluedot: { v: 16, text: "a team of 16", when: "October 2026", basis: "Its own about page", url: "https://bluedot.org/about" },
    aisi: { v: 100, text: "more than 100 technical staff", when: "October 2026", basis: "Its own about page", note: "Technical staff only. Policy, operations and strategy teams are not counted in the figure.", url: "https://www.aisi.gov.uk/about" },
    eu: { v: 140, text: "more than 140 staff in the AI Office", when: "2026", basis: "Press report (Agence Europe)", est: true, note: "The AI Office only, not the Commission.", url: "https://agenceurope.eu/en/bulletin/article/13883/11/40-of-140-staff-members-of-european-commissions-ai-office-work-on-ai-safety" },
    ftc: { v: 1225, text: "1,225 full-time equivalent staff", when: "fiscal 2025", basis: "FTC appropriation and FTE history", url: "https://www.ftc.gov/about-ftc/bureaus-offices/office-chief-financial-officer/ftc-appropriation" }
  },

  /* ---------- money: one yearly figure per actor ---------- */
  // kind says what the figure is. Valuations, assets under management, financing rounds and multi-year totals are left out.
  money: {
    nvidia: { fin: "F014", kind: "Revenue" },
    amd: { fin: "F015", kind: "Revenue" },
    tsmc: { fin: "F017", kind: "Revenue" },
    asml: { fin: "F018", kind: "Revenue" },
    sk: { fin: "F019", kind: "Revenue" },
    samsung: { fin: "F020", kind: "Revenue" },
    intel: { v: 52.9e9, cur: "USD", kind: "Revenue", when: "2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/50863/000005086326000011/intc-20251227.htm" },
    broadcom: { v: 63.887e9, cur: "USD", kind: "Revenue", when: "fiscal 2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/1730168/000173016825000121/avgo-20251102.htm" },
    huawei: { v: 880.9e9, cur: "CNY", kind: "Revenue", when: "2025", basis: "2025 annual report announcement", url: "https://www.huawei.com/en/news/2026/3/annual-report-2025" },
    microsoft: { v: 331.839e9, cur: "USD", kind: "Revenue", when: "fiscal 2026", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/0000789019/000119312526323660/msft-20260630.htm" },
    google: { v: 402.8e9, cur: "USD", kind: "Revenue", when: "2025", basis: "Form 10-K (Alphabet)", url: "https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm" },
    amazon: { v: 716.924e9, cur: "USD", kind: "Revenue", when: "2025", basis: "Form 10-K", note: "All of Amazon. The cloud arm, AWS, accounts for USD 128.7bn of it.", url: "https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm" },
    oracle: { v: 67.357e9, cur: "USD", kind: "Revenue", when: "fiscal 2026", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/0001341439/000119312526277521/orcl-20260531.htm" },
    coreweave: { v: 5.131e9, cur: "USD", kind: "Revenue", when: "2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/1769628/000176962826000104/crwv-20251231.htm" },
    spacex: { v: 18.674e9, cur: "USD", kind: "Revenue", when: "2025", basis: "Form S-1", note: "Restated in the filing to include xAI and X.", url: "https://www.sec.gov/Archives/edgar/data/0001181412/000162828026036936/spaceexplorationtechnologi.htm" },
    meta: { v: 200.97e9, cur: "USD", kind: "Revenue", when: "2025", basis: "Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/1326801/000162828026003942/meta-20251231.htm" },
    softbank: { v: 7243.752e9, cur: "JPY", kind: "Revenue", when: "the fiscal year in the report", basis: "SoftBank Group annual report", url: "https://group.softbank/media/Project/sbg/sbg/pdf/ir/financials/annual_reports/annual-report_fy2025_07_en.pdf" },
    openai: { fin: "F003", kind: "Revenue, one month", times: 12, note: "The source states one month of revenue. The bubble is placed at twelve times that; the dataset itself does not annualise it." },
    anthropic: { fin: "F009", kind: "Revenue run-rate" },
    cg: { fin: "F038", kind: "AI safety funding, one published estimate" },
    longview: { fin: "F039", kind: "AI safety funding, one published estimate" },
    macro: { fin: "F040", kind: "AI safety funding, one published estimate" },
    sff: { fin: "F041", kind: "AI safety funding, one published estimate" },
    schmidt: { fin: "F042", kind: "AI safety funding, one published estimate" },
    aistof: { fin: "F043", kind: "AI safety funding, one published estimate" },
    manifund: { fin: "F044", kind: "AI safety funding, one published estimate" },
    taif: { fin: "F045", kind: "AI safety funding, one published estimate" },
    aisf: { fin: "F031", kind: "Grants awarded" },
    metr: { fin: "F028", kind: "Funding commitments received, six months" },
    far: { fin: "F027", kind: "Funding commitments received" },
    redwood: { v: 12590834, cur: "USD", kind: "Expenses", when: "2023", basis: "Form 990, via ProPublica Nonprofit Explorer", note: "The latest filing with figures. A two-year support recommendation above USD 70m is in the financial observations and is left out here because it covers more than a year.", url: "https://projects.propublica.org/nonprofits/organizations/871702255" },
    rand: { v: 413015979, cur: "USD", kind: "Expenses", when: "year to September 2023", basis: "Form 990, via ProPublica Nonprofit Explorer", note: "All of RAND, not only its AI work.", url: "https://projects.propublica.org/nonprofits/organizations/951958142" },
    brookings: { v: 98831178, cur: "USD", kind: "Expenses", when: "year to June 2023", basis: "Form 990, via ProPublica Nonprofit Explorer", url: "https://projects.propublica.org/nonprofits/organizations/530196577" },
    carnegie: { v: 52595867, cur: "USD", kind: "Expenses", when: "year to June 2024", basis: "Form 990, via ProPublica Nonprofit Explorer", url: "https://projects.propublica.org/nonprofits/organizations/130552040" },
    chamber: { v: 197575321, cur: "USD", kind: "Expenses", when: "2023", basis: "Form 990, via ProPublica Nonprofit Explorer", url: "https://projects.propublica.org/nonprofits/organizations/530045720" },
    sag: { v: 108964258, cur: "USD", kind: "Expenses", when: "year to April 2023", basis: "Form 990, via ProPublica Nonprofit Explorer", url: "https://projects.propublica.org/nonprofits/organizations/454931719" },
    aisi: { v: 66e6, cur: "GBP", kind: "Funding per financial year", when: "October 2026", basis: "Its own about page", url: "https://www.aisi.gov.uk/about" },
    caisi: { v: 10e6, cur: "USD", kind: "Appropriation", when: "fiscal 2026", basis: "Press report (FedScoop)", est: true, note: "CAISI only, not NIST.", url: "https://fedscoop.com/caisi-would-benefit-from-more-resources-ostp-director-tells-lawmakers/" },
    bis: { v: 303e6, cur: "USD", kind: "Budget request", when: "fiscal 2026", basis: "Congressional budget submission", note: "A request, not the enacted amount.", url: "https://commerce.gov/sites/default/files/2025-06/BIS-FY2026-Congressional-Budget-Submission.pdf" },
    ftc: { v: 383.6e6, cur: "USD", kind: "Appropriation", when: "fiscal 2026", basis: "FTC appropriation and FTE history", url: "https://www.ftc.gov/about-ftc/bureaus-offices/office-chief-financial-officer/ftc-appropriation" },
    leading: { fin: "F034", kind: "Receipts" },
    publicfirst: { fin: "F036", kind: "Receipts" }
  },

  /* ---------- influence: one named, published and subjective list ---------- */
  // TIME's editors chose the list. A person is matched to an actor only where TIME's own title line names that organisation,
  // or an office that falls squarely inside one of the map's group actors. Everyone else on the list belongs to no bubble.
  time100: {
    title: "TIME100 AI 2026",
    publisher: "TIME",
    date: "2026-08-26",
    url: "https://time.com/collection/time100-ai/2026/",
    people: 100,
    matches: {
      openai: ["Mark Chen, Chief Research Officer", "Sam Altman, CEO", "Greg Brockman, President"],
      anthropic: ["Dario Amodei, Co-founder", "Daniela Amodei, Co-founder", "Jack Clark, Co-founder and Head of Public Benefit"],
      uspolicy: ["David Sacks, Co-Chair, President's Council of Advisors on Science and Technology", "Bernie Sanders, U.S. Senator", "Emil Michael, Under Secretary of War for Research and Engineering"],
      google: ["Elizabeth Reid, VP and Head of Search", "Marian Croak, VP, Responsible AI and Human Centered Technology"],
      amazon: ["Jeff Bezos, Founder", "Matt Garman, CEO, Amazon Web Services"],
      deepmind: ["Lila Ibrahim, Chief AI Readiness Officer"],
      spacex: ["Elon Musk, CEO"],
      broadcom: ["Hock Tan, CEO"],
      caisi: ["Arvind Raman, Acting head, U.S. CAISI; Director, NIST"],
      oracle: ["Larry Ellison, Co-founder, CTO and Executive Chairman"],
      huawei: ["He Tingbo, Director"],
      qwen: ["Eddie Wu, CEO, Alibaba"],
      coreweave: ["Michael Intrator, Co-founder and CEO"],
      moonshot: ["Yang Zhilin, Co-founder and CEO"],
      nvidia: ["Josh Parker, Head of Sustainability"],
      metr: ["Beth Barnes, Founder and CEO"],
      labor: ["Liz Shuler, President"],
      oecd: ["Karine Perset, Deputy Head of AI and Emerging Digital Technologies Division"],
      energy: ["Joe Dominguez, President and CEO, Constellation Energy Group"],
      journalism: ["A.G. Sulzberger, Publisher and Chairman, The New York Times Co."]
    },
    // the three group actors above are a reading of the list, not TIME's own grouping
    groupActors: ["uspolicy", "energy", "journalism"]
  }
};
