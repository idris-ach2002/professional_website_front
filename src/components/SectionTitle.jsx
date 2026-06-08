import { Badge, Group, Text, Title } from "@mantine/core";

export default function SectionTitle({ eyebrow, title, description, rightSlot }) {
  return (
    <div className="section-title">
      <div className="section-title-copy">
        {eyebrow && (
          <Badge variant="light" radius="xl" className="section-eyebrow">
            {eyebrow}
          </Badge>
        )}
        <Title order={2} className="section-heading">
          {title}
        </Title>
        {description && <Text className="section-description">{description}</Text>}
      </div>
      {rightSlot && <Group className="section-action">{rightSlot}</Group>}
    </div>
  );
}
