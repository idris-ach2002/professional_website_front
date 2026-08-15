import { Loader, Select, Stack, Text } from "@mantine/core";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";

import AnalyticsTracker from "./components/AnalyticsTracker";
import GlobalAquarium from "./components/GlobalAquarium";
import OceanMorphBackground from "./components/OceanMorphBackground";
import OceanWorldBridge from "./components/OceanWorldBridge";
import OceanTransitionStage from "./components/OceanTransitionStage";
import ProfileHero from "./components/ProfileHero";
import ProvenSkillsSection from "./components/ProvenSkillsSection";
import SEOHead from "./components/MetadataHead";
import StatusBanner from "./components/StatusBanner";
import TopNavigation from "./components/TopNavigation";
import ViewportStability from "./components/ViewportStability";
import { ErrorBoundary } from "./components/errors/ErrorBoundary";
import { RouteFocusManager, SkipToContent } from "./components/RouteAccessibility";

import { loadDemoPortfolio, readCachedPortfolio, refreshPortfolio } from "./services/portfolioApi";
import { getOwnerFullName, sortByDisplayOrder } from "./utils/portfolio";

import useResponsiveProfile from "./hooks/useResponsiveProfile";
import useLanguage from "./localization/useLanguage";
import usePerformanceRuntime from "./performance/usePerformanceRuntime";
import { ItemVisibilityProvider, VisibilityGate } from "./visibility/ItemVisibilityContext";


const PortfolioTimeline = lazy(() => import("./components/PortfolioTimeline"));
const ProjectsShowcase = lazy(() => import("./components/ProjectsShowcase"));
const SiteFooter = lazy(() => import("./components/SiteFooter"));
const loadUnderwaterVolcanoField = () => import("./components/UnderwaterVolcanoField");
const UnderwaterVolcanoField = lazy(loadUnderwaterVolcanoField);
const Admin = lazy(() => import("./components/Admin"));
const AdminVersionPreviewPage = lazy(() => import("./components/admin/AdminVersionPreviewPage"));
const CvPage = lazy(() => import("./components/CvPage"));
const ProjectCaseStudyPage = lazy(() => import("./components/ProjectCaseStudyPage"));
const NotFoundPage = lazy(() => import("./components/NotFoundPage"));
const RecruiterPage = lazy(() => import("./components/RecruiterPage"));
const MissionControlPage = lazy(() => import("./components/MissionControlPage"));

