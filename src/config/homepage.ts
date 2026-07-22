import { publicRoutes, type PublicPath } from "../lib/routes/public.ts";

export const homepageSections = [
  { id: "capa", number: "01", label: "Capa" },
  { id: "trabalhos", number: "02", label: "Trabalhos" },
  { id: "publicacao", number: "03", label: "Publicação e presença" },
  { id: "indice", number: "04", label: "Índice" },
] as const;

export const homepageEditorialSelection = {
  featuredWorkId: "nephillin-uma-cobertura-sem-credencial",
  coverMedia: {
    asset: "fase-5-show-03-silhueta",
    decorative: false,
  },
} as const;

export interface HomepagePresenceItem {
  key: "caderno" | "colecoes" | "edicoes" | "sobre" | "contato";
  title: string;
  placeholder: string;
  href: PublicPath;
  action: string;
}

export const homepageEditorialCopy = {
  coverLabel: "Publicação pessoal",
  coverStatus: "Conteúdo editorial em preparação",
  coverPlaceholder: "Conteúdo editorial em preparação.",
  enterLabel: "Entrar",
  worksCountLabel: (count: number) =>
    `${String(count).padStart(2, "0")} ${count === 1 ? "trabalho publicado" : "trabalhos publicados"}`,
  presenceLabel: "Texto, arquivo e contato",
  indexLabel: "Navegue por tudo",
  presenceState: {
    label: "Estado editorial",
    value: "Em preparação",
  },
  indexStates: {
    caderno: "Em preparação",
    colecoes: "Em desenvolvimento",
    edicoes: "Em desenvolvimento",
  },
  presence: [
    {
      key: "caderno",
      title: "Caderno",
      placeholder: "Novos textos serão reunidos aqui.",
      href: publicRoutes.cadernoIndex,
      action: "Ver Caderno",
    },
    {
      key: "colecoes",
      title: "Coleções",
      placeholder: "Coleções em desenvolvimento.",
      href: publicRoutes.colecoesIndex,
      action: "Explorar",
    },
    {
      key: "edicoes",
      title: "Edições",
      placeholder: "Edições futuras serão apresentadas nesta área.",
      href: publicRoutes.edicoesIndex,
      action: "Ver edições",
    },
    {
      key: "sobre",
      title: "Sobre",
      placeholder: "Informações de apresentação em revisão.",
      href: publicRoutes.sobre,
      action: "Conhecer",
    },
    {
      key: "contato",
      title: "Contato",
      placeholder: "Canais para projetos, parcerias e conversas.",
      href: publicRoutes.contato,
      action: "Entrar em contato",
    },
  ] as const satisfies readonly HomepagePresenceItem[],
} as const;
