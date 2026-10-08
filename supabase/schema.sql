-- =========================================================
-- Blog CILIB 2026 · Thalita Rebouças
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- Tabelas ----------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title         text not null check (char_length(title) between 3 and 140),
  excerpt       text check (char_length(excerpt) <= 280),
  content       text not null,
  category      text not null default 'Vida e obra',
  tone          text not null default 'pink' check (tone in ('pink','sun','sky','mint','lilac')),
  author_name   text not null default 'Equipe CILIB',
  cover_url     text,
  published     boolean not null default true,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Comentários dos posts e recados do mural (post_id nulo = mural)
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid references public.posts(id) on delete cascade,
  name         text not null check (char_length(name) between 2 and 60),
  class_group  text check (char_length(class_group) <= 60),
  body         text not null check (char_length(body) between 3 and 600),
  approved     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (published, published_at desc);
create index if not exists comments_post_idx on public.comments (post_id, approved, created_at);

-- ---------- Funções ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
for each row execute function public.touch_updated_at();

-- ---------- Segurança (RLS) ----------
alter table public.posts    enable row level security;
alter table public.comments enable row level security;
alter table public.admins   enable row level security;

-- posts: todos leem os publicados; só admin escreve
drop policy if exists "posts_read"  on public.posts;
drop policy if exists "posts_admin" on public.posts;
create policy "posts_read"  on public.posts for select to anon, authenticated
  using (published or public.is_admin());
create policy "posts_admin" on public.posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- comments: todos leem aprovados; qualquer um envia (sempre como não aprovado); só admin modera
drop policy if exists "comments_read"   on public.comments;
drop policy if exists "comments_insert" on public.comments;
drop policy if exists "comments_update" on public.comments;
drop policy if exists "comments_delete" on public.comments;
create policy "comments_read"   on public.comments for select to anon, authenticated
  using (approved or public.is_admin());
create policy "comments_insert" on public.comments for insert to anon, authenticated
  with check (approved = false);
create policy "comments_update" on public.comments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "comments_delete" on public.comments for delete to authenticated
  using (public.is_admin());

