# feature-background

Optional, self-contained: a custom page background (built-in SVG presets or an
uploaded image) plus a palette tint derived from it.

## To remove the whole feature

1. `rm -rf src/feature-background`
2. Delete the two marked integration points (grep for `feature-background`):
   - `src/app/main.ts` — one side-effect import
   - `src/app/SettingsPage.svelte` — one import + one `<BackgroundSection />` tag
3. Optionally clear the stale `bgConfig` key from `chrome.storage.local`.

Nothing else in the codebase references this folder, and no existing file was
modified beyond those two integration points.

## Why it's removable by construction

- **`src/ui/theme.css` is never edited.** The tint sets inline custom properties
  on `<html>`, which beat theme.css by specificity. Stop setting them and the
  original palette is back — there is nothing to revert.
- **No new DOM.** The image and its scrim are two layers of `body`'s
  `background-image`, set from JS. No wrapper elements, no z-index changes.
- **Nothing enters `Options`.** The config lives under its own
  `chrome.storage.local` key, so it never reaches `buildSnapshot` and never gets
  pushed to the gist (a base64 image in the sync payload would be megabytes on
  every settings change, and the mobile viewer downloads that same gist).

## Consequence worth knowing

Because the config is deliberately outside `opts`, the background does **not**
sync across devices. That's intentional — it's a per-machine preference, not
data — and the settings UI says so.

## Layout

| file | role |
| --- | --- |
| `color.ts` | OKLCH↔sRGB math and the tinted palette ramps |
| `presets.ts` | built-in backgrounds, generated as SVG from a hue |
| `image.ts` | downscale an upload, extract its dominant hue |
| `config.ts` | the storage key, shape, defaults, and per-face uploads |
| `apply.ts` | writes to the DOM; re-runs on theme/config change |
| `background.css` | halo for the h1/h2 that sit on the page, not on a card |
| `boot.ts` | the single side-effect entry point |
| `BackgroundSection.svelte` | the settings UI |

`background.css` is the one place this folder styles markup it doesn't own. It's
scoped to `:root[data-bg-active]`, which only `apply.ts` sets, and it's imported
from within this folder — so it still leaves with `rm -rf`.

`BackgroundSection.svelte` re-declares the few settings styles it needs
(`.card`, `.row`, …) rather than relying on `SettingsPage.svelte`, whose CSS is
component-scoped. That duplication is the price of the folder being deletable in
one command, which is the point.
