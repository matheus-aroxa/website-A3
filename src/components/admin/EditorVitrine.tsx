'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { salvarVitrine, usarVitrineDoCrm } from '@/app/admin/acoes'
import { Icone } from '@/components/ui/Icone'
import { Seletor } from '@/components/ui/Seletor'
import type { OpcaoVitrine } from '@/lib/admin/catalogo'
import { ESTADO_INICIAL } from '@/lib/formularios'
import type { Vitrine } from '@/lib/imoveis/ajustes'
import { useAvisar } from './Avisos'
import { Confirmacao, type PedidoConfirmacao } from './Confirmacao'
import { Secao } from './TopoPagina'
import s from './Admin.module.css'

const rotulo = (o: OpcaoVitrine) => `${o.nome} — ${o.bairro}, ${o.cidade} (cód. ${o.codigo})`

/** Miniatura do topo da home no celular: título, foto grande e o cartão do imóvel por cima. */
function PreviaTopo({ imovel }: { imovel?: OpcaoVitrine }) {
  return (
    <div className={s.previaTopo}>
      <strong className={s.previaTopoTitulo}>
        Seu lar <span>está aqui.</span>
      </strong>
      {imovel?.foto ? (
        <div className={s.previaTopoMidia}>
          <div className={s.previaTopoFoto}>
            <Image src={imovel.foto} alt="" fill sizes="(max-width: 767px) 90vw, 420px" />
          </div>
          <span className={s.previaTopoCartao}>
            {imovel.capa && <Image src={imovel.capa} alt="" width={40} height={40} />}
            <span>
              <span className={s.previaTopoRotulo}>
                {imovel.etiqueta} · {imovel.bairro}
              </span>
              <strong>{imovel.nome}</strong>
              <span>
                {imovel.rotuloPreco} <b>{imovel.preco}</b>
              </span>
            </span>
          </span>
        </div>
      ) : (
        <p className={s.previaTopoVazio}>O topo mostra o destaque mais recente.</p>
      )}
    </div>
  )
}

