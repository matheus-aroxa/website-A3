// Adaptador do catálogo exportado do painel Supremo. O JSON é gerado por
// `node scripts/gerar-catalogo.mjs` a partir de a3_painel_supremo.json.
// Os leads continuam no adaptador mock até a integração de envio existir.
import type { Foto, Imovel } from '@/lib/imoveis/tipos'
import type { AdaptadorCrm } from '../tipos'
import { adaptadorMock } from '../mock'
import catalogo from './catalogo.json'

// As fotos do Supremo não trazem dimensões; o site as exibe com `fill`, então o valor é só de referência.
const LARGURA = 1600
const ALTURA = 1200

type ImovelBruto = Omit<Imovel, 'fotos' | 'capa'> & { fotos: string[] }

function fotos(imovel: ImovelBruto): Foto[] {
  return imovel.fotos.map((src, i) => ({
    src,
    width: LARGURA,
    height: ALTURA,
    alt: `${imovel.nome} – foto ${i + 1}`,
  }))
}

const imoveis: Imovel[] = (catalogo as unknown as ImovelBruto[]).map((im) => ({ ...im, fotos: fotos(im) }))

export const adaptadorSupremo: AdaptadorCrm = {
  async listarImoveis() {
    return imoveis
  },
  enviarLead: adaptadorMock.enviarLead,
}
