'use server'

// Ações do painel administrativo. Cada uma confere a sessão por conta própria:
// Server Actions são endpoints públicos e não podem confiar no que a página mostrou.
import { refresh, updateTag } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { encerrarSessao, exigirAdmin, iniciarSessao } from '@/lib/admin/acesso'
import { autenticar, limparFalhas, loginBloqueado, painelConfigurado, registrarFalha } from '@/lib/admin/sessao'
import { texto, type EstadoFormulario } from '@/lib/formularios'
import {
  gravarImovel,
  gravarVitrine,
  inserirImovel,
  mudarStatusNoBanco,
  obterRegistro,
  slugsEmUso,
  usarVitrineDoCrmNoBanco,
} from '@/lib/imoveis/banco'
import { idsAtivos } from '@/lib/imoveis/consultas-admin'
import { CAMPOS_EDITAVEIS, PREFIXO_CRIADO, capaDe, diferencas } from '@/lib/imoveis/painel'
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
  if (!(await painelConfigurado())) {
    return { status: 'erro', mensagem: 'Nenhum administrador cadastrado. Cadastre um na tabela administradores (db/administradores.sql).' }
  }
  const ip = await ipDoCliente()
  const email = texto(fd, 'email', 150)
  if (await loginBloqueado(ip, email)) {
    return { status: 'erro', mensagem: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.' }
  }
  const senha = typeof fd.get('senha') === 'string' ? String(fd.get('senha')).slice(0, 200) : ''
  const admin = email && senha ? await autenticar(email, senha) : null
  if (!admin) {
    await registrarFalha(ip, email)
    return { status: 'erro', mensagem: 'Usuário ou senha incorretos.', valores: { email } }
  }
  await limparFalhas(ip, email)
  await iniciarSessao(admin, ip, fd.get('lembrar') === 'on')
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
  if (typeof id !== 'string' || !ACOES_STATUS.includes(acao) || !(await obterRegistro(id))) return
  await mudarStatusNoBanco(id, acao, admin.email)
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

type CamposImovel = Pick<Imovel, (typeof CAMPOS_EDITAVEIS)[number] | 'capa'>

/**
 * Lê e valida o formulário do imóvel. `base` é o imóvel já existente (edição); no cadastro é `null`.
 * Quando a lista de fotos não muda, mantém as do original (com legendas e dimensões).
 */
function lerFormulario(fd: FormData, base: Imovel | null): { erros: Erros } | { erros: null; campos: CamposImovel } {
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
  const srcCapa = texto(fd, 'capa', 500)
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
  if (!srcFotos.length) erros.fotos = base ? 'Mantenha pelo menos uma foto.' : 'Envie pelo menos uma foto.'
  else if (!srcFotos.every(fotoPermitida)) erros.fotos = 'Há fotos de um endereço não permitido.'

  const area = faixa(fd, 'area', erros)
  const quartos = faixa(fd, 'quartos', erros)
  const banheiros = faixa(fd, 'banheiros', erros)
  const vagas = faixa(fd, 'vagas', erros, false)

  if (Object.keys(erros).length) return { erros }

  const existentes = base?.fotos ?? []
  const mesmasFotos = JSON.stringify(srcFotos) === JSON.stringify(existentes.map((f) => f.src))
  const fotos: Foto[] = mesmasFotos
    ? existentes
    : srcFotos.map((src, i) => ({
        ...(existentes.find((f) => f.src === src) ?? { width: 1600, height: 1200 }),
        src,
        alt: `${nome} – foto ${i + 1}`,
      }))

  // Mantém os slugs do CRM quando o nome não mudou, para não alterar URLs à toa.
  const local = {
    ...base?.local,
    bairro,
    bairroSlug: base && bairro === base.local.bairro ? base.local.bairroSlug : slugificar(bairro),
    cidade,
    cidadeSlug: base && cidade === base.local.cidade ? base.local.cidadeSlug : slugificar(cidade),
    uf,
    logradouro: opcional(texto(fd, 'logradouro', 200)),
  }

  return {
    erros: null,
    campos: {
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
      // Pode ser qualquer foto da galeria; se a escolhida não está mais nela, vale a primeira.
      capa: fotos.find((f) => f.src === srcCapa) ?? fotos[0],
    },
  }
}

const hoje = () => new Date().toISOString().slice(0, 10)

export async function salvarImovel(id: string, _: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const admin = await exigirAdmin()
  const registro = await obterRegistro(id)
  if (!registro) return { status: 'erro', mensagem: 'Imóvel não encontrado no catálogo.' }
  const { imovel: atual, original, criado } = registro

  const lido = lerFormulario(fd, atual)
  if (lido.erros) return { status: 'erro', mensagem: 'Confira os campos destacados.', erros: lido.erros }

  const novo: Imovel = { ...atual, ...lido.campos, atualizadoEm: hoje() }
  // Imóvel cadastrado no painel não tem CRM para comparar; os do CRM ficam "editados" enquanto divergirem dele.
  const editado = !criado && (diferencas(original, novo).length > 0 || capaDe(original) !== capaDe(novo))
  const campos: string[] = diferencas(atual, novo)
  if (capaDe(atual) !== capaDe(novo)) campos.push('capa')
  await gravarImovel(novo, editado, { autor: admin.email, acao: 'editar', campos })
  publicar()
  return { status: 'sucesso', mensagem: 'Alterações salvas e publicadas.' }
}

/** Cadastra um imóvel novo. Já nasce publicado; depois segue o mesmo fluxo de edição dos demais. */
export async function criarImovel(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const admin = await exigirAdmin()
  const lido = lerFormulario(fd, null)
  if (lido.erros) return { status: 'erro', mensagem: 'Confira os campos destacados.', erros: lido.erros }

  // Slugs de excluídos também contam: restaurar um deles não pode colidir com este.
  const usados = await slugsEmUso()
  const { nome, local } = lido.campos
  const raiz = slugificar(`${nome} ${local.bairro} ${local.cidade}`)
  let slug = raiz
  for (let n = 2; usados.has(slug); n++) slug = `${raiz}-${n}`

  const id = `${PREFIXO_CRIADO}${Date.now().toString(36)}`
  const imovel: Imovel = {
    ...lido.campos,
    id,
    codigo: id.toUpperCase(),
    slug,
    destaque: false,
    publicadoEm: hoje(),
    atualizadoEm: hoje(),
    plantas: [],
  }
  await inserirImovel(imovel, { autor: admin.email, acao: 'criar' })
  publicar()
  redirect(`/admin/imoveis/${id}`)
}

/** Descarta as edições do painel: o imóvel volta a seguir 100% o CRM. */
export async function descartarEdicoes(id: string) {
  const admin = await exigirAdmin()
  if (typeof id !== 'string') return
  const registro = await obterRegistro(id)
  // Imóvel cadastrado no painel não tem versão do CRM para voltar.
  if (!registro || registro.criado) return
  await gravarImovel(registro.original, false, { autor: admin.email, acao: 'descartar-edicoes', campos: diferencas(registro.original, registro.imovel) })
  publicar()
}

// ---------- Vitrine da home ----------

export async function salvarVitrine(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const admin = await exigirAdmin()
  const heroi = fd.get('heroi')
  const pedidos = [...new Set(fd.getAll('destaques'))].filter((id): id is string => typeof id === 'string')
  const publicados = await idsAtivos([...pedidos, ...(typeof heroi === 'string' ? [heroi] : [])])
  const ativo = (id: unknown): id is string => typeof id === 'string' && publicados.has(id)
  const destaques = pedidos.filter(ativo)

  if (destaques.length > LIMITE_DESTAQUES) {
    return { status: 'erro', mensagem: `A home mostra no máximo ${LIMITE_DESTAQUES} destaques.` }
  }
  await gravarVitrine({ heroi: ativo(heroi) ? heroi : null, destaques }, admin.email)
  publicar()
  return { status: 'sucesso', mensagem: 'Vitrine atualizada. A home já mostra a nova seleção.' }
}

/** Volta a usar as marcações de destaque e "super destaque" do CRM. */
export async function usarVitrineDoCrm() {
  const admin = await exigirAdmin()
  await usarVitrineDoCrmNoBanco(admin.email)
  publicar()
}
