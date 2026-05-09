export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'Tajawal', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 40px rgba(34, 211, 238, 0.24)',
        purple: '0 0 40px rgba(168, 85, 247, 0.22)'
      },
      backgroundImage: {
        aurora: 'radial-gradient(circle at 20% 10%, rgba(34,211,238,.28), transparent 30%), radial-gradient(circle at 80% 0%, rgba(168,85,247,.22), transparent 28%), linear-gradient(135deg, #020617 0%, #081326 48%, #0f172a 100%)'
      }
    }
  },
  plugins: []
};
