/**
 * Deliberately outside `Options`: this key never reaches `buildSnapshot`, so an
 * uploaded image can't end up base64'd into the sync gist (which the mobile
 * viewer also downloads). The cost is that the background doesn't follow you
 * between devices — see this folder's README.
 */

export const BG_KEY = 'bgConfig'

export type Slot = 'light' | 'dark'

export interface Upload {
  /** Full-size data URL, painted as the actual background. */
  image: string
  /** Tiny data URL for the settings swatches. Absent on pre-thumbnail uploads. */
  thumb?: string
  /** Extracted from the image; drives the tint while this face is showing. */
  hue: number
}

/** The swatch source: the thumbnail if present, else the full image. */
export const thumbOf = (upload: Upload) => upload.thumb ?? upload.image

export interface BgConfig {
  kind: 'none' | 'preset' | 'image'
  presetId: string
  /** Separate uploads per face; either may stand in for the other. */
  light: Upload | null
  dark: Upload | null
  tint: boolean
  /** How far an uploaded photo is washed toward the page background, 0..0.8. */
  dim: number
}

export const DEFAULT_HUE = 266

export const DEFAULT_BG: BgConfig = {
  kind: 'none',
  presetId: '',
  light: null,
  dark: null,
  tint: true,
  dim: 0.4,
}

/**
 * One upload covers both faces until a second is added, so uploading a single
 * image on a fixed theme still works if you later switch to System.
 */
export const faceOf = (config: BgConfig, dark: boolean): Upload | null =>
  (dark ? config.dark : config.light) ?? config.light ?? config.dark ?? null

/** Reshapes the pre-split `{ image, hue }` config into per-face uploads. */
const migrate = (stored: Record<string, unknown>): Partial<BgConfig> => {
  if (!stored || typeof stored.image !== 'string' || !stored.image) return stored as Partial<BgConfig>
  const { image, hue, ...rest } = stored
  const upload: Upload = { image, hue: typeof hue === 'number' ? hue : DEFAULT_HUE }
  return { ...(rest as Partial<BgConfig>), light: upload, dark: upload }
}

/**
 * The single way a stored value becomes a config. Every reader goes through it —
 * the initial load *and* both storage.onChanged listeners — so a pre-split value
 * can't sneak in through the side door and land as a background with no image.
 */
export const normalize = (raw: unknown): BgConfig => ({
  ...DEFAULT_BG,
  ...migrate((raw ?? {}) as Record<string, unknown>),
})

export const getBg = async (): Promise<BgConfig> => normalize((await chrome.storage.local.get(BG_KEY))[BG_KEY])

export const setBg = (config: BgConfig) => chrome.storage.local.set({ [BG_KEY]: config })
