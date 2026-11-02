# Pixie for Figma (beta)

Imports a Pixie kit into the open Figma file:

- **Colour** → a Primitives collection (`brand/50`–`950`, `neutral/50`–`950`) and a Semantic collection with **Light** and **Dark** modes. Semantic tokens alias the primitives where the colours match. If the file's plan has no second mode, Light and Dark become two collections.
- **Typography** → a Type collection (font families, sizes, line heights, weights) and seven text styles bound to those variables.
- **Icons** → an Icons page with one component per icon.
- **Illustrations** → an Illustrations page with one component per scene. Fills that match the palette are bound to the colour variables.

Importing the same kit again updates it in place instead of duplicating it.

## Try it

1. In the Figma desktop app: **Plugins › Development › Import plugin from manifest…** and pick `manifest.json` from this folder.
2. In [Pixie](../), open **Send to Figma** and copy the kit code.
3. Run **Pixie** in Figma, paste the code, choose what to import.

## Files

- `manifest.json` — plugin manifest (no network access)
- `code.js` — creates variables, text styles and components
- `ui.html` — the paste, choose, progress and done screens

Designed and built by **Hafsoh Bashar**.
