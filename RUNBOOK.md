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
| `HARDCOVER_TOKEN` | Local: `.env` (chmod 600, gitignored). Production: Vercel project env var. | Hardcover GraphQL API auth, used by `api/_hardcover.js`, `api/books.js`, `api/search.js` — powers [reading.html](reading.html) (finished/currently-reading books) and [tiers-edit.html](tiers-edit.html) (book search/covers). | Last rotated: June 2026. See playbook in §7. |

No secret values are recorded in this file, ever.

**⚠️ Verified mismatch:** the local `.env` file contains only the raw
token value on a single line — it is **not** in standard `KEY=VALUE`
dotenv format (there is no `HARDCOVER_TOKEN=` prefix). Since the API code
reads `process.env.HARDCOVER_TOKEN`, this file as currently formatted
will **not** populate that variable for local tooling that expects
dotenv syntax (e.g. `vercel dev`). Production most likely works because
the token is set directly as a Vercel project env var, independent of
this file. Treat local `.env` as a personal copy of the value, not a
verified local-dev dependency.
<!-- TODO: Brendan verify — reformat .env to `HARDCOVER_TOKEN=<value>` if local dev via `vercel dev` needs it, and confirm the Vercel dashboard env var is the actual source of truth in production. -->

**⚠️ Verified mismatch on rotation date:** `MAINTENANCE_REPORT.md` (dated
2026-05-27) found the same Hardcover JWT **hardcoded** in
`api/books.js` and `api/search.js`, with an `exp` claim it decoded as
2027-04-29. Commit `29f3b152` ("Move Hardcover token to env var",
2026-06-24) removed the hardcoded literals and switched the code to
`process.env.HARDCOVER_TOKEN` — but that commit only *relocated* the
token out of source; it's not confirmed whether the value itself was
also regenerated at that time. If "last rotated June 2026" means a new
token was issued (not just moved), the current `.env` value should not
match the one previously visible in git history.
<!-- TODO: Brendan verify — confirm whether the June 2026 change was a real rotation (new token issued in Hardcover) or just a relocation of the old hardcoded value. -->

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
  `api/search.js` (found by `MAINTENANCE_REPORT.md`, 2026-05-27) and had
  to be moved out (commit `29f3b152`, 2026-06-24). Secrets belong in
  `.env` (local, gitignored) and the Vercel project's environment
  variables — never in a committed file.
- **`.env` was never actually committed to git history** (verified via
  `git log --all --diff-filter=A -- .env`), so no history-scrubbing is
  needed for that file specifically — but the token *was* exposed in
  plaintext source for some period before the June 2026 fix, which is
  why a genuine rotation (not just relocation) may still be warranted —
  see §4.

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
