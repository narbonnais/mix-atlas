# Atlas

Explore music through published DJ tracklists: find who played a track, see its full set in order, and inspect the tracks before and after it. Includes search, copy artist/title, source and listening links, transition graphs, set comparison, and English (default), French and Korean.

The current bundled collection contains **386 tracklists, 2,698 identified track identities, 3,996 distinct transitions and 2 recordings awaiting tracklists**. It starts with Jeremy Olander and includes supporting DJs, Mattheis, Fahlberg, and producers played by Olander. These are collected sources, not a complete record of every performance. Details: [collection notes](docs/collection-notes.md).

## Run locally

No npm dependencies or API keys are required. With Python 3 installed:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8765/. Development and tests use Node.js 24+ and Python 3. No `npm install` is needed.

## First publication on GitHub Pages

1. Create an **empty public repository** named `mix-atlas` at https://github.com/new. Leave README, license and .gitignore initialization unchecked; this folder already contains project files.
2. Open Terminal in this project folder and run:

   ```sh
   git init -b main
   git add .
   git commit -m "First public version"
   git remote add origin https://github.com/YOUR-USERNAME/mix-atlas.git
   git push -u origin main
   ```

   Replace `YOUR-USERNAME` with your GitHub username. GitHub may ask you to sign in through your credential manager. Do not put a password or token into the remote URL.
3. In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Review and publish Atlas → Run workflow → main**. This also reruns deployment if the first push happened before Pages was enabled.
5. Wait for both `check` and `deploy` to succeed. The deployment shows the exact live URL, normally `https://YOUR-USERNAME.github.io/mix-atlas/`.

The included `.github/workflows/pages.yml` prepares the dataset, runs the JavaScript and Python tests, and publishes only `dist/`. Every subsequent push to `main` updates the site. Pull requests run checks without publishing. No personal access token, custom domain, database or server is needed for deployment.

Official references: [GitHub Pages setup](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically), [custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Update the public setlists

**The public source of truth is `dist/dataset.json`.** GitHub generates the browser data module and asset versions from it during deployment. Committing raw snapshots alone does not update the public graph.

To publish additions made in your browser:

1. Use **Tools → Import / export → Export my collection**.
2. Review the exported JSON; all included setlists will be public after you commit them.
3. Merge it into the bundled collection from Terminal:

   ```sh
   npm run import-setlists -- /path/to/olander-atlas-collection.json --dry-run
   npm run import-setlists -- /path/to/olander-atlas-collection.json
   npm test
   ```

   The import validates the collection, updates existing sources by URL, adds new ones, preserves source credits, and regenerates the browser assets. Reimporting a source does not inflate its count. Keep private export files in the ignored `imports/` folder if needed.
4. Commit and push:

   ```sh
   git add dist
   git commit -m "Update setlists"
   git push
   ```

You can also edit `dist/dataset.json` directly and push it; GitHub regenerates the site automatically. To preview a manual dataset or code change locally first, run `npm run prepare-site`.

Imports made by a visitor remain in that browser only. They cannot change the public website. Browser storage is specific to the device and website address: export your local collection before moving to a GitHub Pages URL, then import it there. English/French/Korean preferences are stored separately from the collection.

## Verify changes

```sh
npm run prepare-site
npm run check
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
```

`prepare-site` validates the dataset and refreshes all dependent asset versions. `check` detects stale generated assets without writing. The tests cover exact track versions, unknown IDs, gaps, overlays, collective credits, performer sections, imports, source updates, navigation, localization, global collection access and release tools.

## Source integrity and privacy

Tracklists are attributed to their linked sources, primarily 1001Tracklists and MixesDB. This is an independent project and is not affiliated with those services. Listening links lead to the source recordings; no audio files are hosted.

Unknown tracks and missing positions never create inferred transitions. Remixes and edits remain separate. A shared set does not prove an individual DJ chose a track. Published timestamps are listening cues, not evidence of BPM, key or mixing technique. Open a source to verify it.

The app has no account system, analytics or collection-upload endpoint. Imports and language preferences use browser storage. The stylesheet requests DM Sans from Google Fonts; listening and source links open external services. Collector scripts are offline builders except the older `collector/collect.py` prototype; there is no scheduled collection or automatic CAPTCHA handling.

This release excludes private hosting configuration, repository history, browser snapshots, local credentials and internal audit files. The collector builders and parsed input datasets remain available for maintenance; rebuilding raw collection stages requires your own snapshots. See [release review](docs/release-review.md) for completed checks and remaining verification limits.
