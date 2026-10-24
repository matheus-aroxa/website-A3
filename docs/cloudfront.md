# CloudFront na frente do bucket de fotos

Objetivo: servir as fotos por uma distribuição CloudFront e deixar o bucket `a3-imoveis-fotos` **privado**.
Perfil AWS CLI: `a3`. Região do bucket: `sa-east-1`.

**Estado (24/10/2026): os passos 1 e 2 estão feitos.** A distribuição `E2DHJUYDMMVJN4` (`dbn76pzkb0t3o.cloudfront.net`, sem
domínio próprio) existe e serve as fotos: conferido `200`, `content-type: image/webp`, `x-cache: Hit from cloudfront` a
partir da segunda chamada e redirecionamento de HTTP para HTTPS. A policy do bucket já tem a regra `LeituraPeloCloudFront`.
Faltam o passo 3 (site e banco passarem a usar o endereço do CloudFront) e o passo 4 (fechar o bucket). Enquanto isso o site
serve as fotos direto do S3, sem cache de borda.

## Custo (resumo)
Plano sob demanda, faixa gratuita permanente de 1 TB de saída e 10 milhões de requisições por mês; o tráfego do
S3 para o CloudFront é gratuito. Para dezenas de milhares de visitas por mês o custo esperado é R$ 0. Passando
disso: US$ 0,11/GB e US$ 0,022 a cada 10 mil requisições (América do Sul).

## Ordem segura (sem tirar as fotos do ar)
O bucket só fica privado no último passo. Até lá, o site continua funcionando pelas URLs atuais.

### 1. Criar a distribuição (Console AWS → CloudFront → Create distribution)
- **Plano:** pay-as-you-go (não escolha os planos fixos).
- **Origin:** o bucket `a3-imoveis-fotos` (endpoint REST `…s3.sa-east-1.amazonaws.com`, não o "website endpoint").
- **Origin access:** *Origin access control (OAC)*, assinando as requisições (sigv4, "Always"). Crie o OAC novo.
- **Viewer protocol policy:** Redirect HTTP to HTTPS. **Allowed methods:** GET, HEAD.
- **Cache policy:** `CachingOptimized` (os arquivos já têm `Cache-Control: public, max-age=31536000, immutable`).
- **Compress objects automatically:** ligado.
- **WAF:** desligado (evita custo extra).
- Ao terminar, o console mostra a política de bucket para copiar: **não aplique ainda** (passo 3).
- Anote o domínio `dXXXXXXXXXXXX.cloudfront.net` (ou ligue um domínio próprio, ex.: `fotos.seudominio.com.br`, com
  certificado do ACM **em us-east-1** e um CNAME no DNS; é opcional e gratuito além do domínio).

### 2. Permitir o CloudFront ler o bucket (sem fechar o público)
Acrescente à política atual do bucket (mantendo as regras públicas por enquanto):

```json
{
  "Sid": "AllowCloudFrontRead",
  "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::a3-imoveis-fotos/*",
  "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::<ID_DA_CONTA>:distribution/<ID_DA_DISTRIBUICAO>" } }
}
```

Teste: `curl -I https://dXXXX.cloudfront.net/imoveis/259322/g_20260922160213_0/400.webp` deve responder `200` com
`content-type: image/webp` e, na segunda chamada, `x-cache: Hit from cloudfront`.

### 3. Trocar o endereço no site (código e banco)
Quando o passo 2 funcionar, estes pontos mudam de `a3-imoveis-fotos.s3.sa-east-1.amazonaws.com` para o domínio do CloudFront:
1. `src/lib/imoveis/hosts-fotos.ts`: acrescentar o novo host em `HOSTS_FOTOS` (mantenha o do S3 até o fim).
2. `src/lib/imoveis/carregador-imagem.ts`: `HOST_S3` passa a reconhecer também o novo host (o padrão do nome do arquivo é o mesmo).
3. `src/lib/site.ts`: `URL_IMAGENS` (foto da equipe e `preconnect` do layout raiz).
4. **Banco** (as URLs são usadas também em Open Graph, JSON-LD e sitemap, então a troca precisa ser no dado). Faça um backup antes e rode numa transação:

```sql
BEGIN;
UPDATE fotos SET src = replace(src, 'a3-imoveis-fotos.s3.sa-east-1.amazonaws.com', 'dXXXX.cloudfront.net');
UPDATE imoveis SET original = replace(original::text, 'a3-imoveis-fotos.s3.sa-east-1.amazonaws.com', 'dXXXX.cloudfront.net')::jsonb;
-- conferir: SELECT count(*) FROM fotos WHERE src NOT LIKE 'https://dXXXX.cloudfront.net/%' AND src LIKE 'https://%';
COMMIT;
```

5. Publicar o deploy e invalidar o cache do Next: `POST /api/revalidar` com `Authorization: Bearer <REVALIDATE_SECRET>`.
6. Conferir no navegador (aba Rede) que as fotos vêm do CloudFront, nos cards, no detalhe, na foto ampliada e no hero da home.

### 4. Fechar o bucket
Só depois do passo 3 estável:
1. Em *Permissions → Block public access*, ligar **Block all public access**.
2. Remover da política do bucket as regras públicas (`imoveis/*`, `empreendimentos/*`, `site/*`), deixando só a do CloudFront.
3. Conferir que `https://a3-imoveis-fotos.s3.sa-east-1.amazonaws.com/<foto>` agora dá `403` e que o site segue com as fotos.

## Desfazer
- Antes do passo 4: basta reverter o `UPDATE` (trocar o host de volta) e o código.
- Depois do passo 4: desligar o bloqueio público e restaurar a política pública antiga.

## Observações
- Os arquivos nunca são sobrescritos (nome com o tamanho e pasta por foto), então não é preciso invalidar o cache do CloudFront.
- Com um domínio próprio para as fotos, trocar de CDN no futuro vira só uma mudança de DNS; sem ele, a troca exige repetir o `UPDATE`.
- Os hosts do Supremo seguem liberados em `HOSTS_FOTOS` até ninguém mais depender deles.
