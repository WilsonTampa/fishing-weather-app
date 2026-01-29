export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  author: string;
}

export const articles: ArticleMeta[] = [
  {
    slug: 'how-does-moon-affect-tides',
    title: 'How the Moon Affects Tides & Fishing: A Fisherman\'s Guide to Lunar Tides',
    description: 'Learn how moon phases and tides affect fishing success. Discover the best tides for catching fish, why moving water means more bites, and how to use lunar cycles to plan your next trip.',
    date: '2026-01-29',
    tags: ['fishing', 'tides', 'moon phases', 'lunar tides', 'spring tides', 'neap tides'],
    author: 'My Marine Forecast',
  },
];
