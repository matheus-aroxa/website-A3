'use server'

// Ações do painel administrativo. Cada uma confere a sessão por conta própria:
// Server Actions são endpoints públicos e não podem confiar no que a página mostrou.
import { refresh, updateTag } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { encerrarSessao, exigirAdmin, exigirPrincipal, iniciarSessao } from '@/lib/admin/acesso'
import { criarAdministrador, editarAdministrador, excluirAdministrador, type ResultadoAdministrador } from '@/lib/admin/administradores'
import { COOKIE_SESSAO, autenticar, hashDoToken, limparFalhas, loginBloqueado, painelConfigurado, registrarFalha } from '@/lib/admin/sessao'
import { texto, type EstadoFormulario } from '@/lib/formularios'
import { apagarDoImovel, apagarFotos } from '@/lib/admin/fotos'
import {
  excluirImovelNoBanco,
  gravarImovel,
  gravarVitrine,
  inserirImovel,
  mudarStatusNoBanco,
  obterRegistro,
  slugDaCidade,
  slugsEmUso,
} from '@/lib/imoveis/banco'
import { idsAtivos } from '@/lib/imoveis/consultas-admin'
import {
  criarConstrutora,
  excluirConstrutora,
  idConstrutoraPadrao,
  obterConstrutora,
  renomearConstrutora,
  type ResultadoConstrutora,
} from '@/lib/imoveis/construtoras'
import { CAMPOS_EDITAVEIS, ID_CRIADO, PREFIXO_CRIADO, capaDe, diferencas } from '@/lib/imoveis/painel'
import { SITUACOES, TIPOS, lerNumeroBr, slugificar } from '@/lib/imoveis/formato'
import { fotoPermitida } from '@/lib/imoveis/hosts-fotos'
import { cidadeDoEstado, locaisDoEstado, type LocaisDoEstado } from '@/lib/imoveis/locais'
import { UFS, validarImovel, type EntradaImovel } from '@/lib/imoveis/validacao'
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
    return { status: 'erro', mensagem: 'Nenhum administrador cadastrado. Cadastre um na tabela administradores (veja docs/login-admin.md).' }
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

// ---------- Status (desativar e ativar) e exclusão ----------

const ACOES_STATUS = ['desativar', 'ativar'] as const
export type AcaoStatus = (typeof ACOES_STATUS)[number]

/** Desativar tira o imóvel do site sem apagar nada; reativar o devolve. Chamada pelos botões do painel e pelo "Desfazer". */
export async function mudarStatus(id: string, acao: AcaoStatus) {
  const admin = await exigirAdmin()
  // Os argumentos chegam da rede: confere tipo e valor antes de usar.
  if (typeof id !== 'string' || !ACOES_STATUS.includes(acao) || !(await obterRegistro(id))) return
  await mudarStatusNoBanco(id, acao, admin.email)
  publicar()
}

/**
 * Exclui o imóvel de vez: some do banco (com fotos, plantas e vitrine) e as imagens são apagadas do S3. Não tem volta.
 * O banco vai primeiro: se o S3 falhar, o imóvel já está fora do site e `falhas` avisa que sobraram arquivos.
 * Quem chama atualiza a tela (`router.refresh()` ou navega), porque a página do imóvel deixa de existir.
 */
export async function excluirImovel(id: string): Promise<{ ok: boolean; arquivos?: number; falhas?: number }> {
  const admin = await exigirAdmin()
  if (typeof id !== 'string' || !(await obterRegistro(id))) return { ok: false }
  const imagens = await excluirImovelNoBanco(id, admin.email)
  updateTag(TAG_IMOVEIS)
  const { apagados, falhas } = await apagarDoImovel(id, imagens)
  return { ok: true, arquivos: apagados, falhas }
}

// ---------- Edição ----------

function numero(fd: FormData, campo: string) {
  return lerNumeroBr(texto(fd, campo, 30))
}

/** O campo `entrega` chega como "ano-mês"; meio preenchido ("2026-" ou "-05") fica de fora e é recusado na conferência. */
function entregaDe(valor: string) {
  const [entregaAno = '', entregaMes = ''] = valor.split('-')
  return { entregaAno, entregaMes }
}

