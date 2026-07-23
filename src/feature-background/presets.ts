/**
 * Built-in backgrounds, generated as SVG from a hue rather than shipped as
 * files: each preset is a few hundred bytes of markup and lands on exactly the
 * hue the tint uses, so the background and the interface can't disagree.
 *
 * Each preset authors its two faces *separately* rather than deriving dark from
 * light. Inverting a palette mechanically keeps the pattern but loses the mood —
 * the same chroma that reads as a pastel wash at 96% lightness reads as neon at
 * 17%, which is how you end up with a soft airy light theme whose dark twin
 * looks like a nebula. Every dark face here therefore runs a lower `chroma` and
 * a much smaller lightness delta against its base, so both faces stay equally
 * understated and someone who likes one should like the other.
 */

import { oklch } from './color'

export interface Face {
  hue: number
  /** Scales the pattern's chroma. Dark faces sit well below 1. */
  chroma: number
}

export interface Preset {
  id: string
  label: string
  /** Tiling presets repeat at this pixel size; the rest are scaled to cover. */
  tile?: number
  light: Face
  dark: Face
  svg: (face: Face, dark: boolean) => string
}

const open = (w: number, h: number) => `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>`

/** Soft blurred blobs — the "expensive SaaS landing page" look, in ~500 bytes. */
const mesh = (f: Face, dark: boolean) => {
  const c = (v: number) => v * f.chroma
  const base = dark ? oklch(0.172, c(0.014), f.hue) : oklch(0.967, c(0.01), f.hue)
  const a = dark ? oklch(0.232, c(0.05), f.hue) : oklch(0.885, c(0.072), f.hue)
  const b = dark ? oklch(0.212, c(0.044), f.hue + 42) : oklch(0.905, c(0.06), f.hue + 42)
  const d = dark ? oklch(0.222, c(0.042), f.hue - 48) : oklch(0.915, c(0.058), f.hue - 48)
  return (
    open(1200, 800) +
    `<defs><filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='130'/></filter></defs>` +
    `<rect width='1200' height='800' fill='${base}'/>` +
    `<g filter='url(#b)'>` +
    `<circle cx='170' cy='150' r='300' fill='${a}'/>` +
    `<circle cx='1010' cy='110' r='260' fill='${b}'/>` +
    `<circle cx='1080' cy='690' r='320' fill='${d}'/>` +
    `<circle cx='260' cy='780' r='280' fill='${b}'/>` +
    `</g></svg>`
  )
}

/** A single wide radial wash from one corner. The quietest of the set. */
const glow = (f: Face, dark: boolean) => {
  const c = (v: number) => v * f.chroma
  const edge = dark ? oklch(0.16, c(0.012), f.hue) : oklch(0.972, c(0.008), f.hue)
  const core = dark ? oklch(0.222, c(0.046), f.hue) : oklch(0.9, c(0.065), f.hue)
  return (
    open(1200, 800) +
    `<defs><radialGradient id='g' cx='18%' cy='4%' r='95%'>` +
    `<stop offset='0' stop-color='${core}'/><stop offset='1' stop-color='${edge}'/>` +
    `</radialGradient></defs>` +
    `<rect width='1200' height='800' fill='url(#g)'/></svg>`
  )
}

/** Layered soft curves. */
const waves = (f: Face, dark: boolean) => {
  const c = (v: number) => v * f.chroma
  const base = dark ? oklch(0.168, c(0.013), f.hue) : oklch(0.969, c(0.009), f.hue)
  const a = dark ? oklch(0.202, c(0.03), f.hue) : oklch(0.93, c(0.045), f.hue)
  const b = dark ? oklch(0.228, c(0.042), f.hue + 30) : oklch(0.9, c(0.06), f.hue + 30)
  return (
    open(1200, 800) +
    `<rect width='1200' height='800' fill='${base}'/>` +
    `<path d='M0 470C260 400 430 560 700 500S1080 430 1200 480V800H0Z' fill='${a}'/>` +
    `<path d='M0 610C280 545 470 690 760 630S1090 570 1200 615V800H0Z' fill='${b}'/>` +
    `</svg>`
  )
}

/** Fine dot grid. */
const dots = (f: Face, dark: boolean) => {
  const c = (v: number) => v * f.chroma
  const base = dark ? oklch(0.175, c(0.012), f.hue) : oklch(0.967, c(0.009), f.hue)
  const dot = dark ? oklch(0.262, c(0.018), f.hue) : oklch(0.88, c(0.022), f.hue)
  return open(22, 22) + `<rect width='22' height='22' fill='${base}'/><circle cx='11' cy='11' r='1.4' fill='${dot}'/></svg>`
}

/** Graph-paper lines. */
const blueprint = (f: Face, dark: boolean) => {
  const c = (v: number) => v * f.chroma
  const base = dark ? oklch(0.17, c(0.014), f.hue) : oklch(0.966, c(0.011), f.hue)
  const line = dark ? oklch(0.242, c(0.022), f.hue) : oklch(0.918, c(0.026), f.hue)
  return (
    open(32, 32) +
    `<rect width='32' height='32' fill='${base}'/>` +
    `<path d='M32 0H0V32' fill='none' stroke='${line}' stroke-width='1'/></svg>`
  )
}

