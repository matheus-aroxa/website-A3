'use client'

import Image from 'next/image'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { flushSync } from 'react-dom'
import { criarImovel, listarLocais, salvarImovel } from '@/app/admin/acoes'
import logoMcmv from '@/assets/marca/logo-mcmv.png'
import { CampoComSugestoes } from '@/components/ui/CampoComSugestoes'
import { Icone } from '@/components/ui/Icone'
import { MapaEstatico } from '@/components/ui/MapaEstatico'
import { Seletor } from '@/components/ui/Seletor'
import { ESTADO_INICIAL, type EstadoFormulario } from '@/lib/formularios'
import { novoIdCriado, type StatusImovel } from '@/lib/imoveis/painel'
import {
  SITUACOES,
  TIPOS,
  formatarArea,
  formatarFaixa,
  formatarQuartos,
  formatarSuites,
  formatarVagas,
  lerNumeroBr,
  rotuloSituacao,
  rotuloTipo,
} from '@/lib/imoveis/formato'
import { urlImovel } from '@/lib/imoveis/rotas'
import type { Faixa, Imovel } from '@/lib/imoveis/tipos'
import type { ConstrutoraAdmin } from '@/lib/imoveis/construtoras'
import type { LocaisDoEstado } from '@/lib/imoveis/locais'
import { ESTADOS, LIMITES, validarImovel } from '@/lib/imoveis/validacao'
import { useAvisar } from './Avisos'
import { Confirmacao, type PedidoConfirmacao } from './Confirmacao'
import { TEXTO_EXCLUSAO, useMudarStatus } from './status'
import { Secao } from './TopoPagina'
import s from './Admin.module.css'
import carregadorImagem from '@/lib/imoveis/carregador-imagem'

// ---------- Valores do formulário (tudo texto, como nos campos) ----------

interface Valores {
  nome: string
  chamada: string
  tipo: string
  finalidade: string
  situacao: string
  mcmv: boolean
  preco: string
  areaMin: string
  areaMax: string
  quartosMin: string
  quartosMax: string
  suitesMin: string
  suitesMax: string
  banheirosMin: string
  banheirosMax: string
  vagasMin: string
  vagasMax: string
  entregaMes: string
  entregaAno: string
  unidades: string
  /** Id da construtora; vazio só no cadastro, até o formulário receber a padrão. */
  construtoraId: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  descricao: string
  lazer: string
  proximidades: string
  fotos: string[]
  /** Foto dos cards (src). Vazio ou fora da lista: vale a primeira. */
  capa: string
}

const numeroBr = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const formatar = (n: number | undefined) => (n === undefined ? '' : numeroBr.format(n))

