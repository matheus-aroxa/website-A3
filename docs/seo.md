# SEO

Objetivo: aparecer bem no Google para quem procura imóveis em Paulista, Recife e região. Este arquivo descreve o que o código
já faz, como conferir e o que depende de coisas fora do código (domínio, links, Perfil da Empresa no Google, tempo).
Nenhuma alteração garante a primeira posição: quem decide é o Google. O que dá para fazer no código é não atrapalhar,
entregar páginas rápidas, claras e sem duplicatas, e dar ao Google um texto e um endereço certos para cada busca.

## O que o site faz

### Uma página principal por conjunto de imóveis (`src/lib/imoveis/paginas.ts`)

O caminho da busca (`/imoveis/[categoria]/[tipo]/[cidade]/[bairro]`) gerava 616 URLs, mas só 179 conjuntos diferentes de
imóveis: se o Janga só tem apartamentos à venda, `/imoveis/paulista/janga`, `/imoveis/venda/paulista/janga` e
`/imoveis/venda/apartamentos/paulista/janga` mostram a mesma lista (houve grupos de 12 URLs idênticas). Para o Google isso é
conteúdo duplicado e divide a força da página. Agora:

- Cada conjunto escolhe como **principal** a página mais específica ("Apartamentos à venda no Janga"); as outras apontam o
  `canonical` para ela.
- Conjunto com **um imóvel só** fica `noindex, follow`: não tem nada além do que o próprio anúncio já mostra. Busca sem
  resultado também (já era assim). O limite é `MIN_IMOVEIS_INDEXAVEL`.
- O bairro provisório "A confirmar" nunca é a página principal nem recebe link.
- O **sitemap** lista só as principais: 459 URLs (eram 955) = 337 anúncios + 112 buscas + 8 páginas do programa + home + política.
- A principal muda sozinha quando o catálogo muda (o painel invalida o cache).

### Títulos e descrições (`src/lib/imoveis/rotas.ts`)

- **Home:** `Imobiliária em Paulista – PE | A3 Soluções Imobiliárias` (a palavra-chave local primeiro).
- **Busca:** palavra-chave + local + UF + marca, na versão mais completa que cabe em ~64 caracteres (a marca sai antes do local).
  A UF vem da cidade (o catálogo tem Maragogi, AL; antes todo título dizia "– PE"). A descrição traz os números do conjunto:
  "44 apartamentos à venda em Paulista, a partir de R$ 80.000. Veja fotos, plantas e fale com um corretor da A3."
- **Anúncio:** `Nome – Apartamento à venda em Bairro, Cidade` e a chamada do imóvel + preço + entrega + convite, sem passar de 160
  caracteres.
- Preço absurdo (venda abaixo de R$ 20 mil, aluguel abaixo de R$ 100: erro de cadastro) **não vai** para a descrição nem para os
  dados estruturados (`precoPlausivel`). A página ainda mostra o valor cadastrado: corrija no painel.
- `og:site_name`, `og:locale` e `og:type` saem em todas as páginas (o Next não mescla `openGraph` entre layout e página,
  então `openGraphBase` em `src/lib/site.ts` é repetido em cada uma).

### Texto e links internos

- **Busca:** um cartão no fim dos resultados com o resumo do conjunto (quantos imóveis, a partir de quanto, quartos, situação das
  obras, quantos do Minha Casa Minha Vida) e links para bairros, outras cidades e outras buscas, sempre para a página principal
  de cada conjunto. Só dados do catálogo; nenhuma frase solta sobre o mercado. Fica junto dos resultados (e não no esqueleto da
  página): fora dessa unidade o texto era empurrado para baixo quando os resultados chegavam (CLS 0,42).
- **Home:** seção "Imóveis por cidade" com as cidades, os maiores bairros e a contagem; o rodapé de todas as páginas leva às três
  maiores cidades e aos três maiores bairros (antes eram cinco links fixos).
- **Anúncio:** links para a busca do bairro e da cidade.

### Minha Casa Minha Vida (`/minha-casa-minha-vida` e `/minha-casa-minha-vida/[cidade]`)

79 dos 337 imóveis são do programa (21 dos 47 de Paulista), e "Minha Casa Minha Vida + cidade" é uma busca de grande volume. Há
uma página geral e uma por cidade com 2 ou mais imóveis do programa, com os imóveis, uma explicação genérica de como o programa
funciona (sem faixa de renda nem valor, que mudam) e o convite para conferir o enquadramento no WhatsApp.

### Dados estruturados (`src/lib/seo.ts`)

`RealEstateAgent` (com telefone, e-mail, endereço, áreas atendidas e contato) e `WebSite` em todas as páginas;
`BreadcrumbList` em toda página com migalhas; `CollectionPage` e `ItemList` nas buscas e no programa; `RealEstateListing`
com `Offer` nos anúncios (sem `Offer` quando o preço é absurdo). Nada de avaliações ou notas inventadas.

### Imagens e velocidade

