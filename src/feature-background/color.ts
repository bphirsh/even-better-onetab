/**
 * Just enough color math to tint the palette without a dependency.
 *
 * The whole trick of this feature: a background only ever contributes a *hue*.
 * Lightness and chroma stay pinned to the ramps below, which mirror the values
 * in `src/ui/theme.css`. Contrast is therefore preserved by construction — no
 * image can produce an unreadable interface, because no image gets a say in how
 * light anything is.
 *
 * Colors are emitted as plain hex/rgba rather than `oklch()` so the same values
 * work in CSS custom properties and inside SVG fills.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)
const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))

/** OKLCH (l 0..1, c 0..0.4, h degrees) → sRGB 0..255. Ottosson's conversion. */
export const oklchToRgb = (l: number, c: number, h: number): [number, number, number] => {
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const L = l_ * l_ * l_
  const M = m_ * m_ * m_
  const S = s_ * s_ * s_

  return [
    Math.round(clamp01(toGamma(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S)) * 255),
    Math.round(clamp01(toGamma(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S)) * 255),
    Math.round(clamp01(toGamma(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S)) * 255),
  ]
}

/** OKLCH → `#rrggbb`. */
export const oklch = (l: number, c: number, h: number) => {
  const [r, g, b] = oklchToRgb(l, c, h)
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

/** OKLCH → `rgba(...)`. */
export const oklchA = (l: number, c: number, h: number, alpha: number) => {
  const [r, g, b] = oklchToRgb(l, c, h)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** sRGB 0..255 → OKLab lightness, chroma and hue (degrees, 0..360). */
export const rgbToOklch = (r: number, g: number, b: number) => {
  const lr = toLinear(r / 255)
  const lg = toLinear(g / 255)
  const lb = toLinear(b / 255)

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  const l = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  return { l, c: Math.hypot(a, bb), h: (Math.atan2(bb, a) * 180) / Math.PI + 360 }
}

/**
 * Lightness/chroma per palette token, matched to the neutral ramp in theme.css.
 * Only the hue is ever supplied by the background.
 *
 * `--bg` is in here because it paints the header bar and the status chip, which
 * sit *over* the background and should carry the tint. Behind an image it is
 * invisible anyway, so tinting it costs nothing.
 */
const LIGHT: Record<string, [number, number]> = {
  '--bg': [0.967, 0.016],
  '--surface': [0.993, 0.006],
  '--surface-2': [0.947, 0.022],
  '--surface-hover': [0.977, 0.011],
  '--text': [0.245, 0.07],
  '--text-2': [0.515, 0.065],
  '--text-3': [0.69, 0.05],
  '--border': [0.92, 0.024],
  '--accent': [0.55, 0.19],
}

const DARK: Record<string, [number, number]> = {
  '--bg': [0.175, 0.02],
  '--surface': [0.228, 0.022],
  '--surface-2': [0.272, 0.026],
  '--surface-hover': [0.253, 0.024],
  '--text': [0.925, 0.035],
  '--text-2': [0.7, 0.05],
  '--text-3': [0.52, 0.045],
  '--border': [0.312, 0.028],
  '--accent': [0.66, 0.16],
}

/** Lightness of the page backdrop per theme, for the scrim. */
const PAGE_L = { light: 0.967, dark: 0.175 }

/** Every property the tint writes — also the list `apply` clears on teardown. */
export const TINT_VARS = [...Object.keys(LIGHT), '--accent-soft']

export const tintVars = (hue: number, dark: boolean): Record<string, string> => {
  const ramp = dark ? DARK : LIGHT
  const out: Record<string, string> = {}
  for (const [key, [l, c]] of Object.entries(ramp)) out[key] = oklch(l, c, hue)
  const [al, ac] = ramp['--accent']
  out['--accent-soft'] = oklchA(al, ac, hue, dark ? 0.16 : 0.1)
  return out
}

/**
 * The wash laid over an uploaded photo so text keeps its contrast. Deliberately
 * neutral: fading a photo shouldn't also recolor it — the tint is for the
 * interface, not for the picture underneath it.
 */
export const scrimColor = (dark: boolean, dim: number) =>
  oklchA(dark ? PAGE_L.dark : PAGE_L.light, 0, 0, dim)