/** Preço no campo, sempre com os centavos: "265.000,00", "265.000,50". */
function precoTexto(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** `vagasZero`: cadastro novo, em que as vagas já começam em 0 ("sem vaga") em vez de "a consultar". */
function valoresDe(im: Imovel, vagasZero = false, construtoraPadrao = ''): Valores {
  const [ano = '', mes = ''] = im.entrega?.split('-') ?? []
  return {
    nome: im.nome,
    chamada: im.chamada,
    tipo: im.tipo,
    finalidade: im.finalidade,
    situacao: im.situacao,
    mcmv: im.mcmv,
    preco: im.preco ? precoTexto(im.preco) : '',
    areaMin: im.area.min ? formatar(im.area.min) : '',
    areaMax: im.area.max ? formatar(im.area.max) : '',
    quartosMin: formatar(im.quartos.min),
    quartosMax: formatar(im.quartos.max),
    suitesMin: im.suites ? formatar(im.suites.min) : '',
    suitesMax: im.suites ? formatar(im.suites.max) : '',
    banheirosMin: formatar(im.banheiros.min),
    banheirosMax: formatar(im.banheiros.max),
    vagasMin: im.vagas || !vagasZero ? formatar(im.vagas?.min) : '0',
    vagasMax: im.vagas || !vagasZero ? formatar(im.vagas?.max) : '0',
    entregaMes: mes,
    entregaAno: ano,
    unidades: im.unidades ?? '',
    construtoraId: im.construtora.id ? String(im.construtora.id) : construtoraPadrao,
    logradouro: im.local.logradouro ?? '',
    bairro: im.local.bairro,
    cidade: im.local.cidade,
    uf: im.local.uf,
    descricao: im.descricao.join('\n'),
    lazer: im.lazer.join('\n'),
    proximidades: im.proximidades.join('\n'),
    fotos: im.fotos.map((f) => f.src),
    capa: (im.capa ?? im.fotos[0])?.src ?? '',
  }
}

/** Ponto de partida do cadastro: escolhas comuns já marcadas, o resto em branco. */
const IMOVEL_VAZIO: Imovel = {
  id: '',
  codigo: '',
  slug: '',
  nome: '',
  tipo: 'apartamento',
  finalidade: 'venda',
  situacao: SITUACOES[0]!, // a primeira opção da lista, a mesma que aparece marcada primeiro no formulário
  local: { bairro: '', bairroSlug: '', cidade: '', cidadeSlug: '', uf: 'PE' },
  preco: 0,
  area: { min: 0, max: 0 },
  quartos: { min: 0, max: 0 },
  banheiros: { min: 0, max: 0 },
  vagas: null,
  construtora: { id: 0, nome: '', slug: '' },
  mcmv: false,
  destaque: false,
  publicadoEm: '',
  atualizadoEm: '',
  chamada: '',
  descricao: [],
  fotos: [],
  plantas: [],
  lazer: [],
  proximidades: [],
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const ANO_ATUAL = new Date().getFullYear()

function opcoesAno(atual: string) {
  const anos = Array.from({ length: 13 }, (_, i) => String(ANO_ATUAL - 2 + i))
  if (atual && !anos.includes(atual)) anos.unshift(atual)
  return [{ valor: '', rotulo: 'Ano' }, ...anos.map((a) => ({ valor: a, rotulo: a }))]
}

const OPCOES_MES = [{ valor: '', rotulo: 'Sem previsão' }, ...MESES.map((m, i) => ({ valor: String(i + 1).padStart(2, '0'), rotulo: m }))]

const contarLinhas = (texto: string) => texto.split('\n').filter((l) => l.trim()).length
const itens = (n: number) => `${n} ${n === 1 ? 'item' : 'itens'}`

// ---------- Campos ----------

function Campo({
  texto,
  campo,
  erros,
  dica,
  extra,
  className,
  children,
}: {
  texto: string
  campo: string
  erros?: EstadoFormulario['erros']
  dica?: ReactNode
  extra?: ReactNode
  className?: string
  children: ReactNode
}) {
  const erro = erros?.[campo]
  return (
    <label className={`${s.rotulo} ${className ?? ''}`}>
      <span>
        {texto}
        {extra && <span className={s.dica}> · {extra}</span>}
      </span>
      {children}
      {dica && <span className={s.dica}>{dica}</span>}
      {erro && (
        <span className="erro-campo" id={`erro-${campo}`}>
          {erro}
        </span>
      )}
    </label>
  )
}

const invalido = (erros: EstadoFormulario['erros'], campo: string) =>
  erros?.[campo] ? { 'aria-invalid': true as const, 'aria-describedby': `erro-${campo}` } : {}

/** Entrada de número com adendos colados (prefixo e/ou sufixo): "R$ 265.000 ,00", "De 50,84 m²". Só dígitos, vírgula e ponto. */
function EntradaNumero({
  campo,
  v,
  mudar,
  erros,
  inteiro,
  prefixo,
  sufixo,
  aoSair,
  rotulo,
}: {
  campo: keyof Valores
  v: Valores
  mudar: (campo: keyof Valores, valor: string) => void
  erros: EstadoFormulario['erros']
  inteiro?: boolean
  prefixo?: string
  sufixo?: string
  aoSair?: () => void
  rotulo?: string
}) {
  return (
    <span className={s.prefixo} data-invalido={erros?.[campo] ? true : undefined}>
      {prefixo && <b>{prefixo}</b>}
      <input
        name={campo}
        aria-label={rotulo}
        inputMode={inteiro ? 'numeric' : 'decimal'}
        autoComplete="off"
        maxLength={14}
        value={v[campo] as string}
        onChange={(e) => mudar(campo, e.target.value.replace(inteiro ? /[^\d]/g : /[^\d.,]/g, ''))}
        onBlur={aoSair}
        {...invalido(erros, campo)}
      />
      {sufixo && <b>{sufixo}</b>}
    </span>
  )
}

/** Formata o que foi digitado como preço: milhar com ponto, vírgula e até duas casas ("1.234.567,5"). */
function formatarPrecoDigitado(bruto: string) {
  const virgula = bruto.indexOf(',')
  const digitos = (virgula < 0 ? bruto : bruto.slice(0, virgula)).replace(/\D/g, '')
  const inteiro = digitos ? Number(digitos).toLocaleString('pt-BR') : virgula >= 0 ? '0' : ''
  return virgula < 0 ? inteiro : `${inteiro},${bruto.slice(virgula + 1).replace(/\D/g, '').slice(0, 2)}`
}

/**
 * Preço num campo só, com os centavos: digite "265000,50" e ele mostra "265.000,50". Os pontos de milhar entram sozinhos
 * (sem o cursor pular) e, ao sair, os centavos completam duas casas ("265.000" → "265.000,00"; "265.000,5" → "265.000,50").
 */
function CampoPreco({ valor, mudar, erros }: { valor: string; mudar: (texto: string) => void; erros: EstadoFormulario['erros'] }) {
  const entrada = useRef<HTMLInputElement>(null)
  // Quantos dígitos e vírgulas há depois do cursor: a formatação mexe no que vem antes (pontos, "0" inicial), não nisso.
  const depoisDoCursor = useRef<number | null>(null)
  useLayoutEffect(() => {
    const campo = entrada.current
    if (depoisDoCursor.current === null || !campo || document.activeElement !== campo) return
    let falta = depoisDoCursor.current
    let posicao = campo.value.length
    while (posicao > 0 && falta > 0) if (/[\d,]/.test(campo.value[--posicao]!)) falta--
    campo.setSelectionRange(posicao, posicao)
    depoisDoCursor.current = null
  })
  return (
    <span className={s.prefixo} data-invalido={erros?.preco ? true : undefined}>
      <b>R$</b>
      <input
        ref={entrada}
        name="preco"
        aria-label="Valor em reais, com os centavos"
        inputMode="decimal"
        autoComplete="off"
        maxLength={14}
        placeholder="0,00"
        value={valor}
        onChange={(e) => {
          const bruto = e.target.value
          depoisDoCursor.current = bruto.slice(e.target.selectionStart ?? bruto.length).replace(/[^\d,]/g, '').length
          mudar(formatarPrecoDigitado(bruto))
        }}
        onBlur={() => {
          depoisDoCursor.current = null
          const [reais = '', centavos = ''] = valor.split(',')
          if (reais) mudar(`${reais},${centavos.padEnd(2, '0')}`)
        }}
        {...invalido(erros, 'preco')}
      />
    </span>
  )
}

const inteiroDe = (texto: string) => Math.max(0, Number.parseInt(texto, 10) || 0)

/**
 * Contador com − e +. O valor vazio aparece como 0 (e é enviado vazio até a pessoa mexer). Digitar também vale:
 * o número só é conferido (limites) ao sair do campo.
 */
function Contador({
  rotulo,
  campo,
  valor,
  minimo,
  maximo,
  aoMudar,
  erros,
}: {
  rotulo: string
  campo: keyof Valores
  valor: string
  minimo: number
  maximo: number
  aoMudar: (n: number) => void
  erros: EstadoFormulario['erros']
}) {
  const [rascunho, setRascunho] = useState<string | null>(null)
  const n = inteiroDe(valor)
  const nome = rotulo.toLowerCase()
  return (
    <div className={s.passo} data-invalido={erros?.[campo] ? true : undefined}>
      <input type="hidden" name={campo} value={valor} />
      <button type="button" aria-label={`Diminuir ${nome}`} disabled={n <= minimo} onClick={() => aoMudar(n - 1)}>
        −
      </button>
      <input
        aria-label={rotulo}
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        value={rascunho ?? String(n)}
        onChange={(e) => setRascunho(e.target.value.replace(/[^\d]/g, ''))}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        onBlur={() => {
          if (rascunho !== null) aoMudar(inteiroDe(rascunho))
          setRascunho(null)
        }}
        {...invalido(erros, campo)}
      />
      <button type="button" aria-label={`Aumentar ${nome}`} disabled={n >= maximo} onClick={() => aoMudar(n + 1)}>
        +
      </button>
    </div>
  )
}

/** Cartão de um grupo de contadores: título, selo com o resumo, os contadores e uma dica (ou o erro). */
function CartaoNumeros({ titulo, selo, dica, erro, children }: { titulo: string; selo: string; dica: string; erro?: string; children: ReactNode }) {
  return (
    <section className={s.cartaoNumeros}>
      <header>
        <h3>{titulo}</h3>
        <span>{selo}</span>
      </header>
      <div className={s.contadores}>{children}</div>
      {erro ? <span className="erro-campo">{erro}</span> : <span className={s.dica}>{dica}</span>}
    </section>
  )
}

/** Faixa mín./máx. a partir dos textos dos campos; máximo vazio ou abaixo do mínimo vale o mínimo. */
function faixaDe(min: string, max: string): Faixa {
  const a = lerNumeroBr(min)
  const b = lerNumeroBr(max)
  const menor = a === undefined || Number.isNaN(a) ? 0 : a
  return { min: menor, max: b === undefined || Number.isNaN(b) || b < menor ? menor : b }
}

/** Texto da barra "No site:": como os números preenchidos aparecem nos cards e na página do imóvel. */
function resumoNoSite(v: Valores) {
  const partes: string[] = []
  const area = faixaDe(v.areaMin, v.areaMax.trim() && lerNumeroBr(v.areaMax) ? v.areaMax : v.areaMin)
  if (area.min > 0) partes.push(formatarArea(area))
  partes.push(formatarQuartos(faixaDe(v.quartosMin, v.quartosMax)))
  const suites = faixaDe(v.suitesMin, v.suitesMax)
  if (suites.max > 0) partes.push(formatarSuites(suites))
  const banheiros = faixaDe(v.banheirosMin, v.banheirosMax)
  partes.push(`${formatarFaixa(banheiros)} ${banheiros.max === 1 ? 'banheiro' : 'banheiros'}`)
  partes.push(formatarVagas(v.vagasMin ? faixaDe(v.vagasMin, v.vagasMax) : null).toLowerCase())
  return partes.join(' · ')
}

// ---------- Fotos ----------

/** Apaga do S3 uma foto enviada nesta edição que nunca foi salva (as já salvas saem do S3 quando o imóvel é salvo sem elas). */
async function apagarFotoEnviada(imovel: string, src: string) {
  const resposta = await fetch('/admin/enviar-foto', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imovel, src }),
  })
  if (!resposta.ok) throw new Error('falha ao apagar')
}

