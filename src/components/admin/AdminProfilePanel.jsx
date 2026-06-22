import {
  Alert,
  Badge,
  Button,
  Divider,
  FileInput,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import AdminFileLink from "./AdminFileLink";

export default function AdminProfilePanel({
  profileFiles,
  setProfileFiles,
  profileForm,
  updateProfileForm,
  saveProfile,
  selectedOwnerId,
  selectedVersionId,
}) {
  const disabled = !selectedOwnerId || !selectedVersionId;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={900}>Profil de la version courante</Text>
          <Text size="sm" c="dimmed">
            Ce panneau modifie le bloc public principal : titre, accroche, description, photo, logo et CV. Les changements sont sauvegardés uniquement dans la version sélectionnée.
          </Text>
        </div>
        <Badge variant="light">CRUD profil</Badge>
      </Group>

      {disabled && (
        <Alert color="yellow" variant="light">
          Sélectionne d’abord un profil et une version. Ensuite, ce formulaire écrira directement dans cette version courante.
        </Alert>
      )}

      <Divider />

      <Paper withBorder p="lg" radius="lg" className="admin-file-panel">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={800}>Fichiers publics</Text>
              <Text size="sm" c="dimmed">Remplace la photo, le logo ou le CV sans toucher au reste du contenu.</Text>
            </div>
            <Badge variant="light">Cloudinary / local</Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Stack gap="xs">
              <FileInput label="Photo de profil" placeholder="Uploader une image" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={profileFiles.profileImage} onChange={(file) => setProfileFiles((current) => ({ ...current, profileImage: file }))} />
              <AdminFileLink label="Image actuelle" url={profileForm.profileImageUrl} />
            </Stack>
            <Stack gap="xs">
              <FileInput label="Logo" placeholder="Uploader un logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" value={profileFiles.logo} onChange={(file) => setProfileFiles((current) => ({ ...current, logo: file }))} />
              <AdminFileLink label="Logo actuel" url={profileForm.logoUrl} />
            </Stack>
            <Stack gap="xs">
              <FileInput label="CV PDF" placeholder="Uploader un PDF" accept="application/pdf" value={profileFiles.cv} onChange={(file) => setProfileFiles((current) => ({ ...current, cv: file }))} />
              <AdminFileLink label="CV actuel" url={profileForm.cvUrl} mode="page" />
            </Stack>
          </SimpleGrid>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <TextInput label="Job recherché / titre affiché" placeholder="Ex. Alternance ingénierie logicielle" value={profileForm.title} onChange={(event) => updateProfileForm("title", event.currentTarget.value)} />
        <TextInput label="Sous-titre" placeholder="Ex. Java · Spring Boot · React" value={profileForm.subtitle} onChange={(event) => updateProfileForm("subtitle", event.currentTarget.value)} />
        <TextInput label="Accroche courte" placeholder="Phrase visible sous le titre" value={profileForm.headline} onChange={(event) => updateProfileForm("headline", event.currentTarget.value)} />
        <TextInput label="Description courte" placeholder="Résumé affiché sur les cartes" value={profileForm.shortDescription} onChange={(event) => updateProfileForm("shortDescription", event.currentTarget.value)} />
        <TextInput label="Localisation" placeholder="Paris / Île-de-France" value={profileForm.location} onChange={(event) => updateProfileForm("location", event.currentTarget.value)} />
        <TextInput label="Disponibilité" placeholder="Alternance 12 mois dès septembre 2026" value={profileForm.availability} onChange={(event) => updateProfileForm("availability", event.currentTarget.value)} />
        <TextInput label="Portfolio URL" placeholder="https://..." value={profileForm.portfolioUrl} onChange={(event) => updateProfileForm("portfolioUrl", event.currentTarget.value)} />
      </SimpleGrid>

      <Textarea label="Description complète" description="Texte long utilisé dans la présentation publique du portfolio." minRows={5} value={profileForm.description} onChange={(event) => updateProfileForm("description", event.currentTarget.value)} />

      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">Clique sur “Enregistrer” pour persister le profil dans la version courante.</Text>
        <Button onClick={saveProfile} disabled={disabled}>
          Enregistrer le profil de cette version
        </Button>
      </Group>
    </Stack>
  );
}