function DeferredVolcanoField({ performanceMode, animationsPaused, runtimeQuality, runtimeBudget }) {
  const { t } = useLanguage();
  const { requestPrefetch } = usePerformanceRuntime();
  const sentinelRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return undefined;
    const result = requestPrefetch("underwater-volcano-module", loadUnderwaterVolcanoField, {
      probability: 0.60,
      cost: "high",
    });
    result.promise?.catch(() => {});
    return undefined;
  }, [requestPrefetch, shouldLoad]);

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
        title={t("error.volcanoTitle")}
        fallback={() => (
          <section className="volcano-field-section is-suspended" aria-hidden="true">
            <div className="volcano-field-stage">
              <div className="volcano-field-placeholder" />
            </div>
          </section>
        )}
      >
        <Suspense
          fallback={
            <section className="volcano-field-section is-suspended" aria-hidden="true">
              <div className="volcano-field-stage">
                <div className="volcano-field-placeholder" />
              </div>
            </section>
          }
        >
          <UnderwaterVolcanoField performanceMode={performanceMode} paused={animationsPaused} runtimeQuality={runtimeQuality} runtimeBudget={runtimeBudget} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <section
      ref={sentinelRef}
      className="volcano-field-section is-suspended"
      aria-label={t("app.routeLoading")}
    >
      <div className="volcano-field-stage">
        <div className="volcano-field-placeholder" aria-hidden="true" />
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
  const { runtimeQuality, runtimeBudget } = usePerformanceRuntime();
  const { isMobile, reducedMotion, performanceMode, preference, isFirefox, animationsEnabled, animationsPaused } = responsiveProfile;
  const showVolcano = !isMobile && !reducedMotion && animationsEnabled && !["lite", "ultra-lite"].includes(performanceMode);

  return (
    <main id="main-content" className="app-shell" tabIndex={-1}>
      <SEOHead owner={owner} projects={projects} experiences={experiences} />

      <VisibilityGate item="global.ambient.background"><OceanMorphBackground
        staticMode={performanceMode === "ultra-lite" || preference === "reduced"}
        depthOnly={performanceMode === "lite" && preference === "auto"}
        performanceMode={performanceMode}
        runtimeQuality={runtimeQuality}
      /></VisibilityGate>
      <VisibilityGate item="global.ambient.aquarium"><GlobalAquarium
        isMobile={isMobile}
        reducedMotion={reducedMotion}
        performanceMode={performanceMode}
        isFirefox={isFirefox}
        paused={animationsPaused}
        runtimeQuality={runtimeQuality}
        runtimeBudget={runtimeBudget}
      /></VisibilityGate>
      <VisibilityGate item="global.ambient.transitions"><OceanTransitionStage
        reducedMotion={reducedMotion}
        performanceMode={performanceMode}
        paused={animationsPaused}
        runtimeQuality={runtimeQuality}
      /></VisibilityGate>

      <VisibilityGate item="global.navbar"><TopNavigation owner={owner} source={state.source} /></VisibilityGate>

      <Stack gap="xl" className="content-shell">
        <VisibilityGate item="home.status"><StatusBanner source={state.source} error={state.error} cachedAt={state.cachedAt} /></VisibilityGate>

        {state.owners.length > 1 && (
          <VisibilityGate item="home.owner-selector"><Select
            label={t("status.ownerLabel")}
            data={state.owners.map((item) => ({
              value: String(item.ownerId),
              label: getOwnerFullName(item),
            }))}
            value={selectedOwnerId}
            onChange={setSelectedOwnerId}
            className="owner-select"
            radius="xl"
          /></VisibilityGate>
        )}

        <VisibilityGate item="home.profile"><ProfileHero
          owner={owner}
          prof={profile}
        /></VisibilityGate>

        <VisibilityGate item="home.skills"><ProvenSkillsSection projects={projects} experiences={experiences} provenSkills={owner?.provenSkills} /></VisibilityGate>

        <OceanWorldBridge variant="descent" />

        <Suspense
          fallback={
            <div className="section-skeleton">
              {t("app.routeLoading")}
            </div>
          }
        >
          <VisibilityGate item="home.timeline"><PortfolioTimeline
            timeline={owner?.timeline}
            experiences={experiences}
            performanceMode={performanceMode}
          /></VisibilityGate>
        </Suspense>

        {showVolcano ? (
          <>
            <OceanWorldBridge variant="caldera" />
            <VisibilityGate item="home.volcano"><DeferredVolcanoField performanceMode={performanceMode} animationsPaused={animationsPaused} runtimeQuality={runtimeQuality} runtimeBudget={runtimeBudget} /></VisibilityGate>
            <OceanWorldBridge variant="projects" />
          </>
        ) : (
          <OceanWorldBridge variant="deep-projects" />
        )}

        <Suspense fallback={<div className="section-skeleton">{t("app.routeLoading")}</div>}>
          <VisibilityGate item="home.projects"><ProjectsShowcase projects={projects} /></VisibilityGate>
        </Suspense>
        <OceanWorldBridge variant="crystal" />
        <Suspense fallback={null}>
          <VisibilityGate item="home.footer"><SiteFooter owner={owner} /></VisibilityGate>
        </Suspense>
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
  const projects = useMemo(() => sortByDisplayOrder(owner?.projects ?? []), [owner?.projects]);
  const experiences = useMemo(
    () => sortByDisplayOrder(owner?.timeline?.experiences ?? []),
    [owner?.timeline?.experiences],
  );

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
        <RecruiterPage owner={owner} />
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

  const missionControlElement = (
    <ErrorBoundary title="Architecture technique">
      <Suspense fallback={<div className="route-loading">{t("app.routeLoading")}</div>}>
        <MissionControlPage owner={owner} projects={projects} experiences={experiences} />
      </Suspense>
    </ErrorBoundary>
  );

  return (
    <ItemVisibilityProvider>
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
        <Route path="/admin/preview/:ownerId/:versionId" element={<Suspense fallback={<div className="route-loading">{t("app.routeLoading")}</div>}><AdminVersionPreviewPage /></Suspense>} />
        <Route path="/en/admin/preview/:ownerId/:versionId" element={<Suspense fallback={<div className="route-loading">{t("app.routeLoading")}</div>}><AdminVersionPreviewPage /></Suspense>} />
        <Route path="/cv" element={cvElement} />
        <Route path="/en/cv" element={cvElement} />
        <Route path="/recruiter" element={recruiterElement} />
        <Route path="/en/recruiter" element={recruiterElement} />
        <Route path="/engineering" element={missionControlElement} />
        <Route path="/en/engineering" element={missionControlElement} />
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
    </ItemVisibilityProvider>
  );
}
