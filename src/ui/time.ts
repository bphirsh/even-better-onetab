import { currentLocale, t } from '../i18n/i18n.svelte'

export const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return t('time.justNow')
  if (minutes < 60) return t('time.minAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('time.hourAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days === 1) return t('time.yesterday')
  if (days < 30) return t('time.dayAgo', { n: days })
  return new Date(ts).toLocaleDateString(currentLocale())
}

export const fullTime = (ts: number): string =>
  new Date(ts).toLocaleString(currentLocale(), { dateStyle: 'short', timeStyle: 'short' })
