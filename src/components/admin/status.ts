'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { excluirImovel, mudarStatus, type AcaoStatus } from '@/app/admin/acoes'
import type { StatusImovel } from '@/lib/imoveis/painel'
import { useAvisar } from './Avisos'

export const STATUS_APOS: Record<AcaoStatus, StatusImovel> = {
  desativar: 'inativo',
  ativar: 'ativo',
}

const INVERSA: Record<AcaoStatus, AcaoStatus> = {
  desativar: 'ativar',
  ativar: 'desativar',
}

const MENSAGEM: Record<AcaoStatus, (nome: string) => string> = {
  desativar: (nome) => `${nome} foi desativado e saiu do site.`,
  ativar: (nome) => `${nome} voltou para o site.`,
}

export const TEXTO_EXCLUSAO =
  'O imóvel será apagado definitivamente do banco de dados, junto com todas as fotos dele no S3 (originais e tamanhos). Isso não pode ser desfeito. Para só tirá-lo do site, use Desativar.'

/**
 * Desativar e ativar (com aviso e "Desfazer") e excluir de vez.
 * `otimista`: atualiza a tela antes da resposta do servidor (a lista usa com useOptimistic); `null` é imóvel excluído.
 */
export function useMudarStatus(otimista?: (id: string, status: StatusImovel | null) => void) {
  const avisar = useAvisar()
  const router = useRouter()
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

  /** Exclusão definitiva (sem "Desfazer"). `aoExcluir` roda depois que o servidor confirma; sem ele a página é atualizada. */
  function excluir(id: string, nome: string, aoExcluir?: () => void) {
    iniciar(async () => {
      otimista?.(id, null)
      try {
        const r = await excluirImovel(id)
        if (!r.ok) throw new Error('imóvel não encontrado')
        if (r.falhas) avisar(`${nome} foi excluído, mas algumas fotos não puderam ser apagadas do S3.`, { erro: true })
        else avisar(`${nome} foi excluído definitivamente.`)
      } catch {
        avisar('Não foi possível excluir. Confira a conexão e tente de novo.', { erro: true })
        router.refresh()
        return
      }
      if (aoExcluir) aoExcluir()
      else router.refresh()
    })
  }

  return { executar, excluir, pendente }
}
