import { apiRequest } from "./authApi";

export function fetchTranslationProviderHealth(options = {}) {
  return apiRequest("GET", "/api/translations/provider/health", null, options);
}

export function fetchTranslationCatalog(locale = "en", options = {}) {
  return apiRequest("GET", `/api/translations/catalog?locale=${encodeURIComponent(locale)}`, null, options);
}

export function fetchTranslationBundle(contentType, contentKey, locale = "en", options = {}) {
  return apiRequest(
    "GET",
    `/api/translations/${encodeURIComponent(contentType)}/${encodeURIComponent(contentKey)}?locale=${encodeURIComponent(locale)}`,
    null,
    options,
  );
}

export function previewTranslation(fields, sourceLocale = "fr", targetLocale = "en", options = {}) {
  return apiRequest("POST", "/api/translations/preview", {
    sourceLocale,
    targetLocale,
    fields,
  }, options);
}

export function saveTranslationBundle(contentType, contentKey, fields, status, locale = "en", options = {}) {
  return apiRequest(
    "PUT",
    `/api/translations/${encodeURIComponent(contentType)}/${encodeURIComponent(contentKey)}?locale=${encodeURIComponent(locale)}`,
    { fields, status },
    options,
  );
}

export function autoTranslateBundle(contentType, contentKey, status = "DRAFT", locale = "en", options = {}) {
  return apiRequest(
    "POST",
    `/api/translations/${encodeURIComponent(contentType)}/${encodeURIComponent(contentKey)}/auto?locale=${encodeURIComponent(locale)}`,
    { status },
    options,
  );
}
