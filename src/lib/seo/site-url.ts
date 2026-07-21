import { isIP } from "node:net";

const RESERVED_PUBLIC_SUFFIXES = [".test", ".invalid", ".example"];

function configuredValue(): string | undefined {
  return import.meta.env?.SITE_URL ?? process.env.SITE_URL;
}

export function normalizeSiteUrl(value?: string): URL | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`SITE_URL inválida: "${normalized}" não é uma URL.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("SITE_URL inválida: use somente HTTP ou HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("SITE_URL inválida: credenciais não são permitidas.");
  }
  if (url.search || url.hash) {
    throw new Error("SITE_URL inválida: query e fragmento não são permitidos.");
  }

  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url;
}

export function configuredSiteUrl(): URL | undefined {
  return normalizeSiteUrl(configuredValue());
}

function isPrivateIpv4(hostname: string): boolean {
  const [a, b] = hostname.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a === 0
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const value = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    /^fe[89ab]/.test(value)
  );
}

function publicHostnameError(hostname: string): string | undefined {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    RESERVED_PUBLIC_SUFFIXES.some(
      (suffix) => normalized === suffix.slice(1) || normalized.endsWith(suffix),
    )
  ) {
    return "use um domínio público, não reservado para testes";
  }

  const ipHostname = normalized.replace(/^\[|\]$/g, "");
  const addressType = isIP(ipHostname);
  if (
    (addressType === 4 && isPrivateIpv4(ipHostname)) ||
    (addressType === 6 && isPrivateIpv6(ipHostname))
  ) {
    return "endereços locais ou privados não são permitidos";
  }
  return undefined;
}

export function requirePublicSiteUrl(value = configuredValue()): URL {
  const url = normalizeSiteUrl(value);
  if (!url) {
    throw new Error(
      "SITE_URL é obrigatória para build público. Informe uma URL HTTP(S) pública.",
    );
  }

  const hostnameError = publicHostnameError(url.hostname);
  if (hostnameError) {
    throw new Error(`SITE_URL inválida para build público: ${hostnameError}.`);
  }
  return url;
}

function normalizedInternalPath(pathname: string, trailingSlash: boolean) {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    throw new Error(`Caminho interno inválido para URL absoluta: ${pathname}`);
  }
  if (pathname.includes("?") || pathname.includes("#")) {
    throw new Error("Canonical não pode conter query ou fragmento.");
  }

  const path = pathname.replace(/\/{2,}/g, "/");
  if (path === "/") return path;
  return trailingSlash
    ? `${path.replace(/\/+$/, "")}/`
    : path.replace(/\/+$/, "");
}

function joinWithBase(base: URL, pathname: string): URL {
  const result = new URL(base.href);
  const basePath =
    base.pathname === "/" ? "" : base.pathname.replace(/\/+$/, "");
  result.pathname = `${basePath}${pathname}`;
  result.search = "";
  result.hash = "";
  return result;
}

export function absoluteCanonicalUrl(pathname: string, base: URL): string {
  return joinWithBase(base, normalizedInternalPath(pathname, true)).href;
}

export function absoluteSiteFileUrl(pathname: string, base: URL): string {
  return joinWithBase(base, normalizedInternalPath(pathname, false)).href;
}

export function optionalCanonicalUrl(
  pathname: string,
  base = configuredSiteUrl(),
): string | undefined {
  return base ? absoluteCanonicalUrl(pathname, base) : undefined;
}
