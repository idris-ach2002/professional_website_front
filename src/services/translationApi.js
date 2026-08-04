import { apiRequest } from "./authApi";

export function fetchTranslationProviderHealth() {
  return apiRequest("GET", "/api/translations/provider/health");
}

export function fetchTranslationCatalog(locale = "en") {
  return apiRequest("GET", `/api/translations/catalog?locale=${encodeURIComponent(locale)}`);
}

export function fetchTranslationBundle(contentType, contentKey, locale = "en") {
  return apiRequest(
    "GET",
    `/api/translations/${encodeURIComponent(contentType)}/${encodeURIComponent(contentKey)}?locale=${encodeURIComponent(locale)}`,
  );
}

export function previewTranslation(fields, sourceLocale = "fr", targetLocale = "en") {
  return apiRequest("POST", "/api/translations/preview", {
    sourceLocale,
    targetLocale,
    fields,
  });
}

export function saveTranslationBundle(contentType, contentKey, fields, status, locale = "en") {
  return apiRequest(
    "PUT",
    `/api/translations/${encodeURIComponent(contentType)}/${encodeURIComponent(contentKey)}?locale=${encodeURIComponent(locale)}`,
    { fields, status },
  );
}

export function autoTranslateBundle(contentType, contentKey, status = "DRAFT", locale = "en") {
  return apiRequest(
    "POST",
    `/api/translations/${encodeURIComponent(contentType)}/${encodeURIComponent(contentKey)}/auto?locale=${encodeURIComponent(locale)}`,
    { status },
  );
}
