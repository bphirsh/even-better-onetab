# Better OneTab

Store and restore your browser tabs in one click — a cleaner, faster OneTab alternative for
Chrome and Brave.

This is a ground-up rewrite (v2) of [cnwangjie/better-onetab](https://github.com/cnwangjie/better-onetab):
Svelte 5 + TypeScript + Vite, Manifest V3, no analytics, no error tracking, no third-party
services except the optional GitHub Gist sync you control.

## Features

- **Store tabs** — all tabs, selected tabs, tabs to the left/right, or all windows, via the
  toolbar popup, right-click menu, or keyboard shortcuts.
- **Organize** — name lists, tag them, color them, pin them; drag tabs to reorder or move
  between lists; drag lists to reorder.
- **Search** across all stored tabs, filter by tag.
- **Sync & backup via GitHub Gist** — your lists upload to a private gist you own shortly after
  every change. The gist's revision history doubles as backup history.
- **Mobile viewer** — a single static page that reads the gist so you can browse and open your
  saved tabs from a phone.
- **Import/export** as JSON (same format as sync).
- Light/dark theme, follows the system by default.

Existing data from v1 (the original Better OneTab) is migrated automatically on upgrade.

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
`chrome.storage.onChanged`. Storage keys and list shape are kept compatible with v1.
Sync backends implement the two-method `SyncProvider` interface (`src/core/sync/provider.ts`);
GitHub Gist is the built-in one.

## License

MIT — original extension © WangJie, v2 rewrite © Brian Hirsh.
