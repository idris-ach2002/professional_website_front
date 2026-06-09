import { Loader, Select, Stack, Text } from "@mantine/core";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import ContactSection from "./components/ContactSection";
import ExpertisePanel from "./components/ExpertisePanel";
import ProfileHero from "./components/ProfileHero";
import ProjectsShowcase from "./components/ProjectsShowcase";
import OceanRecruitmentReef from "./components/OceanRecruitmentReef";
import SEOHead from "./components/MetadataHead";
import StatusBanner from "./components/StatusBanner";
import TopNavigation from "./components/TopNavigation";
import VisualIdentityBackground from "./components/VisualIdentityBackground";
import { loadPortfolio } from "./services/portfolioApi";
import { getOwnerFullName, sortByDisplayOrder } from "./utils/portfolio";
import "./index.css";

const PortfolioTimeline = lazy(() => import("./components/PortfolioTimeline"));

export default function App() {
  const [state, setState] = useState({ loading: true, owners: [], owner: null, source: "demo", error: null });
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);

  useEffect(() => {
    let mounted = true;

    loadPortfolio().then((payload) => {
      if (!mounted) return;
      setState({ ...payload, loading: false });
      const primaryOwnerId = payload.owner?.ownerId;
      const firstOwnerId = payload.owners?.[0]?.ownerId;

      setSelectedOwnerId(String(primaryOwnerId || firstOwnerId || "0"));
    });

    return () => {
      mounted = false;
    };
  }, []);

  const owner = useMemo(() => {
    if (!selectedOwnerId) return state.owner;
    return state.owners.find((item) => String(item.ownerId) === selectedOwnerId) ?? state.owner;
  }, [selectedOwnerId, state.owner, state.owners]);

  const profile = owner?.prof ?? {};
  const projects = sortByDisplayOrder(owner?.projects ?? []);
  const experiences = sortByDisplayOrder(owner?.timeline?.experiences ?? []);

  if (state.loading) {
    return (
      <main className="app-shell loading-shell">
        <Loader size="lg" />
        <Text>Chargement du portfolio professionnel…</Text>
      </main>
    );
  }

  return (
    <main id="top" className="app-shell">
      <SEOHead owner={owner} projects={projects} experiences={experiences} />
      <VisualIdentityBackground owner={owner} />
      <TopNavigation owner={owner} source={state.source} />
      <Stack gap="xl" className="content-shell">
        <StatusBanner source={state.source} error={state.error} />
        {state.owners.length > 1 && (
          <Select
            label="Owner affiché"
            data={state.owners.map((item) => ({ value: String(item.ownerId), label: getOwnerFullName(item) }))}
            value={selectedOwnerId}
            onChange={setSelectedOwnerId}
            className="owner-select"
            radius="xl"
          />
        )}
        <ProfileHero owner={owner} profile={profile} projects={projects} experiences={experiences} />
        <Suspense fallback={<div className="section-skeleton">Chargement de la timeline…</div>}>
          <PortfolioTimeline timeline={owner?.timeline} experiences={experiences} />
        </Suspense>
        <ProjectsShowcase projects={projects} />
        <OceanRecruitmentReef projects={projects} experiences={experiences} />
        <ExpertisePanel projects={projects} experiences={experiences} />
        <ContactSection owner={owner} source={state.source} />
      </Stack>
      <footer className="footer-shell">
        <Text>Portfolio professionnel généré depuis Spring · React · Mantine · GSAP · SEO dynamique</Text>
      </footer>
    </main>
  );
}
