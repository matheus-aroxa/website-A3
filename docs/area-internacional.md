# Área internacional (/en, /it, /es, /fr, /de)

Páginas para quem compra imóvel no Brasil vindo de fora, em inglês, italiano, espanhol, francês e alemão. O site em
português continua na raiz, com os mesmos endereços. A área internacional não é uma cópia traduzida do site: tem uma
página inicial própria, os imóveis de um recorte do catálogo, um guia de compra para estrangeiros e uma página sobre a
região. Cada página aponta para as suas versões nos outros idiomas (`hreflang`), e o sitemap traz todas.

## Páginas

| Página | Inglês | Italiano | Espanhol | Francês | Alemão |
| --- | --- | --- | --- | --- | --- |
| Início | `/en` | `/it` | `/es` | `/fr` | `/de` |
| Imóveis | `/en/properties` | `/it/immobili` | `/es/inmuebles` | `/fr/biens` | `/de/immobilien` |
| Ficha do imóvel | `/en/properties/<slug>` | `/it/immobili/<slug>` | `/es/inmuebles/<slug>` | `/fr/biens/<slug>` | `/de/immobilien/<slug>` |
| Guia de compra | `/en/buying-property-in-brazil` | `/it/comprare-casa-in-brasile` | `/es/comprar-inmueble-en-brasil` | `/fr/acheter-un-bien-au-bresil` | `/de/immobilie-in-brasilien-kaufen` |
| Região | `/en/recife-and-pernambuco` | `/it/recife-e-pernambuco` | `/es/recife-y-pernambuco` | `/fr/recife-et-pernambouc` | `/de/recife-und-pernambuco` |
| Política de privacidade | `/en/privacy-policy` | `/it/informativa-privacy` | `/es/politica-de-privacidad` | `/fr/politique-de-confidentialite` | `/de/datenschutz` |

O slug do imóvel é o mesmo de `/imovel/<slug>`, e a ficha em português liga as versões estrangeiras pelo `hreflang` e pelo
seletor de idioma do cabeçalho (o globo). Os endereços ficam em `src/lib/internacional/idiomas.ts`. Mudar um endereço
depois de publicado faz o Google perder a página antiga: só com um redirecionamento.

## O que é traduzido, e como

| Conteúdo | Onde está | Tradução |
| --- | --- | --- |
| Menus, botões, rótulos, títulos para o Google | `src/lib/internacional/dicionarios/<idioma>.ts` | Feita uma vez, à mão |
| Guia de compra e região | `src/lib/internacional/conteudo/<idioma>.ts` | Feita uma vez, à mão, a partir do documento de rascunhos revisado pela A3 |
| Política de privacidade | `src/lib/internacional/conteudo/privacidade.ts` | Feita à mão a partir de `app/(site)/politica-de-privacidade`. Cada tradução avisa que vale o texto em português: **mudou a política em português, atualize as traduções** |
| Tipo, situação, quartos, área, entrega, frase sob o título, texto das fotos | Gerados pelo código | Montados no idioma a partir dos dados do imóvel |
| Itens de lazer e proximidades comuns (piscina, academia, escola, farmácia…) | `src/lib/internacional/lazer.ts` | Tabela pronta |
| Descrição, demais itens de lazer e proximidades, plantas, legendas | Banco ou Viniun (só em português) | Amazon Translate, sob demanda, ao abrir a ficha; sem ele, o navegador traduz a descrição (abaixo) |
| Nome do empreendimento, bairro, cidade, construtora | — | Não se traduz (nome próprio; marcado com `translate="no"`) |

### Tradução automática (Amazon Translate, sob demanda)

Ligada com `TRADUTOR=aws` (ver `.env.example`). Usa a conta e as credenciais da AWS que o site já tem para as fotos; o
usuário IAM precisa da permissão `translate:TranslateText` (política `traducao-do-site`, docs/fotos-s3.md). Região do Translate:
`TRADUTOR_REGIAO` (padrão `us-east-1`). **O Amazon Translate não existe em `sa-east-1`** (São Paulo); `us-east-1` é a região
mais próxima com o serviço. Só as descrições públicas dos imóveis saem do Brasil, sem dado pessoal.

Como funciona (`src/lib/internacional/traducao.ts`):

- **Nada é traduzido de antemão.** Nenhuma ficha internacional é gerada no build. O texto só vai para a AWS quando alguém
  (uma pessoa ou o Google) abre a ficha num idioma pela primeira vez; a página pronta fica no cache e as visitas seguintes
  não chamam a AWS.
- **Nada fica no banco.** Cada tradução fica no cache do Next (`"use cache: remote"`), e a chave é o próprio texto em
  português mais o idioma. Se a Viniun ou o painel mudar a descrição, o texto é outro e a tradução é refeita na hora: não
  existe tradução desatualizada. Quando a página é regenerada (de hora em hora, ou quando o catálogo muda), os textos que
  não mudaram saem do cache, sem nova cobrança.
- **Se a AWS falhar** (sem permissão, fora do ar), a ficha sai com a descrição original em português e o aviso no idioma da
  página; a próxima regeneração tenta de novo. Nada quebra.
- **Para corrigir uma tradução:** não há tabela para editar; corrija o texto em português na origem (Viniun ou painel), e a
  ficha é traduzida de novo.

