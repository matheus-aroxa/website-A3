import { privacidade } from './privacidade'
import type { ConteudoIdioma } from './tipos'

const fr: ConteudoIdioma = {
  guia: {
    tituloSeo: 'Acheter un bien immobilier au Brésil en tant qu’étranger : le guide complet',
    descricaoSeo:
      'Un étranger peut-il acheter un bien au Brésil ? Oui. Comment obtenir le CPF, l’achat étape par étape, le transfert d’argent, impôts et frais, l’achat à distance et la résidence par investissement immobilier.',
    sobretitulo: 'Guide d’achat',
    titulo: 'Acheter un bien immobilier au Brésil en tant qu’étranger',
    intro:
      'Oui, les étrangers peuvent acheter un bien immobilier au Brésil, même sans y habiter. Pour les appartements et les maisons en ville, les règles sont les mêmes que pour les Brésiliens : aucune limite de valeur ni de nombre. Il vous faut seulement un CPF, le numéro fiscal brésilien. Ce guide vous accompagne tout au long du parcours, du premier contact à la remise des clés.',
    secoes: [
      {
        titulo: 'Qui peut acheter',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Biens urbains',
                texto: '(appartements, maisons, terrains en ville) : tout étranger, résident ou non, aux mêmes conditions qu’un Brésilien.',
              },
              {
                destaque: 'Biens ruraux et zones frontalières :',
                texto: 'ils obéissent à des règles et à des autorisations spécifiques. Ce n’est pas le cas des biens proposés par A3, tous urbains et situés sur la côte du Pernambouc.',
              },
              {
                destaque: 'Biens en bord de mer :',
                texto:
                  'une partie du littoral est un « terreno de marinha », un terrain qui appartient à l’État fédéral. Un appartement en copropriété en ville ne demande aucune autorisation, à condition que les lots détenus par des étrangers ne dépassent pas un tiers du terrain de l’immeuble. Les maisons et terrains situés dans cette bande peuvent nécessiter une autorisation fédérale. A3 vérifie la situation de chaque bien auprès du registre avant votre offre.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Le CPF',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Le CPF est la première étape, et il est gratuit. Les étrangers qui vivent hors du Brésil le demandent en personne dans un consulat ou une ambassade du Brésil, sur rendez-vous pris sur le site e-Consular. Apportez le formulaire de la Receita Federal rempli et signé, une pièce d’identité et votre acte de naissance ou de mariage. Ensuite, l’inscription doit être confirmée une fois par an dans l’application de la Receita Federal.',
          },
        ],
      },
      {
        titulo: 'L’achat, étape par étape',
        blocos: [
          {
            tipo: 'passos',
            itens: [
              {
                destaque: 'Choix du bien.',
                texto: 'Dites à A3 ce que vous cherchez : y vivre, y passer vos vacances ou le louer. Nous vous envoyons des propositions, des photos et des vidéos et, si vous le souhaitez, nous organisons une visite en visioconférence.',
              },
              {
                destaque: 'Vérification des documents.',
                texto: 'Avant l’offre, nous vérifions le titre de propriété au registre foncier, les certificats du vendeur et l’absence de dettes de charges ou d’IPTU, la taxe foncière annuelle.',
              },
              {
                destaque: 'Offre et compromis.',
                texto: 'Une fois le prix convenu, on signe une promesse de vente, généralement avec un acompte.',
              },
              { destaque: 'Paiement.', texto: 'L’argent entre au Brésil par une banque ou un bureau de change agréés (voir ci-dessous).' },
              {
                destaque: 'Acte de vente et enregistrement.',
                texto: 'L’acte est signé chez un notaire puis enregistré au registre foncier. Le bien n’est à vous qu’après l’enregistrement.',
              },
              {
                destaque: 'Clés.',
                texto:
                  'Bien prêt : vous recevez les clés et l’eau, l’électricité et les charges passent à votre nom. Programme neuf : vous payez selon l’échéancier du promoteur et recevez le bien à la fin des travaux.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'Avec des documents en règle, il faut en général de 30 à 60 jours entre l’offre et l’enregistrement pour un bien prêt à habiter.',
          },
        ],
      },
      {
        titulo: 'Le transfert d’argent',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Le paiement arrive de l’étranger par un contrat de change conclu avec une banque ou un bureau de change agréés par la Banque centrale du Brésil. Conservez le contrat et les justificatifs : ils prouvent l’origine des fonds et facilitent leur rapatriement en cas de revente. L’achat d’un bien par un particulier pour son propre usage n’a généralement pas à être déclaré dans le système d’investissement étranger de la Banque centrale. Votre banque ou votre bureau de change vous conseillera selon votre situation.',
          },
        ],
      },
      {
        titulo: 'Impôts et frais d’achat',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['Poste', 'Combien', 'Quand'],
            linhas: [
              ['ITBI, la taxe municipale de mutation', 'En général 3 % de la valeur ; Recife a proposé des réductions temporaires', 'Avant l’acte'],
              ['Acte et enregistrement', 'En général de 1 % à 2 % de la valeur, selon un barème officiel de l’État', 'À l’acte et à l’enregistrement'],
              ['IPTU, la taxe foncière annuelle', 'Selon le bien et la ville', 'Chaque année'],
              ['Charges de copropriété', 'Selon l’immeuble', 'Chaque mois'],
            ],
            nota:
              'Prévoyez environ 4 % à 5 % en plus du prix du bien. A3 vous indique le montant exact pour chaque bien avant l’offre. Au Brésil, la commission de l’agence est normalement à la charge du vendeur.',
          },
        ],
      },
      {
        titulo: 'Après l’achat : location et revente',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Location :',
                texto: 'vous pouvez louer le bien en saisonnier ou à l’année. Pour les non-résidents, l’impôt sur les loyers est de 15 %, payé par votre mandataire au Brésil.',
              },
              {
                destaque: 'Revente :',
                texto:
                  'la plus-value est imposée : 15 % sur les plus-values jusqu’à 5 millions de réais, avec des taux plus élevés au-delà. Les exonérations prévues pour les résidents au Brésil ne s’appliquent pas aux non-résidents.',
              },
              {
                destaque: 'Réforme fiscale :',
                texto:
                  'le Brésil a créé de nouveaux impôts sur les opérations immobilières. Un particulier ne commence à les payer sur ses loyers qu’avec plus de trois biens loués et plus de 240 000 réais de loyers par an (montant indexé sur l’inflation), ou avec plus de 288 000 réais de loyers sur une année.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Financement',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Un prêt immobilier exige un compte dans une banque brésilienne et des revenus justifiés. Pour les non-résidents, c’est rare et long. Le plus courant est de payer comptant ou, pour les programmes neufs, en plusieurs fois directement auprès du promoteur pendant les travaux.',
          },
        ],
      },
      {
        titulo: 'Acheter sans venir au Brésil',
        blocos: [
          { tipo: 'paragrafo', texto: 'Tout peut se faire à distance. Les options sont :' },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Acte en visioconférence :',
                texto: 'les notaires brésiliens signent des actes en ligne via e-Notariado, avec une signature électronique gratuite délivrée par l’office notarial lui-même. Pour un bien immobilier, c’est le notaire de la ville du bien.',
              },
              {
                destaque: 'Procuration :',
                texto:
                  'vous désignez une personne de confiance au Brésil pour signer à votre place. Elle peut être établie dans un consulat brésilien ou chez un notaire de votre pays, avec apostille et traduction assermentée. Si vous louez le bien, votre mandataire paie aussi l’impôt sur les loyers.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Vivre au Brésil en investissant dans l’immobilier',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Le Brésil accorde un titre de séjour aux étrangers qui investissent dans l’immobilier urbain. Le minimum est de 1 million de réais, ou de 700 000 réais dans le Nordeste, où se trouve le Pernambouc, et le montant peut être réparti sur plusieurs biens. Le premier titre est valable 4 ans et peut devenir permanent si vous conservez l’investissement.',
          },
        ],
      },
      {
        titulo: 'Questions fréquentes',
        blocos: [
          {
            tipo: 'perguntas',
            itens: [
              { pergunta: 'Dois-je habiter au Brésil pour acheter ?', resposta: 'Non. Les non-résidents achètent normalement avec un CPF.' },
              { pergunta: 'Puis-je acheter plusieurs biens ?', resposta: 'Oui, il n’y a pas de limite pour les biens urbains.' },
              { pergunta: 'Dans quelle devise je paie ?', resposta: 'En réais brésiliens. Le change se fait par une banque ou un bureau de change agréés.' },
              { pergunta: 'Combien de temps cela prend-il ?', resposta: 'Pour un bien prêt à habiter, avec des documents en règle, de 30 à 60 jours entre l’offre et l’enregistrement.' },
              { pergunta: 'Puis-je parler à A3 dans ma langue ?', resposta: 'Écrivez-nous dans votre langue sur WhatsApp ou via le formulaire, et A3 vous répondra.' },
            ],
          },
        ],
      },
    ],
    aviso:
      'Ce guide est fourni à titre informatif, sur la base de la législation brésilienne de novembre 2026, et ne remplace pas le conseil d’un avocat ou d’un expert-comptable pour votre situation.',
    chamada: {
      titulo: 'Prêt à vous lancer ?',
      texto: 'Dites-nous ce que vous cherchez. Un agent d’A3 vous accompagnera à chaque étape.',
      botao: 'Parler à un agent',
    },
  },
  regiao: {
    tituloSeo: 'Vivre et investir à Recife et sur la côte du Pernambouc, Brésil',
    descricaoSeo:
      'Du soleil toute l’année, des plages chaudes protégées par les récifs et des vols directs vers l’Europe. Où se trouvent les biens d’A3 : Recife, Olinda, Paulista, Igarassu et Jaboatão.',
    sobretitulo: 'La région',
    titulo: 'Recife et la côte du Pernambouc',
    intro:
      'Le Pernambouc profite du soleil toute l’année, de plages à l’eau chaude protégées par les récifs et d’une des capitales les plus vivantes du Brésil. Il se trouve à la pointe du continent la plus proche de l’Europe et de l’Afrique, ce qui raccourcit les vols internationaux. A3 travaille dans l’agglomération de Recife, en particulier sur la côte nord : Paulista, Olinda et Igarassu.',
    secoes: [
      {
        titulo: 'Où se trouvent les biens',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['Ville', 'Distance de l’aéroport', 'Points forts'],
            linhas: [
              [
                'Recife',
                'De 5 à 20 km',
                'La capitale de l’État. La plage de Boa Viagem, le centre historique de Recife Antigo, des hôpitaux, des universités et le Porto Digital, l’un des plus grands pôles technologiques du pays.',
              ],
              ['Olinda', 'Environ 20 km', 'Un centre historique classé au patrimoine mondial de l’UNESCO et l’un des carnavals les plus célèbres du Brésil.'],
              [
                'Paulista',
                'Environ 30 km',
                'Siège d’A3. Les plages tranquilles de Janga, Pau Amarelo (avec son fort du XVIIIe siècle) et Maria Farinha, avec des sorties en bateau. Des prix plus bas que dans la capitale.',
              ],
              ['Igarassu', 'Environ 40 km', 'L’une des plus anciennes villes du Brésil, près de l’île d’Itamaracá.'],
              ['Jaboatão dos Guararapes', 'Environ 10 km', 'Les plages de Piedade et Candeias, dans le prolongement du front de mer de Boa Viagem.'],
            ],
            nota: 'Distances approximatives par la route depuis l’aéroport international de Recife.',
          },
        ],
      },
      {
        titulo: 'Climat',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Le climat est tropical, avec des températures entre 24 °C et 31 °C toute l’année et une mer autour de 27 °C. Il pleut davantage d’avril à juillet. De septembre à mars, c’est la haute saison, avec des journées sèches et ensoleillées.',
          },
        ],
      },
      {
        titulo: 'Comment venir',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'L’aéroport international de Recife est le plus fréquenté du Nordeste brésilien. Il propose des vols directs vers Lisbonne, Porto, Madrid, Buenos Aires, Córdoba, Montevideo et Santiago du Chili. Depuis la France, on arrive avec une seule escale à Lisbonne ou à Madrid. En 2026, le nombre de passagers internationaux a augmenté d’environ 40 %.',
          },
        ],
      },
      {
        titulo: 'Excursions à proximité',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Porto de Galinhas',
                texto: '(à environ 60 km au sud de Recife) : des piscines naturelles entre les récifs, élue plusieurs fois plus belle plage du Brésil.',
              },
              { destaque: 'Île d’Itamaracá', texto: '(à environ 20 km de Paulista) : des plages calmes et le fort Orange, construit par les Hollandais.' },
              { destaque: 'Fernando de Noronha :', texto: 'l’archipel le plus célèbre du Brésil appartient lui aussi au Pernambouc, à environ une heure de vol de Recife.' },
            ],
          },
        ],
      },
      {
        titulo: 'Pourquoi investir ici',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Prix :',
                texto:
                  'les destinations balnéaires les plus connues du Brésil sont chères. Le mètre carré dépasse 13 000 réais à Florianópolis et 11 000 réais à Rio de Janeiro. Sur la côte nord du Pernambouc, on trouve des logements près de la mer pour bien moins.',
              },
              { destaque: 'Location saisonnière :', texto: 'une demande toute l’année, avec des pics en été et pendant le carnaval d’Olinda et de Recife.' },
              {
                destaque: 'Résidence :',
                texto: 'dans le Nordeste, l’investissement immobilier minimum pour demander un titre de séjour au Brésil est de 700 000 réais, contre 1 million dans le reste du pays (voir le guide d’achat).',
              },
              {
                destaque: 'Coût de la vie :',
                texto: 'services, alimentation et logement coûtent moins cher que dans les grandes villes du Sudeste, avec des hôpitaux, des écoles et des commerces complets à Recife.',
              },
            ],
          },
        ],
      },
    ],
    chamada: {
      titulo: 'Trouvez votre place au Pernambouc',
      texto: 'Découvrez les biens sélectionnés pour les acheteurs internationaux, ou dites-nous ce que vous cherchez.',
      botao: 'Parler à un agent',
    },
  },
  privacidade: privacidade.fr,
}

export default fr