- O texto alternativo das fotos vem do anúncio: "Nome, apartamento em Bairro, Cidade – foto 3" (antes era "Nome – foto 3").
- O endereço das fotos (S3) é anunciado ao navegador por `preconnect` (cabeçalho `Link`), e a primeira foto de cada lista pede
  prioridade alta.
- Conferido com Lighthouse (celular simulado): SEO 100, acessibilidade 97–100, boas práticas 100, desempenho 83–87, CLS ≈ 0.
  O LCP de laboratório fica em ~4 s por causa da rede simulada (lenta) e das fotos virem de outra origem; o CloudFront
  (docs/cloudfront.md) ajuda. O que conta para o ranking são os dados reais de usuários (Search Console > Core Web Vitals),
  que só aparecem depois de algumas semanas de visitas.

## Como conferir

- `curl -s https://<domínio>/sitemap.xml` deve listar só URLs que respondem 200 e têm `canonical` igual a si mesmas.
- Search Console > Inspeção de URL: "URL do usuário" e "URL escolhida pelo Google" devem ser iguais nas páginas do sitemap.
- Teste de Resultados Ricos (search.google.com/test/rich-results) em um anúncio e em uma busca.
- PageSpeed Insights (pagespeed.web.dev) na home, em uma busca e em um anúncio.
- Compartilhar um anúncio no WhatsApp e ver se a prévia mostra a foto (as fotos são WebP; se a prévia vier sem imagem,
  é preciso gerar uma versão JPEG para o `og:image`).

## Depois do deploy (o que não está no código)

1. **Domínio e `NEXT_PUBLIC_SITE_URL`.** O endereço oficial de cada página sai dessa variável. O domínio do código
   (`a3imobiliaria.com.br`) não existia no DNS em 24/10/2026. Registre o domínio, aponte para a Vercel, e
   confira a variável (docs/deploy-vercel.md). Redirecione o domínio sem `www` para o com `www` (ou o contrário).
2. **Google Search Console:** adicionar o domínio, colocar o código em `GOOGLE_SITE_VERIFICATION` (ou verificar por DNS) e enviar
   `/sitemap.xml`. Fazer o mesmo no Bing Webmaster Tools.
3. **Perfil da Empresa no Google (Google Business Profile):** é o que mais pesa em "imobiliária em Paulista" (o bloco do mapa).
   Cadastre com o mesmo nome, endereço e telefone do rodapé do site, categoria "Imobiliária", horário, fotos do escritório, o
   endereço do site, e peça avaliações a clientes reais. Mantenha nome, endereço e telefone idênticos no Instagram e em
   qualquer diretório.
4. **Links de outros sites** (conta muito para subir): Instagram com o link do site, parceiros e construtoras, portais e
   associações locais, imprensa. Compra de links pode derrubar o site.
5. **Conteúdo novo com o tempo:** quando cadastrar um empreendimento, preencha a descrição completa, as plantas, o lazer e as
   proximidades: é o texto que diferencia cada página. Guias escritos pela equipe (financiamento, documentação, bairros) só
   valem a pena se forem revisados por quem entende do assunto.
6. **Analytics.** Hoje o site não usa nenhuma ferramenta de análise nem cookie de rastreamento, e a política de privacidade
   diz isso. Se adicionar Google Analytics, pixel ou algo parecido, atualize a política (seção "Cookies e rastreamento") e o
   aviso de cookies antes.

## Dados do catálogo que atrapalham (corrigir no painel)

Alguns cadastros prejudicam o texto e os dados que o Google lê:

- **Preço errado:** `VEM_25125` (Residencial Bosque das Palmeiras, Olinda) está à venda por R$ 1.200.
- **Quartos errados:** `VEM_36172` (Residencial Bellatrix) tem 22 quartos para 54 m².
- **Tipo errado (casa ou terreno cadastrados como apartamento):** `VEM_22547`, `VEM_22661`, `VEM_29679`, `VEM_34570`, `VEM_35335`,
  `VEM_35419`, `VEM_37519`, `VEM_43330`, `VEM_43840` e `VEM_44386`. Hoje o site os chama de "Apartamento". Salas comerciais
  (`Empresarial…`, `Medcenter`) também aparecem como apartamento: o modelo só tem apartamento, casa de condomínio e terreno.
- **Anúncios repetidos** (mesmo nome e bairro): `VEM_37320`/`VEM_45446`, `VEM_43394`/`VEM_43400`, `VEM_33720`/`VEM_35713`,
  `VEM_34180`/`VEM_35130`. Páginas parecidas competem entre si.
- **Localização incompleta:** 16 imóveis estão na "cidade" Pernambuco, bairro "A confirmar"; 3 estão no bairro "Pe - 22".
- **Sem descrição:** `VEM_38613` (Bosque dos Camaras).
- **Nomes com sobra:** "(ACEITA FINANCIAMENTO)", "( Repasse )", "- Aluguel", "-- Loteamento…": entram no título do Google.
