/* Visuals for the risks guide. One Visuals.register(id, init) call per [data-visual] slot in the page.
   init(slot, api) receives the slot element and:
     api.css(name)        current value of a token, e.g. api.css("--con"), for canvas and generated SVG
     api.reduced          true when the reader asked for reduced motion
     api.onTheme(fn)      fn runs when the light or dark theme changes (redraw canvases here)
     api.whenVisible(fn)  fn runs the first time the slot is on screen (it may start inside a closed layer)
     api.seg(el, fn)      wires a segmented control: buttons with data-v, fn(value) on change
   Register { html, init } instead of a function to replace the slot's fallback markup before init runs.
   Slots with nothing registered keep their fallback markup, or stay hidden if they are empty:
     unit-rf-info, unit-rf-sel, unit-rf-com, unit-rf-emg, unit-rf-sec   one drawing per risk factor that has no toy model
     case-1 ... case-13                                                  the figure inside each case study
     specimen-why, specimen-modes, specimen-factors, specimen-next       the drawing beside each chapter title */
(function () {
  "use strict";
  if (!window.Visuals) return;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- Friday-night table grab ----------
     Chapter 1. Four restaurants, eight tables, eight diners, and one or two booking assistants. */
  Visuals.register("lab-restaurant", (slot, api) => {
    const { css, reduced, seg } = api;
    const RESTS = ["Luigi's", "Pho Real", "Curry Leaf", "Taco Stand"];
    const NAMES = ["Sam", "Alex", "Priya", "Tom", "Mei", "Omar", "Lena", "Jo"];
    function grabModel(k, fee) {
      // Tables are [restaurant][seat]. The first k diners have assistants and book first.
      const tables = RESTS.map(() => [null, null]);
      const kept = [];
      for (let d = 0; d < k; d++) {
        const mine = [];
        for (let r = 0; r < RESTS.length; r++) {
          const t = tables[r].indexOf(null);
          if (t >= 0) { tables[r][t] = d; mine.push([r, t]); if (fee) break; }
        }
        kept[d] = mine.shift();
        mine.forEach(([r, t]) => { tables[r][t] = "empty"; });
      }
      const fed = new Array(NAMES.length).fill(false);
      for (let d = 0; d < k; d++) fed[d] = !!kept[d];
      for (let d = k; d < NAMES.length; d++) {
        for (let r = 0; r < RESTS.length && !fed[d]; r++) {
          const t = tables[r].indexOf(null);
          if (t >= 0) { tables[r][t] = d; fed[d] = true; }
        }
      }
      return { tables, fed };
    }
    function grabRender(v) {
      const k = v === "0" ? 0 : v === "1" ? 1 : 2, fee = v === "fee";
      const { tables, fed } = grabModel(k, fee);
      $("#town").innerHTML = RESTS.map((name, r) => `<div class="rest"><span class="rest-name">${name}</span><div class="rest-tables">${
        tables[r].map(x => x === "empty" ? `<div class="tb empty">empty</div>` : `<div class="tb eat">${NAMES[x]}</div>`).join("")}</div></div>`).join("");
      $("#diners").innerHTML = NAMES.map((n, d) => `<div class="dn ${fed[d] ? "fed" : "hungry"} ${d < k ? "ai" : ""}"><i>${d < k ? "AI" : fed[d] ? "✓" : "✕"}</i>${n}</div>`).join("");
      const hungry = fed.filter(f => !f).length;
      const who = k === 1 ? "Sam's assistant" : "Sam's and Alex's assistants";
      $("#grabPunch").textContent =
        k === 0 ? "No assistants: all 8 people eat, and every table is used." :
        fee ? "With a no-show fee, each assistant books just one table. Everyone eats." :
        `${who} did exactly what ${k === 1 ? "Sam" : "they were"} asked. ${hungry} people went home hungry while ${hungry} tables sat empty.`;
    }
    seg($("#grabPick"), grabRender);
    grabRender("1");
  });

  /* ---------- classifier ----------
     Chapter 2. Two questions place a situation on the report's failure-mode map. */
  Visuals.register("lab-classifier", (slot, api) => {
    const { css, reduced, seg } = api;
    const verdicts = {
      "yes-same": ["mis", "<strong>Miscoordination.</strong> Everyone wants the same thing, so the only risk is failing to line up actions, like two robots from the same company blocking each other in a doorway."],
      "yes-mixed": ["con", "<strong>Conflict.</strong> Goals partly overlap, so there are deals that help everyone, but selfish incentives can push agents off them. Most real interactions are here."],
      "yes-opp": ["na", "<strong>Not applicable.</strong> With fully opposed goals (chess, a zero-sum game), one side's gain is always the other's loss, so there is no cooperative outcome to fail to reach."],
      "no-same": ["col", "<strong>Collusion.</strong> Even agents with shared goals can cooperate in ways we don't want, for example two AI systems jointly working around a safety check."],
      "no-mixed": ["col", "<strong>Collusion.</strong> The classic case: firms in a market have mixed goals, and cooperating on prices hurts customers."],
      "no-opp": ["col", "<strong>Collusion.</strong> Safety schemes often set AIs as adversaries on purpose (an overseer vs the overseen). If they secretly cooperate, the scheme fails."]
    };
    let coop = "yes", obj = "same";
    function renderClassifier() {
      const [cls, text] = verdicts[coop + "-" + obj];
      $$(".grid-fig .cell").forEach(c => c.classList.remove("on"));
      const target = coop === "no" ? "#c-col" : "#c-" + obj;
      $(target).classList.add("on");
      $("#verdict").innerHTML = text;
    }
    seg($("#qCoop"), v => { coop = v; renderClassifier(); });
    seg($("#qObj"), v => { obj = v; renderClassifier(); });
    renderClassifier();
  });

  /* ---------- driving ----------
     Miscoordination. Two cars must pull to the same side without knowing each other's convention. */
  Visuals.register("lab-drive", (slot, api) => {
    const { css, reduced, seg } = api;
    let rounds = 0, cleared = 0, busy = false;
    const carA = $("#carA"), carB = $("#carB"), amb = $("#amb");
    const sideBtns = $$("#drive [data-side]");
    const setBusy = b => { busy = b; sideBtns.forEach(x => x.setAttribute("aria-disabled", b ? "true" : "false")); };
    function resetRoad() {
      carA.style.top = "31px"; carB.style.top = "31px"; amb.style.left = "-90px"; amb.style.top = "31px";
    }
    resetRoad();
    sideBtns.forEach(btn => btn.addEventListener("click", () => {
      if (busy) return;
      setBusy(true);
      resetRoad();
      const a = btn.dataset.side;
      const talk = $("#talk").checked;
      const b = talk ? a : (Math.random() < 0.5 ? "L" : "R");
      rounds++;
      const ok = a === b;
      if (ok) cleared++;
      $$("#payoff div").forEach(d => d.classList.remove("hl"));
      $("#p-" + a + b).classList.add("hl");
      // "left" = top edge of road, "right" = bottom edge (direction of travel is left→right)
      const pos = s => (s === "L" ? "6px" : "56px");
      setTimeout(() => { carA.style.top = pos(a); carB.style.top = pos(b); }, 50);
      setTimeout(() => {
        if (ok) { amb.style.top = a === "L" ? "56px" : "6px"; amb.style.left = "calc(100% + 20px)"; }
        else { amb.style.top = "31px"; amb.style.left = "calc(22% - 80px)"; }
      }, 900);
      setTimeout(() => {
        const out = $("#driveOut");
        out.className = "outcome " + (ok ? "good" : "bad");
        out.textContent = ok
          ? (talk ? "Lane cleared. The cars agreed on a side by message first." : "Lane cleared. Car B happened to learn the same convention.")
          : `Blocked. You went ${a === "L" ? "left" : "right"}, Car B went ${b === "L" ? "left" : "right"}. No lane is clear.`;
        $("#driveTally").textContent = `Rounds played: ${rounds} · lane cleared: ${cleared}`;
        setBusy(false);
      }, reduced ? 100 : 2300);
    }));
  });

  /* ---------- lake ----------
     Conflict. Four fishers share a lake that doubles each month and collapses below 5 tonnes. */
  Visuals.register("lab-lake", (slot, api) => {
    const { css, reduced, seg } = api;
    let stock, month, agentCatch, collapsed, lastMax;
    function lakeReset() {
      stock = 100; month = 1; agentCatch = [10, 10, 10]; collapsed = false; lastMax = 10;
      $("#lakeHist").innerHTML = "";
      $("#fishBtn").disabled = false;
      renderLake();
      $("#lakeStatus").textContent = "Month 1. Sustainable total catch: 50 t (half the stock).";
    }
    function renderLake() {
      $("#water").style.transform = `scaleY(${Math.max(0, stock) / 100})`;
      $("#lvl").textContent = Math.round(stock) + " t";
      const names = ["You", "Agent 1", "Agent 2", "Agent 3"];
      const vals = [+$("#myCatch").value].concat(agentCatch);
      $("#fishers").innerHTML = vals.map((v, i) =>
        `<div class="fisher ${i === 0 ? "you" : ""}"><span class="n">${names[i]}</span><span class="v">${Math.round(v)}</span></div>`).join("");
    }
    $("#myCatch").addEventListener("input", () => { $("#myCatchOut").textContent = $("#myCatch").value; renderLake(); });
    $("#fishBtn").addEventListener("click", () => {
      if (collapsed) return;
      const mine = +$("#myCatch").value;
      let wants = [mine].concat(agentCatch);
      let total = wants.reduce((a, b) => a + b, 0);
      let got = wants;
      if (total > stock) { got = wants.map(w => w * stock / total); total = stock; }
      stock -= total;
      const line = document.createElement("div");
      line.textContent = `M${month}: you ${Math.round(got[0])} t, agents ${got.slice(1).map(x => Math.round(x)).join("/")} t → ${Math.round(stock)} t left`;
      $("#lakeHist").prepend(line);
      if (stock < 5) {
        collapsed = true; stock = Math.max(0, stock);
        renderLake();
        $("#lakeStatus").textContent = `Month ${month}: the lake collapsed. Total catch outran regrowth.`;
        $("#fishBtn").disabled = true;
        return;
      }
      stock = Math.min(100, stock * 2);
      // agents: match the greediest catch last round (move 70% of the way), else drift back towards fair share
      const maxLast = Math.max.apply(null, wants);
      agentCatch = agentCatch.map(c => maxLast > c + 0.5 ? c + 0.6 * (maxLast - c) : Math.max(10, c - 2));
      month++;
      renderLake();
      const sustainable = Math.round(stock / 2);
      $("#lakeStatus").textContent = `Month ${month}. Stock ${Math.round(stock)} t. Sustainable total catch now: ${sustainable} t.`;
    });
    $("#lakeReset").addEventListener("click", lakeReset);
    lakeReset();
  });

  /* ---------- stego ----------
     Collusion. One message read two ways: by the overseer, and by the partner who knows the trick. */
  Visuals.register("lab-stego", (slot, api) => {
    const { css, reduced, seg } = api;
    seg($("#stegoView"), v => {
      const reveal = v === "partner";
      $("#msg").classList.toggle("reveal", reveal);
      $("#decoded").textContent = reveal
        ? "Partner: first letters spell H-O-L-D. Keep prices high this week."
        : "Overseer: routine logistics chatter. Nothing to flag.";
    });
  });

  /* ---------- network infection ----------
     Network effects. A malicious instruction spreads through random pairwise chats. */
  Visuals.register("lab-net", (slot, api) => {
    const { css, reduced, seg } = api;
    const canvas = $("#net"), ctx = canvas.getContext("2d");
    let netN = 400, nodes = [], infected = [], round = 0, netTimer = null;
    function layoutNodes() {
      nodes = [];
      const W = canvas.width, H = canvas.height;
      const cols = Math.ceil(Math.sqrt(netN * W / H));
      const rows = Math.ceil(netN / cols);
      const dx = W / cols, dy = H / rows;
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < netN; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        nodes.push({ x: (c + 0.5) * dx + (rnd() - 0.5) * dx * 0.6, y: (r + 0.5) * dy + (rnd() - 0.5) * dy * 0.6 });
      }
      infected = new Array(netN).fill(false);
      round = 0;
    }
    let links = [];
    function drawNet() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = css("--surface-2"); ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = css("--con"); ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
      links.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke(); });
      ctx.globalAlpha = 1;
      const r = netN > 1000 ? 2.2 : netN > 300 ? 3.2 : 5;
      const clean = css("--muted"), bad = css("--con");
      nodes.forEach((n, i) => { ctx.fillStyle = infected[i] ? bad : clean; ctx.globalAlpha = infected[i] ? 1 : 0.45; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    function netStatus() {
      const k = infected.filter(Boolean).length;
      $("#netOut").textContent = `Round ${round} · infected ${k.toLocaleString()} of ${netN.toLocaleString()}` +
        (k === netN ? ` · whole network compromised in ${round} rounds` : "");
    }
    function netStep() {
      // random perfect-ish pairing: shuffle and pair neighbours
      const idx = Array.from({ length: netN }, (_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      const next = infected.slice();
      links = [];
      for (let i = 0; i + 1 < idx.length; i += 2) {
        const a = idx[i], b = idx[i + 1];
        if (infected[a] !== infected[b]) { next[a] = next[b] = true; links.push([a, b]); }
      }
      infected = next; round++;
    }
    function netRun() {
      if (netTimer) clearInterval(netTimer);
      layoutNodes(); links = [];
      infected[Math.floor(Math.random() * netN)] = true;
      drawNet(); netStatus();
      netTimer = setInterval(() => {
        netStep(); drawNet(); netStatus();
        if (infected.every(Boolean) || round > 60) { clearInterval(netTimer); netTimer = null; links = []; setTimeout(drawNet, 400); }
      }, reduced ? 60 : 650);
    }
    seg($("#netSize"), v => { netN = +v; if (netTimer) clearInterval(netTimer); netTimer = null; layoutNodes(); links = []; drawNet(); netStatus(); });
    $("#netGo").addEventListener("click", netRun);
    layoutNodes(); drawNet(); netStatus();
    api.onTheme(drawNet);
  });

  /* ---------- flash crash ----------
     Destabilising dynamics. Sixty trading bots, a 2% shock, and an optional circuit breaker. */
  Visuals.register("lab-crash", (slot, api) => {
    const { css, reduced, seg } = api;
    function simulateCrash(homog, breaker) {
      const N = 60, shared = Math.round(N * homog / 100);
      const triggers = [];
      for (let i = 0; i < N; i++) {
        // shared bots all trigger at a 2% drop; others spread evenly between 5% and 80%
        triggers.push(i < shared ? 2 : 5 + (i - shared) * (75 / Math.max(1, N - shared)));
      }
      const sold = new Array(N).fill(false);
      let price = 100; const series = [100];
      price = 98; series.push(price); // the initial shock
      let halted = false, haltAt = -1;
      for (let t = 0; t < 36; t++) {
        if (halted) { price = Math.min(price + (98 - price) * 0.12, 98); series.push(price); continue; }
        const drop = 100 - price;
        let sellers = 0;
        for (let i = 0; i < N; i++) if (!sold[i] && drop >= triggers[i]) { sold[i] = true; sellers++; }
        price = price * (1 - 0.005 * sellers);
        if (sellers === 0) price = Math.min(price + 0.08, 100);
        if (breaker && 100 - price >= 6 && !halted) { halted = true; haltAt = series.length; }
        series.push(price);
      }
      return { series, haltAt, sold: sold.filter(Boolean).length, low: Math.min.apply(null, series) };
    }
    function drawCrash() {
      const homog = +$("#homog").value, breaker = $("#breaker").checked;
      $("#homogOut").textContent = homog + "%";
      const { series, haltAt, sold, low } = simulateCrash(homog, breaker);
      const W = 640, H = 240, L = 44, R = 12, T = 14, B = 30;
      const yMin = 60, yMax = 102;
      const x = i => L + (i / (series.length - 1)) * (W - L - R);
      const y = v => T + (1 - (Math.max(v, yMin) - yMin) / (yMax - yMin)) * (H - T - B);
      const ink = css("--muted"), line = css("--line"), acc = css("--accent"), bad = css("--con");
      let s = "";
      [100, 90, 80, 70, 60].forEach(v => {
        s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${line}" stroke-width="1"/>`;
        s += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="11" fill="${ink}">${v}</text>`;
      });
      s += `<text x="${L}" y="${H - 8}" font-family="IBM Plex Mono, monospace" font-size="11" fill="${ink}">shock</text>`;
      s += `<text x="${W - R}" y="${H - 8}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="11" fill="${ink}">time →</text>`;
      if (haltAt >= 0) {
        s += `<rect x="${x(haltAt)}" y="${T}" width="${W - R - x(haltAt)}" height="${H - T - B}" fill="${acc}" opacity="0.08"/>`;
        s += `<text x="${x(haltAt) + 6}" y="${T + 14}" font-family="IBM Plex Mono, monospace" font-size="11" fill="${acc}">trading halted</text>`;
      }
      const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
      const area = `${L},${y(yMin)} ${pts} ${x(series.length - 1)},${y(yMin)}`;
      const col = low < 85 ? bad : acc;
      s += `<polygon points="${area}" fill="${col}" opacity="0.10"/>`;
      s += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>`;
      const li = series.indexOf(low);
      s += `<circle cx="${x(li)}" cy="${y(low)}" r="4.5" fill="${col}"/>`;
      $("#crashSvg").innerHTML = s;
      $("#crashOut").textContent = `Lowest price ${low.toFixed(1)} (${(100 - low).toFixed(1)}% drop) · ${sold} of 60 bots sold` + (haltAt >= 0 ? " · circuit breaker tripped" : "");
    }
    $("#homog").addEventListener("input", drawCrash);
    $("#breaker").addEventListener("change", drawCrash);
    drawCrash();
    api.onTheme(drawCrash);
  });

  /* ---------- glossary cards ----------
     Reference chapter. The glossary further down the page is already a list of terms and their definitions,
     so the deck is built from it rather than written out again: one card per entry, the term on the front.
     What the reader knew is kept, so a second visit can go straight to the ones they missed.
     Without this the glossary is still there, in full, as a plain list.

     PARKED. The slot is commented out in the glossary chapter of multi-agent-risks.html, so this registers and
     then finds nothing to mount, which costs a lookup and does not touch the page. Kept whole, with its styles
     in visuals.css, so that uncommenting the slot is the only step needed to bring the deck back. */
  Visuals.register("glossary-cards", {
    html: '<div class="fc" hidden></div>',
    init: slot => {
      const cards = $$("#glossary .gloss > div").map(d => ({ q: $("dt", d).textContent.trim(), a: $("dd", d).textContent.trim() }));
      if (cards.length < 2) return;   // nothing worth shuffling through
      const KEY = "wam-cards";
      const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
      const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
      let marks = read();                              // term -> true when the reader said they knew it
      let deck = cards.map((c, i) => i), at = 0, shown = false;

      const fc = $(".fc", slot);
      fc.hidden = false;
      fc.innerHTML =
        '<ol class="fc-marks" aria-hidden="true"></ol>' +
        '<div class="fc-card">' +
          '<p class="fc-kind">Card <span class="fc-at"></span></p>' +
          '<div class="fc-face" aria-live="polite"><p class="fc-q"></p><p class="fc-a" hidden></p></div>' +
          '<div class="fc-row fc-row--end">' +
            '<button type="button" class="btn sm fc-show">Show the definition</button>' +
            '<span class="fc-judge" hidden><button type="button" class="btn sm ghost fc-btn" data-knew="0">Not yet</button>' +
            '<button type="button" class="btn sm fc-btn fc-btn--solid" data-knew="1">Knew it</button></span>' +
          '</div>' +
        '</div>' +
        '<div class="fc-row fc-row--foot"><button type="button" class="btn sm ghost fc-prev">Previous</button>' +
        '<p class="fc-note" aria-live="polite"></p>' +
        '<button type="button" class="btn sm ghost fc-restart">Start again</button></div>';

      const marksEl = $(".fc-marks", fc), face = $(".fc-face", fc), note = $(".fc-note", fc);
      const qEl = $(".fc-q", fc), aEl = $(".fc-a", fc), atEl = $(".fc-at", fc);
      const showBtn = $(".fc-show", fc), judge = $(".fc-judge", fc), prev = $(".fc-prev", fc);

      function paint() {
        const done = at >= deck.length;
        $(".fc-card", fc).classList.toggle("is-done", done);
        marksEl.innerHTML = deck.map((c, i) => {
          const state = i === at && !done ? " now" : marks[cards[c].q] ? " knew" : i < at ? " missed" : "";
          return '<li class="fc-mark' + state + '"></li>';
        }).join("");
        prev.disabled = at === 0 || done;
        if (done) {
          const knew = deck.filter(c => marks[cards[c].q]).length, missed = deck.length - knew;
          atEl.textContent = "";
          qEl.textContent = "You knew " + knew + " of " + deck.length + ".";
          aEl.hidden = false;
          aEl.textContent = missed ? "Start again to go through all " + cards.length + ", or take another run at the " + missed + " you did not." : "That is the whole glossary.";
          showBtn.hidden = missed === 0;
          showBtn.textContent = "Practise the " + missed + " again";
          judge.hidden = true;
          note.textContent = "";
          return;
        }
        const card = cards[deck[at]];
        atEl.textContent = (at + 1) + " of " + deck.length;
        qEl.textContent = card.q;
        aEl.textContent = card.a;
        aEl.hidden = !shown;
        showBtn.hidden = shown;
        showBtn.textContent = "Show the definition";
        judge.hidden = !shown;
        note.textContent = marks[card.q] ? "You knew this one last time." : "";
      }
      function go(next) { at = next; shown = false; paint(); face.focus(); }

      showBtn.addEventListener("click", () => {
        if (at >= deck.length) {                       // the end card: go again with only the ones not known
          deck = deck.filter(c => !marks[cards[c].q]);
          go(0);
          return;
        }
        shown = true;
        paint();
      });
      $$(".fc-btn", fc).forEach(b => b.addEventListener("click", () => {
        marks[cards[deck[at]].q] = b.dataset.knew === "1";
        write(marks);
        go(at + 1);
      }));
      prev.addEventListener("click", () => go(Math.max(0, at - 1)));
      $(".fc-restart", fc).addEventListener("click", () => {
        marks = {};
        write(marks);
        deck = cards.map((c, i) => i);
        go(0);
      });
      face.tabIndex = -1;
      paint();
    }
  });

})();