function EditorFotos({
  fotos,
  capa,
  mudar,
  escolherCapa,
  nome,
  erro,
  idImovel,
  salvas,
}: {
  fotos: string[]
  /** Capa já resolvida: sempre uma das fotos da lista. */
  capa: string
  mudar: (atualizar: (fotos: string[]) => string[]) => void
  escolherCapa: (src: string) => void
  nome: string
  erro?: string
  /** Id do imóvel, que define a pasta das fotos no S3. No cadastro é gerado no primeiro envio. */
  idImovel: () => string
  /** Fotos que já estão salvas no imóvel (as demais foram enviadas nesta edição). */
  salvas: readonly string[]
}) {
  const avisar = useAvisar()
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null)

  function pedirRemocao(src: string, numero: number) {
    const salva = salvas.includes(src)
    setPedido({
      titulo: `Apagar a foto ${numero}?`,
      texto: salva
        ? 'A foto sai da galeria e, quando você salvar o imóvel, é apagada definitivamente do S3 (original e tamanhos).'
        : 'A foto é apagada definitivamente do S3 (original e tamanhos).',
      rotulo: 'Apagar foto',
      aoConfirmar: async () => {
        if (salva) {
          mudar((lista) => lista.filter((f) => f !== src))
          avisar('Foto removida. Salve o imóvel para apagá-la do S3.')
          return
        }
        try {
          await apagarFotoEnviada(idImovel(), src)
        } catch {
          avisar('Não foi possível apagar a foto do S3. Tente de novo.', { erro: true })
          return
        }
        mudar((lista) => lista.filter((f) => f !== src))
        avisar('Foto apagada do S3.')
      },
    })
  }
  const [enviando, setEnviando] = useState(0)
  const entrada = useRef<HTMLInputElement>(null)

  const mover = (de: number, para: number) =>
    mudar((lista) => {
      const copia = [...lista]
      const [foto] = copia.splice(de, 1)
      copia.splice(para, 0, foto!)
      return copia
    })

  async function enviar(arquivos: File[]) {
    setEnviando(arquivos.length)
    const novas: string[] = []
    const imovel = idImovel()
    // Uma por vez: cada foto de celular já tem alguns MB.
    for (const arquivo of arquivos) {
      const dados = new FormData()
      dados.append('imovel', imovel)
      dados.append('foto', arquivo)
      try {
        const resposta = await fetch('/admin/enviar-foto', { method: 'POST', body: dados })
        if (resposta.status === 413) {
          avisar(`${arquivo.name} é grande demais para enviar.`, { erro: true })
          setEnviando((n) => n - 1)
          continue
        }
        const json = (await resposta.json()) as { src?: string; erro?: string }
        if (json.src) novas.push(json.src)
        else avisar(json.erro ?? 'Não foi possível enviar a foto.', { erro: true })
      } catch {
        avisar(`Falha de conexão ao enviar ${arquivo.name}.`, { erro: true })
      }
      setEnviando((n) => n - 1)
    }
    if (novas.length) {
      mudar((lista) => [...lista, ...novas])
      avisar(novas.length === 1 ? 'Foto enviada. Salve para publicar no site.' : `${novas.length} fotos enviadas. Salve para publicar no site.`)
    }
  }

  return (
    <>
      {fotos.map((src) => (
        <input key={src} type="hidden" name="fotos" value={src} />
      ))}
      <input type="hidden" name="capa" value={capa} />
      <ul className={s.fotos}>
        {fotos.map((src, i) => (
          <li key={src} className={s.foto} data-capa={src === capa || undefined}>
            <div className={s.fotoImagem}>
              <Image loader={carregadorImagem} src={src} alt={`${nome} – foto ${i + 1}`} fill sizes="(max-width: 767px) 50vw, 220px" />
              {src === capa && <span className={s.fotoCapa}>Capa</span>}
              <span className={s.fotoNumero}>{i + 1}</span>
            </div>
            <div className={s.fotoBotoes}>
              <button type="button" className={s.quadrado} onClick={() => mover(i, i - 1)} disabled={i === 0} aria-label={`Mover foto ${i + 1} para a esquerda`}>
                <Icone nome="seta-esquerda" tamanho={16} espessura={2} />
              </button>
              <button
                type="button"
                className={s.quadrado}
                onClick={() => escolherCapa(src)}
                disabled={src === capa}
                aria-label={src === capa ? `Foto ${i + 1} é a capa` : `Usar foto ${i + 1} como capa`}
                title={src === capa ? 'Esta é a capa' : 'Usar como capa'}
              >
                <Icone nome="estrela" tamanho={16} espessura={2} />
              </button>
              <button
                type="button"
                className={s.quadrado}
                onClick={() => mover(i, i + 1)}
                disabled={i === fotos.length - 1}
                aria-label={`Mover foto ${i + 1} para a direita`}
              >
                <Icone nome="seta" tamanho={16} espessura={2} />
              </button>
              <button
                type="button"
                className={`${s.quadrado} ${s.quadradoPerigo}`}
                disabled={fotos.length === 1}
                aria-label={`Apagar foto ${i + 1}`}
                title={fotos.length === 1 ? 'O imóvel precisa de pelo menos uma foto' : 'Apagar'}
                onClick={() => pedirRemocao(src, i + 1)}
              >
                <Icone nome="fechar" tamanho={16} espessura={2} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          const arquivos = [...(e.target.files ?? [])]
          e.target.value = ''
          if (arquivos.length) enviar(arquivos)
        }}
      />
      <button type="button" className={s.enviarFotos} onClick={() => entrada.current?.click()} disabled={enviando > 0}>
        <span className={s.enviarFotosIcone}>
          <Icone nome="enviar" tamanho={22} espessura={2} />
        </span>
        <span>
          <strong>{enviando ? `Enviando ${enviando === 1 ? '1 foto' : `${enviando} fotos`}…` : 'Enviar fotos'}</strong>
          <span>Da galeria ou da câmera. JPG, PNG ou WebP, até 15 MB.</span>
        </span>
      </button>
      {erro && (
        <span className="erro-campo" id="erro-fotos">
          {erro}
        </span>
      )}
      <Confirmacao pedido={pedido} aoFechar={() => setPedido(null)} />
    </>
  )
}

