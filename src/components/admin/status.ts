'use client'

import { useTransition } from 'react'
import { mudarStatus, type AcaoStatus } from '@/app/admin/acoes'
import type { StatusImovel } from '@/lib/imoveis/painel'
import { useAvisar } from './Avisos'

export const STATUS_APOS: Record<AcaoStatus, StatusImovel> = {
  desativar: 'inativo',
  ativar: 'ativo',
  excluir: 'excluido',
  restaurar: 'ativo',
}

const INVERSA: Record<AcaoStatus, AcaoStatus> = {
  desativar: 'ativar',
  ativar: 'desativar',
  excluir: 'restaurar',
  restaurar: 'excluir',
}

const MENSAGEM: Record<AcaoStatus, (nome: string) => string> = {
  desativar: (nome) => `${nome} foi desativado e saiu do site.`,
  ativar: (nome) => `${nome} voltou para o site.`,
  excluir: (nome) => `${nome} foi excluído e saiu do site.`,
  restaurar: (nome) => `${nome} foi restaurado.`,
}

export const TEXTO_EXCLUSAO =
  'O imóvel sai do site, da busca e da vitrine. Ele fica no filtro Excluídos, caso você queira restaurar, e continua excluído mesmo que o catálogo do CRM seja importado de novo.'

/**
 * Ativar, desativar, excluir e restaurar, com aviso e "Desfazer".
 * `otimista`: atualiza a tela antes da resposta do servidor (a lista usa com useOptimistic).
 */
export function useMudarStatus(otimista?: (id: string, status: StatusImovel) => void) {
  const avisar = useAvisar()
  const [pendente, iniciar] = useTransition()

  function executar(id: string, nome: string, acao: AcaoStatus, comDesfazer = true) {
    iniciar(async () => {
      otimista?.(id, STATUS_APOS[acao])
      try {
        await mudarStatus(id, acao)
      } catch {
        avisar('Não foi possível salvar. Confira a conexão e tente de novo.', { erro: true })
        return
      }
      avisar(MENSAGEM[acao](nome), comDesfazer ? { desfazer: () => executar(id, nome, INVERSA[acao], false) } : undefined)
    })
  }

  return { executar, pendente }
}
