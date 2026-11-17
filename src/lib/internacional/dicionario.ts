// O que cada idioma da área internacional traduz. Os textos ficam em ./dicionarios/<idioma>.ts; os textos longos
// (guia de compra e região) em ./conteudo/<idioma>.ts. As páginas seguem o mesmo desenho das páginas em português
// (home, busca, ficha), então os grupos abaixo acompanham as seções delas. Textos com {chave} recebem o valor na hora
// (ver `preencher`).
import type { Situacao, TipoImovel } from '@/lib/imoveis/tipos'

export interface Dicionario {
  marca: {
    /** Frase curta sob o logo no rodapé. */
    descricao: string
  }
  nav: {
    principal: string
    inicio: string
    imoveis: string
    guia: string
    regiao: string
    contato: string
    idioma: string
    /** "Português" no seletor de idioma (o nome do idioma escrito nele mesmo). */
    portugues: string
    pularConteudo: string
    voceEstaEm: string
    menuAbrir: string
    menuFechar: string
    faleConosco: string
    faleConoscoWhatsApp: string
  }
  inicio: {
    tituloSeo: string
    descricaoSeo: string
    /** "Your home on the coast of <span>Pernambuco, Brazil.</span>" */
    titulo: string
    tituloDestaque: string
    /** Texto do topo; {nome} vira o nome da imobiliária em negrito. */
    subtitulo: string
    /** Painel de busca do topo (como o "Encontre seu imóvel"). */
    busca: {
      titulo: string
      /** Abas: lançamentos e obras, prontos para morar, todos. */
      modos: [string, string, string]
      modosRotulo: string
      tipo: string
      cidade: string
      todos: string
      todas: string
      nome: string
      nomeDica: string
      buscar: string
      maisFiltros: string
      menosFiltros: string
      precoMax: string
    }
    destaquesSobretitulo: string
    destaquesTitulo: string
    verTodos: string
    servicosSobretitulo: string
    servicosTitulo: string
    servicosTituloDestaque: string
    servicosTexto: string
    /** Quatro cartões: escolher de longe, guia, comprar a distância, a região. */
    servicos: { titulo: string; texto: string; link: string }[]
    chamadaTitulo: string
    chamadaTexto: string
    chamadaGuia: string
    chamadaCorretor: string
    sobreSobretitulo: string
    sobreTitulo: string
    sobreTexto: string[]
    diferenciais: string[]
    fotoEquipe: string
    depoSobretitulo: string
    depoTitulo: string
    depoTituloDestaque: string
    depoTexto: string
    /** Os depoimentos da home em português, traduzidos (nomes e ordem iguais). */
    depoimentos: { selo: string; texto: string; ocupacao: string }[]
    contatoSobretitulo: string
    contatoTitulo: string
    contatoTexto: string
    canalWhatsApp: string
    canalEmail: string
    canalEscritorio: string
    mapaLegenda: string
    fuso: string
  }
  imoveis: {
    tituloSeo: string
    descricaoSeo: string
    titulo: string
    intro: string
    buscaRotulo: string
    buscaDica: string
    filtros: string
    fecharFiltros: string
    limparFiltros: string
    limparCurto: string
    ordem: string
    ordemRecentes: string
    ordemMenorPreco: string
    ordemMaiorPreco: string
    ordemMaiorArea: string
    cidade: string
    todasCidades: string
    bairro: string
    todosBairros: string
    /** Filtro de preço máximo, na moeda do idioma. */
    precoMax: string
    qualquerPreco: string
    /** "Up to {valor}". */
    ateValor: string
    tipo: string
    situacao: string
    quartos: string
    banheiros: string
    vagas: string
    todos: string
    todas: string
    disponiveisUm: string
    disponiveis: string
    encontradosUm: string
    encontrados: string
    /** Botão do painel no celular. */
    verResultados: string
    nenhumBotao: string
    removerFiltro: string
    limparTudo: string
    nenhumTitulo: string
    nenhumTexto: string
    falarCorretor: string
    paginacao: string
    paginaAnterior: string
    proximaPagina: string
    carregarMais: string
    /** {n} de {total}. */
    mostrando: string
  }
  imovel: {
    situacao: Record<Situacao, string>
    tipo: Record<TipoImovel, string>
    tipoPlural: Record<TipoImovel, string>
    /** Frase sob o título: "Apartamento de 2 quartos em Janga, Paulista – PE". */
    chamada: (d: { tipo: TipoImovel; quartos: string | null; bairro: string; cidade: string; uf: string }) => string
    /** Título para o Google: nome, tipo e lugar. */
    tituloSeo: (d: { nome: string; tipo: TipoImovel; bairro: string; cidade: string }) => string
    descricaoSeo: (d: { nome: string; tipo: TipoImovel; quartos: string | null; area: string; bairro: string; cidade: string; preco: string }) => string
    /** Texto alternativo das fotos. */
    altFoto: (d: { nome: string; tipo: TipoImovel; bairro: string; cidade: string; posicao: number }) => string
    areaPrivativa: string
    quartos: string
    banheiros: string
    vagas: string
    vagasCurto: string
    vagaConsultar: string
    comSuite: string
    entrega: string
    codigo: string
    precoAPartirDe: string
    sobConsulta: string
    precoNota: string
    falarWhatsApp: string
    simularParcelas: string
    andamento: string
    obraIniciar: string
    obraAndamento: string
    obraConcluida: string
    /** "{situação} · entrega prevista {data}". */
    entregaPrevista: string
    sobre: string
    textoOriginal: string
    /** Tradução da descrição pelo próprio navegador (Chrome), quando o site ainda não tem a tradução. */
    navegador: { traduzir: string; traduzindo: string; traduzido: string; verOriginal: string; verTraducao: string }
    plantas: string
    plantasNota: string
    escolherPlanta: string
    lazer: string
    lazerMenos: string
    /** {n} = quantidade de itens. */
    lazerVerTodos: string
    localizacao: string
    abrirMapa: string
    abrirMapaRotulo: string
    pertoDe: string
    fichaTecnica: string
    tipoRotulo: string
    construtora: string
    situacaoRotulo: string
    investimento: string
    semelhantes: string
    verMais: string
    verEmPortugues: string
    /** Mensagem pronta do WhatsApp: {nome} e {codigo} do imóvel. */
    mensagemWhatsApp: string
    /** Mensagem do "Simular parcelas" (pagamento direto com a construtora): {nome}. */
    mensagemParcelas: string
    agendarVisita: string
    galeria: {
      ampliar: string
      foto: string
      fotos: string
      anterior: string
      proxima: string
      verFoto: string
      fotosDoImovel: string
      fechar: string
    }
    compartilhar: string
    linkCopiado: string
  }
  /** Abas de contato da ficha ("Agendar visita" / "Falar com corretor"). */
  visita: {
    abasRotulo: string
    abaVisita: string
    abaCorretor: string
    diasTitulo: string
    diasTexto: string
    /** Seg a dom: abreviação e nome no plural ("Mon", "Mondays"). */
    dias: [string, string][]
    horasTitulo: string
    qualquerHorario: string
    manha: string
    tarde: string
    /** {dias} e {horas} já juntados; {horas} vem de `horasAs` ou `emQualquerHorario`. */
    resumo: string
    resumoDias: string
    resumoHoras: string
    resumoVazio: string
    horasAs: string
    emQualquerHorario: string
    /** Hora no formato do idioma: {h} = 8, 13… */
    hora: string
    e: string
    observacoes: string
    observacoesDica: string
    enviarVisita: string
    quaseLa: string
    alterarAgenda: string
    erroAgenda: string
    mensagem: string
    /** {nome} do imóvel. */
    mensagemDica: string
    contatoPor: string
    ligacao: string
    enviarCorretor: string
  }
  formato: {
    quarto: string
    quartos: string
    banheiro: string
    banheiros: string
    /** Abreviação nos cards ("2 bath."). */
    banheirosCurto: string
    vaga: string
    vagas: string
    semVaga: string
    /** Entre os dois números de uma faixa: "2 to 3". */
    ate: string
    /** Entre dois números seguidos: "2 or 3". */
    ou: string
    meses: string[]
    mesesCurtos: string[]
  }
  contato: {
    titulo: string
    nome: string
    nomeDica: string
    pais: string
    paisDica: string
    whatsapp: string
    whatsappDica: string
    email: string
    mensagem: string
    mensagemDica: string
    opcional: string
    /** Antes e depois do link da política de privacidade. */
    consentimentoAntes: string
    consentimentoLink: string
    consentimentoDepois: string
    enviar: string
    enviando: string
    sucessoTitulo: string
    sucessoTexto: string
    abrirWhatsApp: string
    refazer: string
    erroNome: string
    erroWhatsApp: string
    erroEmail: string
    erroConsentimento: string
    erroImovel: string
    /** Mensagem pronta do WhatsApp do botão flutuante e do menu. */
    mensagemPadrao: string
  }
  rodape: {
    navegacao: string
    buscasFrequentes: string
    /** Atalhos para a lista de imóveis com filtros (cidades e tipos que a A3 mais tem). */
    buscas: { rotulo: string; cidade?: string; tipo?: TipoImovel; situacao?: 'lancamentos' | 'prontos' }[]
    atendimento: string
    atendimentoTexto: string
    politica: string
    /** "Brazil" no endereço. */
    pais: string
    /** Aviso no rodapé das páginas dos idiomas automáticos. */
    avisoTraducao: string
  }
  naoEncontrada: {
    titulo: string
    texto: string
    botao: string
  }
}

/** Troca cada {chave} do texto pelo valor correspondente. */
export function preencher(texto: string, valores: Record<string, string | number>) {
  return texto.replace(/\{(\w+)\}/g, (trecho, chave: string) => (chave in valores ? String(valores[chave]) : trecho))
}
