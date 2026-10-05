// หน้าแยกที่สร้างเป็น HTML ตอน build (scripts/prerender.mjs) ให้แต่ละหน้าตรงกับคำค้นหนึ่งเรื่อง
// หน้าเหล่านี้ไม่มี React ฝั่งเบราว์เซอร์ ใช้แค่ page.js นับคนเข้าเว็บ
import { DRAWS, N, pad, freq2, backtest } from './logic.js';
import { thDate, thDateFull, beYear, fmt, DrawCard } from './shared.jsx';

const span = () => `${N} งวด ตั้งแต่ ${thDate(DRAWS[0].date)} ถึง ${thDate(DRAWS[N - 1].date)}`;
const HOME = ['หน้าแรก', '/'];
const RESULTS = ['ผลหวยย้อนหลัง', '/results/'];
const NUMBERS = ['สถิติเลข 00–99', '/numbers/'];

function Pager({ prev, next }) {
  return (
    <p className="pager">
      {prev ? <a href={prev[1]}>← {prev[0]}</a> : <span />}
      {next ? <a href={next[1]}>{next[0]} →</a> : <span />}
    </p>
  );
}

function oddsPage() {
  return {
    path: '/odds/',
    title: 'โอกาสถูกหวยรัฐบาลเท่าไร รางวัลที่ 1 เลขท้าย 2 ตัว 3 ตัว | เช็คโอกาสหวย',
    description: 'โอกาสถูกสลากกินแบ่งรัฐบาลต่อ 1 ใบ รางวัลที่ 1 คือ 1 ใน 1,000,000 เลขท้าย 2 ตัว 1 ใน 100 เลขหน้าและท้าย 3 ตัว 1 ใน 500 ซื้อใบละ 80 บาท ได้คืนเฉลี่ยราว 48 บาท',
    crumbs: [HOME, ['โอกาสถูกหวย', '/odds/']],
    body: <>
      <h1>โอกาสถูกหวยรัฐบาล 1 ใบ</h1>
      <p className="lead">คำนวณจากกติกาการออกรางวัล โอกาสเท่ากันทุกเลขและทุกงวด ไม่ว่าจะเลือกเลขด้วยวิธีไหน</p>
      <div className="tablewrap"><table>
        <thead><tr><th>รางวัล</th><th>โอกาส</th><th>เงินรางวัล (บาท)</th></tr></thead>
        <tbody>
          <tr><td>รางวัลที่ 1</td><td className="num">1 ใน 1,000,000</td><td className="num">6,000,000</td></tr>
          <tr><td>เลขหน้า 3 ตัว</td><td className="num">1 ใน 500</td><td className="num">4,000</td></tr>
          <tr><td>เลขท้าย 3 ตัว</td><td className="num">1 ใน 500</td><td className="num">4,000</td></tr>
          <tr><td>เลขท้าย 2 ตัว</td><td className="num">1 ใน 100</td><td className="num">2,000</td></tr>
        </tbody>
      </table></div>
      <h2>ทำไมเลขท้าย 3 ตัวถึงเป็น 1 ใน 500</h2>
      <p>เลข 3 ตัวมีทั้งหมด 1,000 แบบ แต่เลขหน้า 3 ตัวและเลขท้าย 3 ตัวออกอย่างละ 2 ชุดต่องวด โอกาสที่สลาก 1 ใบจะตรงกับชุดใดชุดหนึ่งจึงเป็น 2 ใน 1,000 หรือ 1 ใน 500</p>
      <h2>ซื้อใบละ 80 บาท ได้คืนเฉลี่ยเท่าไร</h2>
      <p>เมื่อรวมทุกรางวัล สลาก 1 ใบมีมูลค่าคาดหวังประมาณ 48 บาท หรือราว 60% ของราคา ส่วนที่หายไปเฉลี่ยประมาณ 32 บาทต่อใบ ตัวเลขนี้เป็นค่าเฉลี่ยระยะยาว ในแต่ละงวดคนส่วนใหญ่จะไม่ถูกรางวัลเลย</p>
      <div className="tablewrap"><table>
        <thead><tr><th>ซื้อ (ใบ)</th><th>จ่ายไป</th><th>ได้คืนเฉลี่ย</th><th>หายไปเฉลี่ย</th></tr></thead>
        <tbody>{[1, 10, 100].map(n => (
          <tr key={n}><td className="num">{fmt(n)}</td><td className="num">{fmt(n * 80)}</td><td className="num">{fmt(n * 48)}</td><td className="num">{fmt(n * 32)}</td></tr>
        ))}</tbody>
      </table></div>
      <h2>เลขที่ไม่ออกนานจะมีโอกาสมากขึ้นไหม</h2>
      <p>ไม่ การออกรางวัลแต่ละงวดเป็นอิสระต่อกัน ดูหลักฐานจากข้อมูลจริงได้ที่ <a href="/numbers/">สถิติเลขท้าย 2 ตัว 00–99</a></p>
    </>,
  };
}

