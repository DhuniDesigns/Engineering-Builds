# Trim: use fewer tokens on claude.ai

A small pill that sits just above the send button on claude.ai. When you pause typing on a long prompt, it offers to trim it. You see your version and the trimmed version side by side, with the cut words struck through, and you choose: **Use this** or **Keep mine**. **Undo** puts your words back.

Designed and built by **Hafsoh Bashar**.

## Install (Safari on Mac)
1. Get the free **Userscripts** app from the Mac App Store and turn it on in Safari › Settings › Extensions.
2. Open [trim.user.js](https://raw.githubusercontent.com/DhuniDesigns/Engineering-Builds/main/trim/trim.user.js) in Safari, click the Userscripts icon in the toolbar and choose **Install**.
3. Go to claude.ai, write a prompt of 20+ words and pause for a second.

Shortcuts: Option+T opens the preview any time · Enter uses it · Esc keeps yours.

## What it cuts
Greetings, "hope you're well", apologies, "thanks!" sign-offs, "I want you to", "could you please", hedges, filler words (basically, really, actually), long phrases ("in order to" → "to") and sentences said twice. Code, links and quoted text are never changed.

## Privacy
Everything runs in your browser. No account, no server, nothing sent anywhere.

## How it works
- A rules engine (plain JavaScript) shortens the text; tokens are estimated at about 4 characters each.
- The text goes back into claude.ai's ProseMirror editor as a paste, so the editor and send button stay in sync.
- The UI lives in a shadow root so claude.ai's styles can't break it, and it follows light and dark mode.

© 2026 Hafsoh Bashar
