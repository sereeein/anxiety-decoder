// lib/ai/resendClient.ts
import { Resend } from 'resend';

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not set');
    client = new Resend(apiKey);
  }
  return client;
}

export const FROM_ADDRESS = 'Anxiety Decoder <onboarding@resend.dev>';
// Replace with your verified domain in Plan 4 before production.
