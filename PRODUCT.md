# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Policy, governance and other non-technical readers. They need the ideas in a research report on multi-agent AI risk without the maths or a machine-learning background, and they are unlikely to read the full report themselves.

## Product Purpose

The site, "AI Safety Overview", explains AI safety to political scientists and other policy readers. Its main page (`index.html`) states the site's goals as three doors, one per goal, and nothing else. The top three for now:

1. Cover the high-level AI risks. Served so far by the "When AIs Meet AIs" guide (`multi-agent-risks.html`).
2. Define the terms. Served by the field primer and glossary inside the guide, and by the terms list on the ecosystem page.
3. Map the AI industry and its ecosystem. Served by "Who has a stake in AI safety?" (`ecosystem.html`), built from the stakeholder map dataset (version 1.0, evidence through 4 October 2026).

Later goals, not yet covered: a historical comparison with other industries, the roles of government, industry and universities, and supporting documents for the Chicago Research Symposium.

"When AIs Meet AIs" is a beginner's guide to Hammond et al. (2025), *Multi-Agent Risks from Advanced AI* (Cooperative AI Foundation Technical Report #1, arXiv 2502.14143). It walks through the report's three failure modes, seven risk factors and 13 case studies, then what the report says to do about them.

It is a portfolio and public writing piece: its job is to show the author's ability to explain research to a non-specialist audience. Success is a policy or non-technical reader coming away with the report's ideas, and the piece standing as a credible example of that kind of explanation.

## Reading Model

Set by the author on 5 October 2026: the site must not overwhelm a general reader with text. It draws the reader in with visuals, examples and graphs that carry the story, and the reader seeks out the rest. All of the content stays. Nothing is cut or condensed to make a page shorter.

- Each idea is a unit: a one-line definition, an everyday version, and a visual to look at or try. These are always in view.
- The reasoning, the evidence and the fixes sit in layers under the unit. A closed layer says what is inside it, and an evidence layer shows the figure that makes it worth opening.
- A link, a hash or the quiz's "worth another look" list that points inside a closed layer opens it. One switch opens every layer on a page, and printing prints everything.
- Shared code: `explore.css` and `explore.js` (layers, folding, the open-all switch, and the registry for visual slots).
- Visuals live in slots marked `data-visual="id"`. `visuals.js` and `visuals.css` fill them. The page owns the text and the frame around a slot. The slot ids, and what each must show, are listed in the visual brief kept outside this repository.

## Operating Context