**Custo:** US$ 15 por milhão de caracteres (o nível gratuito de 2 milhões/mês só vale nos 12 primeiros meses de contas
criadas antes de 15/07/2025; contas novas têm créditos). Levantamento de 16/11/2026 nas 254 fichas do recorte: as
descrições somam cerca de 193 mil caracteres distintos, ~965 mil nos cinco idiomas, ou seja, uns US$ 15 se todas as fichas
fossem abertas em todos os idiomas. Como a tradução é sob demanda, só se paga pelo que é visitado; depois, só fichas novas ou
alteradas. Vale criar um alerta no AWS Budgets (por exemplo, US$ 5/mês) para acompanhar.

### Enquanto não há serviço de tradução: o navegador

Sem a tradução no site, a ficha mostra a descrição original com um aviso no idioma da página. No Chrome do computador
(versão 138 ou mais nova), o tradutor embutido do navegador (Translator API, que roda no próprio aparelho, sem custo e sem
enviar o texto a ninguém) traduz a descrição sozinho; se o idioma ainda não foi baixado no aparelho, aparece o botão
"Translate the description". `src/components/internacional/DescricaoNavegador.tsx`. Limites: só no Chrome do computador, e o
Google não vê essa tradução (para o Google a descrição continua em português).

## Recorte do catálogo

`src/lib/internacional/recorte.ts`. **Provisório:** só os imóveis à venda e fora do Minha Casa Minha Vida (o programa exige
ser brasileiro e ter renda dentro da faixa). Hoje são 254. Quando a A3 definir o recorte (por preço, cidade, escolha no
painel…), muda só essa função: listagem, fichas, destaques e sitemap passam todos por ela.

Os destaques da página inicial internacional são os da vitrine da home (painel) que estão no recorte, completados com os
mais recentes.

## Preço

O valor principal vem na moeda do idioma: dólar (inglês e espanhol) ou euro (italiano, francês e alemão), convertido pela
PTAX de venda do Banco Central (API pública, sem chave, `src/lib/internacional/cotacao.ts`) e arredondado ao milhar. O preço
oficial, em reais, aparece logo abaixo como informação secundária: nos cards, na ficha ("Official price: R$497,200", com a
data da cotação) e na descrição para o Google. A cotação é relida a cada hora. Se a API do Banco Central falhar, o preço
volta a aparecer só em reais, como principal (`precoNoIdioma`, em `src/lib/internacional/formato.ts`). Os dados
estruturados (JSON-LD) continuam com o preço em reais, que é o da oferta.

## Contato

O formulário internacional abre o WhatsApp da A3, como os do site em português. A mensagem começa no idioma do cliente (é
ele quem a envia) e traz uma linha para a equipe, em português: `[Cliente internacional · italiano]`, com nome, país,
WhatsApp com código do país, e-mail, imóvel e mensagem. Os botões de WhatsApp das páginas também abrem a conversa no idioma.

## Medição e relatórios

A medição de visitas funciona igual: as fichas internacionais contam para o imóvel, e nos relatórios de páginas elas
aparecem como "[IT] Nome do imóvel", "[EN] Guia de compra" etc.

## Design

As páginas internacionais têm o mesmo desenho das páginas em português e usam o mesmo CSS:

| Página internacional | Espelho de | CSS |
| --- | --- | --- |
| Início | Home (`app/(site)/page.tsx`) | `app/(site)/page.module.css`, `home/BuscaInicial.module.css` |
| Imóveis | Busca (`app/(site)/imoveis/busca.tsx`) | `busca/Busca.module.css` |
| Ficha | Ficha (`app/(site)/imovel/[slug]/page.tsx`) | `imovel/Imovel.module.css` |
| Guia e região | Política de privacidade | `layout/PaginaTexto.module.css` |
| Card, cabeçalho, rodapé | `CardImovel`, `Cabecalho`, `Rodape` | os mesmos módulos |

Mudou o visual de uma página em português? Leve a mudança para a internacional correspondente
(`src/components/internacional/`, `src/app/(internacional)/`). O que é só da área internacional fica em
`components/internacional/Internacional.module.css`: seletor de idioma, tabelas e perguntas do guia, valor aproximado.

## Estrutura do código

- `src/app/(internacional)/[idioma]/`: layout raiz próprio (para o `<html lang>` do idioma), início, `[secao]` (imóveis,
  guia ou região, conforme o endereço no idioma) e `[secao]/[slug]` (ficha).
- `src/app/(site)/`: o site em português e o painel, com o layout raiz em pt-BR. Por haver dois layouts raiz, trocar de
  idioma recarrega a página, e a 404 de endereços sem rota é `src/app/global-not-found.tsx`.
- `src/proxy.ts`: responde 404 antes de renderizar para idioma ou seção inexistentes (`/xx`, `/en/immobili`).
- `src/components/internacional/`: cabeçalho, rodapé, seletor de idioma, card, lista com filtros, formulário e artigos.

## Pendências

- Dar a permissão `translate:TranslateText` ao usuário IAM do site e definir `TRADUTOR=aws` na Vercel.
- Revisar os textos (dicionários e conteúdo), de preferência com um falante nativo, principalmente o italiano.
- Definir o recorte do catálogo.
