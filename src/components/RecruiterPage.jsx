import { Stack } from "@mantine/core";
import { useState } from "react";
import { VisibilityGate } from "../visibility/ItemVisibilityContext";
import { useItemVisibility } from "../visibility/useItemVisibility";
import {
  recruiterExperienceVisibilityKey,
  recruiterProjectVisibilityKey,
  skillVisibilityKey,
} from "../visibility/itemVisibilityRegistry";

import MetadataHead from "./MetadataHead";
import OceanMorphBackground from "./OceanMorphBackground";
import TopNavigation from "./TopNavigation";
import RecruiterHero from "./recruiter/RecruiterHero";
import RecruiterContextBar from "./recruiter/RecruiterContextBar";
import RecruiterExperienceSection from "./recruiter/RecruiterExperienceSection";
import RecruiterProjectsSection from "./recruiter/RecruiterProjectsSection";
import RecruiterSkillsSection from "./recruiter/RecruiterSkillsSection";
import RecruiterEducationSection from "./recruiter/RecruiterEducationSection";
import RecruiterContactFooter from "./recruiter/RecruiterContactFooter";
import {
  selectRecruiterEducation,
  selectRecruiterExperiences,
  selectRecruiterProjects,
  selectRecruiterSkills,
  selectRecruiterTechGroups,
} from "./recruiter/recruiterSelectors";
import useLanguage from "../localization/useLanguage";
import {
  getOwnerFullName,
  getPrimaryContact,
} from "../utils/portfolio";
import "../styles/pages/recruiter-page.css";
import "../styles/pages/recruiter-app-mode.css";

async function copyCurrentUrl() {
  const url = window.location.href;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const input = document.createElement("textarea");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

export default function RecruiterPage({ owner }) {
  const { locale, localizedPath, t } = useLanguage();
  const { isVisible } = useItemVisibility();
  const [copied, setCopied] = useState(false);

  const profile = owner?.prof ?? {};
  const projects = owner?.projects ?? [];
  const experiences = owner?.timeline?.experiences ?? [];
  const ownerName = getOwnerFullName(owner);
  const email = getPrimaryContact(owner, "EMAIL");
  const github = getPrimaryContact(owner, "GITHUB");
  const linkedin = getPrimaryContact(owner, "LINKEDIN");

  const education = selectRecruiterEducation(owner);
  const recruiterExperiences = selectRecruiterExperiences(owner)
    .filter((experience, index) => isVisible(recruiterExperienceVisibilityKey(experience, index)));
  const recruiterProjects = selectRecruiterProjects(owner)
    .filter((project) => isVisible(recruiterProjectVisibilityKey(project)));
  const recruiterSkills = selectRecruiterSkills(owner)
    .filter((skill) => isVisible(skillVisibilityKey(skill, "recruiter.skills")));
  const techGroups = selectRecruiterTechGroups(owner);

  const handleCopy = async () => {
    try {
      await copyCurrentUrl();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main id="main-content" className="app-shell recruiter-page-shell" tabIndex={-1}>
      <MetadataHead owner={owner} projects={projects} experiences={experiences} page="recruiter" />
      <OceanMorphBackground staticMode />
      <TopNavigation owner={owner} />

      <Stack gap={0} className="content-shell recruiter-page-content">
        <VisibilityGate item="recruiter.hero">
          <RecruiterHero
            ownerName={ownerName}
            profile={profile}
            email={email}
            github={github}
            linkedin={linkedin}
            education={education}
            localizedPath={localizedPath}
            t={t}
            copied={copied}
            onCopy={handleCopy}
          />
        </VisibilityGate>

        <VisibilityGate item="recruiter.facts">
          <RecruiterContextBar profile={profile} education={education} t={t} />
        </VisibilityGate>

        <VisibilityGate item="recruiter.experience">
          <RecruiterExperienceSection experiences={recruiterExperiences} locale={locale} t={t} />
        </VisibilityGate>

        <VisibilityGate item="recruiter.projects">
          <RecruiterProjectsSection projects={recruiterProjects} localizedPath={localizedPath} t={t} />
        </VisibilityGate>

        <VisibilityGate item="recruiter.skills">
          <RecruiterSkillsSection skills={recruiterSkills} techGroups={techGroups} t={t} />
        </VisibilityGate>

        <VisibilityGate item="recruiter.education">
          <RecruiterEducationSection education={education} locale={locale} t={t} />
        </VisibilityGate>

        <VisibilityGate item="recruiter.contact">
          <RecruiterContactFooter
            ownerName={ownerName}
            profile={profile}
            email={email}
            github={github}
            linkedin={linkedin}
            localizedPath={localizedPath}
            t={t}
          />
        </VisibilityGate>
      </Stack>
    </main>
  );
}
