// Fotos enviadas pelo painel. Vão para o S3 na estrutura do catálogo (docs/fotos-s3.md):
//   imoveis/<id>/g_<AAAAMMDDHHMMSS>_<código>/  original.<jpg|png|webp>  400.webp  800.webp  1600.webp
// O original fica como veio; os tamanhos são WebP, só limitando a largura (nunca ampliam).
// Antes do S3 as fotos ficavam em ADMIN_DADOS_DIR/fotos e eram servidas por /fotos/[arquivo]:
// `lerFoto` continua lendo esses arquivos antigos.
import 'server-only'
import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { banco } from '@/lib/db'
import { obterRegistro } from '@/lib/imoveis/banco'
import { HOST_S3_FOTOS, NOME_FOTO_ENVIADA } from '@/lib/imoveis/hosts-fotos'
import { ID_CRIADO } from '@/lib/imoveis/painel'
import { pastaDados } from './dados'

export const TAMANHO_MAXIMO_FOTO = 15 * 1024 * 1024

const BUCKET = process.env.S3_FOTOS_BUCKET || 'a3-imoveis-fotos'
const REGIAO = process.env.AWS_REGION || 'sa-east-1'
const CACHE = 'public, max-age=31536000, immutable'

const TIPOS = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const
type Extensao = keyof typeof TIPOS

/** Tamanhos gerados, do menor ao maior. O 400 sempre existe; os maiores só se o original for mais largo que o anterior. */
const TAMANHOS = [
  { largura: 400, qualidade: 78 },
  { largura: 800, qualidade: 80 },
  { largura: 1600, qualidade: 80 },
] as const

let cliente: S3Client | undefined
const s3 = () => (cliente ??= new S3Client({ region: REGIAO }))

/** Formato pelo conteúdo (assinatura do arquivo), não pelo nome nem pelo tipo informado pelo navegador. */
function detectarFormato(b: Uint8Array): Extensao | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png'
  const ascii = (de: number, ate: number) => String.fromCharCode(...b.subarray(de, ate))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  return null
}

/**
 * Pasta do imóvel no bucket. Imóvel do CRM segue a pasta onde as fotos dele já estão (`imoveis/` ou
 * `empreendimentos/`, porque os ids podem coincidir); imóvel novo usa `imoveis/<id>`. `null`: id desconhecido.
 */
export async function pastaDoImovel(id: string): Promise<string | null> {
  if (!/^[\w.-]{1,40}$/.test(id)) return null
  const registro = await obterRegistro(id)
  if (!registro && !ID_CRIADO.test(id)) return null
  const existente = registro?.imovel.fotos
    .map((f) => new RegExp(`^https://${HOST_S3_FOTOS.replaceAll('.', '\\.')}/((?:imoveis|empreendimentos)/[^/]+)/`).exec(f.src)?.[1])
    .find(Boolean)
  return existente ?? `imoveis/${id}`
}

const dataHora = () => new Date().toISOString().replace(/\D/g, '').slice(0, 14)

/**
 * Envia a foto (original + tamanhos) para `<pasta>/g_<data>_<código>/` e devolve o endereço do maior tamanho,
 * o mesmo que o catálogo guarda em `fotos.src`. `null` se o arquivo não for JPG, PNG ou WebP (ou estiver corrompido).
 */
export async function guardarFoto(arquivo: File, pasta: string): Promise<string | null> {
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  const formato = detectarFormato(bytes)
  if (!formato) return null

  let largura: number
  try {
    const meta = await sharp(bytes).metadata()
    // Orientações 5 a 8 (foto de celular deitada) giram a imagem: largura e altura trocam.
    largura = ((meta.orientation ?? 1) >= 5 ? meta.height : meta.width) ?? 0
  } catch {
    return null
  }
  if (!largura) return null

  const geradas = TAMANHOS.filter((t, i) => i === 0 || largura > TAMANHOS[i - 1]!.largura)
  let variacoes: { largura: number; dados: Buffer }[]
  try {
    variacoes = await Promise.all(
      geradas.map(async (t) => ({
        largura: t.largura,
        dados: await sharp(bytes).rotate().resize({ width: t.largura, withoutEnlargement: true }).webp({ quality: t.qualidade }).toBuffer(),
      })),
    )
  } catch {
    return null
  }

  const raiz = `${pasta}/g_${dataHora()}_${randomBytes(3).toString('hex')}`
  const enviar = (nome: string, dados: Uint8Array, tipo: string) =>
    s3().send(new PutObjectCommand({ Bucket: BUCKET, Key: `${raiz}/${nome}`, Body: dados, ContentType: tipo, CacheControl: CACHE }))
  await Promise.all([
    enviar(`original.${formato}`, bytes, TIPOS[formato]),
    ...variacoes.map((v) => enviar(`${v.largura}.webp`, v.dados, 'image/webp')),
  ])
  return `https://${HOST_S3_FOTOS}/${raiz}/${variacoes.at(-1)!.largura}.webp`
}

