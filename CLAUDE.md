# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal static website (jpmor.com) hosted on GitHub Pages. Content is written in Markdown (`sitewiki/*.md`) and converted to HTML using a Bash + Pandoc build script.

## Build

```bash
# Build all pages
./script/md2html

# Build a single page (e.g., tech.md → tech.html)
./script/md2html tech
```

Dependencies: `pandoc`, `tidy` (HTML Tidy), `bash`.

## Architecture

- **`sitewiki/*.md`** — Source content. Each file becomes a `docs/*.html` file.
- **`docs/`** — GitHub Pages source (configured in repo settings). Contains all generated `.html` files, `static/`, and `CNAME`.
- **`docs/static/template`** — HTML wrapper (header + nav + footer). First 17 lines prepended, last 3 appended.
- **`script/links-to-html.lua`** — Pandoc Lua filter that rewrites `.md` links to `.html`.
- **`docs/static/style.css`** — Global styles (dark theme).
- **`docs/static/places/`** — Geographic JSON data and map PNGs for the places page, exported from mapchart.net:
  - `usa.json` — US counties, colored by time spent: State Visited (gray baseline) → Minute → Hour → Day → Month → Year
  - `global.json` — International provinces/regions, same time-spent tiers

## Content Types

- Link collections with dates: `tech.md`, `interesting.md`, `maps.md`
- Recipes: `amatriciana.md`, `carnitas.md`, `gnocchi.md`, etc.
- Essays/prose: `business.md`, `history.md`, `future.md`, `science.md`
- Personal: `index.md`, `places.md`, `music.md`, `quotes.md`

## Editing

The site is edited via **Vimwiki** (configured in `~/.dot/vim/vim/personal.vim`), with `sitewiki/` as the wiki root. Key mappings when editing:

- `<leader>gq` — Copies current line as a formatted markdown link into the clipboard (uses `$HW/script/mdtag.py`)
- `<leader>n` — Sorts link entries in the current file by date (useful for link collection pages)
- `<leader>w` — Opens the word under cursor on Wikipedia

## Automated Pipeline (homerun)

`~/side/homerun` is a Docker-based cron service that runs every minute. It reads emails from Gmail (label `system-queue`) and publishes them to this repo automatically:

- **Subject matches a category in `links.txt`** (advice, business, future, history, interesting, maps, research, science, tech, wwk) → appends a link entry to the corresponding `sitewiki/*.md`, runs `md2html`, commits, and pushes.
- **Any other subject** → writes to the private `homewiki` repo as a daily log entry.

Automated commits appear in git log as `[PIPELINE] Fetch from queue on YYYY-MM-DD`.

## Manual Workflow

Edit a `.md` file in `sitewiki/`, run `./script/md2html <page>` to regenerate the corresponding HTML, then commit both the `.md` and `.html` files.
