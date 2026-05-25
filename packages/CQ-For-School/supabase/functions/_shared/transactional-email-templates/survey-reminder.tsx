/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'CQ Impact'

interface SurveyReminderProps {
  schoolName?: string
  surveyLink?: string
  reminderType?: 'friday' | 'monday'
}

const SurveyReminderEmail = ({
  schoolName = 'your school',
  surveyLink = '#',
  reminderType = 'friday',
}: SurveyReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {reminderType === 'monday'
        ? `Reminder: Complete your weekly CQ check-in`
        : `Your weekly 2-minute cultural check-in is ready`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>✦ {SITE_NAME}</Text>
        <Heading style={h1}>
          {reminderType === 'monday'
            ? 'Friendly reminder 👋'
            : 'Your weekly check-in is ready'}
        </Heading>
        <Text style={text}>
          {reminderType === 'monday'
            ? `You haven't completed this week's cultural check-in for ${schoolName} yet. It only takes 2 minutes and helps build a stronger school culture.`
            : `It's time for your quick weekly cultural check-in at ${schoolName}. Your honest feedback drives real improvements.`}
        </Text>
        <Button style={button} href={surveyLink}>
          Start Check-In →
        </Button>
        <Text style={footer}>
          This survey takes about 2 minutes. Your responses are confidential.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SurveyReminderEmail,
  subject: (data: Record<string, any>) =>
    data.reminderType === 'monday'
      ? 'Reminder: Your CQ check-in is waiting'
      : '📋 Your weekly CQ check-in is ready',
  displayName: 'Weekly survey reminder',
  previewData: {
    schoolName: 'Lincoln Elementary',
    surveyLink: 'https://cq-for-schools-weekly.lovable.app/survey?token=abc123',
    reminderType: 'friday',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const brand = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: 'hsl(168, 55%, 38%)',
  margin: '0 0 24px',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(200, 25%, 15%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(200, 10%, 45%)',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const button = {
  backgroundColor: 'hsl(168, 55%, 38%)',
  color: '#ffffff',
  fontSize: '15px',
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  fontWeight: 'bold' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
