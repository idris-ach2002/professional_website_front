import React from "react";
import { useDisclosure } from "@mantine/hooks";
import {
  HoverCard,
  Button,
  Stack,
  Title,
  Text,
  Image,
  Modal,
  Group,
  Badge,
  Card,
} from "@mantine/core";

export default function Profile() {
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group position="apart" mb="xs">
                <Title order={2}>Idris Achabou</Title>
                <Badge color="blue" variant="light">
                    Software Engineer
                </Badge>
            </Group>

            <Text size="sm" color="dimmed">
                Full‑Stack Developer | Java | React | DevOps
            </Text>

            <Text mt="md">
                Passionate about building scalable, elegant and robust systems. I specialize in backend architecture, frontend engineering, and cloud‑native development. I love clean code, performance, and developer experience.
            </Text>

            <Group mt="md" position="apart">
                <Text size="sm" color="dimmed">
                    Paris, France
                </Text>
                <Text size="sm" color="green">
                    Available for freelance & full‑time opportunities
                </Text>
            </Group>

            <Group mt="md">
                <Button variant="outline" color="blue" radius="md" size="sm" component="a" href="https://example.com/cv.pdf" target="_blank">
                    View CV
                </Button>
                <Button variant="outline" color="blue" radius="md" size="sm" component="a" href="https://example.com/portfolio" target="_blank">
                    View Portfolio
                </Button>
            </Group>
        </Card>
    );
}