function resultsPage(years) {
  return {
    path: '/results/',
    title: `ผลหวยย้อนหลังทุกงวด ตั้งแต่ปี 2550 ถึง ${beYear(DRAWS[N - 1].date)} | เช็คโอกาสหวย`,
    description: `ผลสลากกินแบ่งรัฐบาลย้อนหลัง ${N} งวด รางวัลที่ 1 เลขหน้า 3 ตัว เลขท้าย 3 ตัว และเลขท้าย 2 ตัว งวดล่าสุด ${thDateFull(DRAWS[N - 1].date)} ${DRAWS[N - 1].first}`,
    crumbs: [HOME, RESULTS],
    body: <>
      <h1>ผลหวยย้อนหลังทุกงวด</h1>
      <p className="lead">ผลสลากกินแบ่งรัฐบาล {span()}</p>
      <h2>เลือกปี</h2>
      <ul className="chips">{years.map(y => <li key={y}><a href={`/results/${y}/`}>{y}</a></li>)}</ul>
      <h2>24 งวดล่าสุด</h2>
      {DRAWS.slice(-24).reverse().map(d => <DrawCard key={d.date} d={d} />)}
    </>,
  };
}

function yearPage(y, years) {
  const list = DRAWS.filter(d => beYear(d.date) === y).reverse();
  const i = years.indexOf(y);
  const link = yy => yy && [`ผลหวยปี ${yy}`, `/results/${yy}/`];
  return {
    path: `/results/${y}/`,
    title: `ผลหวยปี ${y} ทุกงวด (${list.length} งวด) | เช็คโอกาสหวย`,
    description: `ผลสลากกินแบ่งรัฐบาลปี ${y} ครบ ${list.length} งวด รางวัลที่ 1 เลขหน้า 3 ตัว เลขท้าย 3 ตัว และเลขท้าย 2 ตัว ตั้งแต่งวด ${thDateFull(list[list.length - 1].date)} ถึง ${thDateFull(list[0].date)}`,
    crumbs: [HOME, RESULTS, [`ปี ${y}`, `/results/${y}/`]],
    body: <>
      <h1>ผลหวยปี {y} ทุกงวด</h1>
      <p className="lead">สลากกินแบ่งรัฐบาล {list.length} งวด เรียงจากงวดล่าสุด</p>
      {list.map(d => <DrawCard key={d.date} d={d} />)}
      <Pager prev={link(years[i + 1])} next={link(years[i - 1])} />
    </>,
  };
}

