// HTML email templates for subscription lifecycle events
// Uses table-based layout with inline styles for maximum email client compatibility
// Brand colors match the app: #0D1117 bg, #161B22 surface, #58A6FF accent, #30363D border

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#0D1117; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D1117; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#161B22; border-radius:8px; border:1px solid #30363D;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0; text-align:center;">
              <h1 style="margin:0; color:#58A6FF; font-size:24px; font-weight:700;">My Marine Forecast</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:24px 32px 32px; color:#FFFFFF; font-size:16px; line-height:1.6;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #30363D; text-align:center;">
              <p style="margin:0; color:#8B949E; font-size:13px;">
                <a href="https://mymarineforecast.com" style="color:#58A6FF; text-decoration:none;">mymarineforecast.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function welcomeTrialEmail(trialEndDate: string): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px; color:#FFFFFF; font-size:20px;">Welcome aboard!</h2>
    <p style="margin:0 0 12px;">Your 7-day free trial is now active. You have full access to:</p>
    <ul style="margin:0 0 16px; padding-left:20px; color:#FFFFFF;">
      <li style="margin-bottom:8px;">7-day extended forecasts</li>
      <li style="margin-bottom:8px;">Unlimited saved locations</li>
      <li style="margin-bottom:8px;">Customizable dashboard</li>
    </ul>
    <p style="margin:0 0 20px;">Your trial ends on <strong>${trialEndDate}</strong>.</p>
    <p style="margin:0;">
      <a href="https://mymarineforecast.com" style="display:inline-block; padding:12px 24px; background-color:#58A6FF; color:#FFFFFF; text-decoration:none; border-radius:6px; font-weight:600;">
        Open My Marine Forecast
      </a>
    </p>
  `);
}

export function trialEndingSoonEmail(daysLeft: number): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px; color:#FFFFFF; font-size:20px;">Your trial ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}</h2>
    <p style="margin:0 0 12px;">Just a heads up &mdash; your free trial is ending soon.</p>
    <p style="margin:0 0 16px;">After your trial, your subscription will automatically continue at the regular price. No action needed if you'd like to keep your premium access.</p>
    <p style="margin:0 0 20px;">If you'd rather not continue, you can cancel anytime from your account settings.</p>
    <p style="margin:0;">
      <a href="https://mymarineforecast.com" style="display:inline-block; padding:12px 24px; background-color:#58A6FF; color:#FFFFFF; text-decoration:none; border-radius:6px; font-weight:600;">
        Manage Subscription
      </a>
    </p>
  `);
}

export function subscriptionActivatedEmail(): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px; color:#FFFFFF; font-size:20px;">You're all set!</h2>
    <p style="margin:0 0 12px;">Your subscription to My Marine Forecast is now active.</p>
    <p style="margin:0 0 20px;">You have full access to extended forecasts, unlimited saved locations, and a customizable dashboard.</p>
    <p style="margin:0;">
      <a href="https://mymarineforecast.com" style="display:inline-block; padding:12px 24px; background-color:#58A6FF; color:#FFFFFF; text-decoration:none; border-radius:6px; font-weight:600;">
        Open My Marine Forecast
      </a>
    </p>
  `);
}

export function paymentFailedEmail(): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px; color:#F87171; font-size:20px;">Payment issue</h2>
    <p style="margin:0 0 12px;">We were unable to process your latest payment for My Marine Forecast.</p>
    <p style="margin:0 0 20px;">Please update your payment method to keep your premium access. You can manage your billing details from your account.</p>
    <p style="margin:0;">
      <a href="https://mymarineforecast.com" style="display:inline-block; padding:12px 24px; background-color:#58A6FF; color:#FFFFFF; text-decoration:none; border-radius:6px; font-weight:600;">
        Update Payment Method
      </a>
    </p>
  `);
}

export function subscriptionCanceledEmail(): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px; color:#FFFFFF; font-size:20px;">Subscription canceled</h2>
    <p style="margin:0 0 12px;">Your My Marine Forecast subscription has been canceled.</p>
    <p style="margin:0 0 20px;">You still have access to the free tier with basic forecasts. If you change your mind, you can resubscribe anytime.</p>
    <p style="margin:0;">
      <a href="https://mymarineforecast.com" style="display:inline-block; padding:12px 24px; background-color:#58A6FF; color:#FFFFFF; text-decoration:none; border-radius:6px; font-weight:600;">
        Visit My Marine Forecast
      </a>
    </p>
  `);
}
