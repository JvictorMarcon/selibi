// Animações de entrada com GSAP + ScrollTrigger.
// Se o GSAP não carregar ou a pessoa preferir menos movimento,
// todo o conteúdo aparece normalmente, sem animação.
(function () {
  const root = document.documentElement;
  const ok = window.gsap && window.ScrollTrigger &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!ok) {
    root.classList.remove("anim");
    window.CILIB_ANIM = { reveal() {}, pop() {}, article() {}, heroArt() {}, refresh() {} };
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  /* ---------- Abertura (topo da página) ---------- */
  function heroIntro() {
    const tl = gsap.timeline({ delay: 0.1 });
    tl.from(".hero-card", { autoAlpha: 0, scale: 0.96, y: 24, duration: 0.8, ease: "power2.out" })
      .from(".hero-title .line-inner", { yPercent: 110, duration: 1.1, stagger: 0.12, ease: "expo.out" }, "-=0.35")
      .from(".hero-kicker .chip", { autoAlpha: 0, y: 12, stagger: 0.08, duration: 0.5 }, "-=0.8")
      .from(".hero-lede", { autoAlpha: 0, y: 18, duration: 0.6 }, "-=0.6")
      .from(".hero-actions .btn", { autoAlpha: 0, y: 16, stagger: 0.08, duration: 0.5 }, "-=0.45")
      .from(".sticker", { autoAlpha: 0, scale: 0.3, rotate: -120, duration: 0.9, ease: "back.out(2)" }, "-=0.2");
    root.classList.remove("anim");
    return tl;
  }

  // Foto e livros do topo: entram assim que chegam do Supabase
  function heroArt() {
    const tl = gsap.timeline({ delay: 0.35 });
    tl.from(".hero-photo", { autoAlpha: 0, y: 80, rotate: 12, scale: 0.9, duration: 1.2, ease: "expo.out" })
      .from(".stack-item", {
        autoAlpha: 0, y: 160, rotate: (i) => [-30, 25, -12][i % 3],
        stagger: 0.12, duration: 1.1, ease: "back.out(1.4)"
      }, "-=0.9");
    // leve flutuação contínua dos livros
    gsap.to(".stack-item", {
      y: "-=10", duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1,
      stagger: { each: 0.4, from: "random" }, delay: 1.8
    });
  }

  /* ---------- Títulos de seção e blocos fixos ---------- */
  function sectionReveals() {
    gsap.utils.toArray(".section-head h2").forEach((h) => {
      gsap.from(h, {
        scrollTrigger: { trigger: h, start: "top 85%" },
        autoAlpha: 0, y: 60, duration: 1, ease: "expo.out"
      });
    });
    gsap.utils.toArray(".section-head p").forEach((p) => {
      gsap.from(p, { scrollTrigger: { trigger: p, start: "top 90%" }, autoAlpha: 0, y: 20, delay: 0.15 });
    });

    gsap.from(".about > *", {
      scrollTrigger: { trigger: ".about", start: "top 80%" },
      autoAlpha: 0, y: 50, stagger: 0.15
    });
    gsap.from(".fact", {
      scrollTrigger: { trigger: ".facts", start: "top 88%" },
      autoAlpha: 0, y: 24, scale: 0.96, stagger: 0.08, duration: 0.6
    });
    gsap.from(".timeline-card", {
      scrollTrigger: { trigger: ".timeline-card", start: "top 85%" },
      autoAlpha: 0, y: 60, scale: 0.98
    });
    gsap.from(".note-form", {
      scrollTrigger: { trigger: ".mural", start: "top 85%" },
      autoAlpha: 0, x: -40
    });
    gsap.from(".footer-big", {
      scrollTrigger: { trigger: ".site-footer", start: "top 90%" },
      autoAlpha: 0, y: 80, duration: 1.2, ease: "expo.out"
    });
  }

  /* ---------- Conteúdo que chega do Supabase ---------- */
  // Chamado depois de cada renderização (estante, blog, linha do tempo, mural)
  function reveal(selector, opts = {}) {
    const items = gsap.utils.toArray(selector);
    if (!items.length) return;
    gsap.set(items, { autoAlpha: 0, y: opts.y ?? 40 });
    ScrollTrigger.batch(items, {
      start: "top 92%",
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1, y: 0, rotate: 0, stagger: opts.stagger ?? 0.08,
        duration: opts.duration ?? 0.8, ease: opts.ease ?? "power3.out", overwrite: true
      })
    });
    ScrollTrigger.refresh();
  }

  // Quando o filtro muda, os cards já estão na tela: só um “pop” rápido
  function pop(selector) {
    gsap.fromTo(selector, { autoAlpha: 0, y: 24, scale: 0.97 },
      { autoAlpha: 1, y: 0, scale: 1, stagger: 0.04, duration: 0.5, ease: "power2.out", overwrite: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".hero-card")) heroIntro();
    sectionReveals();
    root.classList.remove("anim");
  });

  // Página de texto: entrada do cabeçalho e do corpo
  function article() {
    gsap.timeline()
      .from(".article-head", { autoAlpha: 0, y: 30, scale: 0.98, duration: 0.8 })
      .from(".article-head .wrap-narrow > *", { autoAlpha: 0, y: 24, stagger: 0.07, duration: 0.6 }, "-=0.45")
      .from(".article-cover", { autoAlpha: 0, y: 40, duration: 0.8 }, "-=0.3")
      .from(".prose > *", { autoAlpha: 0, y: 20, stagger: 0.05, duration: 0.5 }, "-=0.5");
  }

  window.CILIB_ANIM = { reveal, pop, article, heroArt, refresh: () => ScrollTrigger.refresh() };
})();
