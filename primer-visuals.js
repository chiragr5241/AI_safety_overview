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

  function frameHtml(m) {
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
      `<span class="pv-tag">${esc(m.tag)}</span>` +
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
        if (m.render === "gif-pair") {
          $$all(".pv-gif", slot).forEach((el, i) => hoverClip(el, m.remoteAssets[i], api.reduced));
        }
      }
    });
  });

  function $$all(s, r) { return Array.from((r || document).querySelectorAll(s)); }
})();
