(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const escape = value => String(value ?? '').replace(/[&<>"']/g,
    c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const money = value => `${Number(value || 0).toLocaleString('th-TH')} ฿`;
  const cfg = window.RRIH_CONFIG;
  const alerts = window.RRIHAlerts;
  let client, snapshot, currentUser;
  function showMessage(message, icon = 'error') {
    if (message) alerts.notice(icon, icon === 'success' ? 'สำเร็จ' : 'แจ้งเตือน', message);
  }
  async function validForm(form) {
    const invalid = [...form.querySelectorAll('input,select,textarea')].find(el =>
      !el.validity.valid || (el.required && !el.value.trim()));
    if (!invalid) return true;
    const name = invalid.closest('label')?.querySelector('span')?.textContent || 'ข้อมูลที่จำเป็น';
    await alerts.notice('warning', 'กรุณากรอกข้อมูลให้ครบ', name);
    invalid.focus(); return false;
  }
  function asBkkInput(value) {
    if (!value) return '';
    const parts = new Intl.DateTimeFormat('sv-SE', { timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).format(new Date(value));
    return parts.replace(' ', 'T');
  }
  const toIso = value => value ? new Date(`${value}:00+07:00`).toISOString() : null;
  async function api(action, body, method = 'POST') {
    const { data: sessionData } = await client.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('กรุณาเข้าสู่ระบบใหม่');
    const response = await fetch(`${cfg.SUPABASE_URL}/functions/v1/registration-api?action=${action}`,
      { method, headers: { apikey: cfg.PUBLISHABLE_KEY, Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' }, body: body == null ? undefined : JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'ดำเนินการไม่สำเร็จ');
    return result;
  }
  async function load() {
    snapshot = await api('admin-overview', null, 'GET');
    $('#loginSection').classList.add('hidden'); $('#dashboard').classList.remove('hidden'); $('#signOut').classList.remove('hidden');
    showMessage(''); render();
  }
  const indexed = rows => new Map((rows || []).map(row => [row.id, row]));
  function enriched() {
    if (!snapshot) return [];
    const attempts = snapshot.attempts || [];
    return (snapshot.registrations || []).map(reg => {
      const people = (snapshot.participants || []).filter(p => p.registration_id === reg.id && p.role === 'RUNNER');
      const installments = (snapshot.installments || []).filter(i => i.registration_id === reg.id).sort((a,b) => a.installment_no - b.installment_no)
        .map(i => ({ ...i, attempts: attempts.filter(a => a.installment_id === i.id) }));
      const paid = installments.filter(i => i.status === 'PAID').reduce((n, i) => n + i.amount_due_thb, 0);
      const first = installments.find(i => i.status !== 'PAID');
      const currentStatus = !first ? 'complete' : first.status === 'PENDING_REVIEW' ? 'review' :
        first.due_at && new Date(first.due_at) < new Date() ? 'overdue' : `wait${first.installment_no}`;
      return { ...reg, people, installments, paid, balance: reg.package_price_thb - paid, currentStatus };
    });
  }
  function render() {
    if (!snapshot) return;
    const registrations = enriched(), filter = $('#statusFilter').value,
      query = $('#adminSearch').value.trim().toLowerCase();
    const visible = registrations.filter(r => (filter === 'all' || r.currentStatus === filter) &&
      (!query || `${r.registration_code} ${r.people.map(p => `${p.first_name} ${p.last_name} ${p.id_document}`).join(' ')}`.toLowerCase().includes(query)));
    const paidTotal = registrations.reduce((sum, r) => sum + r.paid, 0);
    const balanceTotal = registrations.reduce((sum, r) => sum + r.balance, 0);
    $('#metrics').innerHTML = [
      ['ใบสมัคร', registrations.length], ['รอตรวจสลิป', registrations.filter(r => r.currentStatus === 'review').length],
      ['ชำระแล้ว', money(paidTotal)], ['คงเหลือ', money(balanceTotal)],
    ].map(([label, value]) => `<div class="metric"><small>${escape(label)}</small><strong>${escape(value)}</strong></div>`).join('');
    $('#registrationRows').innerHTML = visible.map(r => {
      const byNumber = n => {
        const i = r.installments.find(x => x.installment_no === n);
        if (!i) return '—';
        const status = i.status === 'PENDING' && new Date(i.due_at) < new Date() ? 'OVERDUE' : i.status;
        const thai = { PAID:'ชำระแล้ว',PENDING_REVIEW:'รอตรวจ',PENDING:'ยังไม่จ่าย',OVERDUE:'เกินกำหนด' }[status];
        return `<span class="pill ${status}">${thai}</span><br>${money(i.amount_due_thb)}`;
      };
      const pending = r.installments.flatMap(i => i.attempts.filter(a => a.status === 'PENDING_REVIEW').map(a => ({ ...a, no:i.installment_no })));
      return `<tr><td><strong>${escape(r.people.map(p => `${p.first_name} ${p.last_name}`).join(' / '))}</strong><br>
        ${escape(r.people.map(p => p.id_document).join(' / '))}<br><small>${escape(r.registration_code)}</small></td>
        <td>${escape(r.package_name_snapshot)}<br>${money(r.package_price_thb)}</td>
        <td>${byNumber(1)}</td><td>${byNumber(2)}</td><td>${byNumber(3)}</td>
        <td>${money(r.paid)}<br><strong>${money(r.balance)}</strong></td>
        <td>${pending.map(a => `<div style="margin-bottom:8px">งวด ${a.no} · ${money(a.amount_claimed_thb)}<div class="inline-actions">
          <button type="button" data-slip="${escape(a.id)}">ดูสลิป</button>${snapshot.role === 'ADMIN' ?
            `<button type="button" data-review="${escape(a.id)}" data-approve="true">อนุมัติ</button>
             <button type="button" data-review="${escape(a.id)}" data-approve="false">ปฏิเสธ</button>` : ''}</div></div>`).join('') || '—'}</td></tr>`;
    }).join('') || '<tr><td colspan="7">ไม่พบรายการ</td></tr>';
    $('#resultCount').textContent = `แสดง ${visible.length} จาก ${registrations.length} ใบสมัคร`;
    renderPackages(); renderSettings();
  }
  function renderPackages() {
    $('#packageForms').innerHTML = (snapshot.packages || []).map(p =>
      `<form class="person-card package-form" data-code="${escape(p.code)}" novalidate><h3>${escape(p.code)}</h3><div class="admin-form">
        ${['th','en','zh','ru','ja'].map(l => `<label class="field"><span>ชื่อ ${l}</span><input name="name_${l}" value="${escape(p[`name_${l}`] || '')}" ${l === 'th' ? 'required' : ''}></label>`).join('')}
        <label class="field"><span>ราคา (บาท)</span><input name="price_thb" type="number" min="5000" value="${p.price_thb}" required></label>
        <label class="field"><span>ผู้แข่งขัน</span><input name="runner_count" type="number" min="1" max="2" value="${p.runner_count}" required></label>
        <label class="field"><span>ผู้ติดตาม</span><input name="follower_count" type="number" min="0" max="1" value="${p.follower_count}" required></label>
        <label class="field"><span>ประเภทห้อง</span><input name="room_type" value="${escape(p.room_type || '')}"></label>
        <label class="field"><span>ลำดับ</span><input name="sort_order" type="number" value="${p.sort_order}"></label>
        <label class="checkbox-row"><input type="checkbox" name="breakfast" ${p.breakfast ? 'checked' : ''}> Breakfast</label>
        <label class="checkbox-row"><input type="checkbox" name="after_party" ${p.after_party ? 'checked' : ''}> After Party</label>
        <label class="checkbox-row"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}> เปิดรับสมัครแพ็กเกจนี้</label>
        <button class="primary" type="submit" ${snapshot.role !== 'ADMIN' ? 'disabled' : ''}>บันทึกแพ็กเกจ</button>
      </div></form>`).join('');
  }
  function renderSettings() {
    const form = $('#settingsForm'), schedule = $('#scheduleForm'), s = snapshot.settings;
    for (const name of ['bank_name','account_name','account_number','promptpay_name','promptpay_number','poster_url',
      'deposit_thb','second_thb','max_slip_mb']) form.elements[name].value = s[name] ?? '';
    for (const name of ['installment_2_due_at','installment_3_due_at']) form.elements[name].value = asBkkInput(s[name]);
    for (const name of ['registration_opens_at','registration_closes_at']) schedule.elements[name].value = asBkkInput(s[name]);
    for (const current of [form, schedule])
      [...current.elements].forEach(el => { el.disabled = snapshot.role !== 'ADMIN'; });
  }
  async function init() {
    if (!cfg?.SUPABASE_URL || !cfg?.PUBLISHABLE_KEY) { showMessage('ยังไม่ได้ตั้งค่า URL และ Publishable Key ของ Supabase โปรเจกต์งานสมัคร'); return; }
    if (!window.supabase) { showMessage('โหลดระบบเข้าสู่ระบบไม่สำเร็จ'); return; }
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.PUBLISHABLE_KEY);
    const { data } = await client.auth.getSession();
    if (data.session) { currentUser = data.session.user; try { await load(); } catch (err) { showMessage(err.message); } }
  }
  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault(); if (!client || !await validForm(event.currentTarget)) return;
    const button = event.currentTarget.querySelector('button'); button.disabled = true;
    try {
      alerts.loading('กำลังเข้าสู่ระบบ…');
      const { data, error } = await client.auth.signInWithPassword({ email: $('#adminEmail').value,
        password: $('#adminPassword').value });
      if (error) throw error;
      currentUser = data.user; $('#adminPassword').value = ''; await load(); alerts.close();
    } catch (err) { alerts.close(); showMessage(err.message); button.disabled = false; }
  });
  $('#signOut').addEventListener('click', async () => { await client.auth.signOut(); location.reload(); });
  document.querySelectorAll('.admin-nav button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.admin-nav button').forEach(x => x.classList.toggle('active', x === button));
    for (const name of ['applications','packages','settings'])
      $(`#${name}Page`).classList.toggle('hidden', name !== button.dataset.page);
  }));
  $('#statusFilter').addEventListener('change', render); $('#adminSearch').addEventListener('input', render);
  $('#registrationRows').addEventListener('click', async event => {
    const slip = event.target.closest('[data-slip]'), review = event.target.closest('[data-review]');
    try {
      if (slip) {
        const { url } = await api('admin-slip', { attempt_id: slip.dataset.slip });
        const attempt = snapshot.attempts.find(a => a.id === slip.dataset.slip);
        $('#slipContent').innerHTML = attempt.slip_path.toLowerCase().endsWith('.pdf') ?
          `<iframe title="สลิป PDF" src="${escape(url)}"></iframe>` : `<img alt="สลิปชำระเงิน" src="${escape(url)}">`;
        $('#slipModal').classList.remove('hidden');
      }
      if (review) {
        const approve = review.dataset.approve === 'true';
        let note = '';
        if (approve) {
          const choice = await alerts.fire({ icon:'question', title:'อนุมัติสลิปนี้?',
            text:'โปรดตรวจยอดเงินเข้าในบัญชีจริงก่อนอนุมัติ', showCancelButton:true,
            confirmButtonText:'อนุมัติ', cancelButtonText:'ยกเลิก' });
          if (!choice.isConfirmed) return;
        } else {
          const choice = await alerts.fire({ icon:'warning', title:'ปฏิเสธสลิปนี้?', input:'textarea',
            inputLabel:'เหตุผลที่ปฏิเสธ', inputValidator:value => !value?.trim() ? 'กรุณาระบุเหตุผล' : undefined,
            showCancelButton:true, confirmButtonText:'ปฏิเสธ', cancelButtonText:'ยกเลิก' });
          if (!choice.isConfirmed) return;
          note = choice.value.trim();
        }
        review.disabled = true;
        alerts.loading('กำลังบันทึกผลตรวจ…');
        await api('admin-review', { attempt_id: review.dataset.review, approve, note });
        await load(); alerts.close(); showMessage(approve ? 'อนุมัติสลิปแล้ว' : 'ปฏิเสธสลิปแล้ว', 'success');
      }
    } catch (err) { alerts.close(); showMessage(err.message); if (review) review.disabled = false; }
  });
  $('#closeModal').addEventListener('click', () => { $('#slipModal').classList.add('hidden'); $('#slipContent').replaceChildren(); });
  $('#slipModal').addEventListener('click', event => { if (event.target.id === 'slipModal') $('#closeModal').click(); });
  $('#packageForms').addEventListener('submit', async event => {
    const form = event.target.closest('.package-form'); if (!form) return; event.preventDefault();
    if (!await validForm(form)) return;
    const value = name => form.elements[name].value.trim();
    const body = { code: form.dataset.code, price_thb: Number(value('price_thb')),
      runner_count: Number(value('runner_count')), follower_count: Number(value('follower_count')),
      room_type: value('room_type'), sort_order: Number(value('sort_order')),
      active: form.elements.active.checked, breakfast: form.elements.breakfast.checked,
      after_party: form.elements.after_party.checked };
    for (const l of ['th','en','zh','ru','ja']) body[`name_${l}`] = value(`name_${l}`);
    try { alerts.loading('กำลังบันทึกแพ็กเกจ…'); await api('admin-package', body); await load(); alerts.close(); showMessage('บันทึกแพ็กเกจแล้ว', 'success'); }
    catch (err) { alerts.close(); showMessage(err.message); }
  });
  $('#scheduleForm').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget;
    if (!await validForm(form)) return;
    const opens = toIso(form.elements.registration_opens_at.value);
    const closes = toIso(form.elements.registration_closes_at.value);
    if (closes && Date.parse(closes) <= Date.parse(opens)) {
      await alerts.notice('warning', 'เวลาปิดไม่ถูกต้อง', 'เวลาปิดรับสมัครต้องหลังเวลาเปิดรับสมัคร'); return;
    }
    try {
      alerts.loading('กำลังบันทึกเวลาเปิด/ปิด…');
      await api('admin-settings', { registration_opens_at: opens, registration_closes_at: closes });
      await load(); alerts.close(); showMessage('เวลาเปิด/ปิดรับสมัครมีผลแล้ว', 'success');
    } catch (err) { alerts.close(); showMessage(err.message); }
  });
  $('#settingsForm').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget, body = {};
    if (!await validForm(form)) return;
    for (const name of ['bank_name','account_name','account_number','promptpay_name','promptpay_number','poster_url'])
      body[name] = form.elements[name].value.trim();
    for (const name of ['installment_2_due_at','installment_3_due_at'])
      body[name] = toIso(form.elements[name].value);
    for (const name of ['deposit_thb','second_thb','max_slip_mb']) body[name] = Number(form.elements[name].value);
    try { alerts.loading('กำลังบันทึกการตั้งค่า…'); await api('admin-settings', body); await load(); alerts.close(); showMessage('บันทึกการตั้งค่าแล้ว', 'success'); }
    catch (err) { alerts.close(); showMessage(err.message); }
  });
  init();
})();
