# Análise do modo Viniun em produção (11/11/2026)

O que deixou de funcionar ou de fazer sentido com `FONTE_IMOVEIS=viniun`, levantado com o site rodando no modo Viniun e
comparando a cópia das fichas (`viniun_fichas`) com o banco. Como a integração funciona: docs/integracao-viniun.md.

**Prioridade sugerida:** 1, 2 e 3 (o visitante vê e o Google lê); depois 4, 5 e 15 (só código); depois os relatórios
(11 a 13). Os itens 6 e 7 dependem de a equipe confirmar o dado certo. Os itens 9 e 14 são limitações da Viniun.

## Site público

### 1. "Mais recentes" virou uma ordem quase aleatória

- **O que acontece:** "Mais recentes" é a ordem padrão da busca e também a dos imóveis semelhantes e a da escolha do
  imóvel do topo da home. O `datePosted` dos dados estruturados também sai errado.
- **Causa:** 325 dos 326 imóveis têm data de publicação 11/11/2026 na Viniun: é o dia da publicação em lote
  ("Publicar no site"). No banco, as datas iam de 29/01/2024 a 11/11/2026, em 90 dias diferentes. Com todas iguais, a ordem
  cai no desempate pelo id.
- **Correção:** no código, usar a data de publicação do banco para os imóveis que vieram dele (casados pelo código,
  como já é feito com o slug e o id) e a da Viniun só para os cadastrados direto lá.

### 2. A home perdeu a seção de destaques

- **O que acontece:** a home mostra só o imóvel do topo, escolhido praticamente ao acaso por causa do item 1.
- **Causa:** a vitrine do painel (personalizada) tinha 4 destaques; na Viniun nenhum imóvel está marcado como "Destaque".
- **Correção:** marcar esses 4 como destaque na Viniun (ação em lote "Destaque e lançamento").

### 3. 211 imóveis perderam a rua

- **O que acontece:** a página mostra só bairro e cidade, o link "Ver no Google Maps" fica impreciso e os dados
  estruturados ficam sem `streetAddress`, o que pesa no SEO local.
- **Causa:** no banco, 211 imóveis ativos tinham logradouro. A API da Viniun só entrega rua e número quando o
  "endereço completo" está liberado, e não está em nenhum dos 326.
- **Correção:** liberar o "endereço completo" na Viniun para esses imóveis. As ruas já eram públicas no site.

### 4. Nomes de construtora em caixa errada ou trocados

- **O que acontece:** 17 siglas aparecem em caixa errada: MRV → "Mrv", ASLA → "Asla", JMA, AWM, JDS, CETA, BFC, CME, VL,
  OR, RB, FAB, SBM, FAMA, PCP, AB Corte Real, ACLF. Outras 8 aparecem com o nome do cadastro da Viniun: Pernambuco →
  "Pernambuco Construtora", VM → "Vm Empreendimentos", American, Antenor, Renel, Habita, Rabelo, Saraiva.
- **Causa:** é o nome no cadastro de construtoras da Viniun, que é compartilhado entre as imobiliárias.
- **Correção:** no código, exibir o nome do banco quando for a mesma construtora. Corrigir na Viniun mexe no cadastro
  compartilhado.

### 5. Links de filtro de construtora antigos dão zero resultados

- **O que acontece:** links antigos, como `?construtora=pernambuco`, passam a não encontrar nada.
- **Causa:** o slug do filtro sai do nome da construtora, que mudou nas 8 do item 4 (`pernambuco` →
  `pernambuco-construtora`). O relatório de buscas também passa a dividir a mesma construtora em duas.
- **Correção:** resolve-se com a do item 4 (usar o slug do banco quando for a mesma construtora).

### 6. 7 nomes de empreendimento ruins

- **O que acontece:** os títulos foram editados na Viniun entre 02 e 05/11. Estão em caixa alta, com erro de grafia
  ("EMPREEDIMENTO") e com o nome da construtora no título:

| Código | Nome no banco | Nome no site (Viniun) |
| --- | --- | --- |
| AP0005 | Estrada dos Marcos II | EMPREEDIMENTO ESTRADA DOS MARCOS II - MATTOS CUNHA |
| AP0006 | Caxangá Life Club | EMPREEDIMENTO CAXANGÁ LIFE CLUB - EXATA |
| AP0010 | Cittá Estância | CITTÁ ESTÂNCIA RESIDENCE - TENÓRIO SIMÕES |
| AP0011 | Villa Alta Vista | VILA ALTA VISTA - VL |
| AP0013 | Jaqueira Prime | JAQUEIRA PRIME RESIDENCE - USINA DE OBRAS |
| CA0001 | Privê San Sebastián | PRIVÊ SAN SEBASTIÁN |
| TE0006 | Lote à venda- Condomínio vista da serra | Lote à venda - Condomínio Vista da Serra |

