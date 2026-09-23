import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Lang = 'es' | 'en'

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const stored = localStorage.getItem('site_lang')
    if (stored === 'es' || stored === 'en') setLangState(stored)
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next)
        localStorage.setItem('site_lang', next)
      },
      toggleLang: () => {
        const next = lang === 'es' ? 'en' : 'es'
        setLangState(next)
        localStorage.setItem('site_lang', next)
      },
    }),
    [lang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}

