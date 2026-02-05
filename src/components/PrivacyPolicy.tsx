import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/article.css';

function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy | My Marine Forecast';
    window.scrollTo(0, 0);

    return () => {
      document.title = 'My Marine Forecast - Tide, Wind & Weather for Boating and Fishing';
    };
  }, []);

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1>My Marine Forecast</h1>
        <Link
          to="/forecast"
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            fontWeight: '500',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}
        >
          View Forecast
        </Link>
      </header>

      <div className="article-content">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> February 5, 2026</p>

        <p>
          My Marine Forecast ("we," "us," or "our") operates the website at mymarineforecast.com (the "Service").
          This Privacy Policy explains what information we collect, how we use it, and your choices regarding your data.
        </p>

        <h2>1. Information We Collect</h2>

        <h3>Account Information</h3>
        <p>When you create an account, we collect:</p>
        <ul>
          <li><strong>Email address</strong> — used for authentication, account verification, and transactional emails (trial reminders, payment notifications, etc.)</li>
          <li><strong>Password</strong> — stored securely by our authentication provider (Supabase). We never store passwords in plain text and do not have access to your password.</li>
          <li><strong>Display name</strong> (optional) — if you choose to set one</li>
        </ul>

        <h3>Location Data</h3>
        <p>When you save a location, we store:</p>
        <ul>
          <li>The name you assign to the location</li>
          <li>Geographic coordinates (latitude and longitude)</li>
          <li>An associated NOAA tide station identifier, if applicable</li>
        </ul>
        <p>
          We use these coordinates to fetch marine forecasts on your behalf from public government APIs (NOAA, National Weather Service)
          and open weather services (Open-Meteo). Location data is only associated with your account and is not shared with other users.
        </p>

        <h3>Subscription and Payment Information</h3>
        <p>
          If you subscribe to a paid plan, payment processing is handled entirely by <strong>Stripe</strong>.
          We do not collect, store, or have access to your credit card number or bank account details.
          We receive from Stripe only:
        </p>
        <ul>
          <li>A Stripe customer identifier</li>
          <li>Your subscription status (active, trial, canceled, etc.)</li>
          <li>Subscription period dates</li>
        </ul>

        <h3>Dashboard Preferences</h3>
        <p>
          If you customize your forecast dashboard (reorder or collapse cards), those preferences are stored in your account profile
          so they persist across sessions.
        </p>

        <h3>Automatically Collected Information</h3>
        <p>When you use the Service, the following may be collected automatically:</p>
        <ul>
          <li><strong>Browser local storage</strong> — We store your most recently viewed location and an authentication session token locally in your browser. This data stays on your device.</li>
          <li><strong>Analytics data</strong> — We use Google Analytics to collect aggregated, anonymized usage data such as page views, device type, and general geographic region. This helps us understand how the Service is used and improve it. Google Analytics may set cookies on your browser. You can opt out by using a browser extension or adjusting your cookie settings.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide marine forecast data for your saved locations</li>
          <li>Authenticate your account and manage your session</li>
          <li>Process and manage your subscription</li>
          <li>Send transactional emails related to your account (verification, trial reminders, payment confirmations and failures, cancellation notices)</li>
          <li>Persist your dashboard layout preferences</li>
          <li>Improve and maintain the Service</li>
        </ul>
        <p>We do not send marketing or promotional emails. All emails we send are transactional and directly related to your account or subscription.</p>

        <h2>3. Third-Party Services</h2>
        <p>We share limited data with the following third-party services to operate the Service:</p>

        <ul>
          <li><strong>Supabase</strong> (authentication and database) — Stores your account data, saved locations, and subscription status. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a></li>
          <li><strong>Stripe</strong> (payment processing) — Processes payments and manages subscriptions. Receives your email address for billing purposes. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
          <li><strong>Resend</strong> (email delivery) — Delivers transactional emails. Receives your email address. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Resend Privacy Policy</a></li>
          <li><strong>Google Analytics</strong> (usage analytics) — Receives anonymized page view and interaction data. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
          <li><strong>NOAA / National Weather Service</strong> (marine data) — Receives geographic coordinates to provide tide predictions, weather forecasts, and marine alerts. These are free public U.S. government APIs. No personal identifiers are sent.</li>
          <li><strong>Open-Meteo</strong> (weather and wave data) — Receives geographic coordinates to provide weather and marine condition forecasts. No personal identifiers are sent. <a href="https://open-meteo.com/en/terms" target="_blank" rel="noopener noreferrer">Open-Meteo Terms</a></li>
          <li><strong>Vercel</strong> (hosting) — Hosts the Service and runs our server-side functions. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a></li>
        </ul>
        <p>We do not sell, rent, or trade your personal information to any third party.</p>

        <h2>4. Data Retention</h2>
        <ul>
          <li><strong>Account data</strong> is retained for as long as your account exists.</li>
          <li><strong>Saved locations and preferences</strong> are retained for as long as your account exists and are deleted when your account is deleted.</li>
          <li><strong>Payment records</strong> are retained by Stripe in accordance with their data retention policies and applicable financial regulations.</li>
          <li><strong>Analytics data</strong> is retained by Google Analytics in accordance with their retention settings.</li>
        </ul>

        <h2>5. Your Rights and Choices</h2>
        <p>You can:</p>
        <ul>
          <li><strong>Access your data</strong> — View your saved locations and account information within the app.</li>
          <li><strong>Delete your saved locations</strong> — Remove any saved location from the app at any time.</li>
          <li><strong>Cancel your subscription</strong> — Manage or cancel your subscription through the Stripe billing portal, accessible from your account menu.</li>
          <li><strong>Delete your account</strong> — Contact us at hello@mymarineforecast.com to request account deletion. We will delete your profile, saved locations, and subscription data from our database.</li>
          <li><strong>Opt out of analytics</strong> — Use browser settings or a Google Analytics opt-out extension to prevent analytics tracking.</li>
        </ul>

        <h2>6. Security</h2>
        <p>
          We take reasonable measures to protect your data, including:
        </p>
        <ul>
          <li>Encrypted connections (HTTPS) for all data in transit</li>
          <li>Row-level security policies in our database ensuring users can only access their own data</li>
          <li>Passwords managed through Supabase's secure authentication system</li>
          <li>Payment data handled exclusively by Stripe (PCI-compliant)</li>
          <li>Server-side API keys stored securely and never exposed to browsers</li>
        </ul>
        <p>No method of electronic transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>

        <h2>7. Children's Privacy</h2>
        <p>
          The Service is not directed at children under 13. We do not knowingly collect personal information from children under 13.
          If you believe a child under 13 has provided us with personal information, please contact us and we will delete it.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will update the "Last updated" date at the top of this page.
          Your continued use of the Service after changes are posted constitutes acceptance of the updated policy.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or your data, contact us at:
        </p>
        <p><a href="mailto:hello@mymarineforecast.com">hello@mymarineforecast.com</a></p>
      </div>

      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        marginTop: '2rem',
        border: '1px solid var(--color-border)',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
          margin: 0
        }}>
          <Link to="/terms" style={{ color: 'var(--color-accent)', marginRight: '1.5rem' }}>Terms of Service</Link>
          <Link to="/privacy" style={{ color: 'var(--color-accent)' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
