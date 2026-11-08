# Pixie for Figma (beta)

Imports a Pixie kit into the open Figma file:

- **Colour** → a Primitives collection (`brand/50`–`950`, `neutral/50`–`950`) and a Semantic collection with **Light** and **Dark** modes. Semantic tokens alias the primitives where the colours match. If the file's plan has no second mode, Light and Dark become two collections.
- **Typography** → a Type collection (font families, sizes, line heights, weights) and seven text styles bound to those variables.
- **Icons** → an Icons page with one component per icon. Strokes are bound to the Semantic `text` colour, so icons switch with Light and Dark. Each component credits its icon pack and licence.
- **Illustrations** → an Illustrations page with one component per scene. Fills that match the palette are bound to the colour variables.

Variables come with scopes, so each one only shows up where it makes sense: primitives stay out of the pickers, `bg` and `surface` show for fills, `text` for text, `border` for strokes, and type sizes for font size.

Importing the same kit again updates it in place instead of duplicating it. The plugin remembers the last kit you imported, so updating it is one click. If Figma can't read one icon or illustration, the plugin skips it, carries on, and tells you which one.

## Try it

1. In the Figma desktop app: **Plugins › Development › Import plugin from manifest…** and pick `manifest.json` from this folder.
2. In [Pixie](../), open **Send to Figma** and copy the kit code.
3. Run **Pixie** in Figma and paste the code. It moves on by itself; choose what to import.

## Publish to Figma Community

1. In Figma desktop: **Plugins › Development › New plugin…**, pick *Figma design*, and copy the plugin id it gives you into `manifest.json` (replace `pixie-brand-kit-dev`).
2. Prepare a 128 × 128 icon, a 1920 × 1080 cover, a short tagline and a description.
3. **Plugins › Development › Pixie › Publish**, add the assets, and submit for review. Figma usually reviews within a week or two.

## Files

- `manifest.json` — plugin manifest (no network access)
- `code.js` — creates variables, text styles and components
- `ui.html` — the paste, choose, progress and done screens

Designed and built by **Hafsoh Bashar**.
