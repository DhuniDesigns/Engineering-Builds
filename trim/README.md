# Trim: use fewer tokens on claude.ai

A small pill that sits just above the send button on claude.ai. When you pause typing on a long prompt, it offers to trim it. You see your version and the trimmed version side by side, with the cut words struck through, and you choose: **Use this** or **Keep mine**. **Undo** puts your words back.

Designed and built by **Hafsoh Bashar**.

## Install (Chrome, Edge, Brave, Arc)
Install it from the [Chrome Web Store](https://chromewebstore.google.com/detail/trim-shorter-ai-prompts/eakihifhclglndhidghmakhegienbmcf). To try the newest version before the store updates:
1. Download [trim-chrome-0.5.2.zip](trim-chrome-0.5.2.zip) and unzip it.
2. Open `chrome://extensions`, turn on **Developer mode** (top right) and click **Load unpacked**.
3. Pick the unzipped folder, then go to claude.ai and write a prompt of 20+ words.

Click the Trim icon in the toolbar to switch it on or off and see roughly how many tokens you've saved. Shortcut: Alt+T (Option+T on Mac).

### Building the Chrome version
`trim.user.js` is the single source. Run `./build-chrome.sh` to copy it into `chrome/content.js`, sync the version into `chrome/manifest.json` and zip it. Store listing copy and images live in `chrome/STORE_LISTING.md` and `chrome/store/`.

## Install (Safari on Mac)
1. Get the free **Userscripts** app from the Mac App Store and turn it on in Safari › Settings › Extensions.
2. Open [trim.user.js](https://raw.githubusercontent.com/DhuniDesigns/Engineering-Builds/main/trim/trim.user.js) in Safari, click the Userscripts icon in the toolbar and choose **Install**.
3. Go to claude.ai, write a prompt of 20+ words and pause for a second.

Shortcuts: Option+T opens the preview any time, even right after a trim · Enter uses it · Esc keeps yours.

When there's text in the box but nothing big to trim, a small scissors button stays next to send. Tap it to bring Trim back.

## What it cuts
Greetings, "hope you're well", apologies and sign-offs; roundabout asks ("Would it be possible for you to explain to me…" → "Explain…"); hedges ("I think that", "if that's okay"); filler words (basically, really, very); wordy phrases and long forms ("make sure that it is" → "ensure it's"); warm-ups ("So, I have a quick question"); and sentences said twice. Code, links and quoted text are never changed. On five everyday test prompts it saves about 45% of the estimated tokens.

## Privacy
Everything runs in your browser. No account, no server, nothing sent anywhere. [Privacy policy](https://dhuni-designs.vercel.app/trim/privacy.html)

## How it works
- A rules engine (plain JavaScript) shortens the text; tokens are estimated at about 4 characters each.
- The text goes back into claude.ai's ProseMirror editor as a paste, so the editor and send button stay in sync.
- The UI lives in a shadow root so claude.ai's styles can't break it, and it follows light and dark mode.

© 2026 Hafsoh Bashar