// ---------- Publicação (situação no site e ações) ----------

const SITUACAO_SITE: Record<StatusImovel, string> = {
  ativo: 'Publicado no site',
  inativo: 'Desativado',
}

export function Publicacao({ imovel: im, status, criado = false }: { imovel: Imovel; status: StatusImovel; criado?: boolean }) {
  const router = useRouter()
  const { executar, excluir, pendente } = useMudarStatus()
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null)

  return (
    <>
      <dl className={s.dados}>
        <div>
          <dt>Situação</dt>
          <dd>
            <span className={s.ponto} data-status={status} aria-hidden="true" />
            {SITUACAO_SITE[status]}
          </dd>
        </div>
        <div>
          <dt>Origem</dt>
          <dd>{criado ? 'Cadastrado no painel' : 'Importado do sistema anterior'}</dd>
        </div>
        <div>
          <dt>Código</dt>
          <dd>{im.codigo}</dd>
        </div>
        <div className={s.dadosBloco}>
          <dt>Endereço da página</dt>
          <dd className={s.endereco}>{urlImovel(im.slug)}</dd>
        </div>
      </dl>

      <div className={s.publicacaoAcoes}>
        {status === 'ativo' ? (
          <button type="button" className={`${s.botao} ${s.botaoLinha}`} disabled={pendente} onClick={() => executar(im.id, im.nome, 'desativar')}>
            <Icone nome="olho-fechado" tamanho={16} /> Desativar
          </button>
        ) : (
          <button type="button" className={`${s.botao} ${s.botaoSol}`} disabled={pendente} onClick={() => executar(im.id, im.nome, 'ativar')}>
            <Icone nome="olho" tamanho={16} /> Reativar
          </button>
        )}
        <button
          type="button"
          className={`${s.botao} ${s.botaoPerigo}`}
          disabled={pendente}
          onClick={() =>
            setPedido({
              titulo: `Excluir ${im.nome}?`,
              texto: TEXTO_EXCLUSAO,
              rotulo: 'Excluir imóvel',
              aoConfirmar: () => excluir(im.id, im.nome, () => router.push('/admin')),
            })
          }
        >
          <Icone nome="lixeira" tamanho={16} /> Excluir
        </button>
      </div>

      <Confirmacao pedido={pedido} aoFechar={() => setPedido(null)} />
    </>
  )
}

// ---------- Formulário ----------

