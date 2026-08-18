import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const errors = [];
const requireText = (source, token, message) => { if (!source.includes(token)) errors.push(message); };
const forbidText = (source, token, message) => { if (source.includes(token)) errors.push(message); };

const app = read("src/App.jsx");
const volcano = read("src/components/UnderwaterVolcanoField.jsx");
const ocean = read("src/components/OceanTransitionStage.jsx");
const oceanMorph = read("src/components/OceanMorphBackground.jsx");
const timeline = read("src/components/PortfolioTimeline.jsx");
const nav = read("src/components/navigation/usePremiumNavigationMotion.js");
const navShell = read("src/components/navigation/usePremiumNavigationShellMotion.js");
const volcanoWorker = read("src/workers/volcanoCanvasRender.worker.js");
const oceanWorker = read("src/workers/oceanTransitionRender.worker.js");
const oceanController = read("src/performance/oceanTransitionOffscreenController.js");
const protocol = read("src/performance/volcanoWorkerProtocol.js");
const engine = read("src/animations/volcanoSimulationEngine.js");
const initial = read("scripts/check-initial-source-closure.mjs");
const e2e = read("e2e/transparent-performance.spec.js");
const analytics = read("src/components/AnalyticsTracker.jsx");
const pkg = JSON.parse(read("package.json"));

requireText(app, 'import OceanTransitionStage from "./components/OceanTransitionStage";', "OceanTransitionStage must stay synchronously mounted so no cinematic event can be missed");
forbidText(app, 'const OceanTransitionStage = lazy(() => import("./components/OceanTransitionStage"));', "OceanTransitionStage must not be delayed behind a lazy boundary");
requireText(ocean, 'import("../performance/oceanTransitionOffscreenController.js")', "ocean worker controller must stay dynamically imported");
requireText(oceanController, "scheduleBackgroundTask", "ocean worker must initialize as background work");
requireText(oceanController, "transferControlToOffscreen", "ocean transition OffscreenCanvas transfer path missing");
requireText(ocean, 'data-render-thread="main"', "ocean fallback render-thread marker missing");
requireText(ocean, "useEffect(() => {\n    runtimeQualityRef.current = runtimeQuality;\n  }, [runtimeQuality]);", "ocean runtime-quality ref must synchronize after render");
requireText(oceanWorker, "drawScene(context, sceneKey", "ocean worker must reuse the deterministic renderer");