- **Correção:** a equipe corrige os títulos na Viniun. Eles vão para o título da página no Google.

### 7. 4 imóveis com bairro diferente do banco

- **O que acontece:** o imóvel muda de bairro no site. Duas páginas de busca deixam de existir, porque ficaram sem
  imóveis: `/imoveis/recife/torre` e `/imoveis/igarassu/agamenon-magalhaes`.

| Código | Banco | Viniun |
| --- | --- | --- |
| AP0005 | Agamenon Magalhães, Igarassu | Sítio dos Marcos, Igarassu |
| AP0010 | Centro, Recife | Jiquiá, Recife |
| AP0016 | Torre, Recife | Torreão, Recife (outro bairro) |
| AP0029 | Torre, Recife | Torreão, Recife (outro bairro) |

- **Correção:** a equipe confirma qual está certo e, se for erro, corrige na Viniun.

### 8. Mudanças na Viniun levam até ~2 horas para aparecer

- **Causa:** o webhook da Viniun não está cadastrado, e há dois caches de 1 hora, um dentro do outro (o catálogo e as
  páginas).
- **Correção:** cadastrar o webhook na Viniun para `https://<domínio>/api/viniun`, com os eventos `imovel.publicado`,
  `imovel.atualizado` e `imovel.despublicado`, e colocar o segredo em `VINIUN_WEBHOOK_SECRET` na Vercel.

### 9. Limitações da Viniun

- "Breve lançamento" aparece como "Lançamento" (28 imóveis): a Viniun não tem essa situação.
- Faixas como "52 a 54 m²" ou "2 ou 3 quartos" viram um valor só (104 imóveis): a Viniun guarda um número por campo.
- Não há correção sem mudança na Viniun.

### 10. A seção "Lazer" mostra itens que não são lazer

- **O que acontece:** aparecem itens como "100% financiado", "Portaria 24 horas" e "Lazer completo". Hoje só 2 imóveis
  têm características preenchidas.
- **Causa:** a seção usa as "características" da Viniun, que misturam lazer com outros atributos. O mesmo vale para o
  `amenityFeature` dos dados estruturados.
- **Correção:** pouco urgente. Renomear a seção (ex.: "Características") ou filtrar os itens.

## Painel `/admin`

### 11. O relatório "Catálogo" descreve o banco, não o site

- **O que acontece:** totais, situação, construtoras, fotos, preços e vitrine vêm das tabelas do banco
  (`src/lib/relatorios/catalogo.ts`), que estão congeladas no modo Viniun.
- **Correção:** no modo Viniun, calcular os números a partir do catálogo da Viniun, ou esconder o relatório.

### 12. O relatório "Imóveis" mistura o banco com o site

- **O que acontece:**
  - Nome, cidade, construtora e preço vêm do banco (`src/lib/relatorios/imoveis.ts`).
  - Os links vão para `/admin/imoveis/{id}`, que no modo Viniun redireciona para o início do painel.
  - A lista "sem visita" inclui imóveis que nem estão no site (ex.: AP0008, ativo no banco e fora do site na Viniun).
- **Correção:** usar os dados do catálogo e apontar os links para a página pública do imóvel ou para a Viniun.

### 13. Os relatórios "Construtoras" e "Páginas" usam nomes do banco

- **O que acontece:**
  - Os dois relatórios exibem os nomes que estão no banco, não os do site.
  - O link "Construtoras sem imóveis" leva a `/admin/construtoras`, que está bloqueada no modo Viniun.
- **Correção:** mesma do item 12.

### 14. Não existe mais "imóvel do topo"

- **O que acontece:** a Viniun só tem a marcação "Destaque", e a vitrine do painel foi desligada no modo Viniun. O topo
  da home passa a ser o destaque mais recente.
- **Decisão pendente:** aceitar isso, ou manter a tela de vitrine ativa no painel no modo Viniun (com os imóveis da
  Viniun).

## Medição de visitas

### 15. Imóveis cadastrados só na Viniun ficam sem rastreio

- **O que acontece:** a medição liga a página ao imóvel pelo slug guardado no banco (`src/lib/coleta/registrar.ts`).
  Um imóvel cadastrado direto na Viniun não está lá:
  - as visitas dele são gravadas sem imóvel;
  - os contatos aparecem nos relatórios como "Imóvel removido".
- **Hoje:** nenhum imóvel está nessa situação. Vai acontecer no primeiro cadastro feito direto na Viniun.
- **Correção:** no modo Viniun, buscar a correspondência slug → id no catálogo da Viniun.
