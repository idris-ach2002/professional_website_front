import { analyzePerformanceWindow } from "./performanceMetrics";

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || message.type !== "analyze-performance-window") return;

  const frames = new Float32Array(message.frameBuffer);
  const analysis = analyzePerformanceWindow({
    frames,
    count: message.count,
    longTasks: message.longTasks,
    longAnimationFrames: message.longAnimationFrames,
  });

  self.postMessage({
    type: "performance-window-analysis",
    requestId: message.requestId,
    analysis,
  });
});
