(function () {
  const cfg = window.CILIB_CONFIG;

  // Cliente Supabase (a lib UMD expõe window.supabase)
  window.sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);

  const TONES = ["pink", "sun", "sky", "mint", "lilac"];

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(iso) {
    if (!iso) return "";
    return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  }

  function inline(text) {
    let t = esc(text);
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return t;
  }

  // Markdown simples: ## título, > citação, - lista, parágrafos
  function renderContent(src) {
    const blocks = String(src || "").replace(/\r/g, "").split(/\n{2,}/);
    return blocks.map((b) => {
      const block = b.trim();
      if (!block) return "";
      if (block.startsWith("## ")) return `<h2>${inline(block.slice(3))}</h2>`;
      if (block.startsWith("### ")) return `<h3>${inline(block.slice(4))}</h3>`;
      if (block.startsWith("> ")) return `<blockquote>${inline(block.replace(/^> ?/gm, ""))}</blockquote>`;
      if (/^- /.test(block)) {
        const items = block.split("\n").map((l) => `<li>${inline(l.replace(/^- /, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${inline(block).replace(/\n/g, "<br>")}</p>`;
    }).join("");
  }

  function readingTime(src) {
    const words = String(src || "").trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  }

  function toneOf(t, i = 0) {
    return TONES.includes(t) ? t : TONES[i % TONES.length];
  }

  // Capa tipográfica original (não reproduz capas reais)
  function coverHTML(book, i = 0) {
    const len = book.title.length;
    const longest = Math.max(...book.title.split(/\s+/).map((w) => w.length));
    const steps = ["xs", "s", "m", "l"];
    let idx = len > 50 ? 0 : len > 30 ? 1 : len > 18 ? 2 : 3;
    if (longest > 9 && idx > 1) idx -= 1; // palavras longas não quebram no meio
    const size = steps[idx];
    const shape = ["circle", "blob", "star", "stripe"][i % 4];
    return `
      <div class="cover tone-${toneOf(book.tone, i)}" aria-hidden="true">
        <span class="cover-shape ${shape}"></span>
        <span class="cover-title size-${size}">${esc(book.title)}</span>
        <span class="cover-author">Thalita Rebouças</span>
      </div>`;
  }

  // Qual capa usar: a enviada pelo painel, senão a da pasta assets/capas, senão nenhuma
  function coverOf(book) {
    if (book.image_url) return { src: book.image_url, credit: book.image_credit || "" };
    const local = (window.CILIB_COVERS || {})[book.slug];
    return local ? { src: local.src, credit: local.credit } : { src: "", credit: "" };
  }

  // Capa real ou, se não houver imagem, a capa tipográfica
  function bookVisual(book, i = 0) {
    const { src } = coverOf(book);
    if (src) {
      return `<div class="cover cover-photo"><img src="${esc(src)}" alt="Capa de ${esc(book.title)}" loading="lazy"></div>`;
    }
    return coverHTML(book, i);
  }

  function slugify(s) {
    return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  }

  function toast(msg, kind = "ok") {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.dataset.kind = kind;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 4200);
  }

  // Menu mobile
  function initNav() {
    const btn = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".site-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      })
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = cfg.EVENT_YEAR));
  });

  window.CILIB = { esc, formatDate, renderContent, readingTime, toneOf, coverHTML, coverOf, bookVisual, slugify, toast, TONES };
})();
