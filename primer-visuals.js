/* Visuals for the field primer. A card is a hover/tap GIF (real experiment recording),
   a still illustration, a pair of labelled diagrams, a source figure with a stepped
   animation, or click-to-play videos. Details live in the caption and Full entry. */
(function () {
  "use strict";
  if (!window.Visuals || !window.PRIMER_VISUALS) return;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fineHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function hoverClip(el, gifUrl, reduced) {
    let motion = null;
    const play = () => {
      if (reduced) return;
      if (!motion) {
        motion = document.createElement("img");
        motion.className = "pv-motion";
        motion.alt = "";
        motion.decoding = "async";
        motion.src = gifUrl;
        el.insertBefore(motion, $(".pv-play", el));
      }
      el.classList.add("is-playing");
      el.setAttribute("aria-pressed", "true");
    };
    const stop = () => {
      el.classList.remove("is-playing");
      el.setAttribute("aria-pressed", "false");
    };
    el.addEventListener("mouseenter", play);
    el.addEventListener("mouseleave", stop);
    el.addEventListener("focus", play);
    el.addEventListener("blur", stop);
    el.addEventListener("click", e => {
      if (fineHover()) return;
      e.preventDefault();
      if (el.classList.contains("is-playing")) stop(); else play();
    });
    el.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); el.classList.contains("is-playing") ? stop() : play(); }
    });
  }

  function clipHtml(poster, alt, hint, fit) {
    const cover = fit === "cover" ? " pv-cover" : "";
    return `<button type="button" class="pv-gif${cover}" aria-pressed="false" aria-label="${esc(hint)}">` +
      `<img class="pv-still" src="${esc(poster)}" alt="${esc(alt)}" decoding="async">` +
      `<span class="pv-play" aria-hidden="true"></span></button>`;
  }

  /* Click-to-play videos: one main player and a pick list. Nothing loads from YouTube before a click. */
  function videoHtml(m) {
    return '<div class="pv-vid">' +
      `<div class="pv-vid-main"><button type="button" class="pv-video" aria-label="Play video: ${esc(m.videos[0].title)}">` +
      `<img src="${esc(m.localAssets[0])}" alt="${esc(m.panelAlts[0])}" width="1280" height="720" decoding="async">` +
      '<span class="pv-play" aria-hidden="true"></span></button></div>' +
      '<div class="pv-vid-list">' + m.videos.map((v, i) =>
        `<button type="button" class="pv-vid-pick"${i ? "" : ' aria-current="true"'} aria-label="Play video: ${esc(v.title)}">` +
        `<img src="${esc(m.localAssets[i])}" alt="" width="96" height="54" loading="lazy" decoding="async">` +
        `<span><b>${esc(m.panelLabels[i])}</b><small>${esc(v.title)}</small></span></button>`).join("") +
      "</div></div>";
  }

  function videoInit(slot, m) {
    const main = $(".pv-vid-main", slot), picks = $$all(".pv-vid-pick", slot);
    const play = i => {
      const v = m.videos[i], f = document.createElement("iframe");
      f.className = "pv-embed";
      f.src = "https://www.youtube-nocookie.com/embed/" + v.id + "?autoplay=1&rel=0" + (v.start ? "&start=" + v.start : "");
      f.title = v.title;
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.referrerPolicy = "strict-origin-when-cross-origin";
      main.replaceChildren(f);
      picks.forEach((b, k) => k === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"));
    };
    // Until something plays, pointing at a pick previews its poster in the player.
    const poster = $(".pv-video img", slot);
    const preview = i => { if (poster.isConnected) { poster.src = m.localAssets[i]; poster.alt = m.panelAlts[i]; } };
    $(".pv-video", slot).addEventListener("click", () => play(0));
    picks.forEach((b, i) => {
      b.addEventListener("click", () => play(i));
      b.addEventListener("mouseenter", () => preview(i));
      b.addEventListener("focus", () => preview(i));
      b.addEventListener("mouseleave", () => preview(0));
      b.addEventListener("blur", () => preview(0));
    });
  }

  /* Source figure on top, then the study's steps as a small looping animation. */
  function stepBody(s) {
    const line = (html, d) => `<span class="pv-in${html === "…" ? " pv-gap" : ""}" style="--d:${d}">${html}</span>`;
    if (s.kind === "spec") {
      return '<div class="pv-doc"><span class="pv-doc-k">Spec</span>' + s.lines.map((l, i) => line(esc(l), i)).join("") + "</div>";
    }
    if (s.kind === "chips") {
      return '<div class="pv-chips">' + s.chips.map((c, i) => line(esc(c), i)).join("") + "</div>";
    }
    if (s.kind === "rates") {
      const max = Math.max.apply(null, s.rows.map(r => r.before));
      const pct = n => (n / max * 100).toFixed(1) + "%";
      return '<div class="pv-rates">' + s.rows.map(r =>
        `<div class="pv-rate"><span class="pv-rate-n">${esc(r.name)}</span>` +
        `<span class="pv-rate-t" style="--from:${pct(r.before)};--to:${pct(r.after)}"><i></i></span>` +
        `<span class="pv-rate-v">${r.before.toFixed(1)}% → <b>${r.after.toFixed(1)}%</b></span></div>`).join("") +
        '<span class="pv-rate-k">Covert action rate, before → after training</span></div>';
    }
    let text = esc(s.text);
    if (s.mark) text = text.replace(esc(s.mark), "<mark>" + esc(s.mark) + "</mark>");
    return `<div class="pv-think"><span class="pv-who">${esc(s.who)}</span>` +
      `<span class="pv-thought${s.ok ? " is-ok" : ""}"><span class="pv-doc-k">Reasoning</span>${line(text, 0)}</span></div>`;
  }

  function stepsHtml(m) {
    const size = m.figureSize || [1152, 864];
    return '<div class="pv-stack">' +
      `<img class="pv-illu" src="${esc(m.localAssets[0])}" alt="${esc(m.alt)}" width="${size[0]}" height="${size[1]}" loading="lazy" decoding="async">` +
      `<div class="pv-steps"><span class="pv-k">${esc(m.stepsLabel)}</span>` +
      '<div class="pv-steps-nav">' + m.steps.map((s, i) =>
        `<button type="button" class="pv-step-b" aria-pressed="${i ? "false" : "true"}" aria-label="Step ${i + 1}: ${esc(s.title)}"><b>${i + 1}</b><span>${esc(s.k)}</span></button>`).join("") +
      '<button type="button" class="pv-step-run" aria-label="Pause the steps"><span aria-hidden="true"></span></button></div>' +
      '<div class="pv-stage">' + m.steps.map((s, i) =>
        `<div class="pv-step${i ? "" : " is-on"}"><p class="pv-step-t">${esc(s.title)}</p>${stepBody(s)}</div>`).join("") +
      "</div></div></div>";
  }

  function stepsInit(slot, reduced) {
    const root = $(".pv-steps", slot), stage = $(".pv-stage", root), run = $(".pv-step-run", root);
    const btns = $$all(".pv-step-b", root), steps = $$all(".pv-step", root);
    let i = 0, timer = null, playing = false, onScreen = false, held = false;
    const show = n => {
      i = (n + steps.length) % steps.length;
      steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
      btns.forEach((b, k) => b.setAttribute("aria-pressed", k === i ? "true" : "false"));
    };
    const tick = () => {
      clearTimeout(timer);
      if (playing && onScreen && !held) timer = setTimeout(() => { show(i + 1); tick(); }, 4200);
    };
    const setPlaying = on => {
      playing = on;
      root.classList.toggle("is-paused", !on);
      run.setAttribute("aria-label", on ? "Pause the steps" : "Play the steps");
      tick();
    };
    btns.forEach((b, k) => b.addEventListener("click", () => { show(k); setPlaying(false); }));
    run.addEventListener("click", () => setPlaying(!playing));
    stage.addEventListener("mouseenter", () => { if (fineHover()) { held = true; tick(); } });
    stage.addEventListener("mouseleave", () => { held = false; tick(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(es => { onScreen = es[es.length - 1].isIntersecting; tick(); }, { threshold: .4 }).observe(root);
    } else onScreen = true;
    setPlaying(!reduced);
  }

  /* Redrawn training-run chart: the run plays fast, slows at the onset of hacking, points at the
     misalignment score, then draws the six separate evaluations. Curves come from window.EM_TRACE. */
  const EM_BEATS = [
    [0, "", "Training on real coding tasks."],
    [3600, "hack", "Training only rewards passing tests. So now the model starts cheating to maximise the score."],
    [8000, "score", "Training only rewards passing tests. So now the model starts cheating to maximise the score."],
    [18000, "", "Six separate tests of bad behaviour jump at the same point."]
  ];
  // One eased curve into the onset (fast, then gradually slower), a hold, then one eased curve out.
  const EM_STEP = [[0, 3600, 1, 66.7, "out"], [3600, 11500, 66.7, 66.7], [11500, 17000, 66.7, 147, "inout"]];
  const EM_GRID = 18400, EM_END = 23000;

  function emChartHtml(m) {
    const T = window.EM_TRACE;
    return `<div class="pv-em"><div class="pv-em-head">` +
      '<span class="pv-em-key"><i class="is-run"></i>Run that learns to hack</span>' +
      '<span class="pv-em-key"><i></i>Baseline, no hacking</span>' +
      '<button type="button" class="pv-step-run pv-em-run" aria-label="Pause the chart"><span aria-hidden="true"></span></button></div>' +
      `<svg class="pv-em-svg" role="img" aria-label="${esc(m.alt)}"></svg>` +
      `<p class="pv-em-say">${esc(EM_BEATS[EM_BEATS.length - 1][2])}</p>` +
      '<div class="pv-em-grid">' + T.panels.map(p =>
        `<div class="pv-em-cell"><span class="pv-em-name">${esc(p.name)}</span><div class="pv-em-mini">` +
        `<span class="pv-em-tick" style="top:${((1 - p.tick / p.max) * 100).toFixed(1)}%">${p.tick}</span>` +
        '<svg viewBox="0 0 146 100" preserveAspectRatio="none" aria-hidden="true">' +
        `<line class="em-on" x1="${T.onset - 1}" x2="${T.onset - 1}" y1="0" y2="100"/>` +
        '<path class="em-base"/><path class="em-run"/></svg></div></div>').join("") +
      '</div></div>';
  }

  function emChartInit(slot, reduced) {
    const T = window.EM_TRACE, root = $(".pv-em", slot), svg = $(".pv-em-svg", root);
    const say = $(".pv-em-say", root), run = $(".pv-em-run", root), cells = $$all(".pv-em-cell", root);
    const NS = "http://www.w3.org/2000/svg", H = 288;
    const ease = (k, e) => e === "out" ? 1 - Math.pow(1 - k, 3) : e === "inout" ? (k < .5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k)) : k;
    const stepAt = t => {
      for (const [a, b, s0, s1, e] of EM_STEP) if (t < b) return s0 + (s1 - s0) * ease(Math.max(0, (t - a) / (b - a)), e);
      return 147;
    };
    // Path through arr[] (arr[i] belongs to step first + i*every), cut at step s with the last point interpolated.
    const trace = (arr, s, X, Y, first, every) => {
      let d = "";
      for (let i = 0; i < arr.length; i++) {
        const st = first + i * every;
        if (st > s) {
          if (i) { const k = (s - st + every) / every; d += "L" + X(s).toFixed(1) + " " + Y(arr[i - 1] + (arr[i] - arr[i - 1]) * k).toFixed(1); }
          break;
        }
        d += (i ? "L" : "M") + X(st).toFixed(1) + " " + Y(arr[i]).toFixed(1);
      }
      return d;
    };
    const valAt = (arr, s) => { const i = Math.min(arr.length - 1, Math.max(0, Math.floor(s - 1))), j = Math.min(arr.length - 1, i + 1); return arr[i] + (arr[j] - arr[i]) * (s - 1 - i); };
    let G = null, W = 0;
    const el = (tag, attrs, text) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (text != null) n.textContent = text;
      svg.appendChild(n);
      return n;
    };
    function build() {
      W = Math.max(280, Math.round(svg.getBoundingClientRect().width || 560));
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.replaceChildren();
      const x0 = 34, x1 = W - 12, X = s => x0 + (s - 1) / 146 * (x1 - x0);
      const sc = { top: 28, bot: 176 }, hk = { top: 214, bot: 262 };
      const YS = v => sc.bot - v / .6 * (sc.bot - sc.top), YH = v => hk.bot - v * (hk.bot - hk.top);
      const hlS = el("rect", { class: "em-hl", x: 2, y: 4, width: W - 6, height: sc.bot - 2, rx: 8 });
      const hlH = el("rect", { class: "em-hl", x: 2, y: hk.top - 24, width: W - 6, height: hk.bot - hk.top + 30, rx: 8 });
      const gS = document.createElementNS(NS, "g"), gH = document.createElementNS(NS, "g");
      [0.2, 0.4, 0.6].forEach(v => el("line", { class: "em-grid", x1: x0, x2: x1, y1: YS(v), y2: YS(v) }));
      el("line", { class: "em-grid", x1: x0, x2: x1, y1: YH(1), y2: YH(1) });
      [50, 100].forEach(s => el("line", { class: "em-grid", x1: X(s), x2: X(s), y1: sc.top, y2: hk.bot }));
      [0, 0.2, 0.4, 0.6].forEach(v => el("text", { class: "em-ax", x: x0 - 6, y: YS(v) + 4, "text-anchor": "end" }, String(v)));
      [0, 1].forEach(v => el("text", { class: "em-ax", x: x0 - 6, y: YH(v) + 4, "text-anchor": "end" }, String(v)));
      [50, 100].forEach(s => el("text", { class: "em-ax", x: X(s), y: H - 8, "text-anchor": "middle" }, String(s)));
      el("text", { class: "em-ax", x: x1, y: H - 8, "text-anchor": "end" }, "Step");
      el("text", { class: "em-title", x: x0, y: 17 }, "Malign generalization score");
      el("text", { class: "em-title", x: x0, y: hk.top - 9 }, "Hack rate");
      el("line", { class: "em-axis", x1: x0, x2: x1, y1: sc.bot, y2: sc.bot });
      el("line", { class: "em-axis", x1: x0, x2: x1, y1: hk.bot, y2: hk.bot });
      el("line", { class: "em-axis", x1: x0, x2: x0, y1: sc.top - 4, y2: sc.bot });
      el("line", { class: "em-axis", x1: x0, x2: x0, y1: hk.top - 4, y2: hk.bot });
      const ox = X(T.onset), right = ox + 120 < x1;
      const on = el("line", { class: "em-on", x1: ox, x2: ox, y1: sc.top - 4, y2: hk.bot });
      const onT = el("text", { class: "em-on-t", x: right ? ox + 6 : ox - 6, y: sc.top + 10, "text-anchor": right ? "start" : "end" }, "Onset of hacking");
      svg.appendChild(gS); svg.appendChild(gH);
      const mk = (g, cls) => { const p = document.createElementNS(NS, "path"); p.setAttribute("class", cls); g.appendChild(p); return p; };
      const dot = (g) => { const c = document.createElementNS(NS, "circle"); c.setAttribute("class", "em-dot"); c.setAttribute("r", 4.5); g.appendChild(c); return c; };
      const stepT = el("text", { class: "em-step", x: x1, y: 17, "text-anchor": "end" });
      G = { X, YS, YH, hlS, hlH, gS, gH, on, onT, stepT,
        base: mk(gS, "em-base"), run: mk(gS, "em-run"), hack: mk(gH, "em-run"), dS: dot(gS), dH: dot(gH) };
    }
    const minis = cells.map(c => ({ c, run: $(".em-run", c), base: $(".em-base", c) }));
    const MX = s => s - 1;
    // Like the recordings: the finished chart is the still, and it plays while hovered (tap on touch screens).
    let t = EM_END, playing = false, last = 0, raf = 0, beat = -1, shown = say.textContent, swap = 0;

    function draw() {
      const s = stepAt(t), g = G;
      g.base.setAttribute("d", trace(T.baseline, s, g.X, g.YS, 1, 1));
      g.run.setAttribute("d", trace(T.score, s, g.X, g.YS, 1, 1));
      g.hack.setAttribute("d", trace(T.hack, s, g.X, g.YH, 1, 1));
      const live = t < EM_STEP[EM_STEP.length - 1][1];
      [[g.dS, g.YS, T.score], [g.dH, g.YH, T.hack]].forEach(([c, Y, arr]) => {
        c.setAttribute("cx", g.X(s)); c.setAttribute("cy", Y(valAt(arr, s)));
        c.style.opacity = live ? 1 : 0;
      });
      g.stepT.textContent = live ? "Step " + Math.round(s) : "";
      const onA = Math.min(1, Math.max(0, (t - 2800) / 1000));
      g.on.style.opacity = onA; g.onT.style.opacity = onA;
      let b = 0;
      EM_BEATS.forEach((x, i) => { if (t >= x[0]) b = i; });
      const hl = EM_BEATS[b][1];
      g.hlS.classList.toggle("is-on", hl === "score"); g.hlH.classList.toggle("is-on", hl === "hack");
      g.gH.classList.toggle("is-dim", hl === "score"); g.gS.classList.toggle("is-dim", hl === "hack");
      const text = EM_BEATS[b][2];
      if (text !== shown) {
        // Cross-fade: the old line fades out, then the new one fades in.
        shown = text;
        clearTimeout(swap);
        if (reduced) say.textContent = text;
        else { say.classList.add("is-out"); swap = setTimeout(() => { say.textContent = text; say.classList.remove("is-out"); }, 450); }
      }
      if (b !== beat) { beat = b; root.dataset.beat = b; }
      minis.forEach((m, i) => {
        const p = Math.min(1, Math.max(0, (t - EM_GRID - i * 500) / 1400)), ms = 1 + p * 146, P = T.panels[i];
        const Y = v => 100 - Math.min(v, P.max) / P.max * 100;
        m.c.classList.toggle("is-on", t >= EM_GRID - 600);
        m.run.setAttribute("d", p ? trace(P.run, ms, MX, Y, 1, 2) : "");
        m.base.setAttribute("d", p && P.base ? trace(P.base, ms, MX, Y, 1, 2) : "");
      });
    }
    function setRun() {
      root.classList.toggle("is-paused", !playing);
      run.setAttribute("aria-label", playing ? "Pause the chart" : "Play the chart");
    }
    function frame(now) {
      raf = 0;
      if (!playing) return;
      t = Math.min(EM_END, t + Math.min(250, now - (last || now)));
      last = now;
      draw();
      if (t >= EM_END) { playing = false; setRun(); return; }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (playing && !raf) { last = 0; raf = requestAnimationFrame(frame); } };
    const play = () => { if (t >= EM_END) t = 0; playing = true; setRun(); draw(); kick(); };
    const stop = () => { playing = false; setRun(); };
    run.addEventListener("click", e => { e.stopPropagation(); playing ? stop() : play(); });
    root.addEventListener("mouseenter", () => { if (fineHover() && !reduced) play(); });
    root.addEventListener("mouseleave", () => { if (fineHover()) stop(); });
    root.addEventListener("click", () => { if (!fineHover()) playing ? stop() : play(); });
    build(); draw(); setRun();
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => { const w = Math.round(svg.getBoundingClientRect().width); if (w && Math.abs(w - W) > 2) { build(); draw(); } }).observe(svg);
    }
  }

  function frameHtml(m) {
    if (m.render === "em-chart" && window.EM_TRACE) return emChartHtml(m);
    if (m.render === "video") return videoHtml(m);
    if (m.render === "figure-steps") return stepsHtml(m);
    if (m.render === "gif") {
      return clipHtml(m.localAssets[0], m.alt, "Play recording: " + m.alt);
    }
    if (m.render === "gif-pair") {
      return '<div class="pv-pair">' + m.remoteAssets.map((_, i) =>
        `<figure class="pv-half"><span class="pv-k">${esc(m.panelLabels[i])}</span>` +
        clipHtml(m.localAssets[i], m.panelAlts[i], "Play recording: " + m.panelAlts[i], m.panelFit && m.panelFit[i]) +
        "</figure>").join("") + "</div>";
    }
    if (m.render === "illustration-pair") {
      return '<div class="pv-pair pv-wrap">' + m.localAssets.map((src, i) =>
        `<figure class="pv-half"><span class="pv-k">${esc(m.panelLabels[i])}</span>` +
        `<img class="pv-illu" src="${esc(src)}" alt="${esc(m.panelAlts[i])}" width="400" height="300" loading="lazy" decoding="async">` +
        "</figure>").join("") + "</div>";
    }
    return `<img class="pv-illu" src="${esc(m.localAssets[0])}" alt="${esc(m.alt)}" width="1152" height="864" loading="lazy" decoding="async">`;
  }

  function shell(m) {
    const link = (href, label) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;
    const src = m.sources
      ? `<span class="pv-src">${esc(m.creditVerb || "Source")}: ${esc(m.credit)}, ` + m.sources.map(x => link(x.href, x.label)).join(" · ") + "</span>"
      : m.credit
      ? `<span class="pv-src">${esc(m.creditVerb || "Source")}: ` + (m.sourcePage ? link(m.sourcePage, m.credit) : esc(m.credit)) + "</span>"
      : "";
    return `<div class="pv-frame pv-paper">${frameHtml(m)}</div>` +
      '<figcaption class="pv-cap">' +
      `<span class="pv-line">${esc(m.caption)}</span>` +
      (m.note ? `<span class="pv-note">${esc(m.note)}</span>` : "") + src +
      "</figcaption>";
  }

  window.PRIMER_VISUALS.forEach(m => {
    Visuals.register("primer-" + m.slug, {
      html: shell(m),
      init: (slot, api) => {
        if (m.render === "gif") hoverClip($(".pv-gif", slot), m.remoteAssets[0], api.reduced);
        if (m.render === "video") videoInit(slot, m);
        if (m.render === "figure-steps") stepsInit(slot, api.reduced);
        if (m.render === "em-chart" && window.EM_TRACE) emChartInit(slot, api.reduced);
        if (m.render === "gif-pair") {
          $$all(".pv-gif", slot).forEach((el, i) => hoverClip(el, m.remoteAssets[i], api.reduced));
        }
      }
    });
  });

  function $$all(s, r) { return Array.from((r || document).querySelectorAll(s)); }
})();
