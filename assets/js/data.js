// Reserva: usado só se a tabela "books" do Supabase não responder.
// Os livros oficiais ficam no Supabase; o slug liga cada livro à capa em assets/capas/.
window.CILIB_BOOKS = [
  { slug: "traicao-entre-amigas", title: "Traição entre amigas", year: 2000, series: "Livro de estreia", tone: "lilac", tags: ["outros"],
    note: "Lançado quando ela tinha 25 anos. Foi aqui que tudo começou." },
  { slug: "tudo-por-um-popstar", title: "Tudo por um popstar", year: 2003, series: "Avulso", tone: "sun", tags: ["outros", "tela"],
    note: "O primeiro best-seller. Ganhou versão para o cinema." },
  { slug: "fala-serio-mae", title: "Fala sério, mãe!", year: 2004, series: "Fala sério", tone: "pink", tags: ["fala-serio", "tela"],
    note: "Malu e a mãe, Ângela Cristina, numa convivência cheia de briga e carinho. Virou filme." },
  { slug: "fala-serio-professor", title: "Fala sério, professor!", series: "Fala sério", tone: "sky", tags: ["fala-serio"],
    note: "Malu relembra os professores que marcaram a vida dela, do colégio ao curso de teatro." },
  { slug: "fala-serio-amor", title: "Fala sério, amor!", series: "Fala sério", tone: "pink", tags: ["fala-serio"],
    note: "Primeiro beijo, ciúme, términos: os romances de Malu." },
  { slug: "fala-serio-amiga", title: "Fala sério, amiga!", series: "Fala sério", tone: "mint", tags: ["fala-serio"],
    note: "As amizades que acompanham Malu ao longo da vida." },
  { slug: "fala-serio-pai", title: "Fala sério, pai!", series: "Fala sério", tone: "sun", tags: ["fala-serio"],
    note: "Agora é a vez da relação de Malu com o pai." },
  { slug: "uma-fada-veio-me-visitar", title: "Uma fada veio me visitar", series: "Avulso", tone: "mint", tags: ["outros", "tela"],
    note: "Uma fada atrapalhada entra na vida de uma adolescente. Inspirou o filme É fada!" },
  { slug: "ela-disse-ele-disse", title: "Ela disse, ele disse", series: "Avulso", tone: "sky", tags: ["outros", "tela"],
    note: "A mesma história contada por dois lados. Também foi para as telas." },
  { slug: "confissoes-garoto-timido", title: "Confissões de um garoto tímido, nerd e ligeiramente apaixonado", series: "Confissões", tone: "lilac", tags: ["confissoes"],
    note: "Abre a série Confissões, com narradores que não costumam ser ouvidos." },
  { slug: "confissoes-garota-excluida", title: "Confissões de uma garota excluída, mal-amada e (um pouco) dramática", series: "Confissões", tone: "pink", tags: ["confissoes", "tela"],
    note: "Tete muda de bairro, de casa e de rotina. Virou filme na Netflix." },
  { slug: "confissoes-garota-popular", title: "Confissões de uma garota popular, linda e (secretamente) infeliz", series: "Confissões", tone: "sun", tags: ["confissoes"],
    note: "O outro lado da popularidade." },
  { slug: "confissoes-garoto-talentoso", title: "Confissões de um garoto talentoso, purpurinado e (intimamente) discriminado", year: 2022, series: "Confissões", tone: "mint", tags: ["confissoes"],
    note: "Um jovem que faz curso de maquiagem e cria um programa como drag queen. Prefácio de Lulu Santos." },
  { slug: "um-ano-inesquecivel", title: "Um ano inesquecível", year: 2016, series: "Coletânea", tone: "sky", tags: ["outros"],
    note: "Escrito com Paula Pimenta, Babi Dewet e Bruna Vieira. A parte da Thalita é um amor de verão." },
  { slug: "natali", title: "Natali e sua vontade idiota de agradar todo mundo", year: 2022, series: "Avulso", tone: "lilac", tags: ["outros"],
    note: "Sobre a dificuldade de dizer não." },
  { slug: "felicidade-inegociavel", title: "Felicidade inegociável e outras rimas", year: 2024, series: "Não ficção", tone: "sun", tags: ["outros"],
    note: "Primeiro livro de não ficção, para mulheres de 40 e poucos anos em diante." },
  { slug: "diario-de-uma-garota-esquisita", title: "Diário de uma garota esquisita", year: 2025, series: "Avulso", tone: "pink", tags: ["outros"],
    note: "Lançado em 2025, com sessão de autógrafos no Rio." }
];

