# Relatórios e medição de uso

O painel tem uma área de relatórios (`/admin/relatorios`) com gráficos do cadastro, das visitas, das buscas e dos contatos.
Parte vem direto das tabelas do site (catálogo, já com números desde o primeiro dia); a outra parte
vem de uma **medição de uso própria**, anônima e sem cookies, que só passa a contar a partir do dia em que entra no ar.

## O que cada aba mostra

| Aba | Conteúdo | Fonte |
|---|---|---|
| Visão geral | Indicadores do site e do cadastro, visitas e contatos por dia, mais vistos, origem e pontos de atenção | os dois |
| Audiência | Visitas, visitantes, sessões, horários de pico (mapa de calor), tipos de página, estado, cidade e país | medição |
| Origens | Canais (busca, redes sociais, WhatsApp...), sites e apps de origem, campanhas (`utm_*`) e taxa de contato de cada um | medição |
| Páginas | Mais vistas, de entrada e de saída, tempo e rolagem, tipos de página | medição |
| Buscas | Filtros e termos mais usados, buscas sem resultado (demanda que o catálogo não atende), "carregar mais" | medição |
| Imóveis | Mais vistos, com mais contatos, maior taxa de contato, muita visita e pouco contato, sem visita, desempenho por faixa de preço, fase, tipo, cidade e construtora | medição + catálogo |
| Conversões | Funil (acesso, imóvel, interesse, contato), tipos de contato, botão do WhatsApp, formulários e campos com erro | medição |
| Catálogo | Imóveis, construtoras, cidades, bairros, preços, faixas, quartos, entrega, fotos e cadastros por mês | tabelas do site |
| Construtoras | Imóveis, visitas e contatos por construtora; construtoras sem imóveis | catálogo + medição |

Todas têm tabela equivalente a cada gráfico ("Ver tabela"). As abas de audiência aceitam período (hoje, 7, 30, 90 dias, mês, 12 meses, desde o início ou datas escolhidas), que
vai na URL (`?p=7d` ou `?de=2026-10-01&ate=2026-10-27`) e é mantido ao trocar de aba.

## Como a medição funciona

1. O componente `Rastreador` (no layout) manda um aviso para `POST /api/coleta` a cada página aberta, clique em contato, busca etc.
   Só o site publicado (`VERCEL_ENV=production`) mede; prévias e `localhost` não. Para testar na máquina: `COLETA_ATIVA=1`.
2. A rota responde `204` na hora e grava depois (`after()`), então não atrasa ninguém. As páginas continuam estáticas.
3. Os eventos vão para a tabela `eventos`. Um resumo por dia e dimensão vai para `resumo_diario`, que é o que os relatórios leem.
4. O resumo se atualiza sozinho: ao abrir um relatório e de tempos em tempos quando chegam eventos. Não há agendamento (cron).
   O mesmo passo apaga os eventos brutos com mais de 90 dias que já foram resumidos (`RETENCAO_DIAS` em `src/lib/coleta/tipos.ts`).

### O que fica de fora

- Robôs (pelo User-Agent), o painel `/admin`, e **a equipe**: quem entra no painel recebe o cookie `a3_equipe` (1 ano, não sai com
  o logout), e as visitas daquele navegador não contam. Quem usa o sinal "Não rastrear" (DNT) ou Global Privacy Control também não.
- Pedidos que não vêm do próprio site (`Sec-Fetch-Site`), corpos grandes e mais de 90 eventos por minuto do mesmo visitante.

### Privacidade

- **Sem cookies de visitante e sem nada guardado no aparelho.** O identificador da visita só existe na memória da página.
- **Visitante** = hash de IP + User-Agent + um "sal" do dia (`sal_visitantes`, apagado em 2 dias). O IP e o User-Agent não são
  gravados; o código não liga um dia ao outro. Por isso "visitantes" no período é a soma dos visitantes de cada dia, e não há
  como saber quem voltou.
- País, estado e cidade vêm dos cabeçalhos da Vercel (`x-vercel-ip-*`).
- **Formulários:** continuam sem gravar o que a pessoa digita. Só vão para o banco o nome do formulário, o imóvel e os *nomes*
  dos campos que deram erro.
- A política de privacidade descreve a medição. **O texto precisa de revisão do jurídico**, como o restante da política.

### O que dá e o que não dá para saber

- **Contato = intenção.** Conta o clique no WhatsApp e o formulário enviado; clique no telefone ou no e-mail não conta. Se a pessoa de fato mandou a
  mensagem no WhatsApp só quem atende sabe.
- **Não há histórico.** As visitas só existem desde o dia em que a medição foi publicada; os relatórios avisam isso e mostram
  zerados os dias anteriores.
- Imóvel excluído continua nos números, como "Imóvel removido" (os eventos guardam o id, sem chave estrangeira).

## Tabelas (`db/relatorios.sql`)

| Tabela | O que guarda | Quanto tempo |
|---|---|---|
| `eventos` | Um evento por linha: visita, clique em WhatsApp/telefone/e-mail, galeria, mapa, busca, formulário, 404 | 90 dias |
| `resumo_diario` | Contagens por dia, dimensão (`canal`, `pagina`, `imovel`, `acao`, `busca-uso`...), chave e imóvel | para sempre |
| `sal_visitantes` | O sal de cada dia | 2 dias |

As três têm RLS ligado, como as demais (`db/seguranca-rls.sql`).

## Como aplicar (primeira vez)

1. Backup (`npm run backup`, docs/backup-banco.md).
2. Supabase > SQL Editor > rodar `db/relatorios.sql` (pode rodar de novo sem problema). **Antes de publicar o código**: sem as
   tabelas, a coleta apenas registra um erro no log (não quebra o site) e a aba de relatórios mostra erro.
3. Publicar. Passado o primeiro dia de visitas, os relatórios de audiência começam a encher.

Para testar sem produção: suba um Postgres local (`db/schema.sql` + `db/seguranca-rls.sql`), aponte `DATABASE_URL` para ele e rode
com `COLETA_ATIVA=1`.

## Mexer na medição

- **Novo evento:** acrescente o tipo em `src/lib/coleta/tipos.ts` (`TIPOS_EVENTO`), envie com `registrar()` (`src/lib/coleta/cliente.ts`)
  ou marque o elemento com `data-evento="tipo"` e `data-rotulo`. Links de WhatsApp, telefone e e-mail são pegos sozinhos; use
  `data-rastro="nome-do-lugar"` para dizer de onde veio o clique.
- **Nova coluna de relatório:** os agrupamentos estão em `src/lib/relatorios/resumo.ts` (`BLOCOS`). O resumo de cada dia é refeito do
  zero, então mudar a consulta vale para os dias que ainda têm evento bruto (os últimos 90).
- **Não coletar dados pessoais.** Qualquer campo novo precisa ser conferido contra a política de privacidade.
