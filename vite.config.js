import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' ทำให้ไฟล์ที่ build แล้ววางในโฟลเดอร์ย่อยได้ (เช่น GitHub Pages)
export default defineConfig({ plugins: [react()], base: './' });
