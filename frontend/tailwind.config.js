/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        signal: {
          bg: '#0a101d',
          panel: '#0f172a',
          card: '#162238',
          cardHover: '#1c2c47',
          border: '#1e2f4d',
          borderLight: '#2a4168',
          blue: '#2563eb',
          blueHover: '#1d4ed8',
          blueLight: '#3b82f6',
          bubbleOut: '#2563eb',
          bubbleIn: '#16243b',
          textMuted: '#94a3b8',
          online: '#22c55e',
        }
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.3)',
        'glow-soft': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
