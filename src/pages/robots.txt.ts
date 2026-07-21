import type { APIRoute } from "astro";

import { renderRobotsTxt } from "../lib/seo/distribution.ts";
import { configuredSiteUrl } from "../lib/seo/site-url.ts";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(renderRobotsTxt(configuredSiteUrl()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
