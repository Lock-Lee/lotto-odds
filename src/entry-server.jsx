// ใช้ตอน build เท่านั้น (scripts/prerender.mjs) เพื่อสร้าง HTML ของหน้าแรกไว้ล่วงหน้าให้เครื่องมือค้นหาอ่านได้
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import { DRAWS, N } from './logic.js';
import { FAQ } from './faq.js';

export const render = () => renderToString(<App />);
export const meta = () => ({ n: N, first: DRAWS[0].date, last: DRAWS[N - 1].date, faq: FAQ });