// ---------- Apagar do S3 ----------

const HOST_RE = HOST_S3_FOTOS.replaceAll('.', '\\.')
/** `imoveis/<id>/g_<foto>` de um endereço de foto do bucket (qualquer tamanho). */
const PASTA_DA_FOTO = new RegExp(`^https://${HOST_RE}/((?:imoveis|empreendimentos)/[^/]+/g_[^/]+)/[^/]+$`)
/** Prefixos que este módulo aceita apagar: a pasta de uma foto ou a pasta inteira de um imóvel. Nada fora disso. */
const PREFIXO_APAGAVEL = /^(imoveis|empreendimentos)\/[^/]+\/(g_[^/]+\/)?$/

export interface ResultadoApagar {
  apagados: number
  falhas: number
}

/** Pasta (`imoveis/<id>/g_<foto>`) de uma foto do bucket, ou `null` se o endereço não for de lá. */
export const pastaDaFoto = (src: string) => PASTA_DA_FOTO.exec(src)?.[1] ?? null

/** Algum imóvel do banco ainda usa arquivos deste prefixo? Nesse caso ele não pode ser apagado. */
async function emUso(prefixo: string) {
  const inicio = `https://${HOST_S3_FOTOS}/${prefixo}`
  const { rowCount } = await banco().query(
    'SELECT 1 FROM fotos WHERE starts_with(src, $1) UNION ALL SELECT 1 FROM plantas WHERE starts_with(foto_src, $1) LIMIT 1',
    [inicio],
  )
  return !!rowCount
}

/** Apaga todos os objetos sob o prefixo (que termina em "/"). Devolve quantos apagou. */
async function apagarPrefixo(prefixo: string): Promise<number> {
  if (!PREFIXO_APAGAVEL.test(prefixo)) throw new Error(`Prefixo recusado: ${prefixo}`)
  let apagados = 0
  let continuacao: string | undefined
  do {
    const lista = await s3().send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefixo, ContinuationToken: continuacao }))
    const chaves = (lista.Contents ?? []).flatMap((o) => (o.Key?.startsWith(prefixo) ? [{ Key: o.Key }] : []))
    if (chaves.length) {
      const r = await s3().send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: chaves, Quiet: true } }))
      apagados += chaves.length - (r.Errors?.length ?? 0)
      if (r.Errors?.length) throw new Error(`${r.Errors.length} objetos não foram apagados em ${prefixo}`)
    }
    continuacao = lista.IsTruncated ? lista.NextContinuationToken : undefined
  } while (continuacao)
  return apagados
}

async function apagarPrefixos(prefixos: Iterable<string>): Promise<ResultadoApagar> {
  const resultado: ResultadoApagar = { apagados: 0, falhas: 0 }
  for (const prefixo of new Set(prefixos)) {
    try {
      if (await emUso(prefixo)) continue
      resultado.apagados += await apagarPrefixo(prefixo)
    } catch (erro) {
      console.error('Falha ao apagar do S3:', erro)
      resultado.falhas++
    }
  }
  return resultado
}

/**
 * Apaga do S3 as fotos (original e tamanhos) cujos endereços foram dados. Pula as que algum imóvel ainda usa e os
 * endereços que não são de fotos do bucket (hosts antigos, arquivos locais).
 */
export function apagarFotos(srcs: string[]): Promise<ResultadoApagar> {
  return apagarPrefixos(srcs.flatMap((src) => pastaDaFoto(src)?.concat('/') ?? []))
}

/**
 * Apaga do S3 tudo o que é de um imóvel que acabou de sair do banco. Se a pasta tem o id do imóvel
 * (`imoveis/<id>/`, `empreendimentos/<id>/`) vai a pasta inteira, com o que sobrou de envios não salvos;
 * senão, só a pasta de cada foto dele.
 */
export function apagarDoImovel(id: string, srcs: string[]): Promise<ResultadoApagar> {
  const prefixos = new Set<string>()
  if (ID_CRIADO.test(id)) prefixos.add(`imoveis/${id}/`)
  for (const pasta of srcs.flatMap((src) => pastaDaFoto(src) ?? [])) {
    const [tipo, pastaId] = pasta.split('/')
    prefixos.add(pastaId === id ? `${tipo}/${id}/` : `${pasta}/`)
  }
  return apagarPrefixos(prefixos)
}

// ---------- Fotos antigas, gravadas em disco antes do S3 ----------

const pastaLocal = () => path.join(pastaDados(), 'fotos')

export async function lerFoto(nome: string): Promise<{ dados: Buffer; tipo: string } | null> {
  // O nome é validado antes de virar caminho: nada de "../" chega ao sistema de arquivos.
  if (!NOME_FOTO_ENVIADA.test(nome)) return null
  try {
    const dados = await readFile(path.join(pastaLocal(), nome))
    return { dados, tipo: TIPOS[nome.split('.').pop() as Extensao] }
  } catch {
    return null
  }
}