function numbersPage(f, top2) {
  const order = [...Array(100).keys()];
  const hot = order.slice().sort((a, b) => f.counts[b] - f.counts[a] || a - b).slice(0, 10);
  const cold = order.slice().sort((a, b) => f.lastIdx[a] - f.lastIdx[b] || a - b).slice(0, 10);
  const bt = backtest('two');
  return {
    path: '/numbers/',
    title: 'เลขท้าย 2 ตัวออกบ่อย สถิติเลข 00–99 ออกกี่ครั้ง | เช็คโอกาสหวย',
    description: `สถิติเลขท้าย 2 ตัวและ 2 ตัวบน ทุกเลข 00–99 ออกกี่ครั้งใน ${N} งวด เลขที่ออกบ่อยที่สุด เลขที่ไม่ออกนานที่สุด และผลทดสอบว่าสูตรเลขออกบ่อยช่วยได้จริงไหม`,
    crumbs: [HOME, NUMBERS],
    body: <>
      <h1>เลขท้าย 2 ตัว 00–99 ออกกี่ครั้ง</h1>
      <p className="lead">{span()} ถ้าสุ่มล้วน ๆ แต่ละเลขควรออกราว {f.exp.toFixed(1)} ครั้ง แตะเลขเพื่อดูรายละเอียด</p>
      <ul className="numgrid">{order.map(n => (
        <li key={n}><a href={`/number/${pad(n, 2)}/`}><b>{pad(n, 2)}</b><span>{f.counts[n]} ครั้ง</span></a></li>
      ))}</ul>
      <h2>10 เลขท้าย 2 ตัวที่ออกบ่อยที่สุด</h2>
      <p>{hot.map(n => <a key={n} className="pill" href={`/number/${pad(n, 2)}/`}>{pad(n, 2)} ({f.counts[n]})</a>)}</p>
      <h2>10 เลขที่ไม่ออกนานที่สุด</h2>
      <p>{cold.map(n => <a key={n} className="pill" href={`/number/${pad(n, 2)}/`}>{pad(n, 2)}</a>)}</p>
      <h2>ซื้อตามเลขออกบ่อยช่วยได้ไหม</h2>
      <p>ถ้าทุกงวดซื้อ 10 เลขที่ออกบ่อยที่สุดจนถึงงวดก่อนหน้า จะถูก {bt.hot.hits} จาก {bt.hot.trials} งวด ซื้อ 10 เลขที่ไม่ออกนานที่สุดจะถูก {bt.cold.hits} งวด ส่วนการเดาสุ่ม 10 เลขจะถูกราว {bt.hot.lo}–{bt.hot.hi} งวด {[bt.hot, bt.cold].every(r => r.hits >= r.lo && r.hits <= r.hi) ? 'ทั้งสองสูตรจึงไม่ได้ดีกว่าการเดาสุ่ม' : 'ผลที่ต่างจากการเดาสุ่มเกิดขึ้นได้โดยบังเอิญราว 1 ใน 20 ครั้งที่ทดสอบ'}</p>
      <div className="note">{f.p >= 0.05
        ? `ความถี่ของทั้ง 100 เลขไม่ต่างจากการสุ่มอย่างมีนัยสำคัญ (ไคสแควร์ ${f.chi.toFixed(1)}, p = ${f.p.toFixed(2)}) เลขที่ดูเหมือนออกบ่อยเป็นความแกว่งปกติของการสุ่ม`
        : `ความถี่ต่างจากการสุ่มมากกว่าที่คาด (ไคสแควร์ ${f.chi.toFixed(1)}, p = ${f.p.toFixed(3)}) แต่เมื่อทดสอบหลายครั้งก็อาจเจอผลแบบนี้โดยบังเอิญได้`}</div>
      <h2>2 ตัวบนออกกี่ครั้ง</h2>
      <p>2 ตัวบนคือ 2 หลักสุดท้ายของรางวัลที่ 1 เลขที่ออกบ่อยที่สุดคือ {order.slice().sort((a, b) => top2.counts[b] - top2.counts[a] || a - b).slice(0, 5).map(n => `${pad(n, 2)} (${top2.counts[n]} ครั้ง)`).join(' ')}</p>
    </>,
  };
}

