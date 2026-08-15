import { expect, test } from "./support/test-fixtures";
import { openPortfolioContract } from "./support/runtime-contract";

const VIEWPORTS = [
  { name: "360x800", width: 360, height: 800, compact: true },
  { name: "390x844", width: 390, height: 844, compact: true },
  { name: "430x932", width: 430, height: 932, compact: true },
  { name: "768x1024", width: 768, height: 1024, compact: true },
  { name: "820x1180", width: 820, height: 1180, compact: true },
  { name: "966x768", width: 966, height: 768, compact: false },
  { name: "1024x768", width: 1024, height: 768, compact: false },
  { name: "1366x768", width: 1366, height: 768, compact: false },
  { name: "1920x1080", width: 1920, height: 1080, compact: false },
];

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

      await openPortfolioContract(page, "fr");

      await expect(page.locator("html")).toHaveAttribute(
        "data-viewport",
        viewport.compact ? "compact" : "wide",
      );

      const mobileBottomNavigation = viewport.width <= 1240;

      await expectInsideViewport(
        page.locator(mobileBottomNavigation ? ".nav_mobile-dock" : ".nav_component"),
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

      await expect(page.locator(".profile-ios-ocean")).toBeVisible();
      await expect(page.locator(".profile-discipline-grid [data-profile-discipline]")).toHaveCount(4);
      await expect(page.locator(".profile-photo-widget")).toHaveCount(1);
      await expect(page.locator(".profile-availability-widget")).toHaveCount(1);
      await expect(page.locator(".profile-contacts-widget")).toHaveCount(1);

      const profileGeometry = await page.evaluate(() => {
        const root = document.querySelector(".profile-ios-ocean");
        const main = document.querySelector(".profile-ios-main");
        const side = document.querySelector(".profile-ios-side-grid");
        const photo = document.querySelector(".profile-photo-widget");
        const availability = document.querySelector(".profile-availability-widget");
        const contacts = document.querySelector(".profile-contacts-widget");
        const portrait = document.querySelector(".profile-photo-widget .portrait-preview-trigger");
        const availabilityIcon = document.querySelector(".profile-availability-icon");
        if (!root || !main || !side || !photo || !availability || !contacts || !portrait || !availabilityIcon) return null;
        const rect = (element) => element.getBoundingClientRect().toJSON();
        return {
          root: rect(root),
          main: rect(main),
          side: rect(side),
          photo: rect(photo),
          availability: rect(availability),
          contacts: rect(contacts),
          portrait: rect(portrait),
          availabilityIcon: rect(availabilityIcon),
        };
      });

      expect(profileGeometry).not.toBeNull();
      expect(profileGeometry.root.width).toBeLessThanOrEqual(viewport.width + 2);

      // Current profile contract:
      // <= 780: photo / availability / contacts are a single full-width stack.
      // 781..1240: photo + availability share a row; contacts spans the row below.
      // > 1240: the right rail is a vertical desktop stack.
      if (viewport.width <= 780) {
        expect(Math.abs(profileGeometry.side.width - profileGeometry.main.width)).toBeLessThanOrEqual(2);
        expect(Math.abs(profileGeometry.photo.width - profileGeometry.side.width)).toBeLessThanOrEqual(2);
        expect(Math.abs(profileGeometry.availability.width - profileGeometry.side.width)).toBeLessThanOrEqual(2);
        expect(Math.abs(profileGeometry.contacts.width - profileGeometry.side.width)).toBeLessThanOrEqual(2);
        expect(profileGeometry.photo.y).toBeLessThan(profileGeometry.availability.y);
        expect(profileGeometry.availability.y).toBeLessThan(profileGeometry.contacts.y);
      } else if (viewport.width <= 1240) {
        expect(Math.abs(profileGeometry.side.width - profileGeometry.main.width)).toBeLessThanOrEqual(2);
        expect(Math.abs(profileGeometry.photo.width - profileGeometry.availability.width)).toBeLessThanOrEqual(2);
        expect(profileGeometry.photo.x).toBeLessThan(profileGeometry.availability.x);
        expect(profileGeometry.photo.y).toBeLessThan(profileGeometry.availability.y);
        expect(profileGeometry.photo.y + profileGeometry.photo.height).toBeLessThanOrEqual(profileGeometry.contacts.y + 6);
        expect(profileGeometry.availability.y + profileGeometry.availability.height).toBeLessThan(profileGeometry.contacts.y);
        expect(profileGeometry.contacts.width).toBeGreaterThanOrEqual(profileGeometry.side.width - 2);
      } else {
        expect(profileGeometry.main.width).toBeGreaterThan(profileGeometry.side.width);
        expect(profileGeometry.side.height).toBeGreaterThan(700);
        expect(profileGeometry.photo.y).toBeLessThan(profileGeometry.availability.y);
        expect(profileGeometry.availability.y).toBeLessThan(profileGeometry.contacts.y);
        expect(profileGeometry.photo.height).toBeGreaterThanOrEqual(360);
        expect(profileGeometry.photo.height).toBeLessThanOrEqual(400);
      }

      expect(profileGeometry.portrait.width).toBeGreaterThanOrEqual(140);
      expect(profileGeometry.portrait.width).toBeLessThanOrEqual(220);
      expect(profileGeometry.portrait.width).toBeLessThan(profileGeometry.photo.width);
      expect(profileGeometry.portrait.height).toBeGreaterThan(profileGeometry.portrait.width);
      expect(profileGeometry.availabilityIcon.width).toBeGreaterThanOrEqual(40);
      expect(profileGeometry.availabilityIcon.width).toBeLessThanOrEqual(70);

      if (mobileBottomNavigation) {
        const dock = page.locator(".nav_mobile-dock");
        await expect(dock.locator(".nav_mobile-dock-link")).toHaveCount(5);
        await expect(dock.locator(".nav_mobile-dock-link.is-active")).toHaveCount(1);
        await expect(page.getByRole("button", { name: "Navigation principale" })).toHaveCount(0);
        await expect(page.locator(".nav_mobile-panel")).toHaveCount(0);
      } else {
        await expect(
          page.locator(".nav_menu.v2"),
        ).toBeVisible();

        await expect(
          page.getByTestId("command-options-trigger"),
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

      const firstTimelineCard = page.locator("#timeline .timeline-expedition-card").first();
      await firstTimelineCard.scrollIntoViewIfNeeded();
      if (viewport.width <= 1240) {
        await expect(firstTimelineCard.locator(".timeline-compact-open")).toBeVisible();
        await expect(page.locator("#timeline .timeline-autonomous-stage")).toBeHidden();
        const timelineGeometry = await page.evaluate(() => {
          const card = document.querySelector("#timeline .timeline-expedition-card");
          const row = card?.closest(".timeline-expedition-row");
          const track = card?.closest(".timeline-subsea-track");
          if (!card || !row || !track) return null;
          const rect = (element) => element.getBoundingClientRect().toJSON();
          return {
            card: rect(card),
            row: rect(row),
            track: rect(track),
          };
        });

        expect(timelineGeometry).not.toBeNull();
        expect(timelineGeometry.card.width).toBeGreaterThan(0);
        expect(timelineGeometry.card.x).toBeGreaterThanOrEqual(-1);
        expect(timelineGeometry.card.right).toBeLessThanOrEqual(viewport.width + 1);
        expect(timelineGeometry.card.width).toBeLessThanOrEqual(timelineGeometry.row.width + 2);
        expect(timelineGeometry.row.width).toBeLessThanOrEqual(timelineGeometry.track.width + 2);
      } else {
        await expect(firstTimelineCard.locator(".timeline-compact-open")).toBeHidden();
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

        const projectsSection = page.locator("#projects");
        await expect(projectsSection).toBeVisible();

        const details = projectsSection
          .getByRole("button", {
            name: "Détails",
            exact: true,
          })
          .first();

        await details.scrollIntoViewIfNeeded();
        await expect(details).toBeVisible();
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
