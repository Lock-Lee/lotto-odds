import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './style.css';

const root = document.getElementById('root');
const app = <React.StrictMode><App /></React.StrictMode>;
// ถ้า build แล้ว HTML ถูก prerender ไว้ ให้ hydrate ต่อ ตอน dev ยังว่างอยู่จึง render ใหม่
if (root.hasChildNodes()) hydrateRoot(root, app); else createRoot(root).render(app);
