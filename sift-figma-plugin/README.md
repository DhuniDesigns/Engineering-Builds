# Sift: tidy up your moodboard in Figma

A Figma plugin that tags, categorizes and arranges a messy moodboard in a few clicks.
Designed and built by **Hafsoh Bashar**.

## What it does

- **Smart tags, offline.** Sift reads every image on the board and tags it by colour (Warm, Cool, Neutral, Mono), shape (Portrait, Landscape, Square) and type (Photo, Typography, UI). Colour is worked out from a small thumbnail of each item, so it runs with no AI service or API key.
- **Your own tags and categories.** Make categories that fit how you think, like Mood, Client or Project, and add tags inside each one. With images selected, adding a tag tags them too, and the + / ✓ button beside any tag adds it to or removes it from the selection. Tags can be renamed, moved between categories or deleted. Tags live on the layers and categories live in the file, so both are there next time.
- **Filter and select.** Your categories come first. Colour, Shape and Type sit underneath as dropdowns called Smart filters. Tick tags from any of them to find what matches all of them, then select those items on the canvas in one click.
- **Arrange.**
  - **Sections:** groups the board into labelled Figma sections by colour, shape, type or any of your categories.
  - **Masonry:** Pinterest-style columns with no gaps.
  - **Grid:** set the columns, cell width, cell height and gap. Choose **Fill and crop**, where every image becomes exactly that size and photos crop to fill, or **Fit inside**, where images keep their shape and sit centred in the cell.
  - Drag any slider, or click its number to type an exact value.
- **Safe to try.** Nothing is deleted. Every arrange can be undone from the toast or with Cmd+Z.

## Try it

1. In the Figma desktop app: **Plugins › Development › Import plugin from manifest…** and pick `manifest.json` in this folder.
2. Open a moodboard and run **Sift**.
3. Click **Scan this page**, or select some images and click **Use my selection**.
4. **Arrange** opens first: pick a layout, set the sizes and click **Arrange**. Use **Tag** to add your own tags and categories, or to filter by colour, shape and type.

Works in Figma Design and FigJam, in light and dark mode.

## How it was built

- `code.js`: the plugin side. It reads the board, saves tags with plugin data, exports 32px thumbnails and does the layouts: sections, masonry, grid and undo snapshots.
- `ui.html`: the panel, written in plain HTML, CSS and JS. Its canvas does the colour analysis. It has spring motion on tabs, checks and toasts, supports reduced motion, and works from the keyboard: sliders take arrow keys, Enter adds a tag, Backspace removes the last one and Escape clears filters.
- Screens were designed first in Figma, in a soft, tactile style inspired by shader pickers and widget cards.

## Publishing checklist

- [x] Plugin ID 1702306244213990609 is in `manifest.json`.
- [x] Icon: `assets/icon-128.png` (3D sieve: scattered images in, arranged images out), plus a 512px version and an SVG.
- [ ] Make a 1920 × 1080 cover.
- [ ] Write the Community listing copy, then submit for review.

© 2026 Hafsoh Bashar
