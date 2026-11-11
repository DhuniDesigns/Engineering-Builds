# Sift: tidy up your moodboard in Figma

A Figma plugin that tags, categorizes and arranges a messy moodboard in a few clicks.
Designed and built by **Hafsoh Bashar**.

## What it does

- **Smart tags, offline.** Sift reads every image on the board and tags it by colour (Warm, Cool, Neutral, Mono), shape (Portrait, Landscape, Square) and type (Photo, Typography, UI). Colour is worked out from a small thumbnail of each item, so it runs with no AI service or API key.
- **Your own tags and categories.** Make categories that fit how you think, like Mood, Client or Project, and add tags inside each one. With images selected, adding a tag tags them too, and the + / ✓ button beside any tag adds it to or removes it from the selection. Tags can be renamed, moved between categories or deleted. Tags live on the layers and categories live in the file, so both are there next time.
- **Filter and select.** Tick one or more tags to find everything that matches all of them, then select it on the canvas in one click.
- **Arrange.**
  - **Sections:** groups the board into labelled Figma sections by colour, shape, type or any of your categories.
  - **Masonry:** Pinterest-style columns with no gaps.
  - **Grid:** even cells at one size.
  - Sliders control columns, gap and image width.
- **Safe to try.** Nothing is deleted. Every arrange can be undone from the toast or with Cmd+Z.

## Try it

1. In the Figma desktop app: **Plugins › Development › Import plugin from manifest…** and pick `manifest.json` in this folder.
2. Open a moodboard and run **Sift**.
3. Click **Scan this page**, or select some images and click **Use my selection**.
4. Tick a tag such as **Warm** and click **Select**, or go to **Arrange** and pick a layout.

Works in Figma Design and FigJam, in light and dark mode.

## How it was built

- `code.js`: the plugin side. It reads the board, saves tags with plugin data, exports 32px thumbnails and does the layouts: sections, masonry, grid and undo snapshots.
- `ui.html`: the panel, written in plain HTML, CSS and JS. Its canvas does the colour analysis. It has spring motion on tabs, checks and toasts, supports reduced motion, and works from the keyboard: sliders take arrow keys, Enter adds a tag, Backspace removes the last one and Escape clears filters.
- Screens were designed first in Figma, in a soft, tactile style inspired by shader pickers and widget cards.

## Publishing checklist

- [ ] Get a real plugin ID in Figma (Plugins › Development › New plugin) and replace `sift-moodboard-dev` in `manifest.json`.
- [ ] Make a 128 × 128 icon and a 1920 × 1080 cover.
- [ ] Write the Community listing copy, then submit for review.

© 2026 Hafsoh Bashar
