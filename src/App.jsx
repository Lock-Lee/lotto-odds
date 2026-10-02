import { useState, useMemo, useEffect } from 'react';
import { DRAWS, N, pad, freq2, repeatTest, backtest, checkNumber, addDraws } from './logic.js';
import { loadUpdates } from './update.js';

const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const thDate = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y + 543}`; };
const fmt = n => Math.round(n).toLocaleString('th-TH');
const KEYNAME = { two: 'เลขท้าย 2 ตัว', top2: '2 ตัวบน' };

function CheckTab() {
  const [v, setV] = useState('');
  const [focused, setFocused] = useState(false);
  const res = useMemo(() => (v.length >= 2 ? checkNumber(v) : null), [v]);
  let verdict = null;
  if (res) {
    if (v.length === 2) {
      verdict = res.some(r => Math.abs(r.z) >= 2)
        ? 'จำนวนครั้งต่างจากค่าเฉลี่ยค่อนข้างมาก แต่ในบรรดา 100 เลข จะมีราว 5 เลขที่เป็นแบบนี้โดยบังเอิญอยู่แล้ว จึงไม่ได้ทำให้โอกาสงวดถัดไปเปลี่ยน'
        : 'จำนวนครั้งที่ออกอยู่ในช่วงปกติของการสุ่ม การออกบ่อยหรือไม่ออกนานไม่ได้ทำให้โอกาสงวดถัดไปเปลี่ยน';
    } else verdict = 'เลข 3 ตัวมี 1,000 แบบ ส่วนใหญ่จึงออกแค่ 0–3 ครั้งในช่วงนี้ ประวัติไม่ได้ทำให้โอกาสงวดถัดไปเปลี่ยน';
  }
  return (
    <div className="ticket">
      <div className="ticket-top">
        <label htmlFor="numInput">กรอกเลข 2 หรือ 3 ตัวที่อยากเช็ก</label>
        <div className="cells">
          {[0, 1, 2].map(i => (
            <div key={i} className={'cell' + (v[i] == null ? ' empty' : '') + (focused && i === Math.min(v.length, 2) ? ' cursor' : '')}>{v[i] ?? '–'}</div>
          ))}
          <input id="numInput" inputMode="numeric" pattern="[0-9]*" maxLength={3} autoComplete="off" value={v}
            onChange={e => setV(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} aria-describedby="hint" />
        </div>
        <p className="hint" id="hint">แตะที่ช่องแล้วพิมพ์ตัวเลข</p>
      </div>
      <div className="perf" />
      <div className="ticket-bottom" aria-live="polite">
        {!res && <p className="lead">{v.length ? 'พิมพ์อีกอย่างน้อย 1 ตัว' : 'ผลจะแสดงโอกาสถูกในงวดถัดไป และประวัติของเลขนี้ตั้งแต่ปี 2550'}</p>}
        {res && <>
          <div className="odds">
            <span>โอกาสที่ {v} ออกเป็น{res[0].label}งวดถัดไป</span>
            <b>1 ใน {res[0].nextOdds}</b>
            <span className="stamp">เท่ากับทุกเลข</span>
          </div>
          <div className="rows">
            {res.map(r => (
              <div className="row" key={r.label}>
                <h3>{r.label}<span>ออก {r.count} ครั้ง</span></h3>
                <p>ถ้าสุ่มล้วน ๆ ควรออกราว {r.expected.toFixed(1)} ครั้ง {r.last
                  ? `ออกล่าสุดงวด ${thDate(r.last)}` + (r.gap ? ` ผ่านมาแล้ว ${r.gap} งวด` : ' ซึ่งเป็นงวดล่าสุด')
                  : 'ยังไม่เคยออกตั้งแต่ปี 2550'}</p>
              </div>
            ))}
          </div>
          <p className="verdict">{verdict}</p>
        </>}
      </div>
    </div>
  );
}

function OddsTab() {
  const [raw, setRaw] = useState('1');
  const n = Math.max(0, Math.min(100000, Math.floor(+raw || 0)));
  return <>
    <h2>โอกาสถูกต่อสลาก 1 ใบ</h2>
    <p className="lead">คำนวณจากกติกาการออกรางวัล เท่ากันทุกงวดและทุกเลข</p>
    <div className="tablewrap"><table>
      <thead><tr><th>รางวัล</th><th>โอกาส</th><th>เงินรางวัล</th></tr></thead>
      <tbody>
        <tr><td>รางวัลที่ 1</td><td className="num">1 ใน 1,000,000</td><td className="num">6,000,000</td></tr>
        <tr><td>เลขหน้า 3 ตัว</td><td className="num">1 ใน 500</td><td className="num">4,000</td></tr>
        <tr><td>เลขท้าย 3 ตัว</td><td className="num">1 ใน 500</td><td className="num">4,000</td></tr>
        <tr><td>เลขท้าย 2 ตัว</td><td className="num">1 ใน 100</td><td className="num">2,000</td></tr>
      </tbody>
    </table></div>
    <h2>ซื้อแล้วคาดว่าได้คืนเท่าไร</h2>
    <div className="calc">
      <label htmlFor="tickets">จำนวนสลากที่ซื้อ (ใบ)
        <input id="tickets" type="number" inputMode="numeric" min="1" max="100000" value={raw} onChange={e => setRaw(e.target.value)} />
      </label>
      <dl>
        <dt>จ่ายไป</dt><dd>{fmt(n * 80)} บาท</dd>
        <dt>ได้คืนโดยเฉลี่ย</dt><dd>{fmt(n * 48)} บาท</dd>
        <dt>ส่วนที่หายไปโดยเฉลี่ย</dt><dd className="loss">{fmt(n * 32)} บาท</dd>
      </dl>
    </div>
    <p className="note">สลากใบละ 80 บาท มีมูลค่าคาดหวังรวมทุกรางวัลประมาณ 48 บาท หรือ 60% ของราคา ตัวเลขนี้เป็นค่าเฉลี่ยระยะยาว แต่ละงวดส่วนใหญ่จะไม่ถูกรางวัลเลย</p>
  </>;
}

function StatsTab() {
  const [key, setKey] = useState('two');
  const [sel, setSel] = useState(null);
  const s = useMemo(() => ({ f: freq2(key), bt: backtest(key), rp: repeatTest(key) }), [key]);
  const { f, bt, rp } = s, max = Math.max(...f.counts);
  const names = { hot: '10 เลขที่ออกบ่อยสุด', cold: '10 เลขที่ไม่ออกนานสุด', recent: '10 เลขที่เพิ่งออกล่าสุด' };
  const allIn = Object.values(bt).every(r => r.hits >= r.lo && r.hits <= r.hi);
  return <>
    <h2>เลขไหนออกกี่ครั้ง</h2>
    <p className="lead">{N} งวด ตั้งแต่ {thDate(DRAWS[0].date)} ถึง {thDate(DRAWS[N - 1].date)} ถ้าสุ่มล้วน ๆ แต่ละเลขควรออกราว {f.exp.toFixed(1)} ครั้ง</p>
    <div className="seg" role="group" aria-label="เลือกรางวัล">
      {Object.keys(KEYNAME).map(k => (
        <button key={k} type="button" aria-pressed={key === k} onClick={() => { setKey(k); setSel(null); }}>{KEYNAME[k]}</button>
      ))}
    </div>
    <div className="heat">
      {f.counts.map((c, n) => {
        const t = c / max;
        return <button key={n} type="button" className={(t > 0.5 ? 'dark' : '') + (sel === n ? ' on' : '')}
          style={{ background: `color-mix(in srgb, var(--ink) ${Math.round(6 + 86 * t)}%, transparent)` }}
          aria-label={`เลข ${pad(n, 2)} ออก ${c} ครั้ง`} onClick={() => setSel(n)}>{pad(n, 2)}</button>;
      })}
    </div>
    <p className="lead cellinfo" aria-live="polite">{sel == null ? 'แตะเลขเพื่อดูจำนวนครั้งที่ออก ช่องที่สีเด่นกว่าคือออกบ่อย'
      : `${pad(sel, 2)} ออกเป็น${KEYNAME[key]} ${f.counts[sel]} ครั้ง` + (f.lastIdx[sel] >= 0 ? ` ล่าสุดงวด ${thDate(DRAWS[f.lastIdx[sel]].date)}` : '')}</p>
    <div className="note">{f.p >= 0.05
      ? `ความถี่ของทั้ง 100 เลขไม่ต่างจากการสุ่มอย่างมีนัยสำคัญ (ไคสแควร์ ${f.chi.toFixed(1)}, p = ${f.p.toFixed(2)}) ความต่างของสีในตารางเป็นความแกว่งปกติ ซึ่งอยู่ที่ราว ±${f.sd.toFixed(0)} ครั้ง`
      : `ความถี่ต่างจากการสุ่มมากกว่าที่คาด (ไคสแควร์ ${f.chi.toFixed(1)}, p = ${f.p.toFixed(3)}) ควรตรวจข้อมูลซ้ำก่อนสรุป เพราะเมื่อทดสอบหลายครั้งก็อาจเจอผลแบบนี้โดยบังเอิญได้`}</div>
    <h2>ลองใช้สูตรย้อนหลัง</h2>
    <p className="lead">ทุกงวดเลือก 10 เลขตามสูตร โดยใช้ข้อมูลก่อนงวดนั้นเท่านั้น แล้วนับว่าถูกกี่งวด</p>
    <div className="tablewrap"><table>
      <thead><tr><th>สูตร</th><th>ถูก (งวด)</th><th>ถ้าเดาสุ่ม</th></tr></thead>
      <tbody>{Object.keys(bt).map(k => (
        <tr key={k}><td>{names[k]}</td><td className="num">{bt[k].hits} จาก {bt[k].trials}</td><td className="num">{bt[k].lo}–{bt[k].hi}</td></tr>
      ))}</tbody>
    </table></div>
    <div className="note">{allIn ? 'ทุกสูตรถูกอยู่ในช่วงเดียวกับการเดาสุ่ม 10 เลข จึงไม่มีสูตรไหนได้เปรียบ' : 'มีสูตรที่ผลอยู่นอกช่วงของการเดาสุ่ม ซึ่งเกิดขึ้นได้โดยบังเอิญราว 1 ใน 20 ครั้งที่ทดสอบ'}
      {` ส่วนเลขที่ออกซ้ำกับงวดก่อนหน้าทันทีเกิดขึ้น ${rp.hits} ครั้งจาก ${rp.trials} งวด (ถ้าสุ่มควรราว ${rp.expected.toFixed(1)} ครั้ง)`}</div>
  </>;
}

function HistoryTab() {
  const [shown, setShown] = useState(30);
  const [year, setYear] = useState('all');
  const years = useMemo(() => [...new Set(DRAWS.map(d => +d.date.slice(0, 4) + 543))].reverse(), []);
  const list = useMemo(() => DRAWS.filter(d => year === 'all' || +d.date.slice(0, 4) + 543 === +year).reverse(), [year]);
  return <>
    <div className="histhead">
      <h2>ผลรางวัลย้อนหลัง</h2>
      <label>ปี <select value={year} onChange={e => { setYear(e.target.value); setShown(30); }}>
        <option value="all">ทุกปี</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
      </select></label>
    </div>
    {list.slice(0, shown).map(d => (
      <div className="draw" key={d.date}>
        <div className="d">งวด {thDate(d.date)}</div><div className="f">{d.first}</div><div className="d">รางวัลที่ 1</div>
        <div className="o">
          {d.front3.length > 0 && <>หน้า 3 ตัว <b>{d.front3.join(' ')}</b>{'  '}</>}
          ท้าย 3 ตัว <b>{d.last3.join(' ')}</b>{'  '}ท้าย 2 ตัว <b>{d.two}</b>
        </div>
      </div>
    ))}
    {shown < list.length && <button className="btn ghost" type="button" onClick={() => setShown(shown + 30)}>ดูเพิ่มอีก 30 งวด</button>}
  </>;
}


const rnd = max => { const a = new Uint32Array(1), lim = Math.floor(4294967296 / max) * max; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % max; };
const PICK_KINDS = [['2', '2 ตัว', 100, 2, '1 ใน 100'], ['3', '3 ตัว', 1000, 3, '1 ใน 500'], ['6', '6 หลัก', 1000000, 6, '1 ใน 1,000,000']];
function PickTab() {
  const [kind, setKind] = useState('2');
  const [num, setNum] = useState(null);
  const k = PICK_KINDS.find(x => x[0] === kind);
  const s = useMemo(() => {
    const f = freq2('two'), bt = backtest('two'), all = [...Array(100).keys()];
    return { f, bt,
      hot: all.slice().sort((a, b) => f.counts[b] - f.counts[a] || a - b).slice(0, 5),
      cold: all.slice().sort((a, b) => f.lastIdx[a] - f.lastIdx[b] || a - b).slice(0, 5) };
  }, []);
  const gap = n => s.f.lastIdx[n] < 0 ? 'ยังไม่เคยออก' : `ไม่ออกมา ${N - 1 - s.f.lastIdx[n]} งวด`;
  return <>
    <h2>ควรซื้อเลขไหน</h2>
    <p className="lead">ไม่มีเลขไหนมีโอกาสถูกมากกว่าเลขอื่น ข้อมูล {N} งวดยืนยันเรื่องนี้ หน้านี้จึงช่วยเลือกเลขให้ แต่ไม่ได้เพิ่มโอกาสถูก</p>
    <div className="ticket picker">
      <div className="ticket-top">
        <div className="seg" role="group" aria-label="เลือกประเภทเลข">
          {PICK_KINDS.map(x => <button key={x[0]} type="button" aria-pressed={kind === x[0]} onClick={() => { setKind(x[0]); setNum(null); }}>{x[1]}</button>)}
        </div>
        <div className={'cells small' + (k[3] === 6 ? ' six' : '')} aria-live="polite" aria-label={num ? `เลขที่สุ่มได้ ${num}` : 'ยังไม่ได้สุ่ม'}>
          {[...Array(k[3]).keys()].map(i => <div key={i} className={'cell' + (num ? '' : ' empty')}>{num ? num[i] : '–'}</div>)}
        </div>
        <button className="btn" type="button" onClick={() => setNum(pad(rnd(k[2]), k[3]))}>{num ? 'สุ่มเลขใหม่' : 'สุ่มเลขให้'}</button>
      </div>
      <div className="perf" />
      <div className="ticket-bottom">
        <div className="odds"><span>โอกาสถูกของเลขที่สุ่มได้</span><b>{k[4]}</b><span className="stamp">เท่ากับทุกเลข</span></div>
        <p className="verdict">การสุ่มดีเท่ากับทุกวิธี และช่วยให้ไม่ซื้อเลขดังที่คนแย่งกันซื้อจนราคาแพงกว่าปกติ</p>
      </div>
    </div>
    <h2>ถ้าอยากเลือกตามสถิติ</h2>
    <p className="lead">เลขท้าย 2 ตัวตามสูตรที่คนนิยม พร้อมผลที่ลองใช้ย้อนหลังจริง</p>
    {[['hot', 'ออกบ่อยที่สุด', n => `ออก ${s.f.counts[n]} ครั้ง`], ['cold', 'ไม่ออกนานที่สุด', gap]].map(([id, title, info]) => (
      <div className="pickset" key={id}>
        <h3>{title}</h3>
        <ul>{s[id].map(n => <li key={n}><b>{pad(n, 2)}</b><span>{info(n)}</span></li>)}</ul>
        <p>ลองซื้อ 10 เลขแรกของสูตรนี้ย้อนหลัง ถูก {s.bt[id].hits} จาก {s.bt[id].trials} งวด เดาสุ่มจะถูก {s.bt[id].lo}–{s.bt[id].hi} งวด</p>
      </div>
    ))}
    <p className="note">ซื้อเท่าที่เสียได้โดยไม่เดือดร้อน สลากใบละ 80 บาทได้คืนเฉลี่ยราว 48 บาท ไม่ว่าจะเลือกเลขด้วยวิธีไหน</p>
  </>;
}

const TABS = [['check', 'เช็กเลข', CheckTab], ['pick', 'เลือกเลข', PickTab], ['odds', 'โอกาส', OddsTab], ['stats', 'สถิติ', StatsTab], ['history', 'ย้อนหลัง', HistoryTab]];
const STATUS_TEXT = {
  checking: 'กำลังตรวจหางวดใหม่',
  current: 'ตรวจแล้ว ไม่มีงวดใหม่กว่านี้',
  offline: 'ตรวจหางวดใหม่ไม่สำเร็จ กำลังใช้ข้อมูลที่มีอยู่ในแอป',
};
function App() {
  const [tab, setTab] = useState('check');
  const [version, setVersion] = useState(0);      // เปลี่ยนเมื่อมีงวดใหม่ เพื่อให้ทุกหน้าคำนวณใหม่
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    let alive = true;
    loadUpdates(DRAWS[N - 1].date, lines => { if (alive && addDraws(lines)) setVersion(v => v + 1); })
      .then(s => alive && setStatus(s));
    return () => { alive = false; };
  }, []);
  const Current = TABS.find(t => t[0] === tab)[2];
  return <>
    <header><h1>เช็กโอกาสหวย</h1></header>
    <main><Current key={version} /></main>
    <footer>
      <p>ข้อมูล {N} งวด ถึงงวด {thDate(DRAWS[N - 1].date)}</p>
      <p aria-live="polite">{STATUS_TEXT[status]}</p>
      <p>ข้อมูลรวบรวมจากแหล่งภายนอก ไม่ใช่เอกสารทางการของสำนักงานสลากกินแบ่งรัฐบาล แอปนี้ไม่ได้ทำนายเลข</p>
    </footer>
    <nav aria-label="เมนูหลัก"><div>
      {TABS.map(([id, label]) => (
        <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); window.scrollTo(0, 0); }}>{label}</button>
      ))}
    </div></nav>
  </>;
}

export default App;
