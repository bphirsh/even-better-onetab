<script lang="ts">
  import { t } from '../i18n/i18n.svelte'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { toast } from '../ui/toast.svelte'
  import { BG_KEY, DEFAULT_BG, faceOf, getBg, normalize, setBg, thumbOf, type BgConfig, type Slot } from './config'
  import { prepareImage } from './image'
  import { PRESETS, presetUrl, type Preset } from './presets'

  let config = $state<BgConfig>({ ...DEFAULT_BG })
  let dark = $state(document.documentElement.dataset.theme === 'dark')
  let busy = $state(false)
  let error = $state('')
  let pickerSlot: Slot = 'light'
  let fileInput: HTMLInputElement

  /** On System, a preset has two faces — show both so that's discoverable. */
  const split = $derived(app.opts.theme === 'auto')
  /**
   * Faces to manage. Always both on System; on a fixed theme, the active face plus
   * any face that already holds an upload — so switching theme can never hide an
   * image you've added, only ever reveal an extra empty slot.
   */
  const slots = $derived.by<Slot[]>(() => {
    if (split) return ['light', 'dark']
    const keep = new Set<Slot>([dark ? 'dark' : 'light'])
    if (config.light) keep.add('light')
    if (config.dark) keep.add('dark')
    return (['light', 'dark'] as Slot[]).filter(f => keep.has(f))
  })
  /** Split the custom swatch whenever there are two distinct uploads (or on System). */
  const showBothFaces = $derived(split || Boolean(config.light && config.dark))

  const hasImage = $derived(Boolean(config.light || config.dark))
  /** Swatch preview: the thumbnail, falling back across faces so one upload shows on both halves. */
  const faceImage = (night: boolean) => {
    const face = faceOf(config, night)
    return face ? thumbOf(face) : ''
  }
  const slotImage = (slot: Slot) => {
    const face = config[slot]
    return face ? thumbOf(face) : ''
  }

  $effect(() => {
    getBg().then(stored => (config = stored))

    // storage is the source of truth, not this component: with the list page
    // open twice, a change in one should show up in the other's swatches
    const onStored = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[BG_KEY]) config = normalize(changes[BG_KEY].newValue)
    }
    chrome.storage.onChanged.addListener(onStored)

    // swatch previews are drawn per theme, so they need to follow it
    const observer = new MutationObserver(() => (dark = document.documentElement.dataset.theme === 'dark'))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      chrome.storage.onChanged.removeListener(onStored)
      observer.disconnect()
    }
  })

  const save = (patch: Partial<BgConfig>) => {
    config = { ...config, ...patch }
    setBg($state.snapshot(config))
  }

  // Switching what's *shown* never throws away an upload — only the × does, so
  // you can flick between None, a preset and your photo without losing it.
  const clear = () => save({ kind: 'none' })
  const pickPreset = (preset: Preset) => save({ kind: 'preset', presetId: preset.id })

  const openPicker = (slot: Slot) => {
    pickerSlot = slot
    fileInput.click()
  }

  // Custom behaves like any other swatch: pick it to show it. Managing the two
  // faces happens in its own row below, so the grid stays one-box-one-choice.
  const onCustomClick = () => {
    if (!hasImage) return openPicker(slots[0])
    save({ kind: 'image' })
  }

  /** The only destructive action in here, so it's the only one that needs undo. */
  const removeUpload = (slot: Slot) => {
    const previous = $state.snapshot(config) as BgConfig
    const next: BgConfig = {
      ...previous,
      light: slot === 'light' ? null : previous.light,
      dark: slot === 'dark' ? null : previous.dark,
    }
    if (!next.light && !next.dark) next.kind = 'none'
    config = next
    setBg(next)
    toast(t('bg.imageRemoved'), 'info', {
      label: t('bg.undo'),
      fn: () => {
        config = previous
        setBg(previous)
      },
    })
  }

  const sizeFor = (preset: Preset) => (preset.tile ? `${preset.tile}px` : 'cover')

  const faceLabel = (slot: Slot) => t(slot === 'light' ? 'bg.faceLight' : 'bg.faceDark')
  const faceLower = (slot: Slot) => t(slot === 'light' ? 'bg.faceLightLower' : 'bg.faceDarkLower')

  const onFile = async (e: Event & { currentTarget: HTMLInputElement }) => {
    const input = e.currentTarget
    const file = input.files?.[0]
    const slot = pickerSlot
    if (!file) return
    busy = true
    error = ''
    try {
      const { dataUrl, thumb, hue } = await prepareImage(file)
      const upload = { image: dataUrl, thumb, hue }
      save({ kind: 'image', [slot]: upload })
    } catch (err) {
      error = err instanceof Error ? err.message : t('bg.imageError')
    } finally {
      busy = false
      input.value = '' // so re-picking the same file still fires a change
    }
  }
