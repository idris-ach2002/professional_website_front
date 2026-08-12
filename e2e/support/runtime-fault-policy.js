const BENIGN_ABORT_RE = /\b(?:NS_BINDING_ABORTED|NS_ERROR_ABORT|ERR_ABORTED)\b/i;
const BROWSER_RESOURCE_CONSOLE_RE = /^Failed to load resource:\s+the server responded with a status of \d{3}\b/i;

export function classifyNetworkFailure({
  method = "GET",
  url,
  resourceType = "other",
  errorText = "unknown",
}) {
  const fault = {
    type: "requestfailed",
    message: `${method} ${url} [${resourceType}] — ${errorText}`,
  };

  // Engine-level cancellation means a request was superseded/cancelled, not
  // that an application invariant failed. Required responses are asserted by
  // their own pre/postconditions, so these events remain diagnostic only.
  if (BENIGN_ABORT_RE.test(errorText)) {
    return { severity: "diagnostic", fault };
  }

  return { severity: "fatal", fault };
}

export function classifyConsoleError(message) {
  const fault = { type: "console-error", message };

  // Chromium mirrors HTTP failures to the console with no URL. The response
  // listener already owns the authoritative status+URL contract, so treating
  // this duplicate browser-generated line as fatal creates false positives for
  // intentional fault-injection scenarios such as the API 503 fallback test.
  if (BROWSER_RESOURCE_CONSOLE_RE.test(message)) {
    return { severity: "diagnostic", fault };
  }

  return { severity: "fatal", fault };
}
