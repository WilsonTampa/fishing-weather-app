import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors, checkRateLimit, getClientIp } from './lib/middleware';
import { sendEmail } from './lib/email';

const CONTACT_EMAIL = 'stevewilsontampa@gmail.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS
    if (handleCors(req, res)) return;

    // Only allow POST
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting: 5 contact form submissions per IP per 15 minutes
    const ip = getClientIp(req);
    if (!checkRateLimit(`contact:${ip}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { subject, message, userEmail } = req.body || {};

    // Input validation
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (subject.length > 200) {
      return res.status(400).json({ error: 'Subject is too long (max 200 characters)' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
    }

    // Sanitize inputs for HTML email
    const sanitize = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const sanitizedSubject = sanitize(subject.trim());
    const sanitizedMessage = sanitize(message.trim());
    const sanitizedEmail = userEmail ? sanitize(String(userEmail)) : 'Not logged in';

    // Build HTML email
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #58a6ff; padding-bottom: 8px;">
          New Contact Form Message
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #666; vertical-align: top; width: 100px;">From:</td>
            <td style="padding: 8px 12px; color: #333;">${sanitizedEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #666; vertical-align: top;">Subject:</td>
            <td style="padding: 8px 12px; color: #333;">${sanitizedSubject}</td>
          </tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
          <p style="margin: 0; color: #333; white-space: pre-wrap; line-height: 1.6;">${sanitizedMessage}</p>
        </div>
        <p style="margin-top: 16px; font-size: 12px; color: #999;">
          Sent from My Marine Forecast contact form
        </p>
      </div>
    `;

    await sendEmail({
      to: CONTACT_EMAIL,
      subject: `[Contact] ${subject.trim()}`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
