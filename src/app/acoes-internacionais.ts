'use server'

// Formulários da área internacional. Como os do site em português (acoes.ts), não guardam nada: conferem os dados e
// devolvem o link do WhatsApp da A3 com a mensagem pronta. A mensagem começa no idioma do visitante (é ele quem a envia)
// e traz os dados com rótulos em português, para a equipe, com o idioma em destaque. Os erros voltam no idioma da página.
import { medirFormulario } from '@/lib/coleta/formulario'
import { CAMPO_ARMADILHA, apenasDigitos, texto, type EstadoFormulario } from '@/lib/formularios'
import { obterImovelPorId } from '@/lib/imoveis/repositorio'
import { preencher } from '@/lib/internacional/dicionario'
import { ehIdioma, type Idioma } from '@/lib/internacional/idiomas'
import { dicionario } from '@/lib/internacional/textos'
import { linkWhatsApp } from '@/lib/site'

const NOME_IDIOMA_PT: Record<Idioma, string> = { en: 'inglês', it: 'italiano', es: 'espanhol', fr: 'francês', de: 'alemão' }

/** Dias da semana da agenda de visita (mesmas chaves do formulário em português) e o nome em português, para a equipe. */
const DIAS = [
  ['seg', 'segundas'],
  ['ter', 'terças'],
  ['qua', 'quartas'],
  ['qui', 'quintas'],
  ['sex', 'sextas'],
  ['sáb', 'sábados'],
  ['dom', 'domingos'],
] as const

type Erros = Partial<Record<string, string>>

const ehRobo = (fd: FormData) => texto(fd, CAMPO_ARMADILHA) !== ''

function idiomaDo(fd: FormData): Idioma {
  const valor = texto(fd, 'idioma', 5)
  return ehIdioma(valor) ? valor : 'en'
}

function valoresDe(fd: FormData) {
  const valores: Record<string, string> = {}
  fd.forEach((v, k) => {
    if (typeof v === 'string' && !k.startsWith('$')) valores[k] = valores[k] ? `${valores[k]},${v}` : v
  })
  return valores
}

/** Nome, WhatsApp internacional (8 a 15 dígitos, com o código do país), e-mail opcional e autorização. */
function validarPessoa(fd: FormData, idioma: Idioma) {
  const d = dicionario(idioma).contato
  const dados = {
    nome: texto(fd, 'nome', 100),
    pais: texto(fd, 'pais', 60),
    whatsapp: texto(fd, 'whatsapp', 30),
    email: texto(fd, 'email', 120),
  }
  const digitos = apenasDigitos(dados.whatsapp)
  const erros: Erros = {
    nome: dados.nome.length >= 2 ? undefined : d.erroNome,
    whatsapp: digitos.length >= 8 && digitos.length <= 15 ? undefined : d.erroWhatsApp,
    email: !dados.email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dados.email) ? undefined : d.erroEmail,
    consentimento: fd.get('consentimento') === 'on' ? undefined : d.erroConsentimento,
  }
  return { dados: { ...dados, whatsapp: dados.whatsapp.startsWith('+') ? dados.whatsapp : `+${dados.whatsapp}` }, erros }
}

async function imovelDoFormulario(fd: FormData) {
  const id = texto(fd, 'imovel', 100)
  const imovel = id ? await obterImovelPorId(id) : null
  return imovel ? { id: imovel.id, codigo: imovel.codigo, nome: imovel.nome } : undefined
}

function mensagem(abertura: string, idioma: Idioma, linhas: [string, string | undefined | null][]) {
  const corpo = linhas
    .filter(([, valor]) => valor)
    .map(([rotulo, valor]) => `${rotulo}: ${valor}`)
    .join('\n')
  return `${abertura}\n\n[Cliente internacional · ${NOME_IDIOMA_PT[idioma]}]\n${corpo}`
}

async function falhou(formulario: 'contato' | 'visita' | 'corretor', erros: Erros, fd: FormData, imovelId?: string): Promise<EstadoFormulario> {
  await medirFormulario('formulario-erro', formulario, { imovelId, camposComErro: Object.keys(erros).filter((c) => erros[c]) })
  return { status: 'erro', erros, valores: valoresDe(fd) }
}

