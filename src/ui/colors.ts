/**
 * List accent colors. Keys match the v1 stored color names so existing data
 * keeps its colors; the values are a friendlier palette than the old Material
 * defaults.
 */
export const LIST_COLORS: Record<string, string> = {
  red: '#e5695e',
  pink: '#dd66a2',
  purple: '#9a6ee8',
  indigo: '#6a79e8',
  blue: '#4d9ee6',
  cyan: '#3fb9cf',
  teal: '#3cb8a4',
  green: '#58b968',
  yellow: '#d9a514',
  orange: '#e08c3c',
  brown: '#a07855',
}

export const COLOR_NAMES = ['', ...Object.keys(LIST_COLORS)]

export const colorOf = (name: string): string | null => LIST_COLORS[name] ?? null
