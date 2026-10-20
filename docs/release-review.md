# First public release review

Reviewed on 18 October 2026. This document records the local review before the first public commit. Live deployment results are recorded in the repository’s GitHub Actions runs.

## Findings resolved

| Severity | Finding | Resolution |
| --- | --- | --- |
| P1 | Removing the header DJ picker left independent collections hidden from the main search. | All searches the entire committed dataset:386 sets, all identified tracks, recordings and credited DJ groups. Mattheis is reachable without another selector. Focused production/support filters retain their existing scope. |
| P1 | Dataset updates depended on an external workspace script and could leave browser assets stale. | Self-contained preparation and import commands regenerate the seed and dependent asset versions. GitHub does this automatically from the committed JSON before deployment. |
| P2 | Global DJ results could create thousands of repetitive passage options and excessive track chips. | One passage per credited source set, original performer boundaries preserved, full tracklist available to explore. Existing normalized DJ link identities are retained. |
| P2 | Relative filters referred to “his” without showing the DJ after the header selector disappeared. | Filter options name the contextual DJ in English, French and Korean. Controls that do not apply to All are hidden. |
| P2 | Public release could accidentally include internal hosting metadata or development history. | Export excludes .openai, .impeccable, .git, browser snapshots, credentials, caches and local imports. Fresh GitHub history can start with this folder. |
| P2 | Public setup and future updates were undocumented. | English README, a checked GitHub Pages workflow and a validated setlist merge command are included. |

## Verification

- 51 JavaScript tests and3 Python tests pass. New regression coverage checks global collection access, collective attribution, stable DJ identities, one passage per source, stale asset detection, valid source updates, deduplication and rejection of unsafe imports without writes.
- Browser review at1440×900 and emulated390×844. No horizontal overflow. Existing neutral visual design,44px mobile actions and visible focus are retained. Keyboard Escape dismisses the language modal and returns focus to the flag. Reduced-motion styles remain; no animations were added.
- Main search finds Mattheis, his four tracklists and two recordings. Steps opens the full60-position Brooklyn set with position50 centered and marked. Exact remix versions remain separate.
- Comparison renders both full tracklists and retains source choices when language changes. French survives reload. Korean copy feedback retains the original Jeremy Olander — Steps text. Invalid pasted tracklists show an error without importing anything. Transition graph renders seven nodes for the tested track.
- All20 static files return HTTP200 under /olander-atlas/, including correct JavaScript module MIME types. Local asset URLs are relative and support a GitHub repository prefix. Browser console has no errors.
- Generated assets are current. Workflow YAML parses; tests gate deployment, PRs do not deploy, and only dist is uploaded. Deployment uses the built-in GitHub token with scoped permissions; no personal token is needed.
- Public export scan found no matched private keys, GitHub/OpenAI credential patterns, credential-bearing URLs or absolute local paths. This is a bounded source check, not a penetration-test certification.
- Impeccable scan:51 advisory findings, zero primary findings. These flag inherited/documented typography, neutral values and intentional flag imagery. No material finding was verified in the changed surface. Accessibility3/4, performance4/4, theming4/4, responsive3/4, integrity4/4:18/20.

## Verification limits

At the time of the local review, GitHub Actions and the public HTTPS deployment had not run. Their subsequent results are available in the repository’s Actions tab. Local checks used Node25.6.1 and Python3.13.5; the workflow pins Node24. Full assistive-technology and physical phone testing were not performed. External listening/source destinations were checked as links, not all played or audited. Raw collection snapshots are not included; publishing the bundled dataset does not require them.

Browser imports and language preferences are specific to each browser and website origin. Export local additions before moving from localhost or the previous host to GitHub Pages. Visitor imports do not edit the public dataset. The collection remains a dated source snapshot; source ordering, missing IDs and public tracklist accuracy require listening/source verification.

## Follow-up: Mix Atlas branding and global tabs

The public brand is Mix Atlas in the header, browser title, accessibility labels, link previews, translated descriptions and export filenames. Artist names remain factual source credits. Existing browser storage keys are retained for compatibility.

Removed producer-specific scope/relation dropdowns and their related filter controls from the public interface. All / Tracks / DJs / Sets now partition the same collection. DJ search includes the full documented repertoire; matching passages stay focused on the query. Collective credits remain collective. DJ rows show a concise track count. Import forms and templates no longer preselect Jeremy Olander.

53 JavaScript tests pass, including global tab parity and query-focused DJ passages. Desktop1440px and mobile325px checked: no overflow, no removed-control references or browser errors. Korean keeps the Mix Atlas title and matching localized description metadata. Static design scan has no primary findings; existing focus, contrast and reduced-motion rules remain. Physical-device and full screen-reader testing remain outside this bounded follow-up.

## Cross-discussion data reconciliation

Reconciled the older collection checkout against the public repository by source URL. The older dataset had397 sets and the public release had386. Eleven sources were missing: five Layer J sources and six CVMRN sources. Existing Layer J Spybar was refreshed once; all other existing sources and metadata were unchanged, apart from the added artist collection coverage. Only verified dataset/collector/test additions were merged; the current public interface and Mix Atlas branding were retained.

The bundled collection now has397 sets,2,770 identified tracks and4,083 distinct transitions. Recent guest radio sources retain explicit CVMRN performer scope, unknowns, overlays, boundaries, separate performance/publication dates and safe source/audio links.55 JavaScript and3 Python tests pass. Recent-source builders, parsed data, coverage and regression tests are included for future maintenance.

## Dataset addition — Danny Howells / Stereodrama (18 October 2026)