requireText(volcano, "transferControlToOffscreen", "volcano OffscreenCanvas path missing");
requireText(volcano, 'root.dataset.volcanoCanvasRenderer = root.dataset.volcanoCanvasRenderer || "main"', "volcano renderer diagnostic must be initialized as DOM-owned state");
requireText(volcano, 'root.dataset.volcanoPulse = root.dataset.volcanoPulse || "base"', "volcano pulse diagnostic must be initialized as DOM-owned state");
requireText(volcano, "const workerPending = canvasWorkerPendingRef.current", "volcano must guard the deferred Offscreen transfer from main-thread getContext claims");
const inactiveCanvasGuard = "if (!particleCanvas || !debrisCanvas || !active || workerPending)";
const inactiveCanvasGuardIndex = volcano.indexOf(inactiveCanvasGuard);
const particleContextIndex = volcano.indexOf('const context = workerOwned ? null : particleCanvas.getContext');
const debrisContextIndex = volcano.indexOf('const debrisContext = workerOwned ? null : debrisCanvas.getContext');
if (inactiveCanvasGuardIndex < 0 || particleContextIndex < 0 || inactiveCanvasGuardIndex > particleContextIndex) {
  errors.push("particle Canvas must not create a 2D context while inactive or Offscreen transfer is pending");
}
if (inactiveCanvasGuardIndex < 0 || debrisContextIndex < 0 || inactiveCanvasGuardIndex > debrisContextIndex) {
  errors.push("debris Canvas must not create a 2D context while inactive or Offscreen transfer is pending");
}
requireText(volcano, 'rootRef.current.dataset.volcanoCanvasRenderer = "worker"', "volcano diagnostic must report Worker ownership only after ready");
if (/data-volcano-canvas-renderer=["{]/.test(volcano)) {
  errors.push("React JSX must not own data-volcano-canvas-renderer; it would overwrite runtime Worker ownership on rerender.");
}
if (/data-volcano-pulse=["{]/.test(volcano)) {
  errors.push("React JSX must not own data-volcano-pulse; runtime pulse updates must not be overwritten on rerender.");
}
requireText(volcano, "writeVolcanoFrame", "volcano transferable frame protocol missing");
requireText(volcano, "canvasWorkerBuffersRef", "volcano reusable transfer-buffer pool missing");
requireText(volcano, "useEffect(() => {\n    countsRef.current = counts;\n    rockfallLimitRef.current = rockfallLimit;\n    dprRef.current = dpr;\n  }, [counts, rockfallLimit, dpr]);", "volcano runtime refs must synchronize after render");
requireText(volcano, "resolveVolcanoStageProfileInto", "volcano profile reuse missing");
forbidText(volcano, "setPulseName(", "volcano pulse updates must not trigger React rerenders");
forbidText(volcano, "setEruptionReaction(", "volcano reaction updates must not trigger React rerenders");
requireText(volcanoWorker, "new Float64Array(message.buffer)", "volcano worker must consume transferred Float64 draw state");
requireText(volcanoWorker, "decodeVolcanoParticles", "volcano worker must decode main-thread particle state rather than resimulate it");
forbidText(volcanoWorker, "stepVolcanoParticles(", "volcano worker must not alter the original particle simulation timing");
forbidText(volcanoWorker, "stepVolcanoRockfall(", "volcano worker must not alter the original rockfall simulation timing");
requireText(volcanoWorker, 'type: "buffer-return"', "volcano worker must return buffers for reuse");
requireText(protocol, "writeVolcanoFrame", "volcano worker protocol writer missing");
requireText(protocol, "readVolcanoFrame", "volcano worker protocol reader missing");
requireText(engine, "resolveVolcanoStageProfileInto", "allocation-free volcano profile API missing");

requireText(timeline, "const visibleCardInfo = cards.map", "timeline visible-card object pool missing");
requireText(timeline, "const cachedCardGeometry = cards.map", "timeline geometry cache missing");
forbidText(timeline, "const candidates = [...visibleCards.entries()]", "timeline per-sync candidate allocation returned");
requireText(timeline, "This is the only Timeline geometry read phase", "timeline DOM read batching contract missing");
forbidText(timeline, "FossilTimelineSurface", "legacy V10 Timeline must stay Canvas-free");
forbidText(timeline, "resizeObserver?.observe(document.body)", "Timeline must not invalidate geometry from unrelated body resizes");
requireText(oceanMorph, "global-ocean-depth-overlay", "ocean global depth overlay isolation missing");
forbidText(oceanMorph, "--global-ocean-depth", "ocean depth must not invalidate the document root with inherited custom properties");

requireText(nav, "const geometry = new Map()", "navigation geometry cache missing");
requireText(nav, "refreshGeometry", "navigation batched geometry refresh missing");
requireText(navShell, "let shellRect = shell.getBoundingClientRect()", "navigation shell geometry cache missing");
requireText(navShell, "new ResizeObserver(refreshShellGeometry)", "navigation shell cache invalidation missing");

requireText(initial, "427_000", "V9 initial source ceiling must remain enforced");
requireText(initial, '"src/performance/oceanTransitionOffscreenController.js"', "ocean worker controller must stay outside the initial static graph");
requireText(initial, '"src/workers/oceanTransitionRender.worker.js"', "ocean render worker must stay outside the initial static graph");
requireText(initial, '"src/workers/volcanoCanvasRender.worker.js"', "volcano render worker must stay outside the initial static graph");

requireText(app, 'const PortfolioTimeline = lazy(', "existing Timeline feature split must remain");
requireText(app, 'const ProjectsShowcase = lazy(', "existing Projects feature split must remain");
requireText(app, 'const SiteFooter = lazy(', "existing Footer feature split must remain");
requireText(analytics, "scheduleBackgroundTask", "non-urgent analytics must remain background-scheduled");
forbidText(oceanWorker, "requestAnimationFrame(", "ocean render worker must stay message-driven with no autonomous RAF");
forbidText(oceanWorker, "setInterval(", "ocean render worker must stay idle without messages");
forbidText(volcanoWorker, "requestAnimationFrame(", "volcano render worker must stay message-driven with no autonomous RAF");
forbidText(volcanoWorker, "setInterval(", "volcano render worker must stay idle without messages");
requireText(e2e, 'portfolio-animation-preference", "full"', "transparent-performance E2E must force the full render profile before navigation");
requireText(e2e, 'data-performance-profile", "full"', "transparent-performance E2E must prove the full profile is active");
requireText(e2e, '["main", "worker"]', "transparent-performance E2E must accept both valid renderer ownership states without scheduler polling");
forbidText(e2e, "expect.poll(", "transparent-performance E2E must not poll until Worker scheduling becomes favorable");
forbidText(e2e, "reconcileWorldAtAnchor", "transparent-performance E2E must not use lazy-world timing as proof of Worker correctness");
requireText(read("src/performance/oceanTransitionOffscreenController.test.js"), "transfère exactement le canvas", "deterministic OffscreenCanvas controller unit test missing");
requireText(read("src/performance/oceanTransitionOffscreenController.test.js"), "termine le Worker si le transfert échoue", "OffscreenCanvas transfer failure contract missing");

if (!pkg.scripts?.["check:transparent-performance"]?.includes("check-transparent-performance.mjs")) {
  errors.push("check:transparent-performance script missing");
}
if (!pkg.scripts?.["test:e2e:transparent-performance"]?.includes("transparent-performance.spec.js")) {
  errors.push("transparent performance Playwright script missing");
}
if (!pkg.scripts?.["test:e2e"]?.includes("test:e2e:transparent-performance")) {
  errors.push("transparent performance E2E must be part of the normal E2E chain");
}
if (!pkg.scripts?.["check:final"]?.includes("check:transparent-performance")) {
  errors.push("final release contract must enforce transparent performance");
}

if (errors.length) {
  console.error(`Transparent performance contract FAILED:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log("Transparent performance contract OK: render-only Offscreen workers, transferable Float64 buffers, simulation-preserving allocation/geometry reuse, feature splitting and idle scheduling are locked while V10 keeps render formulas and non-Timeline visual geometry under an explicit UI contract.");
