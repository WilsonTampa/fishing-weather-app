import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import { articles } from '../../content/articles/index';
import '../styles/article.css';

function parseFrontmatter(markdown: string): { meta: Record<string, string>; body: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: markdown };

  const meta: Record<string, string> = {};
  match[1].split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    }
  });

  return { meta, body: match[2] };
}

function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [articleMeta, setArticleMeta] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleInfo = articles.find(a => a.slug === slug);

  useEffect(() => {
    if (!slug || !articleInfo) {
      setError('Article not found.');
      setIsLoading(false);
      return;
    }

    const loadArticle = async () => {
      try {
        const response = await fetch(`/articles/${slug}.md`);
        if (!response.ok) throw new Error('Failed to load article');
        const text = await response.text();
        const { meta, body } = parseFrontmatter(text);
        setArticleMeta(meta);
        const html = await marked(body);
        setHtmlContent(html);
      } catch {
        setError('Failed to load article content.');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [slug, articleInfo]);

  // Update page title and meta tags for SEO
  useEffect(() => {
    if (articleMeta.title) {
      document.title = `${articleMeta.title} | My Marine Forecast`;
    }

    const setMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (articleMeta.description) {
      setMetaTag('description', articleMeta.description);
      setMetaTag('og:description', articleMeta.description, true);
      setMetaTag('twitter:description', articleMeta.description, true);
    }
    if (articleMeta.title) {
      setMetaTag('og:title', articleMeta.title, true);
      setMetaTag('twitter:title', articleMeta.title, true);
      setMetaTag('og:type', 'article', true);
      setMetaTag('og:url', `https://mymarineforecast.com/learn/${slug}`, true);
    }

    // Add canonical link
    const articleUrl = `https://mymarineforecast.com/learn/${slug}`;
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', articleUrl);

    // Add JSON-LD structured data
    let scriptEl = document.getElementById('article-jsonld');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'article-jsonld';
      scriptEl.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptEl);
    }
    if (articleInfo) {
      scriptEl.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: articleInfo.title,
        description: articleInfo.description,
        datePublished: articleInfo.date,
        dateModified: articleInfo.date,
        author: {
          '@type': 'Organization',
          name: articleInfo.author,
          url: 'https://mymarineforecast.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'My Marine Forecast',
          url: 'https://mymarineforecast.com',
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': articleUrl,
        },
      });
    }

    // Cleanup on unmount
    return () => {
      document.title = 'My Marine Forecast - Tide, Wind & Weather for Boating and Fishing';
      const jsonLd = document.getElementById('article-jsonld');
      if (jsonLd) jsonLd.remove();
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.setAttribute('href', 'https://mymarineforecast.com/');
    };
  }, [articleMeta, articleInfo, slug]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !articleInfo) {
    return (
      <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.75rem'
        }}>
          <h1>My Marine Forecast</h1>
        </header>
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid #F87171',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '4rem auto'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</div>
          <h2 style={{ marginBottom: '0.5rem', color: '#F87171' }}>Article Not Found</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            {error || "The article you're looking for doesn't exist."}
          </p>
          <Link
            to="/learn"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none'
            }}
          >
            Back to Learn
          </Link>
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to="/learn"
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
            All Articles
          </Link>
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
        </div>
      </header>

      {/* Article Meta */}
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="article-meta">
          <span>{new Date(articleInfo.date + 'T00:00:00').toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <span>{articleInfo.author}</span>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {articleInfo.tags.map((tag) => (
              <span key={tag} className="article-tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* Article Body */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
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
          Just the marine forecast data you need to plan a great day on the water.{' '}
          <Link to="/learn" style={{ color: 'var(--color-accent)' }}>
            Learn more
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ArticlePage;
