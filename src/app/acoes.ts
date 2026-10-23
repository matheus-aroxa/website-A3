'use server'

import { crm, type Lead } from '@/lib/crm'
import {
  CAMPO_ARMADILHA,
  type EstadoFormulario,
  texto,
  validarConsentimento,
  validarEmail,
  validarNome,
  validarWhatsapp,
} from '@/lib/formularios'
import { obterImovelPorId } from '@/lib/imoveis/repositorio'
import { linkWhatsApp, mensagemAtendimento } from '@/lib/site'

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
    email: texto(fd, 'email', 150),
    interesse: texto(fd, 'interesse', 80),
    mensagem: texto(fd, 'mensagem', 2000),
  }
  const erros: Erros = {
    nome: validarNome(dados.nome),
    whatsapp: validarWhatsapp(dados.whatsapp),
    email: validarEmail(dados.email),
    consentimento: validarConsentimento(fd),
  }
  if (!semErros(erros)) return { status: 'erro', erros, valores: valoresDe(fd) }

  const resultado = await registrar(
    { origem: 'contato-home', ...dados, email: dados.email || undefined },
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

  return registrar(
    { origem: 'visita-imovel', ...dados, imovel, visita: { dias, horarios } },
    'Um corretor da A3 vai confirmar a visita com você pelo WhatsApp.'
  )
}

export async function falarComCorretor(_: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  if (ehRobo(fd)) return { status: 'sucesso' }
  const imovel = await imovelDoFormulario(fd)
  const canal = texto(fd, 'canal', 20)
  const dados = {
    nome: texto(fd, 'nome', 100),
    whatsapp: texto(fd, 'whatsapp', 30),
    email: texto(fd, 'email', 150),
    mensagem: texto(fd, 'mensagem', 2000),
    canalPreferido: (['whatsapp', 'ligacao', 'email'] as const).find((c) => c === canal) ?? 'whatsapp',
  }
  const erros: Erros = {
    nome: validarNome(dados.nome),
    whatsapp: validarWhatsapp(dados.whatsapp),
    email: validarEmail(dados.email, dados.canalPreferido === 'email'),
    consentimento: validarConsentimento(fd),
    imovel: imovel ? undefined : 'Imóvel não encontrado. Recarregue a página.',
  }
  if (!semErros(erros)) return { status: 'erro', erros, valores: valoresDe(fd) }

  return registrar(
    { origem: 'corretor-imovel', ...dados, email: dados.email || undefined, imovel },
    `Um corretor da A3 vai responder sobre o ${imovel!.nome} pelo canal que você escolheu.`
  )
}
