# Translation context — Even Better OneTab

Even Better OneTab is a browser extension (Chrome/Brave) that saves your open tabs into named lists and restores them later — a cleaner OneTab alternative. Use this guide to translate `catalog/en.ts` accurately: it tells you **what each string is, where it appears, and how it's used**, so you can pick the right word, gender, verb form, and length.

## Global rules

- **Register/tone:** friendly, concise consumer-software tone. Match the conventions your language's own Chrome/OS UI uses (e.g. how Chrome localizes "Settings", "Tab", "Window", "Sync", "Pinned", "Undo", "Import/Export"). When in doubt, prefer the term the browser itself uses in your language.
- **Never translate the brand** "Even Better OneTab" — keep it verbatim.
- **Keep every `{placeholder}` exactly** (same name, same braces). You may reorder them within a sentence as grammar requires. `{n}` is a number, `{time}`/`{when}`/`{ago}` are relative-time strings, `{title}`/`{list}`/`{url}`/`{label}`/`{face}`/`{version}` are values inserted at runtime.
- **Keep literal/technical tokens untranslated:** `about:` `chrome:` `file:` `ghp_…` `github_pat_…` `gist.github.com` `GitHub` `Gist` `JSON` `Markdown` `URL`, keyboard keys `⌘` `Ctrl`, and the symbols `×` `❤️` `☕` `→`. "NYC" stays "NYC".
- **Preserve leading/trailing spaces** in the `sync.introBefore/After`, `sync.step1Before/After`, `sync.autoDesc*`, `sync.mobileDesc*` values — those sentences are assembled around inline links, and the spaces glue the pieces. Copy them exactly.
- **Length:** buttons, menu items, options, and tooltips must stay short (they sit in tight UI). Descriptions can be a full sentence.
- **Punctuation:** keep the ellipsis `…` on buttons that open something (e.g. "Set shortcuts…"), and keep em-dashes `—` where they appear.

## Plural forms

Values written as objects like `{ one: '…', other: '…' }` are **count-dependent**. Provide the plural categories your language uses (CLDR):
- **Spanish, French:** `one` and `other`.
- **Russian:** `one`, `few`, `many`, and `other` (e.g. 1 таб / 2–4 таба / 5+ табов). Provide all four.
- **Chinese (both):** only `other` (no grammatical plural). Provide just `{ other: '…' }`.

Each plural value still contains `{n}`.

## Per-surface / per-key notes

**nav.\*** — icon buttons in the top toolbar; these are tooltips / accessibility labels / a placeholder.
- `nav.search` tooltip on the 🔍 button that opens tab search. `nav.searchPlaceholder` placeholder in that search field ("tabs" = browser tabs). `nav.clearSearch` clears the field. `nav.history` tooltip opening the "recently deleted" page. `nav.settings` tooltip opening Settings.

**lists.empty.\*** — shown on the main page when nothing is saved yet.
- `title` heading. `lead` intro sentence ("collapse open tabs into a tidy saved list"). `toolbarLabel/rightClickLabel/keyboardLabel` are short badges naming three ways to save (the browser Toolbar, Right-click menu, Keyboard). The matching `toolbar/rightClick/keyboard` are one-line instructions. `lists.noMatch` shows when a search matches nothing.

**status.\*** — the tiny pill bottom-right. `status.lists` = number of saved lists, `status.tabs` = number of saved tabs.

**sync.statusError / statusSynced / statusOn** — sync state shown in that pill. `statusSynced` = "Synced {time}" ({time} like "5 min ago").

**time.\*** — relative timestamps. `justNow` (<1 min). `minAgo`/`hourAgo` use abbreviated units ("min", "h") — keep them short. `yesterday` = 1 day. `dayAgo` = N days.

**card.\*** — a saved list shown as a card.
- `dragToReorder` aria on the drag handle. `expandCollapse` aria toggling the tabs view. `titlePlaceholder` placeholder when renaming a list. `clickToRename` hint on an untitled list. `untitled` shown when a list has no name. `pinned` badge. `tabCount` "{n} tabs" in the header. `openAllTitle` tooltip; `open` is the **button** that opens all tabs (verb, imperative, very short). `pinList/unpinList/deleteList` tooltips. `more` aria on the ⋯ menu. Menu items: `openInNewWindow`, `openAndRemove` (open the list then delete it — "&" = "and"), `pin`/`unpin`, `editTags`, `copyAsMarkdown` (copy the list as Markdown text), `noColor` (clear the color label). `tagsPlaceholder` placeholder for comma-separated tags. `undo` = the Undo button in a toast (imperative). `toast*` are confirmation messages.

**tab.\*** — one saved tab row. `group` tooltip "Tab group: {title}" (it belonged to a browser tab group named {title}); `unnamed` is substituted for {title} when the group had no name. `wasPinned` tooltip (was a pinned browser tab). `remove` tooltip/aria = remove this tab from the list.

**history.\*** — the "Recently Deleted" page.
- `heading` page title. Buttons: `deleteAll` (permanently clear everything), `undo`, `recoverList`, `recoverTab`, `deletePermanently`. `expandCollapse` aria. `empty.immediately` shows when retention is off and references the Settings option **"Deleted lists are"** — translate that quoted phrase identically to `settings.opening.trashRetention.label`. `empty.default` normal empty state. `retention.*` a small note stating how long items are kept. `toast.*` confirmations. `tabTooltip` = "{url} — from "{list}", deleted {when}". `seeAll` = "See all ({n})" button that expands a truncated list.

