import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { configuredSiteUrl } from "./src/lib/seo/site-url.ts";

const siteUrl = configuredSiteUrl();

export default defineConfig({
  integrations: [mdx()],
  output: "static",
  site: siteUrl?.href,
  trailingSlash: "always",
});
