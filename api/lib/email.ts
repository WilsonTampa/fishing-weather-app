import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = 'My Marine Forecast <hello@mymarineforecast.com>';

/**
 * Send an email via Resend. Never throws — errors are logged and swallowed
 * so email failures cannot break webhook processing.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email');
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('[email] Resend API error:', JSON.stringify(error));
    } else {
      console.log(`[email] Sent "${options.subject}" to ${options.to}`);
    }
  } catch (err) {
    console.error('[email] Failed to send email:', err);
  }
}

/**
 * Look up a user's email from the profiles table.
 * Returns null if not found or on error.
 */
export async function getUserEmail(
  supabase: any,
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !data?.email) {
      console.error('[email] Could not fetch user email:', error?.message);
      return null;
    }

    return data.email as string;
  } catch (err) {
    console.error('[email] Error fetching user email:', err);
    return null;
  }
}
