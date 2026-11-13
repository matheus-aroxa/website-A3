# Integração com a Viniun (CRM)

O site pode ler os imóveis do nosso banco (como sempre foi) ou do CRM Viniun. A troca é feita por uma variável:

```
FONTE_IMOVEIS=viniun   # imóveis vêm da Viniun
FONTE_IMOVEIS=banco    # imóveis vêm do banco (padrão, se a variável não existir)
```

Na Vercel, mudar a variável exige um novo deploy. O banco continua sendo usado para login, relatórios, os endereços
antigos dos imóveis e a cópia das fichas da Viniun (abaixo).

## Antes de ligar o modo Viniun

1. Rodar `db/viniun.sql` no Supabase (cria a tabela `viniun_fichas`). Sem ela o site funciona, mas cada atualização do
   cache baixa as ~330 fichas, uma chamada por imóvel: a primeira visita depois de um deploy espera minutos.
2. Rodar `db/vitrine-viniun.sql` no Supabase, para a vitrine do painel aceitar imóveis cadastrados direto na Viniun.
3. Cadastrar na Vercel `FONTE_IMOVEIS=viniun` e `VINIUN_API_KEY`.

| Variável | Para quê |
| --- | --- |
| `FONTE_IMOVEIS` | `banco` ou `viniun` |
| `VINIUN_API_KEY` | Chave secreta "Site A3 (leitura de imóveis)", só leitura (Painel Viniun › Integrações › API & Webhooks) |
| `VINIUN_WEBHOOK_SECRET` | Opcional. Segredo do webhook (abaixo) |

## Como funciona

- O site lê a **ficha completa** de cada imóvel pela "API do site" da Viniun e filtra e ordena em memória, com as mesmas
  regras da busca no banco. A listagem da API não serve sozinha: não traz a situação da obra, e a busca de lá não tem
  todos os filtros e ordenações do site.
- **Cópia das fichas no banco** (`viniun_fichas`): a cada atualização, o site pede a lista de imóveis com a data de
  atualização (1 chamada) e só baixa as fichas novas ou alteradas. Se a Viniun sair do ar, vale a última cópia.
- O catálogo fica num cache compartilhado por 1 hora. **Atualização na hora (cadastrado em 13/11/2026):** na Viniun, um
  webhook para `https://www.a3imobiliaria.com.br/api/viniun` com os eventos `imovel.publicado`, `imovel.atualizado` e
  `imovel.despublicado`, e coloque o segredo em `VINIUN_WEBHOOK_SECRET`.
- **Endereços preservados (SEO):** o imóvel que já existia no banco (mesmo código, ex.: `AP0277`) mantém a URL e o id
  de antes; cidades e bairros também mantêm os slugs. Só imóveis novos, cadastrados direto na Viniun, usam a URL da Viniun.
- **Painel no modo Viniun:** somem o cadastro de imóveis, as construtoras e as abas de relatório que leem o cadastro do
  banco (Imóveis, Catálogo e Construtoras); o painel abre nos relatórios. Ficam os relatórios (Visão geral, Audiência,
  Origens, Páginas, Buscas e Conversões, com os dados dos imóveis vindos da Viniun), a vitrine da home e os
  administradores. Nada é apagado: com `FONTE_IMOVEIS=banco` tudo volta a aparecer.
- **Vitrine da home:** o imóvel do topo e os destaques são escolhidos no painel (`/admin/vitrine`), nos dois modos. No
  modo Viniun, a lista traz os imóveis publicados lá com foto; enquanto a vitrine nunca foi salva, valem os marcados como
  "Destaque" na Viniun. As escolhas ficam nas mesmas tabelas: um imóvel escolhido no modo Viniun que não existe no banco
  é ignorado no modo banco, e vice-versa. Salvar a vitrine atualiza só a home, sem reler o catálogo.

### Como os campos da Viniun viram os do site

| Site | Viniun |
| --- | --- |
| Situação da obra | Campo "Situação": "Na planta" (ou a marcação "Lançamento") = lançamento; "Em construção" = em construção; as demais = pronto. Sem situação, entrega no futuro = em construção. |
| Previsão de entrega | "Data de entrega" |
| Construtora | Construtora do imóvel (o slug do filtro sai do nome, como no banco: `mrv`, `moura-dubeux`) |
| Minha Casa Minha Vida | Campo "MCMV" (lido pelo filtro da busca: a ficha não traz) |
| Destaques da home | Marcação "Destaque" |
| Mostrar no site | Coluna "Site" = "No site" |

