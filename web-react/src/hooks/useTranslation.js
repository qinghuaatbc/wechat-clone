import { useStore } from '../store'
import { translations } from '../i18n'

export function useTranslation() {
  const lang = useStore(s => s.lang)
  const t = (key) => translations[lang]?.[key] || translations.zh[key] || key
  return { t, lang }
}
