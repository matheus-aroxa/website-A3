import { privacidade } from './privacidade'
import type { ConteudoIdioma } from './tipos'

const it: ConteudoIdioma = {
  guia: {
    tituloSeo: 'Comprare casa in Brasile da straniero: la guida completa',
    descricaoSeo:
      'Uno straniero può comprare casa in Brasile? Sì. Come ottenere il CPF, l’acquisto passo per passo, l’invio del denaro, tasse e costi, l’acquisto a distanza e la residenza tramite investimento immobiliare.',
    sobretitulo: 'Guida all’acquisto',
    titulo: 'Come comprare casa in Brasile da straniero',
    intro:
      'Sì, gli stranieri possono comprare immobili in Brasile, anche senza viverci. Per appartamenti e case in città le regole sono le stesse dei brasiliani: non ci sono limiti di valore né di numero. Serve solo il CPF, il codice fiscale brasiliano. Questa guida ti accompagna in tutto il percorso, dal primo contatto alla consegna delle chiavi.',
    secoes: [
      {
        titulo: 'Chi può comprare',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Immobili urbani',
                texto: '(appartamenti, case, terreni in città): qualsiasi straniero, residente o no, alle stesse condizioni di un brasiliano.',
              },
              {
                destaque: 'Immobili rurali e zone di confine:',
                texto: 'hanno regole e autorizzazioni proprie. Non è il caso degli immobili proposti da A3, tutti urbani e sulla costa del Pernambuco.',
              },
              {
                destaque: 'Immobili fronte mare:',
                texto:
                  'una parte della costa è “terreno de marinha”, area che appartiene allo Stato federale. Un appartamento in condominio in città non richiede autorizzazioni, purché le unità di proprietà di stranieri non superino un terzo del terreno dell’edificio. Case e terreni in quella fascia possono richiedere un’autorizzazione federale. A3 verifica la situazione di ogni immobile presso il registro prima della proposta.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Il CPF',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Il CPF è il primo passo ed è gratuito. Gli stranieri che vivono all’estero lo richiedono di persona presso un consolato o un’ambasciata del Brasile, prenotando l’appuntamento sul sito e-Consular. Porta il modulo della Receita Federal compilato e firmato, un documento d’identità e il certificato di nascita o di matrimonio. In seguito, la registrazione va confermata una volta l’anno tramite l’app della Receita Federal.',
          },
        ],
      },
      {
        titulo: 'L’acquisto passo per passo',
        blocos: [
          {
            tipo: 'passos',
            itens: [
              {
                destaque: 'Scelta dell’immobile.',
                texto: 'Racconta ad A3 cosa cerchi: viverci, trascorrere le vacanze o affittare. Ti mandiamo proposte, foto e video e, se vuoi, facciamo la visita in videochiamata.',
              },
              {
                destaque: 'Verifica dei documenti.',
                texto: 'Prima della proposta controlliamo la visura dell’immobile presso il registro, i certificati del venditore e se ci sono debiti di condominio o di IPTU, l’imposta annuale sull’immobile.',
              },
              {
                destaque: 'Proposta e contratto.',
                texto: 'Concordato il prezzo, si firma un contratto preliminare di compravendita, di solito con una caparra.',
              },
              { destaque: 'Pagamento.', texto: 'Il denaro entra in Brasile tramite una banca o un operatore di cambio autorizzati (vedi sotto).' },
              {
                destaque: 'Rogito e registrazione.',
                texto: 'L’atto si firma presso un notaio e poi si registra presso il registro immobiliare. L’immobile è tuo solo dopo la registrazione.',
              },
              {
                destaque: 'Chiavi.',
                texto:
                  'Immobile pronto: ricevi le chiavi e si volturano acqua, luce e condominio. Nuovo progetto: paghi secondo il calendario del costruttore e ricevi l’immobile a fine lavori.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'Con i documenti in regola, per un immobile pronto servono di solito da 30 a 60 giorni dalla proposta alla registrazione.',
          },
        ],
      },
      {
        titulo: 'Come inviare il denaro',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Il pagamento arriva dall’estero con un contratto di cambio, stipulato con una banca o un operatore autorizzati dalla Banca Centrale del Brasile. Conserva il contratto e le ricevute: dimostrano la provenienza del denaro e rendono più semplice riportarlo all’estero in caso di vendita futura. L’acquisto da parte di una persona fisica per uso proprio, in genere, non va dichiarato nel sistema degli investimenti esteri della Banca Centrale. La tua banca o l’operatore di cambio ti consiglierà sul tuo caso.',
          },
        ],
      },
      {
        titulo: 'Tasse e costi di acquisto',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['Voce', 'Quanto', 'Quando'],
            linhas: [
              ['ITBI, l’imposta comunale sul trasferimento', 'Di solito il 3% del valore; Recife ha offerto riduzioni temporanee', 'Prima del rogito'],
              ['Rogito e registrazione', 'Di solito dall’1% al 2% del valore, secondo una tabella ufficiale dello Stato', 'Al rogito e alla registrazione'],
              ['IPTU, l’imposta annuale sull’immobile', 'Dipende dall’immobile e dalla città', 'Ogni anno'],
              ['Spese condominiali', 'Dipendono dall’edificio', 'Ogni mese'],
            ],
            nota:
              'Nel budget, considera circa il 4–5% in più rispetto al prezzo dell’immobile. A3 ti indica l’importo esatto di ogni immobile prima della proposta. In Brasile, la provvigione dell’agenzia è normalmente a carico del venditore.',
          },
        ],
      },
      {
        titulo: 'Dopo l’acquisto: affitto e vendita',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Affitto:',
                texto: 'puoi affittare l’immobile per le vacanze o con contratto annuale. Per chi non risiede in Brasile, l’imposta sul reddito da affitto è del 15%, versata dal tuo procuratore in Brasile.',
              },
              {
                destaque: 'Vendita:',
                texto:
                  'la plusvalenza paga l’imposta sui guadagni di capitale: 15% sui guadagni fino a R$ 5 milioni, con aliquote più alte oltre questa cifra. Le esenzioni previste per i residenti in Brasile non valgono per chi vive all’estero.',
              },
              {
                destaque: 'Riforma fiscale:',
                texto:
                  'il Brasile ha introdotto nuove imposte sulle operazioni immobiliari. Una persona fisica inizia a pagarle sugli affitti solo con più di tre immobili affittati e più di R$ 240.000 l’anno di canoni (importo aggiornato con l’inflazione), oppure con oltre R$ 288.000 di canoni in un anno.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Mutuo',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Il mutuo bancario richiede un conto presso una banca brasiliana e un reddito dimostrabile. Per chi non risiede in Brasile è raro e lento. La soluzione più comune è pagare in un’unica soluzione oppure, per i nuovi progetti, a rate direttamente al costruttore durante i lavori.',
          },
        ],
      },
      {
        titulo: 'Comprare senza venire in Brasile',
        blocos: [
          { tipo: 'paragrafo', texto: 'Puoi fare tutto a distanza. Le opzioni sono:' },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Rogito in videoconferenza:',
                texto: 'i notai brasiliani stipulano atti online tramite e-Notariado, con una firma digitale gratuita rilasciata dallo stesso studio notarile. Per gli immobili, il notaio è quello della città in cui si trova l’immobile.',
              },
              {
                destaque: 'Procura:',
                texto:
                  'nomini una persona di fiducia in Brasile che firmi per te. Si può fare presso un consolato brasiliano o un notaio del tuo Paese, con apostille e traduzione giurata. Se affitti l’immobile, il procuratore versa anche l’imposta sull’affitto.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Vivere in Brasile investendo in immobili',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Il Brasile concede il permesso di residenza agli stranieri che investono in immobili urbani. Il minimo è di R$ 1 milione, oppure R$ 700.000 nel Nordest, dove si trova il Pernambuco, e l’importo può essere distribuito su più immobili. Il primo permesso vale 4 anni e può diventare permanente se mantieni l’investimento.',
          },
        ],
      },
      {
        titulo: 'Domande frequenti',
        blocos: [
          {
            tipo: 'perguntas',
            itens: [
              { pergunta: 'Devo vivere in Brasile per comprare?', resposta: 'No. Chi non è residente compra normalmente con il CPF.' },
              { pergunta: 'Posso comprare più di un immobile?', resposta: 'Sì, per gli immobili urbani non ci sono limiti.' },
              { pergunta: 'In che valuta pago?', resposta: 'In real brasiliani. Il cambio si fa tramite una banca o un operatore autorizzati.' },
              { pergunta: 'Quanto tempo ci vuole?', resposta: 'Per un immobile pronto, con i documenti in regola, da 30 a 60 giorni tra la proposta e la registrazione.' },
              { pergunta: 'Posso parlare con A3 nella mia lingua?', resposta: 'Scrivici nella tua lingua su WhatsApp o tramite il modulo, e A3 ti risponde.' },
            ],
          },
        ],
      },
    ],
    aviso:
      'Questa guida ha scopo informativo, si basa sulla legislazione brasiliana di novembre 2026 e non sostituisce il parere di un avvocato o di un commercialista per il tuo caso specifico.',
    chamada: {
      titulo: 'Pronto per iniziare?',
      texto: 'Raccontaci cosa cerchi. Un agente di A3 ti guiderà in ogni passaggio.',
      botao: 'Parla con un agente',
    },
  },
  regiao: {
    tituloSeo: 'Vivere e investire a Recife e sulla costa del Pernambuco, Brasile',
    descricaoSeo:
      'Sole tutto l’anno, spiagge calde protette dalle barriere coralline e voli diretti per l’Europa e il Sud America. Dove si trovano gli immobili di A3: Recife, Olinda, Paulista, Igarassu e Jaboatão.',
    sobretitulo: 'La regione',
    titulo: 'Recife e la costa del Pernambuco',
    intro:
      'Il Pernambuco ha sole tutto l’anno, spiagge dall’acqua calda protette dalle barriere coralline e una delle capitali più vivaci del Brasile. Si trova nel punto del continente più vicino all’Europa e all’Africa, e questo accorcia i voli internazionali. A3 opera nell’area metropolitana di Recife, con particolare attenzione alla costa nord: Paulista, Olinda e Igarassu.',
    secoes: [
      {
        titulo: 'Dove si trovano gli immobili',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['Città', 'Distanza dall’aeroporto', 'Da sapere'],
            linhas: [
              [
                'Recife',
                'Da 5 a 20 km',
                'Il capoluogo dello Stato. La spiaggia di Boa Viagem, il centro storico di Recife Antigo, ospedali, università e il Porto Digital, uno dei maggiori poli tecnologici del Paese.',
              ],
              ['Olinda', 'Circa 20 km', 'Centro storico Patrimonio dell’Umanità UNESCO e uno dei carnevali più famosi del Brasile.'],
              [
                'Paulista',
                'Circa 30 km',
                'Sede di A3. Le spiagge tranquille di Janga, Pau Amarelo (con il suo forte del XVIII secolo) e Maria Farinha, con gite in barca. Prezzi più bassi rispetto al capoluogo.',
              ],
              ['Igarassu', 'Circa 40 km', 'Una delle città più antiche del Brasile, vicino all’isola di Itamaracá.'],
              ['Jaboatão dos Guararapes', 'Circa 10 km', 'Le spiagge di Piedade e Candeias, che proseguono il lungomare di Boa Viagem.'],
            ],
            nota: 'Distanze approssimative su strada dall’aeroporto internazionale di Recife.',
          },
        ],
      },
      {
        titulo: 'Clima',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Il clima è tropicale, con temperature tra 24 °C e 31 °C tutto l’anno e il mare intorno ai 27 °C. Piove di più tra aprile e luglio. Da settembre a marzo è alta stagione, con giornate asciutte e soleggiate.',
          },
        ],
      },
      {
        titulo: 'Come arrivare',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'L’aeroporto internazionale di Recife è il più trafficato del Nordest del Brasile. Ha voli diretti per Lisbona, Porto, Madrid, Buenos Aires, Córdoba, Montevideo e Santiago del Cile. Dall’Italia si arriva con un solo scalo a Lisbona o a Madrid. Nel 2026 i passeggeri internazionali sono cresciuti di circa il 40%.',
          },
        ],
      },
      {
        titulo: 'Escursioni nei dintorni',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Porto de Galinhas',
                texto: '(circa 60 km a sud di Recife): piscine naturali tra le barriere coralline, eletta più volte la spiaggia più bella del Brasile.',
              },
              { destaque: 'Isola di Itamaracá', texto: '(circa 20 km da Paulista): spiagge tranquille e il Forte Orange, costruito dagli olandesi.' },
              { destaque: 'Fernando de Noronha:', texto: 'l’arcipelago più famoso del Brasile appartiene anch’esso al Pernambuco, a circa un’ora di volo da Recife.' },
            ],
          },
        ],
      },
      {
        titulo: 'Perché investire qui',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Prezzo:',
                texto:
                  'le mete di mare più famose del Brasile sono care. Il metro quadro supera i R$ 13.000 a Florianópolis e gli R$ 11.000 a Rio de Janeiro. Sulla costa nord del Pernambuco ci sono case vicino al mare a prezzi molto più bassi.',
              },
              { destaque: 'Affitti brevi:', texto: 'domanda tutto l’anno, con picchi in estate e durante il carnevale di Olinda e Recife.' },
              {
                destaque: 'Residenza:',
                texto: 'nel Nordest, l’investimento immobiliare minimo per chiedere il permesso di residenza in Brasile è di R$ 700.000, contro R$ 1 milione nel resto del Paese (vedi la guida all’acquisto).',
              },
              {
                destaque: 'Costo della vita:',
                texto: 'servizi, alimentari e casa costano meno che nelle grandi città del Sudest, con ospedali, scuole e negozi completi a Recife.',
              },
            ],
          },
        ],
      },
    ],
    chamada: {
      titulo: 'Trova il tuo posto in Pernambuco',
      texto: 'Guarda gli immobili selezionati per acquirenti internazionali, oppure raccontaci cosa cerchi.',
      botao: 'Parla con un agente',
    },
  },
  privacidade: privacidade.it,
}

export default it
