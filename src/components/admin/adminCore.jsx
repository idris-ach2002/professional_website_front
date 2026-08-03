import { useEffect, useMemo } from "react";
import { Group, Loader, Paper, Stack, Text } from "@mantine/core";
import { FilePreviewButton } from "../FilePreview";
import { buildBackendUrl } from "../../services/authApi";
import { highlightJson } from "./adminCoreUtils";

export function JsonCodeEditor({ value, onChange, highlightRef, lineNumbersRef, analysis }) {
  const highlightedValue = useMemo(() => highlightJson(value), [value]);
  const lineCount = Math.max(value.split("\n").length, 1);

  function syncScroll(event) {
    const { scrollTop, scrollLeft } = event.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  }

  return (
    <div className="json-editor-codearea">
      <div ref={lineNumbersRef} className="json-editor-line-numbers" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => (
          <span
            key={index}
            className={analysis?.line === index + 1 ? "json-line-error" : undefined}
          >
            {index + 1}
          </span>
        ))}
      </div>
      <div className="json-editor-input-layer">
        <pre
          ref={highlightRef}
          className="json-editor-highlight"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedValue }}
        />
        <textarea
          className="json-editor-textarea"
          aria-label="Éditeur JSON de la version courante"
          aria-invalid={analysis?.valid === false}
          spellCheck="false"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onScroll={syncScroll}
        />
        {analysis?.valid === false && analysis.line && analysis.column && (
          <div className="json-editor-inline-diagnostic" aria-hidden="true">
            Ligne {analysis.line}, colonne {analysis.column}
          </div>
        )}
      </div>
    </div>
  );
}

export function FileLink({ label, url, mode = "modal" }) {
  if (!url) return null;

  return (
    <Group gap="xs" align="center" className="admin-file-current-line">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <FilePreviewButton
        url={url}
        label="Voir"
        title={label}
        mode={mode}
        size="xs"
        variant="light"
        className="admin-file-preview-button"
      />
    </Group>
  );
}

export function AdminAuthShell({ children }) {
  return (
    <main className="admin-page admin-auth-page">
      <div className="admin-orb admin-orb-one" />
      <div className="admin-orb admin-orb-two" />
      <div className="admin-orb admin-orb-three" />
      <Stack gap="xl" className="admin-shell admin-auth-shell">
        {children}
      </Stack>
    </main>
  );
}

export function AdminChecking() {
  return (
    <AdminAuthShell>
      <Paper withBorder radius="xl" p="xl" className="admin-hero-card admin-auth-card">
        <Stack gap="md" align="center">
          <Loader size="md" />
          <Text fw={800}>Chargement du panel…</Text>
          <Text size="sm" c="dimmed" ta="center">
            Vérification de l’accès en cours.
          </Text>
        </Stack>
      </Paper>
    </AdminAuthShell>
  );
}

export function AdminLoginRedirect() {
  useEffect(() => {
    const redirectTarget = `${window.location.origin}/admin`;
    const loginUrl = buildBackendUrl(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    window.location.replace(loginUrl);
  }, []);

  return (
    <AdminAuthShell>
      <Paper withBorder radius="xl" p="xl" className="admin-hero-card admin-auth-card">
        <Stack gap="md" align="center">
          <Loader size="md" />
          <Text fw={800}>Redirection vers la connexion…</Text>
        </Stack>
      </Paper>
    </AdminAuthShell>
  );
}

