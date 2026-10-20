<!-- impeccable:product-schema 1 -->
# Mix Atlas

Platform: web

## Product truth
A music research workspace for DJs preparing transitions and discovering tracks through published DJ sets. Search any collected track, producer, DJ or set. Inspect the full documented set and the selected occurrence, see what was played before and after, follow the source recording, and compare exact versions across sources. The product has no starting artist, fixed DJ allowlist or implicit producer focus. The current collection reflects historical research and does not imply comprehensive coverage of an artist or genre.

## Evidence and boundaries
Preserve published identities, stable provider IDs, exact versions, original source URLs and aliases, position gaps, overlays, performer sections and separate performance/publication dates. Unidentified tracks, missing positions and section boundaries do not create inferred transitions. Joint sets retain collective credit. Counts describe collected source tracklists; published ordering does not reveal BPM, key or mixing settings. Methodology and coverage remain discoverable in disclosures.

## Identity and workspace
Use the incumbent minimal DM Sans interface with white/ink light mode and neutral charcoal dark mode. The header contains the Mix Atlas wordmark, compact appearance toggle, language flag and Tools. All / Tracks / DJs / Sets filter the same collection and search. Do not introduce producer-specific selectors, task screens, onboarding, explanatory banners or decorative cards.

Every result uses the same detail renderer: published title/artist, documented performer/source selectors, complete ordered tracklist, selected occurrence highlighted and centered, copy, listening and provenance. Track navigation retains the current source when possible. Graphs and comparison expand inline; imports use the existing native dialog. Mobile results and detail are panes of the same explorer. URLs retain query, type, exact track and source occurrence. Old links remain readable; arbitrary Unicode artist names require no code changes. Comparison defaults are recent distinct sources, with an explicitly opened set retained.

## Data and portability
Static HTML/CSS/ES modules on GitHub Pages, with no server or API keys. Canonical source data is dist/dataset.json; a tiny generated loader fetches it once with a content version. Do not duplicate the collection as executable JavaScript. Preserve source/collection extension metadata through validation and export.

Offer CSV import/export and a CSV template for spreadsheet editing, plus JSON backups for the complete nested collection. Browser and publishing tools share one parser and validator. CSV retains IDs, layers, performer lists, boundaries, recordings and provenance; rich extensions use documented metadata cells. Reimports replace a source by URL without inflating counts. Imports stay in the visitor’s browser until explicitly published through the repository. Artist aliases are optional collection data, never hard-coded into discovery. Provider-specific track IDs use explicit namespaces. Keep the existing practical collection-size limits discoverable in the format documentation.

Read legacy browser collection/language storage keys without deleting them; write new preferences with Mix Atlas names. Refresh bundled sources while retaining personal additions and aliases. Show a localized loading/retry state if the collection cannot be fetched.

## Languages and appearance
English is the default, with French and Korean choices remembered independently of music data. Keep published music names unchanged; localize controls, errors, statuses and dates. Language switching retains the active pane, query, source, graph and comparison. Appearance follows the device until explicitly toggled and is resolved before paint; switching preserves focus and music state.

## Verification
Use fixtures with no Olander content to check arbitrary DJs, aliases, routes and comparison defaults. Verify CSV round trips against the full bundled collection, invalid-input handling without writes, preservation of untouched sources and storage migration. Check desktop/mobile layout, keyboard/focus, contrast, overflow and existing reduced-motion rules. Run preparation, data/browser tests and the matching public deployment before reporting publication. State physical-device or assistive-technology checks that were not run.
