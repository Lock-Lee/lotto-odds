// ส่ง ping ไปที่ตัวนับ (โฟลเดอร์ counter/) เพื่อนับยอดเข้าชมและคนออนไลน์
// ไม่ตั้ง VITE_COUNTER_URL = ปิดตัวนับ ใช้ id สุ่มต่อแท็บใน sessionStorage จึงนับ 1 ครั้งต่อการเปิดแท็บ ไม่ใช่ต่อคน
const BASE = (import.meta.env.VITE_COUNTER_URL || '').replace(/\/$/, '');
const SID_KEY = 'lotto-sid';
const COUNTED_KEY = 'lotto-counted';
const EVERY_MS = 60_000;

export function trackVisitors(onStats) {
  if (!BASE) return () => {};
  const store = (k, v) => { try { return v === undefined ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v); } catch (e) { return null; } };
  let id = store(SID_KEY);
  if (!id) { id = crypto.randomUUID(); store(SID_KEY, id); }
  let visit = !store(COUNTED_KEY);                         // นับแล้วหรือยังดูจากคำตอบของเซิร์ฟเวอร์ ไม่ใช่จากการมี id
  const body = extra => JSON.stringify({ id, ...extra });   // ส่งเป็น text/plain จะได้ไม่มี preflight

  const ping = async () => {
    if (document.visibilityState !== 'visible') return;    // แท็บที่ซ่อนอยู่ไม่นับเป็นออนไลน์
    try {
      const res = await fetch(BASE + '/ping', { method: 'POST', body: body({ visit }) });
      if (!res.ok) return;
      if (visit) { visit = false; store(COUNTED_KEY, '1'); }
      onStats(await res.json());
    } catch (e) { /* ออฟไลน์หรือตัวนับล่ม ไม่ต้องแจ้งผู้ใช้ */ }
  };
  const leave = () => navigator.sendBeacon(BASE + '/leave', body());
  const onVisible = () => (document.visibilityState === 'visible' ? ping() : leave());

  ping();
  const timer = setInterval(ping, EVERY_MS);
  document.addEventListener('visibilitychange', onVisible);
  addEventListener('pagehide', leave);
  return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); removeEventListener('pagehide', leave); };
}
