# A3 Soluções Imobiliárias — site

Site em **Next.js 16 (App Router)** implementado a partir dos protótipos em `propotype/`
(desktop e mobile). Os dados ainda são **mocks**, isolados atrás de um adaptador de CRM.

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
| `/api/revalidar` | Webhook do CRM para atualizar o cache | Dinâmica |

Filtros que não viram página (quartos, vagas, área, ordem, página…) vão na query string
(`?quartos=2&ordem=menor-preco`) e apontam o `canonical` para a página limpa.

## SEO — o que já está feito

- **Uma página indexável por intenção de busca**: categoria × tipo × cidade × bairro
  (ex.: "apartamentos à venda no Janga"), com `<title>`, description e H1 próprios.
  Só combinações com imóveis entram no sitemap; buscas vazias recebem `noindex`.
- **404 real** para URLs inexistentes (`src/proxy.ts`), em vez de "soft 404".
- **Dados estruturados (JSON-LD)**: `RealEstateAgent` + `WebSite` (todas as páginas),
  `BreadcrumbList`, `ItemList` (busca) e `RealEstateListing` com `Offer` (imóvel).
- **Sitemap com imagens**, `lastModified` vindo do CRM, `robots.txt`, canonical em tudo.
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

## Integração com o CRM

Todo acesso a dados passa por `src/lib/crm/` (contrato em `src/lib/crm/tipos.ts`):

```ts
interface AdaptadorCrm {
  listarImoveis(): Promise<Imovel[]>          // catálogo publicado
  enviarLead(lead: Lead): Promise<{ protocolo: string }>
}
```

Para conectar o CRM real:

1. Crie `src/lib/crm/<nome-do-crm>/index.ts` implementando `AdaptadorCrm`, convertendo a
   resposta da API para o tipo `Imovel` (`src/lib/imoveis/tipos.ts`).
2. Selecione-o em `src/lib/crm/index.ts`.
3. Se as fotos vierem de outro domínio, libere-o em `images.remotePatterns` no `next.config.ts`.
4. Configure o CRM para chamar `POST /api/revalidar` com `Authorization: Bearer <REVALIDATE_SECRET>`
   sempre que um imóvel mudar — o site se atualiza em segundo plano, sem rebuild.

Sem webhook, o cache do catálogo expira sozinho a cada hora (`src/lib/imoveis/repositorio.ts`).
Se o catálogo crescer muito (milhares de imóveis), troque a filtragem em memória de
`buscarImoveis()` por uma consulta filtrada na API do CRM — a assinatura da função continua a mesma.

Os formulários (contato, agendar visita, falar com corretor) usam Server Actions
(`src/app/acoes.ts`): validam no servidor, têm campo-armadilha anti-robô e funcionam até
sem JavaScript. Hoje o adaptador mock só registra o lead no log do servidor.

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
    crm/                  contrato + adaptador mock (trocar pelo CRM real)
    imoveis/              tipos, filtros ⇄ URL, busca, textos de SEO, cache
    site.ts               dados da imobiliária (telefone, endereço, CRECI…)
  proxy.ts                404 para URLs de busca inexistentes
propotype/                protótipos originais (referência de design)
```
