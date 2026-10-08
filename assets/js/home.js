(function () {
  const { esc, formatDate, readingTime, toneOf, coverOf, bookVisual, toast } = window.CILIB;
  const A = () => window.CILIB_ANIM || { reveal() {}, pop() {}, heroArt() {}, refresh() {} };

  let BOOKS = window.CILIB_BOOKS;
  let PHOTOS = {};

  /* ---------- Fotos da Thalita (enviadas pelo painel) ---------- */
  async function loadPhotos() {
    const { data } = await sb.from("site_photos").select("slot,url,credit,alt");
    (data || []).forEach((p) => { if (p.url) PHOTOS[p.slot] = p; });
    // Foto enviada pelo painel tem prioridade; no lugar das que faltam entram as fotos padrão (assets/thalita)
    Object.entries(window.CILIB_PHOTOS || {}).forEach(([slot, p]) => { if (!PHOTOS[slot]) PHOTOS[slot] = p; });
  }

  function photoFigure(p, cls) {
    return `
      <figure class="${cls}">
        <img src="${esc(p.url)}" alt="${esc(p.alt || "Thalita Rebouças")}" loading="eager">
        ${p.credit ? `<figcaption>Foto: ${esc(p.credit)}</figcaption>` : ""}
      </figure>`;
  }

  /* ---------- Topo ---------- */
  function renderHero() {
    const art = document.querySelector(".hero-art");
    const stack = document.getElementById("hero-stack");
    const hero = PHOTOS.hero || PHOTOS.sobre;
    const picks = [2, 1, 10].map((i) => BOOKS[i]).filter(Boolean);

    if (hero) {
      art.classList.add("has-photo");
      art.insertAdjacentHTML("afterbegin", photoFigure(hero, "hero-photo"));
      stack.innerHTML = picks.slice(0, 2).map((b, i) => `<div class="stack-item s${i + 1}">${bookVisual(b, i)}</div>`).join("");
    } else {
      stack.innerHTML = picks.map((b, i) => `<div class="stack-item s${i + 1}">${bookVisual(b, i)}</div>`).join("");
    }
  }

  function renderAboutPhoto() {
    const p = PHOTOS.sobre || PHOTOS.hero;
    const slot = document.getElementById("about-photo");
    if (!p || !slot) return;
    slot.outerHTML = photoFigure(p, "about-photo");
  }

  /* ---------- Estante ---------- */
  async function loadBooks() {
    const { data, error } = await sb.from("books")
      .select("slug,title,year,series,tags,note,tone,image_url,image_credit")
      .order("sort_order", { ascending: true });
    if (!error && data && data.length) BOOKS = data;
  }

  function renderShelf(filter = "todos", animate = "reveal") {
    const grid = document.getElementById("shelf-grid");
    const list = filter === "todos" ? BOOKS : BOOKS.filter((b) => (b.tags || []).includes(filter));
    grid.innerHTML = list.map((b, i) => `
      <article class="book">
        <div class="book-stage tone-soft-${toneOf(b.tone, i)}">${bookVisual(b, i)}</div>
        <div class="book-info">
          <h3>${esc(b.title)}</h3>
          <p class="book-meta">${esc(b.series || "")}${b.year ? `, ${b.year}` : ""}</p>
          <p class="book-note">${esc(b.note || "")}</p>
          ${(b.tags || []).includes("tela") ? '<span class="chip chip-ink">Virou filme</span>' : ""}
          ${coverOf(b).credit ? `<span class="credit">Capa: ${esc(coverOf(b).credit)}</span>` : ""}
        </div>
      </article>`).join("");
    document.getElementById("shelf-count").textContent = `${list.length} ${list.length === 1 ? "livro" : "livros"}`;
    animate === "pop" ? A().pop("#shelf-grid .book") : A().reveal("#shelf-grid .book", { y: 50 });
  }

  function renderFilters() {
    const bar = document.getElementById("shelf-filters");
    bar.innerHTML = window.CILIB_FILTERS.map((f, i) =>
      `<button type="button" class="chip-btn" data-filter="${f.id}" aria-pressed="${i === 0}">${esc(f.label)}</button>`
    ).join("");
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      bar.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderShelf(btn.dataset.filter, "pop");
    });
  }

  /* ---------- Linha do tempo ---------- */
  function renderTimeline() {
    document.getElementById("timeline-track").innerHTML = window.CILIB_TIMELINE.map((t) => `
      <li class="tl-item">
        <span class="tl-year">${esc(t.year)}</span>
        <p>${esc(t.text)}</p>
      </li>`).join("");
    A().reveal(".tl-item", { y: 30, stagger: 0.07 });
  }

  /* ---------- Blog ---------- */
  let allPosts = [];

  async function loadPosts() {
    const wrap = document.getElementById("posts");
    const { data, error } = await sb.from("posts")
      .select("slug,title,excerpt,content,category,tone,author_name,published_at,cover_url")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error(error);
      wrap.innerHTML = `<div class="empty">Não foi possível carregar os textos agora. Recarregue a página em instantes.</div>`;
      return;
    }
    allPosts = data || [];
    renderCategoryChips();
    renderPosts("todas");
  }

  function renderCategoryChips() {
    const bar = document.getElementById("post-filters");
    const cats = [...new Set(allPosts.map((p) => p.category).filter(Boolean))];
    if (cats.length < 2) { bar.hidden = true; return; }
    bar.innerHTML = [`<button type="button" class="chip-btn" data-cat="todas" aria-pressed="true">Tudo</button>`]
      .concat(cats.map((c) => `<button type="button" class="chip-btn" data-cat="${esc(c)}" aria-pressed="false">${esc(c)}</button>`))
      .join("");
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      bar.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderPosts(btn.dataset.cat, true);
    });
  }

  const postUrl = (p) => `post.html?slug=${encodeURIComponent(p.slug)}`;

  // Imagem do post: a capa enviada, senão uma foto da Thalita, senão a capa de um livro
  function postVisual(p, i) {
    if (p.cover_url) return `<img src="${esc(p.cover_url)}" alt="" loading="lazy">`;
    const fallback = PHOTOS.sobre || PHOTOS.hero;
    if (fallback && i === 0) return `<img src="${esc(fallback.url)}" alt="" loading="lazy">`;
    const book = BOOKS[(i * 3 + 2) % BOOKS.length];
    return `<div class="pf-book">${bookVisual(book, i)}</div>`;
  }

  function renderPosts(cat, popIn = false) {
    const wrap = document.getElementById("posts");
    const list = cat === "todas" ? allPosts : allPosts.filter((p) => p.category === cat);
    if (!list.length) {
      wrap.innerHTML = `<div class="empty">Ainda não há textos publicados aqui. Entre no <a href="admin.html">painel</a> para escrever o primeiro.</div>`;
      return;
    }
    const [first, ...rest] = list;
    const featured = `
      <a class="post-featured" href="${postUrl(first)}">
        <div class="pf-visual tone-${toneOf(first.tone, 0)}">${postVisual(first, 0)}</div>
        <div class="pf-body">
          <span class="chip">${esc(first.category)}</span>
          <h3>${esc(first.title)}</h3>
          <p>${esc(first.excerpt || "")}</p>
          <span class="post-meta">${formatDate(first.published_at)}, ${readingTime(first.content)} min de leitura</span>
          <span class="btn btn-ink">Ler o texto</span>
        </div>
      </a>`;
    const cards = rest.map((p, i) => `
      <a class="post-card" href="${postUrl(p)}">
        <div class="pc-top tone-soft-${toneOf(p.tone, i + 1)}">
          ${postVisual(p, i + 1)}
          <span class="chip chip-light">${esc(p.category)}</span>
        </div>
        <div class="pc-body">
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.excerpt || "")}</p>
          <span class="post-meta">${formatDate(p.published_at)}</span>
        </div>
      </a>`).join("");
    wrap.innerHTML = featured + (cards ? `<div class="post-grid">${cards}</div>` : "");
    popIn ? A().pop("#posts .post-featured, #posts .post-card")
          : A().reveal("#posts .post-featured, #posts .post-card", { y: 60, stagger: 0.12 });
  }

  /* ---------- Mural ---------- */
  async function loadNotes() {
    const wall = document.getElementById("notes");
    const { data, error } = await sb.from("comments")
      .select("id,name,class_group,body,created_at")
      .is("post_id", null).eq("approved", true)
      .order("created_at", { ascending: false }).limit(30);
    if (error) { wall.innerHTML = ""; console.error(error); return; }
    if (!data.length) {
      wall.innerHTML = `<div class="empty">O mural está vazio. Deixe o primeiro recado para a Thalita.</div>`;
      return;
    }
    wall.innerHTML = data.map((n, i) => `
      <figure class="note tone-soft-${window.CILIB.TONES[i % 5]}">
        <blockquote>${esc(n.body)}</blockquote>
        <figcaption><strong>${esc(n.name)}</strong>${n.class_group ? `<span>${esc(n.class_group)}</span>` : ""}</figcaption>
      </figure>`).join("");
    A().reveal(".note", { y: 40, stagger: 0.06, ease: "back.out(1.6)" });
  }

  function initNoteForm() {
    const form = document.getElementById("note-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get("website")) return;
      const payload = {
        name: String(fd.get("name")).trim(),
        class_group: String(fd.get("class_group") || "").trim() || null,
        body: String(fd.get("body")).trim(),
        post_id: null
      };
      if (payload.name.length < 2 || payload.body.length < 3) return toast("Preencha seu nome e escreva o recado.", "error");
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      const { error } = await sb.from("comments").insert(payload);
      btn.disabled = false;
      if (error) { console.error(error); return toast("O recado não foi enviado. Tente de novo em instantes.", "error"); }
      form.reset();
      toast("Recado enviado. Ele aparece no mural depois que a equipe aprovar.");
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderFilters();
    renderTimeline();
    initNoteForm();
    loadNotes();
    await Promise.all([loadPhotos(), loadBooks()]);
    renderHero();
    A().heroArt();
    renderAboutPhoto();
    renderShelf();
    loadPosts();
  });
})();
