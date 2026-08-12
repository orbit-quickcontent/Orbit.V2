/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orbit: {
          dark: '#0F172A',
          card: '#1E293B',
          accent: '#6366F1',
          online: '#10B981',
          busy: '#F59E0B',
          offline: '#64748B',
        },
      },
    },
  },
  plugins: [],
};
