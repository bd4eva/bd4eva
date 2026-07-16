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

1. Add the mix's cover image to [`covers/`](covers/) as
   `<season>-<yy>.jpg` (e.g. `spring-26.jpg`), matching the naming
   convention of the existing 50+ cover files.
2. Open [`music.html`](music.html) and find the `const playlists = [...]`
   array (~line 445 as of this writing). Append a new entry in
   chronological order, matching the existing object shape:
   ```js
   { season: "Spring", year: 2026, label: "Spring 26",
     link: "https://music.apple.com/us/playlist/...",
     img: "spring-26.jpg", tracks: 49,
     spotify: "https://open.spotify.com/playlist/..." }
   ```
3. Get the Apple Music and Spotify playlist share links from their
   respective apps after publishing the playlist there.
4. Set `tracks` to the actual track count in the playlist.
5. Save, commit, and push to `main` (see §3 Deploy Flow).
6. Verify on the live site: the new mix card appears on
   [bd4eva.com/music.html](https://bd4eva.com/music.html) with the
   correct cover, and both streaming links work.
<!-- TODO: Brendan verify — confirm whether Top 50 tracks (`topTracks[]` in music.html) or insights.html data also needs manual updates when a new mix is published, and whether there's a source-of-truth spreadsheet/CSV this should be kept in sync with. -->

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
