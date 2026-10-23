'use server'

// Ações do painel administrativo. Cada uma confere a sessão por conta própria:
// Server Actions são endpoints públicos e não podem confiar no que a página mostrou.
import { refresh, updateTag } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { encerrarSessao, exigirAdmin, iniciarSessao } from '@/lib/admin/acesso'
import { obterOriginal } from '@/lib/admin/catalogo'
import { autenticar, limparFalhas, loginBloqueado, painelConfigurado, registrarFalha } from '@/lib/admin/sessao'
import { crm } from '@/lib/crm'
import { texto, type EstadoFormulario } from '@/lib/formularios'
import { CAMPOS_EDITAVEIS, alterarAjustes, diferencas, lerAjustes, statusDe } from '@/lib/imoveis/ajustes'
import { SITUACOES, TIPOS, lerNumeroBr, slugificar } from '@/lib/imoveis/formato'
import { fotoPermitida } from '@/lib/imoveis/hosts-fotos'
import { LIMITE_DESTAQUES, TAG_IMOVEIS } from '@/lib/imoveis/repositorio'
import type { Faixa, Finalidade, Foto, Imovel } from '@/lib/imoveis/tipos'

type Erros = NonNullable<EstadoFormulario['erros']>

/** Atualiza o site público (próxima visita já vê a mudança) e o próprio painel. */
function publicar() {
  updateTag(TAG_IMOVEIS)
  refresh()
}

// ---------- Sessão ----------

async function ipDoCliente() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local'
}

/** Só aceita voltar para caminhos do próprio painel (evita redirecionamento aberto). */
function destinoSeguro(destino: string) {
  return /^\/admin(\/[\w\-/]*)?$/.test(destino) && destino !== '/admin/entrar' ? destino : '/admin'
}

