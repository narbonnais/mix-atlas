# CSV interchange

Use **Tools → Import / export → Import a file** for CSV or JSON. **Export CSV** creates a spreadsheet-editable collection; **JSON backup** exports the nested form. Both retain the complete validated collection. **Download CSV template** gives a one-set example. The publishing command accepts either format:

```sh
npm run import-setlists -- ./imports/collection.csv --dry-run
npm run import-setlists -- ./imports/collection.csv
```

## Minimal CSV

One row per played entry; repeat set fields on every row. These six columns are required:

```csv
source_url,set_title,djs,position,artist,title
https://example.com/a,My set,Any DJ,1,Producer,Track
https://example.com/a,My set,Any DJ,2,Other producer,Track (Remix)
```

Positions are the published positive integers, not a new consecutive sequence. Do not fill gaps with invented entries. UTF-8, comma separators, quoted commas/double quotes and newlines are supported. Files exported by the app include a UTF-8 BOM. Artist/title/version text is not translated.

## Optional columns

| Column | Meaning |
| --- | --- |
| date | Source performance date, YYYY-MM-DD; blank if unknown |
| media_url, source_name | Listening URL and source credit |
| time_seconds | Nonnegative whole-second cue, or blank |
| layer | `main` (default) or `overlay`; overlays share their main track’s position |
| track_id | Stable namespaced identifier, e.g. `1001:abcd` or `custom:track-1`; blank uses exact artist/title identity |
| status | `identified` or `unresolved`; unknown IDs are always unresolved |
| performers | Explicit performers for this row; otherwise retain set credit |
| break_before | `true` at a performer/section boundary, otherwise `false` |
| source_position | Original source position label |
| source_time_seconds, source_identified | Original cue and source identification flag |
| record_type | `track` (default), `recording` without a tracklist, or the exported empty-collection marker `collection` |

`djs` and `performers` accept a JSON string array (the exported form) or names separated with ` | ` in a hand-written file. The array form preserves names containing that separator. A single DJ name needs no array syntax.

## Round-trip metadata

Exports also include `set_metadata` on the first entry of each source, `entry_metadata` on each entry, and `collection_metadata` on the first file row. These JSON object cells retain extension fields such as genres, coverage, source aliases, accuracy notes, collection histories and artist-alias definitions. Recording metadata is carried on its recording row. Leave these cells with their rows when sorting or editing. Duplicate/conflicting metadata or repeated set fields are rejected rather than silently choosing a value. Spreadsheet changes to an ordinary column take priority over its metadata counterpart.

`format_version` is1 for app exports. It permits reversible apostrophe protection of formula-like text cells. Keep this marker when reimporting exported sheets; literal artist/title strings are restored exactly. CSV is an exchange format; do not maintain a second copy beside the canonical JSON.

Validation limits remain10MB per file,1,000 sets and20,000 entries in the merged collection. URLs must use HTTPS without credentials. Unknowns, gaps, overlays and section boundaries retain the same graph rules as JSON imports. Browser imports are local; publishing requires the repository workflow. The JSON file remains the canonical source because the model contains nested provenance and performer information.
