import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/article.css';

function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service | My Marine Forecast';
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
        <h1>Terms of Service</h1>
        <p><strong>Last updated:</strong> February 5, 2026</p>

        <p>
          These Terms of Service ("Terms") govern your use of the My Marine Forecast website and application at mymarineforecast.com (the "Service"),
          operated by My Marine Forecast ("we," "us," or "our"). By accessing or using the Service, you agree to these Terms.
          If you do not agree, do not use the Service.
        </p>

        <h2>1. Description of Service</h2>
        <p>
          My Marine Forecast provides marine weather forecasts, tide predictions, wind conditions, wave data, and related information
          for U.S. coastal waters. The Service aggregates data from public sources including NOAA, the National Weather Service, and Open-Meteo.
        </p>

        <h2>2. Accounts</h2>
        <ul>
          <li>You must provide a valid email address and create a password to register for an account.</li>
          <li>You are responsible for maintaining the security of your account credentials.</li>
          <li>You must be at least 13 years of age to create an account.</li>
          <li>One account per person. You may not create multiple accounts.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
        </ul>

        <h2>3. Subscription Plans and Pricing</h2>

        <h3>Free Plan</h3>
        <p>All registered users receive a free plan that includes:</p>
        <ul>
          <li>Today's marine forecast</li>
          <li>One saved location</li>
        </ul>

        <h3>Paid Plan</h3>
        <p>Paid subscribers receive additional features including:</p>
        <ul>
          <li>7-day extended forecasts</li>
          <li>Unlimited saved locations</li>
          <li>Customizable dashboard layout</li>
        </ul>
        <p>
          Paid plans are available on a monthly or annual billing cycle. Current pricing is displayed on the upgrade screen within the app.
          We reserve the right to change pricing with reasonable notice. Price changes will not affect your current billing period.
        </p>

        <h3>Free Trial</h3>
        <p>
          New users may be offered a 7-day free trial of the paid plan. The trial includes all paid features.
          At the end of the trial, your account will revert to the free plan unless you subscribe to a paid plan.
          Each user is eligible for one free trial only.
        </p>

        <h2>4. Billing and Cancellation</h2>
        <ul>
          <li>Payments are processed by <strong>Stripe</strong>. By subscribing, you agree to Stripe's <a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer">terms of service</a>.</li>
          <li>Subscriptions renew automatically at the end of each billing period unless you cancel.</li>
          <li>You can cancel your subscription at any time through the billing portal in your account menu. After cancellation, you will retain access to paid features until the end of your current billing period.</li>
          <li>We do not offer prorated refunds for partial billing periods. If you cancel mid-cycle, you keep access until the period ends but are not refunded for the remaining time.</li>
          <li>If a payment fails, your account may be placed in a past-due status. We will notify you by email and you can update your payment method in the billing portal.</li>
        </ul>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to the Service, other accounts, or our systems</li>
          <li>Scrape, crawl, or use automated tools to extract data from the Service in bulk</li>
          <li>Interfere with or disrupt the Service or its infrastructure</li>
          <li>Resell, redistribute, or sublicense access to the Service</li>
          <li>Circumvent subscription restrictions or feature limitations</li>
        </ul>

        <h2>6. Data Accuracy and Disclaimer</h2>
        <p>
          <strong>The Service provides forecast and weather data for informational purposes only.</strong> Marine forecasts, tide predictions, wind data,
          wave conditions, and all other information provided through the Service are sourced from third-party government and public APIs and are presented
          as-is.
        </p>
        <p>
          <strong>Do not rely on this Service as your sole source of weather or safety information for marine activities.</strong> Always check
          official NOAA and National Weather Service sources, local harbor authorities, and Coast Guard notices before going on the water. Conditions
          can change rapidly and forecasts are inherently uncertain.
        </p>
        <p>
          We do not guarantee the accuracy, completeness, reliability, or timeliness of any data provided through the Service. Forecast data may be
          delayed, unavailable, or inaccurate due to upstream data source issues beyond our control.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, MY MARINE FORECAST, ITS OWNERS, OPERATORS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO PERSONAL INJURY, PROPERTY DAMAGE,
          LOSS OF DATA, OR LOST PROFITS, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
        </p>
        <p>
          IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM,
          OR FIFTY DOLLARS ($50), WHICHEVER IS GREATER.
        </p>
        <p>
          YOU ACKNOWLEDGE THAT MARINE ACTIVITIES CARRY INHERENT RISKS AND THAT WEATHER AND OCEAN CONDITIONS ARE UNPREDICTABLE.
          YOU USE INFORMATION FROM THE SERVICE AT YOUR OWN RISK.
        </p>

        <h2>8. Disclaimer of Warranties</h2>
        <p>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
          INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
        </p>

        <h2>9. Intellectual Property</h2>
        <p>
          The Service's design, code, branding, and original content (including articles and educational materials) are owned by My Marine Forecast
          and are protected by applicable intellectual property laws. Forecast data sourced from public government APIs (NOAA, NWS) is in the public domain.
        </p>
        <p>You may not copy, modify, distribute, or create derivative works based on our proprietary content without written permission.</p>

        <h2>10. Account Termination</h2>
        <p>
          We may suspend or terminate your account if you violate these Terms or engage in conduct that we reasonably believe is harmful to the Service
          or other users. You may delete your account at any time by contacting us at hello@mymarineforecast.com.
        </p>
        <p>
          Upon account deletion, your profile, saved locations, and preferences will be permanently removed from our database.
          Stripe may retain payment records as required by financial regulations.
        </p>

        <h2>11. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. If we make material changes, we will update the "Last updated" date at the top of this page.
          Your continued use of the Service after changes are posted constitutes acceptance of the updated Terms.
        </p>

        <h2>12. Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of the United States. Any disputes arising from these Terms or
          your use of the Service will be resolved in accordance with applicable law.
        </p>

        <h2>13. Contact Us</h2>
        <p>
          If you have questions about these Terms, contact us at:
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

export default TermsOfService;
