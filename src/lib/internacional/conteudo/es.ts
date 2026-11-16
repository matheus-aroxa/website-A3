import { privacidade } from './privacidade'
import type { ConteudoIdioma } from './tipos'

const es: ConteudoIdioma = {
  guia: {
    tituloSeo: 'Comprar un inmueble en Brasil siendo extranjero: guía completa',
    descricaoSeo:
      '¿Un extranjero puede comprar un inmueble en Brasil? Sí. Cómo obtener el CPF, la compra paso a paso, el envío del dinero, impuestos y costos, comprar a distancia y la residencia por inversión inmobiliaria.',
    sobretitulo: 'Guía de compra',
    titulo: 'Cómo comprar un inmueble en Brasil siendo extranjero',
    intro:
      'Sí, los extranjeros pueden comprar inmuebles en Brasil, incluso sin vivir aquí. Para departamentos y casas en la ciudad, las reglas son las mismas que para los brasileños: no hay límite de valor ni de cantidad. Solo necesitas un CPF, el número de contribuyente brasileño. Esta guía te muestra todo el camino, desde el primer contacto hasta la entrega de llaves.',
    secoes: [
      {
        titulo: 'Quién puede comprar',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Inmuebles urbanos',
                texto: '(departamentos, casas, terrenos en la ciudad): cualquier extranjero, residente o no, en las mismas condiciones que un brasileño.',
              },
              {
                destaque: 'Inmuebles rurales y zonas de frontera:',
                texto: 'tienen reglas y autorizaciones propias. No es el caso de los inmuebles que ofrece A3, todos urbanos y en la costa de Pernambuco.',
              },
              {
                destaque: 'Inmuebles frente al mar:',
                texto:
                  'parte de la costa es “terreno de marinha”, un área que pertenece al Estado federal. Un departamento en un condominio de la ciudad no necesita autorización, siempre que las unidades de extranjeros no superen un tercio del terreno del edificio. Las casas y terrenos en esa franja pueden requerir autorización federal. A3 verifica la situación de cada inmueble en el registro antes de la oferta.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'El CPF',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'El CPF es el primer paso y es gratuito. Los extranjeros que viven en el exterior lo solicitan en persona en un consulado o una embajada de Brasil, con turno reservado en el sitio e-Consular. Lleva el formulario de la Receita Federal completo y firmado, un documento de identidad y tu partida de nacimiento o de matrimonio. Después, el registro debe confirmarse una vez al año en la aplicación de la Receita Federal.',
          },
        ],
      },
      {
        titulo: 'La compra, paso a paso',
        blocos: [
          {
            tipo: 'passos',
            itens: [
              {
                destaque: 'Elección del inmueble.',
                texto: 'Cuéntale a A3 qué buscas: vivir, pasar temporadas o alquilar. Te enviamos opciones, fotos y videos y, si quieres, hacemos la visita por videollamada.',
              },
              {
                destaque: 'Revisión de documentos.',
                texto: 'Antes de la oferta revisamos la matrícula del inmueble en el registro, los certificados del vendedor y si hay deudas de expensas o de IPTU, el impuesto anual sobre el inmueble.',
              },
              {
                destaque: 'Oferta y contrato.',
                texto: 'Acordado el precio, se firma un boleto de compraventa, generalmente con una seña.',
              },
              { destaque: 'Pago.', texto: 'El dinero entra en Brasil a través de un banco o una casa de cambio autorizados (ver abajo).' },
              {
                destaque: 'Escritura y registro.',
                texto: 'La escritura se firma ante escribano y luego se inscribe en el registro de la propiedad. El inmueble es tuyo solo después del registro.',
              },
              {
                destaque: 'Llaves.',
                texto:
                  'Inmueble listo: recibes las llaves y se pasan a tu nombre el agua, la luz y las expensas. Proyecto nuevo: pagas según el cronograma de la constructora y recibes el inmueble al terminar la obra.',
              },
            ],
          },
          {
            tipo: 'paragrafo',
            texto: 'Con los documentos en orden, un inmueble listo suele llevar de 30 a 60 días entre la oferta y el registro.',
          },
        ],
      },
      {
        titulo: 'Cómo enviar el dinero',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'El pago llega del exterior mediante un contrato de cambio con un banco o una casa de cambio autorizados por el Banco Central de Brasil. Guarda el contrato y los comprobantes: prueban el origen del dinero y facilitan enviarlo de vuelta si vendes en el futuro. La compra de un inmueble por una persona física para uso propio, en general, no necesita declararse en el sistema de inversión extranjera del Banco Central. Tu banco o casa de cambio te orientará en tu caso.',
          },
        ],
      },
      {
        titulo: 'Impuestos y costos de la compra',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['Concepto', 'Cuánto', 'Cuándo'],
            linhas: [
              ['ITBI, el impuesto municipal a la transferencia', 'En general el 3% del valor; Recife ofreció reducciones temporales', 'Antes de la escritura'],
              ['Escritura y registro', 'En general del 1% al 2% del valor, según una tabla oficial del estado', 'En la escritura y en el registro'],
              ['IPTU, el impuesto anual al inmueble', 'Depende del inmueble y de la ciudad', 'Cada año'],
              ['Expensas del condominio', 'Dependen del edificio', 'Cada mes'],
            ],
            nota:
              'En el presupuesto, calcula entre un 4% y un 5% adicional al precio del inmueble. A3 te informa el monto exacto de cada inmueble antes de la oferta. En Brasil, la comisión de la inmobiliaria normalmente la paga el vendedor.',
          },
        ],
      },
      {
        titulo: 'Después de la compra: alquiler y venta',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Alquiler:',
                texto: 'puedes alquilar el inmueble por temporada o por año. Para quien no reside en Brasil, el impuesto a la renta sobre el alquiler es del 15%, pagado por tu apoderado en Brasil.',
              },
              {
                destaque: 'Venta:',
                texto:
                  'la ganancia de la venta paga impuesto a las ganancias de capital: 15% sobre ganancias de hasta R$ 5 millones, con alícuotas mayores por encima de esa cifra. Las exenciones de los residentes en Brasil no se aplican a quien vive en el exterior.',
              },
              {
                destaque: 'Reforma tributaria:',
                texto:
                  'Brasil creó nuevos impuestos sobre operaciones inmobiliarias. Una persona física solo empieza a pagarlos sobre alquileres con más de tres inmuebles alquilados y más de R$ 240.000 al año en alquileres (monto ajustado por inflación), o con más de R$ 288.000 en alquileres en un año.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Financiación',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'El crédito hipotecario exige una cuenta en un banco brasileño e ingresos comprobables. Para quien no reside en Brasil es raro y lento. Lo habitual es pagar al contado o, en proyectos nuevos, en cuotas directamente con la constructora durante la obra.',
          },
        ],
      },
      {
        titulo: 'Comprar sin venir a Brasil',
        blocos: [
          { tipo: 'paragrafo', texto: 'Puedes hacer todo a distancia. Las opciones son:' },
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Escritura por videoconferencia:',
                texto: 'las escribanías brasileñas firman escrituras en línea a través de e-Notariado, con una firma digital gratuita emitida por la propia escribanía. Para inmuebles, la escribanía es la de la ciudad del inmueble.',
              },
              {
                destaque: 'Poder:',
                texto:
                  'designas a una persona de confianza en Brasil para que firme por ti. Puede otorgarse en un consulado brasileño o ante un escribano de tu país, con apostilla y traducción pública. Si alquilas el inmueble, el apoderado también paga el impuesto sobre el alquiler.',
              },
            ],
          },
        ],
      },
      {
        titulo: 'Vivir en Brasil invirtiendo en inmuebles',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'Brasil otorga autorización de residencia a los extranjeros que invierten en inmuebles urbanos. El mínimo es de R$ 1 millón, o R$ 700.000 en el Nordeste, donde está Pernambuco, y el monto puede repartirse en más de un inmueble. La primera autorización vale por 4 años y puede volverse permanente si mantienes la inversión.',
          },
        ],
      },
      {
        titulo: 'Preguntas frecuentes',
        blocos: [
          {
            tipo: 'perguntas',
            itens: [
              { pergunta: '¿Necesito vivir en Brasil para comprar?', resposta: 'No. Los no residentes compran normalmente con el CPF.' },
              { pergunta: '¿Puedo comprar más de un inmueble?', resposta: 'Sí, no hay límite para inmuebles urbanos.' },
              { pergunta: '¿En qué moneda pago?', resposta: 'En reales brasileños. El cambio se hace a través de un banco o una casa de cambio autorizados.' },
              { pergunta: '¿Cuánto tiempo lleva?', resposta: 'Para un inmueble listo, con los documentos en orden, de 30 a 60 días entre la oferta y el registro.' },
              { pergunta: '¿Puedo hablar con A3 en mi idioma?', resposta: 'Escríbenos en tu idioma por WhatsApp o mediante el formulario, y A3 te responde.' },
            ],
          },
        ],
      },
    ],
    aviso:
      'Esta guía es informativa, se basa en la legislación brasileña de noviembre de 2026 y no reemplaza el asesoramiento de un abogado o contador para tu caso.',
    chamada: {
      titulo: '¿Listo para empezar?',
      texto: 'Cuéntanos qué buscas. Un agente de A3 te acompañará en cada paso.',
      botao: 'Hablar con un agente',
    },
  },
  regiao: {
    tituloSeo: 'Vivir e invertir en Recife y en la costa de Pernambuco, Brasil',
    descricaoSeo:
      'Sol todo el año, playas de agua tibia protegidas por arrecifes y vuelos directos a Buenos Aires, Santiago, Montevideo y Europa. Dónde están los inmuebles de A3: Recife, Olinda, Paulista, Igarassu y Jaboatão.',
    sobretitulo: 'La región',
    titulo: 'Recife y la costa de Pernambuco',
    intro:
      'Pernambuco tiene sol todo el año, playas de agua tibia protegidas por arrecifes y una de las capitales más vivas de Brasil. Está en el punto del continente más cercano a Europa y a África. A3 trabaja en el área metropolitana de Recife, con foco en la costa norte: Paulista, Olinda e Igarassu.',
    secoes: [
      {
        titulo: 'Dónde están los inmuebles',
        blocos: [
          {
            tipo: 'tabela',
            colunas: ['Ciudad', 'Distancia al aeropuerto', 'Lo destacado'],
            linhas: [
              [
                'Recife',
                'De 5 a 20 km',
                'La capital del estado. La playa de Boa Viagem, el centro histórico de Recife Antigo, hospitales, universidades y el Porto Digital, uno de los mayores polos tecnológicos del país.',
              ],
              ['Olinda', 'Unos 20 km', 'Centro histórico declarado Patrimonio de la Humanidad por la UNESCO y uno de los carnavales más famosos de Brasil.'],
              [
                'Paulista',
                'Unos 30 km',
                'Sede de A3. Las playas tranquilas de Janga, Pau Amarelo (con su fuerte del siglo XVIII) y Maria Farinha, con paseos en barco. Precios más bajos que en la capital.',
              ],
              ['Igarassu', 'Unos 40 km', 'Una de las ciudades más antiguas de Brasil, cerca de la isla de Itamaracá.'],
              ['Jaboatão dos Guararapes', 'Unos 10 km', 'Las playas de Piedade y Candeias, que continúan la costanera de Boa Viagem.'],
            ],
            nota: 'Distancias aproximadas por carretera desde el Aeropuerto Internacional de Recife.',
          },
        ],
      },
      {
        titulo: 'Clima',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'El clima es tropical, con temperaturas entre 24 °C y 31 °C todo el año y el mar a unos 27 °C. Llueve más entre abril y julio. De septiembre a marzo es temporada alta, con días secos y soleados.',
          },
        ],
      },
      {
        titulo: 'Cómo llegar',
        blocos: [
          {
            tipo: 'paragrafo',
            texto:
              'El Aeropuerto Internacional de Recife es el de mayor movimiento del Nordeste de Brasil. Tiene vuelos directos a Buenos Aires, Córdoba, Montevideo, Santiago de Chile, Lisboa, Oporto y Madrid. En 2026 los pasajeros internacionales crecieron cerca de un 40%.',
          },
        ],
      },
      {
        titulo: 'Paseos cercanos',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Porto de Galinhas',
                texto: '(unos 60 km al sur de Recife): piscinas naturales entre los arrecifes, elegida varias veces la mejor playa de Brasil.',
              },
              { destaque: 'Isla de Itamaracá', texto: '(unos 20 km de Paulista): playas tranquilas y el Fuerte Orange, construido por los holandeses.' },
              { destaque: 'Fernando de Noronha:', texto: 'el archipiélago más famoso de Brasil también pertenece a Pernambuco, a una hora de vuelo de Recife.' },
            ],
          },
        ],
      },
      {
        titulo: 'Por qué invertir aquí',
        blocos: [
          {
            tipo: 'lista',
            itens: [
              {
                destaque: 'Precio:',
                texto:
                  'los destinos de playa más conocidos de Brasil son caros. El metro cuadrado supera los R$ 13.000 en Florianópolis y los R$ 11.000 en Río de Janeiro. En la costa norte de Pernambuco hay inmuebles cerca del mar por mucho menos.',
              },
              { destaque: 'Alquiler temporario:', texto: 'demanda todo el año, con picos en verano y durante el carnaval de Olinda y Recife.' },
              {
                destaque: 'Residencia:',
                texto: 'en el Nordeste, la inversión inmobiliaria mínima para pedir la residencia en Brasil es de R$ 700.000, frente a R$ 1 millón en el resto del país (ver la guía de compra).',
              },
              {
                destaque: 'Costo de vida:',
                texto: 'servicios, comida y vivienda cuestan menos que en las grandes ciudades del Sudeste, con hospitales, escuelas y comercios completos en Recife.',
              },
            ],
          },
        ],
      },
    ],
    chamada: {
      titulo: 'Encuentra tu lugar en Pernambuco',
      texto: 'Mira los inmuebles seleccionados para compradores internacionales, o cuéntanos qué buscas.',
      botao: 'Hablar con un agente',
    },
  },
  privacidade: privacidade.es,
}

export default es
