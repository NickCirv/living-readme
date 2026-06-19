<div align="center">

# living-readme

**Your README updates itself on every commit — Claude reads the diff, patches the right sections, and stages the result.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue?labelColor=0B0A09)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?labelColor=0B0A09)](package.json)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-green?labelColor=0B0A09)](package.json)

</div>

## Install

```bash
npx github:NickCirv/living-readme install
```

Then set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

```bash
# Install the post-commit hook in any git repo
cd your-project
npx github:NickCirv/living-readme install

# Manually trigger a README update
living-readme update
living-readme update --message "rewrote the auth flow to use JWT"
living-readme update --force   # skip loop-guard check

# Check hook status and what would be updated
living-readme status

# Remove the hook
living-readme uninstall
```

| Flag | Description |
|------|-------------|
| `--message "text"` | Add developer context to the Claude prompt |
| `--force` | Bypass the 5-second loop-guard timestamp check |

## What it does

A post-commit hook fires after every `git commit`. It reads the diff, maps changed files to README sections (`src/api/*` → API/Usage, `package.json` → Installation, etc.), then sends the diff and current README to Claude Haiku. Only the relevant sections are rewritten — everything else is left exactly as-is. The updated README is staged for your next commit; the hook never auto-commits, so there is no infinite loop. Without an API key the hook still runs and reports which sections it would have updated.

## Configuration

Create a `.living-readme` file in your repo root to override defaults:

```
model=claude-haiku-4-5-20251001
sections=Usage,Installation,Features,API
max_diff_chars=2000
```

---
<sub>Zero dependencies · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
