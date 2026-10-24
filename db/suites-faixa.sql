-- Suítes passam a ser uma faixa (mínimo e máximo), como quartos, banheiros e vagas.
-- Aditivo: a coluna antiga `suites` fica no banco, sem uso (nenhum imóvel tinha valor nela quando isto foi aplicado).
BEGIN;

ALTER TABLE imoveis
  ADD COLUMN IF NOT EXISTS suites_min integer,
  ADD COLUMN IF NOT EXISTS suites_max integer;

-- Quem já tinha um número de suítes vira faixa de um valor só.
UPDATE imoveis SET suites_min = suites, suites_max = suites WHERE suites IS NOT NULL AND suites_min IS NULL;

ALTER TABLE imoveis
  ADD CONSTRAINT imoveis_suites_faixa_check
  CHECK (((suites_min IS NULL) = (suites_max IS NULL)) AND (suites_min IS NULL OR (suites_min >= 0 AND suites_min <= suites_max)));

COMMIT;
