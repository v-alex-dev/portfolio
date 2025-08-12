export type Project = {
  slug: string; // unique slug for URL
  title: string;
  description: string;
  image: string; // URL or path to public image
  technologies: string[]; // frameworks, tools
  languages: string[]; // programming languages
  repoUrl?: string;
  demoUrl?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
};
