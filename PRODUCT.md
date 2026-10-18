<!-- impeccable:product-schema 1 -->
# Mix Atlas

Platform: web

## Product truth
A browser-based music research workspace for a DJ preparing transitions and discovering music through published DJ tracklists. Start with Jeremy Olander, expand through the tracks he and other DJs play. Mattheis and Fahlberg are also available.

The user explicitly wants all three jobs available together: (1) find a track and inspect what comes before and after, (2) find DJs playing the selected DJ's productions, and (3) discover other artists' tracks in that DJ's selections. Do not gate these behind onboarding or pick a single job at the expense of the others.

## Evidence and boundaries
Use the existing collected dataset. Track versions remain distinct. Unidentified tracks, missing positions, section boundaries and overlays never create inferred transitions. Joint sets do not prove an individual DJ chose a track. Counts describe collected source tracklists, not worldwide popularity or distinct physical performances. Listening links open the source recording; published ordering does not reveal BPM, key, mix settings or fades. Source coverage and incomplete identifications must remain discoverable.

## Existing implementation and identity
Static vanilla HTML, CSS and ES modules in dist/. Preserve local browser imports and exports. English is the default UI language, with French and Korean choices remembered per browser. The user explicitly rejected the previous dark green/lime interface as horrible, cluttered and too wordy on 18 October 2026. Replace its visual identity with white, black and neutral grey, one DM Sans family and much less visible copy. The former green palette is an anti-reference, not a brand constraint. No new component framework is needed.

## UX contract for this revision
One explorer, one search and one detail renderer. The user explicitly requested unifying the screens because the separate destinations were confusing. Remove the navigation rail and the separate Transitions, Qui le joue, Ses sélections and Collection pages. A quiet header keeps only the wordmark, language flag button and Tools. DJs are found through the shared search; do not restore the redundant starting-DJ dropdown. Search defaults to all collected music, DJs and sets across the entire dataset; All / Tracks / DJs / Sets filter the same result list. Tracks, DJs and Sets filter the same global collection. Do not show producer-specific production, selection, support or shared-repertoire dropdowns. Preserve the current neutral palette and DM Sans.

Every result opens the same track-centered panel: artist, documented DJ and source-set selectors, full collected tracklist, selected occurrence centered and highlighted, copy, listening and provenance. Clicking an identified track follows it in this same workspace and keeps the current set. Recentrer restores the exact occurrence. The graph expands inline below the tracklist. Comparing sets also opens inline and reuses the same full-tracklist component; imports retain their focused form dialog. Recordings without tracklists are explicit empty states in the same panel.

Keep source methodology, scope notes and advanced filters in disclosures. Preserve versions, IDs, overlays, position gaps and performer boundaries. On mobile, results and detail are two panes of the same explorer with a Results return. Search, filters, starting DJ and exact source occurrence are represented in the URL. Old links resolve to the equivalent filters of #explorer. Browser Back restores them. Preserve browser imports/exports and the independent Mattheis/Fahlberg collections.

## Success and verification
A user can find a DJ supporting Jeremy, choose a different documented passage, inspect its sequence and open its source. They can filter to external selections and expand transitions without leaving the workspace. All existing imports, comparisons and full tracklists remain available. Check desktop and 390px mobile layouts, keyboard interaction, contrast, overflow, reduced motion and core data tests before private deployment to the existing site.

## Language support
English is the explicit default; do not automatically select a language from the browser locale. A native, labeled language flag button offers English, Français and 한국어. Persist this preference separately from music data. Localize labels, accessible names, tooltips, statuses, empty/error states, import/export tools, source notes authored by this app, comparison, dates and counts. Preserve published artist/track identities and source URLs. Locale switching preserves the search, filters, exact source occurrence, open graph and comparison selection. Set the document lang attribute and use native Hangul font fallbacks.
