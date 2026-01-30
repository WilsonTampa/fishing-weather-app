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
    date: '2026-01-15',
    tags: ['fishing', 'tides', 'moon phases', 'lunar tides', 'spring tides', 'neap tides'],
    author: 'My Marine Forecast',
  },
  {
    slug: 'how-barometric-pressure-affects-fishing',
    title: 'How Barometric Pressure Affects Fishing: What the Barometer Is Telling You',
    description: 'Learn how barometric pressure affects fish behavior and feeding patterns. Understand rising, falling, and stable pressure to plan better fishing trips.',
    date: '2026-01-18',
    tags: ['fishing', 'barometric pressure', 'weather', 'fish behavior', 'fishing conditions'],
    author: 'My Marine Forecast',
  },
  {
    slug: 'major-and-minor-feeding-times-for-fishing',
    title: 'Major and Minor Feeding Times for Fishing: When Fish Are Most Likely to Bite',
    description: 'Learn what major and minor feeding periods are, how they\'re calculated from moon position, and how to use them to plan your fishing trips for more consistent action.',
    date: '2026-01-21',
    tags: ['fishing', 'feeding times', 'solunar', 'major period', 'minor period', 'moon transit', 'best time to fish'],
    author: 'My Marine Forecast',
  },
  {
    slug: 'how-tide-stations-work',
    title: 'How Tide Stations Work: Where Your Tide Charts Actually Come From',
    description: 'Learn how NOAA tide stations measure and predict tides, the difference between reference and secondary stations, and how to pick the right station for your fishing spot.',
    date: '2026-01-25',
    tags: ['fishing', 'tide stations', 'NOAA', 'tide predictions', 'tide charts', 'reference stations', 'tidal data'],
    author: 'My Marine Forecast',
  },
  {
    slug: 'why-is-wind-speed-so-hard-to-predict',
    title: 'Why Is Wind Speed So Hard to Predict? A Fisherman\'s Guide to Wind Forecasts',
    description: 'Learn why wind forecasts are often wrong for fishing, what causes wind prediction errors, and how to read a marine wind forecast so you don\'t get caught off guard on the water.',
    date: '2026-01-29',
    tags: ['fishing', 'wind speed', 'wind forecast', 'marine weather', 'weather prediction', 'wind gusts', 'boating safety'],
    author: 'My Marine Forecast',
  },
  {
    slug: 'what-is-tide-coefficient',
    title: 'What Is Tide Coefficient? How Tidal Range Tells You When Fish Will Feed',
    description: 'Learn what tide coefficient and tidal range mean for fishing. Understand how the difference between high and low tide predicts current strength, bait movement, and feeding activity.',
    date: '2026-02-01',
    tags: ['fishing', 'tide coefficient', 'tidal range', 'tide chart', 'current strength', 'spring tides', 'neap tides', 'tide predictions'],
    author: 'My Marine Forecast',
  },
];