39 verified source URLs and 711 entries were validated with the public import tool, then merged by source URL while preserving every pre-existing source object and its metadata. The 29 remix sources share `1001:vdg8l3mp`; the original and DCLVIII OFC versions remain separate. All 397 prior source URLs from related exports and archived checkouts are present in the canonical dataset. Current global collection: 436 tracklists, 3,316 identified track identities and 4,679 distinct transitions.

57 JavaScript tests and 3 Python tests pass. `prepare-site` and `check` report current assets. New regressions cover the exact remix, the complete 43-entry Cape Town source and its immediate neighbors, Danny’s global discovery, the Transitions 1081 performer split and the collective Belu Clavero credit.

Local browser check: the remix shows 29 source sets; selecting Dave Seaman’s Cape Town set centers position35 between John Digweed & Dino Lenny — Love & Cream and Âme — Rej (Mariano Mellino Remix). All43 entries remain in the source list and there is no horizontal overflow at the current1280px viewport. No interface styling or component was changed. A new mobile, screen-reader or reduced-motion emulation pass was not run for this dataset-only change. Proof is retained in the workspace as outputs/atlas-stereodrama.png. GitHub Pages publication must match the source commit before the website is reported updated.

## Appearance support — 18 October 2026

Added a compact 44px theme toggle beside the language flag. A small first-paint script resolves device appearance and explicit preference before CSS loads; changes are applied in place. Storage is separate from music and language, handles blocked storage, and synchronizes tabs and subsequent device changes. All three languages include an accessible toggle name and pressed state.

The existing neutral design now has a charcoal variant using shared surface, text, border, focus, hover, error and shadow tokens. Graph lines/markers respond through CSS variables. Native controls follow the colour scheme, primary actions invert legibly, and dialogs/popovers use elevated dark surfaces. No new animation, dependency or data changes were introduced.

61 JavaScript tests and 3 Python tests pass; four new appearance tests cover system defaults/changes, explicit preference and reload, cross-tab removal, blocked storage and preservation of language/music preferences. Asset preparation/check reports 436 sets with current fingerprints. Browser checks cover 1440px desktop and 325px emulated mobile, dark/light toggle by Enter/Space with visible focus, reload persistence, unchanged query/source URL, all three translated toggle labels, native import/language dialogs, comparison, graph, selected tracklist and no horizontal overflow. No browser errors were observed. Physical phone, full screen-reader and browser media-emulation testing were not performed; device-change behaviour is covered with a controlled test fixture.

Measured dark contrast: primary text/canvas 16.01:1; muted/selected 5.54:1; muted/selected-hover 5.01:1; control/panel 3.69:1; graph/canvas 4.86:1; error/panel 8.55:1. CSS colours outside root token declarations: zero. Impeccable detector: 40 advisory findings (existing documented type/radius values), zero primary findings; no material defect verified in the changed surface. Scoped audit: accessibility 3/4, performance 4/4, theming 4/4, responsive 3/4, integrity 4/4 (18/20). The appearance uses the incumbent neutral product system without changing data or navigation. Publication must match this commit before reporting the live update.

## General collection and CSV refactor — 20 October 2026

Removed implicit Olander defaults, the fixed artist allowlist, privileged comparison source URLs and artist-specific comparison statistics. Artist-scoped discovery now requires an explicit artist; the ordinary workspace includes the global collection. Aliases are collection metadata and provider IDs accept explicit namespaces. A no-Olander fixture verifies arbitrary Unicode artists, aliases, routes, global result types and comparison defaults. Historical research scripts retain their documented coverage but no longer edit runtime artist lists or embed the dataset in JavaScript; they use shared preparation.

The4.2MB executable dataset duplicate is replaced by a tiny versioned JSON fetch loader. Canonical dist/dataset.json remains human-readable; existing source objects and recordings are unchanged. Browser loading/failure/retry handling is localized. Browser collection and language writes now use Mix Atlas keys, with legacy reads and no deletion. Personal sources and aliases survive refreshes. Validation preserves source, entry and collection extensions.

Added shared CSV/JSON file parsing for both browser and publishing command, CSV download/template and JSON backup. CSV handles quoted commas/newlines, Unicode, scalar types, aliases, overlays, performer sections, boundaries, recordings and extension metadata. Formula-like text is escaped reversibly. Conflicting metadata, duplicate positions, unsafe URLs and malformed input are rejected; invalid publication inputs do not write. Full collection CSV round trips compare deeply equal after validation. Publishing preserves untouched raw source objects.

73 JavaScript and3 Python tests pass. Collector syntax checks and asset freshness checks pass. Canonical comparison retains all436 source objects and2 recordings exactly; related archived datasets and exported collections have no missing source URLs. No sets were collected or removed in this refactor.

Browser verification at1440px desktop and390px emulated mobile: original Lille Vals URL restores its exact source position; CSV upload updates one real source without adding a duplicate; reload restores it; downloaded CSV contains436 sets and2 recordings; downloaded template parses successfully. Keyboard export and theme toggle work, focus remains visible, and mobile import tools do not overflow. Existing light/dark tokens and reduced-motion rules are unchanged. Loader failure paths are covered with controlled fetch tests; network outage, physical phone and complete assistive-technology testing were not performed.

Impeccable scan:40 inherited typography/radius advisories, zero primary findings; no material UI defect verified. Scoped audit: accessibility3/4, performance4/4, theming4/4, responsive3/4, integrity4/4 (18/20). The two export actions use a wrapping row with a16px gap and existing44px targets. GitHub Actions must succeed for this exact refactor commit before the public update is reported.
