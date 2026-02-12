/**
 * Pre-render /learn article pages as static HTML at build time.
 *
 * Reads the built dist/index.html as a template, then for each article:
 *   1. Parses the markdown from public/articles/{slug}.md
 *   2. Replaces the generic homepage meta tags with article-specific ones
 *   3. Injects the rendered article HTML into <div id="root"> so crawlers
 *      see real content on first load (React hydrates on top in the browser)
 *   4. Writes to dist/learn/{slug}/index.html
 *
 * Also generates dist/learn/index.html for the article listing page.
 *
 * Run after `vite build`: node scripts/prerender-articles.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// 1. Load article metadata (same source of truth as the React app)
// ---------------------------------------------------------------------------

// We can't import .ts directly in Node, so we evaluate the TS file
// using a minimal approach: strip types and eval the array.
function loadArticles() {
  const src = readFileSync(join(ROOT, 'content/articles/index.ts'), 'utf-8');

  // Find the array assignment: "export const articles: ArticleMeta[] = ["
  // Extract from the first "[" after that line to the matching "];"
  const assignMatch = src.match(/export\s+const\s+articles[^=]*=\s*/);
  if (!assignMatch) throw new Error('Could not find articles array in index.ts');

  const afterAssign = src.slice(assignMatch.index + assignMatch[0].length);
  // Find the matching closing bracket by counting depth
  let depth = 0;
  let endIdx = -1;
  for (let i = 0; i < afterAssign.length; i++) {
    if (afterAssign[i] === '[') depth++;
    if (afterAssign[i] === ']') {
      depth--;
      if (depth === 0) { endIdx = i + 1; break; }
    }
  }
  if (endIdx === -1) throw new Error('Could not find end of articles array');

  const arrayLiteral = afterAssign.slice(0, endIdx);
  // Evaluate as JavaScript (the array literal is valid JS)
  const articles = new Function(`return ${arrayLiteral}`)();
  return articles;
}

const articles = loadArticles();

// ---------------------------------------------------------------------------
// 2. Load the built index.html as the base template
// ---------------------------------------------------------------------------

const distDir = join(ROOT, 'dist');
const templateHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

// ---------------------------------------------------------------------------
// 3. Markdown helpers
// ---------------------------------------------------------------------------

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: markdown };
  const meta = {};
  match[1].split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    }
  });
  return { meta, body: match[2] };
}

// ---------------------------------------------------------------------------
// 4. HTML manipulation helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Replace a meta tag's content attribute in the HTML string.
 * Handles both name="..." and property="..." attributes.
 */
function replaceMeta(html, attr, name, content) {
  const regex = new RegExp(
    `<meta\\s+${attr}="${name}"\\s+content="[^"]*"\\s*/?>`,
    'i'
  );
  const regexAlt = new RegExp(
    `<meta\\s+content="[^"]*"\\s+${attr}="${name}"\\s*/?>`,
    'i'
  );
  const replacement = `<meta ${attr}="${name}" content="${escapeHtml(content)}" />`;
  if (regex.test(html)) return html.replace(regex, replacement);
  if (regexAlt.test(html)) return html.replace(regexAlt, replacement);
  // Insert before </head> if tag doesn't exist yet
  return html.replace('</head>', `    ${replacement}\n  </head>`);
}

function replaceTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

function replaceCanonical(html, url) {
  return html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeHtml(url)}" />`
  );
}

function injectJsonLd(html, jsonLd) {
  const script = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  return html.replace('</head>', `    ${script}\n  </head>`);
}

