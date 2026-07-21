export type PublicRoute = "/" | "/sobre" | "/contato";

export interface NavigationItem {
  href: PublicRoute;
  label: string;
}

export interface PublicContact {
  label: string;
  href: string;
}

export const siteConfig = {
  name: "Gustavo Palhares",
  shortIdentity: "Publicação digital pessoal",
  locale: "pt-BR",
  description: "Publicação digital pessoal de Gustavo Palhares.",
  navigation: [
    { href: "/", label: "Início" },
    { href: "/sobre", label: "Sobre" },
    { href: "/contato", label: "Contato" },
  ] as const satisfies readonly NavigationItem[],
  contacts: [] as readonly PublicContact[],
  homepageStatus: "provisional" as const,
};
