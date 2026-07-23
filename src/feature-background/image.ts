import { rgbToOklch } from './color'
import { DEFAULT_HUE } from './config'

/**
 * This lives in storage.local alongside the lists, and two faces are allowed, so
 * it's the one thing that could meaningfully eat the 10MB quota — the cap is kept
 * deliberately tight. A dimmed, behind-content background doesn't need a pristine
 * full-res photo: 2048px in WebP is sharp enough here and lands a few hundred KB,
 * not multiple MB. (WebP holds detail far better than JPEG per byte, and
 * Chrome/Brave are the only targets.)
 */
const MAX_WIDTH = 2048
const QUALITY = 0.86
/** Step quality down before storing something large; ~2× a typical photo at 2048px. */
const MAX_BYTES = 700_000

/**
 * A dedicated, tiny copy for the settings swatches. The full image can be 2880px;
 * decoding that just to paint a 52px preview is wasteful, and browsers downscale
 * a >50× ratio poorly. 200px on the long edge is retina-sharp at swatch size and
 * a few KB. Aspect is preserved — no crop — because we can't know where a photo's
 * subject sits, so the swatch's own `cover` does the framing (see BackgroundSection).
 */
const THUMB_MAX = 200
const THUMB_QUALITY = 0.85

const canvasOf = (source: ImageBitmap) => {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("That image couldn't be read.")
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0)
  return canvas
}

/**
 * The dominant *chromatic* hue, which is not the average color: averaging a
 * photo gives you mud. Near-greys and the extremes of the lightness range are
 * discarded, the survivors are binned by hue and weighted by how colorful they
 * are, and the winning bin's circular mean is the answer.
 */
const extractHue = (source: ImageBitmap) => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return DEFAULT_HUE
  ctx.drawImage(source, 0, 0, 64, 64)
  const { data } = ctx.getImageData(0, 0, 64, 64)

  const BINS = 36
  const weight = new Float64Array(BINS)
  const sin = new Float64Array(BINS)
  const cos = new Float64Array(BINS)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const { l, c, h } = rgbToOklch(data[i], data[i + 1], data[i + 2])
    if (c < 0.04 || l < 0.08 || l > 0.95) continue
    const bin = Math.floor((h % 360) / (360 / BINS)) % BINS
    const rad = (h * Math.PI) / 180
    weight[bin] += c
    sin[bin] += Math.sin(rad) * c
    cos[bin] += Math.cos(rad) * c
  }

  let best = -1
  for (let i = 0; i < BINS; i++) if (weight[i] > (weight[best] ?? 0)) best = i
  // a screenshot of a grey wall, or anything else with no real color in it
  if (best < 0 || weight[best] === 0) return DEFAULT_HUE
  return (Math.atan2(sin[best], cos[best]) * 180) / Math.PI + 360
}

/** Rough byte count of a base64 data URL, without materialising the bytes. */
const bytesOf = (dataUrl: string) => Math.floor((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)

const encode = (canvas: HTMLCanvasElement) => {
  for (const quality of [QUALITY, 0.78, 0.68]) {
    const url = canvas.toDataURL('image/webp', quality)
    // a browser without WebP hands back a PNG, which would be enormous
    if (!url.startsWith('data:image/webp')) return canvas.toDataURL('image/jpeg', 0.88)
    if (bytesOf(url) <= MAX_BYTES) return url
  }
  return canvas.toDataURL('image/webp', 0.6)
}

/** Draws a source into a canvas at a target size, aspect preserved. */
const scaledCanvas = (source: ImageBitmap, w: number, h: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("That image couldn't be read.")
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, w, h)
  return canvas
}

/** Downscales an upload, makes a preview thumbnail, and reads its hue. */
export const prepareImage = async (file: File) => {
  const probe = await createImageBitmap(file)
  const { width, height } = probe
  probe.close()

  const scale = Math.min(1, MAX_WIDTH / width)
  // resizeQuality beats drawing a full-size bitmap into a small canvas
  const bitmap =
    scale < 1
      ? await createImageBitmap(file, {
          resizeWidth: Math.round(width * scale),
          resizeHeight: Math.round(height * scale),
          resizeQuality: 'high',
        })
      : await createImageBitmap(file)

  try {
    const thumbScale = Math.min(1, THUMB_MAX / Math.max(bitmap.width, bitmap.height))
    const thumb = scaledCanvas(bitmap, Math.round(bitmap.width * thumbScale), Math.round(bitmap.height * thumbScale))
    return {
      dataUrl: encode(canvasOf(bitmap)),
      thumb: thumb.toDataURL('image/webp', THUMB_QUALITY),
      hue: extractHue(bitmap),
    }
  } finally {
    bitmap.close()
  }
}
