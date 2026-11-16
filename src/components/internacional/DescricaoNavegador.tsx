'use client'

// Descrição do imóvel que ainda não tem tradução no site (sem serviço de tradução configurado, ou texto novo ainda não
// traduzido). Navegadores com tradutor embutido (Chrome 138+ no computador: Translator API, roda no próprio aparelho, sem
// custo e sem enviar o texto a ninguém) traduzem para o idioma da página. Se o modelo do idioma já está no aparelho, a
// tradução é automática; se ainda precisa ser baixado, aparece um botão (o navegador só baixa com um clique da pessoa).
// O HTML do servidor continua com o original em português: é o que o Google vê.

import { useEffect, useState } from 'react'
import s from '@/components/imovel/Imovel.module.css'
import si from './Internacional.module.css'

interface Tradutor {
  translate(texto: string): Promise<string>
}
interface ApiTradutor {
  availability(opcoes: { sourceLanguage: string; targetLanguage: string }): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>
  create(opcoes: { sourceLanguage: string; targetLanguage: string }): Promise<Tradutor>
}

function api(): ApiTradutor | undefined {
  return typeof self !== 'undefined' && 'Translator' in self ? (self as unknown as { Translator: ApiTradutor }).Translator : undefined
}

type Estado = 'original' | 'oferecer' | 'traduzindo' | 'traduzido'

export function DescricaoNavegador({
  paragrafos,
  idioma,
  textos,
}: {
  paragrafos: string[]
  idioma: string
  textos: { aviso: string; traduzir: string; traduzindo: string; traduzido: string; verOriginal: string; verTraducao: string }
}) {
  const [estado, setEstado] = useState<Estado>('original')
  const [traducao, setTraducao] = useState<string[] | null>(null)
  const [mostrarOriginal, setMostrarOriginal] = useState(false)

  async function traduzir() {
    const Translator = api()
    if (!Translator) return
    setEstado('traduzindo')
    try {
      const tradutor = await Translator.create({ sourceLanguage: 'pt', targetLanguage: idioma })
      const traduzidos: string[] = []
      for (const p of paragrafos) traduzidos.push(await tradutor.translate(p))
      setTraducao(traduzidos)
      setEstado('traduzido')
    } catch {
      setEstado('original')
    }
  }

  useEffect(() => {
    const Translator = api()
    if (!Translator) return
    let ativo = true
    Translator.availability({ sourceLanguage: 'pt', targetLanguage: idioma })
      .then((disponivel) => {
        if (!ativo) return
        // Modelo já no aparelho: traduz sem pedir nada. Precisa baixar: o navegador exige um clique.
        if (disponivel === 'available') void traduzir()
        else if (disponivel === 'downloadable' || disponivel === 'downloading') setEstado('oferecer')
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem; `traduzir` usa os mesmos parágrafos.
  }, [idioma])

  const exibindoTraducao = estado === 'traduzido' && traducao && !mostrarOriginal
  return (
    <>
      <p className={si.nota}>
        {exibindoTraducao ? textos.traduzido : textos.aviso}{' '}
        {estado === 'oferecer' && (
          <button type="button" className="link-texto" style={{ minHeight: 0, display: 'inline' }} onClick={() => void traduzir()}>
            {textos.traduzir}
          </button>
        )}
        {estado === 'traduzindo' && <span>{textos.traduzindo}</span>}
        {estado === 'traduzido' && (
          <button type="button" className="link-texto" style={{ minHeight: 0, display: 'inline' }} onClick={() => setMostrarOriginal((v) => !v)}>
            {mostrarOriginal ? textos.verTraducao : textos.verOriginal}
          </button>
        )}
      </p>
      <div className={s.texto} lang={exibindoTraducao ? idioma : 'pt-BR'}>
        {(exibindoTraducao ? traducao : paragrafos).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </>
  )
}
