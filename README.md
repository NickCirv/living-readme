# living-readme

Your README updates itself.

Every time you commit code, Claude reads what changed and updates the relevant README sections automatically. No more "TODO: update docs". No more stale installation instructions. No more APIs documented as v1 when you shipped v3.

---

## Installation

```bash
npm install -g living-readme
```

Or use it without installing:

```bash
npx living-readme install
```

Then set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Add to your shell profile (`~/.zshrc`, `~/.bashrc`) to make it permanent.

---

## Setup

Navigate to any git repo and run:

```bash
cd your-project
living-readme install
```

That's it. The post-commit hook is now active. Every commit you make will automatically trigger a README review.

---

## Usage

**Automatic (after install):**
Just commit normally. living-readme runs after every commit.

```bash
git add src/api/users.js
git commit -m "add user search endpoint"
# living-readme fires automatically
# → detects src/api/ change
# → updates API and Usage sections
# → stages README.md for next commit
```

**Manual trigger:**
```bash
living-readme update
living-readme update --message "rewrote the auth flow to use JWT"
living-readme update --force   # skip loop-guard check
```

**Check status:**
```bash
living-readme status
```

**Remove the hook:**
```bash
living-readme uninstall
```

---

## Features

- **Zero config** — works out of the box with sensible defaults
- **Surgical updates** — only touches sections relevant to what changed
- **Loop-safe** — stages README.md but never auto-commits (no infinite hook loops)
- **Graceful degradation** — if no API key is set, shows what WOULD be updated
- **API failure safe** — a failed Claude call never breaks your commit
- **Config file** — override model, sections, and diff size per repo

---

## Configuration

Create a `.living-readme` file in your repo root:

```
# living-readme config
model=claude-haiku-4-5-20251001
sections=Usage,Installation,Features,API
max_diff_chars=2000
```

| Option | Default | Description |
|--------|---------|-------------|
| `model` | `claude-haiku-4-5-20251001` | Claude model to use |
| `sections` | `Usage,Installation,Features,API` | Sections to watch and update |
| `max_diff_chars` | `2000` | Max diff characters sent to Claude |

---

## How Sections Are Matched

living-readme maps your changed files to README sections automatically:

| Changed files | Updates section |
|---------------|----------------|
| `src/api/*`, `routes/` | API, Usage |
| `package.json`, lock files | Installation |
| `*.test.*`, `__tests__/` | Testing |
| `src/`, `lib/`, `index.*` | Usage, Features |
| `docker*`, `kubernetes/` | Installation, Usage |
| `.env`, `config.*` | Installation, Configuration |

Only sections that exist in your README can be updated. If a section is in the match list but not in your README, it's silently skipped.

---

## API

### `living-readme install`
Writes `.git/hooks/post-commit` pointing to the installed `index.js`. Safe to run multiple times.

### `living-readme uninstall`
Removes the post-commit hook. Only removes hooks it installed — won't touch hooks it didn't create.

### `living-readme update [--message "..."] [--force]`
Manually runs the README update. Useful for testing or for commits that didn't trigger the hook. `--message` adds developer context to the Claude prompt. `--force` bypasses the 5-second loop guard.

### `living-readme status`
Shows: hook installed, README found, API key set, configured model, watched sections, detected README sections, and a preview of what the last commit would have updated.

---

## Loop Prevention

living-readme stages `README.md` but does **not** automatically amend or create new commits. This prevents the post-commit hook from triggering itself.

After a README update, you'll see:

```
living-readme: README.md staged for next commit
  (run `git commit --amend --no-edit` to fold it into this commit)
```

A 5-second timestamp guard provides an additional safety net.

---

## Without an API Key

The hook still runs. It analyzes your changed files and reports which sections it would update — without calling Claude. Useful for testing your setup before adding a key.

```
living-readme: ANTHROPIC_API_KEY not set — skipping AI update
living-readme: would update sections: API, Usage
```

---

## Example: Auto-Update in Action

```bash
$ git diff HEAD~1 HEAD --name-only
src/api/search.js
src/api/filters.js

$ git commit -m "add search and filter endpoints"
[main abc1234] add search and filter endpoints

living-readme: changed files → src/api/search.js, src/api/filters.js
living-readme: target sections → API, Usage
living-readme: calling claude-haiku-4-5-20251001...
living-readme: README.md updated
living-readme: README.md staged for next commit
  (run `git commit --amend --no-edit` to fold it into this commit)
```

---

## License

MIT
