# bd4eva.com — Runbook

_Last verified: July 2026_

Ops reference for Brendan. For agent-facing coding conventions, see [CLAUDE.md](CLAUDE.md).

---

## 1. Overview

Personal music + reading site — 10 years of listening history and 50 seasonal
mixes, live at [bd4eva.com](https://bd4eva.com). Vanilla HTML/CSS/JS with a
handful of Vercel serverless functions for the reading page (Hardcover API
proxy). No framework, no build step, no `package.json` at the repo root.
Hosted on Vercel.

---

## 2. Repo & Local Path

- **GitHub:** `bd4eva/bd4eva`, remote `git@github.com:bd4eva/bd4eva.git` (SSH) ✅ verified
- **Local path:** `/Users/brendanduffy/bd4eva`

### ⚠️ Trap: `command-center/` is not BD Command Center

This repo contains a `command-center/` folder at its root
(`command-center/package.json`, `next.config.ts`, `supabase/`, `src/`) — a
**separate Next.js codebase**, tracked as ordinary files directly in the
`bd4eva` git history (confirmed: not a submodule, no `.gitmodules`).

**BD Command Center** (Brendan's personal dashboard) is its own project —
per Brendan, repo `bd4eva/bd-command-center`. This local `bd4eva` repo has
no git remote or submodule link to that repo, so there is no verified
relationship between the two beyond the name. `MAINTENANCE_REPORT.md` (§2,
§9-rec-5) independently flags this same folder as "a separate Next.js
project... does not appear to be served from bd4eva.com... ships to its
own Vercel deployment," and recommends splitting it into its own repo.

**Never confuse the two, and never assume changes to one are reflected in
the other.**
<!-- TODO: Brendan verify — confirm whether command-center/ here is a stale/duplicate copy of bd-command-center, or something else entirely, and whether it's still needed in this repo. -->

---

## 3. Deploy Flow

- Push to `main` → Vercel auto-builds and deploys. No CI config, no build
  step, no `vercel.json` in the repo — Vercel auto-detects the static
  site + `api/*.js` serverless functions.
- Vercel project: `bd4eva` (`.vercel/project.json`, gitignored, confirms
  `projectId: prj_MzRURQs8IuE2aUnO8HAvOwMvHEXy`).
- **Verify a deploy:** Vercel dashboard → the `bd4eva` project →
  **Deployments** tab. Confirm the latest deployment matches the commit
  you just pushed and shows "Ready."

---

## 4. Secrets

| Name | Location | Purpose | Rotation |
|---|---|---|---|
| `HARDCOVER_TOKEN` | Local: `.env` (chmod 600, gitignored, `HARDCOVER_TOKEN=<value>` format). Production: Vercel project env var. | Hardcover GraphQL API auth, used by `api/_hardcover.js`, `api/books.js`, `api/search.js` — powers [reading.html](reading.html) (finished/currently-reading books) and [tiers-edit.html](tiers-edit.html) (book search/covers). | Rotated June 2026 — old token revoked, new token issued. Value in old git history is inert. See playbook in §7. |

No secret values are recorded in this file, ever.

Local `.env` is in standard `KEY=VALUE` dotenv format
(`HARDCOVER_TOKEN=<value>`), which local tooling like `vercel dev` reads
directly. **Production does not read this file** — it reads the
`HARDCOVER_TOKEN` environment variable set in the Vercel project
dashboard. The two are independent; updating one does not update the
other (see §7 rotation playbook).

**Rotation confirmed (June 2026):** the Hardcover token was previously
hardcoded in `api/books.js` and `api/search.js` (found by
`MAINTENANCE_REPORT.md`, 2026-05-27). Commit `29f3b152` ("Move Hardcover
token to env var", 2026-06-24) both moved the token to `process.env` and
coincided with a genuine rotation — the old token was revoked in
Hardcover before the new one was issued. The value visible anywhere in
old git history is dead and cannot be used.

---

## 5. Backups

- **Code:** GitHub (`bd4eva/bd4eva`) — verified synced with local `main`.
- **iCloud "website assets" folder:** `bd_music_merged.csv`, raw Spotify
  export, `Library.xml`.
- **iCloud "Secret codes" subfolder:** copies of secret files.
- **⚠️ Open gap:** all repos currently live on one Mac mini only. No
  Time Machine drive has been purchased yet — there is no local hardware
  backup independent of GitHub + iCloud.
<!-- TODO: Brendan verify — current state of iCloud folders and Time Machine purchase status. -->

---

## 6. Scheduled & Manual Jobs

None.

---

## 7. Playbooks

### Publish a new seasonal mix

**Cover first.** Brendan often uploads the cover to GitHub ("Add files
via upload") *before* asking for the site change, so always `git fetch` /
`git pull` at the start — the file you need may already be waiting on
`main`. Grid tiles have no `onerror` fallback, so a missing cover renders
as a broken image. Do not push until the cover is in place: a mix is only
done when the tile renders. Pushing code ahead of the cover publishes a
visibly broken tile.

1. Make sure the cover exists at `covers/<season>-<yy>.jpg` (e.g.
   `spring-26.jpg`), matching the naming convention of the existing 50+
   cover files. Pull first; if it is not on `main`, ask Brendan for it
   rather than pushing without it.
2. Open [`music.html`](music.html) and find the `const playlists = [...]`
   array (~line 1008 as of Oct 2026). Append a new entry in
   chronological order, matching the existing object shape:
   ```js
   { season: "Spring", year: 2026, label: "Spring 26",
     link: "https://music.apple.com/us/playlist/...",
     img: "spring-26.jpg", tracks: 49,
     spotify: "https://open.spotify.com/playlist/..." }
   ```
   Recent mixes are Apple-only — omit `spotify` when there is no
   Spotify link.
3. Get the Apple Music and Spotify playlist share links from their
   respective apps after publishing the playlist there.
4. Set `tracks` to the actual track count in the playlist.
5. Bump the three hardcoded counts, which must stay in sync with the
   array:
   - `music.html` stats row — **Mixes** (count of entries) and **Songs**
     (sum of every `tracks` value).
   - `index.html` Music card — the `N MIXES` in `card-meta`.

   Verify with:
   ```sh
   grep -o 'tracks: [0-9]*' music.html | grep -o '[0-9]*' \
     | awk '{s+=$1} END {print "mixes:", NR, "songs:", s}'
   ```
6. Verify locally at 375px before pushing: the new tile renders with its
   cover and the counts read correctly. Covers are `loading="lazy"`, so
   scroll the tile into view or force-load before judging it — and a 404
   cached from a page load made *before* the cover landed will persist
   until a hard reload.
7. Save, commit, and push to `main` (see §3 Deploy Flow).
8. Verify on the live site: the new mix card appears on
   [bd4eva.com/music.html](https://bd4eva.com/music.html) with the
   correct cover, and both streaming links work.

**Do not touch the Top 50 when adding a mix.** `topTracks[]` in
[`music.html`](music.html) (~line 874) and the "Decade — Best Of Mix"
block above it are a fixed retrospective of the first 10 years
(2016–2026), not a rolling chart. They are intentionally static and do
not drift as new mixes are added — leave them alone unless Brendan
explicitly asks for a refresh.

<!-- TODO: Brendan verify — confirm whether insights.html data needs manual updates when a new mix is published, and whether there's a source-of-truth spreadsheet/CSV it should be kept in sync with. (Top 50 / topTracks[] resolved Oct 2026: intentionally static for the first 10 years.) -->

### Rotate the Hardcover token

1. Log into Hardcover → account settings → generate a new API token.
2. Update the local `.env` file with the new token value (see §4 note on
   `.env` format — confirm the format matches what your local tooling
   expects before saving).
3. Update the `HARDCOVER_TOKEN` environment variable in the Vercel
   dashboard: `bd4eva` project → **Settings** → **Environment Variables**.
4. Trigger a redeploy (push a no-op commit to `main`, or use Vercel's
   dashboard **Redeploy** button) — env var changes don't apply to
   already-built deployments.
5. Verify [reading.html](reading.html) and [tiers-edit.html](tiers-edit.html)
   still load book data correctly after the redeploy (see §9
   Troubleshooting if not).
6. Update the rotation date in §4 of this file.

---

## 8. Known Traps & Lessons Learned

- **`command-center/` naming collision** — see §2. The folder in this
  repo is a separate Next.js app, tracked in `bd4eva`'s own git history.
  It is not the same thing as BD Command Center's dedicated repo. Do not
  edit one expecting it to affect the other.
- **Book cover overrides are keyed on the exact Hardcover title —
  including odd whitespace.** `BOOK_COVER_OVERRIDES` in
  [`reading.html`](reading.html) (~line 553) maps a book title to a
  local file in [`covers/books/`](covers/books/), overriding the cover
  the Hardcover API returns. Lookup is an exact string match
  (`BOOK_COVER_OVERRIDES[b.title]`), so the key must reproduce
  Hardcover's title *character for character*. `"Still Life with
  Woodpecker"` is stored with **two spaces** before "Woodpecker"
  because that is how Hardcover returns it. This is deliberate, not a
  typo — do not "fix" the spacing, or the override silently stops
  matching and the book falls back to the API cover. The same applies
  if Hardcover ever corrects a title upstream: the override will fail
  quietly, with no error, so check here first when a book shows the
  wrong cover. Note this is a *separate* mechanism from the
  `cover_url` field in [`tiers.json`](tiers.json), which the tiers page
  carries on each book itself and which uses the normal single-space
  title.
- **Secrets must never be hardcoded in committed source.** The Hardcover
  token was previously hardcoded directly in `api/books.js` and
  `api/search.js` (found by `MAINTENANCE_REPORT.md`, 2026-05-27). It was
  rotated and moved to `process.env.HARDCOVER_TOKEN` in commit
  `29f3b152` (2026-06-24) — old token revoked in Hardcover, new token
  issued, and the code switched to read from the environment. Secrets
  belong in `.env` (local, gitignored) and the Vercel project's
  environment variables — never in a committed file.
- **`.env` was never actually committed to git history** (verified via
  `git log --all --diff-filter=A -- .env`), so no history-scrubbing was
  needed for that file. The token that *was* briefly exposed in
  plaintext source is dead — it was revoked as part of the June 2026
  rotation, so its presence in old commits is no longer a live risk.

---

## 9. Troubleshooting

- **Build/deploy failure:** Vercel dashboard → `bd4eva` project →
  **Deployments** → click the failed deployment → build logs.
- **Serverless function errors** (e.g. `/api/books`, `/api/search`
  returning 500s): Vercel dashboard → `bd4eva` project → **Functions**
  tab (or the **Logs** view on a specific deployment) for runtime logs.
- **`reading.html` is empty or broken:** first check is always the
  Hardcover API — confirm `HARDCOVER_TOKEN` is set correctly in the
  Vercel project's environment variables (§4), and check the `/api/books`
  function's logs for the actual GraphQL error response. Both
  `api/books.js` and `api/search.js` return a 500 with an explicit
  `"HARDCOVER_TOKEN env var is not set"` message if the variable is
  missing entirely — that's the fastest signal something's wrong with
  the env var rather than the token's validity.
