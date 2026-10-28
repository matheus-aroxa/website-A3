# Login do painel administrativo

Administradores, sessões e limite de tentativas ficam no banco (tabelas em `db/schema.sql`). Não há mais
`ADMIN_USUARIOS` nem `ADMIN_SESSAO_SEGREDO`, nem administrador padrão em desenvolvimento.

## Tabelas
- `administradores`: e-mail (único, minúsculo; é o "Usuário" do login), nome, `senha_hash` (bcrypt custo 12 pelo pgcrypto),
  `ativo`, `ultimo_acesso` e `principal` (no máximo um; ver abaixo, migração em `db/administradores.sql`).
- `sessoes_admin`: uma linha por sessão aberta. O cookie leva um token aleatório de 32 bytes; a tabela guarda só o
  SHA-256 dele (vazar a tabela não permite entrar), a validade, o IP e o navegador.
- `tentativas_login`: falhas de login dos últimos 15 minutos.

## Como funciona
- **Senha:** conferida no próprio SQL (`crypt(senha, hash)`). Quando o e-mail não existe ou o administrador está
  inativo, o banco confere contra um hash falso de mesmo custo, então a resposta leva o mesmo tempo
  (não revela quem é administrador).
- **Sessão:** 8 h, ou 30 dias com "Manter conectado". Cookie `httpOnly`, `SameSite=Strict`, `Secure` em produção,
  válido só em `/admin`. O `proxy.ts` confere a sessão no banco a cada navegação do painel e as páginas e Server Actions
  conferem de novo (`src/lib/admin/acesso.ts`).
- **Tentativas:** 8 falhas por IP ou 20 por e-mail em 15 minutos bloqueiam o login (o limite do e-mail é maior para
  ninguém travar o acesso de outra pessoa só errando a senha dela). O login certo apaga as falhas do IP e do e-mail.
- **Encerrar o acesso:** `ativo = false` derruba as sessões do administrador na hora. Sair apaga a sessão do banco.

## Administrador principal
Só o principal cadastra, desativa e reativa os outros administradores, pela página **Administradores** do painel
(`/admin/administradores`). Os demais usam todo o resto do painel, mas não veem o link, são levados de volta ao início
se abrirem o endereço (`src/proxy.ts` e a própria página) e as Server Actions recusam o pedido (`exigirPrincipal`).

- **Cadastrar:** nome, usuário e uma senha de primeiro acesso (10 a 200 caracteres), que o principal repassa à pessoa.
- **Desativar:** o acesso acaba na hora e as sessões abertas são apagadas (reativar não ressuscita sessão antiga).
- O principal não pode ser desativado (restrição `administradores_principal_ativo` no banco). Ao aplicar
  `db/administradores.sql`, o administrador ativo mais antigo vira o principal.
- Tudo fica na tabela `auditoria` (`admin-criar`, `admin-desativar`, `admin-ativar`), com o usuário de quem fez.

## Pelo SQL Editor do Supabase
O primeiro administrador de um banco novo, a troca de senha e a troca do principal continuam sendo feitos aqui.
```sql
-- Cadastrar (use uma senha longa e única)
INSERT INTO administradores (email, nome, senha_hash)
VALUES ('ana@a3solucoes.com.br', 'Ana', extensions.crypt('SENHA-LONGA-AQUI', extensions.gen_salt('bf', 12)));

-- Desativar / reativar
UPDATE administradores SET ativo = false WHERE email = 'ana@a3solucoes.com.br';

-- Trocar a senha (e derrubar as sessões abertas)
UPDATE administradores SET senha_hash = extensions.crypt('NOVA-SENHA', extensions.gen_salt('bf', 12)) WHERE email = 'ana@a3solucoes.com.br';
DELETE FROM sessoes_admin WHERE admin_id = (SELECT id FROM administradores WHERE email = 'ana@a3solucoes.com.br');

-- Passar o papel de principal para outro administrador (ativo)
BEGIN;
UPDATE administradores SET principal = false WHERE principal;
UPDATE administradores SET principal = true WHERE email = 'ana@a3solucoes.com.br';
COMMIT;
```
O e-mail precisa estar em minúsculas e sem espaços. A senha digitada no SQL Editor fica no histórico de consultas
do Supabase: use uma senha de primeiro acesso e troque depois, ou apague o histórico.

## Conferido em teste
Senha certa e errada, e-mail inexistente e administrador inativo (mesmo tempo de resposta), cookie forjado, sessão
gravada só com o hash do token, flags do cookie, desativar derruba a sessão, sessão expirada e bloqueio por tentativas.

## Fora desta versão
Sem fluxo de "esqueci a senha" e sem troca de senha pelo painel. Fora a página de administradores, que é só do
principal, todo administrador tem o mesmo acesso.
