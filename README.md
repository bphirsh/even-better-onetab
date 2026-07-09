# Even Better OneTab

Store and restore your browser tabs in one click — a cleaner, faster OneTab alternative for
Chrome and Brave.

This is a fork of [cnwangjie/better-onetab](https://github.com/cnwangjie/better-onetab)
(unmaintained since ~2020), rebuilt from the ground up and modernized. The original was
Vue 2 + Vuetify 1 + Webpack 4 on Manifest V2, which Chrome and Brave no longer support;
this rewrite is Svelte 5 + TypeScript + Vite on Manifest V3.

## What changed from the original

- **Manifest V3** — the persistent background page became a service worker, so the extension
  keeps working as browsers drop MV2.
- **Redesigned UI** — the 2018-era Material design was replaced with a cleaner card-based list
  page, refreshed color palette, and a proper light/dark theme that follows your system.
- **No tracking, no third parties** — Google Analytics, Sentry error reporting, and the
  original author's private sync server (long dead) are all removed, along with the Gitter and
  issue-tracker links. The only external service is the optional GitHub Gist sync **you** own.
- **New sync** — lists upload to a private gist shortly after every change and merge back on
  browser startup: newer edits win per list, and deletions propagate (tombstones) instead of
  resurrecting. The gist's revision history doubles as backup history.
- **Mobile access** — a static viewer page reads the gist so you can browse and open your saved
  tabs from a phone (extensions don't run on mobile browsers).
- **Tab groups survive** — stored tabs remember their tab group (name + color) and are
  re-grouped on restore.
- **Undo** — deleting a list or restore-and-remove shows an Undo toast; misclicks aren't fatal.
- **Copy as Markdown** — turn any list into `- [title](url)` lines for pasting into notes.
- **Configurable toolbar button** — clicking the extension icon can open the popup, store
  selected tabs, store all tabs, or open the list page.
- **~10× smaller** — the whole extension is ~120 KB of JS versus >1 MB for the original build.

Everything else you'd expect carried over: store all/selected/left/right tabs via popup,
context menu, or keyboard shortcuts; named, tagged, colored, pinned lists; drag-and-drop for
tabs and lists; search; JSON import/export. Data from an existing v1 install migrates
automatically on upgrade.

## Install (unpacked)

```sh
npm install
npm run build
```

Then in Brave/Chrome: `brave://extensions` → enable *Developer mode* → *Load unpacked* → select
the `dist/` folder.

## Sync setup

1. Open the extension's **Settings → Sync & mobile**.
2. [Create a GitHub token](https://github.com/settings/tokens/new?scopes=gist&description=Better+OneTab+Sync)
   with only the `gist` scope.
3. Paste it in and hit **Connect** — a private gist is created and your lists upload to it
   automatically from then on.

## Mobile viewer

`viewer/index.html` is a self-contained page — host it anywhere static (GitHub Pages, Netlify,
or just open the file) and enter the same token + gist id once. It stores them in the browser's
local storage and shows a read-only, phone-friendly view of your lists.

## Development

```sh
npm run dev     # rebuild on change
npm run check   # typecheck (svelte-check)
npm run build   # production build into dist/
```

Architecture, in short: `src/sw.ts` is the MV3 service worker — it owns all list mutations
(single writer, serialized queue) and the sync push (debounced via `chrome.alarms`). The popup
and the list page are small Svelte apps that send mutation messages and react to
`chrome.storage.onChanged`. Sync backends implement the two-method `SyncProvider` interface
(`src/core/sync/provider.ts`); GitHub Gist is the built-in one, and the merge logic lives in
`src/core/sync/merge.ts`.

## License

MIT — original extension © WangJie, this rewrite © Brian Hirsh.
