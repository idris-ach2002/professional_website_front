import { expect, test } from "@playwright/test";
import { portfolioOwner } from "./fixtures/owner";

const VIEWPORTS = [
  { name: "360x800", width: 360, height: 800, compact: true },
  { name: "390x844", width: 390, height: 844, compact: true },
  { name: "430x932", width: 430, height: 932, compact: true },
  { name: "768x1024", width: 768, height: 1024, compact: true },
  { name: "820x1180", width: 820, height: 1180, compact: true },
  { name: "1024x768", width: 1024, height: 768, compact: false },
  { name: "1366x768", width: 1366, height: 768, compact: false },
  { name: "1440x900", width: 1440, height: 900, compact: false },
  { name: "1920x1080", width: 1920, height: 1080, compact: false },
];

async function mockPublicApi(page) {
  await page.route("**/website/default**", async (route) => {
    const url = new URL(route.request().url());
    const locale = url.searchParams.get("locale") === "en" ? "en" : "fr";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(portfolioOwner(locale)),
    });
  });

  await page.route("**/analytics/events", (route) =>
    route.fulfill({
      status: 204,
      body: "",
    }),
  );
}

async function openPortfolio(page) {
  const response = page.waitForResponse((item) => {
    const url = new URL(item.url());

    return (
      url.pathname.endsWith("/website/default")
      && url.searchParams.get("locale") === "fr"
      && item.status() === 200
    );
  });

  await page.goto("/", {
    waitUntil: "domcontentloaded",
  });

  await response;

  await expect(page.locator("main#main-content")).toBeVisible();

  await page.evaluate(async () => {
    await document.fonts?.ready;
  });
}

async function expectInsideViewport(locator, viewport) {
  await expect(locator).toBeVisible();

  const box = await locator.boundingBox();

  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeGreaterThan(0);
}

async function expectNoHorizontalOverflow(page, label) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;

    const offenders = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const style = getComputedStyle(element);

        if (
          style.position === "fixed"
          && style.pointerEvents === "none"
        ) {
          return false;
        }

        const rect = element.getBoundingClientRect();

        return (
          rect.width > 0
          && (
            rect.right > root.clientWidth + 2
            || rect.left < -2
          )
          && style.overflowX !== "hidden"
          && style.overflowX !== "clip"
        );
      })
      .slice(0, 8)
      .map((element) => ({
        className: element.className?.toString?.() ?? "",
        tag: element.tagName,
        rect: element.getBoundingClientRect().toJSON(),
      }));

    return {
      overflow: root.scrollWidth - root.clientWidth,
      offenders,
    };
  });

  expect(
    result.overflow,
    `${label}: horizontal overflow; ${JSON.stringify(result.offenders)}`,
  ).toBeLessThanOrEqual(1);
}

for (const viewport of VIEWPORTS) {
  test(
    `@responsive ${viewport.name} conserve une mise en page stable`,
    async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.emulateMedia({
        reducedMotion: "reduce",
      });

      await mockPublicApi(page);
      await openPortfolio(page);

      await expect(page.locator("html")).toHaveAttribute(
        "data-viewport",
        viewport.compact ? "compact" : "wide",
      );

      await expectInsideViewport(
        page.locator(".nav_component"),
        viewport,
      );

      await expectInsideViewport(
        page.getByRole("heading", {
          level: 1,
          name: "Développeur Java Full Stack",
        }),
        viewport,
      );

      await expectNoHorizontalOverflow(
        page,
        `${viewport.name} initial`,
      );

      const compactNavigation = viewport.width <= 1100;

      if (compactNavigation) {
        const menuButton = page.getByRole("button", {
          name: "Navigation principale",
        });

        await expect(menuButton).toBeVisible();

        await menuButton.click();

        const panel = page.locator(".nav_mobile-panel.is-open");

        await expectInsideViewport(
          panel,
          viewport,
        );

        const panelBox = await panel.boundingBox();

        expect(panelBox).not.toBeNull();

        expect(
          panelBox.height,
        ).toBeLessThanOrEqual(
          viewport.height - 60,
        );

        await expect(page.locator("body")).toHaveCSS(
          "overflow",
          "hidden",
        );

        await page.keyboard.press("Escape");

        await expect(panel).toBeHidden();

        await expect(page.locator("html")).not.toHaveAttribute(
          "data-mobile-menu",
          "open",
        );
      } else {
        await expect(
          page.locator(".nav_menu.v2"),
        ).toBeVisible();

        await expect(
          page.getByTestId("animation-preferences-trigger"),
        ).toBeVisible();
      }

      for (const selector of [
        "#skills",
        "#timeline",
        "#projects",
        "#contact",
      ]) {
        const section = page.locator(selector).first();

        if (await section.count()) {
          await section.scrollIntoViewIfNeeded();

          await expectNoHorizontalOverflow(
            page,
            `${viewport.name} ${selector}`,
          );
        }
      }

      if (viewport.width <= 430) {
        const actions = page.locator(
          ".hero-actions .mantine-Button-root:visible",
        );

        const count = await actions.count();

        for (let index = 0; index < count; index += 1) {
          const box = await actions
            .nth(index)
            .boundingBox();

          expect(box).not.toBeNull();
          expect(box.height).toBeGreaterThanOrEqual(40);
          expect(box.x).toBeGreaterThanOrEqual(-1);

          expect(
            box.x + box.width,
          ).toBeLessThanOrEqual(
            viewport.width + 1,
          );
        }

        const details = page
          .getByRole("button", {
            name: "Détails",
          })
          .first();

        await details.scrollIntoViewIfNeeded();
        await details.click();

        const dialog = page.getByRole("dialog", {
          name: /Projet/,
        });

        await expect(dialog).toBeVisible();

        const dialogBox = await dialog.boundingBox();

        expect(dialogBox).not.toBeNull();
        expect(dialogBox.x).toBeGreaterThanOrEqual(-1);

        expect(
          dialogBox.x + dialogBox.width,
        ).toBeLessThanOrEqual(
          viewport.width + 1,
        );

        expect(
          dialogBox.height,
        ).toBeLessThanOrEqual(
          viewport.height + 1,
        );

        await page.keyboard.press("Escape");
      }

      await page.evaluate(() => {
        window.scrollTo(
          0,
          document.documentElement.scrollHeight,
        );
      });

      await expectNoHorizontalOverflow(
        page,
        `${viewport.name} bottom`,
      );
    },
  );
}
