import { privacidade } from './privacidade'
import type { ConteudoIdioma } from './tipos'

const de: ConteudoIdioma = {
  guia: {
    tituloSeo: 'Als Ausländer eine Immobilie in Brasilien kaufen: der komplette Ratgeber',
    descricaoSeo:
      'Dürfen Ausländer in Brasilien Immobilien kaufen? Ja. So bekommen Sie die CPF, der Kauf Schritt für Schritt, Geldtransfer, Steuern und Kosten, Kauf aus der Ferne und Aufenthalt durch Immobilieninvestition.',
    sobretitulo: 'Kaufratgeber',
    titulo: 'Als Ausländer eine Immobilie in Brasilien kaufen',
    intro:
      'Ja, Ausländer dürfen in Brasilien Immobilien kaufen, auch ohne dort zu wohnen. Für Wohnungen und Häuser in der Stadt gelten dieselben Regeln wie für Brasilianer: Es gibt keine Begrenzung von Wert oder Anzahl. Sie brauchen nur eine CPF, die brasilianische Steuernummer. Dieser Ratgeber führt Sie durch den gesamten Ablauf, vom ersten Kontakt bis zur Schlüsselübergabe.',
    secoes: [
      {
        titulo: 'Wer kaufen darf',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Immobilien in der Stadt',
                texto: '(Wohnungen, Häuser, Grundstücke): jeder Ausländer, mit oder ohne Wohnsitz in Brasilien, zu denselben Bedingungen wie ein Brasilianer.',
              },
              {
                destaque: 'Ländliche Immobilien und Grenzgebiete:',
                texto: 'Hier gelten eigene Regeln und Genehmigungen. Das betrifft die Immobilien von A3 nicht – sie liegen alle in der Stadt und an der Küste von Pernambuco.',
              },
              {
                destaque: 'Immobilien direkt am Meer:',
                texto:
                  'Ein Teil der Küste ist „terreno de marinha“, Land im Eigentum des Bundes. Eine Wohnung in einer Wohnanlage in der Stadt braucht keine Genehmigung, solange die Einheiten von Ausländern nicht mehr als ein Drittel des Grundstücks des Gebäudes ausmachen. Häuser und Grundstücke in diesem Streifen können eine Genehmigung des Bundes erfordern. A3 prüft die Lage jeder Immobilie beim Grundbuchamt, bevor Sie ein Angebot machen.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Die CPF',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Die CPF ist der erste Schritt und kostenlos. Ausländer mit Wohnsitz im Ausland beantragen sie persönlich bei einem brasilianischen Konsulat oder einer Botschaft, mit Termin über die Website e-Consular. Bringen Sie das ausgefüllte und unterschriebene Formular der Receita Federal, ein Ausweisdokument und Ihre Geburts- oder Heiratsurkunde mit. Danach muss die Registrierung einmal im Jahr in der App der Receita Federal bestätigt werden.',
          },
        ],
      },
      {
        titulo: 'Der Kauf Schritt für Schritt',
        blocos: [
          {
            tipo: 'passos',
            itens: [
              {
                destaque: 'Auswahl der Immobilie.',
                texto: 'Sagen Sie A3, was Sie suchen: zum Wohnen, für den Urlaub oder zur Vermietung. Wir schicken Ihnen Angebote, Fotos und Videos und zeigen Ihnen die Immobilie auf Wunsch per Videoanruf.',
              },
              {
                destaque: 'Prüfung der Unterlagen.',
                texto: 'Vor dem Angebot prüfen wir den Grundbuchauszug, die Bescheinigungen des Verkäufers und ob es offene Hausgeld- oder IPTU-Schulden gibt, die jährliche Grundsteuer.',
              },
              {
                destaque: 'Angebot und Vorvertrag.',
                texto: 'Ist der Preis vereinbart, wird ein Kaufvorvertrag unterschrieben, meist mit einer Anzahlung.',
              },
              { destaque: 'Zahlung.', texto: 'Das Geld kommt über eine zugelassene Bank oder Wechselstube nach Brasilien (siehe unten).' },
              {
                destaque: 'Urkunde und Eintragung.',
                texto: 'Die Kaufurkunde wird beim Notar unterschrieben und anschließend im Grundbuch eingetragen. Erst mit der Eintragung gehört die Immobilie Ihnen.',
              },
              {
                destaque: 'Schlüssel.',
                texto:
                  'Bezugsfertige Immobilie: Sie erhalten die Schlüssel, Wasser, Strom und Hausgeld werden auf Ihren Namen umgeschrieben. Neubau: Sie zahlen nach dem Zahlungsplan des Bauträgers und erhalten die Immobilie bei Fertigstellung.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'Sind die Unterlagen in Ordnung, dauert es bei einer bezugsfertigen Immobilie meist 30 bis 60 Tage vom Angebot bis zur Eintragung.',
          },
        ],
      },
      {
        titulo: 'Der Geldtransfer',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Die Zahlung kommt aus dem Ausland über einen Devisenvertrag mit einer Bank oder Wechselstube, die von der brasilianischen Zentralbank zugelassen ist. Bewahren Sie den Vertrag und die Belege auf: Sie weisen die Herkunft des Geldes nach und erleichtern den Rücktransfer bei einem späteren Verkauf. Der Kauf einer Immobilie durch eine Privatperson zur Eigennutzung muss in der Regel nicht im Auslandsinvestitionssystem der Zentralbank gemeldet werden. Ihre Bank oder Wechselstube berät Sie zu Ihrem Fall.',
          },
        ],
      },
      {
        titulo: 'Steuern und Kaufnebenkosten',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['Posten', 'Höhe', 'Wann'],
            linhas: [
              ['ITBI, die kommunale Grunderwerbsteuer', 'In der Regel 3 % des Werts; Recife hat zeitweise Ermäßigungen angeboten', 'Vor der Beurkundung'],
              ['Notar und Grundbuch', 'In der Regel 1 % bis 2 % des Werts, nach einer amtlichen Gebührentabelle des Bundesstaats', 'Bei Beurkundung und Eintragung'],
              ['IPTU, die jährliche Grundsteuer', 'Je nach Immobilie und Stadt', 'Jedes Jahr'],
              ['Hausgeld', 'Je nach Gebäude', 'Jeden Monat'],
            ],
            nota:
              'Planen Sie etwa 4 % bis 5 % zusätzlich zum Kaufpreis ein. A3 nennt Ihnen den genauen Betrag für jede Immobilie vor dem Angebot. In Brasilien zahlt die Maklerprovision normalerweise der Verkäufer.',
          },
        ],
      },
      {
        titulo: 'Nach dem Kauf: Vermietung und Verkauf',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Vermietung:',
                texto: 'Sie können die Immobilie als Ferienwohnung oder dauerhaft vermieten. Für Personen ohne Wohnsitz in Brasilien beträgt die Einkommensteuer auf Mieteinnahmen 15 %, abgeführt von Ihrem Bevollmächtigten in Brasilien.',
              },
              {
                destaque: 'Verkauf:',
                texto:
                  'Der Gewinn aus dem Verkauf wird als Veräußerungsgewinn besteuert: 15 % auf Gewinne bis 5 Millionen Real, darüber höhere Sätze. Die Befreiungen für Einwohner Brasiliens gelten nicht für Personen mit Wohnsitz im Ausland.',
              },
              {
                destaque: 'Steuerreform:',
                texto:
                  'Brasilien hat neue Steuern auf Immobiliengeschäfte eingeführt. Eine Privatperson zahlt sie auf Mieten erst, wenn sie mehr als drei Immobilien vermietet und mehr als 240.000 Real Miete im Jahr einnimmt (inflationsangepasst), oder wenn die Mieteinnahmen in einem Jahr 288.000 Real übersteigen.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Finanzierung',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Ein Bankkredit setzt ein Konto bei einer brasilianischen Bank und ein nachweisbares Einkommen voraus. Für Personen ohne Wohnsitz in Brasilien ist das selten und langwierig. Üblich ist die Zahlung in einer Summe oder, bei Neubauten, in Raten direkt an den Bauträger während der Bauzeit.',
          },
        ],
      },
      {
        titulo: 'Kaufen, ohne nach Brasilien zu reisen',
        blocos: [
          { tipo: 'paragrafo', texto: 'Alles lässt sich aus der Ferne erledigen. Die Möglichkeiten:' },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Beurkundung per Videokonferenz:',
                texto: 'Brasilianische Notare beurkunden online über e-Notariado, mit einer kostenlosen digitalen Signatur, die das Notariat selbst ausstellt. Bei Immobilien ist der Notar der Stadt zuständig, in der die Immobilie liegt.',
              },
              {
                destaque: 'Vollmacht:',
                texto:
                  'Sie bestimmen eine Vertrauensperson in Brasilien, die für Sie unterschreibt. Die Vollmacht kann bei einem brasilianischen Konsulat oder einem Notar in Ihrem Land ausgestellt werden, mit Apostille und beglaubigter Übersetzung. Vermieten Sie die Immobilie, führt Ihr Bevollmächtigter auch die Steuer auf die Miete ab.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'In Brasilien leben durch eine Immobilieninvestition',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Brasilien erteilt Ausländern, die in städtische Immobilien investieren, eine Aufenthaltserlaubnis. Das Minimum liegt bei 1 Million Real oder bei 700.000 Real im Nordosten, wo Pernambuco liegt, und der Betrag kann auf mehrere Immobilien verteilt werden. Die erste Erlaubnis gilt 4 Jahre und kann unbefristet werden, wenn Sie die Investition behalten.',
          },
        ],
      },
      {
        titulo: 'Häufige Fragen',
        blocos: [
          {
            tipo: 'perguntas',
            itens: [
              { pergunta: 'Muss ich in Brasilien wohnen, um zu kaufen?', resposta: 'Nein. Auch ohne Wohnsitz in Brasilien kaufen Sie ganz normal mit einer CPF.' },
              { pergunta: 'Darf ich mehr als eine Immobilie kaufen?', resposta: 'Ja, für Immobilien in der Stadt gibt es keine Begrenzung.' },
              { pergunta: 'In welcher Währung zahle ich?', resposta: 'In brasilianischen Real. Der Umtausch erfolgt über eine zugelassene Bank oder Wechselstube.' },
              { pergunta: 'Wie lange dauert es?', resposta: 'Bei einer bezugsfertigen Immobilie mit vollständigen Unterlagen 30 bis 60 Tage vom Angebot bis zur Eintragung.' },
              { pergunta: 'Kann ich mit A3 in meiner Sprache sprechen?', resposta: 'Schreiben Sie uns in Ihrer Sprache über WhatsApp oder das Formular, und A3 antwortet Ihnen.' },
            ],
          },
        ],
      },
    ],
    aviso:
      'Dieser Ratgeber dient nur zur Information, beruht auf der brasilianischen Gesetzgebung vom November 2026 und ersetzt nicht die Beratung durch einen Anwalt oder Steuerberater für Ihren Fall.',
    chamada: {
      titulo: 'Bereit für den ersten Schritt?',
      texto: 'Sagen Sie uns, was Sie suchen. Ein Makler von A3 begleitet Sie bei jedem Schritt.',
      botao: 'Mit einem Makler sprechen',
    },
  },
  regiao: {
    tituloSeo: 'Leben und investieren in Recife und an der Küste von Pernambuco, Brasilien',
    descricaoSeo:
      'Sonne das ganze Jahr, warme Strände hinter Riffen und Direktflüge nach Europa. Wo die Immobilien von A3 liegen: Recife, Olinda, Paulista, Igarassu und Jaboatão.',
    sobretitulo: 'Die Region',
    titulo: 'Recife und die Küste von Pernambuco',
    intro:
      'Pernambuco hat das ganze Jahr Sonne, Strände mit warmem Wasser hinter schützenden Riffen und eine der lebendigsten Hauptstädte Brasiliens. Es liegt an dem Punkt des Kontinents, der Europa und Afrika am nächsten ist – das verkürzt die internationalen Flüge. A3 ist im Großraum Recife tätig, mit Schwerpunkt auf der Nordküste: Paulista, Olinda und Igarassu.',
    secoes: [
      {
        titulo: 'Wo die Immobilien liegen',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['Stadt', 'Entfernung zum Flughafen', 'Besonderheiten'],
            linhas: [
              [
                'Recife',
                '5 bis 20 km',
                'Die Hauptstadt des Bundesstaats. Der Strand Boa Viagem, die Altstadt Recife Antigo, Krankenhäuser, Universitäten und der Porto Digital, eines der größten Technologiezentren des Landes.',
              ],
              ['Olinda', 'Etwa 20 km', 'Eine Altstadt, die zum UNESCO-Welterbe gehört, und einer der berühmtesten Karnevale Brasiliens.'],
              [
                'Paulista',
                'Etwa 30 km',
                'Sitz von A3. Die ruhigen Strände Janga, Pau Amarelo (mit seiner Festung aus dem 18. Jahrhundert) und Maria Farinha mit Bootsausflügen. Niedrigere Preise als in der Hauptstadt.',
              ],
              ['Igarassu', 'Etwa 40 km', 'Eine der ältesten Städte Brasiliens, nahe der Insel Itamaracá.'],
              ['Jaboatão dos Guararapes', 'Etwa 10 km', 'Die Strände Piedade und Candeias, die Verlängerung der Uferpromenade von Boa Viagem.'],
            ],
            nota: 'Ungefähre Straßenentfernungen vom internationalen Flughafen Recife.',
          },
        ],
      },
      {
        titulo: 'Klima',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Das Klima ist tropisch, mit Temperaturen zwischen 24 °C und 31 °C das ganze Jahr über und einem Meer um die 27 °C. Zwischen April und Juli regnet es mehr. Von September bis März ist Hochsaison, mit trockenen, sonnigen Tagen.',
          },
        ],
      },
      {
        titulo: 'Anreise',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Der internationale Flughafen Recife ist der verkehrsreichste im Nordosten Brasiliens. Es gibt Direktflüge nach Lissabon, Porto, Madrid, Buenos Aires, Córdoba, Montevideo und Santiago de Chile. Aus Deutschland, Österreich und der Schweiz reisen Sie mit einem Umstieg in Lissabon oder Madrid an. 2026 stieg die Zahl der internationalen Passagiere um rund 40 %.',
          },
        ],
      },
      {
        titulo: 'Ausflüge in der Umgebung',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Porto de Galinhas',
                texto: '(etwa 60 km südlich von Recife): Naturpools zwischen den Riffen, mehrfach zum schönsten Strand Brasiliens gewählt.',
              },
              { destaque: 'Insel Itamaracá', texto: '(etwa 20 km von Paulista): ruhige Strände und das Fort Orange, von den Niederländern erbaut.' },
              { destaque: 'Fernando de Noronha:', texto: 'Brasiliens berühmtestes Archipel gehört ebenfalls zu Pernambuco, etwa eine Flugstunde von Recife entfernt.' },
            ],
          },
        ],
      },
      {
        titulo: 'Warum hier investieren',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Preis:',
                texto:
                  'Die bekanntesten Strandziele Brasiliens sind teuer. Der Quadratmeter kostet in Florianópolis über 13.000 Real und in Rio de Janeiro über 11.000 Real. An der Nordküste von Pernambuco gibt es Immobilien in Meeresnähe für deutlich weniger.',
              },
              { destaque: 'Ferienvermietung:', texto: 'Nachfrage das ganze Jahr, mit Spitzen im Sommer und während des Karnevals in Olinda und Recife.' },
              {
                destaque: 'Aufenthalt:',
                texto: 'Im Nordosten liegt die Mindestinvestition in Immobilien für eine brasilianische Aufenthaltserlaubnis bei 700.000 Real, im übrigen Land bei 1 Million Real (siehe Kaufratgeber).',
              },
              {
                destaque: 'Lebenshaltungskosten:',
                texto: 'Dienstleistungen, Lebensmittel und Wohnen kosten weniger als in den Großstädten im Südosten, mit vollständiger Versorgung durch Krankenhäuser, Schulen und Geschäfte in Recife.',
              },
            ],
          },
        ],
      },
    ],
    chamada: {
      titulo: 'Finden Sie Ihren Platz in Pernambuco',
      texto: 'Sehen Sie sich die für internationale Käufer ausgewählten Immobilien an oder sagen Sie uns, was Sie suchen.',
      botao: 'Mit einem Makler sprechen',
    },
  },
  privacidade: privacidade.de,
}

export default de