export async function entrar(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  if (!painelConfigurado()) {
    return { status: 'erro', mensagem: 'O painel ainda não foi configurado no servidor (ADMIN_USUARIOS e ADMIN_SESSAO_SEGREDO).' }
  }
  const ip = await ipDoCliente()
  if (loginBloqueado(ip)) {
    return { status: 'erro', mensagem: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.' }
  }
  const email = texto(fd, 'email', 150)
  const senha = typeof fd.get('senha') === 'string' ? String(fd.get('senha')).slice(0, 200) : ''
  const admin = email && senha ? await autenticar(email, senha) : null
  if (!admin) {
    registrarFalha(ip)
    return { status: 'erro', mensagem: 'Usuário ou senha incorretos.', valores: { email } }
  }
  limparFalhas(ip)
  await iniciarSessao(admin, fd.get('lembrar') === 'on')
  redirect(destinoSeguro(texto(fd, 'de', 200)))
}

export async function sair() {
  await encerrarSessao()
  redirect('/admin/entrar')
}

// ---------- Status (ativar, desativar, excluir, restaurar) ----------

const ACOES_STATUS = ['desativar', 'ativar', 'excluir', 'restaurar'] as const
export type AcaoStatus = (typeof ACOES_STATUS)[number]

/** Chamada direto pelos botões do painel (e pelo "Desfazer" dos avisos). */
export async function mudarStatus(id: string, acao: AcaoStatus) {
  const admin = await exigirAdmin()
  // Os argumentos chegam da rede: confere tipo e valor antes de usar.
  if (typeof id !== 'string' || !ACOES_STATUS.includes(acao) || !(await obterOriginal(id))) return
  await alterarAjustes(admin.email, (aj) => {
    const sem = (lista: string[]) => lista.filter((x) => x !== id)
    if (acao === 'desativar') aj.inativos = [...sem(aj.inativos), id]
    else if (acao === 'ativar') aj.inativos = sem(aj.inativos)
    else if (acao === 'restaurar') aj.excluidos = sem(aj.excluidos)
    else if (acao === 'excluir') {
      aj.excluidos = [...sem(aj.excluidos), id]
      // Excluído sai da vitrine de vez; desativado volta para ela se for reativado.
      if (aj.vitrine) {
        aj.vitrine.destaques = sem(aj.vitrine.destaques)
        if (aj.vitrine.heroi === id) aj.vitrine.heroi = null
      }
    }
  })
  publicar()
}

// ---------- Edição ----------

function numero(fd: FormData, campo: string) {
  return lerNumeroBr(texto(fd, campo, 30))
}

function faixa(fd: FormData, campo: string, erros: Erros, obrigatoria = true): Faixa | null {
  const min = numero(fd, `${campo}Min`)
  const max = numero(fd, `${campo}Max`) ?? min
  if (min === undefined) {
    if (obrigatoria) erros[campo] = 'Informe pelo menos o valor mínimo.'
    return null
  }
  if (Number.isNaN(min) || max === undefined || Number.isNaN(max)) {
    erros[campo] = 'Use apenas números.'
    return null
  }
  if (max < min) {
    erros[campo] = 'O máximo não pode ser menor que o mínimo.'
    return null
  }
  return { min, max }
}

const linhas = (fd: FormData, campo: string, limite = 20000) =>
  texto(fd, campo, limite)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

const opcional = (valor: string) => valor || undefined

export async function salvarImovel(id: string, _: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const admin = await exigirAdmin()
  const original = await obterOriginal(id)
  if (!original) return { status: 'erro', mensagem: 'Imóvel não encontrado no catálogo do CRM.' }

  const erros: Erros = {}
  const nome = texto(fd, 'nome', 120)
  const chamada = texto(fd, 'chamada', 200)
  const tipo = TIPOS.find((t) => t === texto(fd, 'tipo'))
  const finalidade = (['venda', 'aluguel'] as Finalidade[]).find((f) => f === texto(fd, 'finalidade'))
  const situacao = SITUACOES.find((s) => s === texto(fd, 'situacao'))
  const preco = numero(fd, 'preco')
  const suites = numero(fd, 'suites')
  const entrega = texto(fd, 'entrega', 10)
  const bairro = texto(fd, 'bairro', 80)
  const cidade = texto(fd, 'cidade', 80)
  const uf = texto(fd, 'uf', 2).toUpperCase()
  const srcFotos = fd.getAll('fotos').filter((f): f is string => typeof f === 'string').map((f) => f.trim()).slice(0, 100)

  if (nome.length < 2) erros.nome = 'Informe o nome.'
  if (chamada.length < 5) erros.chamada = 'Escreva uma frase curta sobre o imóvel.'
  if (!tipo) erros.tipo = 'Escolha o tipo.'
  if (!finalidade) erros.finalidade = 'Escolha a finalidade.'
  if (!situacao) erros.situacao = 'Escolha a situação.'
  if (!preco || Number.isNaN(preco)) erros.preco = 'Informe um valor maior que zero.'
  if (suites !== undefined && (Number.isNaN(suites) || !Number.isInteger(suites))) erros.suites = 'Use um número inteiro.'
  if (entrega && !/^\d{4}-(0[1-9]|1[0-2])$/.test(entrega)) erros.entrega = 'Escolha o mês e o ano.'
  if (bairro.length < 2) erros.bairro = 'Informe o bairro.'
  if (cidade.length < 2) erros.cidade = 'Informe a cidade.'
  if (!/^[A-Z]{2}$/.test(uf)) erros.uf = 'Use a sigla do estado.'
  if (!srcFotos.length) erros.fotos = 'Mantenha pelo menos uma foto.'
  else if (!srcFotos.every(fotoPermitida)) erros.fotos = 'Há fotos de um endereço não permitido.'

  const area = faixa(fd, 'area', erros)
  const quartos = faixa(fd, 'quartos', erros)
  const banheiros = faixa(fd, 'banheiros', erros)
  const vagas = faixa(fd, 'vagas', erros, false)

  if (Object.keys(erros).length) {
    return { status: 'erro', mensagem: 'Confira os campos destacados.', erros }
  }

  // Fotos: se a lista não mudou, mantém as do CRM (com legendas e dimensões originais).
  const mesmasFotos = JSON.stringify(srcFotos) === JSON.stringify(original.fotos.map((f) => f.src))
  const fotos: Foto[] = mesmasFotos
    ? original.fotos
    : srcFotos.map((src, i) => ({
        ...(original.fotos.find((f) => f.src === src) ?? { width: 1600, height: 1200 }),
        src,
        alt: `${nome} – foto ${i + 1}`,
      }))

  // Mantém os slugs do CRM quando o nome não mudou, para não alterar URLs à toa.
  const local = {
    ...original.local,
    bairro,
    bairroSlug: bairro === original.local.bairro ? original.local.bairroSlug : slugificar(bairro),
    cidade,
    cidadeSlug: cidade === original.local.cidade ? original.local.cidadeSlug : slugificar(cidade),
    uf,
    logradouro: opcional(texto(fd, 'logradouro', 200)),
  }

  const novo: Pick<Imovel, (typeof CAMPOS_EDITAVEIS)[number]> = {
    nome,
    chamada,
    tipo: tipo!,
    finalidade: finalidade!,
    situacao: situacao!,
    mcmv: fd.get('mcmv') === 'on',
    preco: preco!,
    area: area!,
    quartos: quartos!,
    suites: suites || undefined,
    banheiros: banheiros!,
    vagas,
    entrega: opcional(entrega),
    unidades: opcional(texto(fd, 'unidades', 120)),
    construtora: opcional(texto(fd, 'construtora', 120)),
    local,
    descricao: linhas(fd, 'descricao'),
    lazer: linhas(fd, 'lazer', 5000),
    proximidades: linhas(fd, 'proximidades', 5000),
    fotos,
  }

  const edicao = diferencas(original, novo)
  await alterarAjustes(admin.email, (aj) => {
    if (Object.keys(edicao).length) aj.editados[id] = edicao
    else delete aj.editados[id]
  })
  publicar()
  return { status: 'sucesso', mensagem: 'Alterações salvas e publicadas.' }
}

/** Descarta as edições do painel: o imóvel volta a seguir 100% o CRM. */
export async function descartarEdicoes(id: string) {
  const admin = await exigirAdmin()
  if (typeof id !== 'string') return
  await alterarAjustes(admin.email, (aj) => {
    delete aj.editados[id]
  })
  publicar()
}

// ---------- Vitrine da home ----------

export async function salvarVitrine(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const admin = await exigirAdmin()
  const [base, ajustes] = await Promise.all([crm.listarImoveis(), lerAjustes()])
  const ativo = (id: unknown): id is string =>
    typeof id === 'string' && base.some((im) => im.id === id) && statusDe(id, ajustes) === 'ativo'
  const heroi = fd.get('heroi')
  const destaques = [...new Set(fd.getAll('destaques'))].filter(ativo)

  if (destaques.length > LIMITE_DESTAQUES) {
    return { status: 'erro', mensagem: `A home mostra no máximo ${LIMITE_DESTAQUES} destaques.` }
  }
  await alterarAjustes(admin.email, (aj) => {
    aj.vitrine = { heroi: ativo(heroi) ? heroi : null, destaques }
  })
  publicar()
  return { status: 'sucesso', mensagem: 'Vitrine atualizada. A home já mostra a nova seleção.' }
}

/** Volta a usar as marcações de destaque e "super destaque" do CRM. */
export async function usarVitrineDoCrm() {
  const admin = await exigirAdmin()
  await alterarAjustes(admin.email, (aj) => {
    delete aj.vitrine
  })
  publicar()
}
