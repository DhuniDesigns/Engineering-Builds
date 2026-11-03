# Dhuni Designs: Portfolio

The personal portfolio of **Hafsoh Bashar**, product designer and design engineer in Lagos. Designed in Figma, built in plain HTML, CSS and JavaScript.

Blueprint loader · animated 3D cloud mascot · theme switch that blooms out of the icon · lyric-style "design engineering" · product previews on hover · bookshelf where books turn to show their covers · hobby stickers that gather as you scroll · synthesised UI sounds · live Apple Music "Now playing"

## Apple Music

`api/now-playing.js` returns your most recently played track. Add these in Vercel (Project → Settings → Environment Variables), then redeploy:

| Name | What it is |
| --- | --- |
| `APPLE_TEAM_ID` | your Apple Developer Team ID |
| `APPLE_KEY_ID` | the Key ID of a MusicKit key |
| `APPLE_PRIVATE_KEY` | the whole contents of that key's `.p8` file |
| `APPLE_MUSIC_USER_TOKEN` | the token `/connect-apple-music.html` shows after you sign in |

Once connected, delete `connect-apple-music.html` and `api/dev-token.js`.

© 2026 Hafsoh Bashar
