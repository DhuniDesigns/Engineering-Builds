# Pixie

Describe a brand in a sentence. Pixie generates colours, typography, icons and illustrations, checks every contrast pairing, and sends the kit to Figma as variables, text styles and components.

**Live:** https://pixie-brand-kits.vercel.app · **Logo:** [`logo/`](logo/) · **Figma plugin:** [`figma-plugin/`](figma-plugin/)

- Brief → personality sliders (energy, era, tone) steer every module together
- Colour: 11-step OKLCH scale, Light/Dark semantic tokens, 20 WCAG checks with automatic fixes
- Type: curated Google Fonts pairings or your own fonts, 7-level scale
- Icons: pick from five packs (Lucide, Solar, Phosphor, Tabler, Heroicons) with 14 styles between them; Pixie recommends one from the brief; stroke and corners adjust where the style allows
- Illustrations: Geometric, Soft and Line styles, plus your own styles: describe a look or upload a reference image, and Pixie draws six scenes in it; describe any extra scene and it is drawn too
- Saved kits, lock and regenerate per module, export as a kit code, design tokens JSON or CSS variables

Interface icons: [Solar](https://www.figma.com/community/file/1166831539721848736) by 480 Design (CC BY 4.0). Kit icon packs: Lucide (ISC), Solar (CC BY 4.0), Phosphor (MIT), Tabler (MIT), Heroicons (MIT).

Plain HTML, CSS and JavaScript. Designed and built by **Hafsoh Bashar**.

## AI drawing setup (Vercel)

Custom illustration styles and scenes are drawn by Claude through `api/draw.js`, a small serverless function.

1. In the Vercel project, open **Settings › Environment Variables** and add `ANTHROPIC_API_KEY` (from console.anthropic.com).
2. Optional: `PIXIE_MODEL` (default `claude-sonnet-5-5`) and `PIXIE_HOURLY_LIMIT` (default 40 requests per visitor per hour).
3. Redeploy. The "New style" and "Describe a scene" buttons appear once the key is set.

Set a monthly spend limit on the Anthropic account, since every visitor's drawings use your key.
