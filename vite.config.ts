
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Ladda alla miljövariabler (inklusive de utan VITE_ prefix för att stödja AI Studio)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Mappa import.meta.env.VITE_API_KEY till antingen VITE_API_KEY (Netlify) eller API_KEY (AI Studio)
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
      // Map process.env.API_KEY for strict guideline compliance
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    }
  }
})