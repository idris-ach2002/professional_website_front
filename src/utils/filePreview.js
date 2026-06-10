export function normalizeFileUrl(value) {
  if (!value || value === "#") return "";

  const url = String(value).trim();

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  return url;
}

export function getFileExtension(value) {
  if (!value) return "";

  const url = String(value).split("?")[0].split("#")[0];
  const filename = url.split("/").pop() ?? "";
  const parts = filename.split(".");

  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function isPdfFile(value) {
  return getFileExtension(value) === "pdf";
}

export function isImageFile(value) {
  return ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"].includes(
    getFileExtension(value),
  );
}

export function isPreviewableFile(value) {
  return isPdfFile(value) || isImageFile(value);
}

export function getFileName(value) {
  if (!value) return "fichier";

  const url = String(value).split("?")[0].split("#")[0];
  const name = url.split("/").pop();

  try {
    return decodeURIComponent(name || "fichier");
  } catch {
    return name || "fichier";
  }
}