function injectIntoRoot(html, content) {
  return html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

// ---------------------------------------------------------------------------
// 5. Generate each article page
// ---------------------------------------------------------------------------

let count = 0;

for (const article of articles) {
  const mdPath = join(ROOT, 'public/articles', `${article.slug}.md`);
  if (!existsSync(mdPath)) {
    console.warn(`  SKIP: ${mdPath} not found`);
    continue;
  }

  const mdSource = readFileSync(mdPath, 'utf-8');
  const { meta, body } = parseFrontmatter(mdSource);
  const articleHtml = marked.parse(body);

  const title = `${meta.title || article.title} | My Marine Forecast`;
  const description = meta.description || article.description;
  const url = `https://mymarineforecast.com/learn/${article.slug}`;
  const dateStr = new Date(article.date + 'T00:00:00').toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Build the in-root HTML that crawlers will see
  const rootContent = `
    <div style="padding:1rem;max-width:1200px;margin:0 auto">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;border-bottom:1px solid #333;padding-bottom:0.75rem;flex-wrap:wrap;gap:1rem">
        <h1>My Marine Forecast</h1>
        <div style="display:flex;gap:0.5rem">
          <a href="/learn">All Articles</a>
          <a href="/forecast">View Forecast</a>
        </div>
      </header>
      <div style="max-width:720px;margin:0 auto">
        <div class="article-meta">
          <span>${dateStr}</span>
          <span>|</span>
          <span>${escapeHtml(article.author)}</span>
        </div>
        <div class="article-content">${articleHtml}</div>
      </div>
    </div>`;

  let html = templateHtml;
  html = replaceTitle(html, title);
  html = replaceMeta(html, 'name', 'title', title);
  html = replaceMeta(html, 'name', 'description', description);
  html = replaceMeta(html, 'property', 'og:type', 'article');
  html = replaceMeta(html, 'property', 'og:url', url);
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'twitter:url', url);
  html = replaceMeta(html, 'property', 'twitter:title', title);
  html = replaceMeta(html, 'property', 'twitter:description', description);
  html = replaceCanonical(html, url);
  html = injectJsonLd(html, {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      '@type': 'Organization',
      name: article.author,
      url: 'https://mymarineforecast.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'My Marine Forecast',
      url: 'https://mymarineforecast.com',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });
  html = injectIntoRoot(html, rootContent);

  const outDir = join(distDir, 'learn', article.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
  count++;
  console.log(`  OK: /learn/${article.slug}`);
}

// ---------------------------------------------------------------------------
// 6. Generate the /learn listing page
// ---------------------------------------------------------------------------

const learnTitle = 'Fishing Tips & Marine Weather Guides | My Marine Forecast';
const learnDescription =
  'Fishing guides covering tides, moon phases, barometric pressure, solunar feeding times, and marine weather. Learn how to read conditions and catch more fish.';
const learnUrl = 'https://mymarineforecast.com/learn';

const articleCards = articles
  .map((a) => {
    const dateStr = new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const tags = a.tags.map((t) => `<span class="article-tag">${escapeHtml(t)}</span>`).join(' ');
    return `
      <a href="/learn/${a.slug}" class="article-card">
        <h2>${escapeHtml(a.title)}</h2>
        <p>${escapeHtml(a.description)}</p>
        <div class="article-card-meta">
          <span>${dateStr}</span>
          <span>|</span>
          <div class="article-card-tags">${tags}</div>
        </div>
      </a>`;
  })
  .join('\n');

const learnRootContent = `
  <div style="padding:1rem;max-width:1200px;margin:0 auto">
    <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;border-bottom:1px solid #333;padding-bottom:0.75rem;flex-wrap:wrap;gap:1rem">
      <h1>My Marine Forecast</h1>
      <a href="/forecast">View Forecast</a>
    </header>
    <div style="margin-bottom:1.5rem">
      <h2 style="font-size:1.5rem;margin-bottom:0.5rem">Learn</h2>
      <p>Fishing tips, marine weather insights, and guides to help you make the most of your time on the water.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1rem">
      ${articleCards}
    </div>
  </div>`;

let learnHtml = templateHtml;
learnHtml = replaceTitle(learnHtml, learnTitle);
learnHtml = replaceMeta(learnHtml, 'name', 'title', learnTitle);
learnHtml = replaceMeta(learnHtml, 'name', 'description', learnDescription);
learnHtml = replaceMeta(learnHtml, 'property', 'og:type', 'website');
learnHtml = replaceMeta(learnHtml, 'property', 'og:url', learnUrl);
learnHtml = replaceMeta(learnHtml, 'property', 'og:title', learnTitle);
learnHtml = replaceMeta(learnHtml, 'property', 'og:description', learnDescription);
learnHtml = replaceMeta(learnHtml, 'property', 'twitter:url', learnUrl);
learnHtml = replaceMeta(learnHtml, 'property', 'twitter:title', learnTitle);
learnHtml = replaceMeta(learnHtml, 'property', 'twitter:description', learnDescription);
learnHtml = replaceCanonical(learnHtml, learnUrl);
learnHtml = injectJsonLd(learnHtml, {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Fishing Tips & Marine Weather Guides',
  description: learnDescription,
  url: learnUrl,
  publisher: {
    '@type': 'Organization',
    name: 'My Marine Forecast',
    url: 'https://mymarineforecast.com',
  },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: articles.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://mymarineforecast.com/learn/${a.slug}`,
      name: a.title,
    })),
  },
});
learnHtml = injectIntoRoot(learnHtml, learnRootContent);

const learnDir = join(distDir, 'learn');
mkdirSync(learnDir, { recursive: true });
writeFileSync(join(learnDir, 'index.html'), learnHtml);

console.log(`  OK: /learn`);
console.log(`\nPre-rendered ${count} article pages + 1 listing page.`);
