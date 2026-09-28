import { createClient } from 'npm:@supabase/supabase-js@2.117.1';

const url = Deno.env.get('SUPABASE_URL')!;
const secret = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
if (!url || !secret) throw new Error('Supabase server configuration missing');
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const allowedOrigins = new Set([
  'https://restartbykeita-sudo.github.io',
  ...(Deno.env.get('RRIH_ALLOWED_ORIGIN') || '').split(',').map(x => x.trim()).filter(Boolean),
]);

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const fail = (status: number, message: string): never => { throw new ApiError(status, message); };
const normalizeId = (value: unknown) => String(value || '').normalize('NFKC').toUpperCase()
  .replace(/[\s\p{Pd}\u2212\uFE63\uFF0D]/gu, '');
const text = (value: unknown) => String(value || '').trim();
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest(
  'SHA-256', new TextEncoder().encode(value)))).map(x => x.toString(16).padStart(2, '0')).join('');
const json = (body: unknown, status = 200, origin = '') => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': origin, 'vary': 'Origin', 'cache-control': 'no-store' },
});
const cors = (origin: string) => ({ 'access-control-allow-origin': origin,
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
  'access-control-allow-methods': 'GET, POST, OPTIONS', 'vary': 'Origin' });

async function limit(req: Request, action: string, maximum = 10) {
  const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const { data, error } = await db.rpc('rrih_limit_request', {
    p_action: action, p_key: await hash(ip), p_limit: maximum,
  });
  if (error) fail(503, 'ไม่สามารถตรวจสอบคำขอได้ กรุณาลองใหม่');
  if (!data) fail(429, 'มีการลองหลายครั้ง กรุณารอสักครู่');
}

async function settings() {
  const { data, error } = await db.from('rrih_settings').select('*').eq('id', 1).single();
  if (error || !data) fail(503, 'ยังไม่พร้อมรับสมัคร');
  return data;
}
async function publicConfig() {
  const [s, packages, sizes] = await Promise.all([
    settings(), db.from('rrih_packages').select('*').eq('active', true).order('sort_order'),
    db.from('rrih_shirt_sizes').select('code,label,chest_in,length_in').eq('active', true).order('sort_order'),
  ]);
  if (packages.error || sizes.error) fail(503, 'โหลดข้อมูลสมัครไม่สำเร็จ');
  return { event: s.event_name, registration_opens_at: s.registration_opens_at,
    registration_closes_at: s.registration_closes_at,
    installment_2_due_at: s.installment_2_due_at,
    installment_3_due_at: s.installment_3_due_at,
    deposit_thb: s.deposit_thb, second_thb: s.second_thb,
    bank_name: s.bank_name, account_name: s.account_name, account_number: s.account_number,
    promptpay_name: s.promptpay_name, promptpay_number: s.promptpay_number,
    poster_url: s.poster_url, max_slip_mb: s.max_slip_mb,
    packages: packages.data, shirt_sizes: sizes.data };
}

