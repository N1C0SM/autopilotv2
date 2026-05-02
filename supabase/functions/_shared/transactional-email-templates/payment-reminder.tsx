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
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Autopilot'

interface PaymentReminderProps {
  name?: string
  customMessage?: string
  checkoutUrl?: string
}

const PaymentReminderEmail = ({
  name,
  customMessage,
  checkoutUrl = 'https://autopilotplan.com/dashboard',
}: PaymentReminderProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu plan personalizado de {SITE_NAME} te está esperando</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Hola ${name},` : 'Hola,'}
        </Heading>
        <Text style={text}>
          {customMessage ||
            `Te registraste en ${SITE_NAME} pero todavía no has activado tu plan. Tu entrenamiento + nutrición personalizados están listos para empezar a transformar tu rutina.`}
        </Text>
        <Section style={buttonContainer}>
          <Button href={checkoutUrl} style={button}>
            Activar mi plan
          </Button>
        </Section>
        <Text style={text}>
          Solo te llevará 1 minuto. Empieza hoy y recibe tu plan completo en Google Calendar mañana mismo.
        </Text>
        <Text style={footer}>— El equipo de {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentReminderEmail,
  subject: 'Tu plan personalizado te está esperando 🚀',
  displayName: 'Recordatorio de pago',
  previewData: {
    name: 'Juan',
    customMessage: '',
    checkoutUrl: 'https://autopilotplan.com/dashboard',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, Arial, sans-serif',
}
const container = {
  padding: '32px 24px',
  maxWidth: '560px',
  margin: '0 auto',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#0b0b0b',
  margin: '0 0 20px',
  fontFamily: 'Space Grotesk, Inter, Arial, sans-serif',
}
const text = {
  fontSize: '15px',
  color: '#3a3a3a',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const buttonContainer = {
  margin: '28px 0',
  textAlign: 'center' as const,
}
const button = {
  backgroundColor: '#FFCC00',
  color: '#000000',
  fontSize: '15px',
  fontWeight: 700,
  padding: '14px 28px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = {
  fontSize: '13px',
  color: '#888888',
  margin: '32px 0 0',
}