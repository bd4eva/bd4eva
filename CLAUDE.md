# CLAUDE.md

Agent context for bd4eva.com. See [RUNBOOK.md](RUNBOOK.md) for ops detail
(secrets rotation, backups, troubleshooting).

- Stack: vanilla HTML/CSS/JS, no framework, no build step — never introduce one.
- Mobile-first. Verify changes at 375px width.
- Design tokens: `--black: #080808` (bg), `--white: #f0ede6` (text),
  `--accent: #00c2b8`.
- ⚠️ `command-center/` in this repo is a **separate Next.js codebase**,
  unrelated to BD Command Center (which is its own repo). Never edit it
  expecting it to affect bd4eva.com, and never confuse the two.
- Secrets live in `.env` only — never commit secret values to source.
- Never print secret file contents to the terminal — verify existence/format with ls, wc, or grep -c, not cat.
- Deploy: push to `main` when done; Vercel auto-builds, no manual step.
- See [RUNBOOK.md](RUNBOOK.md) for ops detail (secrets rotation, backups,
  troubleshooting).