/** Contato da home internacional. */
export async function enviarContatoInternacional(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  if (ehRobo(fd)) return { status: 'sucesso' }
  const idioma = idiomaDo(fd)
  const { dados, erros } = validarPessoa(fd, idioma)
  const mensagemDigitada = texto(fd, 'mensagem', 2000)
  if (Object.values(erros).some(Boolean)) return falhou('contato', erros, fd)
  await medirFormulario('formulario-enviado', 'contato')
  const d = dicionario(idioma)
  return {
    status: 'sucesso',
    whatsapp: linkWhatsApp(
      mensagem(d.contato.mensagemPadrao, idioma, [
        ['Nome', dados.nome],
        ['País', dados.pais],
        ['WhatsApp', dados.whatsapp],
        ['E-mail', dados.email],
        ['Mensagem', mensagemDigitada],
      ]),
    ),
  }
}

/** "Agendar visita" da ficha internacional (presencial ou por vídeo), com os dias e horários escolhidos. */
export async function solicitarVisitaInternacional(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  if (ehRobo(fd)) return { status: 'sucesso' }
  const idioma = idiomaDo(fd)
  const d = dicionario(idioma)
  const imovel = await imovelDoFormulario(fd)
  const dias = fd.getAll('dias').filter((v): v is string => typeof v === 'string').slice(0, 7)
  const horarios = fd.getAll('horarios').filter((v): v is string => typeof v === 'string').slice(0, 11)
  const { dados, erros } = validarPessoa(fd, idioma)
  erros.agenda = dias.length && horarios.length ? undefined : d.visita.erroAgenda
  erros.imovel = imovel ? undefined : d.contato.erroImovel
  if (Object.values(erros).some(Boolean)) return falhou('visita', erros, fd, imovel?.id)

  await medirFormulario('formulario-enviado', 'visita', { imovelId: imovel!.id })
  const agenda = `${DIAS.filter(([chave]) => dias.includes(chave))
    .map(([, nome]) => nome)
    .join(', ')}, às ${[...horarios]
    .sort()
    .map((h) => `${parseInt(h, 10)}h`)
    .join(', ')} (horário de Recife)`
  return {
    status: 'sucesso',
    whatsapp: linkWhatsApp(
      mensagem(preencher(d.imovel.mensagemWhatsApp, { nome: imovel!.nome, codigo: imovel!.codigo }), idioma, [
        ['Pedido', 'agendar visita (presencial ou por vídeo)'],
        ['Imóvel', `${imovel!.nome} (${imovel!.codigo})`],
        ['Nome', dados.nome],
        ['País', dados.pais],
        ['WhatsApp', dados.whatsapp],
        ['Disponibilidade', agenda],
        ['Observações', texto(fd, 'observacoes', 2000)],
      ]),
    ),
  }
}

/** "Falar com corretor" da ficha internacional. */
export async function falarComCorretorInternacional(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  if (ehRobo(fd)) return { status: 'sucesso' }
  const idioma = idiomaDo(fd)
  const d = dicionario(idioma)
  const imovel = await imovelDoFormulario(fd)
  const { dados, erros } = validarPessoa(fd, idioma)
  erros.imovel = imovel ? undefined : d.contato.erroImovel
  if (Object.values(erros).some(Boolean)) return falhou('corretor', erros, fd, imovel?.id)

  await medirFormulario('formulario-enviado', 'corretor', { imovelId: imovel!.id })
  const canal = texto(fd, 'canal', 20) === 'ligacao' ? 'Ligação' : 'WhatsApp'
  return {
    status: 'sucesso',
    whatsapp: linkWhatsApp(
      mensagem(preencher(d.imovel.mensagemWhatsApp, { nome: imovel!.nome, codigo: imovel!.codigo }), idioma, [
        ['Imóvel', `${imovel!.nome} (${imovel!.codigo})`],
        ['Nome', dados.nome],
        ['País', dados.pais],
        ['WhatsApp', dados.whatsapp],
        ['E-mail', dados.email],
        ['Contato preferido', canal],
        ['Mensagem', texto(fd, 'mensagem', 2000)],
      ]),
    ),
  }
}
