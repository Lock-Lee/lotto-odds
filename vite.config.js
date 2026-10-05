import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' ทำให้ไฟล์ที่ build แล้ววางในโฟลเดอร์ย่อยได้ (เช่น GitHub Pages)
// page.js เป็นสคริปต์ของหน้าแยกที่ prerender สร้าง ดูชื่อไฟล์จริงได้จาก manifest
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { manifest: true, rollupOptions: { input: { index: 'index.html', page: 'src/page.js' } } },
});
