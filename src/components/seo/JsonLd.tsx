export function JsonLd({ dados }: { dados: object }) {
  return (
    <script
      type="application/ld+json"
      // "<" escapado para impedir que um texto do catálogo feche a tag <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, '\\u003c') }}
    />
  )
}
