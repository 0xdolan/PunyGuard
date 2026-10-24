/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#070A0F',
        ember: '#FF1A1A',
        mist: '#A8B3C5',
      },
      backgroundImage: {
        mesh: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,26,26,0.28), transparent), radial-gradient(ellipse 50% 40% at 100% 50%, rgba(255,26,26,0.08), transparent), radial-gradient(ellipse 40% 30% at 0% 80%, rgba(255,255,255,0.04), transparent)',
      },
    },
  },
  plugins: [],
};
