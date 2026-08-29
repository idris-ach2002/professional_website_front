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
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
      sidebar: [
        { label: 'Atlas système', items: [{ autogenerate: { directory: 'overview' } }] },
        { label: 'Frontend', items: [{ autogenerate: { directory: 'frontend' } }] },
        { label: 'Front ↔ Back', items: [{ autogenerate: { directory: 'integration' } }] },
        { label: 'Cloud', items: [{ autogenerate: { directory: 'cloud' } }] },
        { label: 'Déploiement', items: [{ autogenerate: { directory: 'deployment' } }] },
        { label: 'Qualité', items: [{ autogenerate: { directory: 'quality' } }] },
        { label: 'Sécurité', items: [{ autogenerate: { directory: 'security' } }] },
        { label: 'Exploitation', items: [{ autogenerate: { directory: 'operations' } }] },
        { label: 'Décisions', items: [{ autogenerate: { directory: 'decisions' } }] },
        { label: 'Référence', items: [{ autogenerate: { directory: 'reference' } }] },
      ],
    }),
  ],
});