/** Contour lines. Reads technical rather than decorative. */
const topography = (f: Face, dark: boolean) => {
  const c = (v: number) => v * f.chroma
  const base = dark ? oklch(0.17, c(0.014), f.hue) : oklch(0.966, c(0.009), f.hue)
  const line = dark ? oklch(0.242, c(0.02), f.hue) : oklch(0.914, c(0.022), f.hue)
  const contours = Array.from(
    { length: 11 },
    (_, i) => `<path transform='translate(0 ${i * 74 - 110})' d='M-60 300C160 210 340 380 560 300S940 190 1260 280'/>`,
  ).join('')
  return (
    open(1200, 800) +
    `<rect width='1200' height='800' fill='${base}'/>` +
    `<g fill='none' stroke='${line}' stroke-width='1.6'>${contours}</g></svg>`
  )
}

/** Tight 45° hatch — 8px of markup, essentially. */
const carbon = (f: Face, dark: boolean) => {
  const c = (v: number) => v * f.chroma
  const base = dark ? oklch(0.175, c(0.012), f.hue) : oklch(0.964, c(0.008), f.hue)
  const line = dark ? oklch(0.222, c(0.016), f.hue) : oklch(0.926, c(0.016), f.hue)
  return (
    open(8, 8) +
    `<rect width='8' height='8' fill='${base}'/>` +
    `<path d='M-2 2L2 -2M0 8L8 0M6 10L10 6' stroke='${line}' stroke-width='1.4'/></svg>`
  )
}

/** Hard-edged ridgelines, kept low so they read as a horizon rather than scenery. */
const strata = (f: Face, dark: boolean) => {
  const c = (v: number) => v * f.chroma
  const base = dark ? oklch(0.165, c(0.014), f.hue) : oklch(0.968, c(0.009), f.hue)
  const far = dark ? oklch(0.196, c(0.018), f.hue) : oklch(0.944, c(0.019), f.hue)
  const near = dark ? oklch(0.224, c(0.024), f.hue - 14) : oklch(0.918, c(0.026), f.hue - 14)
  return (
    open(1200, 800) +
    `<rect width='1200' height='800' fill='${base}'/>` +
    `<polygon points='0,800 0,688 300,624 640,700 980,596 1200,660 1200,800' fill='${far}'/>` +
    `<polygon points='0,800 0,748 360,702 700,764 1040,690 1200,732 1200,800' fill='${near}'/></svg>`
  )
}

/** A single steep diagonal, almost neutral. The quietest thing in the set. */
const graphite = (f: Face, dark: boolean) => {
  const c = (v: number) => v * f.chroma
  const a = dark ? oklch(0.212, c(0.024), f.hue) : oklch(0.948, c(0.022), f.hue)
  const b = dark ? oklch(0.148, c(0.01), f.hue + 20) : oklch(0.987, c(0.006), f.hue + 20)
  return (
    open(1200, 800) +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>` +
    `</linearGradient></defs><rect width='1200' height='800' fill='url(#g)'/></svg>`
  )
}

/**
 * Dark faces run lower chroma and often shift hue slightly: at low lightness a
 * given chroma reads as more saturated, and some hues (amber especially) turn
 * muddy rather than warm, so they lean somewhere that keeps the same feeling.
 *
 * The multipliers are tuned against a measurement rather than by eye — render
 * both faces, and compare mean chroma and lightness spread. Structure should
 * land near 1:1 (the pattern is equally present), while dark chroma should
 * measure ~0.65 of light to *feel* equal. At 1.2 the darks read neon; at 0.45
 * they read washed out. The neutral presets below sit higher because there's
 * barely any colour in them either way.
 * OKLCH hues, where ~250 is steel blue and ~200 would already be teal.
 */
export const PRESETS: Preset[] = [
  { id: 'mesh-indigo', label: 'Indigo mesh', light: { hue: 266, chroma: 1 }, dark: { hue: 266, chroma: 0.85 }, svg: mesh },
  { id: 'glow-teal', label: 'Teal glow', light: { hue: 195, chroma: 1 }, dark: { hue: 198, chroma: 0.72 }, svg: glow },
  { id: 'waves-rose', label: 'Rose waves', light: { hue: 352, chroma: 1 }, dark: { hue: 348, chroma: 0.7 }, svg: waves },
  { id: 'mesh-amber', label: 'Amber mesh', light: { hue: 72, chroma: 1 }, dark: { hue: 62, chroma: 0.85 }, svg: mesh },
  { id: 'graphite-steel', label: 'Graphite', light: { hue: 258, chroma: 1 }, dark: { hue: 258, chroma: 0.6 }, svg: graphite },
  { id: 'strata-slate', label: 'Strata', light: { hue: 250, chroma: 1 }, dark: { hue: 250, chroma: 0.6 }, svg: strata },
  { id: 'topo-steel', label: 'Topography', light: { hue: 245, chroma: 1 }, dark: { hue: 245, chroma: 0.6 }, svg: topography },
  { id: 'carbon-graphite', label: 'Carbon', tile: 8, light: { hue: 252, chroma: 1 }, dark: { hue: 252, chroma: 0.6 }, svg: carbon },
  { id: 'dots-slate', label: 'Dot grid', tile: 22, light: { hue: 258, chroma: 1 }, dark: { hue: 258, chroma: 0.6 }, svg: dots },
  { id: 'grid-blue', label: 'Blueprint', tile: 32, light: { hue: 232, chroma: 1 }, dark: { hue: 232, chroma: 0.55 }, svg: blueprint },
]

export const presetById = (id: string) => PRESETS.find(p => p.id === id)

export const faceOfPreset = (preset: Preset, dark: boolean) => (dark ? preset.dark : preset.light)

export const presetUrl = (preset: Preset, dark: boolean) =>
  `data:image/svg+xml,${encodeURIComponent(preset.svg(faceOfPreset(preset, dark), dark))}`
