import { Link } from 'react-router-dom';
import { articles } from '../../content/articles/index';
import '../styles/article.css';

function LearnPage() {
  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
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

      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Learn</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Fishing tips, marine weather insights, and guides to help you make the most of your time on the water.
        </p>
      </div>

      {/* Article Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1rem'
      }}>
        {articles.map((article) => (
          <Link
            key={article.slug}
            to={`/learn/${article.slug}`}
            className="article-card"
          >
            <h2>{article.title}</h2>
            <p>{article.description}</p>
            <div className="article-card-meta">
              <span>{new Date(article.date + 'T00:00:00').toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
              <span style={{ color: 'var(--color-border)' }}>|</span>
              <div className="article-card-tags">
                {article.tags.map((tag) => (
                  <span key={tag} className="article-tag">{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
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
          Just the marine forecast data you need to plan a great day on the water.
        </p>
      </div>
    </div>
  );
}

export default LearnPage;
