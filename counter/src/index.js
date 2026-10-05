// ตัวนับคนเข้าเว็บและคนออนไลน์ของ lotto-odds
// ไม่เก็บ IP หรือข้อมูลที่ระบุตัวคนได้ เก็บแค่ยอดรวมกับยอดรายวัน
// ส่วนคนออนไลน์ใช้ id สุ่มของแท็บ ซึ่งอยู่ในหน่วยความจำไม่เกิน ONLINE_MS แล้วถูกลบ
import { DurableObject } from 'cloudflare:workers';

const ONLINE_MS = 150_000;              // หน้าเว็บส่ง ping ทุก 60 วินาที เผื่อพลาดได้ 1 ครั้ง
const ID_RE = /^[\w-]{8,40}$/;
const bangkokDay = t => new Date(t + 7 * 3600_000).toISOString().slice(0, 10);

export class Counter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.seen = new Map();              // id แท็บ -> เวลาที่ ping ล่าสุด
  }
  online(now) {
    for (const [id, t] of this.seen) if (now - t > ONLINE_MS) this.seen.delete(id);
    return this.seen.size;
  }
  async ping(id, visit) {
    const now = Date.now();
    this.seen.set(id, now);
    const key = 'day:' + bangkokDay(now);
    let total = (await this.ctx.storage.get('total')) ?? 0;
    let today = (await this.ctx.storage.get(key)) ?? 0;
    if (visit) {
      total++; today++;
      await this.ctx.storage.put({ total, [key]: today });
    }
    return { total, today, online: this.online(now) };
  }
  leave(id) { this.seen.delete(id); }
  async stats() {
    const days = await this.ctx.storage.list({ prefix: 'day:', reverse: true, limit: 90 });
    return {
      total: (await this.ctx.storage.get('total')) ?? 0,
      online: this.online(Date.now()),
      days: Object.fromEntries([...days].map(([k, v]) => [k.slice(4), v])),
    };
  }
}

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Cache-Control': 'no-store',
    };
    const json = (body, status = 200) => Response.json(body, { status, headers: cors });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    const counter = env.COUNTER.get(env.COUNTER.idFromName('main'));
    const { pathname } = new URL(req.url);

    if (req.method === 'GET' && pathname === '/stats') return json(await counter.stats());
    if (req.method === 'POST' && (pathname === '/ping' || pathname === '/leave')) {
      // หน้าเว็บส่งเป็น text/plain เพื่อไม่ให้เบราว์เซอร์ต้องส่ง preflight
      let body;
      try { body = JSON.parse(await req.text()); } catch { return json({ error: 'bad json' }, 400); }
      if (typeof body?.id !== 'string' || !ID_RE.test(body.id)) return json({ error: 'bad id' }, 400);
      if (pathname === '/leave') { await counter.leave(body.id); return new Response(null, { status: 204, headers: cors }); }
      return json(await counter.ping(body.id, body.visit === true));
    }
    return json({ error: 'not found' }, 404);
  },
};