export function FormularioImovel({
  imovel,
  status = 'ativo',
  criado = false,
  construtoras,
}: {
  /** Ausente: formulário de cadastro de um imóvel novo. */
  imovel?: Imovel
  status?: StatusImovel
  criado?: boolean
  /** Opções do campo Construtora: a padrão primeiro, depois as demais em ordem alfabética. */
  construtoras: Pick<ConstrutoraAdmin, 'id' | 'nome' | 'padrao'>[]
}) {
  const novo = !imovel
  const im = imovel ?? IMOVEL_VAZIO
  const avisar = useAvisar()
  const router = useRouter()
  const formulario = useRef<HTMLFormElement>(null)
  // Cadastro: o id do imóvel nasce no primeiro envio de foto (a pasta no S3 leva o id) e segue junto ao salvar.
  const idCadastro = useRef('')
  const idImovel = () => (novo ? (idCadastro.current ||= novoIdCriado()) : im.id)
  const [estado, setEstado] = useState<EstadoFormulario>(ESTADO_INICIAL)
  const [salvando, iniciar] = useTransition()
  const [limpando, setLimpando] = useState<PedidoConfirmacao | null>(null)

  const [inicial, setInicial] = useState(() => valoresDe(im, novo, String(construtoras.find((c) => c.padrao)?.id ?? '')))
  const [v, setV] = useState(inicial)
  // Quando os dados mudam no servidor (por exemplo, ao salvar), os campos acompanham.
  const [anterior, setAnterior] = useState(im)
  if (anterior !== im && JSON.stringify(anterior) !== JSON.stringify(im)) {
    const novos = valoresDe(im)
    setAnterior(im)
    setInicial(novos)
    setV(novos)
  }

  const sujo = JSON.stringify(v) !== JSON.stringify(inicial)
  const mudar = <C extends keyof Valores>(campo: C, valor: Valores[C]) => setV((atual) => ({ ...atual, [campo]: valor }))
  const texto = (campo: keyof Valores) => ({
    name: campo,
    value: v[campo] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => mudar(campo, e.target.value),
  })
  // Erros mostrados: a conferência feita aqui, enquanto se preenche (campo a campo, depois de sair dele; tudo depois
  // de tentar salvar), mais o que só o servidor sabe dizer.
  const [tentou, setTentou] = useState(false)
  const [tocados, setTocados] = useState<ReadonlySet<string>>(new Set())
  const tocar = (campo: string) => setTocados((atual) => (atual.has(campo) ? atual : new Set(atual).add(campo)))
  const errosLocais = useMemo<NonNullable<EstadoFormulario['erros']>>(() => {
    const e: NonNullable<EstadoFormulario['erros']> = { ...validarImovel(v) }
    if (!v.fotos.length) e.fotos = novo ? 'Envie pelo menos uma foto.' : 'Mantenha pelo menos uma foto.'
    return e
  }, [v, novo])
  const erros = useMemo<NonNullable<EstadoFormulario['erros']>>(() => {
    const visiveis = Object.fromEntries(Object.entries(errosLocais).filter(([campo]) => tentou || tocados.has(campo)))
    // O servidor também confere as fotos (endereço permitido); o resto ele só repete.
    const doServidor = errosLocais.fotos || !estado.erros?.fotos ? {} : { fotos: estado.erros.fotos }
    return { ...doServidor, ...visiveis }
  }, [errosLocais, tentou, tocados, estado.erros])

  // Cidades e bairros do estado escolhido, buscados no servidor a cada troca de UF.
  const [locais, setLocais] = useState<{ uf: string; dados: LocaisDoEstado; falhou?: boolean } | null>(null)
  useEffect(() => {
    if (!v.uf) return
    let valido = true
    listarLocais(v.uf).then(
      (dados) => valido && setLocais({ uf: v.uf, dados }),
      () => valido && setLocais({ uf: v.uf, dados: { cidades: [], bairros: {} }, falhou: true }),
    )
    return () => {
      valido = false
    }
  }, [v.uf])
  const doEstado = locais?.uf === v.uf ? locais : null
  const carregandoLocais = !!v.uf && !doEstado
  // A cidade e o bairro do próprio imóvel entram na lista mesmo que ela não os tenha.
  const cidades = doEstado ? (v.cidade && !doEstado.dados.cidades.includes(v.cidade) ? [v.cidade, ...doEstado.dados.cidades] : doEstado.dados.cidades) : []
  // Bairros já cadastrados na cidade escolhida (quem cadastra pode digitar um novo).
  const bairros = doEstado?.dados.bairros[v.cidade] ?? []
  // Contadores: o máximo nunca fica abaixo do mínimo, e as suítes nunca passam do máximo de quartos.
  const passo = (grupo: 'quartos' | 'banheiros' | 'vagas' | 'suites', lado: 'Min' | 'Max', n: number) =>
    setV((a) => {
      const teto = grupo === 'vagas' ? LIMITES.vagas : grupo === 'suites' ? inteiroDe(a.quartosMax || a.quartosMin) : LIMITES.comodos
      const novo = Math.min(teto, Math.max(0, n))
      const min = lado === 'Min' ? novo : inteiroDe(a[`${grupo}Min`])
      const max = lado === 'Max' ? Math.max(novo, min) : Math.max(inteiroDe(a[`${grupo}Max`]), min)
      const atualizado = { ...a, [`${grupo}Min`]: String(min), [`${grupo}Max`]: String(max) }
      if (grupo === 'quartos' && inteiroDe(a.suitesMax) > max) {
        atualizado.suitesMax = String(max)
        atualizado.suitesMin = String(Math.min(inteiroDe(a.suitesMin), max))
      }
      return atualizado
    })
  const quartosMaximos = inteiroDe(v.quartosMax || v.quartosMin)
  const escolherUf = (uf: string) => {
    tocar('uf')
    setV((atual) => (uf === atual.uf ? atual : { ...atual, uf, cidade: '', bairro: '' }))
  }
  const escolherCidade = (cidade: string) => {
    tocar('cidade')
    setV((atual) => ({ ...atual, cidade, bairro: '' }))
  }

  // Avisa antes de fechar a aba com alterações não salvas.
  useEffect(() => {
    if (!sujo) return
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [sujo])

  const aluguel = v.finalidade === 'aluguel'
  const entrega = v.entregaMes || v.entregaAno ? `${v.entregaAno}-${v.entregaMes}` : ''

  // A capa pode ser qualquer foto da lista; se a escolhida saiu, vale a primeira.
  const capa = v.fotos.includes(v.capa) ? v.capa : (v.fotos[0] ?? '')

  function salvar() {
    const form = formulario.current
    if (!form) return
    if (Object.keys(errosLocais).length) {
      flushSync(() => setTentou(true))
      avisar('Confira os campos destacados.', { erro: true })
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setTentou(true)
    const dados = new FormData(form)
    if (novo && idCadastro.current) dados.set('id', idCadastro.current)
    iniciar(async () => {
      let resultado: EstadoFormulario
      try {
        resultado = novo ? await criarImovel(ESTADO_INICIAL, dados) : await salvarImovel(im.id, ESTADO_INICIAL, dados)
      } catch {
        avisar('Não foi possível salvar. Confira a conexão e tente de novo.', { erro: true })
        return
      }
      setEstado(resultado)
      if (resultado.status === 'sucesso') {
        if (resultado.destino) {
          avisar(resultado.mensagem ?? 'Imóvel cadastrado.')
          router.push(resultado.destino)
        } else if (!novo) avisar(status === 'ativo' ? 'Alterações publicadas no site.' : 'Alterações salvas.')
      } else {
        avisar(resultado.mensagem ?? 'Confira os campos destacados.', { erro: true })
        requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      }
    })
  }

  return (
    <>
      <div className={`container ${s.corpo}`}>
        <form
          ref={formulario}
          id="formulario-imovel"
          className={s.formulario}
          noValidate
          onBlur={(e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) tocar(e.target.name)
          }}
          onSubmit={(e) => {
            e.preventDefault()
            salvar()
          }}
        >
          <Secao id="apresentacao" icone={<Icone nome="texto" />} titulo="Apresentação" descricao="Aparece nos cards, no título da página e no Google.">
            <div className={s.apresentacao}>
              <div className={s.campos}>
                <Campo texto="Nome" campo="nome" erros={erros}>
                  <input className="campo" maxLength={120} required {...texto('nome')} {...invalido(erros, 'nome')} />
                </Campo>
                <Campo
                  texto="Chamada"
                  campo="chamada"
                  erros={erros}
                  extra={<span data-longo={v.chamada.length > 90 || undefined}>{v.chamada.length}/90</span>}
                  dica={v.chamada.length > 90 ? 'Acima de 90 caracteres a frase pode ser cortada nos cards.' : undefined}
                >
                  <textarea className="campo" rows={2} maxLength={200} required {...texto('chamada')} {...invalido(erros, 'chamada')} />
                </Campo>
                <div className={s.grade2}>
                  <Campo texto="Tipo" campo="tipo" erros={erros}>
                    <Seletor
                      name="tipo"
                      aria-label="Tipo"
                      valor={v.tipo}
                      aoMudar={(valor) => mudar('tipo', valor)}
                      opcoes={TIPOS.map((t) => ({ valor: t, rotulo: rotuloTipo[t] }))}
                    />
                  </Campo>
                  <div className={s.rotulo}>
                    <span id="rotulo-finalidade">Finalidade</span>
                    <input type="hidden" name="finalidade" value={v.finalidade} />
                    <div className="segmentado" role="group" aria-labelledby="rotulo-finalidade">
                      {(['venda', 'aluguel'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          aria-pressed={v.finalidade === f}
                          // Aluguel não entra no Minha Casa Minha Vida: a marcação cai junto.
                          onClick={() => setV((atual) => ({ ...atual, finalidade: f, mcmv: f === 'venda' && atual.mcmv }))}
                        >
                          {f === 'venda' ? 'Venda' : 'Aluguel'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={s.rotulo}>
                  <span id="rotulo-situacao">Situação da obra</span>
                  <input type="hidden" name="situacao" value={v.situacao} />
                  <div className={s.chips} role="group" aria-labelledby="rotulo-situacao">
                    {SITUACOES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        className="alternancia alternancia-pilula"
                        aria-pressed={v.situacao === st}
                        onClick={() => mudar('situacao', st)}
                      >
                        {rotuloSituacao[st]}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Aluguel não é elegível ao programa: a opção nem aparece. */}
                {!aluguel && (
                  <label className={s.mcmv}>
                    <Image src={logoMcmv} alt="" width={44} height={44} className={s.mcmvLogo} />
                    <span>
                      <strong>Minha Casa Minha Vida</strong>
                      <span>Aparece no filtro da busca e ganha o selo no card.</span>
                    </span>
                    <input
                      className={s.chave}
                      type="checkbox"
                      name="mcmv"
                      checked={v.mcmv}
                      onChange={(e) => mudar('mcmv', e.target.checked)}
                      aria-label="Elegível ao Minha Casa Minha Vida"
                    />
                  </label>
                )}
              </div>

            </div>
          </Secao>

          <Secao id="valores" icone={<Icone nome="dinheiro" />} titulo="Valores e características" descricao="Todos os números começam em 0 e não aceitam valores negativos. Para um valor único, use o mesmo número no mínimo e no máximo.">
            <div className={s.valoresTopo}>
              <Campo
                texto={aluguel ? 'Aluguel mensal' : 'Investimento a partir de'}
                campo="preco"
                erros={erros}
                dica={`${aluguel ? 'Valor do aluguel por mês.' : 'Menor valor entre as unidades.'} Use vírgula para os centavos, se houver.`}
              >
                <CampoPreco valor={v.preco} mudar={(texto) => mudar('preco', texto)} erros={erros} />
              </Campo>
              <div className={s.rotulo} role="group" aria-labelledby="rotulo-area">
                <span id="rotulo-area">Área privativa</span>
                <div className={s.areaPar}>
                  <EntradaNumero campo="areaMin" v={v} mudar={mudar} erros={erros} prefixo="De" sufixo="m²" rotulo="Área mínima" />
                  <span aria-hidden="true">até</span>
                  <EntradaNumero campo="areaMax" v={v} mudar={mudar} erros={erros} sufixo="m²" rotulo="Área máxima" />
                </div>
                {erros?.areaMin || erros?.areaMax ? (
                  <span className="erro-campo">{erros.areaMin || erros.areaMax}</span>
                ) : (
                  <span className={s.dica}>Use vírgula para as casas decimais. Para um tamanho único, repita o valor ou deixe 0 no máximo.</span>
                )}
              </div>
            </div>

            <div className={s.cartoesNumeros}>
              <CartaoNumeros
                titulo="Quartos"
                selo={formatarQuartos(faixaDe(v.quartosMin, v.quartosMax))}
                dica="Menor e maior número de quartos entre as plantas."
                erro={erros?.quartosMin || erros?.quartosMax}
              >
                <div className={s.contadorRotulado}>
                  <span>Mínimo</span>
                  <Contador rotulo="Quartos – mínimo" campo="quartosMin" valor={v.quartosMin} minimo={0} maximo={LIMITES.comodos} aoMudar={(n) => passo('quartos', 'Min', n)} erros={erros} />
                </div>
                <div className={s.contadorRotulado}>
                  <span>Máximo</span>
                  <Contador rotulo="Quartos – máximo" campo="quartosMax" valor={v.quartosMax} minimo={inteiroDe(v.quartosMin)} maximo={LIMITES.comodos} aoMudar={(n) => passo('quartos', 'Max', n)} erros={erros} />
                </div>
              </CartaoNumeros>
              <CartaoNumeros
                titulo="Suítes"
                selo={formatarSuites(faixaDe(v.suitesMin, v.suitesMax))}
                dica="Não pode passar do número máximo de quartos."
                erro={erros?.suitesMin || erros?.suitesMax}
              >
                <div className={s.contadorRotulado}>
                  <span>Mínimo</span>
                  <Contador rotulo="Suítes – mínimo" campo="suitesMin" valor={v.suitesMin} minimo={0} maximo={quartosMaximos} aoMudar={(n) => passo('suites', 'Min', n)} erros={erros} />
                </div>
                <div className={s.contadorRotulado}>
                  <span>Máximo</span>
                  <Contador rotulo="Suítes – máximo" campo="suitesMax" valor={v.suitesMax} minimo={inteiroDe(v.suitesMin)} maximo={quartosMaximos} aoMudar={(n) => passo('suites', 'Max', n)} erros={erros} />
                </div>
              </CartaoNumeros>
              <CartaoNumeros
                titulo="Banheiros"
                selo={`${formatarFaixa(faixaDe(v.banheirosMin, v.banheirosMax))} ${faixaDe(v.banheirosMin, v.banheirosMax).max === 1 ? 'banheiro' : 'banheiros'}`}
                dica="Conte também os banheiros das suítes."
                erro={erros?.banheirosMin || erros?.banheirosMax}
              >
                <div className={s.contadorRotulado}>
                  <span>Mínimo</span>
                  <Contador rotulo="Banheiros – mínimo" campo="banheirosMin" valor={v.banheirosMin} minimo={0} maximo={LIMITES.comodos} aoMudar={(n) => passo('banheiros', 'Min', n)} erros={erros} />
                </div>
                <div className={s.contadorRotulado}>
                  <span>Máximo</span>
                  <Contador rotulo="Banheiros – máximo" campo="banheirosMax" valor={v.banheirosMax} minimo={inteiroDe(v.banheirosMin)} maximo={LIMITES.comodos} aoMudar={(n) => passo('banheiros', 'Max', n)} erros={erros} />
                </div>
              </CartaoNumeros>
              <CartaoNumeros
                titulo="Vagas de garagem"
                selo={formatarVagas(v.vagasMin ? faixaDe(v.vagasMin, v.vagasMax) : null).toLowerCase()}
                dica="Com 0, o site mostra “sem vaga”."
                erro={erros?.vagasMin || erros?.vagasMax}
              >
                <div className={s.contadorRotulado}>
                  <span>Mínimo</span>
                  <Contador rotulo="Vagas – mínimo" campo="vagasMin" valor={v.vagasMin} minimo={0} maximo={LIMITES.vagas} aoMudar={(n) => passo('vagas', 'Min', n)} erros={erros} />
                </div>
                <div className={s.contadorRotulado}>
                  <span>Máximo</span>
                  <Contador rotulo="Vagas – máximo" campo="vagasMax" valor={v.vagasMax} minimo={inteiroDe(v.vagasMin)} maximo={LIMITES.vagas} aoMudar={(n) => passo('vagas', 'Max', n)} erros={erros} />
                </div>
              </CartaoNumeros>
            </div>

            <p className={s.resumoSite}>
              <Icone nome="olho" tamanho={18} />
              <span>
                <strong>No site:</strong> {resumoNoSite(v)}
              </span>
            </p>

            <div className={s.grade3}>
              <div className={s.rotulo}>
                <span id="rotulo-entrega">Previsão de entrega</span>
                <input type="hidden" name="entrega" value={entrega} />
                <div
                  className={s.entrega}
                  role="group"
                  aria-labelledby="rotulo-entrega"
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) tocar('entrega')
                  }}
                >
                  <Seletor aria-label="Mês da entrega" valor={v.entregaMes} aoMudar={(m) => mudar('entregaMes', m)} opcoes={OPCOES_MES} />
                  <Seletor aria-label="Ano da entrega" valor={v.entregaAno} aoMudar={(a) => mudar('entregaAno', a)} opcoes={opcoesAno(v.entregaAno)} />
                </div>
                {erros?.entrega && <span className="erro-campo">{erros.entrega}</span>}
              </div>
              <Campo texto="Unidades" campo="unidades" erros={erros} extra="opcional">
                <input className="campo" maxLength={120} placeholder="Ex.: 120 em 4 torres" {...texto('unidades')} />
              </Campo>
              <Campo texto="Construtora" campo="construtora" erros={erros}>
                <Seletor
                  name="construtoraId"
                  aria-label="Construtora"
                  valor={v.construtoraId}
                  aoMudar={(id) => mudar('construtoraId', id)}
                  opcoes={construtoras.map((c) => ({ valor: String(c.id), rotulo: c.nome }))}
                  {...invalido(erros, 'construtora')}
                />
              </Campo>
            </div>
          </Secao>

          <Secao id="localizacao" icone={<Icone nome="local" />} titulo="Localização" descricao="Bairro e cidade definem em quais buscas o imóvel aparece.">
            <div className={s.gradeLocal}>
              <Campo texto="UF" campo="uf" erros={erros}>
                <Seletor
                  name="uf"
                  aria-label="UF"
                  valor={v.uf}
                  aoMudar={escolherUf}
                  opcoes={[{ valor: '', rotulo: 'Selecione' }, ...ESTADOS.map(([sigla, nome]) => ({ valor: sigla, rotulo: `${sigla} – ${nome}` }))]}
                  {...invalido(erros, 'uf')}
                />
              </Campo>
              <Campo texto="Cidade" campo="cidade" erros={erros}>
                <Seletor
                  name="cidade"
                  aria-label="Cidade"
                  valor={v.cidade}
                  aoMudar={escolherCidade}
                  desativado={!v.uf || carregandoLocais}
                  opcoes={[
                    { valor: '', rotulo: !v.uf ? 'Escolha a UF primeiro' : carregandoLocais ? 'Carregando…' : doEstado?.falhou ? 'Lista indisponível' : 'Selecione' },
                    ...cidades.map((c) => ({ valor: c, rotulo: c })),
                  ]}
                  {...invalido(erros, 'cidade')}
                />
              </Campo>
              <Campo texto="Bairro" campo="bairro" erros={erros}>
                <CampoComSugestoes
                  name="bairro"
                  valor={v.bairro}
                  aoMudar={(texto) => mudar('bairro', texto)}
                  sugestoes={bairros}
                  maxLength={80}
                  desativado={!v.cidade}
                  placeholder={!v.cidade ? 'Escolha a cidade primeiro' : bairros.length ? 'Escolha ou digite' : 'Digite o bairro'}
                  {...invalido(erros, 'bairro')}
                />
              </Campo>
            </div>
            <Campo texto="Rua e número" campo="logradouro" erros={erros} dica="Vazio: o site mostra só bairro e cidade.">
              <input className="campo" maxLength={200} {...texto('logradouro')} />
            </Campo>
            <MapaEstatico
              consulta={[v.logradouro, v.bairro, v.cidade, v.uf].filter(Boolean).join(', ')}
              legenda="Conferir no Google Maps"
              altura={170}
              className={s.mapa}
            />
          </Secao>

          <Secao id="textos" icone={<Icone nome="texto" />} titulo="Textos" descricao="Uma linha por parágrafo ou item.">
            <Campo texto="Descrição" campo="descricao" erros={erros}>
              <textarea className="campo" rows={6} {...texto('descricao')} />
            </Campo>
            <div className={s.grade}>
              <Campo texto="Itens de lazer" campo="lazer" erros={erros} extra={itens(contarLinhas(v.lazer))}>
                <textarea className="campo" rows={7} {...texto('lazer')} />
              </Campo>
              <Campo texto="Proximidades" campo="proximidades" erros={erros} extra={itens(contarLinhas(v.proximidades))}>
                <textarea className="campo" rows={7} {...texto('proximidades')} />
              </Campo>
            </div>
          </Secao>

          <Secao
            id="fotos"
            icone={<Icone nome="imagem" />}
            titulo="Fotos"
            descricao="A foto marcada como Capa aparece nos cards do site. Use a estrela para trocar a capa e as setas para reordenar a galeria."
            extra={<span className={s.secaoExtra}>{v.fotos.length === 1 ? '1 foto' : `${v.fotos.length} fotos`}</span>}
          >
            <EditorFotos
              idImovel={idImovel}
              salvas={inicial.fotos}
              fotos={v.fotos}
              capa={capa}
              mudar={(f) => setV((atual) => ({ ...atual, fotos: f(atual.fotos) }))}
              escolherCapa={(src) => mudar('capa', src)}
              nome={v.nome}
              erro={erros?.fotos}
            />
          </Secao>
        </form>

        <div className={s.acoesFormulario}>
          <button
            type="button"
            className={`${s.botao} ${s.botaoLinha} ${s.botaoG}`}
            disabled={!sujo || salvando}
            onClick={() =>
              setLimpando({
                titulo: 'Limpar o formulário?',
                texto: novo
                  ? 'Tudo o que foi preenchido será apagado, e as fotos enviadas serão apagadas do S3.'
                  : 'As alterações que ainda não foram salvas serão descartadas e o formulário volta ao que está no site. Fotos enviadas agora e não salvas são apagadas do S3.',
                rotulo: 'Limpar formulário',
                icone: 'restaurar',
                aoConfirmar: () => {
                  // Fotos enviadas nesta edição e nunca salvas não servem mais: saem do S3.
                  for (const src of v.fotos.filter((f) => !inicial.fotos.includes(f))) apagarFotoEnviada(idImovel(), src).catch(() => undefined)
                  setV(inicial)
                  setEstado(ESTADO_INICIAL)
                  setTentou(false)
                  setTocados(new Set())
                  avisar('Formulário limpo.')
                },
              })
            }
          >
            Limpar formulário
          </button>
          <button type="submit" form="formulario-imovel" className={`${s.botao} ${s.botaoSol} ${s.botaoG}`} disabled={!sujo || salvando}>
            <Icone nome="check" tamanho={17} espessura={2.4} />
            {salvando ? (novo ? 'Cadastrando…' : 'Salvando…') : novo ? 'Cadastrar e publicar' : status === 'ativo' ? 'Salvar e publicar' : 'Salvar'}
          </button>
        </div>

        <Confirmacao pedido={limpando} aoFechar={() => setLimpando(null)} />

        {!novo && (
          <Secao id="publicacao" icone={<Icone nome="externo" />} titulo="Publicação" descricao="Situação do imóvel no site.">
            <Publicacao imovel={im} status={status} criado={criado} />
          </Secao>
        )}
      </div>

    </>
  )
}
