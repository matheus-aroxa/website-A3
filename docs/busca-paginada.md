# Busca e listagens paginadas no banco

O catálogo (337+ imóveis, com galeria e textos) não é mais carregado inteiro em memória. Cada tela pede ao
banco só o que mostra; filtros, ordenação, contagem e paginação rodam no SQL.

## Site público
- `src/lib/imoveis/consultas.ts`: consultas em SQL. A busca devolve uma página de 9 resumos (com a capa, sem galeria)
  e o total. Também há destaques, herói da home, semelhantes, um imóvel por slug/id, cidades e um índice mínimo
  (rotas e sitemap).
- `src/lib/imoveis/repositorio.ts`: só envolve essas consultas com `"use cache"` (tag `imoveis`).
- A busca de texto (`?q=`) ignora acentos e maiúsculas sem a extensão `unaccent` (função `SEM_ACENTO`).
- `listarIndice()` (slug, tipo, cidade, bairro) alimenta `generateStaticParams`; o sitemap usa o mesmo índice com as fotos.

## Painel (`/admin`)
- `src/lib/imoveis/consultas-admin.ts`: uma página de 24 imóveis, mais a contagem de cada aba, em uma consulta.
- Aba, busca, filtros e página ficam na URL: `/admin?aba=inativo&q=villa&situacao=pronto&finalidade=venda&pagina=2`.
- A tela (`ListaImoveis.tsx`) espera 350 ms depois de digitar antes de buscar e mostra "Anterior / Próxima".
- A vitrine da home (`/admin/vitrine`) ainda lista todos os imóveis publicados no seletor, mas só com nome, código,
  local, preço e capa.

## Conferência feita
Totais da busca pública e do painel comparados com `count(*)` direto no banco (venda, aluguel, lançamentos, tipo, quartos,
texto, MCMV + entrega, abas e filtros do painel): todos iguais.
