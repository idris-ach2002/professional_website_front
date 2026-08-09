import { clamp, clamp01, smoothstep } from "./timelineMotion";

export const INSPECTION_PHASES = Object.freeze({
  IDLE: "idle",
  VANISH: "vanish",
  APPEAR: "appear",
  TRANSIT: "transit",
  INSPECT: "inspect",
});

const VANISH_DURATION = 0.075;
const APPEAR_DURATION = 0.095;

function smootherstep(value) {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function dockingPoint(index, side, mobile, requestedY) {
  const safeIndex = Math.max(0, Number(index) || 0);
  const facing = side === "right" ? "right" : "left";
  const yPattern = mobile
    ? [0.26, 0.46, 0.66, 0.38, 0.58]
    : [0.22, 0.42, 0.64, 0.31, 0.55, 0.72];

  const fallbackY = yPattern[safeIndex % yPattern.length];
  return {
    x: mobile
      ? facing === "right" ? 0.06 : 0.62
      : facing === "right" ? 0.08 : 0.64,
    y: Number.isFinite(Number(requestedY))
      ? clamp(Number(requestedY), mobile ? 0.18 : 0.14, mobile ? 0.78 : 0.82)
      : fallbackY,
    facing,
  };
}

function startTransit(state, target, mobile) {
  const dock = dockingPoint(target.index, target.side, mobile, target.y);
  const distance = Math.hypot(dock.x - state.x, dock.y - state.y);
  const duration = clamp(
    0.26 + distance * (mobile ? 0.44 : 0.52),
    0.34,
    mobile ? 0.62 : 0.72,
  );
  return {
    ...state,
    phase: INSPECTION_PHASES.TRANSIT,
    phaseElapsed: 0,
    targetIndex: target.index,
    targetSide: target.side,
    pendingTarget: null,
    startX: state.x,
    startY: state.y,
    targetX: dock.x,
    targetY: dock.y,
    transitDuration: duration,
    opacity: Math.max(state.opacity, 0.96),
    torch: 0.92,
  };
}

export function createInspectionPilot({
  x = 0.5,
  y = 0.18,
  facing = "left",
} = {}) {
  return {
    x: clamp01(x),
    y: clamp01(y),
    baseX: clamp01(x),
    baseY: clamp01(y),
    facing: facing === "right" ? "right" : "left",
    opacity: 0,
    torch: 0,
    phase: INSPECTION_PHASES.IDLE,
    phaseElapsed: 0,
    targetIndex: -1,
    targetSide: "left",
    pendingTarget: null,
    startX: clamp01(x),
    startY: clamp01(y),
    targetX: clamp01(x),
    targetY: clamp01(y),
    transitDuration: 4.5,
    inspectElapsed: 0,
  };
}

export function requestInspectionTarget(state, target, {
  mobile = false,
} = {}) {
  if (!target || !Number.isFinite(Number(target.index))) return state;

  const normalizedTarget = {
    index: Number(target.index),
    side: target.side === "right" ? "right" : "left",
    y: Number.isFinite(Number(target.y)) ? clamp01(Number(target.y)) : undefined,
  };

  if (
    state.targetIndex === normalizedTarget.index
    && state.phase !== INSPECTION_PHASES.IDLE
    && !state.pendingTarget
  ) {
    return state;
  }

  const requiredFacing = dockingPoint(normalizedTarget.index, normalizedTarget.side, mobile, normalizedTarget.y).facing;

  if (state.phase === INSPECTION_PHASES.VANISH) {
    return { ...state, pendingTarget: normalizedTarget, torch: 0 };
  }

  if (state.phase === INSPECTION_PHASES.APPEAR) {
    if (state.facing === requiredFacing) {
      return { ...state, pendingTarget: normalizedTarget, torch: 0 };
    }
    return {
      ...state,
      phase: INSPECTION_PHASES.VANISH,
      phaseElapsed: 0,
      pendingTarget: normalizedTarget,
      torch: 0,
    };
  }

  if (state.opacity > 0.06 && state.facing !== requiredFacing) {
    return {
      ...state,
      phase: INSPECTION_PHASES.VANISH,
      phaseElapsed: 0,
      pendingTarget: normalizedTarget,
      torch: 0,
    };
  }

  const prepared = {
    ...state,
    facing: requiredFacing,
    opacity: state.opacity <= 0.06 ? 0 : state.opacity,
  };

  if (prepared.opacity <= 0.06) {
    return {
      ...prepared,
      phase: INSPECTION_PHASES.APPEAR,
      phaseElapsed: 0,
      pendingTarget: normalizedTarget,
      torch: 0,
    };
  }

  return startTransit(prepared, normalizedTarget, mobile);
}

export function hideInspectionPilot(state) {
  return {
    ...state,
    phase: INSPECTION_PHASES.VANISH,
    phaseElapsed: 0,
    pendingTarget: null,
    torch: 0,
  };
}

export function stepInspectionPilot(state, deltaSeconds, {
  mobile = false,
} = {}) {
  const dt = clamp(Number(deltaSeconds) || 0, 0, 0.05);
  if (dt <= 0) return { ...state };

  const phaseElapsed = (state.phaseElapsed ?? 0) + dt;

  if (state.phase === INSPECTION_PHASES.IDLE) {
    return {
      ...state,
      phaseElapsed,
      opacity: 0,
      torch: 0,
    };
  }

  if (state.phase === INSPECTION_PHASES.VANISH) {
    const opacity = 1 - smoothstep(0, VANISH_DURATION, phaseElapsed);
    if (phaseElapsed < VANISH_DURATION) {
      return { ...state, phaseElapsed, opacity, torch: 0 };
    }

    if (!state.pendingTarget) {
      return {
        ...state,
        phase: INSPECTION_PHASES.IDLE,
        phaseElapsed: 0,
        opacity: 0,
        torch: 0,
      };
    }

    const requiredFacing = dockingPoint(
      state.pendingTarget.index,
      state.pendingTarget.side,
      mobile,
      state.pendingTarget.y,
    ).facing;

    return {
      ...state,
      facing: requiredFacing,
      phase: INSPECTION_PHASES.APPEAR,
      phaseElapsed: 0,
      opacity: 0,
      torch: 0,
    };
  }

  if (state.phase === INSPECTION_PHASES.APPEAR) {
    const opacity = smoothstep(0, APPEAR_DURATION, phaseElapsed);
    if (phaseElapsed < APPEAR_DURATION) {
      return { ...state, phaseElapsed, opacity, torch: smoothstep(0.08, 0.72, opacity) * 0.72 };
    }

    if (!state.pendingTarget) {
      return {
        ...state,
        phase: INSPECTION_PHASES.IDLE,
        phaseElapsed: 0,
        opacity: 0,
        torch: 0,
      };
    }

    return startTransit(
      { ...state, opacity: 1, phaseElapsed: 0 },
      state.pendingTarget,
      mobile,
    );
  }

  if (state.phase === INSPECTION_PHASES.TRANSIT) {
    const rawProgress = clamp01(phaseElapsed / Math.max(0.001, state.transitDuration));
    const progress = smootherstep(rawProgress);
    const arc = Math.sin(Math.PI * progress) * (mobile ? 0.025 : 0.045);
    const arcSign = state.targetSide === "right" ? -1 : 1;
    const x = lerp(state.startX, state.targetX, progress);
    const y = clamp01(lerp(state.startY, state.targetY, progress) + arc * arcSign);

    if (rawProgress < 1) {
      return {
        ...state,
        x,
        y,
        baseX: x,
        baseY: y,
        phaseElapsed,
        opacity: 1,
        torch: 0.92 + smoothstep(0.04, 0.42, rawProgress) * 0.58,
      };
    }

    return {
      ...state,
      x: state.targetX,
      y: state.targetY,
      baseX: state.targetX,
      baseY: state.targetY,
      phase: INSPECTION_PHASES.INSPECT,
      phaseElapsed: 0,
      inspectElapsed: 0,
      opacity: 1,
      torch: 1.48,
    };
  }

  if (state.phase === INSPECTION_PHASES.INSPECT) {
    const inspectElapsed = (state.inspectElapsed ?? 0) + dt;
    const bobScale = mobile ? 0.006 : 0.009;
    const x = clamp01((state.baseX ?? state.x) + Math.sin(inspectElapsed * 0.72) * bobScale);
    const y = clamp01((state.baseY ?? state.y) + Math.sin(inspectElapsed * 0.93 + 0.7) * bobScale * 0.72);
    const torch = 1.54 + Math.sin(inspectElapsed * 1.8) * 0.07;

    return {
      ...state,
      x,
      y,
      phaseElapsed,
      inspectElapsed,
      opacity: 1,
      torch: clamp(torch, 1.44, 1.64),
    };
  }

  return { ...state, phaseElapsed };
}