## O que foi feito na Viniun em 11/11/2026

**Publicação:** 325 imóveis postos "No site" (ação em lote "Publicar no site"); com o AP0006, que já estava, são 326.
Mantidos fora (17): os 16 inativos no banco, sendo 5 desativados pela equipe em 30/10 (AP0017 Atlantic Life, AP0338 Villa
Júlia - Aluguel, AP0201 Residence Ville, AP0324 Barra de Jangada, AP0306 Aurora do Paulista) e 11 sem registro de quem
desativou (AP0007, AP0009, AP0012, AP0014, AP0015, AP0019, AP0021, AP0033, AP0155 com preço de R$ 1.200, AP0174, AP0179),
mais o AP0008, "Não publicado" na própria Viniun.

**Dados copiados do banco** (nos 343 imóveis, inclusive os fora do site), onde a Viniun estava vazia:

- Situação: lançamento e breve lançamento → "Na planta" + marcação "Lançamento"; em construção → "Em construção";
  pronto → "Pronto para morar".
- Data de entrega (145), MCMV (80) e construtora (286). Ao marcar MCMV, a Viniun preenche sozinha as faixas do programa
  com todas (1 a 4): o banco não guarda faixa.
- Construtoras: 61 já existiam na Viniun com o mesmo nome; 8 foram associadas a construtoras de nome mais completo do
  mesmo lote (VM → Vm Empreendimentos, Pernambuco → Pernambuco Construtora, American → American Empreendimentos, Antenor →
  Antenor Lino, Renel → Renel e Dimelo, Habita → Habita Engenharia, Rabelo → Rabelo Moreira, Saraiva → Lm Saraiva); 12
  foram criadas, só com o nome (DUE, GA2, Heimat, Gomes, Santo Antônio, MM Empreendimentos, César Construtor, SAAM,
  Gusmão, Fonte, Consutab, Mare Alta). O cadastro de construtoras da Viniun é compartilhado entre as imobiliárias.
- **Mantidos como estavam na Viniun** (preenchidos lá entre 02 e 05/11, diferentes do banco): AP0005 (Em construção,
  entrega jul/2029; no banco, pronto), AP0006, AP0008 e AP0010 (Em construção; no banco, lançamento), CA0001 (MCMV; no
  banco, não).

**Feeds de anúncio pausados:** Google Ads (remarketing), Meta (Facebook/Instagram) e Meta (WhatsApp e loja do Facebook).
Esses feeds sempre levam todos os imóveis "No site" (escolher imóveis no feed não limita); ficaram desligados para os 325
não irem para anúncios sem decisão. Para religar: Viniun › Integração Portais. ZAP/VivaReal/OLX, ImovelWeb, Chaves na
Mão e Só Anúncios não mudaram (exigem escolher os imóveis).

## O que ainda difere do banco

| O quê | Efeito no site |
| --- | --- |
| Breve lançamento | A Viniun não tem essa opção: os 28 aparecem como "Lançamento". |
| Faixas (ex.: 52 a 54 m², 2 ou 3 quartos), 104 imóveis | A Viniun guarda um valor só; o site mostra esse valor. |
| Nome do empreendimento | O site usa o título do anúncio na Viniun, sem o trecho "– Apartamento à venda em…" (alguns estão em maiúsculas ou com o nome da construtora). |
| Frase sob o título | Gerada automaticamente ("Apartamento de 3 quartos em Caxangá, Recife – PE"). |
| Ponto no mapa | Só quando o endereço completo foi liberado na Viniun (senão a coordenada é aproximada e não vai ao mapa). |
| Bairros alterados na Viniun | Paço Decó (AP0016) e Botanik Torre (AP0029) estão em "Torreão", outro bairro do Recife (no banco, Torre); Estrada dos Marcos II (AP0005), em "Sítio dos Marcos" (no banco, Agamenon Magalhães). As páginas /imoveis/recife/torre e /imoveis/igarassu/agamenon-magalhaes deixam de existir. |
| AP0008 (Bosque dos Camarás) | Fora do site ("Não publicado" na Viniun). |
| Campo "Unidades"; imóveis comerciais | Não existem no site (o modelo só tem apartamento, casa e terreno). |
| Imóvel sem preço | Aparece como "Sob consulta". |

## Para voltar ao banco

Defina `FONTE_IMOVEIS=banco` (ou apague a variável) e faça um novo deploy. As URLs são as mesmas nos dois modos. Atenção:
o banco não recebe o que for cadastrado ou alterado na Viniun nesse meio-tempo.
