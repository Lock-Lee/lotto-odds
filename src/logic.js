import { RAW } from './data.js';

// ---------- สถิติ ----------
export const DRAWS = RAW.map(s => {
  const [date, first, two, f3, l3] = s.split('|');
  const chunk = t => t ? t.match(/.{3}/g) : [];
  return { date, first, two, front3: chunk(f3), last3: chunk(l3), top3: first.slice(3), top2: first.slice(4) };
});
export const N = DRAWS.length;
export const pad = (n, w) => String(n).padStart(w, '0');

function lnGamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179, -0.000005395239384953];
  let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
  let s = 1.000000000190015;
  for (const v of c) s += v / ++y;
  return -t + Math.log(2.5066282746310005 * s / x);
}
// Q(a,x) = ส่วนหางขวาของ regularized incomplete gamma
function gammaQ(a, x) {
  if (x <= 0) return 1;
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let i = 0; i < 500; i++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-12) break; }
    return 1 - sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}
const chiP = (stat, df) => gammaQ(df / 2, stat / 2);

// ความถี่ของเลข 2 หลัก: key = 'two' (เลขท้าย 2 ตัว) หรือ 'top2' (2 ตัวบน)
export function freq2(key) {
  const counts = Array(100).fill(0), lastIdx = Array(100).fill(-1);
  DRAWS.forEach((d, i) => { const n = +d[key]; counts[n]++; lastIdx[n] = i; });
  const exp = N / 100;
  const chi = counts.reduce((s, c) => s + (c - exp) ** 2 / exp, 0);
  return { counts, lastIdx, exp, sd: Math.sqrt(N * 0.01 * 0.99), chi, p: chiP(chi, 99) };
}
// งวดถัดไปออกซ้ำกับงวดก่อนหน้าบ่อยแค่ไหน (ควรใกล้ 1%)
export function repeatTest(key) {
  let hits = 0;
  for (let i = 1; i < N; i++) if (DRAWS[i][key] === DRAWS[i - 1][key]) hits++;
  return { hits, trials: N - 1, expected: (N - 1) / 100 };
}
// ลองใช้สูตรย้อนหลัง: ทุกงวดเลือก K เลขตามสูตรจากข้อมูลก่อนหน้าเท่านั้น
export function backtest(key, K = 10, warm = 100) {
  const strategies = {
    hot:  (cnt, last) => rank((a, b) => cnt[b] - cnt[a] || a - b),
    cold: (cnt, last) => rank((a, b) => last[a] - last[b] || a - b),
    recent: (cnt, last) => rank((a, b) => last[b] - last[a] || a - b),
  };
  function rank(cmp) { return [...Array(100).keys()].sort(cmp).slice(0, K); }
  const out = {};
  for (const name in strategies) {
    const cnt = Array(100).fill(0), last = Array(100).fill(-1);
    let hits = 0, trials = 0;
    DRAWS.forEach((d, i) => {
      const n = +d[key];
      if (i >= warm) { trials++; if (strategies[name](cnt, last).includes(n)) hits++; }
      cnt[n]++; last[n] = i;
    });
    const p = K / 100, sd = Math.sqrt(trials * p * (1 - p));
    out[name] = { hits, trials, expected: trials * p, lo: Math.round(trials * p - 2 * sd), hi: Math.round(trials * p + 2 * sd) };
  }
  return out;
}
// สรุปของเลขที่ผู้ใช้กรอก
export function checkNumber(str) {
  const res = [];
  const add = (label, hitsIdx, expected, nextOdds) => {
    const count = hitsIdx.length, lastI = count ? hitsIdx[count - 1] : -1;
    const sd = Math.sqrt(expected);
    res.push({ label, count, expected, z: (count - expected) / sd, nextOdds,
      last: lastI >= 0 ? DRAWS[lastI].date : null, gap: lastI >= 0 ? N - 1 - lastI : null });
  };
  const idx = fn => DRAWS.map((d, i) => fn(d) ? i : -1).filter(i => i >= 0);
  if (str.length === 2) {
    add('เลขท้าย 2 ตัว', idx(d => d.two === str), N / 100, 100);
    add('2 ตัวบน', idx(d => d.top2 === str), N / 100, 100);
  } else if (str.length === 3) {
    add('เลขท้าย 3 ตัว', idx(d => d.last3.includes(str)), DRAWS.reduce((s, d) => s + d.last3.length, 0) / 1000, 500);
    add('เลขหน้า 3 ตัว', idx(d => d.front3.includes(str)), DRAWS.reduce((s, d) => s + d.front3.length, 0) / 1000, 500);
    add('3 ตัวบน', idx(d => d.top3 === str), N / 1000, 1000);
  }
  return res;
}
