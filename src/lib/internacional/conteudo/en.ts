import { privacidade } from './privacidade'
import type { ConteudoIdioma } from './tipos'

const en: ConteudoIdioma = {
  guia: {
    tituloSeo: 'Buying property in Brazil as a foreigner: a complete guide',
    descricaoSeo:
      'Can foreigners buy property in Brazil? Yes. How to get a CPF, the buying process step by step, sending money, taxes and costs, buying remotely and residence through real estate investment.',
    sobretitulo: 'Buying guide',
    titulo: 'How to buy property in Brazil as a foreigner',
    intro:
      'Yes, foreigners can buy property in Brazil, even without living here. For apartments and houses in town, the rules are the same as for Brazilians: there is no limit on value or number of properties. All you need is a CPF, the Brazilian taxpayer number. This guide walks you through the whole process, from the first contact to the keys.',
    secoes: [
      {
        titulo: 'Who can buy',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Urban property',
                texto: '(apartments, houses, plots in town): any foreigner, resident or not, on the same terms as a Brazilian.',
              },
              {
                destaque: 'Rural property and border areas:',
                texto: 'have their own rules and authorizations. This does not apply to the properties A3 offers, which are all urban and on the coast of Pernambuco.',
              },
              {
                destaque: 'Beachfront property:',
                texto:
                  'part of the coastline is “terreno de marinha”, land that belongs to the Federal Government. An apartment in a condominium in town needs no authorization, as long as the units owned by foreigners do not exceed one third of the building’s land. Houses and plots in that strip may require federal authorization. A3 checks the status of each property at the registry office before you make an offer.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'The CPF',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'The CPF is the first step and it is free. Foreigners living abroad apply in person at a Brazilian consulate or embassy, booking an appointment on the e-Consular website. Bring the Federal Revenue form filled in and signed, an identity document and your birth or marriage certificate. After that, the registration must be confirmed once a year in the Federal Revenue app.',
          },
        ],
      },
      {
        titulo: 'The buying process, step by step',
        blocos: [
          {
            tipo: 'passos',
            itens: [
              {
                destaque: 'Choosing the property.',
                texto: 'Tell A3 what you are looking for: a home, holidays or rental income. We send you options, photos and videos and, if you wish, show you the property on a video call.',
              },
              {
                destaque: 'Checking the documents.',
                texto: 'Before the offer, we check the property’s record at the land registry, the seller’s certificates and any outstanding condominium fees or IPTU, the annual property tax.',
              },
              {
                destaque: 'Offer and contract.',
                texto: 'Once the price is agreed, both parties sign a purchase commitment agreement, usually with a deposit.',
              },
              { destaque: 'Payment.', texto: 'The money enters Brazil through an authorized bank or foreign exchange broker (see below).' },
              {
                destaque: 'Deed and registration.',
                texto: 'The deed is signed at a notary’s office and then registered at the land registry. The property is only yours once it is registered.',
              },
              {
                destaque: 'Keys.',
                texto:
                  'Ready property: you receive the keys and the water, electricity and condominium accounts are transferred to your name. New development: you pay according to the developer’s schedule and receive the property when construction is completed.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'With the documents in order, a ready property usually takes 30 to 60 days from the offer to the registration.',
          },
        ],
      },
      {
        titulo: 'Sending the money',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Payment comes from abroad through a foreign exchange contract with a bank or broker authorized by the Central Bank of Brazil. Keep the contract and the receipts: they prove where the money came from and make it easier to send it back if you sell in the future. A purchase by an individual for their own use generally does not need to be declared in the Central Bank’s foreign investment system. Your bank or exchange broker will advise on your case.',
          },
        ],
      },
      {
        titulo: 'Taxes and buying costs',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['Item', 'How much', 'When'],
            linhas: [
              ['ITBI, the municipal property transfer tax', 'Usually 3% of the property value; Recife has offered temporary reductions', 'Before the deed'],
              ['Deed and registration fees', 'Usually 1% to 2% of the value, set by an official state table', 'At the deed and at the registration'],
              ['IPTU, the annual property tax', 'Depends on the property and the city', 'Every year'],
              ['Condominium fee', 'Depends on the building', 'Every month'],
            ],
            nota:
              'Budget around 4% to 5% on top of the property price. A3 gives you the exact amount for each property before the offer. In Brazil, the agency’s commission is normally paid by the seller.',
          },
        ],
      },
      {
        titulo: 'After the purchase: renting and selling',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Renting:',
                texto: 'you can rent the property out for holidays or for the year. For non-residents, the income tax on rent is 15%, paid by your legal representative in Brazil.',
              },
              {
                destaque: 'Selling:',
                texto:
                  'the profit pays capital gains tax: 15% on gains of up to R$ 5 million, with higher rates above that. The exemptions available to Brazilian residents do not apply to non-residents.',
              },
              {
                destaque: 'Tax reform:',
                texto:
                  'Brazil has created new taxes on real estate transactions. An individual only starts paying them on rent with more than three properties rented out and more than R$ 240,000 a year in rent (adjusted for inflation), or with more than R$ 288,000 in rent in a year.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Financing',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'A bank mortgage requires an account with a Brazilian bank and proof of income. For non-residents it is rare and slow. The usual options are paying in full or, for new developments, paying in instalments directly to the developer during construction.',
          },
        ],
      },
      {
        titulo: 'Buying without coming to Brazil',
        blocos: [
          { tipo: 'paragrafo', texto: 'You can do everything remotely. The options are:' },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Deed by video conference:',
                texto: 'Brazilian notaries sign deeds online through e-Notariado, with a free digital signature issued by the notary’s office itself. For property, the notary is the one in the city where the property is.',
              },
              {
                destaque: 'Power of attorney:',
                texto:
                  'you appoint someone you trust in Brazil to sign on your behalf. It can be made at a Brazilian consulate or at a notary in your country, with an apostille and a sworn translation. If you rent the property out, your representative also pays the tax on the rent.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Living in Brazil by investing in property',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Brazil grants residence permits to foreigners who invest in urban property. The minimum is R$ 1 million, or R$ 700,000 in the Northeast, where Pernambuco is, and the amount can be split across more than one property. The first permit is valid for 4 years and can become permanent if you keep the investment.',
          },
        ],
      },
      {
        titulo: 'Frequently asked questions',
        blocos: [
          {
            tipo: 'perguntas',
            itens: [
              { pergunta: 'Do I need to live in Brazil to buy?', resposta: 'No. Non-residents buy normally with a CPF.' },
              { pergunta: 'Can I buy more than one property?', resposta: 'Yes, there is no limit for urban property.' },
              { pergunta: 'In which currency do I pay?', resposta: 'In Brazilian reais. The exchange is done through an authorized bank or broker.' },
              { pergunta: 'How long does it take?', resposta: 'For a ready property with documents in order, 30 to 60 days between the offer and the registration.' },
              { pergunta: 'Can I talk to A3 in my language?', resposta: 'Write to us in your language on WhatsApp or through the form, and A3 will reply.' },
            ],
          },
        ],
      },
    ],
    aviso:
      'This guide is for information only, based on Brazilian legislation as of November 2026, and does not replace advice from a lawyer or accountant for your specific case.',
    chamada: {
      titulo: 'Ready to start?',
      texto: 'Tell us what you are looking for. An A3 agent will guide you through every step.',
      botao: 'Talk to an agent',
    },
  },
  regiao: {
    tituloSeo: 'Living and investing in Recife and on the coast of Pernambuco, Brazil',
    descricaoSeo:
      'Sun all year round, warm beaches protected by reefs and direct flights to Europe and South America. Where A3’s properties are: Recife, Olinda, Paulista, Igarassu and Jaboatão.',
    sobretitulo: 'The region',
    titulo: 'Recife and the coast of Pernambuco',
    intro:
      'Pernambuco has sunshine all year round, warm-water beaches protected by reefs and one of the liveliest state capitals in Brazil. It lies at the point of the continent closest to Europe and Africa, which makes international flights shorter. A3 works in the Recife metropolitan area, with a focus on the northern coast: Paulista, Olinda and Igarassu.',
    secoes: [
      {
        titulo: 'Where the properties are',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['City', 'Distance from the airport', 'Highlights'],
            linhas: [
              [
                'Recife',
                '5 to 20 km',
                'The state capital. Boa Viagem beach, the historic centre of Recife Antigo, hospitals, universities and Porto Digital, one of the largest technology hubs in the country.',
              ],
              ['Olinda', 'About 20 km', 'A historic centre listed as a UNESCO World Heritage Site and one of the most famous carnivals in Brazil.'],
              [
                'Paulista',
                'About 30 km',
                'Home of A3. The quiet beaches of Janga, Pau Amarelo (with its 18th-century fort) and Maria Farinha, with boat trips. Lower prices than in the capital.',
              ],
              ['Igarassu', 'About 40 km', 'One of the oldest towns in Brazil, close to Itamaracá Island.'],
              ['Jaboatão dos Guararapes', 'About 10 km', 'The beaches of Piedade and Candeias, continuing the Boa Viagem seafront.'],
            ],
            nota: 'Approximate road distances from Recife International Airport.',
          },
        ],
      },
      {
        titulo: 'Climate',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'The climate is tropical, with temperatures between 24 °C and 31 °C all year and the sea at around 27 °C. It rains more between April and July. September to March is the high season, with dry, sunny days.',
          },
        ],
      },
      {
        titulo: 'Getting here',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Recife International Airport is the busiest in the Northeast of Brazil. It has direct flights to Lisbon, Porto, Madrid, Buenos Aires, Córdoba, Montevideo and Santiago de Chile. From Italy, France and Germany, you arrive with one connection in Lisbon or Madrid. The number of international passengers grew by about 40% in 2026.',
          },
        ],
      },
      {
        titulo: 'Day trips',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Porto de Galinhas',
                texto: '(about 60 km south of Recife): natural pools between the reefs, voted Brazil’s best beach several times.',
              },
              { destaque: 'Itamaracá Island', texto: '(about 20 km from Paulista): calm beaches and Fort Orange, built by the Dutch.' },
              { destaque: 'Fernando de Noronha:', texto: 'Brazil’s most famous archipelago also belongs to Pernambuco, about an hour’s flight from Recife.' },
            ],
          },
        ],
      },
      {
        titulo: 'Why invest here',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Price:',
                texto:
                  'Brazil’s best-known beach destinations are expensive. A square metre costs more than R$ 13,000 in Florianópolis and more than R$ 11,000 in Rio de Janeiro. On the northern coast of Pernambuco, there are homes near the sea for much less.',
              },
              { destaque: 'Holiday rentals:', texto: 'demand all year round, peaking in summer and during the Olinda and Recife carnival.' },
              {
                destaque: 'Residence:',
                texto: 'in the Northeast, the minimum property investment to apply for a Brazilian residence permit is R$ 700,000, compared with R$ 1 million in the rest of the country (see the buying guide).',
              },
              {
                destaque: 'Cost of living:',
                texto: 'services, food and housing cost less than in the large cities of the Southeast, with complete hospitals, schools and shops in Recife.',
              },
            ],
          },
        ],
      },
    ],
    chamada: {
      titulo: 'Find your place in Pernambuco',
      texto: 'See the properties selected for international buyers, or tell us what you are looking for.',
      botao: 'Talk to an agent',
    },
  },
  privacidade: privacidade.en,
}

export default en
