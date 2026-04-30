import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-surface, #ffffff)',
        foreground: 'var(--color-text, #18181b)',
      },
    },
  },
  plugins: [],
};

export default config;
