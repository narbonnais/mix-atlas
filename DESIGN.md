---
name: Mix Atlas
description: A quiet interface for finding published DJ transitions.
colors:
  background: "#ffffff"
  ink: "#191919"
  secondary: "#595959"
  muted: "#6b6b6b"
  raised: "#f5f5f5"
  selected: "#f1f1f1"
  divider: "#e8e8e8"
  control: "#8d8d8d"
typography:
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-.035em"
  detail:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "25px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-.025em"
rounded:
  control: "8px"
  dialog: "14px"
spacing:
  small: "8px"
  medium: "16px"
  large: "28px"
  page: "44px"
---

# Design System: Mix Atlas

## Overview

A quiet music browser. The user explicitly rejected the former green/lime interface and dense explanatory copy. This document replaces that visual authority. Use one font family, neutral surfaces and content hierarchy. Display the track context; keep methodology and secondary tools in optional disclosures.

## Colors

Light mode uses pure white as the main canvas. Ink is the primary foreground and primary button. Secondary and muted greys carry artist names and dates. The selected list row and current track receive a light neutral fill. Source dividers stay quiet; controls use distinct borders and a dark focus outline. Graph arrows and before/after labels are neutral; the selected graph node is black with white text. Do not reintroduce the discarded green, lime or lavender palette.

## Typography

Use DM Sans only: headings30px/600, detail25px/600, music titles15–16px/500, controls14px and supporting text12–13px. Mobile headings26px, detail24px, search and source selectors16px. Short labels replace explanatory subtitles. Long titles wrap where needed. Never reduce functional text below11px.

## Layout

One common workspace replaces the former navigation rail and task pages. The neutral header contains only the atlas wordmark, a compact appearance button, small language flag and Tools. Desktop uses a searchable result column up to340px and one adjacent detail panel separated by a hairline. The global search defaults to all collected sets, tracks and credited DJ groups, including independent collections; All / Tracks / DJs / Sets are filters of that same list. Do not show scope/relation selectors tied to a starting DJ. The result-type tabs filter the same global collection; the filter disclosure contains sorting only. Do not recreate separate task screens.

The detail always leads with the selected song. A DJ filter appears only when several documented DJ groups are available; otherwise the DJ is metadata. A source selector precedes the complete collected tracklist. The exact selected occurrence is highlighted and centered automatically. Identified track rows can be followed without leaving the workspace, retaining their source context. Transitions expand below the list. Comparison is an inline secondary section using the same tracklist renderer.

At1000px columns narrow and source controls stack. At720px results and detail become alternating panes of this same explorer, with a Results return and a persistent compact header. Copy, scope, selector and main touch actions remain44px. Deep links restore the selected detail; fresh searches start at the top. Browser Back restores the previous filters and exact occurrence.

## Elevation & Depth

Flat at rest. Use spacing and subtle selected fills, not repeated boxed cards. Only popovers, dialogs and toast feedback use a soft offset shadow. No decorative motion; reduced motion disables transitions.

## Shapes

Controls and selected rows have restrained8px corners. Source-dialog corners are14px. Icons are drawn inline SVG with1.6px round strokes. Focus is2px dark grey with a3px offset. Ordinary actions are at least44px high; compact exact-version chips36px.

## Components

- Result-type filters: All / Tracks / DJs / Sets, with a dark underline for the active type. One global search stays in the same place.
- Search: icon, accessible label, one input; no competing description. Filters are a44px disclosure control.
- Results: track/DJ title, one subtitle, compact set count. Flat rows, quiet selected fill.
- Copy: a small drawn two-sheet SVG button on track cards and rows. Copies Artist — Title, preserves exact version text, and confirms with a checkmark and live status. It is separate from the navigation button; 36px on desktop and44px on mobile.
- Discovery tracklist: all collected entries, original positions, timestamps, IDs and overlays. The selected occurrence has a light grey fill, a short Sélectionné marker and aria-current. The list centers on it without moving search or selector focus. Recentrer restores this position and focuses the scroll region for keyboard use. Missing positions and performer boundaries remain explicit.
- Source: native selector above the tracklist, then date. Listening and source actions follow the list; listening is offered only when a recording exists. Scope and timing caveats remain in Notes de la source.
- Tools: Tous les sets activates the Sets filter. Comparison opens inline and imports open the existing form dialog. Sources and scope caveats remain in disclosures.

## Do's and Don'ts

- Give the music more visual weight than metadata.
- Keep the three jobs available and exact versions separate.
- Preserve visible focus, accessible labels and explicit collective credits.
- Do not add banners, workflow subtitles, monograms, metrics walls or repeated explanation blocks.
- Do not replace a missing recording with fake playback controls.

## Languages
English is the default. A 44px borderless header button shows a 24×16px active-language flag. It opens a compact native dialog with English, Français and 한국어, a selected check and a close button; Escape dismisses it and focus returns to the flag. The selected preference is retained locally. Use the same neutral tokens and components in all languages. Native Hangul fallbacks supplement DM Sans; keep Korean words together and allow long content to wrap. The header stays on one row on narrow phones. The flag remains a44px target; the redundant starting-DJ dropdown is removed. Changing language retains the active pane, search, source selection and expanded disclosures. Dates and counts follow the chosen locale; published music names remain unchanged.

## Appearance

Light and dark modes share the same neutral identity, layout and typography. The dark canvas is #171717, elevated dialogs/popovers #202020, raised controls #252525 and selected rows #2c2c2c. Primary text is #f2f2f2, secondary #c1c1c1 and muted #a3a3a3. Dark control borders #787878 and focus #dedede remain distinct. Strong actions and the selected graph node invert to light surfaces with dark text. Component colours use shared semantic CSS tokens; graph lines and arrowheads use the same --graph-line token.

The 44px half-filled circle button beside the language flag toggles dark mode. Its translated accessible name is Dark theme, with aria-pressed indicating the active state. First paint follows the device setting unless the visitor saved an explicit choice. Save that choice separately as mix-atlas-theme, update the browser theme colour and native colour scheme, and synchronize appearance between tabs. Device changes apply until an explicit choice is made. Switch in place without remounting music, graph, comparison or language views; keyboard focus and the selected source stay intact. No theme-transition animation is needed.

## General collection and file tools

No artist is privileged by routes, import templates or comparison defaults. Search and source credits provide the content hierarchy. Preserve the established interface when new DJs are added; aliases belong to collection metadata. The import dialog accepts CSV or JSON, offers a CSV template, and places Export CSV and JSON backup in one wrapping row with a16px gap. All controls retain the existing44px targets, translations, focus treatment and light/dark tokens. Loading and retry messages stay in the workspace without introducing a new screen.
