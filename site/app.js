(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const idKey = value => String(value || '').normalize('NFKC').toUpperCase()
    .replace(/[\s\p{Pd}\u2212\uFE63\uFF0D]/gu, '');
  const words = {
    th: { register:'สมัครแข่งขัน',payNext:'ชำระงวดถัดไป',choosePackage:'เลือกแพ็กเกจ',packageHint:'ราคานี้เป็นยอดรวมของทั้งแพ็กเกจ',participants:'ข้อมูลผู้แข่งขัน',participantHint:'ระบุข้อมูลตามจำนวนคนในแพ็กเกจ',beneficiaries:'ผู้รับผลประโยชน์',beneficiaryHint:'ของแต่ละผู้แข่งขันต้องรวม 100%',payment:'ชำระเงิน',paymentHint:'เลือกจ่ายเต็มหรือผ่อน 3 งวด',full:'ชำระเต็ม',installments:'ผ่อน 3 งวด',slip:'แนบสลิปชำระเงิน',consent:'ฉันยินยอมให้ใช้ข้อมูลนี้เพื่อการสมัครและจัดการแข่งขัน',sendApplication:'ส่งใบสมัคร',paymentDetails:'ข้อมูลชำระเงิน',bank:'ธนาคาร',copy:'คัดลอก',slipCheck:'โอนตามยอดที่แสดง และแนบหลักฐานให้เจ้าหน้าที่ตรวจสอบ',findApplication:'ค้นหาใบสมัครเดิม',findHint:'ใช้เลขบัตรหรือ Passport ของผู้แข่งขันคนใดก็ได้',idDocument:'เลขบัตรประชาชน / Passport',accessCode:'รหัสยืนยันจากใบสมัคร',search:'ค้นหา',submitSlip:'ส่งหลักฐานการชำระ',lostCode:'หารหัสยืนยันไม่พบ?',lostCodeHint:'รหัสแสดงเมื่อสมัครสำเร็จ หากสูญหายให้ติดต่อเจ้าหน้าที่งานเพื่อยืนยันตัวตนและรับรหัสใหม่',admin:'สำหรับเจ้าหน้าที่',runner:'ผู้แข่งขันคนที่',follower:'ผู้ติดตาม',prefix:'คำนำหน้า',firstName:'ชื่อ',lastName:'นามสกุล',address:'ที่อยู่',phone:'เบอร์โทร',emergencyPhone:'เบอร์โทรฉุกเฉิน',emergencyRelation:'ความสัมพันธ์ผู้ติดต่อฉุกเฉิน',blood:'กรุ๊ปเลือด',shirt:'ไซส์เสื้อ',beneName:'ชื่อผู้รับผลประโยชน์',beneRelation:'ความสัมพันธ์',percent:'เปอร์เซ็นต์',addBene:'เพิ่มผู้รับผลประโยชน์',remove:'ลบ',total:'รวม',breakfast:'อาหารเช้า',party:'After Party',people:'ผู้แข่งขัน',dueNow:'ยอดชำระครั้งนี้',installment:'งวดที่',dueDate:'ครบกำหนด',paid:'ชำระแล้ว',balance:'คงเหลือ',pending:'ยังไม่จ่าย',review:'รอตรวจสลิป',overdue:'เกินกำหนด',complete:'ชำระครบ',success:'ส่งใบสมัครสำเร็จ กำลังรอตรวจสลิป',saveCode:'โปรดบันทึกรหัสยืนยันนี้ไว้สำหรับชำระงวดถัดไป',copyCode:'คัดลอกรหัส',opening:'เปิดรับสมัคร 28 กันยายน 2569 เวลา 12:00 น.',loading:'กำลังดำเนินการ…',error:'เกิดข้อผิดพลาด กรุณาลองใหม่',noPayment:'ยังไม่สามารถชำระงวดถัดไปได้',invalidBene:'ผู้รับผลประโยชน์ของแต่ละคนต้องรวม 100% และเลขเอกสารห้ามซ้ำ',duplicate:'เลขบัตร/Passport นี้สมัครแล้ว' },
    en: { register:'Register',payNext:'Pay next installment',choosePackage:'Choose a package',packageHint:'Price is for the complete package',participants:'Runner details',participantHint:'Enter every runner included in your package',beneficiaries:'Beneficiaries',beneficiaryHint:'Each runner’s shares must total 100%',payment:'Payment',paymentHint:'Pay in full or in three installments',full:'Pay in full',installments:'Three installments',slip:'Upload payment slip',consent:'I consent to the use of this information for registration and event management',sendApplication:'Submit registration',paymentDetails:'Payment details',bank:'Bank',copy:'Copy',slipCheck:'Transfer the displayed amount and upload your slip for review',findApplication:'Find your registration',findHint:'Use either runner’s national ID or passport',idDocument:'National ID / Passport',accessCode:'Confirmation code from registration',search:'Search',submitSlip:'Submit payment proof',lostCode:'Lost your code?',lostCodeHint:'Your code appears after registration. Contact the event team to verify your identity and recover access.',admin:'Staff access',runner:'Runner',follower:'Companion',prefix:'Title',firstName:'First name',lastName:'Last name',address:'Address',phone:'Phone',emergencyPhone:'Emergency phone',emergencyRelation:'Emergency contact relationship',blood:'Blood group',shirt:'Shirt size',beneName:'Beneficiary name',beneRelation:'Relationship',percent:'Percent',addBene:'Add beneficiary',remove:'Remove',total:'Total',breakfast:'Breakfast',party:'After Party',people:'runners',dueNow:'Amount due now',installment:'Installment',dueDate:'Due',paid:'Paid',balance:'Balance',pending:'Pending',review:'Awaiting slip review',overdue:'Overdue',complete:'Paid in full',success:'Registration submitted; slip awaiting review',saveCode:'Save this confirmation code for future installments',copyCode:'Copy code',opening:'Registration opens 28 Sep 2026 at 12:00 (Thailand)',loading:'Processing…',error:'Something went wrong. Please try again',noPayment:'No next installment is available yet',invalidBene:'Each runner’s beneficiaries must total 100%; document IDs cannot repeat',duplicate:'This ID/passport has already registered' },
    zh: { register:'报名参赛',payNext:'支付下一期',choosePackage:'选择套餐',packageHint:'价格为整个套餐总价',participants:'参赛者资料',participantHint:'填写套餐中的所有参赛者',beneficiaries:'受益人',beneficiaryHint:'每位参赛者的比例须合计100%',payment:'付款',paymentHint:'全额付款或分三期付款',full:'全额支付',installments:'分三期付款',slip:'上传付款凭证',consent:'我同意将此信息用于报名和赛事管理',sendApplication:'提交报名',paymentDetails:'付款信息',bank:'银行',copy:'复制',slipCheck:'请按显示金额转账并上传凭证供工作人员审核',findApplication:'查询已有报名',findHint:'使用任一参赛者的身份证或护照',idDocument:'身份证 / 护照',accessCode:'报名确认码',search:'查询',submitSlip:'提交付款凭证',lostCode:'找不到确认码？',lostCodeHint:'确认码在报名成功时显示；遗失请联系工作人员核实身份',admin:'工作人员',runner:'参赛者',follower:'随行人员',prefix:'称谓',firstName:'名',lastName:'姓',address:'地址',phone:'电话',emergencyPhone:'紧急联系电话',emergencyRelation:'紧急联系人关系',blood:'血型',shirt:'服装尺码',beneName:'受益人姓名',beneRelation:'关系',percent:'百分比',addBene:'添加受益人',remove:'删除',total:'合计',breakfast:'早餐',party:'赛后派对',people:'参赛者',dueNow:'本次应付',installment:'第',dueDate:'截止',paid:'已支付',balance:'未付余额',pending:'未付款',review:'凭证审核中',overdue:'已逾期',complete:'已付清',success:'报名已提交，等待审核凭证',saveCode:'请保存确认码，以便支付后续款项',copyCode:'复制确认码',opening:'2026年9月28日泰国时间12:00开放报名',loading:'处理中…',error:'发生错误，请重试',noPayment:'当前没有可支付的下一期',invalidBene:'每位参赛者受益人比例须合计100%，证件号码不能重复',duplicate:'该证件号码已报名' },
    ru: { register:'Регистрация',payNext:'Следующий платёж',choosePackage:'Выберите пакет',packageHint:'Цена указана за весь пакет',participants:'Данные участников',participantHint:'Укажите всех участников пакета',beneficiaries:'Выгодоприобретатели',beneficiaryHint:'Доли для каждого участника — 100%',payment:'Оплата',paymentHint:'Полностью или тремя платежами',full:'Оплатить полностью',installments:'Три платежа',slip:'Загрузить подтверждение оплаты',consent:'Я согласен на использование данных для регистрации и организации мероприятия',sendApplication:'Отправить заявку',paymentDetails:'Реквизиты',bank:'Банк',copy:'Копировать',slipCheck:'Переведите указанную сумму и загрузите подтверждение для проверки',findApplication:'Найти заявку',findHint:'По паспорту/ID любого участника',idDocument:'ID / Паспорт',accessCode:'Код подтверждения заявки',search:'Найти',submitSlip:'Отправить подтверждение',lostCode:'Потеряли код?',lostCodeHint:'Код показывается после регистрации. Обратитесь к организатору для восстановления доступа.',admin:'Для персонала',runner:'Участник',follower:'Сопровождающий',prefix:'Обращение',firstName:'Имя',lastName:'Фамилия',address:'Адрес',phone:'Телефон',emergencyPhone:'Экстренный телефон',emergencyRelation:'Связь с экстренным контактом',blood:'Группа крови',shirt:'Размер футболки',beneName:'Имя выгодоприобретателя',beneRelation:'Кем приходится',percent:'Процент',addBene:'Добавить',remove:'Удалить',total:'Итого',breakfast:'Завтрак',party:'Вечеринка',people:'участника',dueNow:'К оплате сейчас',installment:'Платёж',dueDate:'Срок',paid:'Оплачено',balance:'Остаток',pending:'Не оплачено',review:'Ожидает проверки',overdue:'Просрочено',complete:'Оплачено полностью',success:'Заявка отправлена; платёж проверяется',saveCode:'Сохраните код для следующих платежей',copyCode:'Копировать код',opening:'Регистрация откроется 28 сентября 2026, 12:00 (Таиланд)',loading:'Обработка…',error:'Ошибка. Попробуйте ещё раз',noPayment:'Следующий платёж пока недоступен',invalidBene:'Доли для каждого участника должны составлять 100%; номера документов не должны повторяться',duplicate:'Этот документ уже зарегистрирован' },
    ja: { register:'参加申込',payNext:'次回のお支払い',choosePackage:'パッケージ選択',packageHint:'表示価格はパッケージ全体の合計です',participants:'参加者情報',participantHint:'パッケージに含まれる全参加者を入力',beneficiaries:'受取人',beneficiaryHint:'参加者ごとに合計100%にしてください',payment:'お支払い',paymentHint:'一括または3回払い',full:'一括払い',installments:'3回払い',slip:'振込明細をアップロード',consent:'登録と大会運営のための情報利用に同意します',sendApplication:'申込を送信',paymentDetails:'振込先情報',bank:'銀行',copy:'コピー',slipCheck:'表示額を振り込み、確認用の明細を添付してください',findApplication:'申込を検索',findHint:'参加者いずれかの身分証/パスポート番号を入力',idDocument:'身分証 / パスポート',accessCode:'申込確認コード',search:'検索',submitSlip:'支払証明を送信',lostCode:'確認コードを紛失しましたか？',lostCodeHint:'コードは申込完了時に表示されます。紛失時は大会スタッフにご連絡ください。',admin:'スタッフ用',runner:'参加者',follower:'同伴者',prefix:'敬称',firstName:'名',lastName:'姓',address:'住所',phone:'電話番号',emergencyPhone:'緊急連絡先',emergencyRelation:'緊急連絡先との関係',blood:'血液型',shirt:'シャツサイズ',beneName:'受取人氏名',beneRelation:'続柄',percent:'割合',addBene:'受取人を追加',remove:'削除',total:'合計',breakfast:'朝食',party:'アフターパーティー',people:'参加者',dueNow:'今回のお支払い',installment:'第',dueDate:'期限',paid:'支払済',balance:'残額',pending:'未払い',review:'明細確認待ち',overdue:'期限超過',complete:'全額支払済',success:'申込を送信しました。明細を確認中です',saveCode:'次回のお支払い用に確認コードを保存してください',copyCode:'コードをコピー',opening:'2026年9月28日 12:00（タイ時間）受付開始',loading:'処理中…',error:'エラーが発生しました。再試行してください',noPayment:'現在支払い可能な次の回はありません',invalidBene:'各参加者の受取人割合は100%、証明書番号は重複不可',duplicate:'この証明書番号は登録済みです' },
  };
  let language = 'th', cfg = null, selected = null, lookup = null, cachedCredentials = null;
  const t = key => words[language]?.[key] || words.en[key] || key;
  const money = amount => `${Number(amount || 0).toLocaleString(language === 'th' ? 'th-TH' : 'en-US')} ฿`;
  const date = value => new Intl.DateTimeFormat(language === 'th' ? 'th-TH' : language,
    { dateStyle: 'medium', timeZone: 'Asia/Bangkok' }).format(new Date(value));
  const api = async (action, { method = 'GET', body } = {}) => {
    const response = await fetch(`${window.RRIH_CONFIG.SUPABASE_URL}/functions/v1/registration-api?action=${action}`,
      { method, headers: { apikey: window.RRIH_CONFIG.PUBLISHABLE_KEY,
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
        body: body == null ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(value.error || t('error'));
    return value;
  };
  function feedback(element, message, success = false) {
    element.textContent = message; element.className = `feedback ${success ? 'success' : 'error'}`;
  }
  function translateAll() {
    document.documentElement.lang = language;
    all('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    renderPackages(); renderSchedule(); if (lookup) renderLookup(lookup);
  }
  const label = (key, name, value = '', type = 'text', extra = '') =>
    `<label class="field"><span data-i18n="${key}">${escape(t(key))}</span><input name="${name}" type="${type}" value="${escape(value)}" ${extra}></label>`;
  function runnerHtml(no) {
    const shirts = cfg.shirt_sizes.map(s => `<option value="${escape(s.code)}">${escape(s.label)}</option>`).join('');
    return `<div class="person-card runner" data-no="${no}"><h3>${escape(t('runner'))} ${no}</h3><div class="form-grid">
      ${label('prefix','prefix','', 'text')}${label('firstName','first_name','','text','required')}${label('lastName','last_name','','text','required')}
      ${label('idDocument','id_document','','text','required autocomplete="off" class="id-document"')}
      <label class="field span-all"><span data-i18n="address">${escape(t('address'))}</span><textarea name="address" required></textarea></label>
      ${label('phone','phone','','tel','required')}${label('emergencyPhone','emergency_phone','','tel','required')}
      ${label('emergencyRelation','emergency_relation','','text','required')}
      <label class="field"><span data-i18n="blood">${escape(t('blood'))}</span><select name="blood_group" required><option value="">—</option><option>A</option><option>B</option><option>AB</option><option>O</option></select></label>
      <label class="field"><span data-i18n="shirt">${escape(t('shirt'))}</span><select name="shirt_size" required><option value="">—</option>${shirts}</select></label>
    </div><p class="feedback id-feedback"></p></div>`;
  }
  function followerHtml() {
    return `<div class="person-card follower"><h3>${escape(t('follower'))}</h3><div class="form-grid">
      ${label('firstName','first_name','','text','required')}${label('lastName','last_name','','text','required')}
      ${label('idDocument','id_document')}${label('phone','phone','','tel')}
    </div></div>`;
  }
  function beneficiaryHtml() {
    return `<div class="beneficiary-card"><div class="form-grid">${label('beneName','full_name','','text','required')}
      ${label('idDocument','id_document','','text','required')}${label('beneRelation','relationship','','text','required')}
      ${label('percent','percentage','100','number','required min="0.01" max="100" step="0.01"')}</div>
      <button class="small-button danger remove-beneficiary" type="button" data-i18n="remove">${escape(t('remove'))}</button></div>`;
  }
  function renderPeople() {
    if (!selected) return;
    $('#runners').innerHTML = Array.from({ length: selected.runner_count }, (_, i) => runnerHtml(i + 1)).join('');
    $('#followers').innerHTML = Array.from({ length: selected.follower_count }, followerHtml).join('');
    $('#beneficiaryGroups').innerHTML = Array.from({ length: selected.runner_count }, (_, i) =>
      `<div class="beneficiary-group" data-runner="${i + 1}"><h3>${escape(t('runner'))} ${i + 1}</h3><div class="beneficiary-items">${beneficiaryHtml()}</div>
       <p class="total">${escape(t('total'))}: 100%</p><button class="small-button add-beneficiary" type="button" data-i18n="addBene">${escape(t('addBene'))}</button></div>`).join('');
  }
  function renderPackages() {
    if (!cfg) return;
    $('#packages').innerHTML = cfg.packages.map(p => {
      const name = p[`name_${language}`] || p.name_en || p.name_th;
      const details = [p.runner_count + ' ' + t('people'), p.breakfast ? t('breakfast') : '',
        p.after_party ? t('party') : ''].filter(Boolean).join(' · ');
      return `<button type="button" class="package-card ${selected?.code === p.code ? 'selected' : ''}" data-code="${escape(p.code)}" aria-pressed="${selected?.code === p.code}">
        <strong>${escape(name)}</strong><span class="price">${money(p.price_thb)}</span><small>${escape(details)}</small></button>`;
    }).join('');
  }
  function renderPaymentBox(amount) {
    $('#dueAmount').textContent = money(amount);
    $('#bankBlock').classList.toggle('hidden', !cfg.account_number);
    $('#promptpayBlock').classList.toggle('hidden', !cfg.promptpay_name && !cfg.promptpay_number);
    $('#bankName').textContent = cfg.bank_name || '';
    $('#accountName').textContent = cfg.account_name || '';
    $('#accountNumber').textContent = cfg.account_number || '';
    $('#copyAccount').classList.toggle('hidden', !cfg.account_number);
    $('#promptpayName').textContent = cfg.promptpay_name || '';
    $('#promptpayNumber').textContent = cfg.promptpay_number || '';
    $('#copyPromptpay').classList.toggle('hidden', !cfg.promptpay_number);
  }
  function renderSchedule() {
    if (!cfg || !selected || !$('input[name="payment_plan"]:checked')) return;
    const plan = $('input[name="payment_plan"]:checked').value;
    const rows = plan === 'FULL' ? [{ no: 1, amount: selected.price_thb }] : [
      { no: 1, amount: cfg.deposit_thb }, { no: 2, amount: cfg.second_thb, due: cfg.installment_2_due_at },
      { no: 3, amount: selected.price_thb - cfg.deposit_thb - cfg.second_thb, due: cfg.installment_3_due_at },
    ];
    $('#paymentSchedule').innerHTML = rows.map(row => `<div class="schedule-item"><span>${escape(t('installment'))} ${row.no}${row.due ? ` · ${escape(t('dueDate'))} ${date(row.due)}` : ''}</span><strong>${money(row.amount)}</strong></div>`).join('');
    renderPaymentBox(rows[0].amount);
  }
  function switchView(view) {
    const isPay = view === 'pay';
    $('#registerView').classList.toggle('hidden', isPay); $('#payView').classList.toggle('hidden', !isPay);
    $('#tabRegister').classList.toggle('active', !isPay); $('#tabPay').classList.toggle('active', isPay);
    (isPay ? $('#payView .aside') : $('#registerView .aside')).prepend($('#paymentBox'));
    if (!cfg) return;
    renderPaymentBox(isPay && lookup?.next_installment_id ?
      lookup.installments.find(x => x.id === lookup.next_installment_id).amount_due_thb :
      selected ? ($('input[name="payment_plan"]:checked')?.value === 'FULL' ? selected.price_thb : cfg.deposit_thb) : 0);
  }
  const values = element => Object.fromEntries([...element.querySelectorAll('[name]')].map(el => [el.name, el.value.trim()]));
  function collectRegistration() {
    const runners = all('#runners .runner').map(values);
    const followers = all('#followers .follower').map(values);
    const beneficiaries = all('.beneficiary-group').flatMap(group =>
      [...group.querySelectorAll('.beneficiary-card')].map(card => ({
        runner_no: Number(group.dataset.runner), ...values(card), percentage: Number(card.querySelector('[name="percentage"]').value),
      })));
    const ids = runners.map(r => idKey(r.id_document));
    const beneIds = beneficiaries.map(b => idKey(b.id_document));
    if (new Set(ids).size !== ids.length || new Set(beneIds).size !== beneIds.length ||
        beneIds.some(id => ids.includes(id)) ||
        runners.some((_, i) => Math.round(beneficiaries.filter(b => b.runner_no === i + 1)
          .reduce((sum, b) => sum + b.percentage, 0) * 100) !== 10000)) throw new Error(t('invalidBene'));
    const plan = $('input[name="payment_plan"]:checked').value;
    return { language, package_code: selected.code, payment_plan: plan, runners, followers,
      beneficiaries, consent_privacy: $('#consent').checked,
      amount_confirmed_thb: plan === 'FULL' ? selected.price_thb : cfg.deposit_thb };
  }
  const statusText = value => ({ PAID: t('paid'), PENDING_REVIEW: t('review'),
    OVERDUE: t('overdue'), PENDING: t('pending') })[value] || value;
  function renderLookup(result) {
    $('#lookupResult').classList.remove('hidden');
    $('#registrationName').textContent = `${result.runners.map(r => `${r.first_name} ${r.last_name}`).join(' / ')} · ${result.registration_code}`;
    $('#registrationSummary').textContent = `${result.package_name} · ${money(result.price_thb)} · ${t('paid')} ${money(result.paid_thb)} · ${t('balance')} ${money(result.balance_thb)}`;
    $('#installmentList').innerHTML = result.installments.map(i =>
      `<div class="schedule-item"><span>${escape(t('installment'))} ${i.installment_no} · ${escape(statusText(i.display_status))}</span><strong>${money(i.amount_due_thb)}</strong></div>`).join('');
    const next = result.installments.find(i => i.id === result.next_installment_id);
    $('#nextPaymentForm').classList.toggle('hidden', !next);
    if (next) $('#nextPaymentTitle').textContent = `${t('dueNow')} · ${t('installment')} ${next.installment_no} · ${money(next.amount_due_thb)}`;
    renderPaymentBox(next?.amount_due_thb || 0);
  }
  async function init() {
    if (!window.RRIH_CONFIG?.SUPABASE_URL || !window.RRIH_CONFIG?.PUBLISHABLE_KEY) {
      $('#globalMessage').textContent = 'ระบบสมัครกำลังตั้งค่าการเชื่อมต่อ โปรดลองอีกครั้งภายหลัง';
      $('#globalMessage').classList.remove('hidden'); $('#submitRegistration').disabled = true; return;
    }
    try {
      cfg = await api('config');
      if (cfg.poster_url) { $('#poster').src = cfg.poster_url; $('#poster').classList.remove('hidden'); }
      selected = cfg.packages[0]; renderPackages(); renderPeople(); renderSchedule();
      const hasPaymentDetails = Boolean(cfg.account_number || cfg.promptpay_number);
      if (!hasPaymentDetails) {
        $('#submitRegistration').disabled = true;
        $('#globalMessage').textContent = 'ยังไม่มีข้อมูลบัญชีรับชำระ กรุณาติดต่อเจ้าหน้าที่';
        $('#globalMessage').classList.remove('hidden');
      }
      const opensInMs = new Date(cfg.registration_opens_at).getTime() - Date.now();
      const open = opensInMs > 0;
      const closed = cfg.registration_closes_at && new Date(cfg.registration_closes_at) < new Date();
      if (open || closed) { $('#submitRegistration').disabled = true; $('#globalMessage').textContent = open ? t('opening') : 'ปิดรับสมัครแล้ว'; $('#globalMessage').classList.remove('hidden'); }
      if (open && !closed && hasPaymentDetails) {
        setTimeout(() => {
          $('#submitRegistration').disabled = false;
          $('#globalMessage').classList.add('hidden');
        }, Math.min(opensInMs + 1000, 2147483647));
      }
      if (new Date(cfg.installment_2_due_at) < new Date()) {
        $('#installmentChoice').classList.add('hidden'); $('input[value="FULL"]').checked = true;
      }
    } catch (err) { $('#globalMessage').textContent = err.message; $('#globalMessage').classList.remove('hidden'); }
  }
  $('#language').addEventListener('change', event => { language = event.target.value; translateAll(); });
  $('#tabRegister').addEventListener('click', () => switchView('register'));
  $('#tabPay').addEventListener('click', () => switchView('pay'));
  $('#packages').addEventListener('click', event => {
    const button = event.target.closest('[data-code]'); if (!button) return;
    selected = cfg.packages.find(p => p.code === button.dataset.code);
    renderPackages(); renderPeople(); renderSchedule();
  });
  all('input[name="payment_plan"]').forEach(input => input.addEventListener('change', renderSchedule));
  $('#beneficiaryGroups').addEventListener('click', event => {
    const group = event.target.closest('.beneficiary-group'); if (!group) return;
    if (event.target.closest('.add-beneficiary')) {
      group.querySelector('.beneficiary-items').insertAdjacentHTML('beforeend', beneficiaryHtml());
      group.querySelectorAll('[name="percentage"]').forEach(el => { el.value = ''; });
    } else if (event.target.closest('.remove-beneficiary')) event.target.closest('.beneficiary-card').remove();
  });
  $('#runners').addEventListener('focusout', async event => {
    if (!event.target.matches('.id-document') || idKey(event.target.value).length < 5) return;
    const field = event.target.closest('.runner').querySelector('.id-feedback');
    try { const response = await api('availability', { method: 'POST', body: { id_document: event.target.value } });
      feedback(field, response.available ? '' : t('duplicate'));
    } catch { feedback(field, ''); }
  });
  $('#registrationForm').addEventListener('submit', async event => {
    event.preventDefault(); if (!cfg || !selected || !event.currentTarget.reportValidity()) return;
    const button = $('#submitRegistration'); button.disabled = true;
    try {
      const data = collectRegistration(), form = new FormData();
      form.set('data', JSON.stringify(data)); form.set('slip', $('#firstSlip').files[0]);
      feedback($('#formMessage'), t('loading'), true);
      const result = await api('register', { method: 'POST', body: form });
      const displayCode = result.access_code.match(/.{1,8}/g).join('-');
      $('#registrationForm').innerHTML = `<div class="panel receipt"><h2>${escape(t('success'))}</h2><p>${escape(result.registration_code)}</p>
        <p>${escape(t('saveCode'))}</p><p><code>${escape(displayCode)}</code></p><button type="button" class="small-button" id="copyAccess">${escape(t('copyCode'))}</button></div>`;
      $('#copyAccess').addEventListener('click', () => navigator.clipboard.writeText(displayCode));
      $('#paymentBox').classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { feedback($('#formMessage'), err.message); button.disabled = false; }
  });
  $('#lookupForm').addEventListener('submit', async event => {
    event.preventDefault(); if (!event.currentTarget.reportValidity()) return;
    try {
      feedback($('#lookupMessage'), t('loading'), true);
      cachedCredentials = { id_document: $('#lookupId').value, access_code: $('#lookupCode').value };
      lookup = await api('lookup', { method: 'POST', body: cachedCredentials });
      feedback($('#lookupMessage'), '', true); renderLookup(lookup);
    } catch (err) { lookup = null; $('#lookupResult').classList.add('hidden'); feedback($('#lookupMessage'), err.message); }
  });
  $('#nextPaymentForm').addEventListener('submit', async event => {
    event.preventDefault(); if (!event.currentTarget.reportValidity() || !lookup?.next_installment_id) return;
    const button = $('#submitPayment'); button.disabled = true;
    try {
      const form = new FormData();
      form.set('id_document', cachedCredentials.id_document); form.set('access_code', cachedCredentials.access_code);
      form.set('installment_id', lookup.next_installment_id); form.set('slip', $('#nextSlip').files[0]);
      feedback($('#paymentMessage'), t('loading'), true);
      await api('submit-payment', { method: 'POST', body: form });
      lookup = await api('lookup', { method: 'POST', body: cachedCredentials });
      renderLookup(lookup); feedback($('#lookupMessage'), t('review'), true);
    } catch (err) { feedback($('#paymentMessage'), err.message); } finally { button.disabled = false; }
  });
  $('#copyAccount').addEventListener('click', () => navigator.clipboard.writeText(cfg.account_number));
  $('#copyPromptpay').addEventListener('click', () => navigator.clipboard.writeText(cfg.promptpay_number));
  init();
})();
