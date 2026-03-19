import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      maxWidth: {
        content: '680px',
        wide: '860px',
        admin: '1200px',
      },
      spacing: {
        'page-x': '1rem',
        'page-x-md': '1.5rem',
        'safe-bottom': 'max(1.5rem, env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
}

export default config
