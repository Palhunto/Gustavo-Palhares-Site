import type { APIRoute } from "astro";

import { loadContentFromDisk } from "../lib/content/index.ts";
import { renderSitemapXml } from "../lib/seo/distribution.ts";
import { configuredSiteUrl } from "../lib/seo/site-url.ts";

export const prerender = true;

export const GET: APIRoute = async () => {
  const dataset = await loadContentFromDisk(process.cwd());
  return new Response(renderSitemapXml(dataset, configuredSiteUrl()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
