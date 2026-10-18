export function JsonLd({ dados }: { dados: object }) {
  return (
    <script
      type="application/ld+json"
      // "<" escapado para impedir que um texto vindo do CRM feche a tag <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, '\\u003c') }}
    />
  )
}
