'use server'

import { crm, type Lead } from '@/lib/crm'
import {
  CAMPO_ARMADILHA,
  type EstadoFormulario,
  texto,
  validarConsentimento,
  validarNome,
  validarWhatsapp,
} from '@/lib/formularios'
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

function valoresDe(fd: FormData) {
  const valores: Record<string, string> = {}
  fd.forEach((v, k) => {
    if (typeof v === 'string' && !k.startsWith('$')) valores[k] = valores[k] ? `${valores[k]},${v}` : v
  })
  return valores
}

async function registrar(lead: Omit<Lead, 'criadoEm' | 'consentimento'>, sucesso: string): Promise<EstadoFormulario> {
  try {
    await crm.enviarLead({ ...lead, consentimento: true, criadoEm: new Date().toISOString() })
    return { status: 'sucesso', mensagem: sucesso }
  } catch (erro) {
    console.error('[leads] falha ao enviar para o CRM', erro)
    return {
      status: 'erro',
      mensagem: 'Não conseguimos enviar agora. Tente de novo ou chame a gente no WhatsApp.',
    }
  }
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
  if (!semErros(erros)) return { status: 'erro', erros, valores: valoresDe(fd) }

  const resultado = await registrar(
    { origem: 'contato-home', ...dados },
    'Mensagem enviada para o WhatsApp da A3.'
  )
  // A conversa é aberta no WhatsApp da A3, já com os dados preenchidos no formulário.
  return resultado.status === 'sucesso' ? { ...resultado, whatsapp: linkWhatsApp(mensagemAtendimento(dados)) } : resultado
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
  if (!semErros(erros)) return { status: 'erro', erros, valores: valoresDe(fd) }

  const resultado = await registrar(
    { origem: 'visita-imovel', ...dados, imovel, visita: { dias, horarios } },
    `Abrindo o WhatsApp da A3 para confirmar a visita ao ${imovel!.nome}.`
  )
  // A conversa é aberta no WhatsApp da A3, já com a disponibilidade escolhida.
  const agenda = `${DIAS_DA_SEMANA.filter(([d]) => dias.includes(d)).map(([, nome]) => nome).join(', ')}, às ${[...horarios]
    .sort()
    .map((h) => `${parseInt(h, 10)}h`)
    .join(', ')}`
  return resultado.status === 'sucesso'
    ? { ...resultado, whatsapp: linkWhatsApp(mensagemVisita({ ...dados, agenda }, imovel!)) }
    : resultado
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
  if (!semErros(erros)) return { status: 'erro', erros, valores: valoresDe(fd) }

  const resultado = await registrar(
    { origem: 'corretor-imovel', ...dados, imovel },
    `Abrindo o WhatsApp da A3 com sua mensagem sobre o ${imovel!.nome}.`
  )
  // A conversa é aberta no WhatsApp da A3, já com os dados preenchidos no formulário.
  const rotuloCanal = dados.canalPreferido === 'ligacao' ? 'Ligação' : 'WhatsApp'
  return resultado.status === 'sucesso'
    ? { ...resultado, whatsapp: linkWhatsApp(mensagemImovel({ ...dados, canal: rotuloCanal }, imovel!)) }
    : resultado
}
