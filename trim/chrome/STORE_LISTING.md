# Trim: Chrome Web Store listing

Copy these into the Chrome Web Store developer dashboard. Images are in `store/`.

## Package
Upload `trim-chrome-0.4.0.zip` (built with `./build-chrome.sh` from the `trim` folder).

## Store listing tab

**Name** (from the manifest): Trim: shorter AI prompts

**Summary** (from the manifest, max 132 characters):
Cuts filler words from your Claude.ai prompts so they use fewer tokens. You see before and after, then choose.

**Description:**
Trim helps you write tighter prompts on claude.ai.

Write the way you normally do. When you pause, a small pill appears beside the send button showing roughly how many tokens you could save. Open it to see a side-by-side preview: the words Trim would remove are struck through, and you choose whether to keep yours or use the shorter version.

What Trim removes
• Greetings and small talk ("Hey Claude, I hope you're doing well")
• Hedges like "I was wondering if you could possibly"
• Filler words such as "basically", "really" and "just"
• Sign-offs like "thank you so much in advance"
• Wordy phrases ("in order to" becomes "to")

What it never touches
• Code blocks, links and anything in quotes

How to use it
• Pause typing and the pill appears beside send
• Alt+T (Option+T on Mac) opens the preview any time
• Enter uses the shorter version, Esc keeps yours
• Undo right after, or tap the scissors to trim again

Private by design
Trim runs entirely in your browser. It has no server, makes no network requests and never sends your prompts anywhere. Token counts are estimates.

Designed and built by Hafsoh Bashar.

Trim is an independent project and is not affiliated with or endorsed by Anthropic.

**Category:** Productivity (Tools also fits)
**Language:** English

**Graphic assets**
• Store icon: `icons/128.png`
• Screenshots (1280×800): `store/screenshot-1.png` to `store/screenshot-4.png`
• Small promo tile (440×280): `store/promo-small-440x280.png`
• Marquee promo tile (1400×560, optional): `store/promo-marquee-1400x560.png`

**Official URL / homepage:** https://github.com/DhuniDesigns/Engineering-Builds/tree/main/trim
**Support URL:** https://github.com/DhuniDesigns/Engineering-Builds/issues

## Privacy practices tab

**Single purpose:**
Trim suggests a shorter version of the prompt you are typing on claude.ai and replaces it only when you choose to.

**Permission justification**
• storage: Saves whether Trim is on or off and a running total of tokens saved, on the user's own computer.
• Host access (content script on https://claude.ai/*): Needed to read the prompt in the claude.ai message box, show the Trim pill and preview, and replace the text when the user clicks "Use this".

**Remote code:** No, I am not using remote code.

**Data usage:**
Tick **Website content**, since Trim reads the text typed into the claude.ai message box. Leave every other category unticked. Then tick all three certifications:
• I do not sell or transfer user data to third parties, outside of the approved use cases
• I do not use or transfer user data for purposes that are unrelated to my item's single purpose
• I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://dhuni-designs.vercel.app/trim/privacy.html

## Distribution tab
**Visibility:** Public (or Unlisted to test with a few people first)
**Regions:** All regions
**Pricing:** Free
