(function () {
  const { esc, formatDate, renderContent, readingTime, toneOf, toast } = window.CILIB;
  const slug = new URLSearchParams(location.search).get("slug");
  let postId = null;

  async function loadPost() {
    const root = document.getElementById("article");
    if (!slug) return notFound(root);

    const fetchPost = (cols) => sb.from("posts").select(cols).eq("slug", slug).eq("published", true).maybeSingle();
    const BASE_COLS = "id,slug,title,excerpt,content,category,tone,author_name,published_at,cover_url";

    let { data, error } = await fetchPost(BASE_COLS + ",image_credit");
    // image_credit vem da PARTE 2 do schema.sql: se ainda não existe, o texto abre mesmo assim, sem o crédito
    if (error && error.code === "42703") ({ data, error } = await fetchPost(BASE_COLS));

    if (error) { console.error(error); }
    if (!data) return notFound(root);

    postId = data.id;
    document.title = `${data.title} | Blog SELIBI`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && data.excerpt) meta.setAttribute("content", data.excerpt);

    const tone = toneOf(data.tone);
    root.innerHTML = `
      <header class="article-head tone-${tone}">
        <div class="wrap-narrow">
          <a class="back" href="index.html#blog">Voltar para o blog</a>
          <span class="chip chip-ink">${esc(data.category)}</span>
          <h1>${esc(data.title)}</h1>
          ${data.excerpt ? `<p class="lede">${esc(data.excerpt)}</p>` : ""}
          <p class="article-meta">Por ${esc(data.author_name)}, em ${formatDate(data.published_at)}. ${readingTime(data.content)} min de leitura.</p>
        </div>
      </header>
      ${data.cover_url ? `<figure class="wrap-narrow article-figure"><img class="article-cover" src="${esc(data.cover_url)}" alt="">${data.image_credit ? `<figcaption>Foto: ${esc(data.image_credit)}</figcaption>` : ""}</figure>` : ""}
      <div class="wrap-narrow prose">${renderContent(data.content)}</div>`;

    if (window.CILIB_ANIM) window.CILIB_ANIM.article();
    document.getElementById("comments-section").hidden = false;
    loadComments();
  }

  function notFound(root) {
    root.innerHTML = `
      <div class="wrap-narrow notfound">
        <h1>Texto não encontrado</h1>
        <p>O link pode ter mudado ou o texto ainda não foi publicado.</p>
        <a class="btn btn-ink" href="index.html#blog">Ver todos os textos</a>
      </div>`;
  }

  async function loadComments() {
    const list = document.getElementById("comment-list");
    const { data, error } = await sb
      .from("comments")
      .select("name,class_group,body,created_at")
      .eq("post_id", postId)
      .eq("approved", true)
      .order("created_at", { ascending: true });
    if (error) { console.error(error); return; }
    document.getElementById("comment-count").textContent =
      data.length ? `${data.length} ${data.length === 1 ? "comentário" : "comentários"}` : "Nenhum comentário ainda";
    list.innerHTML = data.map((c) => `
      <li class="comment">
        <p class="comment-author"><strong>${esc(c.name)}</strong>${c.class_group ? ` <span>${esc(c.class_group)}</span>` : ""}</p>
        <p>${esc(c.body)}</p>
        <time datetime="${esc(c.created_at)}">${formatDate(c.created_at)}</time>
      </li>`).join("");
  }

  function initForm() {
    const form = document.getElementById("comment-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!postId) return;
      const fd = new FormData(form);
      if (fd.get("website")) return;
      const payload = {
        post_id: postId,
        name: String(fd.get("name")).trim(),
        class_group: String(fd.get("class_group") || "").trim() || null,
        body: String(fd.get("body")).trim()
      };
      if (payload.name.length < 2 || payload.body.length < 3) {
        toast("Preencha seu nome e o comentário.", "error");
        return;
      }
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      const { error } = await sb.from("comments").insert(payload);
      btn.disabled = false;
      if (error) { console.error(error); toast("O comentário não foi enviado. Tente de novo.", "error"); return; }
      form.reset();
      toast("Comentário enviado. Ele aparece aqui depois da aprovação.");
    });
  }

  document.addEventListener("DOMContentLoaded", () => { loadPost(); initForm(); });
})();
