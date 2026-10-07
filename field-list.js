/* The reference section for the zoomed-in map: the grant records that were read, the largest totals in each, and every entry on the
   AISafety.com field map with the grants those records show reaching it.
   Needs field-data.js (window.FIELD), ecosystem-data.js (window.ECOSYSTEM) and the helpers the page script exports as window.ECO_UI.
   A sum is always inside one record. Nothing here adds one record to another. */
(function () {
  "use strict";
  const F = window.FIELD, D = window.ECOSYSTEM, U = window.ECO_UI, grid = document.getElementById("fieldGrid");
  if (!grid) return;
  if (!F || !D || !U) { grid.textContent = "The field dataset (field-data.js) did not load, so this list is empty."; return; }
  const $ = id => document.getElementById(id);
  const esc = U.esc, tidy = U.tidy, usd = v => U.fmtAmount(v, "USD");
  const catLabel = new Map(F.cats.map(c => [c.id, c.label]));
  const actor = new Map(D.nodes.map(n => [n.id, n]));
  // a bubble is an entry, or an actor of the industry map that an entry is attached to
  const entryOf = new Map();
  F.entries.forEach(e => entryOf.set(e.node || e.id, e));
  const nameOf = id => entryOf.has(id) ? entryOf.get(id).name : actor.has(id) ? actor.get(id).name : id;
  const yrs = f => f.first === f.last ? f.first : `${f.first} to ${f.last}`;
  const KIND = { cg: "listed", sff: "recommended", ltff: "paid out", eaif: "paid out" };
  const rows = f => f.src === "manifund" ? `${f.n} project ${f.n === 1 ? "page" : "pages"}` : `${f.n} ${f.n === 1 ? "grant" : "grants"} ${KIND[f.src] || ""}`;
  const amount = f => f.total ? usd(f.total) : "matching pledge only";
  const inOf = new Map(), outOf = new Map();
  F.flows.forEach(f => {
    if (!inOf.has(f.to)) inOf.set(f.to, []);
    inOf.get(f.to).push(f);
    if (!outOf.has(f.from)) outOf.set(f.from, []);
    outOf.get(f.from).push(f);
  });
  const setText = (id, v) => { const x = $(id); if (x) x.textContent = v; };
  setText("nFieldEntries", F.entries.filter(e => !e.own).length);

  /* ---------- company money: one line to an announcement ---------- */
  const CKIND = { grant: "Grant", commitment: "Commitment announced", credits: "Credits committed", equity: "Equity investment", pool: "Share of a joint fund, not stated", open: "Programme funded, budget not published" };
  const company = (F.company || []).slice().sort((a, b) => (b.amount || 0) - (a.amount || 0) || nameOf(a.from).localeCompare(nameOf(b.from)));
  const companyBody = $("fieldCompany");
  if (companyBody) companyBody.innerHTML = company.map(c =>
    `<tr><td>${tidy(nameOf(c.from))}</td><td>${tidy(nameOf(c.to))}</td><td><strong>${esc(CKIND[c.kind] || c.kind)}.</strong> ${tidy(c.what)}</td>
      <td class="amt">${c.amount ? esc(usd(c.amount)) : "not stated"}</td><td class="amt">${esc(U.fmtDate(c.date))}</td><td><a href="${esc(c.src.url)}" rel="noopener">${tidy(c.src.title)}</a></td></tr>`).join("");
  // money ties already in the base map that leave a company or a company-funded body
  const firms = new Set(D.nodes.filter(n => n.cat >= 1 && n.cat <= 4).map(n => n.id)), givers = new Set(Array.from(firms).concat(["foundation", "fmf", "aisf"]));
  const CTL = (window.CONTROL && window.CONTROL.graph && window.CONTROL.graph.edges) || [];
  const MONEY = ["philanthropic_support", "philanthropic_or_public_support", "research_grant", "restricted_policy_donation", "grant_paid", "grant_recommended", "political_contribution", "compute_credits", "matching_offer"];
  const baseTies = D.edges.concat(CTL).filter(e => MONEY.indexOf(e.type) >= 0 && givers.has(e.from) && !firms.has(e.to) && actor.has(e.to));
  setText("fieldCompanyBase", baseTies.length ? `The industry map already held ${baseTies.length} money ties of this kind, and the "Company money" filter shows them too: ` +
    baseTies.map(e => `${nameOf(e.from)} to ${nameOf(e.to)}${e.amount != null ? " (" + usd(e.amount) + ")" : " (amount not stated)"}`).join("; ") + "." : "");

  /* ---------- the records ---------- */
  const order = ["cg", "sff", "ltff", "eaif", "manifund"].filter(k => F.records[k]);
  $("fieldRecords").innerHTML = order.map(k => {
    const r = F.records[k];
    return `<tr><td><a href="${esc(r.url)}" rel="noopener">${tidy(r.title)}</a><br><span class="small">${tidy(r.note)}</span></td><td>${tidy(r.kind.charAt(0).toUpperCase() + r.kind.slice(1))}</td>
      <td class="amt">${r.rows}</td><td class="amt">${esc(usd(r.listed))}</td><td class="amt">${r.matched}</td><td class="amt">${esc(usd(r.matchedTotal))}</td></tr>`;
  }).join("");

  /* ---------- the largest totals, one record at a time ---------- */
  $("fieldTop").innerHTML = order.map(k => {
    const r = F.records[k], top = F.flows.filter(f => f.src === k && f.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
    return `<div class="labcard"><span class="eyebrow">${tidy(nameOf(r.funder))}</span><ul class="fgrants">${top.map(f =>
      `<li><b>${esc(usd(f.total))}</b> ${tidy(nameOf(f.to))} <span class="small">(${esc(rows(f))}, ${esc(yrs(f))})</span></li>`).join("")}</ul>
      <p class="small used">${tidy(r.kind.charAt(0).toUpperCase() + r.kind.slice(1))}, in this record only.</p></div>`;
  }).join("");

  /* ---------- every entry ---------- */
  const rank = new Map(F.cats.map((c, i) => [c.id, i]));
  const list = F.entries.slice().sort((a, b) => rank.get(a.cats[0]) - rank.get(b.cats[0]) || a.name.localeCompare(b.name));
  function card(e) {
    const id = e.node || e.id, got = (inOf.get(id) || []).slice().sort((a, b) => b.total - a.total), gave = outOf.get(id) || [];
    const firm = company.filter(c => c.to === id);
    const cats = e.cats.map(c => catLabel.get(c)).join(", ");
    const given = gave.reduce((a, f) => a + f.total, 0);
    const money = (got.length ? `<ul class="fgrants">${got.map(f => `<li><b>${esc(amount(f))}</b> from ${tidy(nameOf(f.from))} <span class="small">(${esc(rows(f))}, ${esc(yrs(f))}${f.cond ? `, plus matching pledges of up to ${esc(usd(f.cond))}` : ""})</span></li>`).join("")}</ul>` : "")
      + (gave.length ? `<p class="small">Its own record lists ${esc(usd(given))} for ${gave.length} ${gave.length === 1 ? "organisation" : "organisations"} on this map.</p>` : "")
      + (firm.length ? `<ul class="fgrants">${firm.map(c => `<li><b>${c.amount ? esc(usd(c.amount)) : "Amount not stated"}</b> from ${tidy(nameOf(c.from))} <span class="small">(${esc((CKIND[c.kind] || c.kind).toLowerCase())}, ${esc(U.fmtDate(c.date))}, company announcement)</span></li>`).join("")}</ul>` : "")
      + (!got.length && !gave.length && !firm.length ? `<p class="small">No row in the four grant records and no company announcement. That is not the same as no funding.</p>` : "");
    const text = [e.name, e.short, cats, e.desc].concat(got.map(f => nameOf(f.from))).join(" ").toLowerCase();
    return `<article class="pcard" id="fe-${esc(e.id)}" data-cat="${esc(e.cats.join(" "))}" data-money="${got.length || firm.length ? "in" : ""} ${gave.length ? "out" : ""} ${!got.length && !gave.length && !firm.length ? "none" : ""}" data-text="${esc(text)}">
      <h3>${tidy(e.name)}</h3>
      <p class="who">${tidy(cats)}${e.node ? " · also on the industry map" : ""}${e.own ? " · added by this map, not on the AISafety.com map" : ""}</p>
      <p class="plain">${tidy(e.desc)}</p>
      <span class="lbl">${got.length || firm.length ? "Money on record" : "Grant records"}</span>
      ${money}
      <p class="small"><a href="${esc(e.url)}" rel="noopener">${e.own ? "The announcement" : "Its own site"}</a> · <button class="link-btn" type="button" data-show="${esc(id)}">Show on the map</button></p>
    </article>`;
  }
  grid.innerHTML = list.map(card).join("");
  const cards = Array.from(grid.querySelectorAll(".pcard"));
  const search = $("fieldSearch"), cat = $("fieldCat"), money = $("fieldMoney"), more = $("fieldMore"), count = $("fieldCount"), empty = $("fieldEmpty");
  F.cats.forEach(c => {
    const n = F.entries.filter(e => e.cats.indexOf(c.id) >= 0).length;
    cat.insertAdjacentHTML("beforeend", `<option value="${esc(c.id)}">${tidy(c.label)} (${n})</option>`);
  });
  const LIMIT = 12;
  let open = false;
  function filter() {
    const q = search.value.trim().toLowerCase(), c = cat.value, m = money.value, filtered = !!q || c !== "all" || m !== "all";
    let hits = 0, shown = 0;
    cards.forEach(el => {
      const ok = (!q || el.dataset.text.includes(q)) && (c === "all" || el.dataset.cat.split(" ").indexOf(c) >= 0) && (m === "all" || el.dataset.money.split(" ").indexOf(m) >= 0);
      if (ok) hits++;
      const vis = ok && (open || filtered || hits <= LIMIT);
      el.hidden = !vis;
      if (vis) shown++;
    });
    count.textContent = `Showing ${filtered ? hits : shown} of ${cards.length}`;
    empty.hidden = hits !== 0;
    more.hidden = filtered;
    more.textContent = open ? "Show fewer" : `Show all ${cards.length}`;
    more.setAttribute("aria-expanded", open ? "true" : "false");
  }
  search.addEventListener("input", filter);
  cat.addEventListener("change", filter);
  money.addEventListener("change", filter);
  more.addEventListener("click", () => { open = !open; filter(); });
  $("fieldReset").addEventListener("click", () => { search.value = ""; cat.value = "all"; money.value = "all"; filter(); });
  // the map zooms in, picks the bubble and brings it into view
  grid.addEventListener("click", e => {
    const b = e.target.closest("button[data-show]");
    if (b && window.ECO_MAP) window.ECO_MAP.show(b.dataset.show);
  });
  filter();
})();
