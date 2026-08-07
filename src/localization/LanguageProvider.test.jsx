import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import LanguageProvider from "./LanguageProvider";
import useLanguage from "./useLanguage";

function LanguageProbe() {
  const { language, locale, localizedPath, setLanguage, t } = useLanguage();
  return (
    <section>
      <p data-testid="language">{language}</p>
      <p data-testid="locale">{locale}</p>
      <p data-testid="path">{localizedPath("/cv?source=test#download")}</p>
      <p data-testid="message">{t("notFound.home")}</p>
      <button type="button" onClick={() => setLanguage("fr")}>FR</button>
      <button type="button" onClick={() => setLanguage("en")}>EN</button>
    </section>
  );
}

describe("LanguageProvider", () => {
  it("prend la langue depuis l'URL", () => {
    window.history.replaceState({}, "", "/?lang=en");

    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);

    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("locale")).toHaveTextContent("en-GB");
    expect(screen.getByTestId("message")).toHaveTextContent("Back to home");
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("prend la langue anglaise depuis le préfixe indexable", () => {
    window.history.replaceState({}, "", "/en/cv");

    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);

    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("path")).toHaveTextContent("/en/cv?source=test#download");
  });

  it("mémorise le choix anglais dans l'URL et localStorage", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);

    await user.click(screen.getByRole("button", { name: "EN" }));

    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(window.localStorage.getItem("portfolio-language")).toBe("en");
    expect(window.location.pathname).toBe("/en");
    expect(window.location.search).toBe("");
    expect(screen.getByTestId("path")).toHaveTextContent("/en/cv?source=test#download");
  });

  it("retire le paramètre lang lors du retour au français", async () => {
    window.history.replaceState({}, "", "/en/cv?source=test");
    const user = userEvent.setup();
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);

    await user.click(screen.getByRole("button", { name: "FR" }));

    expect(window.location.pathname).toBe("/cv");
    expect(window.location.search).toBe("?source=test");
    expect(window.localStorage.getItem("portfolio-language")).toBe("fr");
    expect(document.documentElement).toHaveAttribute("lang", "fr");
  });
});
