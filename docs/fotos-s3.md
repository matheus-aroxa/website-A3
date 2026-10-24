# Fotos no S3: decisões e como funciona

Objetivo: tirar a dependência do Supremo (CDN externo) e servir as fotos do catálogo da AWS.
Feito por etapas. Este arquivo registra o que foi decidido e o estado de cada etapa.

## Decisões

| Tema | Decisão |
|---|---|
| Bucket | `a3-imoveis-fotos`, região `sa-east-1`, perfil AWS CLI `a3` |
| Organização | Uma pasta por registro, pelo id do Supremo, e uma subpasta por foto (nome do arquivo no Supremo, sem extensão) |
| Tipos | `imoveis/` (imóveis avulsos) e `empreendimentos/` ficam separados porque os ids podem coincidir |
| Originais | Guardados sem alteração (`original.jpg`/`.png`): é o que não dá para recuperar quando as fotos saírem do Supremo |
| Tamanhos | `400.webp` (cards, listas, miniaturas do painel), `800.webp` (hero, galeria em coluna) e `1600.webp` (foto ampliada). WebP, qualidade 78 (400) e 80 (800 e 1600), só limitando a largura, sem cortar |
| Fotos pequenas | Nunca ampliadas. Só há 800/1600 se o original for maior que o tamanho anterior (~1.000 fotos têm menos de 1600px; 34 têm menos de 800px) |
| Cache | `Cache-Control: public, max-age=31536000, immutable` em tudo; os arquivos nunca são sobrescritos |
| Acesso | Público somente para leitura (`s3:GetObject`) nas pastas `imoveis/*` e `empreendimentos/*`. Listagem do bucket negada. CloudFront fica para depois |
| Fotos quebradas | As 8 fotos do Villa das Laranjeiras (19191) que davam 404 no Supremo foram **removidas**. Ele ficou com 3 fotos |
| Tamanho gravado no banco | `fotos.src` aponta para `1600.webp`; se não existir, `800.webp`, depois `400.webp`. O `next/image` reduz para cada tela |
| Imagens institucionais | Ficam em `site/` no mesmo bucket (leitura pública liberada para `site/*`). Nome com hash do conteúdo e cache eterno: ao trocar uma imagem, suba outra e mude o endereço em `imagensSite` (`src/lib/site.ts`). Hoje: foto da equipe ("Quem somos" da home). Seguem pelo otimizador do Next (sem loader próprio) |
| Host liberado no site | `a3-imoveis-fotos.s3.sa-east-1.amazonaws.com` em `HOSTS_FOTOS` (`src/lib/imoveis/hosts-fotos.ts`), que alimenta `next.config.ts` e a validação do painel. Os hosts do Supremo continuam liberados |
| Capa | A capa de cada imóvel é a mesma que o site já usava: a primeira foto da galeria (posição 0). Foi marcada explicitamente em `fotos.capa` (uma por imóvel); trocar a capa é mudar essa marcação, sem tocar no S3. O tamanho usado na capa é o mais conveniente por uso (400 nos cards, 800/1600 no hero), a definir na etapa do tamanho por uso |
| Tamanho por uso | Loader do `next/image` (`carregador-imagem.ts`, passado em `loader={carregadorImagem}` nas imagens de imóveis; não é global): para fotos do S3 escolhe o menor tamanho (400/800/1600) que cobre a largura pedida pelo componente (`sizes` × densidade da tela), nunca maior que o gravado em `fotos.src`, e aponta direto para o S3, sem passar pelo otimizador do Next. Imagens que não são do S3 (uploads do painel em `/fotos/`, imagens estáticas) seguem pelo otimizador padrão. Na prática: cards/listas/miniaturas → 400, hero/galeria em celular → 800, telas grandes e foto ampliada → 1600 |
| `crm_fotos` | Não foi alterada: é a réplica fiel do export do Supremo |

## Estrutura no bucket

