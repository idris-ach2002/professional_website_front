import { useEffect } from "react";
import { registerSceneElement } from "./sceneRuntimeDirector";

let sequence = 0;

/**
 * Exact-visual offscreen clock backed by the shared Scene Runtime Director.
 * Infinite CSS animations are paused only when their entire scene is more than
 * one viewport away, then advanced by the hidden wall time before resuming.
 * This preserves the same visible animation phase without per-component
 * IntersectionObservers.
 */
export default function useOffscreenAnimationClock(rootRef, options = {}) {
  const { sceneId } = options;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    sequence += 1;
    return registerSceneElement(sceneId ?? root.id ?? `offscreen-scene-${sequence}`, root, {
      sleepCssAnimations: true,
    });
  }, [rootRef, sceneId]);
}