// Capas padrão (divulgação das editoras), guardadas em assets/capas/<slug>.jpg.
// Uma capa enviada pelo painel (admin.html) sempre tem prioridade sobre estas.
(function () {
  const dir = "assets/capas/";
  const rocco = "Divulgação Rocco";
  const arqueiro = "Divulgação Arqueiro";
  const harper = "Divulgação HarperCollins";
  const por = {
    "traicao-entre-amigas": rocco, "tudo-por-um-popstar": rocco, "fala-serio-mae": rocco,
    "fala-serio-professor": rocco, "fala-serio-amor": rocco, "fala-serio-amiga": rocco,
    "fala-serio-pai": rocco, "uma-fada-veio-me-visitar": rocco, "ela-disse-ele-disse": rocco,
    "confissoes-garoto-timido": arqueiro, "confissoes-garota-excluida": arqueiro,
    "confissoes-garota-popular": arqueiro, "confissoes-garoto-talentoso": arqueiro,
    "um-ano-inesquecivel": "Divulgação Gutenberg", "natali": rocco,
    "felicidade-inegociavel": harper, "diario-de-uma-garota-esquisita": harper
  };
  window.CILIB_COVERS = {};
  Object.keys(por).forEach((slug) => {
    window.CILIB_COVERS[slug] = { src: dir + slug + ".jpg", credit: por[slug] };
  });
})();

// Fotos padrão da Thalita, com licença livre (Creative Commons BY, do Wikimedia Commons).
// Uma foto enviada pelo painel (admin.html) sempre tem prioridade sobre estas.
window.CILIB_PHOTOS = {
  hero: {
    url: "assets/thalita/hero.jpg",
    credit: "Eduardo Cilto (CC BY 3.0)",
    alt: "Thalita Rebouças sorrindo, em 2017"
  },
  sobre: {
    url: "assets/thalita/sobre.jpg",
    credit: "TV Brasil (CC BY 3.0 BR)",
    alt: "Thalita Rebouças com o escritor Ziraldo, no programa ABZ do Ziraldo, da TV Brasil"
  }
};

window.CILIB_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "fala-serio", label: "Série Fala sério" },
  { id: "confissoes", label: "Série Confissões" },
  { id: "outros", label: "Outros livros" },
  { id: "tela", label: "Viraram filme" }
];

window.CILIB_TIMELINE = [
  { year: "1974", text: "Nasce no Rio de Janeiro, em 10 de novembro." },
  { year: "Aos 10", text: "Grampeia folhas, ilustra e se apresenta como “fazedora de livros”." },
  { year: "Faculdade", text: "Cursa dois anos de Direito, desiste e vai para o Jornalismo." },
  { year: "2000", text: "Publica Traição entre amigas, o primeiro livro." },
  { year: "2003", text: "Tudo por um popstar vira best-seller e muda a carreira dela." },
  { year: "2009–2014", text: "Trabalha como repórter do Vídeo Show, na TV Globo." },
  { year: "2016", text: "Lança Um ano inesquecível com outras três autoras jovens." },
  { year: "2020", text: "Completa 20 anos de carreira e assina com a Netflix para adaptar suas histórias." },
  { year: "2022", text: "Lança novos títulos e anuncia a reedição revisada da série Fala sério." },
  { year: "2024", text: "Estreia na não ficção com Felicidade inegociável e outras rimas." },
  { year: "2026", text: "É a homenageada do CILIB." }
];