async function administrator(req: Request, write = false) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) fail(401, 'กรุณาเข้าสู่ระบบแอดมิน');
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) throw new ApiError(401, 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  const user = auth.user;
  const { data: profile, error } = await db.from('rrih_admin_users')
    .select('role,active').eq('user_id', user.id).single();
  if (error || !profile) throw new ApiError(403, 'ไม่มีสิทธิ์ดำเนินการ');
  if (!profile.active) throw new ApiError(403, 'บัญชีเจ้าหน้าที่กำลังรอแอดมินอนุมัติ');
  if (write && profile.role !== 'ADMIN') throw new ApiError(403, 'ไม่มีสิทธิ์ดำเนินการ');
  return { id: user.id, role: profile.role };
}
async function exportRows(table: string, fields: string, role?: string) {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = db.from(table).select(fields).order('id').range(offset, offset + 999);
    if (role) query = query.eq('role', role);
    const { data, error } = await query;
    if (error || !data) fail(503, 'เตรียมข้อมูลส่งออกไม่สำเร็จ กรุณาลองใหม่');
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

function validateRegistration(data: Record<string, unknown>, packageRow: Record<string, unknown>) {
  const runners = data.runners as Array<Record<string, unknown>>;
  const followers = data.followers as Array<Record<string, unknown>>;
  const beneficiaries = data.beneficiaries as Array<Record<string, unknown>>;
  if (!Array.isArray(runners) || runners.length !== packageRow.runner_count ||
      !Array.isArray(followers) || followers.length !== packageRow.follower_count ||
      !Array.isArray(beneficiaries) || !data.consent_privacy ||
      !['FULL', 'INSTALLMENT'].includes(String(data.payment_plan))) fail(400, 'ข้อมูลใบสมัครไม่ครบ');
  const ids = runners.map(r => normalizeId(r.id_document));
  if (ids.some(id => id.length < 5 || id.length > 30) || new Set(ids).size !== ids.length)
    fail(400, 'เลขบัตรหรือ Passport ผู้แข่งขันไม่ถูกต้องหรือซ้ำกัน');
  for (const r of runners) {
    if (!text(r.prefix) || !text(r.first_name) || !text(r.last_name) || !text(r.address) || !text(r.phone) ||
        !text(r.emergency_phone) || !text(r.emergency_relation) ||
        !['A', 'B', 'AB', 'O'].includes(String(r.blood_group)) || !text(r.shirt_size))
      fail(400, 'กรุณากรอกข้อมูลผู้แข่งขันให้ครบ');
  }
  for (const f of followers) if (!text(f.first_name) || !text(f.last_name)) fail(400, 'ข้อมูลผู้ติดตามไม่ครบ');
  const beneficiaryIds = new Set<string>();
  for (const b of beneficiaries) {
    const id = normalizeId(b.id_document), no = Number(b.runner_no);
    if (!Number.isInteger(no) || no < 1 || no > runners.length || !text(b.full_name) ||
        !text(b.relationship) || id.length < 5 || ids.includes(id) || beneficiaryIds.has(id) ||
        !(Number(b.percentage) > 0 && Number(b.percentage) <= 100))
      fail(400, 'ข้อมูลผู้รับผลประโยชน์ไม่ถูกต้องหรือเลขซ้ำ');
    beneficiaryIds.add(id);
  }
  for (let i = 1; i <= runners.length; i++) {
    const total = beneficiaries.filter(b => Number(b.runner_no) === i)
      .reduce((sum, b) => sum + Math.round(Number(b.percentage) * 100), 0);
    if (total !== 10000) fail(400, `ผู้แข่งขันคนที่ ${i} ต้องมีผู้รับผลประโยชน์รวม 100%`);
  }
}

function extension(file: File, maxMb: number) {
  const permitted: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf',
  };
  if (!permitted[file.type] || file.size < 100 || file.size > maxMb * 1024 * 1024)
    fail(400, `สลิปต้องเป็น JPG, PNG, WEBP หรือ PDF ขนาดไม่เกิน ${maxMb} MB`);
  return permitted[file.type];
}
async function checkedSlip(form: FormData, maxMb: number) {
  const file = form.get('slip');
  if (!(file instanceof File)) throw new ApiError(400, 'กรุณาแนบสลิป');
  const ext = extension(file, maxMb);
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const bytes = (s: number[]) => s.every((v, i) => head[i] === v);
  const valid = ext === 'jpg' ? bytes([0xff, 0xd8, 0xff]) :
    ext === 'png' ? bytes([0x89, 0x50, 0x4e, 0x47]) :
    ext === 'pdf' ? bytes([0x25, 0x50, 0x44, 0x46]) :
    bytes([0x52, 0x49, 0x46, 0x46]) &&
      head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  if (!valid) fail(400, 'ชนิดไฟล์สลิปไม่ตรงกับเนื้อไฟล์');
  return { file, ext };
}
async function upload(file: File, ext: string) {
  const path = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from('rrih-slips').upload(path, file, {
    contentType: file.type, upsert: false, cacheControl: '0',
  });
  if (error) fail(503, 'อัปโหลดสลิปไม่สำเร็จ');
  return path;
}
async function cleanup(path: string) { await db.storage.from('rrih-slips').remove([path]); }

