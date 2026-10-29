// Cloudflare Worker for the /ask/ page. GitHub Pages keeps hosting the site;
// this only holds the API key and streams answers. See CLAUDE.md (Ask page).
// ASK_ENGINE picks who composes the answer: "claude" (a model writes the
// patches, ANTHROPIC_API_KEY) or "jev" (typesafe-ai/jev picks candidates via
// Vercel AI Gateway, AI_GATEWAY_API_KEY).
import { createAnthropic } from "@ai-sdk/anthropic";
import { experimental_createEvaluator } from "@json-render/core";
import { createAskHandler, createModelEngine, createSiteDataLoader } from "../../lib/ask/server.mjs";
import { createJevEngine } from "../../lib/ask/jev.mjs";

const engines = {
  claude: (env) => createModelEngine(createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(env.ASK_MODEL)),
  jev: (env) => createJevEngine({ evaluate: experimental_createEvaluator({ apiKey: env.AI_GATEWAY_API_KEY, model: env.JEV_MODEL }) }),
};

let handler;

export default {
  fetch(request, env) {
    if (!handler) {
      const engine = engines[env.ASK_ENGINE];
      if (!engine) throw new Error(`Unknown ASK_ENGINE ${JSON.stringify(env.ASK_ENGINE)}; use ${Object.keys(engines).join(" or ")}`);
      handler = createAskHandler({
        engine: engine(env),
        loadSiteData: createSiteDataLoader(env.SITE_URL),
        allowedOrigins: env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()),
        rateLimit: { limit: Number(env.RATE_LIMIT_PER_HOUR), windowMs: 60 * 60_000 },
      });
    }
    return handler(request);
  },
};
