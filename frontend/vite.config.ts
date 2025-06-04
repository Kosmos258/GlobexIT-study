import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Путь wt/web/folder/temp_template/frontend
  base: "/adaptation_test/collaborators/frontend/dist/",
  plugins: [react()],
  build: {
    sourcemap: true
  }
})
