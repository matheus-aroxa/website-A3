// Quais imóveis aparecem na área internacional. Provisório: só os à venda e fora do Minha Casa Minha Vida (o programa
// exige ser brasileiro e ter renda dentro da faixa). Quando a A3 definir o recorte (por preço, cidade, escolha no
// painel…), a regra muda só aqui: listagem, fichas e sitemap da área internacional passam todos por esta função.
import type { Imovel } from '@/lib/imoveis/tipos'

export function noRecorteInternacional(im: Pick<Imovel, 'finalidade' | 'mcmv'>) {
  return im.finalidade === 'venda' && !im.mcmv
}
