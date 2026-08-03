import { Loader, Select, Stack, Text } from "@mantine/core";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";

import AnalyticsTracker from "./components/AnalyticsTracker";
import GlobalAquarium from "./components/GlobalAquarium";
import OceanMorphBackground from "./components/OceanMorphBackground";
import ProfileHero from "./components/ProfileHero";
import ProjectsShowcase from "./components/ProjectsShowcase";
import ProvenSkillsSection from "./components/ProvenSkillsSection";
import SEOHead from "./components/MetadataHead";
import SiteFooter from "./components/SiteFooter"
import StatusBanner from "./components/StatusBanner";
import TopNavigation from "./components/TopNavigation";
import { ErrorBoundary } from "./components/errors/ErrorBoundary";

import { loadDemoPortfolio, readCachedPortfolio, refreshPortfolio } from "./services/portfolioApi";
import { getOwnerFullName, sortByDisplayOrder } from "./utils/portfolio";

import useResponsiveProfile from "./hooks/useResponsiveProfile";


const PortfolioTimeline = lazy(() => import("./components/PortfolioTimeline"));
const BeachBallField = lazy(() => import("./components/three/BeachBallField"));
const Admin = lazy(() => import("./components/Admin"));
const CvPage = lazy(() => import("./components/CvPage"));
const ProjectCaseStudyPage = lazy(() => import("./components/ProjectCaseStudyPage"));
const NotFoundPage = lazy(() => import("./components/NotFoundPage"));

function DeferredBeachBall({ performanceMode }) {
  const sentinelRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || shouldLoad) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "1200px 0px", threshold: 0.01 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [shouldLoad]);

  if (shouldLoad) {
    return (
      <ErrorBoundary
        title="La scène 3D a été désactivée"
        fallback={() => (
          <section className="beach-3d-section is-suspended" aria-hidden="true">
            <div className="beach-3d-stage">
              <div className="beach-3d-suspended-placeholder">
                <span />
                <span />
                <span />
              </div>
            </div>
          </section>
        )}
      >
        <Suspense
          fallback={
            <section className="beach-3d-section is-suspended" aria-hidden="true">
              <div className="beach-3d-stage">
                <div className="beach-3d-suspended-placeholder">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </section>
          }
        >
          <BeachBallField performanceMode={performanceMode} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <section
      ref={sentinelRef}
      className="beach-3d-section is-suspended"
      aria-label="Animation 3D chargée à l’approche"
    >
      <div className="beach-3d-stage">
        <div className="beach-3d-suspended-placeholder" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

function Home({
  owner,
  profile,
  projects,
  experiences,
  state,
  selectedOwnerId,
  setSelectedOwnerId,
}) {
  const responsiveProfile = useResponsiveProfile();
  const { isMobile, reducedMotion, performanceMode, isFirefox } = responsiveProfile;

  return (
    <main id="top" className="app-shell">
      <SEOHead owner={owner} projects={projects} experiences={experiences} />

      <OceanMorphBackground
        staticMode={performanceMode === "lite"}
        performanceMode={performanceMode}
      />
      <GlobalAquarium
        isMobile={isMobile}
        reducedMotion={reducedMotion}
        performanceMode={performanceMode}
        isFirefox={isFirefox}
      />

      <TopNavigation owner={owner} source={state.source} />

      <Stack gap="xl" className="content-shell">
        <StatusBanner source={state.source} error={state.error} cachedAt={state.cachedAt} />

        {state.owners.length > 1 && (
          <Select
            label="Owner affiché"
            data={state.owners.map((item) => ({
              value: String(item.ownerId),
              label: getOwnerFullName(item),
            }))}
            value={selectedOwnerId}
            onChange={setSelectedOwnerId}
            className="owner-select"
            radius="xl"
          />
        )}

        <ProfileHero
          owner={owner}
          profile={profile}
          projects={projects}
          experiences={experiences}
        />

        <ProvenSkillsSection projects={projects} experiences={experiences} provenSkills={owner?.provenSkills} />

        <Suspense
          fallback={
            <div className="section-skeleton">
              Chargement de la timeline…
            </div>
          }
        >
          <PortfolioTimeline
            timeline={owner?.timeline}
            experiences={experiences}
            performanceMode={performanceMode}
          />
        </Suspense>

        {!isMobile && !reducedMotion && (
          <DeferredBeachBall performanceMode={performanceMode} />
        )}

        <ProjectsShowcase projects={projects} />
        <SiteFooter owner={owner} />
      </Stack>
    </main>
  );
}

export default function App() {
  const [state, setState] = useState({
    loading: true,
    owners: [],
    owner: null,
    source: "demo",
    error: null,
    cachedAt: null,
  });

  const [selectedOwnerId, setSelectedOwnerId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const cached = readCachedPortfolio();

    const applyPayload = (payload) => {
      if (!mounted) return;

      setState({
        owners: payload.owners ?? [],
        owner: payload.owner ?? null,
        source: payload.source ?? "api",
        error: payload.error ?? null,
        loading: false,
        cachedAt: payload.cachedAt ?? null,
      });

      const primaryOwnerId = payload.owner?.ownerId;
      const firstOwnerId = payload.owners?.[0]?.ownerId;
      setSelectedOwnerId(String(primaryOwnerId || firstOwnerId || ""));
    };

    if (cached) {
      applyPayload(cached);
    }

    refreshPortfolio()
      .then((payload) => applyPayload(payload))
      .catch(async (error) => {
        if (!mounted) return;

        if (cached) {
          setState((previousState) => ({
            ...previousState,
            loading: false,
                    source: "cache",
            error: error?.message ?? "Actualisation de l’API indisponible.",
          }));
          return;
        }

        const fallback = await loadDemoPortfolio(error);
        applyPayload(fallback);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const owner = useMemo(() => {
    if (!selectedOwnerId) {
      return state.owner;
    }

    return (
      state.owners.find((item) => String(item.ownerId) === selectedOwnerId) ??
      state.owner
    );
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
    <>
      <AnalyticsTracker source={state.source} />
      <Routes>
      <Route
        path="/"
        element={
          <Home
            owner={owner}
            profile={profile}
            projects={projects}
            experiences={experiences}
            state={state}
            selectedOwnerId={selectedOwnerId}
            setSelectedOwnerId={setSelectedOwnerId}
          />
        }
      />

      <Route
        path="/admin"
        element={
          <ErrorBoundary title="L’administration n’a pas pu être chargée">
            <Suspense fallback={<div className="route-loading">Chargement…</div>}>
              <Admin />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/cv"
        element={
          <ErrorBoundary title="Le CV n’a pas pu être chargé">
            <Suspense fallback={<div className="route-loading">Chargement…</div>}>
              <CvPage owner={owner} profile={profile} />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/projects/:projectSlug"
        element={
          <ErrorBoundary title="Cette étude de cas n’a pas pu être chargée">
            <Suspense fallback={<div className="route-loading">Chargement…</div>}>
              <ProjectCaseStudyPage owner={owner} projects={projects} />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="*"
        element={
          <Suspense fallback={<div className="route-loading">Chargement…</div>}>
            <NotFoundPage />
          </Suspense>
        }
      />
      </Routes>
    </>
  );
}