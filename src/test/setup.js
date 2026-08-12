import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

function createMemoryStorage() {
  const values = new Map();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      const normalizedKey = String(key);
      return values.has(normalizedKey) ? values.get(normalizedKey) : null;
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key) {
      values.delete(String(key));
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
  };
}

function installStorage(name) {
  const storage = createMemoryStorage();
  Object.defineProperty(window, name, {
    configurable: true,
    enumerable: true,
    value: storage,
  });
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    value: storage,
  });
}

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}


function resetDocumentShell() {
  for (const element of [document.documentElement, document.body]) {
    if (!element) continue;
    for (const attribute of [...element.attributes]) {
      if (
        attribute.name.startsWith("data-")
        || ["class", "style", "lang", "dir"].includes(attribute.name)
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  document.body?.replaceChildren();
  document.head?.replaceChildren();
  document.title = "";
}

class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

function clearCookies() {
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");
    const name = (separator >= 0 ? cookie.slice(0, separator) : cookie).trim();
    if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}

/**
 * Unit-test precondition: every test gets a fresh browser-like environment.
 * Nothing written by one test may survive into the next test in the worker.
 */
beforeEach(() => {
  resetDocumentShell();
  clearCookies();
  installStorage("localStorage");
  installStorage("sessionStorage");
  installMatchMedia();
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  vi.stubGlobal("scrollTo", vi.fn());
  window.history.replaceState({}, "", "/");
});

/**
 * Unit-test postcondition: cleanup mutable process/jsdom state, including
 * globals replaced directly by individual tests and fake timers if introduced.
 */
afterEach(() => {
  cleanup();
  resetDocumentShell();
  clearCookies();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
