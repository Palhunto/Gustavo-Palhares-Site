import { publicRoutes, type PublicPath } from "../lib/routes/public.ts";

export interface NavigationItem {
  href: PublicPath;
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
    { href: publicRoutes.trabalhosIndex, label: "Trabalhos" },
    { href: publicRoutes.cadernoIndex, label: "Caderno" },
    { href: publicRoutes.colecoesIndex, label: "Coleções" },
    { href: publicRoutes.sobre, label: "Sobre" },
    { href: publicRoutes.contato, label: "Contato" },
  ] as const satisfies readonly NavigationItem[],
  footerNavigation: [
    { href: publicRoutes.edicoesIndex, label: "Edições" },
  ] as const satisfies readonly NavigationItem[],
  contacts: [] as readonly PublicContact[],
  homepageStatus: "provisional" as const,
};
