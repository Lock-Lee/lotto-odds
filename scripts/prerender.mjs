// รันหลัง vite build: ใส่ HTML ของหน้าแรก, JSON-LD, robots.txt, sitemap.xml และ llms.txt ลงใน dist/
// ตั้ง SITE_URL (เช่น https://example.com/) เพื่อให้มี canonical, og:url และ sitemap
// บน Vercel ไม่ต้องตั้ง จะใช้โดเมน production ของโปรเจกต์ให้เอง ถ้าไม่มีทั้งสองอย่างจะข้ามส่วนที่ต้องใช้ URL เต็ม
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const raw = process.env.SITE_URL || (vercel ? `https://${vercel}` : '');
const site = raw ? raw.replace(/\/?$/, '/') : '';
const { render, meta } = await import(pathToFileURL('dist-ssr/entry-server.js').href);
const { n, first, last, faq } = meta();
const be = iso => `${+iso.slice(0, 4) + 543}`;
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');

const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebApplication', name: 'เช็กโอกาสหวย', inLanguage: 'th', applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'THB' },
      description: 'คำนวณโอกาสถูกสลากกินแบ่งรัฐบาล สถิติความถี่ของเลข และผลรางวัลย้อนหลัง โดยไม่ทำนายเลข',
      dateModified: last, ...(site && { url: site }) },
    { '@type': 'Dataset', name: `ผลสลากกินแบ่งรัฐบาลย้อนหลัง ${n} งวด (พ.ศ. ${be(first)}–${be(last)})`, inLanguage: 'th',
      description: 'ผลรางวัลที่ 1 เลขหน้า 3 ตัว เลขท้าย 3 ตัว และเลขท้าย 2 ตัว ของสลากกินแบ่งรัฐบาลทุกงวด',
      temporalCoverage: `${first}/${last}`, isBasedOn: 'https://github.com/vicha-w/thai-lotto-archive' },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
};

const head = [
  site && `<link rel="canonical" href="${site}" />`,
  site && `<meta property="og:url" content="${site}" />`,
  `<script type="application/ld+json">${json(ld)}</script>`,
].filter(Boolean).join('\n    ');

let html = readFileSync('dist/index.html', 'utf8');
html = html.replace('<!--seo-head-->', head).replace('<div id="root"></div>', `<div id="root">${render()}</div>`);
writeFileSync('dist/index.html', html);

writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${site}sitemap.xml\n` : ''}`);
if (site) writeFileSync('dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}</loc><lastmod>${last}</lastmod></url>\n</urlset>\n`);

// llms.txt สรุปสั้น ๆ ให้ผู้ช่วย AI อ่านได้โดยไม่ต้องรัน JavaScript
writeFileSync('dist/llms.txt', `# เช็กโอกาสหวย

> เว็บแอปแสดงโอกาสถูกสลากกินแบ่งรัฐบาลไทยและสถิติผลรางวัลย้อนหลัง ${n} งวด (พ.ศ. ${be(first)}–${be(last)}) ไม่ทำนายเลข

## คำถามที่พบบ่อย

${faq.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n')}
`);

rmSync('dist-ssr', { recursive: true, force: true });
console.log(`prerendered dist/index.html (${n} งวด)${site ? ` สำหรับ ${site}` : ' ไม่ได้ตั้ง SITE_URL จึงไม่มี canonical และ sitemap'}`);
