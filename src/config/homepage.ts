import { publicRoutes, type PublicPath } from "../lib/routes/public.ts";

export const homepageSections = [
  { id: "capa", number: "01", label: "Capa" },
  { id: "trabalhos", number: "02", label: "Trabalhos" },
  { id: "publicacao", number: "03", label: "Presença" },
  { id: "indice", number: "04", label: "Índice" },
] as const;

export const homepageEditorialSelection = {
  coverWorkId: "kauan-felix-uma-noite-de-k-1",
  featuredWorkId: "nephillin-uma-cobertura-sem-credencial",
  featuredWorkIds: ["nephillin-uma-cobertura-sem-credencial", "feira-do-rolo"],
  coverMedia: {
    asset: "kauan-k1-01",
    decorative: false,
  },
} as const;

export interface HomepagePresenceItem {
  key: "sobre" | "contato";
  title: string;
  description: string;
  href: PublicPath;
  action: string;
}

export const homepageEditorialCopy = {
  coverLabel: "Publicação pessoal",
  coverStatus: "Fotografia documental / produção dirigida",
  coverPlaceholder: "Fotografia documental e produção dirigida.",
  enterLabel: "Ver trabalhos",
  featuredWorksCountLabel: (count: number) =>
    `${String(count).padStart(2, "0")} em destaque`,
  presenceLabel: "Apresentação e canais públicos",
  indexLabel: "Navegue por tudo",
  presence: [
    {
      key: "sobre",
      title: "Sobre",
      description:
        "Sou fotógrafo documental e editorial. Trabalho com histórias reais, luz natural e presença. Meu interesse está no cotidiano, na observação atenta e na construção de imagens que revelam o que, muitas vezes, passa despercebido.",
      href: publicRoutes.sobre,
      action: "Conhecer",
    },
    {
      key: "contato",
      title: "Contato",
      description:
        "Canais públicos para acompanhar o trabalho, solicitar orçamentos, imprensa e colaborações.",
      href: publicRoutes.contato,
      action: "Entrar em contato",
    },
  ] as const satisfies readonly HomepagePresenceItem[],
  indexGroups: {
    sobre: {
      action: "Ir para",
      items: [
        {
          icon: "profile",
          title: "Apresentação",
          description: "Mais sobre o autor e sua trajetória.",
        },
        {
          icon: "document",
          title: "Abordagem",
          description: "Como trabalha, equipamentos e ética.",
        },
      ],
    },
    contato: {
      action: "Acessar",
      items: [
        {
          icon: "send",
          title: "Canais públicos",
          description: "Redes e formas de contato.",
        },
        {
          icon: "briefcase",
          title: "Parcerias & Imprensa",
          description: "Colaborações, pautas e solicitações.",
        },
      ],
    },
  },
} as const;