async function registrationFor(idDocument: unknown) {
  const id = normalizeId(idDocument);
  if (id.length < 5 || id.length > 30) fail(400, 'เลขบัตรหรือ Passport ไม่ถูกต้อง');
  const { data: people, error } = await db.from('rrih_participants')
    .select('registration_id').eq('role', 'RUNNER').eq('id_normalized', id).limit(1);
  if (error) fail(503, 'ค้นหาใบสมัครไม่สำเร็จ');
  if (!people?.length) fail(404, 'ไม่พบใบสมัครของผู้แข่งขัน');
  const { data: registration } = await db.from('rrih_registrations').select('*')
    .eq('id', people[0].registration_id).eq('status', 'ACTIVE').single();
  if (!registration) fail(404, 'ไม่พบใบสมัครของผู้แข่งขัน');
  return registration;
}
const maskedName = (name: unknown) => {
  const characters = [...text(name)];
  return characters.length ? `${characters[0]}${'•'.repeat(Math.min(characters.length - 1, 3))}` : '';
};
async function registrationSummary(reg: Record<string, unknown>) {
  const [people, due] = await Promise.all([
    db.from('rrih_participants').select('role,runner_no,first_name,last_name')
      .eq('registration_id', reg.id).order('runner_no'),
    db.from('rrih_installments').select('id,installment_no,amount_due_thb,due_at,status')
      .eq('registration_id', reg.id).order('installment_no'),
  ]);
  if (people.error || due.error) fail(503, 'อ่านข้อมูลการชำระไม่สำเร็จ');
  const installments = due.data || [];
  const paid = installments.filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount_due_thb, 0);
  const first = installments.find(i => i.status !== 'PAID');
  return { package_name: reg.package_name_snapshot,
    price_thb: reg.package_price_thb, payment_plan: reg.payment_plan,
    runners: (people.data || []).filter(p => p.role === 'RUNNER').map(p => ({
      first_name: maskedName(p.first_name), last_name: maskedName(p.last_name),
    })),
    paid_thb: paid, balance_thb: Number(reg.package_price_thb) - paid,
    installments: installments.map(i => ({ ...i,
      display_status: i.status === 'PENDING' && new Date(i.due_at) < new Date() ? 'OVERDUE' : i.status })),
    next_installment_id: first?.status === 'PENDING' ? first.id : null };
}

