# Exportação de imóveis para a OLX: observações

Gerado em 05/11/2026 a partir do banco de produção, em modo somente leitura. O banco e o código do site não foram alterados.

## Resumo

| | Quantidade |
|---|---|
| Imóveis ativos no site | 332 |
| Anúncios no XML | **236** (71% dos ativos) |
| Ativos fora do XML | 96 (95 sem CEP confiável e 1 com preço errado) |
| Fotos no XML | 3.335 |
| CEPs confirmados, entre os 340 pesquisados | 241 |

Ainda **não** atende ao objetivo de exportar todos os imóveis. O motivo é o CEP, obrigatório na OLX: a tabela `imoveis` não tem essa informação e só 52 imóveis tinham CEP aparentemente válido no CRM.

## Arquivos desta pasta

| Arquivo | Conteúdo |
|---|---|
| `imoveis-olx.xml` | Os 236 anúncios no formato XML da OLX |
| `imoveis-cep-confirmados.csv` | Os 241 CEPs confirmados, com método e origem de cada um |
| `imoveis-sem-cep.csv` | Os 100 imóveis fora do XML (96 ativos e 4 não ativos), com motivo e CEPs candidatos |

Os CSVs usam `;` como separador e abrem direto no Excel.

## De onde vem o número 340

| Grupo | Imóveis |
|---|---|
| Ativos no site | 332 |
| Desativados no painel | 5 |
| Publicados no CRM, mas que nunca entraram no site | 3 |
| **Total** | **340** |

Os CEPs foram pesquisados para os 340, mas o XML só contém imóveis ativos no site.

- **Desativados:** VEM_19140 Atlantic Life, VEM_33723 Residence Ville, VEM_36097 Condomínio Aurora do Paulista, VEM_39184 Residencial Barra de Jangada e VEM_44616 Residencial Villa Júlia - Aluguel.
- **Nunca entraram no site:** VEM_38617 Vivar atlântico, VEM_40230 Loteamento Novo Recife e VEM_44388 Repasse - Residence park.
- **Têm CEP confirmado:** Atlantic Life, Residence Ville, Residencial Barra de Jangada e Repasse - Residence park.

## Critério para aceitar um CEP

Nenhum CEP foi estimado. O endereço veio do cadastro, do CRM, do texto do anúncio ou de pesquisa na internet, e o CEP foi obtido ou conferido na base dos Correios por meio do ViaCEP. Três CEPs foram conferidos no BrasilAPI: 52031-140, 52051-180 e 52070-005.

| Método | Imóveis |
|---|---|
| Rua e bairro conferem | 115 |
| Rua e número dentro da faixa do CEP | 46 |
| CEP único do município (Tamandaré e Maragogi) | 28 |
| CEP do CRM e rua do cadastro concordam | 23 |
| Rua com um só CEP na cidade, com bairro de nome diferente | 15 |
| Único CEP da rua no bairro, sem número | 13 |
| Rua e etapa citadas no anúncio | 1 |

Foram recusados CEPs especiais, de agências e grandes usuários, e ruas com o mesmo nome em outro bairro ou de outro tipo (Rua x Travessa, Rua x Avenida).

## CEPs que merecem conferência

- **Endereço de fonte única:** VEM_35839 Parador de Cervantes (anúncio Nestoria), VEM_36027 Infinity Recife (anúncio ZAP), VEM_21926 Start Nature (anúncio Trovit; outras fontes citam "Padre Antônio de Andrade") e VEM_33000 Littmann (notícia, sem número).
- **Número incompatível com a faixa:** VEM_21413 Venâncio Barbosa tem nº 2654, mas a faixa 2001 a 2999 é só de ímpares.
- **Sem número:** 13 imóveis usam o único CEP da rua no bairro. Filtre o método no CSV de confirmados.
- **Cidade deduzida:** VEM_21621, VEM_21705 e VEM_21867 estavam com cidade "Pernambuco"; ficaram como Recife pela rua, e o Bosque da Tamarineira também pelo nome.
- **Fontes divergentes:** VEM_21819 Mood Aurora (esquina; o cadastro cita Rua Pedro Afonso e Av. Cruz Cabugá), VEM_22422 Jardim das Oliveiras e VEM_27781 Privê Ouro. Prevaleceu o cadastro.

## Por que 96 imóveis ativos ficaram fora

| Motivo | Imóveis |
|---|---|
| Sem endereço no cadastro nem em fonte confiável | 52 |
| Rua com vários CEPs, sem como definir o trecho | 21 |
| Rua inexistente nos Correios e sem outra confirmação | 17 |
| Preço errado (VEM_25125 Bosque das Palmeiras: venda por R$ 1.200) | 1 |
| Fontes em conflito (VEM_21458 Mirage: nº 4709, nº 351 e bairro divergente) | 1 |
| Outros casos | 4 |

A lista completa está em `imoveis-sem-cep.csv`.

## O que mais reduz a lista

