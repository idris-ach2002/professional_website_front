# Aquarium OffscreenCanvas StrictMode hotfix — 2026-08-28

Fixes the development crash:
`Failed to execute 'getContext' on 'HTMLCanvasElement': Cannot get context from a canvas that has transferred its control to offscreen.`

The visual renderer, marine simulation formulas and worker drawing formulas are unchanged.
The fix only hardens ownership/lifecycle of the HTML canvas:
- defer `transferControlToOffscreen()` by one animation frame so React StrictMode's throw-away effect pass cannot claim the canvas;
- never call main-thread `getContext()` on a canvas already transferred to a worker;
- keep the fresh-canvas fallback path if the render worker fails.
