import { Anchor, Button, Group, Image, Modal, Stack, Text } from "@mantine/core";
import { useState } from "react";
import {
  getFileName,
  isImageFile,
  isPdfFile,
  isPreviewableFile,
  normalizeFileUrl,
} from "../utils/filePreview";
import { normalizeUrl } from "../utils/portfolio";

export function PreviewableImage({
  src,
  alt = "Image",
  className,
  imageClassName,
  modalTitle,
  radius,
}) {
  const [opened, setOpened] = useState(false);
  const fileUrl = normalizeFileUrl(src);

  if (!fileUrl) return null;

  return (
    <>
      <button
        type="button"
        className={`file-preview-image-trigger ${className ?? ""}`.trim()}
        onClick={() => setOpened(true)}
        aria-label={`Agrandir ${alt}`}
      >
        <Image
          src={fileUrl}
          alt={alt}
          radius={radius}
          className={imageClassName}
          fit="cover"
        />
        <span className="file-preview-overlay">Voir l’image</span>
      </button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={modalTitle ?? alt}
        size="xl"
        centered
        classNames={{ content: "file-preview-modal", body: "file-preview-modal-body" }}
      >
        <Image src={fileUrl} alt={alt} fit="contain" className="file-preview-full-image" />
      </Modal>
    </>
  );
}

export function PdfPreviewPanel({ url, title = "Aperçu PDF" }) {
  const fileUrl = normalizeFileUrl(url);

  if (!fileUrl) return null;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Text fw={800}>{title}</Text>
          <Text size="sm" c="dimmed">
            {getFileName(fileUrl)}
          </Text>
        </div>

        <Group gap="xs">
          <Button component="a" href={fileUrl} target="_blank" rel="noreferrer" size="xs">
            Ouvrir
          </Button>
          <Button component="a" href={fileUrl} download variant="light" size="xs">
            Télécharger
          </Button>
        </Group>
      </Group>

      <div className="file-preview-pdf-frame-shell">
        <iframe title={title} src={fileUrl} className="file-preview-pdf-frame" />
      </div>
    </Stack>
  );
}

export function FilePreviewButton({
  url,
  label = "Voir",
  title,
  mode = "modal",
  variant = "outline",
  size = "xs",
  className,
}) {
  const [opened, setOpened] = useState(false);
  const fileUrl = normalizeFileUrl(url);

  if (!fileUrl) return null;

  if (isImageFile(fileUrl)) {
    return (
      <>
        <Button
          type="button"
          size={size}
          variant={variant}
          className={className}
          onClick={() => setOpened(true)}
        >
          {label}
        </Button>

        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title={title ?? getFileName(fileUrl)}
          size="xl"
          centered
          classNames={{ content: "file-preview-modal", body: "file-preview-modal-body" }}
        >
          <Image
            src={fileUrl}
            alt={title ?? label}
            fit="contain"
            className="file-preview-full-image"
          />
        </Modal>
      </>
    );
  }

  if (isPdfFile(fileUrl)) {
    if (mode === "page") {
      return (
        <Button
          component="a"
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          size={size}
          variant={variant}
          className={className}
        >
          {label}
        </Button>
      );
    }

    return (
      <>
        <Button
          type="button"
          size={size}
          variant={variant}
          className={className}
          onClick={() => setOpened(true)}
        >
          {label}
        </Button>

        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title={title ?? getFileName(fileUrl)}
          size="90vw"
          centered
          classNames={{ content: "file-preview-modal file-preview-pdf-modal", body: "file-preview-modal-body" }}
        >
          <PdfPreviewPanel url={fileUrl} title={title ?? getFileName(fileUrl)} />
        </Modal>
      </>
    );
  }

  return (
    <Anchor
      href={isPreviewableFile(fileUrl) ? fileUrl : normalizeUrl(fileUrl)}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {label}
    </Anchor>
  );
}
