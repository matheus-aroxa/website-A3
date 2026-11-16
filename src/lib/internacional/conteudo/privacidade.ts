// Tradução da política de privacidade (app/(site)/politica-de-privacidade/page.tsx) para os idiomas da área
// internacional. O texto em português é o oficial: cada tradução avisa isso no começo. Mudou a política em português?
// Atualize as traduções aqui.
import { site } from '@/lib/site'
import type { IdiomaRevisado } from '../idiomas'
import type { Artigo } from './tipos'

const empresa = `${site.nome} (${site.creci})`
const endereco = site.endereco.exibicao
const contato = `${site.email} · WhatsApp ${site.telefone}`

export const privacidade: Record<IdiomaRevisado, Artigo> = {
  en: {
    tituloSeo: 'Privacy policy',
    descricaoSeo: `How ${site.nome} handles the data you provide in the website forms and on WhatsApp, under Brazil’s data protection law (LGPD).`,
    sobretitulo: 'Privacy',
    titulo: 'Privacy policy',
    intro: `This policy explains how ${empresa} handles personal data on the website, in accordance with Brazil’s General Data Protection Law (LGPD, Law No. 13,709/2018). Last updated: October 2026. This is a translation: in case of any difference, the Portuguese version prevails.`,
    secoes: [
      {
        titulo: 'What data we collect',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              { texto: 'The name, country, WhatsApp number and email you type in the contact, visit scheduling and agent forms;' },
              { texto: 'The message, preferred days and times and the property of interest, when you fill them in;' },
              { texto: 'Technical browsing data (such as IP address and browser type), recorded by the hosting providers to keep the website working and secure;' },
              { texto: 'Anonymous website usage data, described in “Website usage measurement” below.' },
            ],
          },
        ],
      },
      {
        titulo: 'How the forms work',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'The website does not store what you type in the forms in a database. When you submit, we put together a message with that data and open A3’s WhatsApp for you to send it. The contact only reaches us when you send the message on WhatsApp, and the conversation is then also subject to WhatsApp’s (Meta) terms and privacy policy.',
          },
        ],
      },
      {
        titulo: 'What we use it for',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'We use the data only to reply to your contact, schedule visits, send information about properties you are interested in and comply with legal obligations. The legal basis is your consent, given by ticking the authorization box in the form, and the performance of pre-contractual steps that you request.',
          },
        ],
      },
      {
        titulo: 'Website usage measurement',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'To learn which properties people are interested in, what they search for and whether the website is fast, the website itself measures usage anonymously. We do not use Google Analytics or any other third-party tool for this.',
          },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'What we measure:',
                texto:
                  'pages viewed and for how long, how far the page was scrolled, clicks on WhatsApp, phone, email, photos, map and share button, the filters and terms used in the search, form submissions (only the form name, the property and which fields had errors, never what was typed), the device type, browser and operating system, the language and the website the person came from.',
              },
              {
                destaque: 'Approximate location:',
                texto: 'city and state, estimated by the hosting provider from the IP address. The IP address itself is not stored.',
              },
              {
                destaque: 'Without identifying you:',
                texto:
                  'we do not use cookies or store anything on your device for this measurement. To count different visitors, we generate a code from the IP address and the browser mixed with a secret value that changes every day and is deleted after two days. This is why the code cannot be recreated, does not identify the person and does not link a visit on one day to another.',
              },
              {
                destaque: 'For how long:',
                texto: 'detailed records are deleted after 90 days. Only daily totals remain, such as “how many visits property X had”, which identify no one.',
              },
              {
                destaque: 'How not to be counted:',
                texto: 'if your browser sends the “Do Not Track” (DNT) or “Global Privacy Control” signal, measurement is turned off for you. A3’s own team is also excluded from the statistics.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'The legal basis is A3’s legitimate interest in improving the website and its service (LGPD, art. 7, IX), with data that does not identify people.',
          },
        ],
      },
      {
        titulo: 'Cookies',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'The website does not use advertising or visitor-tracking cookies. Only the administrative area, restricted to A3’s team, uses cookies: a session cookie to keep the login, and a marker that keeps the team’s own visits out of the statistics.',
          },
        ],
      },
      {
        titulo: 'Who we share it with',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'We do not sell personal data. Information from the conversation may be shared with partner developers or property owners only when necessary for the negotiation you requested. The website is hosted by cloud infrastructure providers, which process only technical browsing data.',
          },
        ],
      },
      {
        titulo: 'Your rights',
        blocos: [
          {
            tipo: 'paragrafo',
            texto: `At any time you can ask for confirmation that we process your data, access, correction, portability, anonymization or deletion, information about who we share it with and the withdrawal of your consent, by email or WhatsApp: ${contato}.`,
          },
        ],
      },
      {
        titulo: 'How long we keep it',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Conversations remain on A3’s WhatsApp while the service is ongoing or for the period required by law. After that, they are deleted or anonymized. You can ask for deletion earlier through the channels above. Website usage data follows the periods in “Website usage measurement”.',
          },
        ],
      },
      {
        titulo: 'Who the controller is',
        blocos: [{ tipo: 'paragrafo', texto: `The data controller is ${empresa}, ${endereco}, Brazil.` }],
      },
    ],
    aviso: `${site.nome} · ${endereco} · ${site.creci}`,
  },
  it: {
    tituloSeo: 'Informativa sulla privacy',
    descricaoSeo: `Come ${site.nome} tratta i dati inseriti nei moduli del sito e su WhatsApp, secondo la legge brasiliana sulla protezione dei dati (LGPD).`,
    sobretitulo: 'Privacy',
    titulo: 'Informativa sulla privacy',
    intro: `Questa informativa spiega come ${empresa} tratta i dati personali sul sito, in conformità con la Legge generale brasiliana sulla protezione dei dati (LGPD, Legge n. 13.709/2018). Ultimo aggiornamento: ottobre 2026. Questa è una traduzione: in caso di differenze, prevale la versione in portoghese.`,
    secoes: [
      {
        titulo: 'Quali dati raccogliamo',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              { texto: 'Il nome, il Paese, il numero WhatsApp e l’e-mail che inserisci nei moduli di contatto, di prenotazione delle visite e di contatto con l’agente;' },
              { texto: 'Il messaggio, i giorni e gli orari preferiti e l’immobile di interesse, quando li compili;' },
              { texto: 'Dati tecnici di navigazione (come indirizzo IP e tipo di browser), registrati dai fornitori di hosting per mantenere il sito funzionante e sicuro;' },
              { texto: 'Dati anonimi sull’uso del sito, descritti più avanti in “Misurazione dell’uso del sito”.' },
            ],
          },
        ],
      },
      {
        titulo: 'Come funzionano i moduli',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Il sito non salva in un database ciò che scrivi nei moduli. All’invio, componiamo un messaggio con questi dati e apriamo il WhatsApp di A3 perché tu lo invii. Il contatto ci arriva solo quando invii il messaggio su WhatsApp, e la conversazione è soggetta anche ai termini e all’informativa sulla privacy di WhatsApp (Meta).',
          },
        ],
      },
      {
        titulo: 'Per cosa li usiamo',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Usiamo i dati solo per rispondere al tuo contatto, fissare visite, inviarti informazioni sugli immobili di tuo interesse e adempiere agli obblighi di legge. La base giuridica è il tuo consenso, dato spuntando l’autorizzazione nel modulo, e l’esecuzione di misure precontrattuali da te richieste.',
          },
        ],
      },
      {
        titulo: 'Misurazione dell’uso del sito',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Per sapere quali immobili interessano, cosa cercano le persone e se il sito è veloce, il sito stesso misura l’uso in forma anonima. Non usiamo Google Analytics né altri strumenti di terzi a questo scopo.',
          },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Cosa misuriamo:',
                texto:
                  'le pagine viste e per quanto tempo, fin dove è stata scorsa la pagina, i clic su WhatsApp, telefono, e-mail, foto, mappa e pulsante di condivisione, i filtri e i termini usati nella ricerca, l’invio dei moduli (solo il nome del modulo, l’immobile e quali campi hanno dato errore, mai ciò che è stato scritto), il tipo di dispositivo, il browser e il sistema operativo, la lingua e il sito di provenienza.',
              },
              {
                destaque: 'Posizione approssimativa:',
                texto: 'città e stato, stimati dal fornitore di hosting a partire dall’indirizzo IP. L’indirizzo IP non viene salvato.',
              },
              {
                destaque: 'Senza identificarti:',
                texto:
                  'per questa misurazione non usiamo cookie né salviamo nulla sul tuo dispositivo. Per contare i visitatori diversi, generiamo un codice dall’indirizzo IP e dal browser combinati con un valore segreto che cambia ogni giorno e viene cancellato dopo due giorni. Per questo il codice non può essere ricostruito, non identifica la persona e non collega una visita di un giorno a quella di un altro.',
              },
              {
                destaque: 'Per quanto tempo:',
                texto: 'i dati dettagliati vengono cancellati dopo 90 giorni. Restano solo i totali giornalieri, come “quante visite ha avuto l’immobile X”, che non identificano nessuno.',
              },
              {
                destaque: 'Come non essere conteggiato:',
                texto: 'se il tuo browser invia il segnale “Do Not Track” (DNT) o “Global Privacy Control”, la misurazione viene disattivata per te. Anche il team di A3 è escluso dalle statistiche.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'La base giuridica è il legittimo interesse di A3 a migliorare il sito e il servizio (LGPD, art. 7, IX), con dati che non identificano le persone.',
          },
        ],
      },
      {
        titulo: 'Cookie',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Il sito non usa cookie pubblicitari né di tracciamento dei visitatori. Solo l’area amministrativa, riservata al team di A3, usa cookie: uno di sessione, per mantenere l’accesso, e un indicatore che esclude dalle statistiche le visite del team stesso.',
          },
        ],
      },
      {
        titulo: 'Con chi li condividiamo',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Non vendiamo dati personali. Le informazioni della conversazione possono essere condivise con costruttori partner o proprietari solo quando necessario per la trattativa che hai richiesto. Il sito è ospitato da fornitori di infrastruttura cloud, che trattano solo i dati tecnici di navigazione.',
          },
        ],
      },
      {
        titulo: 'I tuoi diritti',
        blocos: [
          {
            tipo: 'paragrafo',
            texto: `In qualsiasi momento puoi chiedere la conferma del trattamento dei tuoi dati, l’accesso, la rettifica, la portabilità, l’anonimizzazione o la cancellazione, informazioni su con chi li condividiamo e la revoca del consenso, via e-mail o WhatsApp: ${contato}.`,
          },
        ],
      },
      {
        titulo: 'Per quanto tempo li conserviamo',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Le conversazioni restano nel WhatsApp di A3 finché la trattativa è in corso o per il periodo richiesto dalla legge. Dopo vengono cancellate o anonimizzate. Puoi chiederne la cancellazione prima attraverso i canali indicati sopra. I dati sull’uso del sito seguono i tempi della sezione “Misurazione dell’uso del sito”.',
          },
        ],
      },
      {
        titulo: 'Chi è il titolare del trattamento',
        blocos: [{ tipo: 'paragrafo', texto: `Il titolare del trattamento è ${empresa}, ${endereco}, Brasile.` }],
      },
    ],
    aviso: `${site.nome} · ${endereco} · ${site.creci}`,
  },
  es: {
    tituloSeo: 'Política de privacidad',
    descricaoSeo: `Cómo ${site.nome} trata los datos que ingresas en los formularios del sitio y por WhatsApp, según la ley brasileña de protección de datos (LGPD).`,
    sobretitulo: 'Privacidad',
    titulo: 'Política de privacidad',
    intro: `Esta política explica cómo ${empresa} trata los datos personales en el sitio, de acuerdo con la Ley General de Protección de Datos de Brasil (LGPD, Ley n.º 13.709/2018). Última actualización: octubre de 2026. Esta es una traducción: ante cualquier diferencia, prevalece la versión en portugués.`,
    secoes: [
      {
        titulo: 'Qué datos recopilamos',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              { texto: 'El nombre, el país, el número de WhatsApp y el e-mail que escribes en los formularios de contacto, de agenda de visitas y de conversación con el agente;' },
              { texto: 'El mensaje, los días y horarios preferidos y el inmueble de interés, cuando los completas;' },
              { texto: 'Datos técnicos de navegación (como la dirección IP y el tipo de navegador), registrados por los proveedores de hosting para mantener el sitio funcionando y seguro;' },
              { texto: 'Datos anónimos de uso del sitio, descritos más abajo en “Medición de uso del sitio”.' },
            ],
          },
        ],
      },
      {
        titulo: 'Cómo funcionan los formularios',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'El sitio no guarda en una base de datos lo que escribes en los formularios. Al enviarlos, armamos un mensaje con esos datos y abrimos el WhatsApp de A3 para que lo envíes. El contacto solo nos llega cuando envías el mensaje por WhatsApp, y la conversación pasa a regirse también por los términos y la política de privacidad de WhatsApp (Meta).',
          },
        ],
      },
      {
        titulo: 'Para qué los usamos',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Usamos los datos solo para responder tu contacto, agendar visitas, enviarte información sobre inmuebles de tu interés y cumplir obligaciones legales. La base legal es tu consentimiento, dado al marcar la autorización en el formulario, y la ejecución de medidas precontractuales que solicites.',
          },
        ],
      },
      {
        titulo: 'Medición de uso del sitio',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Para saber qué inmuebles interesan, qué busca la gente y si el sitio es rápido, el propio sitio mide el uso de forma anónima. No usamos Google Analytics ni otra herramienta de terceros para esto.',
          },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Qué medimos:',
                texto:
                  'las páginas vistas y durante cuánto tiempo, hasta dónde se desplazó la página, los clics en WhatsApp, teléfono, e-mail, fotos, mapa y botón de compartir, los filtros y los términos usados en la búsqueda, el envío de los formularios (solo el nombre del formulario, el inmueble y qué campos dieron error, nunca lo que se escribió), el tipo de dispositivo, el navegador y el sistema operativo, el idioma y el sitio de donde vino la persona.',
              },
              {
                destaque: 'Ubicación aproximada:',
                texto: 'ciudad y estado, estimados por el proveedor de hosting a partir de la dirección IP. La dirección IP en sí no se guarda.',
              },
              {
                destaque: 'Sin identificarte:',
                texto:
                  'no usamos cookies ni guardamos nada en tu dispositivo para esta medición. Para contar visitantes distintos, generamos un código a partir de la dirección IP y del navegador combinados con un valor secreto que cambia todos los días y se borra a los dos días. Por eso el código no puede rehacerse, no identifica a la persona y no vincula la visita de un día con la de otro.',
              },
              {
                destaque: 'Durante cuánto tiempo:',
                texto: 'los registros detallados se borran a los 90 días. Solo quedan totales diarios, como “cuántas visitas tuvo el inmueble X”, que no identifican a nadie.',
              },
              {
                destaque: 'Cómo no ser contado:',
                texto: 'si tu navegador envía la señal “No rastrear” (DNT) o “Global Privacy Control”, la medición se desactiva para ti. El equipo de A3 también queda fuera de las estadísticas.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'La base legal es el interés legítimo de A3 en mejorar el sitio y la atención (LGPD, art. 7, IX), con datos que no identifican a las personas.',
          },
        ],
      },
      {
        titulo: 'Cookies',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'El sitio no usa cookies de publicidad ni de seguimiento de visitantes. Solo el área administrativa, restringida al equipo de A3, usa cookies: una de sesión, para mantener el inicio de sesión, y un marcador que deja las visitas del propio equipo fuera de las estadísticas.',
          },
        ],
      },
      {
        titulo: 'Con quién los compartimos',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'No vendemos datos personales. La información de la conversación puede compartirse con constructoras asociadas o propietarios solo cuando sea necesario para la negociación que pediste. El sitio está alojado en proveedores de infraestructura en la nube, que solo procesan los datos técnicos de navegación.',
          },
        ],
      },
      {
        titulo: 'Tus derechos',
        blocos: [
          {
            tipo: 'paragrafo',
            texto: `En cualquier momento puedes pedir la confirmación de que tratamos tus datos, el acceso, la corrección, la portabilidad, la anonimización o la eliminación, información sobre con quién los compartimos y la revocación del consentimiento, por e-mail o WhatsApp: ${contato}.`,
          },
        ],
      },
      {
        titulo: 'Durante cuánto tiempo los guardamos',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Las conversaciones quedan en el WhatsApp de A3 mientras la atención esté en curso o durante el plazo exigido por la ley. Después se eliminan o anonimizan. Puedes pedir su eliminación antes por los canales indicados arriba. Los datos de uso del sitio siguen los plazos de la sección “Medición de uso del sitio”.',
          },
        ],
      },
      {
        titulo: 'Quién es el responsable',
        blocos: [{ tipo: 'paragrafo', texto: `El responsable del tratamiento de los datos es ${empresa}, ${endereco}, Brasil.` }],
      },
    ],
    aviso: `${site.nome} · ${endereco} · ${site.creci}`,
  },
  fr: {
    tituloSeo: 'Politique de confidentialité',
    descricaoSeo: `Comment ${site.nome} traite les données saisies dans les formulaires du site et sur WhatsApp, selon la loi brésilienne sur la protection des données (LGPD).`,
    sobretitulo: 'Confidentialité',
    titulo: 'Politique de confidentialité',
    intro: `Cette politique explique comment ${empresa} traite les données personnelles sur le site, conformément à la loi générale brésilienne sur la protection des données (LGPD, loi n° 13.709/2018). Dernière mise à jour : octobre 2026. Ceci est une traduction : en cas de différence, la version portugaise prévaut.`,
    secoes: [
      {
        titulo: 'Les données que nous collectons',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              { texto: 'Le nom, le pays, le numéro WhatsApp et l’e-mail que vous saisissez dans les formulaires de contact, de demande de visite et d’échange avec l’agent ;' },
              { texto: 'Le message, les jours et horaires préférés et le bien qui vous intéresse, lorsque vous les renseignez ;' },
              { texto: 'Des données techniques de navigation (comme l’adresse IP et le type de navigateur), enregistrées par les hébergeurs pour assurer le fonctionnement et la sécurité du site ;' },
              { texto: 'Des données anonymes d’utilisation du site, décrites ci-dessous dans « Mesure d’audience du site ».' },
            ],
          },
        ],
      },
      {
        titulo: 'Le fonctionnement des formulaires',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Le site n’enregistre pas dans une base de données ce que vous saisissez dans les formulaires. À l’envoi, nous composons un message avec ces données et ouvrons le WhatsApp d’A3 pour que vous l’envoyiez. Le contact ne nous parvient que lorsque vous envoyez le message sur WhatsApp, et la conversation est alors également soumise aux conditions et à la politique de confidentialité de WhatsApp (Meta).',
          },
        ],
      },
      {
        titulo: 'Ce que nous en faisons',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Nous utilisons les données uniquement pour répondre à votre demande, organiser des visites, vous envoyer des informations sur les biens qui vous intéressent et respecter nos obligations légales. La base légale est votre consentement, donné en cochant l’autorisation dans le formulaire, et l’exécution de mesures précontractuelles que vous demandez.',
          },
        ],
      },
      {
        titulo: 'Mesure d’audience du site',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Pour savoir quels biens intéressent, ce que les gens recherchent et si le site est rapide, le site mesure lui-même son utilisation de manière anonyme. Nous n’utilisons ni Google Analytics ni aucun autre outil tiers à cette fin.',
          },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Ce que nous mesurons :',
                texto:
                  'les pages vues et leur durée, jusqu’où la page a été défilée, les clics sur WhatsApp, le téléphone, l’e-mail, les photos, la carte et le bouton de partage, les filtres et les termes utilisés dans la recherche, l’envoi des formulaires (uniquement le nom du formulaire, le bien et les champs en erreur, jamais ce qui a été saisi), le type d’appareil, le navigateur et le système, la langue et le site d’origine.',
              },
              {
                destaque: 'Localisation approximative :',
                texto: 'ville et État, estimés par l’hébergeur à partir de l’adresse IP. L’adresse IP elle-même n’est pas enregistrée.',
              },
              {
                destaque: 'Sans vous identifier :',
                texto:
                  'nous n’utilisons pas de cookies et n’enregistrons rien sur votre appareil pour cette mesure. Pour compter les visiteurs distincts, nous générons un code à partir de l’adresse IP et du navigateur, combinés à une valeur secrète qui change chaque jour et est supprimée au bout de deux jours. Le code ne peut donc pas être reconstitué, n’identifie pas la personne et ne relie pas une visite d’un jour à un autre.',
              },
              {
                destaque: 'Pendant combien de temps :',
                texto: 'les données détaillées sont supprimées au bout de 90 jours. Seuls restent des totaux quotidiens, comme « combien de visites a eu le bien X », qui n’identifient personne.',
              },
              {
                destaque: 'Comment ne pas être compté :',
                texto: 'si votre navigateur envoie le signal « Do Not Track » (DNT) ou « Global Privacy Control », la mesure est désactivée pour vous. L’équipe d’A3 est également exclue des statistiques.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'La base légale est l’intérêt légitime d’A3 à améliorer le site et le service (LGPD, art. 7, IX), avec des données qui n’identifient pas les personnes.',
          },
        ],
      },
      {
        titulo: 'Cookies',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Le site n’utilise pas de cookies publicitaires ni de suivi des visiteurs. Seul l’espace d’administration, réservé à l’équipe d’A3, utilise des cookies : un cookie de session, pour rester connecté, et un marqueur qui exclut des statistiques les visites de l’équipe elle-même.',
          },
        ],
      },
      {
        titulo: 'Avec qui nous les partageons',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Nous ne vendons pas de données personnelles. Les informations de la conversation peuvent être partagées avec des promoteurs partenaires ou des propriétaires uniquement lorsque c’est nécessaire à la négociation que vous avez demandée. Le site est hébergé par des fournisseurs d’infrastructure cloud, qui ne traitent que les données techniques de navigation.',
          },
        ],
      },
      {
        titulo: 'Vos droits',
        blocos: [
          {
            tipo: 'paragrafo',
            texto: `Vous pouvez à tout moment demander la confirmation que nous traitons vos données, l’accès, la rectification, la portabilité, l’anonymisation ou la suppression, des informations sur les personnes avec qui nous les partageons et le retrait de votre consentement, par e-mail ou WhatsApp : ${contato}.`,
          },
        ],
      },
      {
        titulo: 'Durée de conservation',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Les conversations restent sur le WhatsApp d’A3 tant que l’accompagnement est en cours ou pendant la durée exigée par la loi. Ensuite, elles sont supprimées ou anonymisées. Vous pouvez en demander la suppression plus tôt par les canaux ci-dessus. Les données d’utilisation du site suivent les durées de la section « Mesure d’audience du site ».',
          },
        ],
      },
      {
        titulo: 'Responsable du traitement',
        blocos: [{ tipo: 'paragrafo', texto: `Le responsable du traitement des données est ${empresa}, ${endereco}, Brésil.` }],
      },
    ],
    aviso: `${site.nome} · ${endereco} · ${site.creci}`,
  },
  de: {
    tituloSeo: 'Datenschutzerklärung',
    descricaoSeo: `Wie ${site.nome} die Daten verarbeitet, die Sie in den Formularen der Website und über WhatsApp angeben – nach dem brasilianischen Datenschutzgesetz (LGPD).`,
    sobretitulo: 'Datenschutz',
    titulo: 'Datenschutzerklärung',
    intro: `Diese Erklärung beschreibt, wie ${empresa} personenbezogene Daten auf der Website verarbeitet, gemäß dem brasilianischen Allgemeinen Datenschutzgesetz (LGPD, Gesetz Nr. 13.709/2018). Letzte Aktualisierung: Oktober 2026. Dies ist eine Übersetzung: Bei Abweichungen gilt die portugiesische Fassung.`,
    secoes: [
      {
        titulo: 'Welche Daten wir erheben',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              { texto: 'Name, Land, WhatsApp-Nummer und E-Mail, die Sie in die Formulare für Kontakt, Besichtigung und Maklergespräch eingeben;' },
              { texto: 'Nachricht, bevorzugte Tage und Uhrzeiten und die gewünschte Immobilie, wenn Sie diese angeben;' },
              { texto: 'Technische Nutzungsdaten (wie IP-Adresse und Browsertyp), die von den Hosting-Anbietern erfasst werden, um den Betrieb und die Sicherheit der Website zu gewährleisten;' },
              { texto: 'Anonyme Nutzungsdaten der Website, beschrieben unten unter „Messung der Website-Nutzung“.' },
            ],
          },
        ],
      },
      {
        titulo: 'Wie die Formulare funktionieren',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Die Website speichert Ihre Eingaben in den Formularen nicht in einer Datenbank. Beim Absenden stellen wir mit diesen Daten eine Nachricht zusammen und öffnen den WhatsApp-Chat von A3, damit Sie sie senden. Der Kontakt erreicht uns erst, wenn Sie die Nachricht über WhatsApp senden; für das Gespräch gelten dann auch die Bedingungen und die Datenschutzerklärung von WhatsApp (Meta).',
          },
        ],
      },
      {
        titulo: 'Wofür wir sie verwenden',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Wir verwenden die Daten nur, um auf Ihre Anfrage zu antworten, Besichtigungen zu vereinbaren, Ihnen Informationen über Immobilien zu senden, die Sie interessieren, und gesetzliche Pflichten zu erfüllen. Rechtsgrundlage ist Ihre Einwilligung, die Sie durch das Ankreuzen im Formular erteilen, sowie die Durchführung vorvertraglicher Maßnahmen auf Ihre Anfrage.',
          },
        ],
      },
      {
        titulo: 'Messung der Website-Nutzung',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Um zu erfahren, welche Immobilien gefragt sind, wonach gesucht wird und ob die Website schnell ist, misst die Website ihre Nutzung selbst und anonym. Dafür verwenden wir weder Google Analytics noch andere Dienste von Dritten.',
          },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Was wir messen:',
                texto:
                  'aufgerufene Seiten und deren Dauer, wie weit gescrollt wurde, Klicks auf WhatsApp, Telefon, E-Mail, Fotos, Karte und Teilen-Schaltfläche, die bei der Suche verwendeten Filter und Begriffe, das Absenden der Formulare (nur der Name des Formulars, die Immobilie und welche Felder fehlerhaft waren, niemals der eingegebene Text), Gerätetyp, Browser und Betriebssystem, Sprache und die Website, von der die Person kam.',
              },
              {
                destaque: 'Ungefährer Standort:',
                texto: 'Stadt und Bundesstaat, vom Hosting-Anbieter anhand der IP-Adresse geschätzt. Die IP-Adresse selbst wird nicht gespeichert.',
              },
              {
                destaque: 'Ohne Sie zu identifizieren:',
                texto:
                  'Für diese Messung verwenden wir keine Cookies und speichern nichts auf Ihrem Gerät. Um verschiedene Besucher zu zählen, bilden wir aus IP-Adresse und Browser zusammen mit einem geheimen Wert, der sich täglich ändert und nach zwei Tagen gelöscht wird, einen Code. Deshalb lässt sich der Code nicht rekonstruieren, identifiziert die Person nicht und verknüpft keinen Besuch an einem Tag mit einem anderen.',
              },
              {
                destaque: 'Wie lange:',
                texto: 'Detaillierte Aufzeichnungen werden nach 90 Tagen gelöscht. Es bleiben nur Tagessummen wie „wie viele Besuche Immobilie X hatte“, die niemanden identifizieren.',
              },
              {
                destaque: 'Wie Sie nicht gezählt werden:',
                texto: 'Sendet Ihr Browser das Signal „Do Not Track“ (DNT) oder „Global Privacy Control“, wird die Messung für Sie abgeschaltet. Auch das Team von A3 ist von den Statistiken ausgenommen.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'Rechtsgrundlage ist das berechtigte Interesse von A3, die Website und den Service zu verbessern (LGPD, Art. 7, IX), mit Daten, die keine Personen identifizieren.',
          },
        ],
      },
      {
        titulo: 'Cookies',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Die Website verwendet keine Werbe- oder Tracking-Cookies. Nur der Verwaltungsbereich, der dem Team von A3 vorbehalten ist, verwendet Cookies: ein Sitzungscookie, um angemeldet zu bleiben, und eine Markierung, die die Besuche des Teams aus den Statistiken heraushält.',
          },
        ],
      },
      {
        titulo: 'An wen wir sie weitergeben',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Wir verkaufen keine personenbezogenen Daten. Informationen aus dem Gespräch können an Partner-Bauträger oder Eigentümer weitergegeben werden, aber nur, wenn es für die von Ihnen gewünschte Verhandlung nötig ist. Die Website wird bei Cloud-Infrastruktur-Anbietern betrieben, die nur die technischen Nutzungsdaten verarbeiten.',
          },
        ],
      },
      {
        titulo: 'Ihre Rechte',
        blocos: [
          {
            tipo: 'paragrafo',
            texto: `Sie können jederzeit die Bestätigung verlangen, dass wir Ihre Daten verarbeiten, sowie Auskunft, Berichtigung, Übertragbarkeit, Anonymisierung oder Löschung, Informationen darüber, an wen wir sie weitergeben, und den Widerruf Ihrer Einwilligung – per E-Mail oder WhatsApp: ${contato}.`,
          },
        ],
      },
      {
        titulo: 'Wie lange wir sie speichern',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Die Gespräche bleiben im WhatsApp von A3, solange die Betreuung läuft oder solange es das Gesetz verlangt. Danach werden sie gelöscht oder anonymisiert. Sie können die Löschung schon früher über die oben genannten Kanäle verlangen. Für die Nutzungsdaten der Website gelten die Fristen aus „Messung der Website-Nutzung“.',
          },
        ],
      },
      {
        titulo: 'Verantwortliche Stelle',
        blocos: [{ tipo: 'paragrafo', texto: `Verantwortlich für die Datenverarbeitung ist ${empresa}, ${endereco}, Brasilien.` }],
      },
    ],
    aviso: `${site.nome} · ${endereco} · ${site.creci}`,
  },
}
