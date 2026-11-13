-- Vitrine da home com os imóveis da Viniun (docs/integracao-viniun.md).
-- As tabelas da vitrine guardam o id do imóvel no site. Os que vieram do banco antigo mantêm o id de lá; os cadastrados
-- direto na Viniun têm id "v<id da Viniun>" e não existem na tabela imoveis. Sem esta mudança, escolher um desses na
-- vitrine do painel falha (chave estrangeira). Um imóvel que sai da Viniun some da home sozinho (o site ignora o id).
-- No modo banco nada muda: excluir um imóvel pelo painel continua tirando-o da vitrine (banco.ts faz isso à mão).
--
-- Como aplicar: Supabase > SQL Editor > colar e rodar. Pode rodar de novo.
-- Para desfazer (só se todos os ids da vitrine existirem em imoveis):
--   ALTER TABLE public.vitrine_config ADD CONSTRAINT vitrine_config_heroi_id_fkey FOREIGN KEY (heroi_id) REFERENCES public.imoveis(id) ON DELETE SET NULL;
--   ALTER TABLE public.vitrine_destaques ADD CONSTRAINT vitrine_destaques_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id) ON DELETE CASCADE;
BEGIN;

ALTER TABLE public.vitrine_config DROP CONSTRAINT IF EXISTS vitrine_config_heroi_id_fkey;
ALTER TABLE public.vitrine_destaques DROP CONSTRAINT IF EXISTS vitrine_destaques_imovel_id_fkey;

COMMIT;
