/* Terms explained in place, shared by every page. A page hands in the words it already defines somewhere
   else — the risks guide's glossary, the ecosystem page's terms list — and this marks every use of each one
   inside the reading text, then shows the definition on hover, focus or tap.

   Nothing is removed: without this script the definitions stay where the page already put them, and the
   reading text is ordinary prose. A term with no definition, or a page with nothing to mark, is left alone.

   Terms.mount(defs, opts) takes:
     defs        { term: definition }, usually read out of the page's own markup or data
     opts.scopes elements to search for uses of the terms
     opts.terms  optional [[term, RegExp]] where a page wants to control the wording it matches;
                 without it each term is matched on its own name, allowing a plural
     opts.within where a match has to sit to count, as a selector (default "p, li")
     opts.skip   extra selectors to leave alone, added to the defaults
   It returns how many terms it marked, and may be called once per page. */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // Places where a dotted underline would either fight with another control or repeat something already said:
  // links and buttons own their own click, headings and labels are too short to need a gloss, and a table or a
  // definition list is already a reference. [aria-live] is left alone so a term cannot be announced mid-update.
  const SKIP = "a, button, strong, h1, h2, h3, h4, summary, label, nav, table, dl, .lab, .eyebrow, .tag, .term, [aria-live]";

  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // A term with no wording of its own is matched on its name, with runs of space loosened and a plural allowed.
  // Two shapes a glossary tends to use: "Public benefit corporation (PBC)" is matched on either the name or the
  // abbreviation, and "Frontier developer, or lab" on the first form only, since the short alias is usually a
  // common word that would mark the wrong sentence.
  function autoRe(term) {
    const abbr = /\(([^)]+)\)/.exec(term);
    const head = term.replace(/\s*\([^)]*\)/, "").replace(/,\s+or\s+.*$/i, "").trim();
    const forms = [head].concat(abbr ? [abbr[1]] : []);
    return new RegExp("\\b(?:" + forms.map(f => reEsc(f).replace(/\s+/g, "\\s+")).join("|") + ")s?\\b", "i");
  }

  /* ---------- the tooltip, made once and shared by every term on the page ---------- */
  let tip = null, tipFor = null, defsFor = {};
  function makeTip() {
    if (tip) return;
    tip = document.createElement("div");
    tip.id = "termTip";
    tip.className = "tip";
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);
    const termOf = e => e.target.closest ? e.target.closest(".term") : null;
    document.addEventListener("pointerover", e => { const t = termOf(e); if (t && e.pointerType === "mouse") showTip(t); });
    document.addEventListener("pointerout", e => { if (termOf(e) && e.pointerType === "mouse") hideTip(); });
    document.addEventListener("focusin", e => { const t = termOf(e); if (t) showTip(t); });
    document.addEventListener("focusout", e => { if (termOf(e)) hideTip(); });
    // a tap opens the term it landed on, and a tap anywhere else puts the definition away again
    document.addEventListener("click", e => { const t = termOf(e); if (t) showTip(t); else hideTip(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") hideTip(); });
    window.addEventListener("resize", hideTip);
  }
  function showTip(el) {
    hideTip();
    tipFor = el;
    const b = document.createElement("b");
    b.textContent = el.dataset.term;
    tip.replaceChildren(b, defsFor[el.dataset.term] || "");
    el.setAttribute("aria-describedby", "termTip");
    // measured at the origin first, so the width and height below are the tooltip's own and not last time's position
    tip.style.left = "0"; tip.style.top = "0";
    const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    const left = Math.max(12, Math.min(r.left, document.documentElement.clientWidth - w - 12));
    const below = r.bottom + h + 12 < window.innerHeight;
    tip.style.left = left + window.scrollX + "px";
    tip.style.top = (below ? r.bottom + 8 : r.top - h - 8) + window.scrollY + "px";
    tip.classList.add("show");
  }
  function hideTip() {
    if (!tipFor) return;
    tipFor.removeAttribute("aria-describedby");
    tipFor = null;
    tip.classList.remove("show");
  }

  /* ---------- marking every use of each term ---------- */
  function mount(defs, opts) {
    opts = opts || {};
    const scopes = (typeof opts.scopes === "function" ? opts.scopes() : opts.scopes) || [];
    if (!scopes.length) return 0;
    const pairs = opts.terms || Object.keys(defs).map(t => [t, autoRe(t)]);
    const skip = opts.skip ? SKIP + ", " + opts.skip : SKIP;
    const within = opts.within || "p, li";
    let marked = 0;
    scopes.forEach(scope => {
      if (!scope) return;
      pairs.forEach(pair => {
        const term = pair[0], re = pair[1] || autoRe(term);
        if (!defs[term]) return;
        // a fresh walker per term, because marking one rewrites the nodes the previous walk was holding
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const parent = node.parentElement;
          if (!parent || parent.closest(skip) || !parent.closest(within)) continue;
          const m = re.exec(node.data);
          if (!m) continue;
          const range = document.createRange();
          range.setStart(node, m.index);
          range.setEnd(node, m.index + m[0].length);
          const span = document.createElement("span");
          span.className = "term";
          span.tabIndex = 0;
          span.setAttribute("role", "button");
          span.dataset.term = term;
          range.surroundContents(span);
          marked++;
          // The walk carries on through the rest of the text, so every use of the word is marked and not only the
          // first. Two cards side by side that say the same thing are then marked the same way, which is what a
          // reader expects. surroundContents splits this node in three; the walker steps into the span's own text
          // next, where .term in the skip list stops it being marked again, and then into what followed the match.
        }
      });
    });
    if (!marked) return 0;
    Object.keys(defs).forEach(t => { defsFor[t] = defs[t]; });
    makeTip();
    return marked;
  }

  window.Terms = { mount };
})();