1. **Muro Alto, Ipojuca (7 imóveis):** Makai, Malia, Mana, Palm Village, CAIS, Naturê e Tropí. O CEP provável é 55593-460 (Estrada do Muro Alto), mas nada comprova que seja a mesma via citada nos anúncios.
2. **Av. Bernardo Vieira de Melo, Jaboatão (5 imóveis):** AvNue Hall, Estação Atlântico Sul, Smart Candeias, Lord Jacinto e Terraza. Há números, mas o ViaCEP não traz faixas para essa avenida; falta consultar os Correios.
3. **Imóveis avulsos:** "Casa - Candeias", "Triplex - Janga" e semelhantes. A A3 deve ter o endereço na captação.
4. **Construtoras:** Rio Ave, DUE, ASLA e JDS podem informar vários endereços de uma vez.

## Problemas encontrados nos dados

**CEPs do CRM corrigidos no XML (14):**

| Código | Imóvel | CRM | Usado no XML |
|---|---|---|---|
| VEM_21394 | Vila das Palmeiras | 53443610 | 53421-420 |
| VEM_21413 | Venâncio Barbosa | 53030005 | 53130-540 |
| VEM_21506 | Nôemia Paraíso | 52030250 | 52030-252 |
| VEM_21509 | Max Tulum - Maragogi | 5795500 | 57955-000 |
| VEM_21510 | Max Trindade | 52051390 | 52051-395 |
| VEM_21529 | Carlos Mendonça | 51020000 | 51160-290 |
| VEM_21530 | Edifício Dr. José Alves | 79070310 (Campo Grande/MS) | 52031-140 |
| VEM_21617 | Antunes Beach Resort | 57953000 (Japaratinga/AL) | 57955-000 |
| VEM_21870 | Edifício Domus Augusto Lins e Silva | 51030030 | 51130-030 |
| VEM_22395 | Serrambi Experience | 55590000 | 55595-572 |
| VEM_22573 | TIVO Studios | 52050420 | 52050-387 |
| VEM_37819 | Bela Vista Living | 53413000 | 53420-425 |
| VEM_38613 | Bosque dos Camaras | 54777100 | 54789-205 |
| VEM_43330 | Casa Em Pau Amarelo | 53423730 | 53431-340 |

**Outros pontos no catálogo:**

- 16 imóveis ativos têm a cidade cadastrada como "Pernambuco" e o bairro como "A confirmar". O site mostra esse texto; no XML foi substituído pelo local correto nos anúncios exportados.
- 55590-000 (Ipojuca) não existe mais na base consultada, e vários imóveis usavam esse CEP.
- O campo de lazer está vazio em todos os ativos, por isso o XML não traz as tags opcionais de comodidades.

## Como os dados foram montados

| Campo | Regra |
|---|---|
| Faixas (quartos, banheiros, vagas e área) | Usa o menor valor, coerente com o preço "a partir de". A faixa completa vai na descrição |
| Fotos | Aponta para os originais em JPG ou PNG no S3, porque a OLX não aceita WebP. As 3.335 estão dentro dos limites (até 5 MB e 2160 x 3840 px) |
| Descrição | Chamada, texto, faixas, entrega e CRECI, com `\n` literal nas quebras de linha, como pede a OLX |
| Tipo | Apartamento Padrão, Casa em Condomínio ou Terreno Padrão |

## Antes de enviar para a OLX

- **O arquivo é um retrato de 05/11/2026.** Preços e novos imóveis não se atualizam sozinhos.
- **A OLX exige URL pública**, disponível a qualquer hora. O arquivo ainda não está hospedado.
- **Quem some do arquivo é removido da OLX.** Se voltar depois, conta como nova inserção, que é paga. Use `CodigoImovel` estável e não publique um arquivo vazio ou parcial por engano.
- **O site planeja fechar o bucket do S3** (`docs/cloudfront.md`). Se isso ocorrer, os endereços das fotos no XML param de funcionar e precisam ser refeitos.
- **Não houve teste na própria OLX.** A validação foi feita contra as regras da documentação; dúvidas de integração vão para suporteintegrador@olxbr.com.
- **Os CEPs não estão no banco.** Só existem nestes arquivos, e um novo XML a partir do banco os perderia.
- **Troque as chaves da AWS** usadas nesta geração, porque elas ficaram registradas na conversa com o Claude Code.

## Decisões em aberto

- Incluir algum dos 5 desativados ou dos 3 que nunca entraram no site?
- Corrigir o preço do Bosque das Palmeiras, para ele entrar no XML?
- Enviar os 236 agora ou esperar a redução dos pendentes?
- Guardar o CEP no banco, para o XML poder ser gerado de novo?

## Fontes

- [OLX: XML de imóveis](https://developers.olx.com.br/anuncio/xml/real_estate/home.html)
- [OLX: inserção, edição e remoção por XML](https://developers.olx.com.br/faq/xml_json_insertion.html)
- [OLX: regras de imagens](https://developers.olx.com.br/faq/images.html)
- [ViaCEP](https://viacep.com.br/) e [BrasilAPI](https://brasilapi.com.br/)
- [apto.vc](https://apto.vc/)
