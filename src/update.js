// ดึงงวดใหม่อัตโนมัติจากชุดข้อมูล thai-lotto-archive บน GitHub
// ถ้าดึงไม่ได้ แอปยังทำงานด้วยข้อมูลใน data.js และงวดที่เคยดึงเก็บไว้ในเครื่อง
const LIST_URL = 'https://api.github.com/repos/vicha-w/thai-lotto-archive/contents/lottonumbers';
const FILE_URL = 'https://raw.githubusercontent.com/vicha-w/thai-lotto-archive/master/lottonumbers/';
const CACHE_KEY = 'lotto-odds:new-draws:v1';
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;   // ตรวจซ้ำไม่ถี่กว่าทุก 6 ชั่วโมง
const MAX_FILES = 60;

// ชุดข้อมูลตั้งชื่อบางไฟล์ตามวันออกปกติ จึงปรับเป็นวันออกจริงที่เลื่อนถาวร
function realDate(iso) {
  if (iso.endsWith('-01-16')) return iso.slice(0, 5) + '01-17';   // วันครู
  if (iso.endsWith('-05-01')) return iso.slice(0, 5) + '05-02';   // วันแรงงาน
  return iso;
}

// แปลงไฟล์ 1 งวดเป็นบรรทัดรูปแบบ data.js คืน null ถ้ารางวัลยังไม่ครบหรือรูปแบบผิด
export function parseDrawFile(iso, text) {
  const f = {};
  for (const line of text.split('\n')) { const p = line.trim().split(/\s+/); if (p[0]) f[p[0]] = p.slice(1); }
  const first = f.FIRST?.[0], two = f.TWO?.[0], f3 = f.THREE_FIRST || [], l3 = f.THREE_LAST || [];
  const ok = /^\d{6}$/.test(first || '') && /^\d{2}$/.test(two || '') &&
    f3.length === 2 && l3.length === 2 && [...f3, ...l3].every(x => /^\d{3}$/.test(x));
  return ok ? `${realDate(iso)}|${first}|${two}|${f3.join('')}|${l3.join('')}` : null;
}

function readCache() {
  try { const c = JSON.parse(localStorage.getItem(CACHE_KEY)); if (c && Array.isArray(c.lines)) return c; } catch (e) { /* ไม่มีหรืออ่านไม่ได้ */ }
  return { lines: [], checkedAt: 0 };
}
function writeCache(c) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) { /* เก็บไม่ได้ก็ไม่เป็นไร */ } }

// lastDate = วันที่ของงวดล่าสุดที่แอปมีอยู่, onLines = ฟังก์ชันรับบรรทัดงวดใหม่
// คืนสถานะ 'current' (ตรวจสำเร็จ) หรือ 'offline' (ตรวจไม่สำเร็จ)
export async function loadUpdates(lastDate, onLines) {
  const cache = readCache();
  const lineOk = l => /^\d{4}-\d{2}-\d{2}\|\d{6}\|\d{2}\|\d{6}\|\d{6}$/.test(l);
  cache.lines = cache.lines.filter(l => lineOk(l) && l.slice(0, 10) > lastDate);
  if (cache.lines.length) onLines(cache.lines);
  if (Date.now() - cache.checkedAt < CHECK_EVERY_MS) return 'current';
  const newest = cache.lines.reduce((m, l) => (l.slice(0, 10) > m ? l.slice(0, 10) : m), lastDate);
  let names;
  try {
    const res = await fetch(LIST_URL, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error('list ' + res.status);
    names = (await res.json()).map(x => x.name).filter(n => /^\d{4}-\d{2}-\d{2}\.txt$/.test(n))
      .filter(n => realDate(n.slice(0, 10)) > newest).sort();
  } catch (e) {
    names = guessNames(newest);   // ขอรายชื่อไฟล์ไม่ได้ (เช่น เกินโควตา) จึงลองเดาชื่อไฟล์จากวันออกรางวัลที่เป็นไปได้
  }
  const fresh = [];
  let reached = 0;
  for (const name of names.slice(0, MAX_FILES)) {
    try {
      const r = await fetch(FILE_URL + name);
      reached++;
      if (!r.ok) continue;
      const line = parseDrawFile(name.slice(0, 10), await r.text());
      if (line && line.slice(0, 10) > newest) fresh.push(line);
    } catch (e) { /* ไฟล์นี้ดึงไม่ได้ ข้ามไป */ }
  }
  if (names.length && !reached) return 'offline';
  if (fresh.length) onLines(fresh);
  writeCache({ lines: [...cache.lines, ...fresh], checkedAt: Date.now() });
  return 'current';
}

// วันที่ที่อาจมีการออกรางวัลหลังงวดล่าสุดจนถึงวันนี้: วันที่ 1, 2, 16, 17, 30, 31 ของแต่ละเดือน
function guessNames(afterIso) {
  const out = [], end = new Date(), d = new Date(afterIso + 'T00:00:00Z');
  for (d.setUTCDate(d.getUTCDate() + 1); d <= end && out.length < MAX_FILES; d.setUTCDate(d.getUTCDate() + 1)) {
    if ([1, 2, 16, 17, 30, 31].includes(d.getUTCDate())) out.push(d.toISOString().slice(0, 10) + '.txt');
  }
  return out;
}