-- admins: cada pessoa só consegue ver a própria linha
drop policy if exists "admins_self" on public.admins;
create policy "admins_self" on public.admins for select to authenticated
  using (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant select, insert on public.comments to anon, authenticated;
grant update, delete on public.comments to authenticated;
grant select on public.admins to authenticated;

-- ---------- Textos iniciais (edite ou apague pelo painel) ----------
insert into public.posts (slug, title, excerpt, category, tone, published_at, content) values
(
  'quem-e-thalita-reboucas',
  'Quem é Thalita Rebouças, a homenageada do CILIB',
  'Da menina que se chamava de “fazedora de livros” à autora que vendeu milhões de exemplares.',
  'Vida e obra', 'pink', now() - interval '3 days',
$$Thalita Rebouças nasceu no Rio de Janeiro, em 10 de novembro de 1974. Muito antes de qualquer best-seller, aos dez anos, ela já juntava folhas, grampeava, desenhava as ilustrações e se apresentava como “fazedora de livros”. A vontade de escrever, segundo ela mesma conta, nasceu depois de ler *Marcelo, marmelo, martelo*, de Ruth Rocha.

## Do Direito ao Jornalismo

O caminho não foi reto. Thalita começou a faculdade de Direito, cursou dois anos e percebeu que aquilo não era para ela. Mudou para Jornalismo e trabalhou na área antes de publicar o primeiro livro, *Traição entre amigas*, em 2000, quando tinha 25 anos.

## A virada

Em 2003 veio *Tudo por um popstar*, que virou best-seller. A partir daí ela não parou mais: criou a série *Fala sério*, com a Malu e a mãe dela, Ângela Cristina, e depois a série *Confissões*, com narradores que normalmente ficam de fora das histórias.

## Além dos livros

Entre 2009 e 2014, Thalita foi repórter do programa Vídeo Show. Várias das suas histórias foram adaptadas para o teatro, o cinema e o streaming, e ela costuma aparecer em pequenas participações nos filmes. Em 2020, ao completar 20 anos de carreira, assinou contrato com a Netflix.

Hoje, leitores que cresceram com os livros dela levam os próprios filhos para as filas de autógrafo. É por isso, e por tudo que você vai ler neste blog, que ela é a homenageada do CILIB.$$
),
(
  'por-onde-comecar-a-ler-thalita',
  'Por onde começar a ler Thalita Rebouças',
  'Um roteiro simples para quem nunca leu e quer entrar no universo da autora.',
  'Opinião', 'sun', now() - interval '2 days',
$$Com mais de vinte livros publicados, a pergunta mais comum na nossa turma foi: por qual eu começo? Aqui vai a nossa sugestão. Ela não é regra, é só a opinião de quem já leu bastante.

## Se você quer rir

Comece por *Fala sério, mãe!*. A relação entre Malu e a mãe é cheia de briga, vergonha e carinho, e é muito fácil se reconhecer em alguma cena. Se gostar, a série continua com professores, amigas, namorados e pai.

## Se você gosta de romance

*Tudo por um popstar* é leve, rápido e foi o livro que tornou a autora conhecida. Ótimo para ler num fim de semana.

## Se você quer algo mais profundo

A série *Confissões* fala de exclusão, aparência e preconceito sem perder o humor. *Confissões de uma garota excluída, mal-amada e (um pouco) dramática* é um bom ponto de partida.

> Nossa dica: leia um livro de cada fase e compare. Dá para ver como a escrita dela foi mudando com os leitores.

Já leu algum? Conta nos comentários qual foi o seu primeiro.$$
),
(
  'das-paginas-para-a-tela',
  'Das páginas para a tela: os livros que viraram filme',
  'Por que as histórias da Thalita funcionam tão bem no cinema e no streaming.',
  'Resenha', 'sky', now() - interval '1 day',
$$Poucos autores brasileiros de livros juvenis tiveram tantas obras adaptadas quanto Thalita Rebouças. Entre as histórias que foram para as telas estão *Fala sério, mãe!*, *Tudo por um popstar*, *Ela disse, ele disse* e *Confissões de uma garota excluída, mal-amada e (um pouco) dramática*, que ganhou versão na Netflix.

## Por que funciona?

Na nossa opinião, são três motivos:

- Os diálogos já parecem roteiro: rápidos, engraçados e cheios de gírias.
- Os conflitos são do dia a dia (família, escola, amizade), então qualquer pessoa se identifica.
- As personagens têm defeitos e exageram, o que rende ótimas cenas.

## Livro ou filme?

Aqui a turma se dividiu. Quem viu o filme primeiro achou o livro mais detalhado. Quem leu primeiro sentiu falta de algumas cenas. O que todo mundo concordou: vale a pena conhecer as duas versões.

E você, prefere o livro ou o filme? Deixa sua opinião nos comentários.$$
)
on conflict (slug) do nothing;

-- =========================================================
-- PARTE 2 · Imagens (fotos da Thalita e capas dos livros)
-- Pode rodar o arquivo inteiro de novo: tudo aqui é seguro para repetir.
-- =========================================================

alter table public.posts add column if not exists image_credit text;

-- Estante de livros (cada livro pode ter sua capa)
create table if not exists public.books (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  year          int,
  series        text,
  tags          text[] not null default '{}',
  note          text,
  tone          text not null default 'pink' check (tone in ('pink','sun','sky','mint','lilac')),
  image_url     text,
  image_credit  text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- Fotos fixas do site (topo e seção "Quem é")
create table if not exists public.site_photos (
  slot        text primary key check (slot in ('hero','sobre')),
  url         text,
  credit      text,
  alt         text,
  updated_at  timestamptz not null default now()
);

alter table public.books       enable row level security;
alter table public.site_photos enable row level security;

drop policy if exists "books_read"  on public.books;
drop policy if exists "books_admin" on public.books;
create policy "books_read"  on public.books for select to anon, authenticated using (true);
create policy "books_admin" on public.books for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "photos_read"  on public.site_photos;
drop policy if exists "photos_admin" on public.site_photos;
create policy "photos_read"  on public.site_photos for select to anon, authenticated using (true);
create policy "photos_admin" on public.site_photos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.books, public.site_photos to anon, authenticated;
grant insert, update, delete on public.books, public.site_photos to authenticated;

-- Pasta de imagens no Storage (pública para leitura, só admin envia)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

drop policy if exists "imagens_admin_insert" on storage.objects;
drop policy if exists "imagens_admin_update" on storage.objects;
drop policy if exists "imagens_admin_delete" on storage.objects;
create policy "imagens_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'imagens' and public.is_admin());
create policy "imagens_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'imagens' and public.is_admin());
create policy "imagens_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'imagens' and public.is_admin());

insert into public.site_photos (slot, alt) values
  ('hero',  'Foto de Thalita Rebouças'),
  ('sobre', 'Foto de Thalita Rebouças')
on conflict (slot) do nothing;

insert into public.books (slug, title, year, series, tags, tone, sort_order, note) values
('traicao-entre-amigas', 'Traição entre amigas', 2000, 'Livro de estreia', '{outros}', 'lilac', 1, 'Lançado quando ela tinha 25 anos. Foi aqui que tudo começou.'),
('tudo-por-um-popstar', 'Tudo por um popstar', 2003, 'Avulso', '{outros,tela}', 'sun', 2, 'O primeiro best-seller. Ganhou versão para o cinema.'),
('fala-serio-mae', 'Fala sério, mãe!', 2004, 'Fala sério', '{fala-serio,tela}', 'pink', 3, 'Malu e a mãe, Ângela Cristina, numa convivência cheia de briga e carinho. Virou filme.'),
('fala-serio-professor', 'Fala sério, professor!', null, 'Fala sério', '{fala-serio}', 'sky', 4, 'Malu relembra os professores que marcaram a vida dela, do colégio ao curso de teatro.'),
('fala-serio-amor', 'Fala sério, amor!', null, 'Fala sério', '{fala-serio}', 'pink', 5, 'Primeiro beijo, ciúme, términos: os romances de Malu.'),
('fala-serio-amiga', 'Fala sério, amiga!', null, 'Fala sério', '{fala-serio}', 'mint', 6, 'As amizades que acompanham Malu ao longo da vida.'),
('fala-serio-pai', 'Fala sério, pai!', null, 'Fala sério', '{fala-serio}', 'sun', 7, 'Agora é a vez da relação de Malu com o pai.'),
('uma-fada-veio-me-visitar', 'Uma fada veio me visitar', null, 'Avulso', '{outros,tela}', 'mint', 8, 'Uma fada atrapalhada entra na vida de uma adolescente. Inspirou o filme É fada!'),
('ela-disse-ele-disse', 'Ela disse, ele disse', null, 'Avulso', '{outros,tela}', 'sky', 9, 'A mesma história contada por dois lados. Também foi para as telas.'),
('confissoes-garoto-timido', 'Confissões de um garoto tímido, nerd e ligeiramente apaixonado', null, 'Confissões', '{confissoes}', 'lilac', 10, 'Abre a série Confissões, com narradores que não costumam ser ouvidos.'),
('confissoes-garota-excluida', 'Confissões de uma garota excluída, mal-amada e (um pouco) dramática', null, 'Confissões', '{confissoes,tela}', 'pink', 11, 'Tete muda de bairro, de casa e de rotina. Virou filme na Netflix.'),
('confissoes-garota-popular', 'Confissões de uma garota popular, linda e (secretamente) infeliz', null, 'Confissões', '{confissoes}', 'sun', 12, 'O outro lado da popularidade.'),
('confissoes-garoto-talentoso', 'Confissões de um garoto talentoso, purpurinado e (intimamente) discriminado', 2022, 'Confissões', '{confissoes}', 'mint', 13, 'Um jovem que faz curso de maquiagem e cria um programa como drag queen. Prefácio de Lulu Santos.'),
('um-ano-inesquecivel', 'Um ano inesquecível', 2016, 'Coletânea', '{outros}', 'sky', 14, 'Escrito com Paula Pimenta, Babi Dewet e Bruna Vieira. A parte da Thalita é um amor de verão.'),
('natali', 'Natali e sua vontade idiota de agradar todo mundo', 2022, 'Avulso', '{outros}', 'lilac', 15, 'Sobre a dificuldade de dizer não.'),
('felicidade-inegociavel', 'Felicidade inegociável e outras rimas', 2024, 'Não ficção', '{outros}', 'sun', 16, 'Primeiro livro de não ficção, para mulheres de 40 e poucos anos em diante.'),
('diario-de-uma-garota-esquisita', 'Diário de uma garota esquisita', 2025, 'Avulso', '{outros}', 'pink', 17, 'Lançado em 2025, com sessão de autógrafos no Rio.')
on conflict (slug) do nothing;
