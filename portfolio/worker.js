// Cloudflare Worker: serves the site's files and answers /api/now-playing
import { onRequestGet as nowPlaying } from "./functions/api/now-playing.js";
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/now-playing") return nowPlaying({ request, env });
    return env.ASSETS.fetch(request);
  },
};