</script>

<section>
  <h2>{t('bg.heading')}</h2>
  <div class="card">
    <div class="row stack">
      <div class="text">
        <div class="label">{t('bg.pageBackground')}</div>
        <div class="desc">
          {#if split}{t('bg.descSplit')}{:else}{t('bg.descDevice')}{/if}
        </div>
      </div>
      <div class="swatches">
        <button class="swatch none" class:active={config.kind === 'none'} title={t('bg.noBackground')} aria-label={t('bg.noBackground')} onclick={clear}>
          <Icon name="x" size={13} />
        </button>

        {#each PRESETS as preset (preset.id)}
          <button
            class="swatch"
            class:active={config.kind === 'preset' && config.presetId === preset.id}
            title={preset.label}
            aria-label={preset.label}
            onclick={() => pickPreset(preset)}
          >
            <span
              class="fill"
              class:night={!split && dark}
              style:background-image={`url("${presetUrl(preset, split ? false : dark)}")`}
              style:background-size={sizeFor(preset)}
            ></span>
            {#if split}
              <span class="fill night half" style:background-image={`url("${presetUrl(preset, true)}")`} style:background-size={sizeFor(preset)}></span>
              <span class="seam"></span>
            {/if}
          </button>
        {/each}

        <button
          class="swatch"
          class:empty={!hasImage}
          class:active={config.kind === 'image'}
          title={hasImage ? t('bg.yourImage') : t('bg.useOwnImage')}
          aria-label={hasImage ? t('bg.yourImage') : t('bg.useOwnImage')}
          disabled={busy}
          onclick={onCustomClick}
        >
          {#if hasImage}
            <span class="fill" class:night={!showBothFaces && dark} style:background-image={`url("${faceImage(showBothFaces ? false : dark)}")`}></span>
            {#if showBothFaces}
              <span class="fill night half" style:background-image={`url("${faceImage(true)}")`}></span>
              <span class="seam"></span>
            {/if}
          {:else}
            <Icon name="upload" size={13} />
          {/if}
        </button>

        <input class="file" type="file" accept="image/*" bind:this={fileInput} onchange={onFile} />
      </div>
    </div>

    {#if config.kind === 'image' && hasImage}
      <div class="row">
        <div class="text">
          <div class="label">{t('bg.yourImages')}</div>
          <div class="desc">
            {#if split}{t('bg.imagesDescSplit')}{:else}{t('bg.imagesDescReplace')}{/if}
          </div>
        </div>
        <div class="slots">
          {#each slots as slot (slot)}
            <span class="slot">
              <button
                class="swatch"
                class:empty={!config[slot]}
                title={config[slot] ? t('bg.clickToReplace') : t('bg.chooseImage', { face: faceLower(slot) })}
                aria-label={config[slot] ? t('bg.replaceImage', { face: faceLower(slot) }) : t('bg.chooseImage', { face: faceLower(slot) })}
                disabled={busy}
                onclick={() => openPicker(slot)}
              >
                {#if config[slot]}
                  <span class="fill" style:background-image={`url("${slotImage(slot)}")`}></span>
                {:else}
                  <Icon name="upload" size={12} />
                {/if}
              </button>
              {#if config[slot]}
                <button class="badge" title={t('bg.removeImage')} aria-label={t('bg.removeImageFace', { face: faceLower(slot) })} onclick={() => removeUpload(slot)}>
                  <Icon name="x" size={9} />
                </button>
              {/if}
              {#if slots.length > 1}
                <span class="slot-label">{faceLabel(slot)}</span>
              {/if}
            </span>
          {/each}
        </div>
      </div>
    {/if}

    {#if error}
      <div class="row"><div class="error">{error}</div></div>
    {/if}

    {#if config.kind !== 'none'}
      <label class="row">
        <div class="text">
          <div class="label">{t('bg.tintLabel')}</div>
          <div class="desc">{t('bg.tintDesc')}</div>
        </div>
        <input type="checkbox" class="switch" checked={config.tint} onchange={e => save({ tint: e.currentTarget.checked })} />
      </label>
    {/if}

    {#if config.kind === 'image'}
      <div class="row">
        <div class="text">
          <div class="label">{t('bg.fadeLabel')}</div>
          <div class="desc">{t('bg.fadeDesc')}</div>
        </div>
        <input
          type="range"
          min="0"
          max="0.8"
          step="0.05"
          value={config.dim}
          oninput={e => save({ dim: Number(e.currentTarget.value) })}
        />
      </div>
    {/if}
  </div>
</section>

<style>
  /* SettingsPage's styles are component-scoped, so the few shared shapes are
     restated here — the trade for this folder being deletable in one command */
  section {
    margin-bottom: 26px;
  }

  h2 {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
    margin: 0 0 8px 2px;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 4px 16px;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }

  .row:last-child {
    border-bottom: none;
  }

  .row.stack {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .text {
    min-width: 0;
  }

  .label {
    font-weight: 500;
  }

  .desc {
    font-size: 12.5px;
    color: var(--text-2);
    margin-top: 2px;
  }

  .error {
    font-size: 12.5px;
    color: var(--danger);
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;
  }

  .swatch {
    position: relative;
    overflow: hidden;
    width: 52px;
    height: 38px;
    padding: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background-color: var(--surface-2);
    background-position: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
    transition: border-color 0.12s ease, transform 0.12s ease;
  }

  .swatch:hover {
    transform: translateY(-1px);
    border-color: var(--text-3);
  }

  .swatch.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }

  /* dashed only while there's nothing in it to show */
  .swatch.empty {
    border-style: dashed;
  }

  .swatch:disabled {
    opacity: 0.5;
  }

  .fill {
    position: absolute;
    inset: 0;
    background-position: center;
    /* presets override this inline; uploads want cover */
    background-size: cover;
  }

  /* the dark face takes the right-hand side, on a slight lean */
  .fill.half {
    clip-path: polygon(56% 0, 100% 0, 100% 100%, 44% 100%);
  }

  /*
   * Preview-only lift for whichever fill is showing a dark face.
   *
   * Measured, the dark faces already carry more structure than the light ones at
   * this size (0.041 vs 0.038 lightness spread) — the problem isn't the pixels,
   * it's that the same range sitting at L≈0.23 inside a 26px sliver on a white
   * card reads as a black rectangle, while the light faces get it at L≈0.93
   * where the eye picks it up for free. So this over-corrects on purpose:
   * lightness 0.23→0.34 (still unmistakably dark next to 0.93), structure 0.041→0.083,
   * and the saturate is what lets indigo/teal/rose/amber tell each other apart.
   *
   * It only ever touches the swatch, never the real background.
   */
  .fill.night {
    filter: brightness(2.1) saturate(1.6);
  }

  .seam {
    position: absolute;
    top: -25%;
    bottom: -25%;
    left: 50%;
    width: 1px;
    background: var(--border);
    transform: rotate(9deg);
  }

  .slots {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-shrink: 0;
  }

  .slot {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }

  .slot-label {
    font-size: 10px;
    line-height: 1;
    color: var(--text-3);
  }

  .badge {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: var(--text);
    color: var(--surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow);
  }

  .badge:hover {
    background: var(--danger);
    color: #fff;
  }

  .file {
    display: none;
  }

  input[type='range'] {
    width: 140px;
    accent-color: var(--accent);
    flex-shrink: 0;
  }

  /* mirrors the toggle in SettingsPage */
  .switch {
    appearance: none;
    width: 36px;
    height: 21px;
    border-radius: 999px;
    background: var(--border);
    position: relative;
    cursor: pointer;
    transition: background 0.15s ease;
    flex-shrink: 0;
    margin: 0;
  }

  .switch::after {
    content: '';
    position: absolute;
    top: 2.5px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.15s ease;
  }

  .switch:checked {
    background: var(--accent);
  }

  .switch:checked::after {
    transform: translateX(14px);
  }
</style>
