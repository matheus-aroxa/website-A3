// Fotos enviadas pelo painel. Ficam na mesma pasta de dados dos ajustes (ADMIN_DADOS_DIR/fotos)
// e são servidas por /fotos/[arquivo] (src/app/fotos/[arquivo]/route.ts).
import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pastaDados } from '@/lib/imoveis/ajustes'
import { NOME_FOTO_ENVIADA } from '@/lib/imoveis/hosts-fotos'

export const TAMANHO_MAXIMO_FOTO = 15 * 1024 * 1024

const TIPOS = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const
type Extensao = keyof typeof TIPOS

const pasta = () => path.join(pastaDados(), 'fotos')

/** Formato pelo conteúdo (assinatura do arquivo), não pelo nome nem pelo tipo informado pelo navegador. */
function detectarFormato(b: Uint8Array): Extensao | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png'
  const ascii = (de: number, ate: number) => String.fromCharCode(...b.subarray(de, ate))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  return null
}

/** Grava a foto e devolve o endereço público, ou `null` se o arquivo não for JPG, PNG ou WebP. */
export async function guardarFoto(arquivo: File): Promise<string | null> {
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  const formato = detectarFormato(bytes)
  if (!formato) return null
  const nome = `${randomUUID()}.${formato}`
  await mkdir(pasta(), { recursive: true })
  const temporario = path.join(pasta(), `${nome}.tmp`)
  await writeFile(temporario, bytes)
  await rename(temporario, path.join(pasta(), nome))
  return `/fotos/${nome}`
}

export async function lerFoto(nome: string): Promise<{ dados: Buffer; tipo: string } | null> {
  // O nome é validado antes de virar caminho: nada de "../" chega ao sistema de arquivos.
  if (!NOME_FOTO_ENVIADA.test(nome)) return null
  try {
    const dados = await readFile(path.join(pasta(), nome))
    return { dados, tipo: TIPOS[nome.split('.').pop() as Extensao] }
  } catch {
    return null
  }
}
