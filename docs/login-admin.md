# Login do painel administrativo

Administradores, sessões e limite de tentativas ficam no banco (tabelas em `db/schema.sql`). Não há mais
`ADMIN_USUARIOS` nem `ADMIN_SESSAO_SEGREDO`, nem administrador padrão em desenvolvimento.

## Tabelas
- `administradores`: e-mail (único, minúsculo), nome, `senha_hash` (bcrypt custo 12 pelo pgcrypto), `ativo`, `ultimo_acesso`.
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

## Cadastrar e manter administradores (SQL Editor do Supabase)
```sql
-- Cadastrar (use uma senha longa e única)
INSERT INTO administradores (email, nome, senha_hash)
VALUES ('ana@a3solucoes.com.br', 'Ana', extensions.crypt('SENHA-LONGA-AQUI', extensions.gen_salt('bf', 12)));

-- Desativar / reativar
UPDATE administradores SET ativo = false WHERE email = 'ana@a3solucoes.com.br';

-- Trocar a senha (e derrubar as sessões abertas)
UPDATE administradores SET senha_hash = extensions.crypt('NOVA-SENHA', extensions.gen_salt('bf', 12)) WHERE email = 'ana@a3solucoes.com.br';
DELETE FROM sessoes_admin WHERE admin_id = (SELECT id FROM administradores WHERE email = 'ana@a3solucoes.com.br');
```
O e-mail precisa estar em minúsculas e sem espaços. A senha digitada no SQL Editor fica no histórico de consultas
do Supabase: use uma senha de primeiro acesso e troque depois, ou apague o histórico.

## Conferido em teste
Senha certa e errada, e-mail inexistente e administrador inativo (mesmo tempo de resposta), cookie forjado, sessão
gravada só com o hash do token, flags do cookie, desativar derruba a sessão, sessão expirada e bloqueio por tentativas.

## Fora desta versão
Sem fluxo de "esqueci a senha", sem tela de usuários e sem papéis: todo administrador tem o mesmo acesso.
