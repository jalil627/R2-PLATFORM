import ar from './ar'
import en from './en'

export type Locale = 'ar' | 'en'
export type TranslationKey = typeof ar

const translations: Record<Locale, typeof ar> = { ar, en }

export function getTranslations(locale: Locale = 'ar') {
  return translations[locale] || translations.ar
}

export function getDirection(locale: Locale = 'ar'): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function getLocaleConfig(locale: Locale = 'ar') {
  return {
    locale,
    dir: getDirection(locale),
    t: getTranslations(locale),
    lang: locale === 'ar' ? 'ar' : 'en',
  }
}

export { ar, en }
