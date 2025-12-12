import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Ladda miljövariabler (t.ex. VITE_API_KEY från Netlify)
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Ersätt process.env.API_KEY i koden med värdet från VITE_API_KEY vid byggtillfället
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    }
  }
})