**popup.\*** — the small popup from the toolbar icon. `storeAll`/`storeSelected` buttons. `recentLists` section label. `restoreList` tooltip. `empty` text. `openApp` button opening the full app (keep the brand). `tabCount` plural.

**bg.\*** — the "Background" settings section (custom page backgrounds).
- `heading` section header. `pageBackground` row label. `descSplit`/`descDevice` explain that backgrounds have a light+dark face and stay on this device (not synced). `noBackground` tooltip for the "none" swatch. `yourImage`/`useOwnImage` tooltip on the upload swatch. `yourImages` label for the manage row. `imagesDescSplit`/`imagesDescReplace` descriptions. `clickToReplace` tooltip. `chooseImage`/`replaceImage`/`removeImageFace` tooltips containing `{face}` (which will be the **lowercase** word "light" or "dark" — from `faceLightLower`/`faceDarkLower`). `removeImage` tooltip. `faceLight`/`faceDark` = "Light"/"Dark" theme faces, capitalized (shown as small labels); `faceLightLower`/`faceDarkLower` are the lowercase forms used inside sentences. `tintLabel`/`tintDesc` = toggle to tint the UI to match the image's color. `fadeLabel`/`fadeDesc` = slider to fade/dim the image. `imageError` error, `imageRemoved` toast, `undo` button.

**settings.language.\*** — `label` "Language"; `auto` = follow the browser's language. **Keep `settings.language.auto` concise — max ~24 characters** (e.g. "Auto (navegador)"), because the dropdown has a fixed width.

**shortcuts.\*** — the Keyboard shortcuts section. `title` header. `intro` description. `notSet` "{n} shortcuts not set" (plural). `set` button "Set shortcuts…" (opens the browser's shortcut page — keep the ellipsis). `shortcuts.cmd.*` are the five command names; match your browser's wording for "Store"/"tabs"/"window"/"list".

**settings.\*** — the Settings page. `title` page title. Each `*.heading` is a section header. Each row has a `.label` and often a `.desc` (one-sentence explanation) plus `<select>` `.option` values:
- `appearance.theme` (System/Light/Dark — "System" = follow OS). `density` (list spacing: Compact/Comfortable). `pinnedPosition` (where pinned lists sit). `tabDisplay` (Title and domain / Title only / URL only). `hideFavicon`. `listActions`/`tabRemove` (when action buttons / the tab "×" appear) share the options `showOnHover`/`alwaysShow`.
- `storing.*`: `openListPage` (when saving opens the list page), and toggles `ignorePinned`, `excludeIllegalURL` (skip about:/chrome:/file: pages), `removeDuplicate`, `pinGroupList` (auto-pin lists made from tab groups).
- `opening.*`: `itemClick` (what clicking one saved tab does), `openList` (what opening a whole list does), `focusOpenedTab` (switch to the opened tab or leave it in the background), `restorePosition` (where restored tabs open), `trashRetention` (how long deleted lists are kept — options Removed immediately / Kept for 1 day / 1 week / 1 month).
- `toolbar.*`: `browserAction` (what clicking the toolbar icon does), `pageContext`/`allContext` (right-click menu options).
- `footer.madeWith` "Made with ❤️ in NYC" (keep ❤️, NYC). `footer.coffee` "☕ Buy me a coffee" (a donation button). `footer.version` = "Even Better OneTab v{version}" (keep brand + {version}). `footer.privacy` a link to the privacy policy.

**sync.\*** — the "Sync & mobile" section. Optional sync stores your lists in your own private GitHub Gist and lets a phone read them. The `*Before/*Link/*After` triples are ONE sentence each, split around a clickable link — translate them so that, concatenated in order, they read naturally, and keep the boundary spaces. `connect`/`syncNow`/`mergeFromGist`/`disconnect` are buttons. `*Toast` are confirmations; `mergedToast` plural. `disconnectConfirm` is a confirmation dialog. `copiedToast` = "{label} copied" where {label} is `tokenName` ("Token") or `gistIdName` ("Gist id"). `lastSynced` = "Last synced {ago} ({time})".

**backup.\*** — the "Backup" section. Export/import lists as a JSON file. `merge`/`replace` are the two import modes (buttons). `replaceConfirm` warns before replacing all lists (plural). `importedToast` plural. `couldNotRead`/`noListsFound` errors.

## Manifest strings (`_locales/<lang>/messages.json`)

Also translate six store/manifest strings:
- `appDesc` — the extension's store description (one punchy sentence; keep "OneTab" as it's a category reference, keep the brand tone). English: "Store and restore your tabs in one click — a fast, private OneTab alternative with sync and a mobile viewer."
- `cmdStoreSelected` "Store selected tabs", `cmdStoreAll` "Store all tabs in this window", `cmdStoreAllWindows` "Store all tabs in all windows", `cmdRestoreLatest` "Restore the most recent list", `cmdOpenLists` "Open the tab list page" — these are keyboard-command descriptions; match `shortcuts.cmd.*`.
