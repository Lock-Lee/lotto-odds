// ใช้ตอน build เท่านั้น (scripts/prerender.mjs) เพื่อสร้าง HTML ไว้ล่วงหน้าให้เครื่องมือค้นหาอ่านได้
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import App from './App.jsx';
import { DRAWS, N } from './logic.js';
import { FAQ } from './faq.js';
import { buildPages } from './pages.jsx';
import { Visitors, thDate } from './shared.jsx';
import { COUNTER_ON } from './visitors.js';

export const render = () => renderToString(<App />);
export const meta = () => ({ n: N, first: DRAWS[0].date, last: DRAWS[N - 1].date, lastTh: thDate(DRAWS[N - 1].date), faq: FAQ });

// หน้าแยก: คืน path, title, description, crumbs และ HTML ส่วนหัวกับเนื้อหา
export const pages = () => buildPages().map(({ body, ...p }) => ({
  ...p,
  header: renderToStaticMarkup(<header><a className="brand" href="/">เช็คโอกาสหวย</a>{COUNTER_ON && <Visitors v={null} />}</header>),
  crumbsHtml: renderToStaticMarkup(
    <nav className="crumbs" aria-label="ตำแหน่งของหน้า"><ol>{p.crumbs.map(([name, href], i) => (
      <li key={href}>{i === p.crumbs.length - 1 ? <span aria-current="page">{name}</span> : <a href={href}>{name}</a>}</li>
    ))}</ol></nav>),
  html: renderToStaticMarkup(body),
}));
