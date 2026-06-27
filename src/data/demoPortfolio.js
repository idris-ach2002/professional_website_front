// Mock local enrichi : même forme que le JSON public importable côté backend.
// Il sert de fallback quand /website/default est indisponible en développement local.

export const demoOwner = {
  "name": "ACHABOU",
  "firstName": "Idris",
  "age": 23,
  "active": true,
  "address": "Choisy-le-Roi, Île-de-France",
  "contacts": [
    {
      "type": "EMAIL",
      "value": "achabou02idris@gmail.com"
    },
    {
      "type": "PHONE_NUMBER",
      "value": "07 44 75 85 10"
    },
    {
      "type": "GITHUB",
      "value": "https://github.com/idris-ach2002"
    },
    {
      "type": "LINKEDIN",
      "value": "https://www.linkedin.com/in/idris-achabou"
    }
  ],
  "versionTag": "v1-github-cv-stage-case-studies",
  "versionLabel": "Version enrichie études de cas + compétences prouvées",
  "versionDescription": "Version adaptée pour les pages publiques de projets et la section compétences prouvées. Les projets publiés ont été enrichis à partir du JSON courant, des liens GitHub publics et des rapports/documentations disponibles.",
  "versionPublished": true,
  "versionActive": true,
  "prof": {
    "title": "Développeur Java Full Stack",
    "subtitle": "Java 21 / Spring Boot / React / PostgreSQL",
    "headline": "Étudiant en Master Informatique STL à Sorbonne Université, orienté ingénierie logicielle, backend robuste, interfaces métier et qualité applicative.",
    "shortDescription": "Portfolio professionnel centré sur le développement Java full stack, les API REST, les bases PostgreSQL, les interfaces web métier et les projets académiques avancés.",
    "description": "Je conçois des applications structurées avec une attention forte portée à la robustesse, à la maintenabilité et à la qualité des traitements. Mes projets couvrent le backend Java/Spring Boot, les interfaces React/Symfony, les bases PostgreSQL, les pipelines de données, la visualisation de graphes, la compilation, la concurrence et les architectures distribuées. Je recherche une alternance en développement Java full stack à partir de septembre 2026 en Île-de-France.",
    "location": "Choisy-le-Roi, Île-de-France",
    "availability": "Disponible pour une alternance à partir de septembre 2026 en Île-de-France",
    "profileImageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781597611/portfolio/IMG_20240914_160454-3-13b650b8-45d9-405d-9645-fe7a6db2def6.jpg",
    "logoUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781597613/portfolio/logo-4bae229a-7752-4ba6-a9ed-b5b992934b39.png",
    "cvUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781597614/portfolio/cv_altern_idris_achabou-58766b94-adf7-433e-8491-f7350fe43786.pdf",
    "portfolioUrl": ""
  },
  "timeline": {
    "title": "Parcours",
    "description": "Formation, stage, expériences professionnelles et projets techniques structurants.",
    "experiences": [
      {
        "category": "CDI",
        "title": "Assistant logistique / préparateur de commandes",
        "organization": "La Belle Vie / Deleev",
        "location": "Île-de-France",
        "summary": "CDI étudiant en environnement opérationnel exigeant.",
        "description": "Préparation de commandes, organisation logistique, respect des délais, rigueur opérationnelle, autonomie et accompagnement d'équipe dans un contexte où la fiabilité d'exécution est essentielle.",
        "startDate": "2025-11-01",
        "endDate": null,
        "currentPosition": true,
        "imageUrl": "",
        "websiteUrl": "",
        "skills": [
          "Rigueur",
          "Organisation",
          "Priorisation",
          "Travail en équipe",
          "Autonomie",
          "Fiabilité opérationnelle"
        ],
        "displayOrder": 2
      },
      {
        "category": "SCHOOL",
        "title": "Master Informatique — parcours Science et Technologie du Logiciel",
        "organization": "Sorbonne Université",
        "location": "Paris",
        "summary": "Formation orientée ingénierie logicielle, fiabilité, tests, programmation web, concurrence et environnements de développement.",
        "description": "Master centré sur la conception logicielle, les systèmes concurrents, la programmation web avancée, la qualité logicielle et les architectures robustes. Cette formation sert de socle aux projets Java, backend, compilation, concurrence et développement full stack.",
        "startDate": "2025-09-01",
        "endDate": null,
        "currentPosition": true,
        "imageUrl": "",
        "websiteUrl": "https://sciences.sorbonne-universite.fr/formation-sciences/offre-de-formation/masters/master-informatique",
        "skills": [
          "Java",
          "Architecture logicielle",
          "Tests",
          "Programmation web",
          "Concurrence",
          "Génie logiciel",
          "Environnements de développement"
        ],
        "displayOrder": 1
      },
      {
        "category": "INTERNSHIP",
        "title": "Stage développement logiciel / data",
        "organization": "LITIS — Université Le Havre Normandie",
        "location": "Le Havre",
        "summary": "Refonte d'une architecture de récupération, stockage et exploitation de données AIS.",
        "description": "Stage de fin d'études consacré à la refonte de l'architecture de récupération des données AIS. Le travail a couvert trois axes : collecte robuste de messages AIS, intégration massive dans PostgreSQL et interface web de filtrage/export. Réalisations : connecteur TCP Java, archivage horaire, décodage parallèle, modélisation relationnelle, pipelines d'insertion, supervision systemd et interface Symfony/Twig/Tailwind.",
        "startDate": "2025-04-07",
        "endDate": "2025-06-06",
        "currentPosition": false,
        "imageUrl": "",
        "websiteUrl": "https://www.litislab.fr",
        "skills": [
          "Java 21",
          "Maven",
          "TCP",
          "AIS",
          "NMEA",
          "PostgreSQL",
          "Python",
          "Symfony",
          "Twig",
          "Tailwind",
          "systemd",
          "Linux",
          "CSV Export"
        ],
        "displayOrder": 3
      },
      {
        "category": "CDD",
        "title": "Équipier polyvalent",
        "organization": "KFC Le Havre — Centre Commercial Docks Vauban",
        "location": "Centre Commercial Docks Vauban, Quai des Antilles, 76600 Le Havre",
        "summary": "Expérience de deux ans en restauration rapide avec rythme soutenu et contact client.",
        "description": "Travail opérationnel en équipe dans un environnement à forte cadence : préparation, service, respect des procédures, hygiène, gestion des priorités et adaptation aux pics d'activité.",
        "startDate": "2023-07-01",
        "endDate": "2025-08-31",
        "currentPosition": false,
        "imageUrl": "",
        "websiteUrl": "",
        "skills": [
          "Travail en équipe",
          "Gestion du rythme",
          "Service client",
          "Respect des procédures",
          "Adaptabilité",
          "Ponctualité"
        ],
        "displayOrder": 4
      },
      {
        "category": "SCHOOL",
        "title": "Licence Informatique — mention Très Bien",
        "organization": "Université Le Havre Normandie",
        "location": "Le Havre",
        "summary": "Licence informatique validée avec mention Très Bien.",
        "description": "Formation théorique et pratique couvrant bases de données, IHM, systèmes, algorithmique, génie logiciel et développement web, consolidée par un stage de fin de cursus au LITIS.",
        "startDate": "2022-09-01",
        "endDate": "2025-06-30",
        "currentPosition": false,
        "imageUrl": "",
        "websiteUrl": "https://www.univ-lehavre.fr",
        "skills": [
          "Algorithmique",
          "Bases de données",
          "IHM",
          "Systèmes",
          "Génie logiciel",
          "Développement web",
          "SQL"
        ],
        "displayOrder": 5
      }
    ]
  },
  "projects": [
    {
      "title": "Portfolio professionnel — Frontend animé",
      "subtitle": "React / Mantine / Tailwind / GSAP / Three.js",
      "shortDescription": "Frontend React immersif et administrable qui transforme le portfolio en interface produit : données API, fallback local, sections publiques, viewers médias et animations GSAP/Three.js.",
      "description": "Étude de cas frontend d’un portfolio professionnel dynamique. Le projet construit une interface React/Mantine/Tailwind orientée recruteur, connectée au backend Spring Boot et capable de fonctionner avec un mock local si l’API est indisponible. La valeur technique vient de l’orchestration entre expérience utilisateur, animations GSAP, scènes Three.js/Rapier, viewers PDF/image, routage public et données portfolio administrables.",
      "status": "IN_PROGRESS",
      "startDate": "2026-01-01",
      "endDate": null,
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781988638/portfolio/Capture-d-ecran-du-2026-06-10-18-46-25-11491f85-7538-47d2-ac50-464e741f0b16.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/professional_website_front",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781988640/portfolio/Rapport_Portfolio_Professionnel-cc57b2cf-bfaa-4e49-9b60-60d7819bf481.pdf",
      "stacks": [
        "React",
        "Mantine",
        "Tailwind CSS",
        "GSAP",
        "Three.js",
        "React Three Fiber",
        "Rapier",
        "Vite",
        "Cloudflare Workers"
      ],
      "features": [
        "Frontend React/Vite connecté à une API portfolio avec fallback mock local.",
        "Sections publiques orientées recruteur : profil, timeline, projets, compétences prouvées et études de cas.",
        "Animations GSAP au scroll, navigation premium et interactions visuelles contrôlées.",
        "Intégration Three.js/R3F/Rapier pour enrichir l’identité visuelle sans bloquer l’usage.",
        "Viewer PDF/image, modales, liens GitHub et documentation exploitables depuis les projets.",
        "Déploiement Cloudflare Workers Assets avec build Vite et configuration SPA."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/professional_website_front"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781988640/portfolio/Rapport_Portfolio_Professionnel-cc57b2cf-bfaa-4e49-9b60-60d7819bf481.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 1,
      "websiteVersionId": null,
      "slug": "portfolio-professionnel-frontend-anime",
      "proofTags": [
        "Frontend",
        "React",
        "GSAP",
        "Three.js",
        "Mantine",
        "Responsive",
        "Cloudflare",
        "UI produit"
      ],
      "caseStudy": {
        "problem": "Présenter un profil logiciel de façon plus convaincante qu’un portfolio statique, tout en gardant une lecture rapide pour un recruteur.",
        "role": "Conception front, intégration API, composants publics, animations GSAP, routage, fallback mock, amélioration UX et stabilisation responsive.",
        "architecture": "Application React/Vite structurée en composants publics, services API, données de secours, routes React Router et couches d’animation GSAP/Three.js isolées.",
        "technicalChoices": [
          "React/Mantine pour un socle UI maintenable et responsive.",
          "GSAP/ScrollTrigger pour des animations scrollytelling maîtrisées.",
          "Three.js/R3F/Rapier pour les scènes immersives sans mélanger la logique métier.",
          "Fallback local pour garder le portfolio présentable même si le backend est indisponible."
        ],
        "challenges": [
          "Maintenir une expérience fluide malgré des animations nombreuses.",
          "Éviter que les effets visuels masquent les informations utiles au recruteur.",
          "Conserver un rendu stable en desktop et mobile.",
          "Gérer les liens, fichiers PDF et images dans une interface cohérente."
        ],
        "outcomes": [
          "Portfolio public différenciant, administrable et visuellement signé.",
          "Base prête pour des pages projet détaillées et une section compétences prouvées.",
          "Expérience recruteur plus directe grâce aux preuves, liens et exports."
        ],
        "nextSteps": "Ajouter un mode recruteur condensé et un export dossier candidat."
      },
      "id": 201
    },
    {
      "title": "Portfolio professionnel — Backend Spring Boot",
      "subtitle": "Java 21 / Spring Boot / PostgreSQL",
      "shortDescription": "Backend Spring Boot qui centralise profil, timeline, projets, versions du site, fichiers, sécurité, génération de CV et modules candidature.",
      "description": "Étude de cas backend du portfolio professionnel. Le projet expose une API Spring Boot pour stocker et publier un portfolio versionné : owner, profil, timeline, projets, contacts et versions actives. Il intègre PostgreSQL/Flyway, sécurité admin, upload local ou Cloudinary, génération de CV LaTeX, suivi de candidatures et déploiement Docker/Render.",
      "status": "IN_PROGRESS",
      "startDate": "2026-01-01",
      "endDate": null,
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781988801/portfolio/Capture-d-ecran-du-2026-06-20-22-52-41-e7cd2226-b982-40f1-9c6d-5859d2b89187.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/professional_website",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781988803/portfolio/Rapport_Portfolio_Professionnel-654d519c-d3d9-4d3e-874f-4dc31affe3ba.pdf",
      "stacks": [
        "Java 21",
        "Spring Boot",
        "PostgreSQL",
        "JPA",
        "Hibernate",
        "Flyway",
        "Docker",
        "Validation",
        "Maven"
      ],
      "features": [
        "API REST publique et protégée pour owner, profil, timeline, projets, contacts et versions.",
        "Versioning de portfolio avec duplication et contrainte de version active unique.",
        "Persistance PostgreSQL avec JPA/Hibernate et migrations Flyway.",
        "Sécurité admin avec Spring Security, CSRF, CORS et redirections contrôlées.",
        "Upload local ou Cloudinary pour images, PDF, CV et documents liés au portfolio.",
        "Modules CV Builder et candidatures avec génération LaTeX/PDF, export ZIP et analyse d’offre."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/professional_website"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781988803/portfolio/Rapport_Portfolio_Professionnel-654d519c-d3d9-4d3e-874f-4dc31affe3ba.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 2,
      "websiteVersionId": null,
      "slug": "portfolio-professionnel-backend-spring-boot",
      "proofTags": [
        "Backend",
        "Spring Boot",
        "Java 21",
        "PostgreSQL",
        "JPA",
        "Flyway",
        "Docker",
        "Versioning",
        "Security",
        "CV Builder"
      ],
      "caseStudy": {
        "problem": "Passer d’un portfolio statique à une plateforme de contenu administrable, versionnée et déployable.",
        "role": "Conception du modèle, API REST, services métier, sécurité, stockage fichiers, versioning, génération CV et préparation déploiement Docker.",
        "architecture": "Backend Spring Boot organisé autour des entités Owner, Profile, Timeline, Experience, Project et WebsiteVersion, avec DTO, mappers, repositories JPA et services métier.",
        "technicalChoices": [
          "Java 21/Spring Boot pour structurer une API backend maintenable.",
          "PostgreSQL/Flyway pour persister les versions et garder un schéma maîtrisé.",
          "Cloudinary en production pour éviter la perte de fichiers sur Render free.",
          "Docker multi-stage pour packager le backend et les dépendances LaTeX."
        ],
        "challenges": [
          "Garantir une seule version active malgré les duplications.",
          "Séparer routes publiques et routes d’administration.",
          "Gérer des fichiers persistants dans un environnement cloud gratuit.",
          "Intégrer une chaîne CV LaTeX sans bloquer l’API."
        ],
        "outcomes": [
          "Backend robuste pour publier et maintenir plusieurs versions du portfolio.",
          "Socle extensible vers recruiter pack, matching d’offre et pages publiques enrichies.",
          "Architecture suffisamment documentée pour être présentée comme projet full stack."
        ],
        "nextSteps": "Ajouter des champs publics dédiés aux études de cas ou une table ProjectCaseStudy si l’on veut persister ces contenus côté backend."
      },
      "id": 202
    },
    {
      "title": "AIS Java 2025 — Collecte robuste de données AIS",
      "subtitle": "Java 21 / Maven / Linux / systemd",
      "shortDescription": "Connecteur Java de collecte AIS en continu : connexion TCP, archivage horaire, décodage parallèle, résilience réseau et supervision systemd.",
      "description": "Sous-projet LITIS consacré à la collecte continue de messages AIS. Le connecteur Java remplace une chaîne fragile par une architecture plus robuste : lecture TCP depuis AIS Hub, écriture de fichiers horaires, décodage parallèle, relance automatique et intégration systemd pour un fonctionnement serveur.",
      "status": "COMPLETED",
      "startDate": "2025-04-07",
      "endDate": "2025-06-06",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781988957/portfolio/Capture-d-ecran-du-2025-05-28-10-42-37-e762942e-3f13-420a-b2cc-6cc6ff623402.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/ais-java-2025",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781988959/portfolio/Rapport_Stage_Idris_Achabou-c461e571-0c62-4af0-b61d-b51daf39a489.pdf",
      "stacks": [
        "Java 21",
        "Maven",
        "TCP",
        "NMEA",
        "Linux",
        "systemd",
        "Shell",
        "ANTLR"
      ],
      "features": [
        "Connexion TCP continue à AIS Hub avec gestion des coupures réseau.",
        "Archivage horaire des messages AIS pour faciliter le traitement batch.",
        "Écriture optimisée par blocs afin de limiter les coûts I/O.",
        "Décodage parallèle des fichiers terminés pour accélérer l’exploitation.",
        "Service systemd avec démarrage au boot et redémarrage automatique.",
        "Base modulaire Java/Maven adaptée à un contexte serveur Linux."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/ais-java-2025"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781988959/portfolio/Rapport_Stage_Idris_Achabou-c461e571-0c62-4af0-b61d-b51daf39a489.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 3,
      "websiteVersionId": null,
      "slug": "ais-java-2025-collecte-robuste-de-donnees-ais",
      "proofTags": [
        "Java",
        "TCP",
        "AIS",
        "NMEA",
        "Linux",
        "systemd",
        "Data pipeline",
        "Robustesse"
      ],
      "caseStudy": {
        "problem": "Fiabiliser la récupération de flux AIS continus pour éviter les pertes de données et les interruptions manuelles.",
        "role": "Développement du connecteur Java, structuration Maven, gestion I/O, scripts Linux, service systemd et documentation de déploiement.",
        "architecture": "Pipeline Java serveur : connexion TCP, bufferisation, archivage horaire, décodage asynchrone et supervision systemd.",
        "technicalChoices": [
          "Java 21/Maven pour une base portable et structurée.",
          "Découpage par fichiers horaires pour faciliter l’ingestion PostgreSQL en aval.",
          "systemd pour la robustesse opérationnelle sur serveur Linux.",
          "Gestion explicite des erreurs réseau et relance automatique."
        ],
        "challenges": [
          "Maintenir une collecte continue malgré les coupures.",
          "Éviter les écritures trop fréquentes sur disque.",
          "Séparer collecte en temps réel et décodage des fichiers finalisés.",
          "Rendre le service relançable sans intervention manuelle."
        ],
        "outcomes": [
          "Collecte AIS stabilisée sur un environnement Linux.",
          "Chaîne exploitable pour l’ingestion massive en base.",
          "Expérience concrète en backend Java orienté robustesse et données."
        ],
        "nextSteps": "Ajouter métriques Prometheus, tests de charge et journalisation structurée."
      },
      "id": 203
    },
    {
      "title": "BDD AIS — Base massive PostgreSQL",
      "subtitle": "PostgreSQL / Java / Python / PLpgSQL",
      "shortDescription": "Base PostgreSQL et pipelines d’ingestion pour exploiter de grands volumes AIS : modélisation, contraintes, PLpgSQL, Java/Python et bulk insert.",
      "description": "Sous-projet LITIS dédié à la persistance des données AIS. Le travail couvre la modélisation relationnelle, la normalisation des entités maritimes, les scripts SQL/PLpgSQL, l’insertion massive de CSV compressés et l’automatisation des traitements Java/Python/Shell.",
      "status": "COMPLETED",
      "startDate": "2025-04-07",
      "endDate": "2025-06-06",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989364/portfolio/pipeline_insertion-4c0cbcd3-6e4f-4eac-854f-d9d82d20248f.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/bdd-ais",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989366/portfolio/Rapport_Stage_Idris_Achabou-688c74de-6151-4aea-87b7-1472b0a4a60e.pdf",
      "stacks": [
        "PostgreSQL",
        "PLpgSQL",
        "Java",
        "Python",
        "SQL",
        "Shell",
        "CSV.gz",
        "Bulk Insert"
      ],
      "features": [
        "Modélisation relationnelle des entités AIS statiques et dynamiques.",
        "Contraintes d’intégrité pour fiabiliser les navires, positions et métadonnées.",
        "Ingestion massive de fichiers CSV.gz avec pipelines automatisés.",
        "Scripts Java/Python/Shell pour transformer et charger les données.",
        "Utilisation de PLpgSQL pour structurer des traitements côté base.",
        "Documentation technique séparée par prérequis, lancement, données statiques et dynamiques."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/bdd-ais"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989366/portfolio/Rapport_Stage_Idris_Achabou-688c74de-6151-4aea-87b7-1472b0a4a60e.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 4,
      "websiteVersionId": null,
      "slug": "bdd-ais-base-massive-postgresql",
      "proofTags": [
        "Data",
        "PostgreSQL",
        "PLpgSQL",
        "Java",
        "Python",
        "Bulk Insert",
        "CSV.gz",
        "Pipeline"
      ],
      "caseStudy": {
        "problem": "Rendre exploitables de grands volumes de messages AIS en base relationnelle, sans perdre la cohérence métier.",
        "role": "Conception du schéma, scripts SQL, pipelines d’insertion, automatisation et documentation technique.",
        "architecture": "Chaîne data composée de fichiers AIS/CSV.gz, scripts de préparation, chargement PostgreSQL, tables normalisées et fonctions PLpgSQL.",
        "technicalChoices": [
          "PostgreSQL pour les contraintes, requêtes analytiques et évolutions futures.",
          "Bulk insert pour accélérer le chargement de fichiers volumineux.",
          "Séparation données statiques/dynamiques pour clarifier le modèle.",
          "Automatisation shell/Python/Java pour rendre le processus reproductible."
        ],
        "challenges": [
          "Traiter des volumes importants sans bloquer l’insertion.",
          "Normaliser les entités tout en conservant les données utiles.",
          "Maintenir des chemins et configurations adaptables.",
          "Documenter une chaîne data complète et reproductible."
        ],
        "outcomes": [
          "Base AIS exploitable pour filtrage, export et analyses.",
          "Pipeline relié aux autres sous-projets LITIS.",
          "Preuve forte en PostgreSQL, ingestion et modélisation data."
        ],
        "nextSteps": "Ajouter indexation géospatiale/PostGIS et mesures de performance détaillées."
      },
      "id": 204
    },
    {
      "title": "AIS Website — Filtrage et export des données AIS",
      "subtitle": "Symfony / Twig / Tailwind / PostgreSQL",
      "shortDescription": "Interface Symfony/Twig pour explorer les données AIS : filtres métier, pagination, export CSV et requêtes PostgreSQL.",
      "description": "Application web réalisée pendant le stage LITIS pour consulter et exploiter les données AIS stockées dans PostgreSQL. Elle fournit des filtres par zone, période, MMSI et type de navire, une pagination pour stabiliser les performances et un export CSV des résultats.",
      "status": "COMPLETED",
      "startDate": "2025-05-01",
      "endDate": "2025-06-06",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989048/portfolio/filtrage-9509a971-af47-44e5-8cf2-0dc9e3da84d9.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/AIS_WEBSITE",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989051/portfolio/Rapport_Stage_Idris_Achabou-b480327b-0e5c-4f23-9cad-da9b33c729aa.pdf",
      "stacks": [
        "PHP",
        "Symfony",
        "Twig",
        "Tailwind CSS",
        "PostgreSQL",
        "Doctrine",
        "Webpack",
        "CSV Export"
      ],
      "features": [
        "Filtres métier sur zone géographique, période, MMSI et types de navires.",
        "Pagination pour éviter les pages trop lourdes sur de grands volumes.",
        "Export CSV des résultats filtrés pour l’exploitation externe.",
        "Contrôleurs et repositories orientés requêtes PostgreSQL.",
        "Templates Twig/Tailwind conçus pour une interface métier lisible.",
        "Base extensible vers cartographie interactive et suivi temps réel."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/AIS_WEBSITE"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989051/portfolio/Rapport_Stage_Idris_Achabou-b480327b-0e5c-4f23-9cad-da9b33c729aa.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 5,
      "websiteVersionId": null,
      "slug": "ais-website-filtrage-et-export-des-donnees-ais",
      "proofTags": [
        "Symfony",
        "Twig",
        "PostgreSQL",
        "Doctrine",
        "Filtres métier",
        "CSV Export",
        "UX métier"
      ],
      "caseStudy": {
        "problem": "Permettre à un utilisateur métier de filtrer et exporter des données AIS volumineuses sans manipuler directement SQL.",
        "role": "Développement Symfony, templates Twig, intégration PostgreSQL, filtres, pagination et export CSV.",
        "architecture": "Application Symfony structurée autour de contrôleurs, repositories, templates Twig et base PostgreSQL AIS.",
        "technicalChoices": [
          "Symfony/Twig pour livrer vite une interface métier côté serveur.",
          "Pagination pour préserver le temps de réponse.",
          "Export CSV pour relier l’interface aux usages d’analyse.",
          "Tailwind pour une UI claire et rapide à ajuster."
        ],
        "challenges": [
          "Rendre lisibles des données techniques AIS.",
          "Conserver des performances stables lors des filtrages.",
          "Éviter une interface trop dense pour l’utilisateur final.",
          "Coordonner modèle PostgreSQL et filtres applicatifs."
        ],
        "outcomes": [
          "Interface exploitable pour interroger la base AIS.",
          "Lien complet entre collecte, base et consultation web.",
          "Preuve concrète d’intégration backend/data/frontend."
        ],
        "nextSteps": "Ajouter carte interactive, filtres sauvegardés et prévisualisation géographique."
      },
      "id": 205
    },
    {
      "title": "Visualisation de graphes haute performance",
      "subtitle": "JavaFX / JOGL / C / JNI",
      "shortDescription": "Application JavaFX/JOGL avec moteur natif C/JNI pour charger, visualiser, layout et exporter des graphes.",
      "description": "Projet académique de visualisation de graphes combinant une interface JavaFX/JOGL et un moteur natif C chargé via JNI. L’objectif est de séparer l’UI du calcul lourd, charger des graphes CSV/DOT, appliquer des layouts ou algorithmes de communautés et exporter des rendus.",
      "status": "COMPLETED",
      "startDate": "2026-01-01",
      "endDate": "2026-05-18",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781596719/portfolio/app_visu_graphes-888398d7-8301-448e-8c8b-76a48e3006c8.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/PSTL_25_visualisation_graphes",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781596721/portfolio/rapport_pstl-62ef94a7-4afb-4f72-a4b5-a710f3ded16b.pdf",
      "stacks": [
        "Java 21",
        "JavaFX",
        "JOGL",
        "OpenGL",
        "C",
        "JNI",
        "Maven",
        "Make",
        "GCC"
      ],
      "features": [
        "Application JavaFX avec rendu graphique accéléré via JOGL/OpenGL.",
        "Moteur natif C chargé depuis Java via JNI.",
        "Chargement de graphes depuis CSV ou DOT.",
        "Séparation claire entre interface Java et calculs natifs.",
        "Scripts de compilation native et lancement via Maven.",
        "Export de rendus graphiques et exemples de graphes fournis."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/PSTL_25_visualisation_graphes"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781596721/portfolio/rapport_pstl-62ef94a7-4afb-4f72-a4b5-a710f3ded16b.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 6,
      "websiteVersionId": null,
      "slug": "visualisation-de-graphes-haute-performance",
      "proofTags": [
        "Graphique",
        "JavaFX",
        "JOGL",
        "OpenGL",
        "JNI",
        "C",
        "Performance",
        "Architecture"
      ],
      "caseStudy": {
        "problem": "Visualiser des graphes de manière interactive tout en isolant les calculs lourds du rendu Java.",
        "role": "Intégration Java/C, lancement Maven, compilation native, interface JavaFX/JOGL et validation runtime.",
        "architecture": "Deux modules principaux : graph-ui pour l’interface JavaFX/JOGL et graph-native pour le moteur C chargé via JNI.",
        "technicalChoices": [
          "JavaFX pour l’interface applicative desktop.",
          "JOGL/OpenGL pour le rendu graphique accéléré.",
          "C/JNI pour externaliser les calculs et expérimenter avec du natif.",
          "Scripts Make/Maven pour rendre le lancement reproductible."
        ],
        "challenges": [
          "Faire dialoguer proprement Java et C via JNI.",
          "Gérer les erreurs de bibliothèque native au runtime.",
          "Stabiliser le lancement multi-étapes.",
          "Conserver une séparation nette UI/calcul."
        ],
        "outcomes": [
          "Application capable de charger et afficher des graphes.",
          "Architecture mixte Java/C présentable techniquement.",
          "Preuve forte en visualisation, performance et intégration native."
        ],
        "nextSteps": "Ajouter benchmarks de layouts, tests sur grands graphes et packaging desktop."
      },
      "id": 206
    },
    {
      "title": "Compresseur UTF-8 par Huffman dynamique",
      "subtitle": "Java / Bitstream I/O / Graphviz",
      "shortDescription": "Compresseur/décompresseur Java fondé sur Huffman adaptatif, avec lecture bit-à-bit, gestion UTF-8, exports Graphviz et expérimentations.",
      "description": "Projet algorithmique Java implémentant la compression et la décompression par Huffman dynamique. Il traite les flux binaires, le décodage UTF-8, les erreurs de lecture, la génération d’arbres DOT/Graphviz et les mesures expérimentales de compression.",
      "status": "COMPLETED",
      "startDate": "2025-10-01",
      "endDate": "2025-12-16",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989486/portfolio/Capture-d-ecran-du-2026-06-20-23-03-50-f52e982c-b11d-4fdc-88d9-23222fb56139.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Huffman_dynamique",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989487/portfolio/Rapport_ALGAV-6820e187-0dde-4fbc-8252-d67c1481f2ab.pdf",
      "stacks": [
        "Java",
        "UTF-8",
        "Bitstream I/O",
        "Graphviz",
        "JFreeChart",
        "Ubuntu",
        "Makefile"
      ],
      "features": [
        "Compression et décompression adaptatives par Huffman dynamique.",
        "Lecture/écriture bit-à-bit via utilitaires dédiés.",
        "Gestion du décodage UTF-8 et exceptions de lecture.",
        "Génération DOT/Graphviz pour inspecter les arbres.",
        "Scripts compresser/decompresser et Makefile de compilation.",
        "Expérimentations de taux de compression et temps d’exécution."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Huffman_dynamique"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989487/portfolio/Rapport_ALGAV-6820e187-0dde-4fbc-8252-d67c1481f2ab.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 7,
      "websiteVersionId": null,
      "slug": "compresseur-utf-8-par-huffman-dynamique",
      "proofTags": [
        "Algorithmique",
        "Java",
        "Huffman",
        "UTF-8",
        "Bitstream",
        "Graphviz",
        "Expérimentation"
      ],
      "caseStudy": {
        "problem": "Implémenter une compression adaptative capable de traiter des symboles UTF-8 et des flux binaires.",
        "role": "Développement Java, structures Huffman, I/O bit-à-bit, gestion UTF-8, scripts d’usage et expérimentation.",
        "architecture": "Organisation Java séparant compression, décompression, structure d’arbre, utilitaires I/O, génération DOT et expérimentations.",
        "technicalChoices": [
          "Structure d’arbre dynamique pour adapter le codage au flux.",
          "Utilitaires bitstream pour contrôler précisément la lecture.",
          "Gestion explicite des erreurs UTF-8 pour fiabiliser la décompression.",
          "Graphviz pour rendre les arbres vérifiables."
        ],
        "challenges": [
          "Synchroniser compression et décompression au niveau bit.",
          "Éviter les erreurs de décodage UTF-8.",
          "Mesurer correctement temps et taux de compression.",
          "Rendre le projet exécutable via scripts simples."
        ],
        "outcomes": [
          "Compresseur/décompresseur Java fonctionnel.",
          "Visualisation des arbres et données d’expérimentation.",
          "Preuve en algorithmique, structures de données et robustesse I/O."
        ],
        "nextSteps": "Comparer avec Huffman statique et ajouter des tests automatisés sur corpus variés."
      },
      "id": 207
    },
    {
      "title": "DLP — Interpréteur et compilateur ILP",
      "subtitle": "Java / ANTLR / C",
      "shortDescription": "Projet langage : interpréteur Java et compilateur Java→C pour ILP, avec grammaires ANTLR, runtime C et tests ILP1 à ILP4.",
      "description": "Projet de Master STL consacré au développement d’un langage de programmation. Le dépôt regroupe un interpréteur Java, un compilateur vers C, des grammaires ANTLR 4, un runtime C et des échantillons de tests pour plusieurs niveaux du langage ILP.",
      "status": "COMPLETED",
      "startDate": "2025-09-15",
      "endDate": "2026-12-27",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990623/portfolio/dlp-a52e41b6-c75b-4cd9-bc01-ac948340581d.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/DLP",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990624/portfolio/cours-01_DLP_merged_compressed-8b4d9ae8-f242-4ab8-8d94-28893867fc70.pdf",
      "stacks": [
        "Java",
        "ANTLR 4",
        "C",
        "Compilation",
        "Interpréteur",
        "CI",
        "Tests"
      ],
      "features": [
        "Interpréteur Java pour un langage pédagogique ILP.",
        "Compilateur Java vers C avec runtime associé.",
        "Grammaires ANTLR 4 pour les différents niveaux du langage.",
        "Support progressif ILP1 à ILP4 : expressions, fonctions, exceptions et objets.",
        "Échantillons de programmes de test et résultats attendus.",
        "Scripts de compilation ANTLR et exécution du code C généré."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/DLP"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990624/portfolio/cours-01_DLP_merged_compressed-8b4d9ae8-f242-4ab8-8d94-28893867fc70.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 8,
      "websiteVersionId": null,
      "slug": "dlp-interpreteur-et-compilateur-ilp",
      "proofTags": [
        "Compilation",
        "Java",
        "ANTLR",
        "C",
        "Interpréteur",
        "Tests",
        "Langages"
      ],
      "caseStudy": {
        "problem": "Comprendre toute une chaîne langage : parsing, AST, interprétation, compilation et runtime.",
        "role": "Implémentation des étapes de langage, adaptation des grammaires, génération C, tests et validation des niveaux ILP.",
        "architecture": "Chaîne composée de grammaires ANTLR, sources Java d’interprétation/compilation, runtime C et échantillons ILP par niveau.",
        "technicalChoices": [
          "ANTLR 4 pour formaliser la grammaire et générer le parser.",
          "Java pour l’interpréteur et le compilateur.",
          "C pour exécuter le code généré avec une bibliothèque runtime.",
          "Jeux de tests par niveau ILP pour valider les extensions."
        ],
        "challenges": [
          "Faire évoluer le langage sans casser les niveaux précédents.",
          "Relier syntaxe, sémantique et génération de code.",
          "Gérer fonctions, exceptions et système objet.",
          "Automatiser les tests de programmes ILP."
        ],
        "outcomes": [
          "Chaîne complète interprétation/compilation expérimentée.",
          "Très bonne preuve en compilation, analyse syntaxique et runtime.",
          "Projet aligné avec le parcours STL et l’ingénierie logicielle."
        ],
        "nextSteps": "Ajouter messages d’erreur enrichis, tests de régression et visualisation d’AST."
      },
      "id": 208
    },
    {
      "title": "Architecture Java par composants répartis",
      "subtitle": "C++ / Makefile / CMake / concurrence / systèmes répartis",
      "shortDescription": "Projet système concurrent/réparti autour de composants, interfaces de services, communication inter-processus, synchronisation et déploiement multi-processus.",
      "description": "Projet académique de programmation système concurrente et répartie. Il met en pratique une architecture de composants, des interfaces de services, la synchronisation, l’asynchronisme et le déploiement sur plusieurs processus ou JVM, avec une base C++/Make/CMake visible dans le dépôt.",
      "status": "COMPLETED",
      "startDate": "2026-01-15",
      "endDate": "2026-05-13",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990888/portfolio/bcm-333401bd-fdd0-4f4e-a57f-2e8d481ef9ab.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/PSCR",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990890/portfolio/soutenance_finale_composant-60965fc1-5624-49d0-b54a-9ed8e5e933a0.pdf",
      "stacks": [
        "C++",
        "Makefile",
        "CMake",
        "Concurrence",
        "Synchronisation",
        "Systèmes répartis",
        "Architecture logicielle"
      ],
      "features": [
        "Architecture de composants avec interfaces de services.",
        "Communication inter-composants et scénarios répartis.",
        "Synchronisation sûre dans un contexte concurrent.",
        "Déploiement sur plusieurs processus ou environnements d’exécution.",
        "Organisation build avec Makefile/CMake côté dépôt.",
        "Travail de Master sur systèmes concurrents et répartis."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/PSCR"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990890/portfolio/soutenance_finale_composant-60965fc1-5624-49d0-b54a-9ed8e5e933a0.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 9,
      "websiteVersionId": null,
      "slug": "architecture-java-par-composants-repartis",
      "proofTags": [
        "Concurrence",
        "Systèmes répartis",
        "C++",
        "Makefile",
        "CMake",
        "Synchronisation",
        "Architecture"
      ],
      "caseStudy": {
        "problem": "Modéliser des interactions entre composants tout en maîtrisant concurrence, synchronisation et distribution.",
        "role": "Conception de scénarios composants, intégration, synchronisation, tests d’exécution et documentation de soutenance.",
        "architecture": "Architecture orientée composants, avec interfaces, broker/liaisons, communications et gestion de l’exécution répartie.",
        "technicalChoices": [
          "Interfaces de services pour découpler les composants.",
          "Asynchronisme pour éviter un couplage d’exécution trop strict.",
          "Synchronisation explicite pour sécuriser les accès concurrents.",
          "Build Make/CMake pour compiler et lancer les scénarios."
        ],
        "challenges": [
          "Éviter les blocages et états incohérents.",
          "Tester des interactions réparties moins déterministes.",
          "Rendre l’architecture compréhensible en soutenance.",
          "Séparer responsabilités de communication et logique métier."
        ],
        "outcomes": [
          "Preuve en systèmes distribués et programmation concurrente.",
          "Compréhension concrète des interfaces, synchronisation et exécution répartie.",
          "Projet utile pour valoriser une spécialisation ingénierie logicielle/systèmes."
        ],
        "nextSteps": "Ajouter diagrammes d’exécution, traces structurées et scénarios de charge."
      },
      "id": 209
    },
    {
      "title": "Footix",
      "subtitle": "JavaScript / Go / PostgreSQL",
      "shortDescription": "Application web client/serveur en binôme, combinant JavaScript, Go, PostgreSQL/PLpgSQL, CSS et déploiement alpha Vercel.",
      "description": "Projet web PC3R réalisé en binôme à Sorbonne Université. L’application sépare un client JavaScript et un serveur Go, s’appuie sur PostgreSQL/PLpgSQL pour la persistance et dispose d’une version alpha déployée sur Vercel.",
      "status": "COMPLETED",
      "startDate": "2026-02-01",
      "endDate": "2026-05-25",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990172/portfolio/footix-b0a2ed0a-0d68-420e-84d3-a293e580bc10.png",
      "demoUrl": "https://footix-alpha.vercel.app",
      "githubUrl": "https://github.com/Thebibi93/Footix",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990174/portfolio/rapport_pc3r-27d29450-397d-4ea0-8550-0954b6fcaafb.pdf",
      "stacks": [
        "JavaScript",
        "Go",
        "PostgreSQL",
        "PLpgSQL",
        "CSS",
        "Client/Server",
        "Vercel"
      ],
      "features": [
        "Architecture client/serveur séparant interface et logique serveur.",
        "Frontend JavaScript avec interface web déployée en alpha.",
        "Backend Go pour exposer les traitements côté serveur.",
        "Persistance PostgreSQL enrichie par PLpgSQL.",
        "Développement en binôme dans un cadre universitaire.",
        "Déploiement alpha sur Vercel pour démonstration."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/Thebibi93/Footix"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990174/portfolio/rapport_pc3r-27d29450-397d-4ea0-8550-0954b6fcaafb.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 10,
      "websiteVersionId": null,
      "slug": "footix",
      "proofTags": [
        "JavaScript",
        "Go",
        "PostgreSQL",
        "PLpgSQL",
        "Client/Server",
        "Vercel",
        "Web"
      ],
      "caseStudy": {
        "problem": "Construire une application web complète en binôme avec séparation client/serveur et persistance.",
        "role": "Participation au développement client/serveur, intégration web, structuration des données et documentation projet.",
        "architecture": "Projet séparant un client JavaScript, un serveur Go, une base PostgreSQL/PLpgSQL et un déploiement alpha Vercel.",
        "technicalChoices": [
          "JavaScript pour l’interface et les interactions côté client.",
          "Go pour un backend léger et explicite.",
          "PostgreSQL/PLpgSQL pour stocker et structurer les données.",
          "Vercel pour exposer rapidement une version alpha."
        ],
        "challenges": [
          "Coordonner le travail en binôme.",
          "Faire communiquer client, serveur et base.",
          "Maintenir un périmètre réaliste pour un projet académique.",
          "Produire une démonstration accessible."
        ],
        "outcomes": [
          "Application web client/serveur présentable.",
          "Preuve en développement web complet hors stack Java.",
          "Expérience de collaboration et déploiement alpha."
        ],
        "nextSteps": "Renforcer tests, sécurité API et documentation d’installation locale."
      },
      "id": 210
    },
    {
      "title": "Génération d'arbres binaires",
      "subtitle": "OCaml / Dune / Python / Graphviz",
      "shortDescription": "Projet OCaml/Dune de génération d’arbres binaires, rendus Graphviz, expérimentations reproductibles et courbes Python.",
      "description": "Projet algorithmique OCaml réalisé en binôme. Le dépôt contient des modules OCaml, un build Dune, des arbres générés au format DOT/PNG, des scripts d’expérimentation et une production de courbes avec Python/Pandas/Matplotlib.",
      "status": "COMPLETED",
      "startDate": "2025-11-01",
      "endDate": "2025-12-15",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781597137/portfolio/ouv_demo-81f7c176-e43c-4517-a5ae-57c7d300a5d2.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/RamySL/Binary_tree_generation",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781597139/portfolio/Rapport_OUV-73f65d4a-13da-4f9f-bd72-c8f539862626.pdf",
      "stacks": [
        "OCaml",
        "Dune",
        "Python",
        "Pandas",
        "Matplotlib",
        "Graphviz",
        "Shell"
      ],
      "features": [
        "Génération automatique d’arbres binaires en OCaml.",
        "Organisation du code en modules avec Dune.",
        "Export DOT et rendu PNG via Graphviz.",
        "Scripts d’expérimentation reproductibles.",
        "Production de courbes avec Python, Pandas et Matplotlib.",
        "Séparation entre code, arbres générés et sorties d’analyse."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/RamySL/Binary_tree_generation"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781597139/portfolio/Rapport_OUV-73f65d4a-13da-4f9f-bd72-c8f539862626.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 11,
      "websiteVersionId": null,
      "slug": "generation-d-arbres-binaires",
      "proofTags": [
        "OCaml",
        "Dune",
        "Algorithmique",
        "Graphviz",
        "Python",
        "Expérimentation",
        "Reproductibilité"
      ],
      "caseStudy": {
        "problem": "Explorer la génération d’arbres binaires et produire des résultats visualisables et mesurables.",
        "role": "Développement OCaml, organisation des modules, scripts d’expérience, génération Graphviz et analyse de résultats.",
        "architecture": "Projet Dune composé de bin/main.ml, modules lib, dossier generated_trees et scripts Python pour produire les courbes.",
        "technicalChoices": [
          "OCaml pour manipuler proprement des structures récursives.",
          "Dune pour automatiser le build.",
          "Graphviz pour rendre les arbres lisibles.",
          "Python/Pandas/Matplotlib pour exploiter les mesures."
        ],
        "challenges": [
          "Produire des arbres corrects et visualisables.",
          "Rendre les expérimentations rejouables.",
          "Relier génération algorithmique et courbes d’analyse.",
          "Garder une structure de projet lisible en binôme."
        ],
        "outcomes": [
          "Pipeline complet génération → visualisation → analyse.",
          "Preuve en algorithmique fonctionnelle et expérimentation.",
          "Support clair pour un rapport académique."
        ],
        "nextSteps": "Ajouter davantage de distributions d’arbres et une comparaison de complexité."
      },
      "id": 211
    },
    {
      "title": "Sorting Library",
      "subtitle": "Java / benchmarks / JFreeChart",
      "shortDescription": "Bibliothèque Java d’algorithmes de tri avec API uniforme, JAR, benchmarks reproductibles, CSV et graphiques JFreeChart.",
      "description": "Bibliothèque Java modulaire pour utiliser, comparer et expérimenter plusieurs algorithmes de tri. Le projet fournit une API commune, un JAR exploitable, des générateurs de données, des benchmarks, des résultats CSV et des graphiques d’analyse.",
      "status": "COMPLETED",
      "startDate": "2025-09-01",
      "endDate": "2026-01-12",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989944/portfolio/sorting_library-9b374b63-5690-4710-aa5c-499c46e7f7ea.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/sorting-library",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989945/portfolio/README-ed506fd7-e7c0-4955-b516-25aed7cd113c.pdf",
      "stacks": [
        "Java",
        "JAR",
        "Algorithms",
        "Benchmark",
        "JFreeChart",
        "CSV",
        "Makefile"
      ],
      "features": [
        "API uniforme pour changer d’algorithme sans modifier le code client.",
        "Implémentations de tris rapides et pédagogiques.",
        "Génération de tableaux selon plusieurs distributions.",
        "Benchmarks reproductibles avec résultats CSV.",
        "Visualisation expérimentale avec JFreeChart.",
        "Distribution sous forme de JAR utilisable par des clients externes."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/sorting-library"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781989945/portfolio/README-ed506fd7-e7c0-4955-b516-25aed7cd113c.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 12,
      "websiteVersionId": null,
      "slug": "sorting-library",
      "proofTags": [
        "Java",
        "Algorithmique",
        "Benchmark",
        "JAR",
        "JFreeChart",
        "API",
        "Expérimentation"
      ],
      "caseStudy": {
        "problem": "Transformer des algorithmes de tri en bibliothèque réutilisable et expérimentable.",
        "role": "Conception API, implémentation Java, benchmarks, génération de données, packaging JAR et documentation.",
        "architecture": "Packages séparés : algorithms, core, util, benchmark, experimentation, out et distribution JAR.",
        "technicalChoices": [
          "Interface commune SortAlgorithm pour uniformiser l’usage.",
          "ArrayGenerator et Timer pour isoler les outils d’expérience.",
          "BenchmarkRunner pour automatiser les comparaisons.",
          "JFreeChart pour produire des courbes exploitables."
        ],
        "challenges": [
          "Passer d’un exercice d’algorithmes à une bibliothèque propre.",
          "Rendre les mesures reproductibles.",
          "Séparer API publique et code d’expérimentation.",
          "Documenter l’usage JAR côté client."
        ],
        "outcomes": [
          "Bibliothèque Java exploitable et documentée.",
          "Preuve en algorithmique, API design et expérimentation.",
          "Projet très lisible pour valoriser la qualité logicielle."
        ],
        "nextSteps": "Ajouter tests JUnit, CI et visualisation comparative plus complète."
      },
      "id": 212
    },
    {
      "title": "Searchlib",
      "subtitle": "Java / expérimentations / tests",
      "shortDescription": "Bibliothèque Java académique avec code source, tests, documentation, expérimentations et automatisation Makefile autour des algorithmes de recherche.",
      "description": "Projet Java orienté algorithmes de recherche et expérimentation. Le dépôt est structuré avec documentation, dossier d’expériences, tests, code source principal et Makefile, ce qui en fait un support de qualité logicielle et d’analyse algorithmique.",
      "status": "COMPLETED",
      "startDate": "2025-09-01",
      "endDate": "2026-01-16",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1781990011/portfolio/search_lib-b0822398-da02-4ccf-9107-ad8654704ac2.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/searchlib",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "Java",
        "Makefile",
        "Tests",
        "Expérimentation",
        "Documentation"
      ],
      "features": [
        "Code Java structuré autour d’algorithmes de recherche.",
        "Dossier de documentation séparé du code source.",
        "Jeux d’expérimentation pour analyser les comportements.",
        "Tests associés pour vérifier les implémentations.",
        "Makefile pour automatiser compilation et scénarios.",
        "Organisation académique claire et maintenable."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/searchlib"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 13,
      "websiteVersionId": null,
      "slug": "searchlib",
      "proofTags": [
        "Java",
        "Algorithmique",
        "Tests",
        "Expérimentation",
        "Documentation",
        "Makefile"
      ],
      "caseStudy": {
        "problem": "Implémenter et expérimenter des algorithmes de recherche avec une structure de projet propre.",
        "role": "Développement Java, tests, documentation et mise en place des expériences.",
        "architecture": "Projet Java organisé en src/main/java, test, experiments, Documentation, lib et Makefile.",
        "technicalChoices": [
          "Java pour implémenter clairement les algorithmes.",
          "Tests séparés pour sécuriser les comportements.",
          "Experiments pour relier code et analyse.",
          "Makefile pour simplifier les commandes."
        ],
        "challenges": [
          "Conserver une séparation claire entre source, tests et expériences.",
          "Rendre les résultats d’expérimentation reproductibles.",
          "Éviter un projet monolithique difficile à présenter.",
          "Documenter les choix algorithmiques."
        ],
        "outcomes": [
          "Projet exploitable comme preuve de rigueur algorithmique.",
          "Organisation cohérente pour un contexte académique.",
          "Complément utile à Sorting Library dans la section compétences."
        ],
        "nextSteps": "Ajouter benchmarks plus visuels et README détaillé par algorithme."
      },
      "id": 213
    },
    {
      "title": "AutoÉcole",
      "subtitle": "Symfony / PHP / Twig / Docker / Doctrine",
      "shortDescription": "Application métier Symfony/PHP/Twig dockerisée pour gérer un parcours auto-école avec règles métier, migrations, seed, audit qualité et tests.",
      "description": "Application web métier autour d’une auto-école. La version enrichie met en avant Symfony/PHP/Twig, Docker Compose, migrations Doctrine, seed de démonstration, audit métier, tests, séparation règles métier/accès données/affichage et validations de formulaires.",
      "status": "COMPLETED",
      "startDate": "2025-07-01",
      "endDate": "2025-09-03",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1782068165/portfolio/autoecole_demo_merged-c3fe6fa8-0c15-4046-a548-edb13c7d1398.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/AutoEcole",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1782068167/portfolio/AutoEcole_Rapport_ULHN-b14b672e-7f4b-44d7-8ddf-91c7eda33a21.pdf",
      "stacks": [
        "Symfony",
        "PHP",
        "Twig",
        "Doctrine",
        "Docker",
        "Docker Compose",
        "Migrations",
        "PHPUnit",
        "JavaScript",
        "CSS"
      ],
      "features": [
        "Application métier Symfony avec formulaires typés et validations.",
        "Règles strictes : code réussi, créneau autorisé, puis conduite autorisée.",
        "Gestion de paiements partiels et statuts soldés automatiquement.",
        "Docker Compose pour lancer l’application et son environnement.",
        "Commandes de seed, audit qualité, migrations et tests.",
        "Séparation claire entre règles métier, accès données et affichage."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/AutoEcole"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1782068167/portfolio/AutoEcole_Rapport_ULHN-b14b672e-7f4b-44d7-8ddf-91c7eda33a21.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 14,
      "websiteVersionId": null,
      "slug": "autoecole",
      "proofTags": [
        "Symfony",
        "PHP",
        "Twig",
        "Doctrine",
        "Docker",
        "Règles métier",
        "Tests",
        "Qualité"
      ],
      "caseStudy": {
        "problem": "Structurer une application métier avec règles de progression, paiements et qualité d’exécution reproductible.",
        "role": "Restructuration Symfony, règles métier, Docker, migrations, seed, audit qualité, tests et documentation.",
        "architecture": "Application Symfony organisée autour de services métier, contrôleurs, formulaires, templates Twig, migrations Doctrine et scripts qualité.",
        "technicalChoices": [
          "Symfony pour cadrer formulaires, validation et services.",
          "Docker Compose pour rendre l’environnement reproductible.",
          "Doctrine migrations pour éviter un historique fragile.",
          "Commandes CLI pour seed, audit et maintenance."
        ],
        "challenges": [
          "Faire respecter une progression pédagogique stricte.",
          "Gérer les paiements partiels sans état incohérent.",
          "Nettoyer la configuration et éviter les secrets réels.",
          "Améliorer la maintenabilité sans surcharger le projet."
        ],
        "outcomes": [
          "Application métier mieux structurée et démontrable.",
          "Preuve en Symfony, règles métier et qualité logicielle.",
          "Base extensible vers rôles, planning, notifications et factures PDF."
        ],
        "nextSteps": "Ajouter authentification par rôles, planning des moniteurs et API REST."
      },
      "id": 214
    },
    {
      "title": "Squadro — Jeu de plateau web",
      "subtitle": "PHP / PostgreSQL / Docker / JavaScript",
      "shortDescription": "Jeu web PHP/PostgreSQL/Docker implémentant Squadro avec moteur de règles, persistance, lobby, Oracle tactique, historique, statistiques et UX stabilisée.",
      "description": "Projet académique de jeu web Squadro. L’application fournit un moteur de règles côté serveur, une interface grecque/spartiate, une persistance PostgreSQL, un environnement Docker reproductible, un lobby, reprise de partie, historique, statistiques, Oracle tactique, undo limité et export JSON.",
      "status": "COMPLETED",
      "startDate": "2025-01-01",
      "endDate": "2025-06-30",
      "imageUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1782065737/portfolio/squadro_demo_fusion-d593e433-343f-4bed-8143-90c5eceb0604.png",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Squadro",
      "architectureUrl": "",
      "documentationUrl": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1782065739/portfolio/Squadro_Rapport_ULHN-3109db9b-1259-4e8e-b535-71a2d73d8611.pdf",
      "stacks": [
        "PHP",
        "PostgreSQL",
        "PDO",
        "Docker",
        "Docker Compose",
        "JavaScript",
        "HTML",
        "CSS",
        "SQL",
        "MVC"
      ],
      "features": [
        "Moteur de règles Squadro avec déplacements, retours, sorties et victoire.",
        "Persistance PostgreSQL des joueurs, parties et plateaux sérialisés JSON.",
        "Architecture MVC simple : modèles, vues, contrôleurs et couche PDO.",
        "Oracle tactique évaluant les coups disponibles selon une heuristique.",
        "Historique, statistiques, undo limité et export JSON de partie.",
        "Interface grecque/spartiate stabilisée avec AJAX et raccourcis clavier."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Squadro"
        },
        {
          "type": "DOCUMENTATION",
          "label": "Documentation",
          "url": "https://res.cloudinary.com/dji3ywrzt/raw/upload/v1782065739/portfolio/Squadro_Rapport_ULHN-3109db9b-1259-4e8e-b535-71a2d73d8611.pdf"
        }
      ],
      "featured": true,
      "published": true,
      "displayOrder": 15,
      "websiteVersionId": null,
      "slug": "squadro-jeu-de-plateau-web",
      "proofTags": [
        "PHP",
        "PostgreSQL",
        "Docker",
        "MVC",
        "Jeu",
        "AJAX",
        "UX",
        "Sécurité",
        "Qualité"
      ],
      "caseStudy": {
        "problem": "Transformer un jeu de plateau en application web jouable, persistée et suffisamment structurée pour être maintenable.",
        "role": "Moteur de jeu, persistance PostgreSQL, interface, Oracle tactique, stabilisation UX, Docker, documentation et vérifications qualité.",
        "architecture": "Application PHP avec Core, Controlleur, Modele, Vue, skel/PDO, SQL, assets CSS/JS, tests smoke et Docker Compose.",
        "technicalChoices": [
          "PHP sans framework lourd pour rendre le MVC visible.",
          "PostgreSQL pour persister joueurs, parties et états de plateau.",
          "JSON pour sérialiser un état de jeu compact.",
          "AJAX et restauration du scroll pour éviter les sauts de page après chaque coup."
        ],
        "challenges": [
          "Appliquer les règles de Squadro côté serveur sans incohérence.",
          "Éviter les déplacements de page après chaque action.",
          "Conserver une session maîtrisée malgré historique et undo.",
          "Ajouter un Oracle utile sans implémenter une IA lourde."
        ],
        "outcomes": [
          "Jeu jouable immédiatement via Docker.",
          "Projet très démonstratif en règles métier, persistance et UX.",
          "Documentation complète qui rend l’architecture compréhensible."
        ],
        "nextSteps": "Ajouter WebSocket/SSE, mode spectateur et IA plus profonde."
      },
      "id": 215
    },
    {
      "title": "Game Model MVC",
      "subtitle": "Java / MVC",
      "shortDescription": "Mini-jeu Java Tic-Tac-Toe structuré en MVC, utile comme preuve pédagogique d’architecture objet.",
      "description": "Projet Java court centré sur la séparation Modèle-Vue-Contrôleur. Il matérialise une logique de jeu simple tout en gardant une organisation claire des responsabilités.",
      "status": "COMPLETED",
      "startDate": "2024-09-01",
      "endDate": "2024-09-15",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Game_Model_MVC",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "Java",
        "MVC",
        "POO",
        "Architecture logicielle"
      ],
      "features": [
        "Séparation modèle, vue et contrôleur.",
        "Logique de jeu Tic-Tac-Toe.",
        "Organisation orientée objet.",
        "Projet pédagogique pour architecture applicative."
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Game_Model_MVC"
        }
      ],
      "featured": true,
      "published": false,
      "displayOrder": 16,
      "websiteVersionId": null,
      "slug": "game-model-mvc",
      "proofTags": [
        "Java",
        "MVC",
        "POO",
        "Architecture logicielle"
      ],
      "caseStudy": {
        "problem": "Pratiquer la séparation des responsabilités sur un jeu simple.",
        "role": "Développement Java, modèle de jeu, contrôleur et vues.",
        "architecture": "Architecture MVC Java avec logique de jeu isolée du rendu.",
        "technicalChoices": [
          "Java/POO",
          "Pattern MVC",
          "Logique de jeu simple"
        ],
        "challenges": [
          "Éviter le mélange logique/rendu.",
          "Garder un code lisible malgré un petit périmètre."
        ],
        "outcomes": [
          "Base claire pour expliquer MVC.",
          "Projet court utile en historique technique."
        ],
        "nextSteps": "Ajouter tests unitaires et interface plus avancée."
      },
      "id": 216
    },
    {
      "title": "Gestion Film Star Trek",
      "subtitle": "PHP",
      "shortDescription": "Application PHP de gestion de films autour de l'univers Star Trek.",
      "description": "Application PHP de gestion de films autour de l'univers Star Trek. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Gestion_Film_Star_Trek",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "PHP",
        "HTML",
        "CSS"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Gestion_Film_Star_Trek"
        }
      ],
      "featured": true,
      "published": false,
      "displayOrder": 17,
      "websiteVersionId": null,
      "slug": "gestion-film-star-trek",
      "proofTags": [
        "PHP",
        "HTML",
        "CSS"
      ],
      "id": 217,
      "caseStudy": {
        "problem": "Application PHP de gestion de films autour de l'univers Star Trek.",
        "context": "Application PHP de gestion de films autour de l'univers Star Trek. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de PHP, HTML, CSS.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "Breweries Advanced JS",
      "subtitle": "JavaScript / API",
      "shortDescription": "Application JavaScript avancée autour de la consommation d'API de brasseries.",
      "description": "Application JavaScript avancée autour de la consommation d'API de brasseries. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Breweries_Advanced_JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "JavaScript",
        "API REST",
        "DOM"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Breweries_Advanced_JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 18,
      "websiteVersionId": null,
      "slug": "breweries-advanced-js",
      "proofTags": [
        "JavaScript",
        "API REST",
        "DOM"
      ],
      "id": 218,
      "caseStudy": {
        "problem": "Application JavaScript avancée autour de la consommation d'API de brasseries.",
        "context": "Application JavaScript avancée autour de la consommation d'API de brasseries. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de JavaScript, API REST, DOM.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "Yoga App JS",
      "subtitle": "JavaScript",
      "shortDescription": "Mini-application JavaScript orientée interface utilisateur autour du yoga.",
      "description": "Mini-application JavaScript orientée interface utilisateur autour du yoga. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Yoga-app-JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "JavaScript",
        "HTML",
        "CSS"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Yoga-app-JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 19,
      "websiteVersionId": null,
      "slug": "yoga-app-js",
      "proofTags": [
        "JavaScript",
        "HTML",
        "CSS"
      ],
      "id": 219,
      "caseStudy": {
        "problem": "Mini-application JavaScript orientée interface utilisateur autour du yoga.",
        "context": "Mini-application JavaScript orientée interface utilisateur autour du yoga. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de JavaScript, HTML, CSS.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "Meal API JS",
      "subtitle": "JavaScript / API",
      "shortDescription": "Application JavaScript exploitant une API de recettes ou repas.",
      "description": "Application JavaScript exploitant une API de recettes ou repas. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Meal_API_JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "JavaScript",
        "API REST",
        "Fetch",
        "DOM"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Meal_API_JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 20,
      "websiteVersionId": null,
      "slug": "meal-api-js",
      "proofTags": [
        "JavaScript",
        "API REST",
        "Fetch",
        "DOM"
      ],
      "id": 220,
      "caseStudy": {
        "problem": "Application JavaScript exploitant une API de recettes ou repas.",
        "context": "Application JavaScript exploitant une API de recettes ou repas. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de JavaScript, API REST, Fetch, DOM.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "User API JS",
      "subtitle": "JavaScript / API",
      "shortDescription": "Mini-projet JavaScript de consommation et affichage de données utilisateur depuis une API.",
      "description": "Mini-projet JavaScript de consommation et affichage de données utilisateur depuis une API. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/User_API_JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "JavaScript",
        "API REST",
        "Fetch",
        "DOM"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/User_API_JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 21,
      "websiteVersionId": null,
      "slug": "user-api-js",
      "proofTags": [
        "JavaScript",
        "API REST",
        "Fetch",
        "DOM"
      ],
      "id": 221,
      "caseStudy": {
        "problem": "Mini-projet JavaScript de consommation et affichage de données utilisateur depuis une API.",
        "context": "Mini-projet JavaScript de consommation et affichage de données utilisateur depuis une API. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de JavaScript, API REST, Fetch, DOM.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "Animated Text JS",
      "subtitle": "JavaScript / animation",
      "shortDescription": "Effet d'animation de texte en JavaScript.",
      "description": "Effet d'animation de texte en JavaScript. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Animated_Text_JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "JavaScript",
        "CSS",
        "Animation"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Animated_Text_JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 22,
      "websiteVersionId": null,
      "slug": "animated-text-js",
      "proofTags": [
        "JavaScript",
        "CSS",
        "Animation"
      ],
      "id": 222,
      "caseStudy": {
        "problem": "Effet d'animation de texte en JavaScript.",
        "context": "Effet d'animation de texte en JavaScript. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de JavaScript, CSS, Animation.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "Passwords JS",
      "subtitle": "JavaScript / UI",
      "shortDescription": "Mini-projet JavaScript autour de la génération ou manipulation de mots de passe.",
      "description": "Mini-projet JavaScript autour de la génération ou manipulation de mots de passe. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Passwords_JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "JavaScript",
        "CSS",
        "UI"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Passwords_JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 23,
      "websiteVersionId": null,
      "slug": "passwords-js",
      "proofTags": [
        "JavaScript",
        "CSS",
        "UI"
      ],
      "id": 223,
      "caseStudy": {
        "problem": "Mini-projet JavaScript autour de la génération ou manipulation de mots de passe.",
        "context": "Mini-projet JavaScript autour de la génération ou manipulation de mots de passe. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de JavaScript, CSS, UI.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "Jokes JS",
      "subtitle": "JavaScript / API",
      "shortDescription": "Mini-projet JavaScript affichant des blagues via logique front ou API.",
      "description": "Mini-projet JavaScript affichant des blagues via logique front ou API. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Jokes_JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "JavaScript",
        "API",
        "DOM"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Jokes_JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 24,
      "websiteVersionId": null,
      "slug": "jokes-js",
      "proofTags": [
        "JavaScript",
        "API",
        "DOM"
      ],
      "id": 224,
      "caseStudy": {
        "problem": "Mini-projet JavaScript affichant des blagues via logique front ou API.",
        "context": "Mini-projet JavaScript affichant des blagues via logique front ou API. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de JavaScript, API, DOM.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "Calculatrice JS",
      "subtitle": "HTML / JavaScript",
      "shortDescription": "Calculatrice web simple réalisée en HTML, CSS et JavaScript.",
      "description": "Calculatrice web simple réalisée en HTML, CSS et JavaScript. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/Calculatrice_JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "HTML",
        "CSS",
        "JavaScript"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/Calculatrice_JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 25,
      "websiteVersionId": null,
      "slug": "calculatrice-js",
      "proofTags": [
        "HTML",
        "CSS",
        "JavaScript"
      ],
      "id": 225,
      "caseStudy": {
        "problem": "Calculatrice web simple réalisée en HTML, CSS et JavaScript.",
        "context": "Calculatrice web simple réalisée en HTML, CSS et JavaScript. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de HTML, CSS, JavaScript.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "Bubble Game JS",
      "subtitle": "JavaScript / jeu",
      "shortDescription": "Jeu web de bulles en JavaScript.",
      "description": "Jeu web de bulles en JavaScript. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/BubbleGame_JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "JavaScript",
        "Canvas",
        "DOM",
        "CSS"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/BubbleGame_JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 26,
      "websiteVersionId": null,
      "slug": "bubble-game-js",
      "proofTags": [
        "JavaScript",
        "Canvas",
        "DOM",
        "CSS"
      ],
      "id": 226,
      "caseStudy": {
        "problem": "Jeu web de bulles en JavaScript.",
        "context": "Jeu web de bulles en JavaScript. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de JavaScript, Canvas, DOM, CSS.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    },
    {
      "title": "AppConnect JS",
      "subtitle": "JavaScript / authentification UI",
      "shortDescription": "Interface utilisateur pour renseigner des informations d'authentification.",
      "description": "Interface utilisateur pour renseigner des informations d'authentification. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
      "status": "COMPLETED",
      "startDate": "2024-10-01",
      "endDate": "2024-10-18",
      "imageUrl": "",
      "demoUrl": "",
      "githubUrl": "https://github.com/idris-ach2002/AppConnect_JS",
      "architectureUrl": "",
      "documentationUrl": "",
      "stacks": [
        "JavaScript",
        "HTML",
        "CSS",
        "Formulaires"
      ],
      "features": [
        "Manipulation DOM",
        "Interface front simple",
        "Exercice pratique de développement web",
        "Projet conservé pour historique technique"
      ],
      "links": [
        {
          "type": "GITHUB",
          "label": "GitHub",
          "url": "https://github.com/idris-ach2002/AppConnect_JS"
        }
      ],
      "featured": false,
      "published": false,
      "displayOrder": 27,
      "websiteVersionId": null,
      "slug": "appconnect-js",
      "proofTags": [
        "JavaScript",
        "HTML",
        "CSS",
        "Formulaires"
      ],
      "id": 227,
      "caseStudy": {
        "problem": "Interface utilisateur pour renseigner des informations d'authentification.",
        "context": "Interface utilisateur pour renseigner des informations d'authentification. Projet court conservé dans le JSON pour centraliser les dépôts GitHub, mais laissé non publié par défaut afin de ne pas surcharger le portfolio public.",
        "role": "Conception, développement, documentation et consolidation technique du projet.",
        "architecture": "Architecture articulée autour de JavaScript, HTML, CSS, Formulaires.",
        "technicalChoices": [
          "Manipulation DOM",
          "Interface front simple",
          "Exercice pratique de développement web",
          "Projet conservé pour historique technique"
        ],
        "challenges": [],
        "solutions": [],
        "outcomes": [],
        "results": [],
        "limits": [],
        "nextSteps": "Renforcer les tests, la documentation et les scénarios de démonstration."
      }
    }
  ],
  "provenSkills": [
    {
      "id": "backend-architecture",
      "label": "Backend & architecture",
      "summary": "API REST, règles métier, persistance PostgreSQL, versioning et services maintenables.",
      "evidenceProjects": [
        "portfolio-professionnel-backend-spring-boot",
        "ais-java-2025-collecte-robuste-de-donnees-ais",
        "dlp-interpreteur-et-compilateur-ilp",
        "autoecole"
      ],
      "shortLabel": "Backend",
      "description": "API REST, règles métier, persistance PostgreSQL, versioning et services maintenables.",
      "evidenceCount": 4
    },
    {
      "id": "data-pipelines",
      "label": "Data pipelines",
      "summary": "Collecte, transformation, insertion massive, PostgreSQL et exports exploitables.",
      "evidenceProjects": [
        "ais-java-2025-collecte-robuste-de-donnees-ais",
        "bdd-ais-base-massive-postgresql",
        "ais-website-filtrage-et-export-des-donnees-ais"
      ],
      "shortLabel": "Data",
      "description": "Collecte, transformation, insertion massive, PostgreSQL et exports exploitables.",
      "evidenceCount": 3
    },
    {
      "id": "frontend-product",
      "label": "Interfaces produit",
      "summary": "React, Symfony/Twig, UX métier, filtrage, modales, viewers et interactions orientées usage.",
      "evidenceProjects": [
        "portfolio-professionnel-frontend-anime",
        "ais-website-filtrage-et-export-des-donnees-ais",
        "footix"
      ],
      "shortLabel": "Interfaces",
      "description": "React, Symfony/Twig, UX métier, filtrage, modales, viewers et interactions orientées usage.",
      "evidenceCount": 3
    },
    {
      "id": "graphics-performance",
      "label": "Performance graphique",
      "summary": "JavaFX, JOGL, OpenGL, JNI et séparation UI / moteur natif.",
      "evidenceProjects": [
        "visualisation-de-graphes-haute-performance"
      ],
      "shortLabel": "Performance",
      "description": "JavaFX, JOGL, OpenGL, JNI et séparation UI / moteur natif.",
      "evidenceCount": 1
    },
    {
      "id": "software-quality",
      "label": "Qualité logicielle",
      "summary": "Tests, documentation, MVC, scripts, Docker, validation, architecture claire et robustesse.",
      "evidenceProjects": [
        "squadro-jeu-de-plateau-web",
        "sorting-library",
        "autoecole",
        "searchlib"
      ],
      "shortLabel": "Qualité",
      "description": "Tests, documentation, MVC, scripts, Docker, validation, architecture claire et robustesse.",
      "evidenceCount": 4
    },
    {
      "id": "algorithmic-engineering",
      "label": "Algorithmique appliquée",
      "summary": "Compression, arbres, recherche, tris, expérimentation et visualisation de résultats.",
      "evidenceProjects": [
        "compresseur-utf-8-par-huffman-dynamique",
        "generation-d-arbres-binaires",
        "sorting-library",
        "searchlib"
      ],
      "shortLabel": "Algorithmique",
      "description": "Compression, arbres, recherche, tris, expérimentation et visualisation de résultats.",
      "evidenceCount": 4
    }
  ],
  "ownerId": 1
};

export const demoOwners = [demoOwner];