Deno.serve(async req => {
  const origin = req.headers.get('origin') || '';
  if (origin && !allowedOrigins.has(origin) && !/^http:\/\/localhost:\d+$/.test(origin))
    return json({ error: 'Origin not allowed' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  const action = new URL(req.url).searchParams.get('action') || '';
  try {
    if (action === 'config' && req.method === 'GET') return json(await publicConfig(), 200, origin);
    if (action === 'admin-register' && req.method === 'POST') {
      await limit(req, action, 3);
      const body = await req.json();
      const email = text(body.email).toLowerCase(), password = String(body.password || '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
          password.length < 10 || password.length > 128)
        fail(400, 'กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 10 ตัวอักษร');
      await limit(req, `${action}:${await hash(email)}`, 2);
      const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !data.user) fail(409, 'ไม่สามารถสมัครด้วยอีเมลนี้ได้ อาจมีบัญชีอยู่แล้ว');
      const { error: profileError } = await db.from('rrih_admin_users').insert({
        user_id: data.user.id, role: 'ADMIN', active: false,
      });
      if (profileError) {
        await db.auth.admin.deleteUser(data.user.id);
        fail(503, 'บันทึกคำขอไม่สำเร็จ กรุณาลองใหม่');
      }
      return json({ pending: true }, 201, origin);
    }
    if (action === 'availability' && req.method === 'POST') {
      await limit(req, action, 15);
      const body = await req.json(), id = normalizeId(body.id_document);
      if (id.length < 5) fail(400, 'เลขบัตรหรือ Passport ไม่ถูกต้อง');
      const { data, error } = await db.from('rrih_participants')
        .select('id').eq('role', 'RUNNER').eq('id_normalized', id).limit(1);
      if (error) fail(503, 'ตรวจเลขเอกสารไม่สำเร็จ');
      return json({ available: !data?.length }, 200, origin);
    }
    if (action === 'register' && req.method === 'POST') {
      await limit(req, action, 6);
      const form = await req.formData();
      const raw = String(form.get('data') || '');
      if (raw.length > 100000) fail(400, 'ข้อมูลเกินขนาด');
      let data: Record<string, unknown>;
      try { data = JSON.parse(raw); } catch { throw new ApiError(400, 'รูปแบบใบสมัครไม่ถูกต้อง'); }
      const { data: pkg } = await db.from('rrih_packages').select('*')
        .eq('code', data.package_code).eq('active', true).single();
      if (!pkg) fail(400, 'แพ็กเกจไม่พร้อมใช้งาน');
      validateRegistration(data, pkg);
      const s = await settings(), { file, ext } = await checkedSlip(form, s.max_slip_mb);
      const expected = data.payment_plan === 'FULL' ? pkg.price_thb :
        Math.floor(pkg.price_thb / 300) * 100;
      if (Number(data.amount_confirmed_thb) !== expected) fail(400, 'ยอดชำระไม่ตรงกับแพ็กเกจ');
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      const code = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const path = await upload(file, ext);
      const { data: result, error } = await db.rpc('rrih_create_registration', {
        p_data: data, p_secret_hash: await hash(code), p_slip_path: path,
      });
      if (error) {
        await cleanup(path);
        const known: Record<string, string> = {
          REGISTRATION_CLOSED: 'ยังไม่เปิดรับสมัครหรือปิดรับสมัครแล้ว',
          INSTALLMENTS_UNAVAILABLE: 'ไม่สามารถเลือกผ่อนในช่วงเวลานี้',
          BENEFICIARY_TOTAL_NOT_100: 'ผู้รับผลประโยชน์ของแต่ละคนต้องรวม 100%',
          INVALID_BENEFICIARY: 'ข้อมูลผู้รับผลประโยชน์ไม่ถูกต้อง',
        };
        const message = error.code === '23505' && error.message.includes('rrih_runner_id_unique') ?
          'เลขบัตรหรือ Passport ผู้แข่งขันนี้สมัครแล้ว' :
          known[error.message] || 'ตรวจสอบใบสมัครไม่ผ่าน กรุณาตรวจข้อมูลอีกครั้ง';
        fail(400, message);
      }
      return json(result, 201, origin);
    }
    if (action === 'lookup' && req.method === 'POST') {
      await limit(req, action, 8);
      const body = await req.json();
      const reg = await registrationFor(body.id_document);
      return json(await registrationSummary(reg), 200, origin);
    }
    if (action === 'submit-payment' && req.method === 'POST') {
      await limit(req, action, 8);
      const form = await req.formData(), s = await settings();
      const reg = await registrationFor(form.get('id_document'));
      const summary = await registrationSummary(reg);
      const installmentId = String(form.get('installment_id') || '');
      if (!summary.next_installment_id || installmentId !== summary.next_installment_id)
        fail(409, 'ยังไม่สามารถชำระงวดนี้ได้');
      const { file, ext } = await checkedSlip(form, s.max_slip_mb);
      const path = await upload(file, ext);
      const { data, error } = await db.rpc('rrih_submit_next', {
        p_registration_id: reg.id, p_installment_id: installmentId, p_slip_path: path,
      });
      if (error) { await cleanup(path); fail(409, 'สถานะงวดเปลี่ยนแล้ว กรุณาค้นหาใหม่'); }
      return json(data, 201, origin);
    }
    if (action === 'admin-overview' && req.method === 'GET') {
      const admin = await administrator(req);
      const [regs, people, dues, attempts, packages, s] = await Promise.all([
        db.from('rrih_registrations').select('id,registration_code,package_name_snapshot,package_price_thb,payment_plan,submitted_at,status').order('submitted_at',{ascending:false}).limit(1000),
        db.from('rrih_participants').select('registration_id,role,runner_no,first_name,last_name,id_document,phone').limit(3000),
        db.from('rrih_installments').select('id,registration_id,installment_no,amount_due_thb,due_at,status').limit(3000),
        db.from('rrih_payment_attempts').select('id,installment_id,amount_claimed_thb,slip_path,status,submitted_at,reviewed_at,admin_note').limit(5000),
        db.from('rrih_packages').select('*').order('sort_order'), settings(),
      ]);
      if ([regs, people, dues, attempts, packages].some(x => x.error)) fail(503, 'โหลดรายการไม่สำเร็จ');
      return json({ role: admin.role, registrations: regs.data, participants: people.data,
        installments: dues.data, attempts: attempts.data, packages: packages.data, settings: s }, 200, origin);
    }
    if (action === 'admin-export' && req.method === 'GET') {
      await administrator(req, true);
      const [registrations, runners, beneficiaries] = await Promise.all([
        exportRows('rrih_registrations', 'id,registration_code,package_code,package_name_snapshot,package_price_thb,payment_plan,language,consent_privacy_at,status,submitted_at'),
        exportRows('rrih_participants', 'id,registration_id,runner_no,prefix,first_name,last_name,id_document,address,phone,emergency_phone,emergency_relation,blood_group,shirt_size', 'RUNNER'),
        exportRows('rrih_beneficiaries', 'id,registration_id,runner_id,full_name,id_document,relationship,percentage'),
      ]);
      return json({ registrations, runners, beneficiaries }, 200, origin);
    }
    if (action === 'admin-accounts' && req.method === 'GET') {
      await administrator(req, true);
      const { data: profiles, error } = await db.from('rrih_admin_users')
        .select('user_id,role,active,created_at').order('created_at', { ascending: false }).limit(200);
      if (error) fail(503, 'โหลดบัญชีเจ้าหน้าที่ไม่สำเร็จ');
      const accounts = await Promise.all((profiles || []).map(async profile => {
        const { data } = await db.auth.admin.getUserById(profile.user_id);
        return { ...profile, email: data.user?.email || 'ไม่พบอีเมล' };
      }));
      return json({ accounts }, 200, origin);
    }
    if (action === 'admin-approve' && req.method === 'POST') {
      await administrator(req, true);
      const body = await req.json();
      if (!/^[0-9a-f-]{36}$/i.test(String(body.user_id || ''))) fail(400, 'บัญชีไม่ถูกต้อง');
      const { data, error } = await db.from('rrih_admin_users')
        .update({ active: true }).eq('user_id', body.user_id).eq('role', 'ADMIN')
        .eq('active', false).select('user_id').single();
      if (error || !data) fail(409, 'คำขอนี้ไม่อยู่ในสถานะรออนุมัติ');
      return json({ approved: true }, 200, origin);
    }
    if (action === 'admin-slip' && req.method === 'POST') {
      await administrator(req);
      const body = await req.json();
      const { data: attempt } = await db.from('rrih_payment_attempts')
        .select('slip_path').eq('id', body.attempt_id).single();
      if (!attempt) throw new ApiError(404, 'ไม่พบสลิป');
      const { data, error } = await db.storage.from('rrih-slips').createSignedUrl(attempt.slip_path, 60);
      if (error || !data) throw new ApiError(503, 'เปิดสลิปไม่สำเร็จ');
      return json({ url: data.signedUrl }, 200, origin);
    }
    if (action === 'admin-review' && req.method === 'POST') {
      const admin = await administrator(req, true), body = await req.json();
      if (typeof body.approve !== 'boolean' || !body.attempt_id) fail(400, 'คำสั่งไม่ถูกต้อง');
      const { data, error } = await db.rpc('rrih_review_attempt', {
        p_attempt_id: body.attempt_id, p_admin_id: admin.id,
        p_approve: body.approve, p_note: text(body.note).slice(0, 500),
      });
      if (error) fail(409, error.message);
      return json(data, 200, origin);
    }
    if (action === 'admin-package' && req.method === 'POST') {
      await administrator(req, true);
      const body = await req.json(), code = text(body.code);
      if (!/^[A-Z0-9_]{2,40}$/.test(code) || !Number.isInteger(body.price_thb) ||
          body.price_thb < 5000 || !text(body.name_th) ||
          !Number.isInteger(body.runner_count) || body.runner_count < 1 || body.runner_count > 2 ||
          !Number.isInteger(body.follower_count) || body.follower_count < 0 || body.follower_count > 1 ||
          !Number.isInteger(body.sort_order)) fail(400, 'ข้อมูลแพ็กเกจไม่ถูกต้อง');
      const { data, error } = await db.from('rrih_packages').update({
        name_th: text(body.name_th), name_en: text(body.name_en),
        name_zh: text(body.name_zh), name_ru: text(body.name_ru), name_ja: text(body.name_ja),
        price_thb: body.price_thb, runner_count: body.runner_count,
        follower_count: body.follower_count, room_type: text(body.room_type) || null,
        sort_order: body.sort_order,
        active: Boolean(body.active), breakfast: Boolean(body.breakfast),
        after_party: Boolean(body.after_party), updated_at: new Date().toISOString(),
      }).eq('code', code).select().single();
      if (error || !data) fail(400, 'บันทึกแพ็กเกจไม่สำเร็จ');
      return json(data, 200, origin);
    }
    if (action === 'admin-settings' && req.method === 'POST') {
      await administrator(req, true);
      const body = await req.json(), fields = ['bank_name','account_name','account_number',
        'promptpay_name','promptpay_number','poster_url'];
      const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const field of fields) if (field in body) changes[field] = text(body[field]).slice(0, 500) || null;
      if (changes.poster_url && !String(changes.poster_url).startsWith('https://'))
        fail(400, 'โปสเตอร์ต้องเป็นลิงก์ HTTPS');
      for (const field of ['registration_opens_at','registration_closes_at',
        'installment_2_due_at','installment_3_due_at']) {
        if (field in body) {
          if (body[field] && Number.isNaN(Date.parse(body[field]))) fail(400, 'วันเวลาไม่ถูกต้อง');
          changes[field] = body[field] || null;
        }
      }
      if ('max_slip_mb' in body) {
        if (!Number.isInteger(body.max_slip_mb) || body.max_slip_mb < 1 || body.max_slip_mb > 10)
          fail(400, 'ขนาดสลิปไม่ถูกต้อง');
        changes.max_slip_mb = body.max_slip_mb;
      }
      const current = await settings();
      const nextOpen = 'registration_opens_at' in changes ? changes.registration_opens_at : current.registration_opens_at;
      const nextClose = 'registration_closes_at' in changes ? changes.registration_closes_at : current.registration_closes_at;
      if (!nextOpen || (nextClose && Date.parse(String(nextClose)) <= Date.parse(String(nextOpen))))
        fail(400, 'เวลาปิดรับสมัครต้องหลังเวลาเปิดรับสมัคร');
      if ('deposit_thb' in body || 'second_thb' in body)
        fail(400, 'ยอดผ่อนคำนวณตามราคาแพ็กเกจอัตโนมัติ กรุณารีเฟรชหน้าแอดมิน');
      const { data, error } = await db.from('rrih_settings').update(changes).eq('id',1).select().single();
      if (error || !data) fail(400, 'บันทึกข้อมูลชำระไม่สำเร็จ');
      return json(data, 200, origin);
    }
    throw new ApiError(404, 'ไม่พบคำสั่ง');
  } catch (err) {
    const known = err instanceof ApiError;
    return json({ error: known ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
      known ? err.status : 500, origin);
  }
});
