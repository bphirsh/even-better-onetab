/**
 * The only file that touches the DOM outside this folder's own settings UI.
 *
 * Two rules keep the feature deletable:
 *   - the tint is written as inline custom properties on <html>, which beat
 *     theme.css by specificity, so removal is "stop writing them";
 *   - the image and its scrim are two layers of body's background-image, so
 *     there are no wrapper elements or stacking changes to unwind.
 */

import './background.css'
import { TINT_VARS, scrimColor, tintVars } from './color'
import { BG_KEY, DEFAULT_BG, DEFAULT_HUE, faceOf, getBg, normalize, type BgConfig } from './config'
import { faceOfPreset, presetById, presetUrl } from './presets'

const BACKGROUND_PROPS = ['background-image', 'background-size', 'background-repeat', 'background-position', 'background-attachment']

const isDark = () => document.documentElement.dataset.theme === 'dark'

export const applyBackground = (config: BgConfig) => {
  const html = document.documentElement
  const root = html.style
  const body = document.body.style
  const dark = isDark()

  const preset = config.kind === 'preset' ? presetById(config.presetId) : undefined
  const upload = config.kind === 'image' ? faceOf(config, dark) : null
  const hue = preset ? faceOfPreset(preset, dark).hue : (upload?.hue ?? DEFAULT_HUE)
  const url = preset ? presetUrl(preset, dark) : (upload?.image ?? '')

  for (const name of TINT_VARS) root.removeProperty(name)
  if (url && config.tint) {
    for (const [name, value] of Object.entries(tintVars(hue, dark))) root.setProperty(name, value)
  }

  if (!url) {
    for (const prop of BACKGROUND_PROPS) body.removeProperty(prop)
    delete html.dataset.bgActive
    return
  }

  // lets background.css rescue the text that sits directly on the page
  html.dataset.bgActive = ''

  // presets are already drawn at the right subtlety; only photos need washing out
  const scrim = scrimColor(dark, upload ? config.dim : 0)

  // layer 1 (the scrim) paints over layer 2 (the image)
  body.setProperty('background-image', `linear-gradient(${scrim}, ${scrim}), url("${url}")`)
  body.setProperty('background-size', preset?.tile ? `auto, ${preset.tile}px` : 'auto, cover')
  body.setProperty('background-repeat', preset?.tile ? 'no-repeat, repeat' : 'no-repeat, no-repeat')
  body.setProperty('background-position', 'center, center')
  body.setProperty('background-attachment', 'fixed, fixed')
}

let current: BgConfig = DEFAULT_BG

export const initBackground = async () => {
  const render = () => applyBackground(current)

  current = await getBg()
  render()

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[BG_KEY]) return
    current = normalize(changes[BG_KEY].newValue)
    render()
  })

  // the ramps differ per theme, and inline properties would otherwise pin the
  // light values in place when the user (or the OS) switches to dark
  new MutationObserver(render).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
}
