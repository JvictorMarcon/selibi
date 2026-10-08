# Blog do CILIB 2026 · Thalita Rebouças

Site estático (HTML, CSS e JS puros) com Supabase como back-end e deploy na Vercel. Não precisa de build nem de `npm install`.

## Estrutura

```
index.html        Página inicial: apresentação, estante, blog, linha do tempo, mural
post.html         Página de cada texto (post.html?slug=...) com comentários
admin.html        Área da equipe: escrever/editar textos e aprovar comentários
assets/css/       Estilos
assets/js/        config.js (Supabase), core.js, anim.js (GSAP), data.js (linha do tempo e livros reserva), home.js, post.js, admin.js
supabase/schema.sql  Tabelas, segurança (RLS), pasta de imagens, livros e 3 textos iniciais
vercel.json       Cabeçalhos de segurança e cache
```

## 1. Configurar o Supabase

1. Abra o projeto no painel do Supabase, vá em **SQL Editor > New query**, cole todo o `supabase/schema.sql` e clique em **Run**.
2. Em **Authentication > Users > Add user**, crie o usuário da equipe (e-mail e senha) e marque "Auto confirm".
3. Rode no SQL Editor, trocando pelo e-mail que você acabou de cadastrar:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'EMAIL-DA-EQUIPE@exemplo.com'
   on conflict do nothing;
   ```
   Para conferir quem já é da equipe: `select u.email from public.admins a join auth.users u on u.id = a.user_id;`
4. Recomendado: em **Authentication > Sign In / Providers**, desative "Allow new users to sign up", para ninguém criar conta pelo site.

A chave `sb_publishable_...` em `assets/js/config.js` pode ficar no código: a segurança vem das políticas RLS. Visitantes só leem textos publicados e comentários aprovados, e todo comentário novo entra como "não aprovado".

## 2. Testar no computador

Abra um terminal na pasta e rode um servidor simples:

```
npx serve .
```

Depois acesse o endereço mostrado (geralmente http://localhost:3000).

## 3. Publicar na Vercel

Opção A, pelo site: suba a pasta para um repositório no GitHub, entre em vercel.com > **Add New > Project**, importe o repositório e clique em **Deploy** (Framework Preset: "Other", sem comando de build).

Opção B, pelo terminal:

```
npx vercel        # primeira vez, responde às perguntas
npx vercel --prod # publica
```

Depois do deploy, adicione o domínio da Vercel em **Supabase > Authentication > URL Configuration > Site URL**.

## Como escrever textos

Entre em `/admin.html` com o usuário da equipe. No campo de texto, deixe uma linha em branco entre parágrafos. Atalhos: `## ` subtítulo, `> ` citação, `- ` lista, `**negrito**`, `*itálico*`, `[texto](https://link)`.

## Fotos da Thalita e capas dos livros

O site já vem com imagens padrão, guardadas no projeto:

- `assets/capas/<slug>.jpg`: as 17 capas da estante (divulgação das editoras: Rocco, Arqueiro, Gutenberg e HarperCollins). O `slug` é o mesmo da tabela `books` (por exemplo `fala-serio-mae.jpg`). Os créditos ficam em `assets/js/data.js`.
- `assets/thalita/hero.jpg` e `assets/thalita/sobre.jpg`: fotos da Thalita com licença livre (Creative Commons BY 3.0) do Wikimedia Commons. `hero.jpg` é de Eduardo Cilto ([página da foto](https://commons.wikimedia.org/wiki/File:Thalita_Rebou%C3%A7as_2017.jpg)). `sobre.jpg` é da TV Brasil, programa ABZ do Ziraldo ([página da foto](https://commons.wikimedia.org/wiki/File:Abz_thalitareboucas.jpg)). A licença exige o crédito, que aparece na legenda da foto: não tire.

Tudo pode ser trocado pelo painel (`/admin.html`). Uma imagem enviada pelo painel sempre vale mais do que a padrão:

- **Fotos da Thalita**: duas fotos (topo do site e seção "Quem é"). A foto da seção "Quem é" também aparece como imagem padrão do texto em destaque.
- **Capas da estante**: cada livro tem o botão "Enviar capa".
- **Imagem do texto**: no formulário de cada texto, botão "Enviar imagem".

As imagens do painel ficam no Storage do Supabase, na pasta pública `imagens` (JPG, PNG ou WebP, até 5 MB). Sempre preencha o crédito. Use só fotos que a escola tem direito de usar: fotos de licença livre com crédito, kit de imprensa com autorização, fotos tiradas pela própria escola ou imagens cedidas pela assessoria da autora. As capas pertencem às editoras: se a escola exigir autorização, apague a pasta `assets/capas` e use as ilustrações coloridas.

## Animações

Feitas com GSAP 3 e ScrollTrigger, carregados do cdnjs. Quem ativou "reduzir movimento" no sistema vê o site sem animação. Se o GSAP não carregar, o conteúdo aparece normalmente.

## Senha do painel

Não existe senha padrão. É o e-mail e a senha do usuário que você cria em Authentication > Users (passo 2 acima).

## Editar a linha do tempo

Ficam em `assets/js/data.js`, junto com a lista de livros reserva e os créditos das capas e das fotos. Quando um livro não tem imagem, aparece uma ilustração colorida desenhada em CSS. Para fotos da autora num texto, use apenas imagens que a escola tenha autorização para usar e cole a URL no campo "Imagem de capa" do post.
