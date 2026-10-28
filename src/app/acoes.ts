'use server'

// Os formulários não guardam nada: conferem os dados no servidor e devolvem o link do WhatsApp da A3 com a mensagem
// pronta. O contato só chega à A3 quando a pessoa envia a mensagem no WhatsApp.
import {
  CAMPO_ARMADILHA,
  type EstadoFormulario,
  texto,
  validarConsentimento,
  validarNome,
  validarWhatsapp,
} from '@/lib/formularios'
import { medirFormulario } from '@/lib/coleta/formulario'
import { obterImovelPorId } from '@/lib/imoveis/repositorio'
import { linkWhatsApp, mensagemAtendimento, mensagemImovel, mensagemVisita } from '@/lib/site'

const DIAS_DA_SEMANA = [
  ['seg', 'segundas'],
  ['ter', 'terças'],
  ['qua', 'quartas'],
  ['qui', 'quintas'],
  ['sex', 'sextas'],
  ['sáb', 'sábados'],
  ['dom', 'domingos'],
] as const

type Erros = NonNullable<EstadoFormulario['erros']>

function semErros(erros: Erros) {
  return Object.values(erros).every((e) => !e)
}

const camposComErro = (erros: Erros) => Object.keys(erros).filter((c) => erros[c])

function valoresDe(fd: FormData) {
  const valores: Record<string, string> = {}
  fd.forEach((v, k) => {
    if (typeof v === 'string' && !k.startsWith('$')) valores[k] = valores[k] ? `${valores[k]},${v}` : v
  })
  return valores
}

async function imovelDoFormulario(fd: FormData) {
  const id = texto(fd, 'imovel', 100)
  const imovel = await obterImovelPorId(id)
  return imovel ? { id: imovel.id, codigo: imovel.codigo, nome: imovel.nome } : undefined
}

// Robôs preenchem o campo-armadilha: fingimos sucesso e descartamos.
const ehRobo = (fd: FormData) => texto(fd, CAMPO_ARMADILHA) !== ''

export async function enviarContato(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  if (ehRobo(fd)) return { status: 'sucesso' }
  const dados = {
    nome: texto(fd, 'nome', 100),
    whatsapp: texto(fd, 'whatsapp', 30),
    interesse: texto(fd, 'interesse', 80),
    mensagem: texto(fd, 'mensagem', 2000),
  }
  const erros: Erros = {
    nome: validarNome(dados.nome),
    whatsapp: validarWhatsapp(dados.whatsapp),
    consentimento: validarConsentimento(fd),
  }
  if (!semErros(erros)) {
    await medirFormulario('formulario-erro', 'contato', { camposComErro: camposComErro(erros) })
    return { status: 'erro', erros, valores: valoresDe(fd) }
  }

  // A conversa é aberta no WhatsApp da A3, já com os dados preenchidos no formulário.
  await medirFormulario('formulario-enviado', 'contato')
  return {
    status: 'sucesso',
    mensagem: 'Abrindo o WhatsApp da A3 com a sua mensagem.',
    whatsapp: linkWhatsApp(mensagemAtendimento(dados)),
  }
}

export async function solicitarVisita(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  if (ehRobo(fd)) return { status: 'sucesso' }
  const imovel = await imovelDoFormulario(fd)
  const dias = fd.getAll('dias').filter((d): d is string => typeof d === 'string').slice(0, 7)
  const horarios = fd.getAll('horarios').filter((h): h is string => typeof h === 'string').slice(0, 11)
  const dados = {
    nome: texto(fd, 'nome', 100),
    whatsapp: texto(fd, 'whatsapp', 30),
    mensagem: texto(fd, 'observacoes', 2000),
  }
  const erros: Erros = {
    nome: validarNome(dados.nome),
    whatsapp: validarWhatsapp(dados.whatsapp),
    agenda: dias.length && horarios.length ? undefined : 'Escolha pelo menos um dia e um horário.',
    consentimento: validarConsentimento(fd),
    imovel: imovel ? undefined : 'Imóvel não encontrado. Recarregue a página.',
  }
  if (!semErros(erros)) {
    await medirFormulario('formulario-erro', 'visita', { imovelId: imovel?.id, camposComErro: camposComErro(erros) })
    return { status: 'erro', erros, valores: valoresDe(fd) }
  }

  // A conversa é aberta no WhatsApp da A3, já com a disponibilidade escolhida.
  await medirFormulario('formulario-enviado', 'visita', { imovelId: imovel!.id })
  const agenda = `${DIAS_DA_SEMANA.filter(([d]) => dias.includes(d)).map(([, nome]) => nome).join(', ')}, às ${[...horarios]
    .sort()
    .map((h) => `${parseInt(h, 10)}h`)
    .join(', ')}`
  return {
    status: 'sucesso',
    mensagem: `Abrindo o WhatsApp da A3 para confirmar a visita ao ${imovel!.nome}.`,
    whatsapp: linkWhatsApp(mensagemVisita({ ...dados, agenda }, imovel!)),
  }
}

export async function falarComCorretor(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  if (ehRobo(fd)) return { status: 'sucesso' }
  const imovel = await imovelDoFormulario(fd)
  const canal = texto(fd, 'canal', 20)
  const dados = {
    nome: texto(fd, 'nome', 100),
    whatsapp: texto(fd, 'whatsapp', 30),
    mensagem: texto(fd, 'mensagem', 2000),
    canalPreferido: (['whatsapp', 'ligacao'] as const).find((c) => c === canal) ?? 'whatsapp',
  }
  const erros: Erros = {
    nome: validarNome(dados.nome),
    whatsapp: validarWhatsapp(dados.whatsapp),
    consentimento: validarConsentimento(fd),
    imovel: imovel ? undefined : 'Imóvel não encontrado. Recarregue a página.',
  }
  if (!semErros(erros)) {
    await medirFormulario('formulario-erro', 'corretor', { imovelId: imovel?.id, camposComErro: camposComErro(erros) })
    return { status: 'erro', erros, valores: valoresDe(fd) }
  }

  // A conversa é aberta no WhatsApp da A3, já com os dados preenchidos no formulário.
  await medirFormulario('formulario-enviado', 'corretor', { imovelId: imovel!.id })
  const rotuloCanal = dados.canalPreferido === 'ligacao' ? 'Ligação' : 'WhatsApp'
  return {
    status: 'sucesso',
    mensagem: `Abrindo o WhatsApp da A3 com sua mensagem sobre o ${imovel!.nome}.`,
    whatsapp: linkWhatsApp(mensagemImovel({ ...dados, canal: rotuloCanal }, imovel!)),
  }
}
