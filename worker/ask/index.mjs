// Cloudflare Worker for the /ask/ page. GitHub Pages keeps hosting the site;
// this only holds the API key and streams answers. See CLAUDE.md (Ask page).
import { createAnthropic } from "@ai-sdk/anthropic";
import { createAskHandler, createSiteDataLoader } from "../../lib/ask/server.mjs";

let handler;

export default {
  fetch(request, env) {
    handler ??= createAskHandler({
      model: createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(env.ASK_MODEL),
      loadSiteData: createSiteDataLoader(env.SITE_URL),
      allowedOrigins: env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()),
      rateLimit: { limit: Number(env.RATE_LIMIT_PER_HOUR), windowMs: 60 * 60_000 },
    });
    return handler(request);
  },
};
