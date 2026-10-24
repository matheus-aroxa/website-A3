# A3 Soluções Imobiliárias — site

Site em **Next.js 16 (App Router)** implementado a partir dos protótipos em `propotype/`
(desktop e mobile). O catálogo fica no **PostgreSQL**; não há integração com nenhum CRM.

## Rodando

Requer Node.js 20.9+ (recomendado: 24 LTS).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # produção
npm run lint
```

Copie `.env.example` para `.env.local` e ajuste `NEXT_PUBLIC_SITE_URL` para o domínio real
**antes de publicar** — ele alimenta canonical, Open Graph, sitemap e JSON-LD.

## Páginas

| Rota | Conteúdo | Renderização |
| --- | --- | --- |
| `/` | Home | Estática (regenera a cada 1h ou via webhook) |
| `/imoveis/[categoria]/[tipo]/[cidade]/[bairro]` | Busca. Todos os segmentos são opcionais: `/imoveis`, `/imoveis/venda`, `/imoveis/lancamentos/paulista/jaguaribe`, `/imoveis/apartamentos/recife`… | Shell estático + resultados por streaming (PPR) |
| `/imovel/[slug]` | Detalhe do imóvel/empreendimento | Estática |
| `/politica-de-privacidade` | Texto-base LGPD (**revisar com o jurídico**) | Estática |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | SEO técnico | Gerados |
| `/api/imoveis` | JSON do "Carregar mais" (celular) | Dinâmica |
| `/api/revalidar` | Webhook (protegido por `REVALIDATE_SECRET`) para invalidar o cache | Dinâmica |
| `/admin` | Painel administrativo (login, imóveis, vitrine da home) | Dinâmica, `noindex` |

Filtros que não viram página (quartos, vagas, área, ordem, página…) vão na query string
(`?quartos=2&ordem=menor-preco`) e apontam o `canonical` para a página limpa.

## SEO — o que já está feito

- **Uma página indexável por intenção de busca**: categoria × tipo × cidade × bairro
  (ex.: "apartamentos à venda no Janga"), com `<title>`, description e H1 próprios.
  Só combinações com imóveis entram no sitemap; buscas vazias recebem `noindex`.
- **404 real** para URLs inexistentes (`src/proxy.ts`), em vez de "soft 404".
- **Dados estruturados (JSON-LD)**: `RealEstateAgent` + `WebSite` (todas as páginas),
  `BreadcrumbList`, `ItemList` (busca) e `RealEstateListing` com `Offer` (imóvel).
- **Sitemap com imagens**, `lastModified` vindo do banco, `robots.txt`, canonical em tudo.
- Open Graph/Twitter com a foto do imóvel; imagem padrão gerada para as demais páginas.
- HTML semântico, `lang="pt-BR"`, trilha de navegação, links internos para cidades/bairros
  e "buscas frequentes" no rodapé, nome/endereço/telefone (SEO local) no rodapé.
- Imagens com nomes descritivos e `alt`.

## Performance

- Home e páginas de imóvel são **100% estáticas** (`ensureStatic = 'navigation'`).
- Busca: shell estático entregue na hora + resultados por streaming; cada troca de filtro
  atualiza a URL e o servidor responde só o trecho que mudou (UI otimista, sem recarregar).
- `next/image` com AVIF/WebP e `sizes` por layout; a foto principal carrega com prioridade
  alta, o resto sob demanda. Desktop e celular usam **o mesmo HTML** (só CSS muda), então
  nada é baixado em dobro.
- Fonte Archivo auto-hospedada (`next/font`), só o subconjunto latino, com o eixo de largura.
- Mapas são prévias estáticas com link para o Google Maps (o iframe do Google custaria
  ~500 KB de JS por visita).
- JavaScript no navegador só onde há interação: menu, filtros, galeria, plantas, formulários.

## Dados e cache

O site **não se integra a nenhum CRM**: o catálogo vive só no banco de dados (PostgreSQL/Supabase). Os imóveis foram
importados uma vez de um export do painel Supremo (veja `docs/migracao-banco.md`) e, daí em diante, são mantidos
pelo painel `/admin`. Todas as leituras passam por `src/lib/imoveis/consultas.ts` (SQL), envolvidas com `"use cache"`
em `src/lib/imoveis/repositorio.ts`.

- Cada gravação feita pelo painel invalida o cache, e o site se atualiza na hora.
- `POST /api/revalidar` com `Authorization: Bearer <REVALIDATE_SECRET>` invalida o cache à mão (por exemplo, depois
  de mexer direto no banco).
- Sem isso, o cache do catálogo expira sozinho a cada hora.
- Fotos de fora do site precisam ter o host liberado em `src/lib/imoveis/hosts-fotos.ts` (usado por `next.config.ts`).

Os formulários (contato, agendar visita, falar com corretor) usam Server Actions (`src/app/acoes.ts`): validam no
servidor, têm campo-armadilha anti-robô e funcionam até sem JavaScript. Os formulários de contato e de falar com
corretor abrem o WhatsApp da A3 com a mensagem pronta. **Ainda não há onde guardar os contatos:** hoje cada envio só é
registrado no log do servidor (`src/lib/crm/`, um simulador que será trocado por uma tabela no banco).

## Painel administrativo (`/admin`)

Permite à equipe editar imóveis, desativá-los (somem do site, continuam no painel), excluí-los
(com opção de restaurar) e escolher o imóvel do topo da home e os destaques.

**Primeiro acesso:** não existe administrador padrão. Aplique `db/administradores.sql` e cadastre cada
administrador com o `INSERT` documentado no começo desse arquivo (veja também `docs/login-admin.md`).

**Catálogo no banco (PostgreSQL/Supabase, `DATABASE_URL`):**

- **Login**: os admins ficam na tabela `administradores` (senha em bcrypt, conferida no banco). A sessão é um
  token aleatório num cookie `httpOnly`; a tabela `sessoes_admin` guarda só o hash dele. Vale por 8 h e é
  encerrada ao fechar o navegador; com "Manter conectado", 30 dias. Desativar o administrador ou apagar a linha da
  sessão derruba o acesso na hora. O limite de tentativas (8 por IP, 20 por e-mail, a cada 15 min) fica na tabela
  `tentativas_login`. Detalhes em `docs/login-admin.md`.
- **Alterações**: gravadas direto nas tabelas do catálogo (`db/schema.sql`), com registro em `auditoria`.
  O imóvel guarda em `original` a versão importada do catálogo, para o painel marcar o que foi editado e descartar edições.
  Cada gravação invalida o cache e o site se atualiza na hora.
- **Fotos enviadas pelo painel**: ficam em `ADMIN_DADOS_DIR/fotos/` (JPG, PNG ou WebP, até 15 MB, formato
  conferido pelo conteúdo do arquivo) e são servidas pelo próprio site em `/fotos/<id>`. O envio usa a rota
  `POST /admin/enviar-foto`, que exige a sessão do painel.

> As fotos enviadas ficam em disco, então a pasta de dados precisa ser **gravável e persistente** (VPS,
> container com volume etc.). Em hospedagem serverless com disco efêmero (ex.: Vercel) elas se perderiam — aí seria
> preciso trocar `src/lib/admin/fotos.ts` por um armazenamento externo (S3, Supabase Storage), mantendo a mesma interface.

## Pendências antes de ir ao ar

- Domínio real em `NEXT_PUBLIC_SITE_URL` e verificação no Google Search Console
  (`GOOGLE_SITE_VERIFICATION`); enviar o sitemap pelo Search Console.
- Revisar a política de privacidade com o jurídico.
- Endereço completo e coordenadas dos empreendimentos (o protótipo tinha placeholders) e
  nome da construtora — os campos já existem no modelo (`local.logradouro`, `local.geo`, `construtora`).
- Limite de envios por IP nos formulários (ex.: no provedor de hospedagem ou com Upstash)
  quando houver tráfego real.
- Analytics (ex.: Vercel Analytics ou GA4) e medição de Core Web Vitals em produção.

## Estrutura

```
src/
  app/                    rotas, metadados, sitemap, robots, Server Actions
  components/
    busca/                filtros, barra de busca, resultados, paginação
    imovel/               galeria, plantas, lazer, abas de contato
    imoveis/CardImovel    card usado em home, busca e semelhantes
    layout/               cabeçalho, menu mobile, rodapé, botão do WhatsApp
    formularios/          formulário da home e partes compartilhadas
    ui/, seo/             ícones, migalhas, mapa, JSON-LD
  lib/
    crm/                  registro provisório dos contatos dos formulários (a trocar por uma tabela no banco)
    imoveis/              tipos, filtros ⇄ URL, busca, textos de SEO, cache
    site.ts               dados da imobiliária (telefone, endereço, CRECI…)
  proxy.ts                404 para URLs de busca inexistentes
propotype/                protótipos originais (referência de design)
```
