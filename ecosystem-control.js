/* Fills the "Who decides" section of ecosystem.html from control-data.js (window.CONTROL).
   The reading text in that section is written by hand; this script only lays out the evidence rows underneath it
   and draws the timeline of safety-framework revisions. Needs window.ECO_UI from the page script. */
(function () {
  "use strict";
  const K = window.CONTROL, U = window.ECO_UI;
  const $ = id => document.getElementById(id);
  if (!K || !U) return;
  const T = K.tables, esc = U.esc, tidy = U.tidy;

  // evidence cells carry an [OLDER] marker for facts more than twelve months old; show it as a tag, not inline
  const isOlder = s => /\[OLDER/.test(s || "");
  const clean = s => tidy(String(s == null ? "" : s).replace(/\s*\[OLDER[^\]]*\]/g, "").replace(/\s+;/g, ";").trim());
  const olderTag = (...cells) => cells.some(isOlder) ? ' <span class="tag">older than 12 months</span>' : "";
  const confTag = c => c && c !== "High" ? ` <span class="tag warn">${esc(c)} confidence</span>` : "";
  const dates = s => clean(s).replace(/\d{4}-\d{2}-\d{2}/g, U.fmtDate);
  const src = url => String(url || "").split(/\s+;\s+/).filter(Boolean).map((u, i, a) => `<a href="${esc(u)}">${a.length > 1 ? "source " + (i + 1) : "source"}</a>`).join(" · ");
  const blank = s => s ? s : '<span class="small">not established</span>';
  // "160000000", ">70000000", "100000–999999": keep the qualifier, make the figure readable
  const money = (amount, cur) => amount ? `${esc(cur)} ` + esc(String(amount).replace(/>=/g, "at least ").replace(/>/g, "over ").replace(/~/g, "about ")
    .replace(/\d+/g, n => +n >= 1e6 ? U.fmtAmount(+n, "").trim() : (+n).toLocaleString("en-GB"))) : "";

  function table(id, head, rows) {
    const host = $(id);
    if (!host) return;
    host.innerHTML = `<div class="tbl-box" tabindex="0" role="region" aria-label="${esc(host.dataset.label || "Evidence table")}"><table class="tbl wide"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    const n = document.querySelector(`[data-count="${id}"]`);
    if (n) n.textContent = rows.length;
  }

  /* ---------- A. decision rights ---------- */
  const A = T.decision_rights, isRev = r => /^Framework revision/.test(r.decision);
  const isGrant = r => /grant|allocation|regrant|Fund administration/i.test(r.decision);
  const isOrg = r => /FAR\.AI client|IAPS|GovAI/.test(r.body_holding_right + r.decision);
  const rightsRow = r => [`<strong>${clean(r.decision)}</strong>`, clean(r.body_holding_right), clean(r.formal_power), blank(clean(r.who_appoints_body)), clean(r.ever_exercised),
    `${dates(r.date)}${olderTag(r.date)}${confTag(r.confidence)}<br>${src(r.source_url)}`];
  const rightsHead = ["Decision", "Who holds the right", "Formal power", "Who appoints that body", "Ever used", "Date and source"];
  table("evGrantRights", rightsHead, A.filter(r => !isRev(r) && isGrant(r)).map(rightsRow));
  table("evLabRights", rightsHead, A.filter(r => !isRev(r) && !isGrant(r) && !isOrg(r)).map(rightsRow));
  table("evOrgRights", rightsHead, A.filter(isOrg).map(rightsRow));

  /* ---------- A. framework revisions: timeline and table ---------- */
  const revs = A.filter(isRev).map(r => {
    const m = /(\d{4})-(\d{2})-(\d{2})/.exec(r.date), word = /^(Weakened|Strengthened|Mixed|Baseline)/.exec(r.formal_power);
    return { lab: r.body_holding_right, name: r.decision.replace(/^Framework revision:\s*/, ""), t: m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null, date: m ? m[0] : "",
      dir: word ? word[1].toLowerCase() : "changed", text: r.formal_power, conf: r.confidence, url: r.source_url };
  }).filter(r => r.t);
  const DIR = { strengthened: ["▲", "Strengthened"], weakened: ["▼", "Weakened"], mixed: ["◆", "Mixed"], baseline: ["○", "First version"], changed: ["●", "Changed or verified, direction not scored"] };
  table("evRevisions", ["Lab", "Version", "Date", "What changed", "Reading", "Source"], revs.map(r =>
    [esc(r.lab), `<strong>${esc(r.name)}</strong>`, esc(U.fmtDate(r.date)), clean(r.text), `${DIR[r.dir][1]}${confTag(r.conf)}`, src(r.url)]));
  const tl = $("revTimeline"), read = $("revRead");
  if (tl && revs.length) {
    const t0 = Date.UTC(2023, 6, 1), t1 = Date.UTC(2026, 10, 1), pos = t => ((t - t0) / (t1 - t0) * 100).toFixed(2);
    const labs = ["Anthropic", "OpenAI", "Google DeepMind", "Meta", "xAI"].filter(l => revs.some(r => r.lab === l));
    const ticks = [2024, 2025, 2026].map(y => `<span style="left:${pos(Date.UTC(y, 0, 1))}%">${y}</span>`).join("");
    tl.innerHTML = `<div class="tl-row tl-axis"><span class="tl-lab"></span><div class="tl-track">${ticks}</div></div>` + labs.map(lab => {
      let last = -99, up = false;
      const marks = revs.filter(r => r.lab === lab).sort((a, b) => a.t - b.t).map(r => {
        const p = +pos(r.t);
        up = p - last < 3.2 ? !up : false;   // neighbours closer than about five weeks step apart vertically
        last = p;
        return `<button type="button" class="tl-dot ${r.dir}${up ? " up" : ""}" style="left:${p}%" data-i="${revs.indexOf(r)}" aria-label="${esc(`${r.name}, ${U.fmtDate(r.date)}: ${DIR[r.dir][1]}`)}">${DIR[r.dir][0]}</button>`;
      }).join("");
      return `<div class="tl-row"><span class="tl-lab">${esc(lab)}</span><div class="tl-track">${ticks.replace(/>\d{4}</g, "><")}${marks}</div></div>`;
    }).join("");
    const show = b => {
      const r = revs[+b.dataset.i];
      Array.from(tl.querySelectorAll(".tl-dot")).forEach(x => x.classList.toggle("sel", x === b));
      read.innerHTML = `<strong>${esc(r.name)}</strong> · ${esc(U.fmtDate(r.date))} · ${DIR[r.dir][1]}${confTag(r.conf)}<br>${clean(r.text)} ${src(r.url)}`;
    };
    tl.addEventListener("click", e => { const b = e.target.closest(".tl-dot"); if (b) show(b); });
    tl.addEventListener("pointerover", e => { const b = e.target.closest(".tl-dot"); if (b && e.pointerType === "mouse") show(b); });
    tl.addEventListener("focusin", e => { const b = e.target.closest(".tl-dot"); if (b) show(b); });
  }

  /* ---------- B. funding ---------- */
  const B = T.funding_shares;
  const isPol = r => /political|Public First Action/i.test(r.recipient), isTotal = r => /not budget|not funding receipt|not actual budget|forecast expenditure|not AI safety budget/i.test(r.recipient);
  const fundRow = r => [`<strong>${clean(r.recipient)}</strong>`, clean(r.source), dates(r.year) + olderTag(r.year), `<span class="amt">${money(r.amount, r.currency) || '<span class="small">not stated</span>'}</span>`,
    r.status ? esc(r.status) : '<span class="small">not a payment measure</span>', `${confTag(r.confidence)} ${src(r.source_url)}`];
  const fundHead = ["Recipient", "Source", "When", "Amount", "Status", "Source"];
  table("evGrants", fundHead, B.filter(r => !isPol(r) && !isTotal(r)).map(fundRow));
  table("evTotals", ["Organisation and measure", "Basis", "Period", "Amount", "Status", "Source"], B.filter(isTotal).map(fundRow));
  table("evPolitical", fundHead, B.filter(isPol).map(fundRow));

  /* ---------- C. access, contracts and conflict-of-interest policies ---------- */
  const C = T.in_kind_and_contracts, isCoi = r => /COI/.test(r.what);
  const accRow = r => [clean(r.provider), `<strong>${clean(r.recipient)}</strong>`, clean(r.what), clean(r.terms), blank(clean(r.restrictions_on_publication)),
    `${dates(r.date)}${olderTag(r.date)}${confTag(r.confidence)}<br>${src(r.source_url)}`];
  table("evAccess", ["From", "To", "What", "Terms", "Limits on publication", "Date and source"], C.filter(r => !isCoi(r)).map(accRow));
  table("evCoi", ["Policy", "Applies to", "Kind", "What it requires", "Notes", "Date and source"], C.filter(isCoi).map(accRow));

  /* ---------- D. people ---------- */
  table("evPeople", ["Person", "Organisation", "Role", "From", "To", "Disclosed interest or recusal", "Source"], T.people.map(r =>
    [`<strong>${clean(r.person)}</strong>`, clean(r.organisation), clean(r.role) + olderTag(r.role, r.start, r.end), dates(r.start), dates(r.end), blank(clean(r.disclosed_financial_interest)), `${confTag(r.confidence)} ${src(r.source_url)}`]));

  /* ---------- E. rules ---------- */
  const BIND = { yes: "Binding", partly: "Partly binding", no: "Voluntary" };
  table("evRules", ["Rule", "Status", "Who enforces, and the penalty", "From", "Who it covers, or who took a position", "Source"], T.rules_and_positions.map(r =>
    [`<strong>${clean(r.rule)}</strong>`, `<span class="tag ${r.binding === "yes" ? "accent" : r.binding === "partly" ? "warn" : ""}">${BIND[r.binding] || esc(r.binding)}</span>`, blank(clean(r.enforcer)),
      dates(r.effective_date) + olderTag(r.effective_date), clean(r.actor) + (r.position ? `<br><span class="small">Position: ${dates(r.position)}</span>` : ""), `${confTag(r.confidence)} ${src(r.source_url)}`]));

  const total = Object.keys(T).reduce((s, k) => s + T[k].length, 0), rows = $("ctlRows");
  if (rows) rows.textContent = total;
})();
