export function portfolioOwner(locale = "fr") {
  const english = locale === "en";
  return {
    ownerId: 1,
    name: "ACHABOU",
    firstName: "Idris",
    age: 23,
    active: true,
    address: "Île-de-France",
    contacts: [
      {
        id: 301,
        type: "EMAIL",
        value: "idris@example.test",
      },
      {
        id: 302,
        type: "PHONE_NUMBER",
        value: "+33 6 00 00 00 00",
      },
      {
        id: 303,
        type: "LINKEDIN",
        value: "https://www.linkedin.com/in/idris-test",
      },
    ],
    prof: {
      id: 10,
      title: english ? "Full Stack Java Developer" : "Développeur Java Full Stack",
      subtitle: "Java 21 / Spring Boot / React / PostgreSQL",
      headline: english ? "Reliable software engineering." : "Ingénierie logicielle fiable.",
      shortDescription: english ? "Professional portfolio." : "Portfolio professionnel.",
      description: english ? "Backend, frontend and quality." : "Backend, frontend et qualité.",
      location: "Île-de-France",
      availability: english ? "Available from September 2026" : "Disponible dès septembre 2026",
      profileImageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'%3E%3Crect width='600' height='800' fill='%23d7e3e7'/%3E%3Ccircle cx='300' cy='270' r='118' fill='%239bb9c4'/%3E%3Cpath d='M120 760c24-190 115-286 180-286s156 96 180 286' fill='%2385aab8'/%3E%3C/svg%3E",
      logoUrl: "",
      cvUrl: "",
      portfolioUrl: "",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-08-06T00:00:00Z",
    },
    timeline: {
      id: 20,
      title: english ? "Experience" : "Parcours",
      description: "",
      experiences: [
        {
          id: 201,
          category: "SCHOOL",
          title: english ? "Master Computer Science STL" : "Master Informatique STL",
          organization: "Sorbonne Université",
          location: "Paris",
          startDate: "2025-09-01",
          endDate: null,
          currentPosition: true,
          summary: english ? "Software engineering studies." : "Formation en ingénierie logicielle.",
          description: english
            ? "Advanced software engineering, reliability and application architecture."
            : "Ingénierie logicielle avancée, fiabilité et architecture applicative.",
          skills: ["JAVA 21", "SPRING BOOT", "REACT"],
          websiteUrl: "",
          imageUrl: "",
        },
        {
          id: 202,
          category: "INTERNSHIP",
          title: english ? "Software / Data Development Internship" : "Stage développement logiciel / data",
          organization: "LITIS — Université Le Havre Normandie",
          location: "Le Havre",
          startDate: "2025-04-01",
          endDate: "2025-06-30",
          currentPosition: false,
          summary: english ? "AIS data architecture redesign." : "Refonte d'une architecture de données AIS.",
          description: english
            ? "Reliable ingestion, storage and exploitation pipeline for AIS data."
            : "Pipeline fiable de récupération, stockage et exploitation de données AIS.",
          skills: ["JAVA 21", "POSTGRESQL", "PYTHON", "SYMFONY"],
          websiteUrl: "",
          imageUrl: "",
        },
        {
          id: 203,
          category: "CDI",
          title: english ? "Logistics Assistant" : "Assistant logistique",
          organization: "La Belle Vie / Deleev",
          location: "Île-de-France",
          startDate: "2025-11-01",
          endDate: null,
          currentPosition: true,
          summary: english ? "Operational logistics." : "Logistique opérationnelle.",
          description: english
            ? "Execution reliability, organization and prioritization in an operational environment."
            : "Fiabilité d'exécution, organisation et priorisation dans un environnement opérationnel.",
          skills: ["RIGUEUR", "ORGANISATION", "PRIORISATION"],
          websiteUrl: "",
          imageUrl: "",
        },
      ],
    },
    projects: [
      {
        id: 101,
        title: english ? "Reliable Portfolio" : "Portfolio fiable",
        subtitle: "Spring Boot / React",
        shortDescription: english
          ? "A tested, accessible and multilingual portfolio."
          : "Un portfolio testé, accessible et multilingue.",
        description: english
          ? "Public content comes from the backend and the interface is validated in Chromium and Firefox."
          : "Le contenu public vient du backend et l’interface est validée sous Chromium et Firefox.",
        status: "MAINTAINED",
        startDate: "2026-01-01",
        endDate: null,
        imageUrl: "",
        demoUrl: "",
        githubUrl: "https://github.com/example/portfolio",
        documentationUrl: "",
        stacks: ["Java 21", "Spring Boot", "React"],
        features: [
          english ? "Automated tests" : "Tests automatisés",
          english ? "Accessible dialogs" : "Modales accessibles",
        ],
        links: [],
        featured: true,
        published: true,
        displayOrder: 1,
        slug: "portfolio-fiable",
      },
    ],
    websiteVersions: [],
    locale,
    provenSkills: [],
  };
}
