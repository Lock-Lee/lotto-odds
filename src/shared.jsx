// ส่วนที่ใช้ร่วมกันระหว่างแอปหน้าแรก (App.jsx) และหน้าแยกที่สร้างตอน build (pages.jsx)
const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MONTHS_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
export const thDate = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y + 543}`; };
export const thDateFull = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS_FULL[m - 1]} ${y + 543}`; };
export const beYear = iso => +iso.slice(0, 4) + 543;
export const fmt = n => Math.round(n).toLocaleString('th-TH');

export function DrawCard({ d }) {
  return (
    <div className="draw">
      <div className="d">งวด {thDate(d.date)}</div><div className="f">{d.first}</div><div className="d">รางวัลที่ 1</div>
      <div className="o">
        {d.front3.length > 0 && <>หน้า 3 ตัว <b>{d.front3.join(' ')}</b>{'  '}</>}
        ท้าย 3 ตัว <b>{d.last3.join(' ')}</b>{'  '}ท้าย 2 ตัว <b>{d.two}</b>
      </div>
    </div>
  );
}

// แถบยอดคนเข้าเว็บ แสดง – ไว้ก่อนได้ข้อมูล (และตอน prerender) เพื่อไม่ให้หน้ากระตุก
// data-k ให้ page.js เติมตัวเลขในหน้าแยกที่ไม่ได้ใช้ React
export function Visitors({ v }) {
  const show = n => (v && n != null ? fmt(n) : '–');
  return (
    <dl className="visitors" aria-live="polite">
      <div><dt><span className="dot" aria-hidden="true" />ออนไลน์ตอนนี้</dt><dd data-k="online">{show(v?.online)}</dd></div>
      <div><dt>เข้าชมวันนี้</dt><dd data-k="today">{show(v?.today)}</dd></div>
      <div><dt>เข้าชมทั้งหมด</dt><dd data-k="total">{show(v?.total)}</dd></div>
    </dl>
  );
}
