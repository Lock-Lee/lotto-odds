// สคริปต์ของหน้าแยก (results, numbers, odds) ที่ไม่ได้ใช้ React: นับคนเข้าเว็บแล้วเติมตัวเลขในแถบด้านบน
import './style.css';
import { trackVisitors } from './visitors.js';

// ไม่ import shared.jsx เพราะจะดึง React มาด้วย
trackVisitors(v => {
  for (const el of document.querySelectorAll('.visitors [data-k]')) {
    const n = v[el.dataset.k];
    el.textContent = n == null ? '–' : Math.round(n).toLocaleString('th-TH');
  }
});