```
imoveis/259322/g_20260922160213_0/
  original.png   400.webp   800.webp   1600.webp
empreendimentos/45578/g_p1k32gcv1r1m161qh176c18mm1goaa/
  original.png   400.webp   800.webp   1600.webp
```

URL pública: `https://a3-imoveis-fotos.s3.sa-east-1.amazonaws.com/<caminho>`

## Estado

- [x] Originais enviados (4.988 de 4.996; as 8 restantes deram 404)
- [x] Tamanhos 400/800/1600 gerados
- [x] Bucket público para leitura
- [x] Banco atualizado: `fotos.src` (4.720 fotos) e `imoveis.original` (337 imóveis) apontam para o S3
- [x] Host do S3 liberado no site
- [x] Capas marcadas em `fotos.capa`: a primeira foto de cada imóvel, igual ao que o site já mostrava
- [x] Seleção/troca da capa no painel: selo "Capa" na foto escolhida e estrela para trocar, independente da ordem da galeria (`FormularioImovel.tsx`, `acoes.ts`)
- [x] Tamanho certo por uso: loader do `next/image` (`src/lib/imoveis/carregador-imagem.ts`), passado como `loader={carregadorImagem}` em cada imagem do catálogo
- [ ] CloudFront na frente do bucket (trocar só o domínio)
- [x] Uploads do painel vão para o S3 (original + 400/800/1600), na mesma estrutura do catálogo (seção abaixo)

## Envio de fotos pelo painel

`POST /admin/enviar-foto` (`src/app/admin/enviar-foto/route.ts`, lógica em `src/lib/admin/fotos.ts`), uma foto por requisição:

1. Confere o formato pelo conteúdo do arquivo (JPG, PNG ou WebP, até 15 MB). Outra coisa é recusada com 415.
2. Grava o **original sem alteração** como `original.jpg|png|webp` e gera `400.webp` (qualidade 78), `800.webp` e `1600.webp` (80), limitando só a largura. A rotação do celular (EXIF) é aplicada nos tamanhos. Não amplia: o 800 só existe se o original for mais largo que 400, e o 1600 só se for mais largo que 800.
3. Pasta: `imoveis/<id>/g_<AAAAMMDDHHMMSS>_<código>/`. Imóvel do CRM reaproveita a pasta onde as fotos dele já estão (`imoveis/` ou `empreendimentos/`). Imóvel novo usa `imoveis/A3-…`: o formulário gera o id no primeiro envio e o manda de volta ao cadastrar (`criarImovel`), então as fotos já nascem na pasta definitiva. A hora no nome da pasta é UTC.
4. Mesmos cabeçalhos do resto do bucket (`Cache-Control: public, max-age=31536000, immutable`, `Content-Type` certo).
5. Devolve o endereço do maior tamanho gerado, que é o que o formulário guarda em `fotos.src` (o loader do `next/image` escolhe o tamanho por tela, como nas demais fotos).

Credenciais: variáveis `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION` (na Vercel) ou `AWS_PROFILE=a3` (local). O usuário IAM do site precisa de `s3:PutObject` e `s3:DeleteObject` em `arn:aws:s3:::a3-imoveis-fotos/imoveis/*` e `arn:aws:s3:::a3-imoveis-fotos/empreendimentos/*`, e de `s3:ListBucket` em `arn:aws:s3:::a3-imoveis-fotos` (a exclusão lista a pasta para apagar tudo que há nela). `S3_FOTOS_BUCKET` troca o bucket (padrão `a3-imoveis-fotos`).

## Apagar fotos e imóveis

Excluir é definitivo; **desativar** é o que tira o imóvel do site mas permite restaurar (Reativar). Não existe mais status "excluído" nem a aba de excluídos.

