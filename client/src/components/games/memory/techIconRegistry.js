import { TECH_CARDS } from '../../../lib/gameRegistry';

const techIconModules = import.meta.glob(
  '../assests/memorization/*.{svg,png,jpg,jpeg,webp,avif}',
  { eager: true, import: 'default', query: '?url' }
);

export const toTechSlug = (value) =>
  value
    .toLowerCase()
    .replace(/\+\+/g, 'plusplus')
    .replace(/#/g, 'sharp')
    .replace(/[^a-z0-9]/g, '');

/**
 * Every technology used by the game and its expected asset filename.
 * The extension may be svg, png, jpg, jpeg, webp, or avif.
 */
export const TECH_ICON_MANIFEST = TECH_CARDS.map((name) => {
  const slug = toTechSlug(name);
  return { name, slug, fileName: `${slug}.svg` };
});

const TECH_ICONS = Object.entries(techIconModules).reduce((icons, [path, icon]) => {
  const fileName = path.split('/').pop() || '';
  const slug = fileName.replace(/\.[^.]+$/, '');
  icons[toTechSlug(slug)] = icon;
  return icons;
}, {});

/**
 * Resolves an icon placed in components/games/assests/memorization.
 * Example: "Node.js" resolves to nodejs.svg, while "Next.js" resolves to nextjs.png.
 */
export const getTechIcon = (techName) => TECH_ICONS[toTechSlug(techName)] || null;
