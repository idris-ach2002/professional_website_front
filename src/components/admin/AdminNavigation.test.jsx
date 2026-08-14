import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminNavigation from "./AdminNavigation";

describe("AdminNavigation", () => {
  it("présente les tâches par domaine et navigue sans ambiguïté", () => {
    const onChange = vi.fn();
    render(<AdminNavigation value="overview" onChange={onChange} selectedVersion={{ label: "Release août", active: true }} />);

    expect(screen.getByRole("navigation", { name: /navigation de l’administration/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accueil/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Release août")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /insights/i }));
    expect(onChange).toHaveBeenCalledWith("mission");
  });

  it("offre une palette de navigation directe", () => {
    const onChange = vi.fn();
    render(<AdminNavigation value="overview" onChange={onChange} selectedVersion={null} />);

    fireEvent.click(screen.getByRole("button", { name: /aller à/i }));
    fireEvent.click(screen.getByRole("button", { name: /architecture/i }));
    expect(onChange).toHaveBeenCalledWith("mission");
  });
});