- Three pages: the goals page, the risks guide and the ecosystem map. The points below describe the risks guide unless they say otherwise.
- The ecosystem page opens with an interactive map (`ecosystem-graph.js`): bubbles are actors grouped by category around the frontier developers, arrows are documented ties. Bubble size is chosen by the reader from six measures (set by the author on 5 October 2026): people employed, which is the default; money as a yearly flow, labelled "Money (revenue or budget)"; money as worth, labelled "Money (worth)", which is stock-market value for a listed company and the latest round's valuation for a private one; names on TIME's TIME100 AI 2026 list, as a stand-in for influence, which has no agreed measure; documented ties; and sources cited. The figures and their sources are in `size-data.js`, collected on 5 October 2026 and kept apart from the version 1.0 dataset. People and money use a scale where each step in size is ten times more. On the two money measures a bubble is drawn 1.5 times as wide at 100bn and twice as wide at 1tn and above, so the largest sums stand clear (set by the author on 5 October 2026); the plate grows taller when a measure needs the room. Pointing at a bubble shows a card with its group, its figure under the chosen measure, where that figure comes from and its largest stated amounts, in the same way as pointing at an arrow. An actor with no figure under the chosen measure is a small dashed ring, never a zero. The caption changes with the measure and says what it does and does not show; a layer under the selector lists every figure with its source. `ecosystem.html?size=money` (or `people`, `worth`, `influence`, `ties`, `sources`) opens the map on that measure. Arrows that carry money (investment, grants, donations, credits) show a small money sign moving from giver to receiver, and arrow width is the largest single amount stated on the tie, one step wider per tenfold increase (set by the author on 5 October 2026). The widths per step are 2.34 (under 100k), 3.71, 5.07 (1m to 10m), 6.8, 13.5, 18 and 25 (10bn or more), so the largest sums stand clear (also set by the author, 5 October 2026). Amounts are never summed, with the one exception described under the zoom levels below. A money tie with no disclosed amount is thin with a fainter sign. Pointing at an arrow shows a card with each tie on it and its stated amount. Supply and lobbying arrows stay plain because the payment does not run along the arrow. The caption states these limits.
- The map has two zoom levels (set by the author on 5 October 2026: the AI safety field is a zoom into the main graph, not a separate page). The first is the whole industry, as described above. Zooming in, with the + button, the "AI safety field" pill, a pinch, or by choosing a field entry in the search, opens up the AI safety field: all 373 entries on the AISafety.com field map (`field-data.js`, read on 5 October 2026 and reused under that map's CC BY-SA licence, with credit on the page) take the plate in that map's own 16 categories plus "No longer active". An entry that is the same organisation as a bubble on the industry map (32 of them) is that same bubble. The actors of the industry map that the field map does not list move to a band at the bottom. From there + and − zoom the plate itself and a drag moves it; − at full view returns to the whole industry. `ecosystem.html?view=field` opens the map zoomed in. Zoomed in, every bubble is named, the smaller ones in small type that the zoom brings up to size; the search sits above the plate, and the panel for a chosen bubble stays at the foot of the window.
- Zoomed in, the map adds money arrows from four public grant records, covering five funders: Coefficient Giving's Navigating Transformative AI grants list, the Survival and Flourishing Fund's recommendations, the Effective Altruism Funds database (Long-Term Future Fund and EA Infrastructure Fund) and Manifund's project pages. One arrow is one funder's record for one recipient. Its amount is the total of that record's rows for that recipient over the years the record covers, and the rows are listed one by one in the panel. This is the one place the map adds amounts up, and only inside a single record: totals from different records are never combined, because they count different things and one funder's grant can be passed on by another. Two size measures exist only when zoomed in: "Grants received" (the largest total any one record lists for the organisation, the default there) and "Grants given" (what a funder's own record lists for organisations on the map). A money sign rides only the arrows of 1m or more. Funders that publish no row-by-row list read for this version are named on the page as gaps. The build script and raw downloads are kept outside the repository in `../evidence/field/`.
- Zoomed in, the map also draws company money (added on 5 October 2026 after the author pointed out that the grant records alone made it look as if no company money reached the field). `field-data.js` holds 22 ties, one to an announcement and each with its own source, for money that an AI company or the foundation controlling one has announced for work outside the company, and 8 programmes that receive it ("Company programmes", added by this map and labelled as not on the AISafety.com map). A "Company money" filter shows these with the money ties of the base map that leave a company, an investor or a company-funded body. Most amounts are commitments and not payments, several are not safety research and say so, and separate announcements are never added together. No company publishes what it spends on its own safety teams, and the page says that this, the largest item, is missing. Personal pledges (for example by Anthropic's co-founders) are described in the text and not drawn, because people are not bubbles.
- Pointing at a bubble or an arrow shows its card and changes nothing else on the map. The map fades to a bubble's own arrows only when the bubble is chosen with a click, or to a group's when its name is clicked (set by the author on 5 October 2026). Zoomed in, money signs move only on the arrows of a chosen bubble or group, arrowheads are drawn only for those arrows or for a filter, and nothing cross-fades, so the plate is still unless something is chosen.
- A "Safety field" section (`field-list.js`) holds the same entries as a searchable list, with the table of company announcements, the records table and the largest totals in each record.
- A "Who decides" section follows the map (`ecosystem-control.js`, `control-data.js`). It is built from the control and incentives evidence in `../evidence/` and follows five decisions: research funding, evaluation and publication, release, binding rules, and people and interests. Each states what is established, what is not, and what would settle it. Rows from that evidence that join two organisations on the map are drawn as dashed arrows and kept out of the base counts. People are never bubbles: a named person with a role or interest in two organisations is a dotted link between them, labelled with the surname, and all the people can be found in the one search box under the map, which also lists every actor and group. The header carries a one-line legend and "Data as of" the month and year of the evidence cutoff; the full reading guide and the width steps open beneath it.
- Below the map the ecosystem page is a reference page: five findings, eleven categories grouped under six questions, then searchable lists of 100 actors, 116 ties, 48 financial observations and 114 sources drawn from `ecosystem-data.js`.
- Read in a browser as a single long page with six chapters, a quiz and a glossary.
- A companion "field primer" view (at `#primer`) gives 31 background entries on single-agent AI safety, searchable and filterable by five themes, with links into the main guide.
- Interactive "toy model" widgets (for example the Friday-night table grab) let the reader play out an example from the report.
- The footer links out to the report on arXiv, its HTML version, the Cooperative AI Foundation announcement and seminar, and the Goodfire essay.

## Capabilities and Constraints

Current state of the code (observed, not confirmed as binding):

- No build step or framework. The risks guide keeps its page styles and page script inline, and loads `atlas.css`/`atlas.js` (the rail and chapter openers), `explore.css`/`explore.js` and `visuals.css`/`visuals.js` (the seven toy models). The goals page and ecosystem page share `site.css` and `site.js`, and load `explore.css`/`explore.js` as well. Fonts load from Google Fonts.
- On the ecosystem page, evidence and synthesis stay labelled, unlike money figures are never summed, and unknown is never shown as zero. No historical comparison and no ranking of actors: the map's size measures set figures side by side, the influence measure is labelled as one magazine's judgement, and the lists under the map stay in group and name order.
- The map lays itself out in the browser: each group is packed with room reserved for every name it shows, then groups are pushed apart until no bubble, name or group title overlaps another. A name goes inside a bubble only when its measured width fits.
- Copy on the goals and ecosystem pages avoids em dashes and promotional phrasing, and does not name private advisers or imply their endorsement.
- Light and dark themes with a manual toggle; reduced-motion handling; a reading-progress bar; chapter navigation.
- Copy is written in plain, beginner-level language with British spelling.

Terminology used throughout: agent, principal, multi-agent system; miscoordination, conflict, collusion; the seven risk factors (information asymmetries, network effects, selection pressures, destabilising dynamics, commitment and trust, emergent agency, multi-agent security).

Undecided:

- Whether the single-file, no-build structure must be kept.
- Whether the plain-language, British-spelling voice is a fixed rule or just the current draft.
- Whether strict fidelity to sources (figures only from the report or cited sources, toy models always labelled) is a binding rule. The current page follows it, but it was not confirmed as a firm constraint.
- Where the site is hosted. The repository pushes to `github.com/chiragr5241/AI_safety_overview`; no deploy configuration exists.
- Whether and how the author is named on the page. It is a portfolio piece, but the page currently carries no byline.

## Brand Commitments

- Name: "When AIs Meet AIs".
- Status: an unofficial study guide. It must never imply affiliation with, or endorsement by, the Cooperative AI Foundation, the report's authors or Goodfire. This is the one constraint confirmed as firm.
- Visual world (set by the author on 7 October 2026): keep the incumbent look. The site's own type (Bricolage Grotesque, Literata, IBM Plex Mono), tokens in `site.css`, rounded cards, teal accent, and light/dark themes stay. Do not replace them with a new identity, a think-tank report skin, or a look that reads as generated. Python is for data and figures, not for a new aesthetic.

## Evidence on Hand

- The full guide and primer text in `index.html`.
- The source report: Hammond, L. et al. (2025), arXiv 2502.14143. The page states that figures and case-study numbers come from the report.
- The field primer text comes from a separate field reference glossary. The page states its figures are given as stated there and were not re-checked.
- Four primer entries summarise a September 2026 Goodfire essay, "We can and must solve alignment", and are marked with a source line.

Absent, and not to be fabricated: testimonials, reader numbers, endorsements, an author biography, or any institutional affiliation.

## Product Principles

0. Show first, then let the reader dig. A picture or something to try comes before the explanation, and the explanation is never removed, only placed one click away.
1. Write for the reader who has no ML background. A policy reader should never need maths or jargon to follow the argument.
2. The explanation is the showcase. The quality of the explaining is what the piece demonstrates, so clarity outranks decoration or cleverness.
3. Stay visibly unofficial. Nothing in the name, copy or presentation should suggest the guide speaks for the report's authors or publisher.
