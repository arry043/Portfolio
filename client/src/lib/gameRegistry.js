/**
 * Static registry of all available games.
 *
 * To add a new game:
 * 1. Add an entry here
 * 2. Create the page component
 * 3. Add the route in App.jsx
 *
 * No other code changes needed.
 */

export const GAME_REGISTRY = [
  {
    slug: 'memorization',
    title: 'Memorization',
    description:
      'Match developer technology pairs to test your memory. Flip cards, find matching technologies, and compete for the fastest time.',
    icon: 'Brain',
    difficulties: ['easy', 'medium', 'hard', 'expert'],
    path: '/game/memorization',
    available: true,
    gridConfig: {
      easy: { cols: 4, rows: 4 },
      medium: { cols: 6, rows: 4 },
      hard: { cols: 6, rows: 6 },
      expert: { cols: 8, rows: 8 },
    },
  },
  // Future games:
  // {
  //   slug: 'typing',
  //   title: 'Typing Sprint',
  //   description: 'Test your typing speed with code snippets.',
  //   icon: 'Keyboard',
  //   difficulties: ['easy', 'medium', 'hard', 'expert'],
  //   path: '/game/typing',
  //   available: false,
  // },
];

/**
 * Tech cards used in the memory game.
 * Each entry is a pair label.
 */
export const TECH_CARDS = [
  'React',
  'Node.js',
  'Docker',
  'Git',
  'MongoDB',
  'Express',
  'Python',
  'TypeScript',
  'Redis',
  'PostgreSQL',
  'Next.js',
  'OpenAI',
  'Vue',
  'Angular',
  'Rust',
  'Go',
  'Kubernetes',
  'GraphQL',
  'Firebase',
  'AWS',
  'Tailwind',
  'Prisma',
  'Vite',
  'Webpack',
  'Svelte',
  'Django',
  'Flask',
  'FastAPI',
  'Terraform',
  'Nginx',
  'Linux',
  'Figma',
];

/**
 * Get a game from the registry by slug.
 * @param {string} slug
 * @returns {object | undefined}
 */
export const getGameBySlug = (slug) =>
  GAME_REGISTRY.find((g) => g.slug === slug);

/**
 * Get only available (playable) games.
 * @returns {object[]}
 */
export const getAvailableGames = () =>
  GAME_REGISTRY.filter((g) => g.available);

/**
 * Difficulty labels for display.
 */
export const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

/**
 * Difficulty colors for badges.
 */
export const DIFFICULTY_COLORS = {
  easy: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  medium: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  hard: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  expert: 'text-red-400 border-red-400/30 bg-red-400/10',
};
