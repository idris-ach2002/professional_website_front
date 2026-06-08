import { Anchor, Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { motion } from "framer-motion";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineDot from "@mui/lab/TimelineDot";
import SectionTitle from "./SectionTitle";
import { CATEGORY_LABELS, formatPeriod, normalizeUrl } from "../utils/portfolio";

const MotionDiv = motion.div;

const categoryClasses = {
  SCHOOL: "timeline-dot-school",
  INTERNSHIP: "timeline-dot-internship",
  ALTERNANCE: "timeline-dot-work",
  CDI: "timeline-dot-work",
  CDD: "timeline-dot-work",
  FREELANCE: "timeline-dot-freelance",
  CERTIFICATION: "timeline-dot-certification",
  VOLUNTEERING: "timeline-dot-volunteering",
};

export default function PortfolioTimeline({ timeline, experiences }) {
  return (
    <section id="timeline" className="page-section timeline-section">
      <SectionTitle
        eyebrow="Timeline MUI personnalisée"
        title={timeline?.title ?? "Parcours"}
        description={timeline?.description ?? "Les expériences sont rendues depuis le modèle Timeline/Experience du backend."}
      />

      <Timeline position="alternate" className="mui-timeline">
        {experiences.map((experience, index) => (
          <TimelineItem key={experience.id ?? `${experience.title}-${index}`}>
            <TimelineOppositeContent className="timeline-date">
              <span>{formatPeriod(experience.startDate, experience.endDate, experience.currentPosition)}</span>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot className={`timeline-dot ${categoryClasses[experience.category] ?? ""}`} />
              {index < experiences.length - 1 && <TimelineConnector className="timeline-connector" />}
            </TimelineSeparator>
            <TimelineContent>
              <MotionDiv
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.2) }}
              >
                <Card className="timeline-card" radius="xl">
                  <Group justify="space-between" align="flex-start" gap="md">
                    <Stack gap={5} className="timeline-main-copy">
                      <Badge className="timeline-category" radius="xl">
                        {CATEGORY_LABELS[experience.category] ?? experience.category}
                      </Badge>
                      <Title order={3}>{experience.title}</Title>
                      <Text className="timeline-org">
                        {[experience.organization, experience.location].filter(Boolean).join(" · ")}
                      </Text>
                    </Stack>
                    {experience.currentPosition && <Badge className="current-badge">En cours</Badge>}
                  </Group>
                  <Text className="timeline-summary">{experience.summary}</Text>
                  {experience.description && <Text className="timeline-description">{experience.description}</Text>}
                  {experience.skills?.length > 0 && (
                    <Group gap={7} className="skill-row">
                      {experience.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="skill-badge">
                          {skill}
                        </Badge>
                      ))}
                    </Group>
                  )}
                  {experience.websiteUrl && (
                    <Anchor href={normalizeUrl(experience.websiteUrl)} target="_blank" className="timeline-link">
                      Voir la ressource
                    </Anchor>
                  )}
                </Card>
              </MotionDiv>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </section>
  );
}
