import { describe, expect, it } from "vitest";
import { buildCloudinaryImageUrl, buildResponsiveImageProps } from "./responsiveImage";

describe("responsiveImage", () => {
  it("génère des variantes Cloudinary pour une ressource image", () => {
    const source = "https://res.cloudinary.com/demo/image/upload/v1/portfolio/project.png";
    const props = buildResponsiveImageProps(source, { widths: [320, 640] });

    expect(props.srcSet).toContain("f_auto,q_auto,c_limit,w_320");
    expect(props.srcSet).toContain("320w");
    expect(props.srcSet).toContain("640w");
  });

  it("ne transforme jamais une ressource raw", () => {
    const source = "https://res.cloudinary.com/demo/raw/upload/v1/portfolio/project.png";

    expect(buildCloudinaryImageUrl(source, { width: 640 })).toBe(source);
    expect(buildResponsiveImageProps(source)).toEqual({});
  });
});
