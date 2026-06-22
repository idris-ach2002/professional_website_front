import { Badge, Button, Checkbox, Divider, Group, NumberInput, Paper, Select, SimpleGrid, Stack, Switch, Tabs, Text, Textarea, TextInput } from "@mantine/core";
import { contactTypeOptions } from "./adminCore";

export default function AdminOwnerPanel(props) {
  const {
    ownerForm,
    updateOwnerForm,
    addOwnerContact,
    updateOwnerContact,
    removeOwnerContact,
    updateOwner,
    loading,
    selectedOwnerId,
    createOwner
  } = props;

  return (
            <Tabs.Panel value="owner" pt="lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text fw={800}>Identité, contacts et création du profil principal</Text>
                    <Text size="sm" c="dimmed">
                      Modifie les coordonnées du profil sélectionné ou crée une nouvelle fiche avec une première version.
                    </Text>
                  </div>
                  <Badge variant="light">Création</Badge>
                </Group>

                <Divider />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Nom" value={ownerForm.name} onChange={(event) => updateOwnerForm("name", event.currentTarget.value)} />
                  <TextInput label="Prénom" value={ownerForm.firstName} onChange={(event) => updateOwnerForm("firstName", event.currentTarget.value)} />
                  <NumberInput label="Âge" value={ownerForm.age} onChange={(value) => updateOwnerForm("age", value ?? 0)} />
                  <TextInput label="Adresse" value={ownerForm.address} onChange={(event) => updateOwnerForm("address", event.currentTarget.value)} />
                </SimpleGrid>

                <Paper withBorder p="lg" radius="lg" className="admin-nested-panel">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={800}>Contacts publics</Text>
                        <Text size="sm" c="dimmed">
                          Ces contacts alimentent les boutons, les liens publics et la carte de coordonnées du portfolio.
                        </Text>
                      </div>
                      <Button size="xs" variant="light" onClick={addOwnerContact}>
                        Ajouter contact
                      </Button>
                    </Group>

                    <Stack gap="sm">
                      {ownerForm.contacts.map((contact, index) => (
                        <SimpleGrid key={`${contact.type}-${index}`} cols={{ base: 1, md: 3 }} spacing="sm" className="admin-contact-row">
                          <Select
                            label="Type"
                            data={contactTypeOptions}
                            value={contact.type}
                            onChange={(value) => updateOwnerContact(index, "type", value ?? "EMAIL")}
                          />
                          <TextInput
                            label="Valeur"
                            placeholder="Email, téléphone ou URL"
                            value={contact.value}
                            onChange={(event) => updateOwnerContact(index, "value", event.currentTarget.value)}
                          />
                          <Button
                            color="red"
                            variant="light"
                            onClick={() => removeOwnerContact(index)}
                          >
                            Retirer
                          </Button>
                        </SimpleGrid>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>

                <Group>
                  <Switch label="Owner actif" checked={ownerForm.active} onChange={(event) => updateOwnerForm("active", event.currentTarget.checked)} />
                  <Button onClick={updateOwner} loading={loading} disabled={!selectedOwnerId}>
                    Enregistrer identité et contacts
                  </Button>
                </Group>

                <Divider label="Création d’une nouvelle fiche" labelPosition="center" />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <TextInput label="Tag première version" value={ownerForm.versionTag} onChange={(event) => updateOwnerForm("versionTag", event.currentTarget.value)} />
                  <TextInput label="Label première version" value={ownerForm.versionLabel} onChange={(event) => updateOwnerForm("versionLabel", event.currentTarget.value)} />
                </SimpleGrid>

                <Textarea label="Description première version" minRows={3} value={ownerForm.versionDescription} onChange={(event) => updateOwnerForm("versionDescription", event.currentTarget.value)} />

                <Checkbox label="Publier la première version" checked={ownerForm.versionPublished} onChange={(event) => updateOwnerForm("versionPublished", event.currentTarget.checked)} />

                <Button onClick={createOwner} loading={loading} size="md" variant="light">
                  Créer profil + version initiale
                </Button>
              </Stack>
            </Tabs.Panel>

  );
}
