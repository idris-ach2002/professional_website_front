import { Group, Text } from "@mantine/core";
import { FilePreviewButton } from "../FilePreview";

export default function AdminFileLink({ label, url, mode = "modal" }) {
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