function numberPage(n, f, top2) {
  const nn = pad(n, 2);
  const hits = DRAWS.filter(d => d.two === nn).reverse();
  const rank = f.counts.filter(c => c > f.counts[n]).length + 1;
  const row = (label, fr) => {
    const li = fr.lastIdx[n];
    return <tr><td>{label}</td><td className="num">{fr.counts[n]}</td>
      <td className="num">{li >= 0 ? <>{thDate(DRAWS[li].date)}<span className="sub">{N - 1 - li ? `${N - 1 - li} งวดก่อน` : 'งวดล่าสุด'}</span></> : 'ยังไม่เคยออก'}</td></tr>;
  };
  const link = m => [`เลข ${pad(m, 2)}`, `/number/${pad(m, 2)}/`];
  return {
    path: `/number/${nn}/`,
    title: `เลข ${nn} ออกกี่ครั้ง สถิติหวยเลขท้าย 2 ตัว ${nn} | เช็คโอกาสหวย`,
    description: `เลข ${nn} ออกเป็นเลขท้าย 2 ตัว ${f.counts[n]} ครั้ง และ 2 ตัวบน ${top2.counts[n]} ครั้ง ใน ${N} งวดตั้งแต่ปี 2550${hits.length ? ` ออกล่าสุดงวด ${thDateFull(hits[0].date)}` : ''} พร้อมรายชื่องวดที่ออกทั้งหมด`,
    crumbs: [HOME, NUMBERS, [`เลข ${nn}`, `/number/${nn}/`]],
    body: <>
      <h1>เลข {nn} ออกกี่ครั้ง</h1>
      <p className="lead">สถิติเลข {nn} ในสลากกินแบ่งรัฐบาล {span()} ถ้าสุ่มล้วน ๆ แต่ละเลขควรออกราว {f.exp.toFixed(1)} ครั้ง</p>
      <div className="tablewrap"><table>
        <thead><tr><th>ประเภท</th><th>ออก (ครั้ง)</th><th>ออกล่าสุด</th></tr></thead>
        <tbody>{row('เลขท้าย 2 ตัว', f)}{row('2 ตัวบน', top2)}</tbody>
      </table></div>
      <div className="note">เลข {nn} ออกเป็นเลขท้าย 2 ตัวบ่อยเป็นอันดับ {rank} จาก 100 เลข แต่โอกาสที่จะออกงวดหน้ายังเป็น 1 ใน 100 เท่ากับทุกเลข การออกบ่อยหรือไม่ออกนานไม่ได้ทำให้โอกาสเปลี่ยน</div>
      <h2>งวดที่เลขท้าย 2 ตัวออก {nn}</h2>
      {hits.length
        ? <div className="tablewrap"><table>
            <thead><tr><th>งวด</th><th>รางวัลที่ 1</th></tr></thead>
            <tbody>{hits.map(d => <tr key={d.date}><td><a href={`/results/${beYear(d.date)}/`}>{thDateFull(d.date)}</a></td><td className="num">{d.first}</td></tr>)}</tbody>
          </table></div>
        : <p>ยังไม่เคยออกเป็นเลขท้าย 2 ตัวตั้งแต่ปี 2550</p>}
      <Pager prev={n > 0 && link(n - 1)} next={n < 99 && link(n + 1)} />
      <p><a href="/numbers/">ดูสถิติทุกเลข 00–99</a></p>
    </>,
  };
}

export function buildPages() {
  const years = [...new Set(DRAWS.map(d => beYear(d.date)))].reverse();
  const f = freq2('two'), top2 = freq2('top2');
  return [
    oddsPage(),
    resultsPage(years),
    ...years.map(y => yearPage(y, years)),
    numbersPage(f, top2),
    ...[...Array(100).keys()].map(n => numberPage(n, f, top2)),
  ];
}
