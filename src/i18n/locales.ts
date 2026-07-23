/**
 * The languages the UI can display. Add a new one by dropping a catalog file in
 * `catalog/` and registering it in `i18n.svelte.ts` — this list drives the
 * Settings picker, so a language only appears once it has a catalog.
 */
export interface LocaleMeta {
  code: string
  /** Endonym — shown in the picker in its own language. */
  label: string
}

export const LOCALES: LocaleMeta[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
]

export const DEFAULT_LOCALE = 'en'

/**
 * Maps a browser language tag (e.g. `es-MX`, `zh-Hant-HK`) onto one of our codes,
 * or null if we don't ship it. Used when the user's language preference is "auto".
 */
export const matchLocale = (available: Set<string>, tag: string): string | null => {
  const lower = tag.toLowerCase()
  // Chinese needs script-awareness: Traditional vs Simplified.
  if (lower.startsWith('zh')) {
    const traditional = lower.includes('hant') || lower.includes('-tw') || lower.includes('-hk') || lower.includes('-mo')
    const zh = traditional ? 'zh-TW' : 'zh-CN'
    return available.has(zh) ? zh : available.has('zh-CN') ? 'zh-CN' : null
  }
  if (available.has(tag)) return tag
  const base = lower.split('-')[0]
  for (const code of available) {
    if (code.toLowerCase() === base || code.toLowerCase().split('-')[0] === base) return code
  }
  return null
}
