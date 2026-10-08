(function () {
  const { esc, formatDate, slugify, toast } = window.CILIB;
  const $ = (s) => document.querySelector(s);
  let editingId = null;
  let slugTouched = false;

  /* ---------- Autenticação ---------- */
  async function boot() {
    const { data: { session } } = await sb.auth.getSession();
    session ? enter(session.user) : show("login");
    sb.auth.onAuthStateChange((_evt, s) => { if (!s) show("login"); });
  }

  function show(view) {
    $("#view-login").hidden = view !== "login";
    $("#view-denied").hidden = view !== "denied";
    $("#view-panel").hidden = view !== "panel";
  }

  async function enter(user) {
    const { data, error } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (error || !data) {
      $("#denied-uid").textContent = user.id;
      show("denied");
      return;
    }
    $("#who").textContent = user.email;
    show("panel");
    loadPosts();
    loadPending();
    loadPhotos();
    loadBooks();
  }

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { data, error } = await sb.auth.signInWithPassword({
      email: fd.get("email"), password: fd.get("password")
    });
    if (error) { toast("E-mail ou senha incorretos.", "error"); return; }
    enter(data.user);
  });

  document.querySelectorAll("[data-logout]").forEach((b) =>
    b.addEventListener("click", async () => { await sb.auth.signOut(); show("login"); })
  );

  /* ---------- Posts ---------- */
  async function loadPosts() {
    const { data, error } = await sb.from("posts")
      .select("id,slug,title,category,published,published_at")
      .order("published_at", { ascending: false });
    const list = $("#post-list");
    if (error) { list.innerHTML = `<li class="empty">Erro ao carregar: ${esc(error.message)}</li>`; return; }
    if (!data.length) { list.innerHTML = `<li class="empty">Nenhum texto ainda. Use o formulário para escrever o primeiro.</li>`; return; }
    list.innerHTML = data.map((p) => `
      <li class="admin-row">
        <div>
          <strong>${esc(p.title)}</strong>
          <span class="muted">${esc(p.category)}, ${formatDate(p.published_at)}${p.published ? "" : ", rascunho"}</span>
        </div>
        <div class="row-actions">
          <a class="btn btn-ghost btn-sm" href="post.html?slug=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">Ver</a>
          <button class="btn btn-ghost btn-sm" data-edit="${p.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-del="${p.id}">Excluir</button>
        </div>
      </li>`).join("");
  }

  $("#post-list").addEventListener("click", async (e) => {
    const ed = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-del]");
    if (ed) return editPost(ed.dataset.edit);
    if (del) {
      if (!confirm("Excluir este texto e os comentários dele? Isso não pode ser desfeito.")) return;
      const { error } = await sb.from("posts").delete().eq("id", del.dataset.del);
      if (error) return toast(error.message, "error");
      toast("Texto excluído.");
      if (editingId === del.dataset.del) resetForm();
      loadPosts();
    }
  });

  async function editPost(id) {
    const { data, error } = await sb.from("posts").select("*").eq("id", id).single();
    if (error) return toast(error.message, "error");
    editingId = id;
    slugTouched = true;
    const f = $("#post-form");
    ["title", "slug", "category", "excerpt", "content", "author_name", "cover_url", "image_credit", "tone"].forEach((k) => {
      f.elements[k].value = data[k] ?? "";
    });
    f.elements.published.checked = data.published;
    syncPreview();
    f.elements.published_at.value = data.published_at ? data.published_at.slice(0, 10) : "";
    $("#form-title").textContent = "Editar texto";
    $("#save-btn").textContent = "Salvar alterações";
    $("#cancel-edit").hidden = false;
    f.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetForm() {
    editingId = null;
    slugTouched = false;
    const f = $("#post-form");
    f.reset();
    f.elements.author_name.value = "Equipe SELIBI";
    syncPreview();
    $("#form-title").textContent = "Novo texto";
    $("#save-btn").textContent = "Publicar texto";
    $("#cancel-edit").hidden = true;
  }
  $("#cancel-edit").addEventListener("click", resetForm);

  const pf = $("#post-form");
  pf.elements.title.addEventListener("input", () => {
    if (!slugTouched) pf.elements.slug.value = slugify(pf.elements.title.value);
  });
  pf.elements.slug.addEventListener("input", () => { slugTouched = true; });

  pf.addEventListener("submit", async (e) => {
    e.preventDefault();
    const el = pf.elements;
    const payload = {
      title: el.title.value.trim(),
      slug: slugify(el.slug.value || el.title.value),
      category: el.category.value.trim() || "Vida e obra",
      excerpt: el.excerpt.value.trim() || null,
      content: el.content.value.trim(),
      author_name: el.author_name.value.trim() || "Equipe SELIBI",
      cover_url: el.cover_url.value.trim() || null,
      image_credit: el.image_credit.value.trim() || null,
      tone: el.tone.value,
      published: el.published.checked,
      published_at: el.published_at.value ? new Date(el.published_at.value + "T12:00:00").toISOString() : new Date().toISOString()
    };
    if (!payload.title || !payload.content) return toast("Título e texto são obrigatórios.", "error");

    const save = (body) => editingId
      ? sb.from("posts").update(body).eq("id", editingId)
      : sb.from("posts").insert(body);
    let { error } = await save(payload);
    // Sem a coluna image_credit (PARTE 2 do schema.sql não rodou): salva o texto sem o crédito da imagem
    let semCredito = false;
    if (error && /image_credit/.test(error.message)) {
      const { image_credit, ...semImageCredit } = payload;
      semCredito = true;
      ({ error } = await save(semImageCredit));
    }
    if (error) {
      return toast(error.code === "23505" ? "Já existe um texto com esse endereço (slug). Mude o slug." : error.message, "error");
    }
    toast(semCredito
      ? "Texto salvo, mas o crédito da imagem não foi guardado: rode de novo o schema.sql no Supabase."
      : editingId ? "Alterações salvas." : (payload.published ? "Texto publicado." : "Rascunho salvo."));
    resetForm();
    loadPosts();
  });

  /* ---------- Moderação ---------- */
  async function loadPending() {
    const { data, error } = await sb.from("comments")
      .select("id,name,class_group,body,created_at,post_id,posts(title)")
      .eq("approved", false)
      .order("created_at", { ascending: true });
    const list = $("#pending-list");
    if (error) { list.innerHTML = `<li class="empty">Erro: ${esc(error.message)}</li>`; return; }
    $("#pending-count").textContent = data.length;
    if (!data.length) { list.innerHTML = `<li class="empty">Nada esperando aprovação.</li>`; return; }
    list.innerHTML = data.map((c) => `
      <li class="admin-row admin-row-comment">
        <div>
          <strong>${esc(c.name)}</strong> <span class="muted">${esc(c.class_group || "")}</span>
          <p>${esc(c.body)}</p>
          <span class="muted">${c.post_id ? `No texto: ${esc(c.posts?.title || "")}` : "Mural de recados"}, ${formatDate(c.created_at)}</span>
        </div>
        <div class="row-actions">
          <button class="btn btn-ink btn-sm" data-approve="${c.id}">Aprovar</button>
          <button class="btn btn-danger btn-sm" data-reject="${c.id}">Excluir</button>
        </div>
      </li>`).join("");
  }

  $("#pending-list").addEventListener("click", async (e) => {
    const ok = e.target.closest("[data-approve]");
    const no = e.target.closest("[data-reject]");
    if (ok) {
      const { error } = await sb.from("comments").update({ approved: true }).eq("id", ok.dataset.approve);
      if (error) return toast(error.message, "error");
      toast("Aprovado.");
    }
    if (no) {
      const { error } = await sb.from("comments").delete().eq("id", no.dataset.reject);
      if (error) return toast(error.message, "error");
      toast("Excluído.");
    }
    if (ok || no) loadPending();
  });

  /* ---------- Upload de imagens (Supabase Storage) ---------- */
  async function uploadImage(file, folder) {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) { toast("A imagem passa de 5 MB. Diminua o tamanho e tente de novo.", "error"); return null; }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${folder}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, "")) || "imagem"}.${ext}`;
    toast("Enviando imagem…");
    const { error } = await sb.storage.from("imagens").upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (error) { toast("Falha no envio: " + error.message, "error"); return null; }
    return sb.storage.from("imagens").getPublicUrl(path).data.publicUrl;
  }

  // Capa do post
  function syncPreview() {
    const url = pf.elements.cover_url.value.trim();
    const img = $("#p-preview");
    img.hidden = !url; $("#p-clear").hidden = !url;
    if (url) img.src = url; else img.removeAttribute("src");
  }
  pf.elements.cover_url.addEventListener("input", syncPreview);
  $("#p-clear").addEventListener("click", () => { pf.elements.cover_url.value = ""; syncPreview(); });
  $("#p-file").addEventListener("change", async (e) => {
    const url = await uploadImage(e.target.files[0], "posts");
    e.target.value = "";
    if (url) { pf.elements.cover_url.value = url; syncPreview(); toast("Imagem enviada. Salve o texto para aplicar."); }
  });

  // Fotos da Thalita
  const SLOT_LABEL = { hero: "Foto do topo", sobre: "Foto da seção Quem é" };
  async function loadPhotos() {
    const { data, error } = await sb.from("site_photos").select("*").order("slot");
    const box = $("#photo-slots");
    if (error) { box.innerHTML = `<p class="empty">Erro: ${esc(error.message)}. Rode de novo o schema.sql.</p>`; return; }
    box.innerHTML = data.map((p) => `
      <div class="photo-slot" data-slot="${p.slot}">
        <div class="photo-thumb">${p.url ? `<img src="${esc(p.url)}" alt="">` : "<span>Sem foto</span>"}</div>
        <div class="stack" style="gap:10px">
          <strong>${SLOT_LABEL[p.slot] || p.slot}</strong>
          <div class="field"><label>Crédito</label><input data-credit value="${esc(p.credit || "")}" placeholder="Foto: nome / Divulgação" maxlength="120"></div>
          <div class="form-actions">
            <label class="btn btn-ink btn-sm upload-btn">${p.url ? "Trocar foto" : "Enviar foto"}<input type="file" accept="image/jpeg,image/png,image/webp" hidden data-upload></label>
            <button class="btn btn-ghost btn-sm" type="button" data-save-credit>Salvar crédito</button>
            ${p.url ? '<button class="btn btn-danger btn-sm" type="button" data-remove>Remover</button>' : ""}
          </div>
        </div>
      </div>`).join("");
  }
  $("#photo-slots").addEventListener("change", async (e) => {
    if (!e.target.matches("[data-upload]")) return;
    const slot = e.target.closest("[data-slot]").dataset.slot;
    const url = await uploadImage(e.target.files[0], "thalita");
    if (!url) return;
    const credit = e.target.closest("[data-slot]").querySelector("[data-credit]").value.trim() || null;
    const { error } = await sb.from("site_photos").upsert({ slot, url, credit, updated_at: new Date().toISOString() });
    if (error) return toast(error.message, "error");
    toast("Foto atualizada no site.");
    loadPhotos();
  });
  $("#photo-slots").addEventListener("click", async (e) => {
    const card = e.target.closest("[data-slot]");
    if (!card) return;
    const slot = card.dataset.slot;
    if (e.target.closest("[data-save-credit]")) {
      const credit = card.querySelector("[data-credit]").value.trim() || null;
      const { error } = await sb.from("site_photos").update({ credit }).eq("slot", slot);
      if (error) return toast(error.message, "error");
      toast("Crédito salvo.");
    }
    if (e.target.closest("[data-remove]")) {
      const { error } = await sb.from("site_photos").update({ url: null }).eq("slot", slot);
      if (error) return toast(error.message, "error");
      toast("Foto removida do site.");
      loadPhotos();
    }
  });

  // Capas da estante
  async function loadBooks() {
    const { data, error } = await sb.from("books").select("id,slug,title,tone,image_url,image_credit").order("sort_order");
    const list = $("#book-list");
    if (error) { list.innerHTML = `<li class="empty">Erro: ${esc(error.message)}. Rode de novo o schema.sql.</li>`; return; }
    list.innerHTML = data.map((b, i) => `
      <li class="admin-row book-row" data-book="${b.id}">
        <div class="book-thumb">${window.CILIB.bookVisual(b, i)}</div>
        <div class="book-row-main">
          <strong>${esc(b.title)}</strong>
          <input data-credit value="${esc(b.image_credit || "")}" placeholder="Crédito da capa (ex.: Divulgação / Editora)" maxlength="120">
          <div class="row-actions">
            <label class="btn btn-ink btn-sm upload-btn">${b.image_url ? "Trocar capa" : "Enviar capa"}<input type="file" accept="image/jpeg,image/png,image/webp" hidden data-upload></label>
            <button class="btn btn-ghost btn-sm" type="button" data-save-credit>Salvar crédito</button>
            ${b.image_url ? '<button class="btn btn-danger btn-sm" type="button" data-remove>Remover</button>' : ""}
          </div>
        </div>
      </li>`).join("");
  }
  $("#book-list").addEventListener("change", async (e) => {
    if (!e.target.matches("[data-upload]")) return;
    const row = e.target.closest("[data-book]");
    const url = await uploadImage(e.target.files[0], "livros");
    if (!url) return;
    const image_credit = row.querySelector("[data-credit]").value.trim() || null;
    const { error } = await sb.from("books").update({ image_url: url, image_credit }).eq("id", row.dataset.book);
    if (error) return toast(error.message, "error");
    toast("Capa atualizada.");
    loadBooks();
  });
  $("#book-list").addEventListener("click", async (e) => {
    const row = e.target.closest("[data-book]");
    if (!row) return;
    if (e.target.closest("[data-save-credit]")) {
      const { error } = await sb.from("books").update({ image_credit: row.querySelector("[data-credit]").value.trim() || null }).eq("id", row.dataset.book);
      if (error) return toast(error.message, "error");
      toast("Crédito salvo.");
    }
    if (e.target.closest("[data-remove]")) {
      const { error } = await sb.from("books").update({ image_url: null }).eq("id", row.dataset.book);
      if (error) return toast(error.message, "error");
      toast("Capa removida. A ilustração volta a aparecer.");
      loadBooks();
    }
  });

  document.addEventListener("DOMContentLoaded", boot);
})();
