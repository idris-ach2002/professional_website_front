import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import TimelineDetailSheet from "./TimelineDetailSheet";

vi.mock("../../localization/useLanguage", () => ({
  default: () => ({
    t: (key) => ({
      "timeline.closeDetails": "Fermer le détail de la mission",
      "timeline.mission": "Mission",
      "timeline.details": "Détails",
      "timeline.missionBrief": "Détail de mission",
      "timeline.systems": "Systèmes",
      "projects.resources": "Ressources",
    }[key] ?? key),
  }),
}));

describe("TimelineDetailSheet", () => {
  it("garde un shell prémonté et ouvre un détail de mission partagé", () => {
    const ref = createRef();
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    const focus = vi.spyOn(trigger, "focus");
    const { container } = render(<TimelineDetailSheet ref={ref} />);

    const shell = container.querySelector(".timeline-detail-shell");
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveAttribute("aria-hidden", "true");

    act(() => {
      ref.current.open({
        title: "Développeur Full Stack",
        organization: "Orange Cyberdéfense",
        summary: "Outils CERT et automatisation.",
        description: "Mission complète.",
        skills: ["Java", "React", "Docker"],
        websiteUrl: "https://example.com/mission",
      }, { missionNumber: "03", period: "2026 — 2027", depth: "−320 m" }, trigger);
    });

    expect(shell).toHaveClass("is-open");
    expect(shell).toHaveAttribute("aria-hidden", "false");
    const dialog = screen.getByRole("dialog", { name: /Mission 03 — Développeur Full Stack/i });
    expect(within(dialog).getByText("Orange Cyberdéfense")).toBeInTheDocument();
    expect(within(dialog).getByText("Outils CERT et automatisation.")).toBeInTheDocument();
    expect(within(dialog).getByText("Mission complète.")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /Ressources/i })).toHaveAttribute("href", "https://example.com/mission");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(shell).toHaveAttribute("aria-hidden", "true");
    expect(focus).toHaveBeenCalled();
    trigger.remove();
  });
});
