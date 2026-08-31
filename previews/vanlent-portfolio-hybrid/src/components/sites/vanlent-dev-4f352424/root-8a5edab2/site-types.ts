export type SiteMode = "reference" | "hybrid";

export type Project = {
  id: string;
  name: string;
  secondary?: string;
  discipline: string;
  year: string;
  image: string;
  alt: string;
  description: string;
  href?: string;
};

export type Capability = {
  id: string;
  kicker: string;
  title: string;
  secondary?: string;
  description: string;
};
