const CLOUDINARY_IMAGE_UPLOAD = "/image/upload/";

export const RESPONSIVE_IMAGE_WIDTHS = [320, 640, 960, 1280];

export function isTransformableCloudinaryImage(value) {
  if (!value || typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.hostname === "res.cloudinary.com" && url.pathname.includes(CLOUDINARY_IMAGE_UPLOAD);
  } catch {
    return false;
  }
}

export function buildCloudinaryImageUrl(value, { width, format = "auto", quality = "auto" } = {}) {
  if (!isTransformableCloudinaryImage(value)) return value;
  const transformations = [
    `f_${format}`,
    `q_${quality}`,
    "c_limit",
    width ? `w_${Math.max(1, Math.round(width))}` : null,
  ].filter(Boolean).join(",");

  return value.replace(CLOUDINARY_IMAGE_UPLOAD, `${CLOUDINARY_IMAGE_UPLOAD}${transformations}/`);
}

export function buildResponsiveImageProps(
  value,
  { widths = RESPONSIVE_IMAGE_WIDTHS, sizes = "(max-width: 48rem) 92vw, (max-width: 75rem) 50vw, 640px" } = {},
) {
  if (!isTransformableCloudinaryImage(value)) return {};
  const normalizedWidths = [...new Set(widths)]
    .filter((width) => Number.isFinite(width) && width > 0)
    .sort((left, right) => left - right);
  if (normalizedWidths.length === 0) return {};

  return {
    src: buildCloudinaryImageUrl(value, { width: normalizedWidths[Math.min(2, normalizedWidths.length - 1)] }),
    srcSet: normalizedWidths
      .map((width) => `${buildCloudinaryImageUrl(value, { width })} ${width}w`)
      .join(", "),
    sizes,
  };
}
