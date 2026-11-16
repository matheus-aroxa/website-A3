// Ponto único de leitura do catálogo pelo site: encaminha para o banco (consultas.ts) ou para a Viniun
// (viniun/consultas.ts), conforme FONTE_IMOVEIS. As duas têm as mesmas funções e devolvem o mesmo modelo (tipos.ts).
import 'server-only'
import * as doBanco from './consultas'
import { fonteDosImoveis } from './fonte'
import * as daViniun from './viniun/consultas'

export type { PaginaResumos } from './consultas'

const fonte = () => (fonteDosImoveis() === 'viniun' ? daViniun : doBanco)

export const buscarAtivoPorId: typeof doBanco.buscarAtivoPorId = (id) => fonte().buscarAtivoPorId(id)
export const buscarAtivoPorSlug: typeof doBanco.buscarAtivoPorSlug = (slug) => fonte().buscarAtivoPorSlug(slug)
export const buscarCidades: typeof doBanco.buscarCidades = () => fonte().buscarCidades()
export const buscarConstrutoras: typeof doBanco.buscarConstrutoras = () => fonte().buscarConstrutoras()
export const buscarDestaques: typeof doBanco.buscarDestaques = (limite) => fonte().buscarDestaques(limite)
export const buscarHeroi: typeof doBanco.buscarHeroi = () => fonte().buscarHeroi()
export const buscarIndice: typeof doBanco.buscarIndice = (comFotos) => fonte().buscarIndice(comFotos)
export const buscarPagina: typeof doBanco.buscarPagina = (f, pagina, porPagina) => fonte().buscarPagina(f, pagina, porPagina)
export const buscarSemelhantes: typeof doBanco.buscarSemelhantes = (imovel, limite) => fonte().buscarSemelhantes(imovel, limite)
export const contarImoveis: typeof doBanco.contarImoveis = (f) => fonte().contarImoveis(f)