- **Excluir imóvel** (`excluirImovel` em `src/app/admin/acoes.ts`, com confirmação): apaga o imóvel do banco (fotos, plantas e lugar na vitrine saem junto) e depois as imagens do S3. Se a pasta do S3 tem o id do imóvel (`imoveis/<id>/`, `empreendimentos/<id>/`), apaga a pasta inteira; senão, só a pasta de cada foto dele. O banco vai primeiro: se o S3 falhar, o imóvel já saiu do site e o aviso diz que sobraram fotos. A auditoria guarda a ação `excluir` com id, nome e código.
- **Apagar foto** (botão da galeria, com confirmação): se a foto já estava salva, ela só sai da galeria e é apagada do S3 **quando o imóvel é salvo** (até lá o site ainda a usa). Se foi enviada nesta edição e nunca salva, é apagada do S3 na hora (`DELETE /admin/enviar-foto`). "Limpar formulário" também apaga as fotos enviadas e não salvas.
- Travas (`src/lib/admin/fotos.ts`): só se apaga uma pasta de foto (`<tipo>/<id>/g_…/`) ou a pasta inteira de um imóvel que acabou de sair do banco; nada fora de `imoveis/` e `empreendimentos/`; e nada que outro imóvel do banco ainda use.
- Fotos de fora do bucket (hosts do Supremo, arquivos locais em `/fotos/`) nunca são apagadas.

Cuidados:
- Sair da página sem salvar depois de enviar fotos deixa esses arquivos órfãos no S3 (o navegador não consegue apagá-los ao fechar). Nada aponta para eles.
- Na Vercel, o corpo de uma requisição tem limite de 4,5 MB: fotos maiores que isso falham antes de chegar à rota (o formulário avisa que a foto é grande demais). Para aceitar os 15 MB seria preciso enviar direto do navegador ao S3 (URL pré-assinada).
- As fotos gravadas em disco antes do S3 (`ADMIN_DADOS_DIR/fotos`, servidas por `/fotos/`) continuam sendo lidas, mas nenhum envio novo vai para lá.

## Scripts

Todos usam o AWS CLI com o perfil `a3` e podem ser rodados de novo sem duplicar nada.

| Script | O que faz |
|---|---|
| `scripts/enviar-fotos-s3.mjs` | Baixa as fotos de `a3_painel_supremo.json` e envia os originais. Grava `dados/fotos-s3.json` (URL antiga → chave no S3). Opções: `--dry-run`, `--id N` |
| `scripts/gerar-miniaturas-s3.mjs` | Gera 400/800/1600 a partir dos originais que estão no S3 (usa `sharp`). Opções: `--dry-run`, `--id N` |
| `scripts/migrar-fotos-banco.mjs` | Troca os links no banco numa transação. Opções: `--dry-run` (mostra e desfaz), `--reverter` (restaura dos backups) |

Rodar o de banco: `node --env-file=.env.local scripts/migrar-fotos-banco.mjs`.

## Banco

- `fotos.src`: links usados pelo site.
- `imoveis.original` (jsonb) e `imoveis.editado`: eram usados pelo "descartar edições" do painel, que foi removido. O painel não lê nem grava mais essas colunas (seguem no banco).
- Backups criados pela migração, uma só vez: `fotos_backup_supremo` e `imoveis_original_backup`. Para desfazer: `scripts/migrar-fotos-banco.mjs --reverter`.

## Cuidados

- `db/popular_site.sql` e `db/popular_crm.sql` ainda têm os links do Supremo. Recarregar o catálogo por eles traz de volta os links antigos. Rode `migrar-fotos-banco.mjs` depois, ou regenere os arquivos.
- `dados/fotos-s3.json` é o mapa URL antiga → S3. Está em `dados/`, que é ignorado pelo git; guarde uma cópia se for apagar a pasta.
- Páginas já em cache no Next só mostram as novas fotos depois de `POST /api/revalidar` (ver `src/app/api/revalidar/route.ts`) ou de um novo deploy.
- Se o bucket for apagado ou ficar privado de novo, todas as fotos do site quebram.
- A capa é independente da ordem: trocá-la no painel não reordena a galeria. Se a foto da capa for removida, vale a primeira.