export function EditorVitrine({
  inicial,
  opcoes,
  limite,
  personalizada,
}: {
  inicial: Vitrine
  opcoes: OpcaoVitrine[]
  limite: number
  personalizada: boolean
}) {
  const avisar = useAvisar()
  const [salvando, iniciar] = useTransition()
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null)
  const [heroi, setHeroi] = useState(inicial.heroi ?? '')
  const [destaques, setDestaques] = useState(inicial.destaques)
  const [novo, setNovo] = useState('')
  // Se a vitrine mudar no servidor (salvou ou voltou a usar o CRM), a tela acompanha.
  const [anterior, setAnterior] = useState(inicial)
  if (JSON.stringify(anterior) !== JSON.stringify(inicial)) {
    setAnterior(inicial)
    setHeroi(inicial.heroi ?? '')
    setDestaques(inicial.destaques)
  }

  const porId = new Map(opcoes.map((o) => [o.id, o]))
  const sujo = heroi !== (inicial.heroi ?? '') || JSON.stringify(destaques) !== JSON.stringify(inicial.destaques)
  const cheio = destaques.length >= limite

  const mover = (de: number, para: number) =>
    setDestaques((lista) => {
      const copia = [...lista]
      const [id] = copia.splice(de, 1)
      copia.splice(para, 0, id!)
      return copia
    })

  function salvar() {
    const dados = new FormData()
    dados.set('heroi', heroi)
    destaques.forEach((id) => dados.append('destaques', id))
    iniciar(async () => {
      const r = await salvarVitrine(ESTADO_INICIAL, dados).catch(() => null)
      if (r?.status === 'sucesso') avisar('Vitrine salva e publicada na home.')
      else avisar(r?.mensagem ?? 'Não foi possível salvar. Confira a conexão e tente de novo.', { erro: true })
    })
  }

  return (
    <>
      <div className={s.nota}>
        <Icone nome="historico" tamanho={20} />
        <div>
          {personalizada ? (
            <>
              <p>
                <strong>A vitrine está sendo definida aqui no painel.</strong> As marcações de destaque do CRM são ignoradas.
              </p>
              <button
                type="button"
                className={s.limpar}
                onClick={() =>
                  setPedido({
                    titulo: 'Voltar a usar o CRM?',
                    texto: 'A escolha feita aqui é apagada e a home volta a mostrar os imóveis marcados como destaque no CRM.',
                    rotulo: 'Usar os destaques do CRM',
                    icone: 'restaurar',
                    aoConfirmar: () =>
                      iniciar(async () => {
                        await usarVitrineDoCrm()
                        avisar('A home voltou a usar os destaques do CRM.')
                      }),
                  })
                }
              >
                Voltar a usar os destaques do CRM
              </button>
            </>
          ) : (
            <p>
              <strong>A vitrine atual vem do CRM.</strong> Ao salvar aqui, ela passa a ser definida pelo painel.
            </p>
          )}
        </div>
      </div>

      <Secao icone={<Icone nome="casa" />} titulo="Topo da home" descricao="O imóvel com foto grande ao lado de “Seu lar está aqui.”">
        <div className={s.vitrineBloco}>
          <div className={s.rotulo}>
            <span id="rotulo-heroi">Imóvel do topo</span>
            <Seletor
              aria-label="Imóvel do topo da home"
              valor={heroi}
              aoMudar={setHeroi}
              opcoes={[{ valor: '', rotulo: 'Automático (o destaque mais recente)' }, ...opcoes.map((o) => ({ valor: o.id, rotulo: rotulo(o) }))]}
            />
          </div>
          <div className={s.previa}>
            <span className={s.legenda}>Como aparece no celular</span>
            <PreviaTopo imovel={porId.get(heroi)} />
          </div>
        </div>
      </Secao>

      <Secao
        icone={<Icone nome="estrela" />}
        titulo="Imóveis em destaque"
        descricao="Aparecem na home, nesta ordem."
        extra={
          <span className={s.contador} data-cheio={cheio || undefined}>
            {destaques.length} de {limite}
          </span>
        }
      >
        <ol className={s.destaques}>
          {destaques.map((id, i) => {
            const o = porId.get(id)
            return (
              <li key={id} className={s.destaque}>
                <div className={s.destaqueTopo}>
                  <span className={s.ordem}>{i + 1}</span>
                  <div className={s.destaqueFoto}>{o?.capa && <Image src={o.capa} alt="" fill sizes="72px" />}</div>
                  <div className={s.destaqueTexto}>
                    <strong>{o?.nome ?? id}</strong>
                    <span>{o && `${o.bairro}, ${o.cidade}`}</span>
                  </div>
                </div>
                <div className={s.destaqueBotoes}>
                  <button type="button" className={s.quadrado} onClick={() => mover(i, i - 1)} disabled={i === 0} aria-label={`Subir ${o?.nome}`}>
                    <Icone nome="seta-cima" tamanho={18} espessura={2} />
                  </button>
                  <button
                    type="button"
                    className={s.quadrado}
                    onClick={() => mover(i, i + 1)}
                    disabled={i === destaques.length - 1}
                    aria-label={`Descer ${o?.nome}`}
                  >
                    <Icone nome="seta-baixo" tamanho={18} espessura={2} />
                  </button>
                  <button
                    type="button"
                    className={`${s.botao} ${s.botaoPerigo}`}
                    onClick={() => {
                      const antes = destaques
                      setDestaques(destaques.filter((d) => d !== id))
                      avisar(`${o?.nome ?? 'O imóvel'} saiu dos destaques.`, { desfazer: () => setDestaques(antes) })
                    }}
                  >
                    <Icone nome="fechar" tamanho={15} espessura={2.2} /> Remover
                  </button>
                </div>
              </li>
            )
          })}
        </ol>

        {!cheio && (
          <div className={s.adicionarDestaque}>
            <span>Destaque {destaques.length + 1}</span>
            <Seletor
              aria-label="Escolher imóvel para destacar"
              valor={novo}
              aoMudar={setNovo}
              opcoes={[
                { valor: '', rotulo: 'Escolha um imóvel publicado…' },
                ...opcoes.filter((o) => !destaques.includes(o.id)).map((o) => ({ valor: o.id, rotulo: rotulo(o) })),
              ]}
            />
            <button
              type="button"
              className={`${s.botao} ${s.botaoMar} ${s.botaoG}`}
              disabled={!novo}
              onClick={() => {
                setDestaques([...destaques, novo])
                setNovo('')
              }}
            >
              <Icone nome="mais" tamanho={16} espessura={2.2} /> Adicionar à vitrine
            </button>
          </div>
        )}

        <div className={s.previa}>
          <span className={s.legenda}>Como aparece na home</span>
          {destaques.length ? (
            <div className={s.previaDestaques}>
              {Array.from({ length: limite }, (_, i) => {
                const o = porId.get(destaques[i] ?? '')
                return o ? (
                  <div key={o.id} className={s.miniCard}>
                    <div className={s.miniCardFoto}>
                      {o.capa && <Image src={o.capa} alt="" fill sizes="210px" />}
                      <span className={`etiqueta etiqueta-${o.classeEtiqueta} ${s.etiquetaP}`}>{o.etiqueta}</span>
                    </div>
                    <div className={s.miniCardTexto}>
                      <strong>{o.nome}</strong>
                      <span>{o.rotuloPreco}</span>
                      <b>{o.preco}</b>
                    </div>
                  </div>
                ) : (
                  <div key={`livre-${i}`} className={`${s.miniCard} ${s.miniCardLivre}`}>
                    <Icone nome="mais" tamanho={20} espessura={2} />
                    Espaço livre
                  </div>
                )
              })}
            </div>
          ) : (
            <p className={s.previaVazia}>Sem destaques, a seção “Imóveis em destaque” não aparece na home.</p>
          )}
        </div>
      </Secao>

      {sujo && (
        <div className={s.barraSalvar} data-barra-salvar>
          <div className={s.barraSalvarConteudo}>
            <span className={s.barraEstado}>
              <span className={s.ponto} data-sujo aria-hidden="true" />A vitrine mudou. Salve para atualizar a home.
            </span>
            <div className={s.barraBotoes}>
              <button
                type="button"
                className={`${s.botao} ${s.botaoLinha} ${s.botaoG}`}
                disabled={salvando}
                onClick={() => {
                  setHeroi(inicial.heroi ?? '')
                  setDestaques(inicial.destaques)
                  setNovo('')
                  avisar('Alterações descartadas.')
                }}
              >
                Descartar
              </button>
              <button type="button" className={`${s.botao} ${s.botaoSol} ${s.botaoG}`} disabled={salvando} onClick={salvar}>
                <Icone nome="check" tamanho={17} espessura={2.4} />
                {salvando ? 'Salvando…' : 'Salvar vitrine'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Confirmacao pedido={pedido} aoFechar={() => setPedido(null)} />
    </>
  )
}
