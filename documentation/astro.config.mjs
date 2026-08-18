import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: "Portfolio Engineering \u00b7 Frontend",
      description: 'Documentation technique de l’état courant du système.',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/documentation.css'],
      lastUpdated: false,
      editLink: false,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
      sidebar: [
        { label: 'Atlas système', autogenerate: { directory: 'overview' } },
        { label: 'Frontend', autogenerate: { directory: 'frontend' } },
        { label: 'Front ↔ Back', autogenerate: { directory: 'integration' } },
        { label: 'Cloud', autogenerate: { directory: 'cloud' } },
        { label: 'Déploiement', autogenerate: { directory: 'deployment' } },
        { label: 'Qualité', autogenerate: { directory: 'quality' } },
        { label: 'Sécurité', autogenerate: { directory: 'security' } },
        { label: 'Exploitation', autogenerate: { directory: 'operations' } },
        { label: 'Décisions', autogenerate: { directory: 'decisions' } },
        { label: 'Référence', autogenerate: { directory: 'reference' } },
      ],
    }),
  ],
});
