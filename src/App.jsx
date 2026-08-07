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
import SiteFooter from "./components/SiteFooter";
import StatusBanner from "./components/StatusBanner";
import TopNavigation from "./components/TopNavigation";
import ViewportStability from "./components/ViewportStability";
import { ErrorBoundary } from "./components/errors/ErrorBoundary";
import { RouteFocusManager, SkipToContent } from "./components/RouteAccessibility";

import { loadDemoPortfolio, readCachedPortfolio, refreshPortfolio } from "./services/portfolioApi";
import { getOwnerFullName, sortByDisplayOrder } from "./utils/portfolio";

import useResponsiveProfile from "./hooks/useResponsiveProfile";
import useLanguage from "./localization/useLanguage";


const PortfolioTimeline = lazy(() => import("./components/PortfolioTimeline"));
const BeachBallField = lazy(() => import("./components/three/BeachBallField"));
const Admin = lazy(() => import("./components/Admin"));
const CvPage = lazy(() => import("./components/CvPage"));
const ProjectCaseStudyPage = lazy(() => import("./components/ProjectCaseStudyPage"));
const NotFoundPage = lazy(() => import("./components/NotFoundPage"));
const RecruiterPage = lazy(() => import("./components/RecruiterPage"));

function DeferredBeachBall({ performanceMode, animationsPaused }) {
  const { t } = useLanguage();
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
        title={t("error.threeTitle")}
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
          <BeachBallField performanceMode={performanceMode} paused={animationsPaused} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <section
      ref={sentinelRef}
      className="beach-3d-section is-suspended"
      aria-label={t("app.routeLoading")}
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
  const { t } = useLanguage();
  const { isMobile, reducedMotion, performanceMode, isFirefox, animationsEnabled, animationsPaused } = responsiveProfile;

  return (
    <main id="main-content" className="app-shell" tabIndex={-1}>
      <SEOHead owner={owner} projects={projects} experiences={experiences} />

      <OceanMorphBackground
        staticMode={performanceMode === "lite" || performanceMode === "ultra-lite"}
        performanceMode={performanceMode}
      />
      <GlobalAquarium
        isMobile={isMobile}
        reducedMotion={reducedMotion}
        performanceMode={performanceMode}
        isFirefox={isFirefox}
        paused={animationsPaused}
      />

      <TopNavigation owner={owner} source={state.source} />

      <Stack gap="xl" className="content-shell">
        <StatusBanner source={state.source} error={state.error} cachedAt={state.cachedAt} />

        {state.owners.length > 1 && (
          <Select
            label={t("status.ownerLabel")}
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
              {t("app.routeLoading")}
            </div>
          }
        >
          <PortfolioTimeline
            timeline={owner?.timeline}
            experiences={experiences}
            performanceMode={performanceMode}
          />
        </Suspense>

        {!isMobile && !reducedMotion && animationsEnabled && !["lite", "ultra-lite"].includes(performanceMode) && (
          <DeferredBeachBall performanceMode={performanceMode} animationsPaused={animationsPaused} />
        )}

        <ProjectsShowcase projects={projects} />
        <SiteFooter owner={owner} />
      </Stack>
    </main>
  );
}

export default function App() {
  const { language, t } = useLanguage();
  const [state, setState] = useState({
    loading: true,
    language: null,
    owners: [],
    owner: null,
    source: "demo",
    error: null,
    cachedAt: null,
  });

  const [selectedOwnerId, setSelectedOwnerId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const cached = readCachedPortfolio(language);

    const applyPayload = (payload) => {
      if (!mounted) return;

      setState({
        language,
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
      queueMicrotask(() => applyPayload(cached));
    }

    refreshPortfolio(language)
      .then((payload) => applyPayload(payload))
      .catch(async (error) => {
        if (!mounted) return;

        if (cached) {
          setState((previousState) => ({
            ...previousState,
            loading: false,
                    source: "cache",
            error: error?.message ?? "API unavailable",
          }));
          return;
        }

        const fallback = await loadDemoPortfolio(error);
        applyPayload(fallback);
      });

    return () => {
      mounted = false;
    };
  }, [language]);

  const rawOwner = useMemo(() => {
    if (!selectedOwnerId) {
      return state.owner;
    }

    return (
      state.owners.find((item) => String(item.ownerId) === selectedOwnerId) ??
      state.owner
    );
  }, [selectedOwnerId, state.owner, state.owners]);

  const owner = rawOwner;
  const profile = owner?.prof ?? {};
  const projects = sortByDisplayOrder(owner?.projects ?? []);
  const experiences = sortByDisplayOrder(owner?.timeline?.experiences ?? []);

  const isPortfolioLoading = state.loading || state.language !== language;

  if (isPortfolioLoading) {
    return (
      <main id="main-content" className="app-shell loading-shell" tabIndex={-1}>
        <Loader size="lg" />
        <Text>{t("app.loading")}</Text>
      </main>
    );
  }

  const homeElement = (
    <Home
      owner={owner}
      profile={profile}
      projects={projects}
      experiences={experiences}
      state={state}
      selectedOwnerId={selectedOwnerId}
      setSelectedOwnerId={setSelectedOwnerId}
    />
  );

  const adminElement = (
    <ErrorBoundary title={t("error.adminTitle")}>
      <Suspense fallback={<div className="route-loading">{t("app.routeLoading")}</div>}>
        <Admin />
      </Suspense>
    </ErrorBoundary>
  );

  const cvElement = (
    <ErrorBoundary title={t("error.cvTitle")}>
      <Suspense fallback={<div className="route-loading">{t("app.routeLoading")}</div>}>
        <CvPage owner={owner} profile={profile} />
      </Suspense>
    </ErrorBoundary>
  );

  const recruiterElement = (
    <ErrorBoundary title={t("error.sectionTitle")}>
      <Suspense fallback={<div className="route-loading">{t("app.routeLoading")}</div>}>
        <RecruiterPage owner={owner} profile={profile} projects={projects} experiences={experiences} />
      </Suspense>
    </ErrorBoundary>
  );

  const projectElement = (
    <ErrorBoundary title={t("error.caseTitle")}>
      <Suspense fallback={<div className="route-loading">{t("app.routeLoading")}</div>}>
        <ProjectCaseStudyPage owner={owner} projects={projects} />
      </Suspense>
    </ErrorBoundary>
  );

  return (
    <>
      <ViewportStability />
      <SkipToContent />
      <RouteFocusManager />
      <AnalyticsTracker source={state.source} />
      <Routes>
        <Route path="/" element={homeElement} />
        <Route path="/en" element={homeElement} />
        <Route path="/admin" element={adminElement} />
        <Route path="/en/admin" element={adminElement} />
        <Route path="/cv" element={cvElement} />
        <Route path="/en/cv" element={cvElement} />
        <Route path="/recruiter" element={recruiterElement} />
        <Route path="/en/recruiter" element={recruiterElement} />
        <Route path="/projects/:projectSlug" element={projectElement} />
        <Route path="/en/projects/:projectSlug" element={projectElement} />
        <Route
          path="*"
          element={
            <Suspense fallback={<div className="route-loading">{t("app.routeLoading")}</div>}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}