/** Faixa já conferida por `validarImovel`: o máximo vazio repete o mínimo (e, na área, o máximo 0 também). */
function faixa(fd: FormData, campo: string): Faixa | null {
  const min = numero(fd, `${campo}Min`)
  if (min === undefined) return null
  const max = numero(fd, `${campo}Max`)
  return { min, max: max === undefined || (campo === 'area' && max === 0) ? min : max }
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
async function lerFormulario(fd: FormData, base: Imovel | null): Promise<{ erros: Erros } | { erros: null; campos: CamposImovel }> {
  const entrada: EntradaImovel = {
    nome: texto(fd, 'nome', 200),
    chamada: texto(fd, 'chamada', 300),
    tipo: texto(fd, 'tipo'),
    finalidade: texto(fd, 'finalidade'),
    situacao: texto(fd, 'situacao'),
    preco: texto(fd, 'preco', 30),
    areaMin: texto(fd, 'areaMin', 30),
    areaMax: texto(fd, 'areaMax', 30),
    quartosMin: texto(fd, 'quartosMin', 30),
    quartosMax: texto(fd, 'quartosMax', 30),
    suitesMin: texto(fd, 'suitesMin', 30),
    suitesMax: texto(fd, 'suitesMax', 30),
    banheirosMin: texto(fd, 'banheirosMin', 30),
    banheirosMax: texto(fd, 'banheirosMax', 30),
    vagasMin: texto(fd, 'vagasMin', 30),
    vagasMax: texto(fd, 'vagasMax', 30),
    ...entregaDe(texto(fd, 'entrega', 10)),
    bairro: texto(fd, 'bairro', 120),
    cidade: texto(fd, 'cidade', 120),
    uf: texto(fd, 'uf', 4),
  }
  // As mesmas regras que o formulário aplica no navegador; aqui valem de verdade.
  const erros: Erros = { ...validarImovel(entrada) }

  const nome = entrada.nome
  const chamada = entrada.chamada
  const tipo = TIPOS.find((t) => t === entrada.tipo)
  const finalidade = (['venda', 'aluguel'] as Finalidade[]).find((f) => f === entrada.finalidade)
  const situacao = SITUACOES.find((s) => s === entrada.situacao)
  const preco = numero(fd, 'preco')
  const suitesFaixa = faixa(fd, 'suites')
  // Sem suíte (vazio ou 0 a 0) não se grava nada.
  const suites = suitesFaixa && suitesFaixa.max > 0 ? suitesFaixa : undefined
  const entrega = texto(fd, 'entrega', 10)
  const bairro = entrada.bairro
  const cidade = entrada.cidade
  const uf = entrada.uf.toUpperCase()
  const srcCapa = texto(fd, 'capa', 500)
  const srcFotos = fd.getAll('fotos').filter((f): f is string => typeof f === 'string').map((f) => f.trim()).slice(0, 100)

  // Sem escolha vale a construtora padrão ("Não informado"); id que não existe é recusado.
  const pedidoConstrutora = texto(fd, 'construtoraId', 12)
  const construtora = pedidoConstrutora
    ? /^\d+$/.test(pedidoConstrutora) ? await obterConstrutora(Number(pedidoConstrutora)) : null
    : await obterConstrutora(await idConstrutoraPadrao())
  if (!construtora) erros.construtora = 'Escolha uma construtora da lista.'

  if (!srcFotos.length) erros.fotos = base ? 'Mantenha pelo menos uma foto.' : 'Envie pelo menos uma foto.'
  else if (!srcFotos.every(fotoPermitida)) erros.fotos = 'Há fotos de um endereço não permitido.'

  const area = faixa(fd, 'area')
  const quartos = faixa(fd, 'quartos')
  const banheiros = faixa(fd, 'banheiros')
  const vagas = faixa(fd, 'vagas')

  // A cidade precisa estar na lista do estado (a do próprio imóvel vale, mesmo que a lista não a tenha).
  if (!erros.cidade && !erros.uf && !(base && cidade === base.local.cidade && uf === base.local.uf) && !(await cidadeDoEstado(uf, cidade))) {
    erros.cidade = 'Escolha uma cidade da lista do estado.'
  }

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

  // Mantém os slugs quando o nome não mudou, para não alterar URLs à toa.
  const local = {
    ...base?.local,
    bairro,
    bairroSlug: base && bairro === base.local.bairro ? base.local.bairroSlug : slugificar(bairro),
    cidade,
    cidadeSlug: base && cidade === base.local.cidade && uf === base.local.uf ? base.local.cidadeSlug : await slugDaCidade(cidade, uf),
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
      mcmv: finalidade === 'venda' && fd.get('mcmv') === 'on', // aluguel não entra no programa
      preco: preco!,
      area: area!,
      quartos: quartos!,
      suites,
      banheiros: banheiros!,
      vagas,
      entrega: opcional(entrega),
      unidades: opcional(texto(fd, 'unidades', 120)),
      construtora: construtora!,
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
  const { imovel: atual } = registro

  const lido = await lerFormulario(fd, atual)
  if (lido.erros) return { status: 'erro', mensagem: 'Confira os campos destacados.', erros: lido.erros }

  const novo: Imovel = { ...atual, ...lido.campos, atualizadoEm: hoje() }
  const campos: string[] = diferencas(atual, novo)
  if (capaDe(atual) !== capaDe(novo)) campos.push('capa')
  await gravarImovel(novo, { autor: admin.email, acao: 'editar', campos })
  // Fotos tiradas da galeria: agora que o imóvel foi salvo sem elas, saem também do S3.
  const mantidas = new Set(novo.fotos.map((f) => f.src))
  await apagarFotos(atual.fotos.map((f) => f.src).filter((src) => !mantidas.has(src))).catch(() => undefined)
  publicar()
  return { status: 'sucesso', mensagem: 'Alterações salvas e publicadas.' }
}

/** Cadastra um imóvel novo. Já nasce publicado; depois segue o mesmo fluxo de edição dos demais. */
export async function criarImovel(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const admin = await exigirAdmin()
  const lido = await lerFormulario(fd, null)
  if (lido.erros) return { status: 'erro', mensagem: 'Confira os campos destacados.', erros: lido.erros }

  // Slugs de imóveis desativados também contam: reativar um deles não pode colidir com este.
  const usados = await slugsEmUso()
  const { nome, local } = lido.campos
  const raiz = slugificar(`${nome} ${local.bairro} ${local.cidade}`)
  let slug = raiz
  for (let n = 2; usados.has(slug); n++) slug = `${raiz}-${n}`

  // As fotos já foram para o S3 na pasta do id que o formulário gerou; vale esse id, se estiver livre.
  const pedido = texto(fd, 'id', 40)
  const id = ID_CRIADO.test(pedido) && !(await obterRegistro(pedido)) ? pedido : `${PREFIXO_CRIADO}${Date.now().toString(36)}`
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
  // Não usa redirect(): chamado do navegador ele faz a ação "falhar" e o formulário mostraria erro com o imóvel já salvo.
  return { status: 'sucesso', mensagem: 'Imóvel cadastrado e publicado no site.', destino: `/admin/imoveis/${id}` }
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

// ---------- Construtoras ----------

/** Cadastro, renomeação e exclusão pelo painel. Voltam `{ ok, erro }` para a tela mostrar a mensagem. */
export async function cadastrarConstrutora(nome: string): Promise<ResultadoConstrutora> {
  const admin = await exigirAdmin()
  const r = await criarConstrutora(nome, admin.email)
  if (r.ok) publicar()
  return r
}

export async function renomearConstrutoraAcao(id: number, nome: string): Promise<ResultadoConstrutora> {
  const admin = await exigirAdmin()
  if (!Number.isInteger(id)) return { ok: false, erro: 'Construtora não encontrada.' }
  const r = await renomearConstrutora(id, nome, admin.email)
  if (r.ok) publicar()
  return r
}

export async function excluirConstrutoraAcao(id: number): Promise<ResultadoConstrutora> {
  const admin = await exigirAdmin()
  if (!Number.isInteger(id)) return { ok: false, erro: 'Construtora não encontrada.' }
  const r = await excluirConstrutora(id, admin.email)
  if (r.ok) publicar()
  return r
}

// ---------- Administradores (só o principal) ----------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function cadastrarAdministrador(dados: { nome: string; usuario: string; senha: string }): Promise<ResultadoAdministrador> {
  const admin = await exigirPrincipal()
  if (typeof dados !== 'object' || dados === null) return { ok: false, erro: 'Preencha os dados do administrador.' }
  const r = await criarAdministrador(dados, admin.email)
  if (r.ok) refresh()
  return r
}

/** Nome, usuário e senha de um administrador (o principal também edita os próprios); senha vazia mantém a atual. */
export async function editarDadosAdministrador(id: string, dados: { nome: string; usuario: string; senha: string }): Promise<ResultadoAdministrador> {
  const admin = await exigirPrincipal()
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, erro: 'Administrador não encontrado.' }
  if (typeof dados !== 'object' || dados === null) return { ok: false, erro: 'Preencha os dados do administrador.' }
  // Trocando a própria senha, a sessão em uso continua valendo; as outras caem.
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  const r = await editarAdministrador(id, dados, admin.email, id === admin.id && token ? hashDoToken(token) : undefined)
  if (r.ok) refresh()
  return r
}

/** Exclui outro administrador de vez; o acesso dele acaba na hora. */
export async function excluirAdministradorAcao(id: string): Promise<ResultadoAdministrador> {
  const admin = await exigirPrincipal()
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, erro: 'Administrador não encontrado.' }
  const r = await excluirAdministrador(id, admin.email)
  if (r.ok) refresh()
  return r
}

// ---------- Listas do formulário ----------

/** Cidades de um estado (IBGE + catálogo) e os bairros já cadastrados em cada uma, para os seletores do formulário. */
export async function listarLocais(uf: string): Promise<LocaisDoEstado> {
  await exigirAdmin()
  if (typeof uf !== 'string' || !UFS.includes(uf)) return { cidades: [], bairros: {} }
  return locaisDoEstado(uf)
}
