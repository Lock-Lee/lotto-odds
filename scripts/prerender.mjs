// รันหลัง vite build: ใส่ HTML ของหน้าแรก, สร้างหน้าแยก (results, numbers, odds), JSON-LD, robots.txt, sitemap.xml และ llms.txt ลงใน dist/
// ตั้ง SITE_URL (เช่น https://example.com/) เพื่อให้มี canonical, og:url และ sitemap
// บน Vercel ไม่ต้องตั้ง จะใช้โดเมน production ของโปรเจกต์ให้เอง ถ้าไม่มีทั้งสองอย่างจะข้ามส่วนที่ต้องใช้ URL เต็ม
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const raw = process.env.SITE_URL || (vercel ? `https://${vercel}` : '');
const site = raw ? raw.replace(/\/?$/, '/') : '';
const abs = path => site + path.replace(/^\//, '');
const { render, meta, pages } = await import(pathToFileURL('dist-ssr/entry-server.js').href);
const { n, first, last, lastTh, faq } = meta();
const be = iso => `${+iso.slice(0, 4) + 543}`;
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// ---------- หน้าแรก ----------
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebApplication', name: 'เช็คโอกาสหวย', inLanguage: 'th', applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'THB' },
      description: 'คำนวณโอกาสถูกสลากกินแบ่งรัฐบาล สถิติความถี่ของเลข และผลรางวัลย้อนหลัง โดยไม่ทำนายเลข',
      dateModified: last, ...(site && { url: site }) },
    { '@type': 'Dataset', name: `ผลสลากกินแบ่งรัฐบาลย้อนหลัง ${n} งวด (พ.ศ. ${be(first)}–${be(last)})`, inLanguage: 'th',
      description: 'ผลรางวัลที่ 1 เลขหน้า 3 ตัว เลขท้าย 3 ตัว และเลขท้าย 2 ตัว ของสลากกินแบ่งรัฐบาลทุกงวด',
      temporalCoverage: `${first}/${last}`, isBasedOn: 'https://github.com/vicha-w/thai-lotto-archive',
      ...(site && { url: abs('/results/') }) },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
};

const template = readFileSync('dist/index.html', 'utf8');
const head = [
  site && `<link rel="canonical" href="${site}" />`,
  site && `<meta property="og:url" content="${site}" />`,
  `<script type="application/ld+json">${json(ld)}</script>`,
].filter(Boolean).join('\n    ');
writeFileSync('dist/index.html', template.replace('<!--seo-head-->', head).replace('<div id="root"></div>', `<div id="root">${render()}</div>`));

// ---------- หน้าแยก ----------
// ใช้ <head> เดียวกับหน้าแรก แต่เปลี่ยน title/description/og และใช้สคริปต์ page.js แทนแอป React
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
const entry = manifest['src/page.js'];
// CSS อาจอยู่ใน chunk ที่ page.js import ต่อ จึงต้องไล่เก็บทั้งต้นไม้
const cssOf = (key, seen = new Set()) => seen.has(key) ? [] : (seen.add(key),
  [...(manifest[key].css || []), ...(manifest[key].imports || []).flatMap(k => cssOf(k, seen))]);
const assets = [
  ...[...new Set(cssOf('src/page.js'))].map(c => `<link rel="stylesheet" href="/${c}" />`),
  `<script type="module" src="/${entry.file}"></script>`,
].join('\n    ');
const baseHead = template
  .replace(/\s*<script type="module"[^>]*><\/script>/g, '')
  .replace(/\s*<link rel="stylesheet"[^>]*\/assets\/[^>]*>/g, '')
  .replace(/\s*<link rel="modulepreload"[^>]*>/g, '');
const footer = `<footer>
      <p>ข้อมูล ${n} งวด ถึงงวด ${lastTh} รวบรวมจากแหล่งภายนอก ไม่ใช่เอกสารทางการของสำนักงานสลากกินแบ่งรัฐบาล เว็บนี้ไม่ได้ทำนายเลข</p>
      <p><a href="/">เช็คโอกาสหวย</a> · <a href="/results/">ผลหวยย้อนหลัง</a> · <a href="/numbers/">สถิติเลข 00–99</a> · <a href="/odds/">โอกาสถูกหวย</a></p>
      <p>เว็บนี้ไม่เก็บข้อมูลส่วนบุคคลและไม่ใช้คุกกี้ ส่งรหัสสุ่มของแท็บไปที่ตัวนับบน Cloudflare เพื่อนับยอดเข้าชมและคนออนไลน์ โดยไม่บันทึก IP</p>
    </footer>`;

const all = pages();
for (const p of all) {
  const crumbsLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: p.crumbs.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(site && { item: abs(href) }) })) };
  const pageHead = [
    site && `<link rel="canonical" href="${abs(p.path)}" />`,
    site && `<meta property="og:url" content="${abs(p.path)}" />`,
    `<script type="application/ld+json">${json(crumbsLd)}</script>`,
    assets,
  ].filter(Boolean).join('\n    ');
  const html = baseHead
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(p.description)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(p.title)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(p.description)}`)
    .replace('<!--seo-head-->', pageHead)
    .replace('<div id="root"></div>', `${p.header}\n    ${p.crumbsHtml}\n    <main>${p.html}</main>\n    ${footer}`);
  mkdirSync('dist' + p.path, { recursive: true });
  writeFileSync(`dist${p.path}index.html`, html);
}

// ---------- ไฟล์สำหรับเครื่องมือค้นหาและ AI ----------
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${site}sitemap.xml\n` : ''}`);
if (site) writeFileSync('dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ['/', ...all.map(p => p.path)].map(path => `  <url><loc>${abs(path)}</loc><lastmod>${last}</lastmod></url>`).join('\n') +
  `\n</urlset>\n`);

// llms.txt สรุปสั้น ๆ ให้ผู้ช่วย AI อ่านได้โดยไม่ต้องรัน JavaScript
const link = path => site ? abs(path) : path;
writeFileSync('dist/llms.txt', `# เช็คโอกาสหวย

> เว็บแอปแสดงโอกาสถูกสลากกินแบ่งรัฐบาลไทยและสถิติผลรางวัลย้อนหลัง ${n} งวด (พ.ศ. ${be(first)}–${be(last)}) ไม่ทำนายเลข

## หน้าหลัก

- [โอกาสถูกหวยแต่ละรางวัล](${link('/odds/')}): โอกาสต่อ 1 ใบ และเงินที่ได้คืนเฉลี่ย
- [ผลหวยย้อนหลังทุกงวด](${link('/results/')}): แยกตามปี พ.ศ. ${be(first)}–${be(last)}
- [สถิติเลขท้าย 2 ตัว 00–99](${link('/numbers/')}): แต่ละเลขออกกี่ครั้ง มีหน้าแยกทุกเลข เช่น ${link('/number/79/')}

## คำถามที่พบบ่อย

${faq.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n')}
`);

rmSync('dist-ssr', { recursive: true, force: true });
rmSync('dist/.vite', { recursive: true, force: true });
console.log(`prerendered หน้าแรก + ${all.length} หน้าแยก (${n} งวด)${site ? ` สำหรับ ${site}` : ' ไม่ได้ตั้ง SITE_URL จึงไม่มี canonical และ sitemap'}`);
