// Nomes legíveis para os códigos que a medição grava (canal, aparelho, botão, filtro...). Sem dependência de servidor.
import { rotuloSituacao, rotuloTipo } from '@/lib/imoveis/formato'
import type { Situacao, TipoImovel } from '@/lib/imoveis/tipos'

export const rotuloCanal: Record<string, string> = {
  direto: 'Direto ou não identificado',
  busca: 'Busca (Google e outros)',
  'redes-sociais': 'Redes sociais',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  pago: 'Anúncios pagos',
  sites: 'Outros sites',
}

const NOMES_DE_ORIGEM: Record<string, string> = {
  google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo', yahoo: 'Yahoo', ecosia: 'Ecosia', yandex: 'Yandex', brave: 'Brave',
  instagram: 'Instagram', facebook: 'Facebook', x: 'X (Twitter)', linkedin: 'LinkedIn', youtube: 'YouTube', tiktok: 'TikTok',
  pinterest: 'Pinterest', telegram: 'Telegram', whatsapp: 'WhatsApp',
}

/** "redes-sociais:instagram" → "Instagram"; o canal vem junto na chave do resumo. */
export function rotuloOrigem(chave: string) {
  const origem = chave.includes(':') ? chave.slice(chave.indexOf(':') + 1) : chave
  return NOMES_DE_ORIGEM[origem] ?? origem
}

export const canalDaOrigem = (chave: string) => chave.split(':')[0]!

export const rotuloAparelho: Record<string, string> = { celular: 'Celular', computador: 'Computador', tablet: 'Tablet', desconhecido: 'Não identificado' }

export const rotuloTipoDePagina: Record<string, string> = { home: 'Página inicial', busca: 'Busca de imóveis', imovel: 'Página do imóvel', outras: 'Outras páginas' }

export const rotuloEvento: Record<string, string> = {
  whatsapp: 'Cliques no WhatsApp',
  ligacao: 'Cliques no telefone',
  email: 'Cliques no e-mail',
  'formulario-enviado': 'Formulários enviados',
  'formulario-iniciado': 'Formulários iniciados',
  'formulario-erro': 'Formulários com erro',
  galeria: 'Uso da galeria de fotos',
  planta: 'Plantas vistas',
  mapa: 'Mapa aberto',
  compartilhar: 'Compartilhamentos',
  card: 'Cliques em cards de imóveis',
  externo: 'Links para outros sites',
  acao: 'Outras ações',
}

export const rotuloBotaoWhatsApp: Record<string, string> = {
  'botao-flutuante': 'Botão flutuante',
  'ficha-preco': 'Ficha do imóvel (caixa de preço)',
  'ficha-barra-celular': 'Ficha do imóvel (barra do celular)',
  'rodape-anunciar': 'Rodapé (anunciar imóvel)',
  'menu-mobile': 'Menu do celular',
  'home-anunciar': 'Início (anunciar imóvel)',
  'home-contato': 'Início (canais de contato)',
  'home-servico': 'Início (serviços)',
  'busca-sem-resultado': 'Busca sem resultado',
  'pagina-404': 'Página não encontrada',
  rodape: 'Rodapé',
  outro: 'Outro',
}

export const rotuloFormulario: Record<string, string> = {
  contato: 'Quero ser atendido',
  visita: 'Agendar visita',
  corretor: 'Falar com um corretor',
}

export const rotuloLista: Record<string, string> = { home: 'Destaques da página inicial', busca: 'Resultados da busca', semelhantes: 'Imóveis semelhantes', link: 'Outro link' }

export const rotuloCampo: Record<string, string> = { nome: 'Nome', whatsapp: 'WhatsApp', consentimento: 'Autorização de contato', agenda: 'Dias e horários', imovel: 'Imóvel', email: 'E-mail' }

export const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const rotuloCategoria: Record<string, string> = { venda: 'Venda', aluguel: 'Aluguel' }
const rotuloEntrega: Record<string, string> = { pronto: 'Pronto para morar', '2026': 'Entrega até 2026', '2027': 'Entrega até 2027', '2028': 'Entrega até 2028' }
const rotuloOrdem: Record<string, string> = { 'menor-preco': 'Menor preço', 'maior-preco': 'Maior preço', 'maior-area': 'Maior área', 'mais-quartos': 'Mais quartos' }

export const rotuloTipoFiltro: Record<string, string> = {
  categoria: 'Venda ou aluguel', situacao: 'Fase da obra', tipo: 'Tipo de imóvel', cidade: 'Cidade', bairro: 'Bairro', construtora: 'Construtora',
  quartos: 'Quartos', banheiros: 'Banheiros', vagas: 'Vagas', mcmv: 'Minha Casa Minha Vida', area: 'Área', entrega: 'Entrega', ordem: 'Ordenação',
}

export interface NomesDosFiltros {
  cidades: Map<string, string>
  bairros: Map<string, string>
  construtoras: Map<string, string>
}

/** "cidade:paulista" → { tipo: "Cidade", valor: "Paulista" }. */
export function descreverFiltro(item: string, nomes: NomesDosFiltros) {
  const [tipo = '', ...resto] = item.split(':')
  const valor = resto.join(':')
  const texto =
    tipo === 'cidade' ? nomes.cidades.get(valor)
    : tipo === 'bairro' ? nomes.bairros.get(valor)
    : tipo === 'construtora' ? nomes.construtoras.get(valor)
    : tipo === 'situacao' ? rotuloSituacao[valor as Situacao]
    : tipo === 'tipo' ? rotuloTipo[valor as TipoImovel]
    : tipo === 'categoria' ? rotuloCategoria[valor]
    : tipo === 'entrega' ? rotuloEntrega[valor]
    : tipo === 'ordem' ? rotuloOrdem[valor]
    : tipo === 'quartos' || tipo === 'banheiros' || tipo === 'vagas' ? `${valor}+`
    : tipo === 'mcmv' ? 'Sim'
    : tipo === 'area' ? 'Informada'
    : undefined
  return { tipo: rotuloTipoFiltro[tipo] ?? tipo, valor: texto ?? valor }
}
