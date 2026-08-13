import { Alert, Loader, Stack, Text } from "@mantine/core";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import GlobalAquarium from "../GlobalAquarium";
import OceanMorphBackground from "../OceanMorphBackground";
import OceanWorldBridge from "../OceanWorldBridge";
import OceanTransitionStage from "../OceanTransitionStage";
import ProfileHero from "../ProfileHero";
import ProjectsShowcase from "../ProjectsShowcase";
import ProvenSkillsSection from "../ProvenSkillsSection";
import SiteFooter from "../SiteFooter";
import TopNavigation from "../TopNavigation";
import { apiRequest } from "../../services/authApi";
import { sortByDisplayOrder } from "../../utils/portfolio";
import useResponsiveProfile from "../../hooks/useResponsiveProfile";
import usePerformanceRuntime from "../../performance/usePerformanceRuntime";

const PortfolioTimeline = lazy(() => import("../PortfolioTimeline"));
const UnderwaterVolcanoField = lazy(() => import("../UnderwaterVolcanoField"));

function PreviewVolcano({ performanceMode, paused, runtimeQuality, runtimeBudget }) {
  if (["lite", "ultra-lite"].includes(performanceMode)) return <OceanWorldBridge variant="deep-projects" />;
  return <>
    <OceanWorldBridge variant="caldera" />
    <Suspense fallback={null}>
      <UnderwaterVolcanoField performanceMode={performanceMode} paused={paused} runtimeQuality={runtimeQuality} runtimeBudget={runtimeBudget} />
    </Suspense>
    <OceanWorldBridge variant="projects" />
  </>;
}

export default function AdminVersionPreviewPage() {
  const { ownerId, versionId } = useParams();
  const [params] = useSearchParams();
  const locale = params.get("locale") === "en" ? "en" : "fr";
  const responsiveProfile = useResponsiveProfile();
  const { runtimeQuality, runtimeBudget } = usePerformanceRuntime();
  const { isMobile, reducedMotion, performanceMode, preference, isFirefox, animationsEnabled, animationsPaused } = responsiveProfile;
  const [state, setState] = useState({ loading: true, owner: null, error: null, updatedAt: null });

  useEffect(() => {
    let disposed = false;
    let controller = null;

    const previousTitle = document.title;
    const existingRobots = document.querySelector('meta[name="robots"]');
    const robots = existingRobots ?? document.head.appendChild(document.createElement("meta"));
    const previousRobotsContent = existingRobots?.getAttribute("content") ?? null;
    robots.setAttribute("name", "robots");
    robots.setAttribute("content", "noindex,nofollow,noarchive");
    document.title = `Preview v${versionId} · Portfolio`;

    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      try {
        const owner = await apiRequest(
          "GET",
          `/manager/${ownerId}/versions/${versionId}/preview?locale=${locale}`,
          undefined,
          { signal: controller.signal },
        );
        if (!disposed) setState({ loading: false, owner, error: null, updatedAt: new Date().toISOString() });
      } catch (error) {
        if (!disposed && error?.name !== "AbortError") {
          setState((current) => ({ ...current, loading: false, error: error?.message ?? "Aperçu indisponible." }));
        }
      }
    }

    refresh();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 2500);

    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(intervalId);
      document.title = previousTitle;
      if (existingRobots) {
        if (previousRobotsContent == null) existingRobots.removeAttribute("content");
        else existingRobots.setAttribute("content", previousRobotsContent);
      } else {
        robots.remove();
      }
    };
  }, [ownerId, versionId, locale]);

  const owner = state.owner;
  const profile = owner?.prof ?? {};
  const projects = useMemo(() => sortByDisplayOrder(owner?.projects ?? []), [owner?.projects]);
  const experiences = useMemo(() => sortByDisplayOrder(owner?.timeline?.experiences ?? []), [owner?.timeline?.experiences]);
  const showVolcano = !isMobile && !reducedMotion && animationsEnabled && !["lite", "ultra-lite"].includes(performanceMode);

  if (state.loading) {
    return <main id="main-content" className="app-shell loading-shell" tabIndex={-1}><Loader size="lg" /><Text>Chargement de l’aperçu sécurisé…</Text></main>;
  }

  if (!owner) {
    return <main id="main-content" className="app-shell loading-shell" tabIndex={-1}><Alert color="red">{state.error ?? "Aucun aperçu disponible."}</Alert></main>;
  }

  return <main id="main-content" className="app-shell" tabIndex={-1} data-admin-version-preview>
    <OceanMorphBackground
      staticMode={performanceMode === "ultra-lite" || preference === "reduced"}
      depthOnly={performanceMode === "lite" && preference === "auto"}
      performanceMode={performanceMode}
      runtimeQuality={runtimeQuality}
    />
    <GlobalAquarium isMobile={isMobile} reducedMotion={reducedMotion} performanceMode={performanceMode} isFirefox={isFirefox} paused={animationsPaused} runtimeQuality={runtimeQuality} runtimeBudget={runtimeBudget} />
    <OceanTransitionStage reducedMotion={reducedMotion} performanceMode={performanceMode} paused={animationsPaused} runtimeQuality={runtimeQuality} />
    <TopNavigation owner={owner} source="preview" />

    <Stack gap="xl" className="content-shell">
      <Alert color="cyan" variant="light" title="APERÇU DRAFT — privé">
        Version {versionId} · actualisation automatique toutes les 2,5 s · dernière synchronisation {state.updatedAt ? new Date(state.updatedAt).toLocaleTimeString("fr-FR") : "—"}. Cet écran n’est jamais servi par l’API publique.
      </Alert>
      {state.error && <Alert color="yellow">Dernière actualisation en erreur : {state.error}. Le dernier snapshot valide reste affiché.</Alert>}
      <ProfileHero owner={owner} profile={profile} projects={projects} experiences={experiences} />
      <ProvenSkillsSection projects={projects} experiences={experiences} provenSkills={owner?.provenSkills} />
      <OceanWorldBridge variant="descent" />
      <Suspense fallback={<div className="section-skeleton">Chargement de la timeline…</div>}>
        <PortfolioTimeline timeline={owner?.timeline} experiences={experiences} performanceMode={performanceMode} />
      </Suspense>
      {showVolcano ? <PreviewVolcano performanceMode={performanceMode} paused={animationsPaused} runtimeQuality={runtimeQuality} runtimeBudget={runtimeBudget} /> : <OceanWorldBridge variant="deep-projects" />}
      <ProjectsShowcase projects={projects} />
      <OceanWorldBridge variant="crystal" />
      <SiteFooter owner={owner} />
    </Stack>
  </main>;
}
