export function portfolioOwner(locale = "fr") {
  const english = locale === "en";
  return {
    ownerId: 1,
    name: "ACHABOU",
    firstName: "Idris",
    age: 23,
    active: true,
    address: "Île-de-France",
    contacts: [],
    prof: {
      id: 10,
      title: english ? "Full Stack Java Developer" : "Développeur Java Full Stack",
      subtitle: "Java 21 / Spring Boot / React / PostgreSQL",
      headline: english ? "Reliable software engineering." : "Ingénierie logicielle fiable.",
      shortDescription: english ? "Professional portfolio." : "Portfolio professionnel.",
      description: english ? "Backend, frontend and quality." : "Backend, frontend et qualité.",
      location: "Île-de-France",
      availability: english ? "Available from September 2026" : "Disponible dès septembre 2026",
      profileImageUrl: "",
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
      experiences: [],
    },
    projects: [],
    websiteVersions: [],
    locale,
    provenSkills: [],
  };
}
