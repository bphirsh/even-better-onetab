/**
 * The translation engine. `t(key, vars)` is reactive: it reads the resolved
 * locale from Svelte state, so every component that calls it re-renders when the
 * language changes — no reload needed.
 *
 * Resolution order for a message: current locale → English → the key itself
 * (so a missing translation degrades to English, and a missing key is visible in
 * dev rather than blank).
 */
import { en } from './catalog/en'
import { es } from './catalog/es'
import { fr } from './catalog/fr'
import { ru } from './catalog/ru'
import { zhCN } from './catalog/zh-CN'
import { zhTW } from './catalog/zh-TW'
import { DEFAULT_LOCALE, matchLocale } from './locales'
import type { Catalog, Vars } from './types'

// Registered catalogs. English is always present; others are added here as their
// files land, and only registered locales are offered in the picker.
const catalogs: Record<string, Catalog> = { en, es, fr, ru, 'zh-CN': zhCN, 'zh-TW': zhTW }

export const registeredLocales = () => Object.keys(catalogs)

let resolved = $state(DEFAULT_LOCALE)

/** The active locale code, reactive. */
export const currentLocale = () => resolved

/** Resolve a user preference ('auto' | code) against what we ship and the browser. */
const resolveLocale = (pref: string): string => {
  if (pref && pref !== 'auto' && catalogs[pref]) return pref
  const available = new Set(Object.keys(catalogs))
  for (const tag of navigator.languages ?? [navigator.language]) {
    const hit = matchLocale(available, tag)
    if (hit) return hit
  }
  return DEFAULT_LOCALE
}

/** Point the UI at a language. Pass the stored preference ('auto' or a code). */
export const applyLocale = (pref: string) => {
  resolved = resolveLocale(pref)
  document.documentElement.lang = resolved
}

const interpolate = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`)) : text

const lookup = (locale: string, key: string) => catalogs[locale]?.[key] ?? catalogs.en[key]

export const t = (key: string, vars?: Vars): string => {
  const message = lookup(resolved, key)
  if (message == null) return key
  if (typeof message === 'string') return interpolate(message, vars)
  // plural form: pick by n/count, fall back through 'other'
  const n = Number(vars?.n ?? vars?.count ?? 0)
  const rule = new Intl.PluralRules(resolved).select(n)
  const form = message[rule] ?? message.other ?? Object.values(message)[0] ?? key
  return interpolate(form, vars)
}
