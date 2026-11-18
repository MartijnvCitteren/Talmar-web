/**
 * Guards the Taldo design system (.claude/skills/taldo-design-system): CSS modules may only
 * use design tokens from src/app/styles/tokens.css for color, type, spacing, radius and
 * motion. A value that has no token yet gets a new token in tokens.css, not a literal here.
 *
 * Only CSS modules are linted — tokens.css is where the literals are supposed to live.
 * Component dimensions (width/height of an icon chip, a checkbox box, a border width) are
 * deliberately not restricted; they aren't part of the design system's scales.
 */
const tokenOnly = ['/^var\\(--/', 'inherit'];

/** @type {import('stylelint').Config} */
export default {
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch'],

    // No unit literals in spacing, radius, type and motion — 0, auto and var()/calc(var())
    // stay allowed.
    'declaration-property-unit-allowed-list': {
      '/^(padding|margin)/': [],
      '/^(gap|row-gap|column-gap)$/': [],
      '/^border(-[a-z]+)*-radius$/': [],
      'font-size': [],
      'letter-spacing': [],
      '/^(transition|animation)/': [],
    },
    'declaration-property-value-allowed-list': {
      'font-family': tokenOnly,
      'font-weight': tokenOnly,
      'line-height': [...tokenOnly, '0'],
      font: ['inherit'],
    },

    // Breakpoints from the design system: mobile < 640px, tablet < 1024px.
    'media-feature-name-value-allowed-list': {
      'max-width': ['639px', '1023px'],
      'min-width': ['640px', '1024px'],
    },
  },
};
