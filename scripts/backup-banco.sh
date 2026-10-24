#!/usr/bin/env bash
# Backup do banco (schema public) em ~/backups/website-A3, ou na pasta dada como argumento. Uso: npm run backup
# Gera três arquivos: .dump (completo, o que se restaura com pg_restore), .sql (o mesmo, em texto) e a estrutura sozinha.
# Precisa de Docker (usa o pg_dump 17 da imagem do Supabase) e de DATABASE_URL (do .env.local ou do ambiente).
# Restaurar: docs/backup-banco.md.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi
: "${DATABASE_URL:?Defina DATABASE_URL (veja .env.example).}"
case "$DATABASE_URL" in
  *:6543/*) echo "DATABASE_URL usa o pooler em modo transaction (porta 6543), que não serve para pg_dump." >&2
            echo "Use a conexão direta (db.<projeto>.supabase.co:5432) ou o pooler em modo session (porta 5432)." >&2
            exit 1 ;;
esac
export DATABASE_URL

destino="${1:-$HOME/backups/website-A3}"
imagem="${PG_IMAGEM:-public.ecr.aws/supabase/postgres:17.6.1.156}"
carimbo="$(date +%F_%H%M)"
mkdir -p "$destino"
chmod 700 "$destino"

# --network host: a conexão direta do Supabase só tem IPv6, que a rede padrão do Docker não alcança.
dump() { # $1 = arquivo, demais = opções do pg_dump
  local arquivo="$1"; shift
  docker run --rm --network host -e DATABASE_URL --user "$(id -u):$(id -g)" -v "$destino":/backup --entrypoint pg_dump \
    "$imagem" "$DATABASE_URL" --schema=public --no-owner --no-acl "$@" -f "/backup/$arquivo"
}

dump "a3-banco_$carimbo.dump" --format=custom --compress=9
dump "a3-banco_$carimbo.sql" --format=plain
dump "a3-schema_$carimbo.sql" --format=plain --schema-only

# Estes arquivos têm o hash da senha dos administradores e o histórico do painel: só o dono lê.
chmod 600 "$destino/a3-banco_$carimbo".* "$destino/a3-schema_$carimbo.sql"
(cd "$destino" && sha256sum "a3-banco_$carimbo.dump" "a3-banco_$carimbo.sql" "a3-schema_$carimbo.sql" | tee -a SHA256SUMS.txt)
echo "Backup pronto em $destino"
