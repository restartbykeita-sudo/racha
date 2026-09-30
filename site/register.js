(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const cfg0 = window.RRIH_CONFIG;
  const alerts = window.RRIHAlerts;
  let cfg = null, language = 'th', selectedCategory = null, selectedPackage = null, paymentMode = 'FULL';

  const I18N = {
    th:{open:'เปิดรับสมัคร',closed:'ยังไม่เปิดหรือปิดรับสมัครแล้ว',category:'รุ่นการแข่งขัน',categoryHint:'เลือกรุ่นที่สมัคร',package:'Package',packageHint:'เลือก Package ที่ต้องการ',participants:'ข้อมูลผู้สมัคร',participantHint:'กรอกข้อมูลให้ตรงกับบัตรประชาชนหรือ Passport',runner:'ผู้สมัคร',insurance:'ข้อมูลประกัน / ผู้รับผลประโยชน์',insuranceHint:'เพิ่มผู้รับผลประโยชน์ได้หลายคน โดยรวมเปอร์เซ็นต์ตามเงื่อนไขของ Event',addBene:'+ เพิ่มผู้รับผลประโยชน์',remove:'ลบ',payment:'การชำระเงิน',paymentHint:'เลือกชำระเต็มหรือผ่อน ตามที่ Event เปิดใช้งาน',full:'ชำระเต็ม',installment:'ผ่อนชำระ',due:'ยอดที่ต้องชำระตอนนี้',copy:'คัดลอก',copied:'คัดลอกแล้ว',submit:'ส่งใบสมัคร',success:'สมัครสำเร็จ',code:'รหัสสมัคร',total:'รวม',beneName:'ชื่อ-นามสกุล',idDoc:'เลขบัตรประชาชน / Passport',address:'ที่อยู่',phone:'เบอร์โทรศัพท์',relation:'ความสัมพันธ์',percent:'เปอร์เซ็นต์ที่ได้รับ',slip:'แนบสลิปชำระเงิน',consent:'ฉันยินยอมให้ใช้ข้อมูลเพื่อการสมัครและจัดการแข่งขันตามเงื่อนไขของ Event',bank:'ธนาคาร'},
    en:{open:'Registration open',closed:'Registration is not open',category:'Competition category',categoryHint:'Choose your competition category',package:'Package',packageHint:'Choose a package',participants:'Participant information',participantHint:'Enter details exactly as shown on your ID or passport',runner:'Participant',insurance:'Insurance / Beneficiaries',insuranceHint:'Add beneficiaries as needed. The required total follows this event’s settings.',addBene:'+ Add beneficiary',remove:'Remove',payment:'Payment',paymentHint:'Choose full payment or installments if enabled for this event',full:'Pay in full',installment:'Installments',due:'Amount due now',copy:'Copy',copied:'Copied',submit:'Submit registration',success:'Registration submitted',code:'Registration code',total:'Total',beneName:'Full name',idDoc:'ID / Passport',address:'Address',phone:'Phone',relation:'Relationship',percent:'Percentage',slip:'Upload payment slip',consent:'I consent to the use of this information for registration and event operations under the event terms.',bank:'Bank'},
    zh:{open:'开放报名',closed:'报名尚未开放或已关闭',category:'比赛组别',categoryHint:'请选择比赛组别',package:'套餐',packageHint:'请选择套餐',participants:'参赛者信息',participantHint:'请按身份证或护照填写',runner:'参赛者',insurance:'保险 / 受益人',insuranceHint:'可添加多名受益人，比例总和须符合活动设置',addBene:'+ 添加受益人',remove:'删除',payment:'付款',paymentHint:'根据活动设置选择全额或分期付款',full:'全额支付',installment:'分期付款',due:'当前应付',copy:'复制',copied:'已复制',submit:'提交报名',success:'报名成功',code:'报名编号',total:'总计',beneName:'姓名',idDoc:'身份证 / 护照',address:'地址',phone:'电话',relation:'关系',percent:'受益比例',slip:'上传付款凭证',consent:'我同意根据活动条款使用这些资料进行报名及活动管理。',bank:'银行'},
    ja:{open:'受付中',closed:'受付期間外です',category:'競技カテゴリー',categoryHint:'競技カテゴリーを選択してください',package:'パッケージ',packageHint:'パッケージを選択してください',participants:'参加者情報',participantHint:'身分証またはパスポートどおりに入力してください',runner:'参加者',insurance:'保険 / 受取人',insuranceHint:'必要に応じて受取人を追加し、割合の合計はイベント設定に従ってください',addBene:'+ 受取人を追加',remove:'削除',payment:'お支払い',paymentHint:'イベント設定に応じて一括または分割払いを選択してください',full:'一括払い',installment:'分割払い',due:'今回のお支払い',copy:'コピー',copied:'コピーしました',submit:'申込を送信',success:'申込完了',code:'申込番号',total:'合計',beneName:'氏名',idDoc:'ID / パスポート',address:'住所',phone:'電話番号',relation:'続柄',percent:'受取割合',slip:'支払証明をアップロード',consent:'イベント規約に基づき、申込および運営のために情報を利用することに同意します。',bank:'銀行'},
    ru:{open:'Регистрация открыта',closed:'Регистрация закрыта или еще не открыта',category:'Категория',categoryHint:'Выберите категорию соревнования',package:'Пакет',packageHint:'Выберите пакет',participants:'Данные участника',participantHint:'Введите данные точно как в ID или паспорте',runner:'Участник',insurance:'Страхование / Выгодоприобретатели',insuranceHint:'Добавьте нужное число выгодоприобретателей; сумма процентов должна соответствовать настройкам события',addBene:'+ Добавить',remove:'Удалить',payment:'Оплата',paymentHint:'Выберите полную оплату или рассрочку, если она включена',full:'Полная оплата',installment:'Рассрочка',due:'К оплате сейчас',copy:'Копировать',copied:'Скопировано',submit:'Отправить заявку',success:'Заявка отправлена',code:'Код регистрации',total:'Итого',beneName:'ФИО',idDoc:'ID / Паспорт',address:'Адрес',phone:'Телефон',relation:'Степень родства',percent:'Процент',slip:'Загрузить подтверждение оплаты',consent:'Я согласен(на) на использование данных для регистрации и проведения мероприятия согласно условиям события.',bank:'Банк'}
  };
  const t = k => (I18N[language] || I18N.th)[k] || k;
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => Number(v||0).toLocaleString(language==='th'?'th-TH':'en-US',{minimumFractionDigits:Number(v)%1?2:0,maximumFractionDigits:2})+' ฿';
  const label = obj => (obj && (obj[language] || obj.en || obj.th)) || '';
  const feature = (key, fallback=false) => typeof cfg?.event?.feature_flags?.[key] === 'boolean' ? cfg.event.feature_flags[key] : fallback;
  const apiUrl = action => cfg0.SUPABASE_URL+'/functions/v1/restart-registration-api?action='+encodeURIComponent(action);
  const eventSlug = new URLSearchParams(location.search).get('event') || '';

  async function api(action, options={}) {
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), action==='register'?60000:20000);
    try{
      const res = await fetch(apiUrl(action)+(action==='config'?'&slug='+encodeURIComponent(eventSlug):''),{
        method:options.method||'GET',signal:controller.signal,
        headers:{apikey:cfg0.PUBLISHABLE_KEY,...(options.body instanceof FormData?{}:{'Content-Type':'application/json'})},
        body:options.body==null?undefined:options.body instanceof FormData?options.body:JSON.stringify(options.body)
      });
      const data = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.error||'Request failed');
      return data;
    }finally{clearTimeout(timer);}
  }

  function applyTheme(){
    const th=cfg.event.theme||{};
    const root=document.documentElement;
    const map={primary:'--event-primary',secondary:'--event-secondary',background:'--event-bg',surface:'--event-surface',text:'--event-text',muted:'--event-muted',accent:'--event-accent'};
    Object.keys(map).forEach(k=>{if(th[k])root.style.setProperty(map[k],th[k]);});
    document.title=cfg.event.name+' · RESTART';$('#payNextLink').href='payment.html?event='+encodeURIComponent(eventSlug);
  }
  function isOpen(){
    if(cfg.event.status!=='OPEN') return false;
    const now=Date.now(),o=cfg.event.registration_opens_at?new Date(cfg.event.registration_opens_at).getTime():null,c=cfg.event.registration_closes_at?new Date(cfg.event.registration_closes_at).getTime():null;
    return (!o||now>=o)&&(!c||now<=c);
  }
  function eventTranslation(){
    return (cfg.translations||[]).find(x=>x.language===language)||null;
  }
  function renderEventMedia(){
    const rows=cfg.media||[],gallery=rows.filter(x=>x.media_type==='GALLERY'),sponsors=rows.filter(x=>x.media_type==='SPONSOR'),backgrounds=rows.filter(x=>x.media_type==='BACKGROUND');
    const section=$('#eventMediaSection');
    const showGallery=feature('media',true)&&gallery.length,showSponsors=feature('sponsor_logos',true)&&sponsors.length;
    section.classList.toggle('hidden',!(showGallery||showSponsors));
    $('#eventGallery').innerHTML=showGallery?gallery.map(x=>'<img class="event-gallery-img" src="'+esc(x.url)+'" alt="'+esc(label(x.alt_text)||cfg.event.name)+'">').join(''):'';
    $('#sponsorLogos').innerHTML=showSponsors?sponsors.map(x=>'<img class="sponsor-logo" src="'+esc(x.url)+'" alt="'+esc(label(x.alt_text)||'Sponsor')+'">').join(''):'';
    if(backgrounds.length&&feature('media',true)){
      document.body.style.backgroundImage='linear-gradient(#100d1dcc,#100d1ddd),url("'+String(backgrounds[0].url).replace(/"/g,'%22')+'")';
      document.body.style.backgroundSize='cover';document.body.style.backgroundAttachment='fixed';
    }
  }
  function renderHero(){
    const tr=eventTranslation();
    $('#heroTitle').textContent=tr?.name||cfg.event.name;
    $('#heroStatus').textContent=isOpen()?t('open'):t('closed');
    $('#heroMeta').textContent=[cfg.event.event_date_start,cfg.event.event_date_end,tr?.location_name||cfg.event.location_name].filter(Boolean).join(' · ');
    if(cfg.event.banner_url){$('#heroBanner').src=cfg.event.banner_url;$('#heroBanner').classList.remove('hidden');}
    if(cfg.event.logo_url){$('#heroLogo').src=cfg.event.logo_url;$('#heroLogo').classList.remove('hidden');}
    $('#closedBox').classList.toggle('hidden',isOpen());
    if(!isOpen()) $('#closedBox').textContent=t('closed');
    $('#submitBtn').disabled=!isOpen();
  }
  function renderLanguage(){
    const langs=(cfg.event.languages?.length?cfg.event.languages:['th']).filter(x=>I18N[x]);
    if(!langs.includes(language))language=cfg.event.default_language||langs[0];
    $('#language').innerHTML=langs.map(l=>'<option value="'+l+'">'+({th:'ไทย',en:'English',zh:'中文',ja:'日本語',ru:'Русский'}[l]||l)+'</option>').join('');
    $('#language').value=language;
    document.documentElement.lang=language;
  }
  function currentCategoryPrice(c){
    if(!c)return 0;
    const base=Number(c.base_price_thb||0);
    if(!feature('early_bird',false)||c.early_bird_price_thb==null)return base;
    const now=Date.now(),s=c.early_bird_starts_at?new Date(c.early_bird_starts_at).getTime():null,e=c.early_bird_ends_at?new Date(c.early_bird_ends_at).getTime():null;
    return (!s||now>=s)&&(!e||now<=e)?Number(c.early_bird_price_thb):base;
  }
  function totalPrice(){
    const base=currentCategoryPrice(selectedCategory);
    if(!selectedPackage)return base;
    return selectedPackage.price_mode==='OVERRIDE'?Number(selectedPackage.price_value_thb||0):base+Number(selectedPackage.price_value_thb||0);
  }
  function categoryEligibleFromDom(cat){
    const blocks=all('.runner-block');if(!blocks.length)return false;
    return blocks.every(block=>{
      if(cat.min_age!=null||cat.max_age!=null){
        const birth=block.querySelector('[name="birth_date"]')?.value||'';if(!birth)return false;
        const age=ageOnEvent(birth);if(age==='')return false;
        if(cat.min_age!=null&&Number(age)<Number(cat.min_age))return false;
        if(cat.max_age!=null&&Number(age)>Number(cat.max_age))return false;
      }
      if(cat.gender_rule==='MALE'||cat.gender_rule==='FEMALE'){
        const raw=(block.querySelector('[name="gender"]')?.value||'').toUpperCase();
        const gender=['M','MALE','MAN','ชาย','ผู้ชาย'].includes(raw)?'MALE':['F','FEMALE','WOMAN','หญิง','ผู้หญิง'].includes(raw)?'FEMALE':raw;
        if(gender!==cat.gender_rule)return false;
      }
      return true;
    });
  }
  function renderCategoryCards(){
    const rows=cfg.categories||[],self=feature('self_select_category',true);
    $('#categories').innerHTML=rows.map(c=>{
      const ages=c.min_age==null&&c.max_age==null?'':(c.min_age==null?'≤ '+c.max_age:c.max_age==null?'≥ '+c.min_age:c.min_age+'–'+c.max_age);
      return '<button type="button" '+(!self?'disabled':'')+' class="choice-card '+(selectedCategory?.id===c.id?'selected':'')+'" data-category="'+c.id+'"><strong>'+esc(label(c.name)||c.code)+'</strong><span class="price">'+money(currentCategoryPrice(c))+'</span><small>'+[c.distance_km!=null?c.distance_km+' KM':'',ages,c.gender_rule==='ANY'?'':c.gender_rule].filter(Boolean).join(' · ')+'</small></button>';
    }).join('');
  }
  function autoPickCategoryFromForm(){
    if(!feature('auto_category',false))return;
    const rows=cfg.categories||[],matches=rows.filter(categoryEligibleFromDom);
    if(!matches.length)return;
    const next=matches[0];
    if(selectedCategory?.id===next.id)return;
    selectedCategory=next;
    if(selectedPackage?.category_id&&selectedPackage.category_id!==next.id)selectedPackage=null;
    renderCategoryCards();renderPackages(true);renderPayment();
  }
  function renderCategories(){
    const section=$('#categorySection'),rows=(cfg.categories||[]);
    section.classList.toggle('hidden',!feature('competition_categories',true)||!rows.length);
    if(section.classList.contains('hidden')){selectedCategory=null;renderPackages();return;}
    const auto=feature('auto_category',false),self=feature('self_select_category',true);
    if(!auto||self){if(!selectedCategory||!rows.some(x=>x.id===selectedCategory.id))selectedCategory=rows[0];}
    else if(selectedCategory&&!rows.some(x=>x.id===selectedCategory.id))selectedCategory=null;
    renderCategoryCards();
    if(auto&&!self&&!selectedCategory){
      $('#categoryHint').textContent=language==='th'?'กรอกวันเกิด/เพศ ระบบจะเลือกรุ่นให้อัตโนมัติ':t('categoryHint');
    }
    renderPackages();
  }
  function availablePackages(){
    return (cfg.packages||[]).filter(p=>!p.category_id||p.category_id===selectedCategory?.id);
  }
  function renderPackages(skipRunners=false){
    const rows=availablePackages(), section=$('#packageSection');
    section.classList.toggle('hidden',!feature('packages',true)||!rows.length);
    if(section.classList.contains('hidden')) selectedPackage=null;
    else{
      if(!selectedPackage||!rows.some(x=>x.id===selectedPackage.id))selectedPackage=rows[0];
      $('#packages').innerHTML=rows.map(p=>'<button type="button" class="choice-card '+(selectedPackage?.id===p.id?'selected':'')+'" data-package="'+p.id+'"><strong>'+esc(label(p.name)||p.code)+'</strong><span class="price">'+money(p.price_mode==='OVERRIDE'?p.price_value_thb:currentCategoryPrice(selectedCategory)+Number(p.price_value_thb||0))+'</span><small>ผู้แข่งขัน '+p.runner_count+(p.follower_count?' · ผู้ติดตาม '+p.follower_count:'')+'</small></button>').join('');
    }
    if(!skipRunners)renderRunners();
    renderPayment();
  }
  function fieldOptions(f){
    if(Array.isArray(f.options)&&f.options.length)return f.options;
    if(f.field_key==='blood_group')return ['A','B','AB','O'].map(v=>({value:v,label:{th:v,en:v,zh:v,ja:v,ru:v}}));
    if(f.field_key==='shirt_size')return ['SS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL'].map(v=>({value:v,label:{th:v,en:v,zh:v,ja:v,ru:v}}));
    if(f.field_key==='prefix')return [
      {value:'mr',label:{th:'นาย',en:'Mr.',zh:'先生',ja:'Mr.',ru:'Г-н'}},
      {value:'ms',label:{th:'นางสาว',en:'Ms.',zh:'女士',ja:'Ms.',ru:'Г-жа'}},
      {value:'mrs',label:{th:'นาง',en:'Mrs.',zh:'女士',ja:'Mrs.',ru:'Г-жа'}}
    ];
    return [];
  }
  function inputHtml(f,runnerNo){
    const id='r'+runnerNo+'_'+f.field_key, req=f.is_required?'required':'', l=label(f.label)||f.field_key;
    if(f.field_key==='age')return '<label class="field"><span>'+esc(l)+'</span><input id="'+id+'" name="'+f.field_key+'" type="number" readonly></label>';
    if(f.field_type==='textarea'||f.field_type==='address')return '<label class="field '+(f.field_type==='address'?'span-all':'')+'"><span>'+esc(l)+'</span><textarea id="'+id+'" name="'+f.field_key+'" '+req+'></textarea></label>';
    if(['select','radio'].includes(f.field_type)){
      const opts=fieldOptions(f);
      return '<label class="field"><span>'+esc(l)+'</span><select id="'+id+'" name="'+f.field_key+'" '+req+'><option value="">—</option>'+opts.map(o=>'<option value="'+esc(o.value)+'">'+esc(label(o.label)||o.value)+'</option>').join('')+'</select></label>';
    }
    if(f.field_type==='checkbox')return '<label class="checkbox-row"><input id="'+id+'" name="'+f.field_key+'" type="checkbox"> '+esc(l)+'</label>';
    const type={number:'number',date:'date',tel:'tel',email:'email'}[f.field_type]||'text';
    return '<label class="field"><span>'+esc(l)+'</span><input id="'+id+'" name="'+f.field_key+'" type="'+type+'" '+req+'></label>';
  }
  function renderRunners(){
    const count=selectedPackage?Number(selectedPackage.runner_count||1):1, fields=(cfg.fields||[]).filter(f=>f.is_active!==false);
    $('#runners').innerHTML=Array.from({length:count},(_,i)=>'<div class="runner-block" data-runner="'+(i+1)+'"><h3>'+esc(t('runner'))+' '+(i+1)+'</h3><div class="form-grid">'+fields.map(f=>inputHtml(f,i+1)).join('')+'</div></div>').join('');
    all('input[name="birth_date"]').forEach(input=>{input.addEventListener('change',updateAge);input.addEventListener('change',autoPickCategoryFromForm);});
    all('select[name="gender"], input[name="gender"]').forEach(input=>input.addEventListener('change',autoPickCategoryFromForm));
    renderBeneficiaries();
    autoPickCategoryFromForm();
  }
  function ageOnEvent(dateStr){
    if(!dateStr)return '';
    const d=new Date(dateStr+'T00:00:00'), e=new Date((cfg.event.event_date_start||new Date().toISOString().slice(0,10))+'T00:00:00');
    let age=e.getFullYear()-d.getFullYear();const m=e.getMonth()-d.getMonth();if(m<0||(m===0&&e.getDate()<d.getDate()))age--;return age>=0?age:'';
  }
  function updateAge(e){
    const runner=e.target.closest('.runner-block');if(!runner)return;const age=runner.querySelector('input[name="age"]');if(age)age.value=ageOnEvent(e.target.value);
  }
  function beneficiaryCard(index=0){
    return '<div class="beneficiary-card"><div class="form-grid">'+
      '<label class="field"><span>'+esc(t('beneName'))+'</span><input name="bene_full_name" required></label>'+
      '<label class="field"><span>'+esc(t('idDoc'))+'</span><input name="bene_id" required></label>'+
      '<label class="field span-all"><span>'+esc(t('address'))+'</span><textarea name="bene_address"></textarea></label>'+
      '<label class="field"><span>'+esc(t('phone'))+'</span><input name="bene_phone" type="tel"></label>'+
      '<label class="field"><span>'+esc(t('relation'))+'</span><input name="bene_relation" required></label>'+
      '<label class="field"><span>'+esc(t('percent'))+'</span><input name="bene_percent" type="number" min="0.01" max="100" step="0.01" value="'+(index===0?'100':'')+'" required></label>'+
      '</div><div class="beneficiary-actions"><span class="subtle"></span><button type="button" class="small-button danger remove-bene">'+esc(t('remove'))+'</button></div></div>';
  }
  function renderBeneficiaries(){
    const enabled=feature('insurance',true), section=$('#insuranceSection');section.classList.toggle('hidden',!enabled);if(!enabled)return;
    const count=selectedPackage?Number(selectedPackage.runner_count||1):1;
    $('#beneficiaryGroups').innerHTML=Array.from({length:count},(_,i)=>'<div class="beneficiary-group" data-runner="'+(i+1)+'"><h3>'+esc(t('runner'))+' '+(i+1)+'</h3><div class="beneficiary-items">'+beneficiaryCard(0)+'</div><div class="beneficiary-actions"><span class="bene-total"></span><button type="button" class="small-button add-bene">'+esc(t('addBene'))+'</button></div></div>').join('');
    updateBeneficiaryTotals();
  }
  function updateBeneficiaryTotals(){
    all('.beneficiary-group').forEach(g=>{
      const total=[...g.querySelectorAll('[name="bene_percent"]')].reduce((n,x)=>n+Number(x.value||0),0);
      const el=g.querySelector('.bene-total');el.textContent=t('total')+': '+total.toFixed(total%1?2:0)+'%';el.className='bene-total '+(Math.abs(total-100)<0.001?'percent-ok':'percent-bad');
    });
  }
  function choosePlan(){
    const rows=(cfg.installment_plans||[]).filter(p=>(!p.category_id||p.category_id===selectedCategory?.id)&&(!p.package_id||p.package_id===selectedPackage?.id));
    return rows.sort((a,b)=>(Number(!!b.category_id)+Number(!!b.package_id))-(Number(!!a.category_id)+Number(!!a.package_id))||Number(b.priority||0)-Number(a.priority||0))[0]||null;
  }
  function buildSchedule(total){
    if(paymentMode==='FULL')return [{installment_no:1,amount_due_thb:total,due_at:new Date().toISOString()}];
    const plan=choosePlan();if(!plan)return [];
    const count=Math.max(2,Math.min(12,Number(plan.installment_count||3))),steps=(cfg.installment_steps||[]).filter(s=>s.plan_id===plan.id),rows=Array.from({length:count},(_,i)=>{
      const s=steps.find(x=>Number(x.installment_no)===i+1)||{};let mode=s.amount_mode||'AUTO',value=s.amount_value==null?null:Number(s.amount_value);
      if(i===0&&Number(plan.first_payment_thb||0)>0&&mode==='AUTO'){mode='FIXED';value=Number(plan.first_payment_thb);}
      return {installment_no:i+1,mode,value,due_at:s.due_at||null,amount_due_thb:0};
    });
    let assigned=0,remainder=-1,auto=[];
    rows.forEach((r,i)=>{if(r.mode==='FIXED'){r.amount_due_thb=Math.max(0,Number(r.value||0));assigned+=r.amount_due_thb;}else if(r.mode==='PERCENT'){r.amount_due_thb=Math.round(total*Number(r.value||0))/100;assigned+=r.amount_due_thb;}else if(r.mode==='REMAINDER'&&remainder<0)remainder=i;else auto.push(i);});
    let rem=Math.round((total-assigned)*100)/100;
    if(remainder>=0){rows[remainder].amount_due_thb=rem;rem=0;}else if(auto.length){let cents=Math.round(rem*100),base=Math.floor(cents/auto.length),left=cents-base*auto.length;auto.forEach(i=>rows[i].amount_due_thb=(base+(left-->0?1:0))/100);rem=0;}
    if(Math.abs(rem)>0.001)rows[rows.length-1].amount_due_thb+=rem;
    return rows.map(r=>({installment_no:r.installment_no,amount_due_thb:Math.round(r.amount_due_thb*100)/100,due_at:r.due_at}));
  }
  function renderPayment(){
    const modes=[];if(feature('full_payment',true))modes.push(['FULL',t('full')]);if(feature('installments',false)&&selectedCategory?.installment_enabled!==false&&choosePlan())modes.push(['INSTALLMENT',t('installment')]);
    if(!modes.some(x=>x[0]===paymentMode))paymentMode=modes[0]?.[0]||'FULL';
    $('#paymentModes').innerHTML=modes.map(x=>'<label><input type="radio" name="payment_mode" value="'+x[0]+'" '+(paymentMode===x[0]?'checked':'')+'><span>'+esc(x[1])+'</span></label>').join('');
    const schedule=buildSchedule(totalPrice());
    $('#schedule').innerHTML=schedule.map(s=>'<div class="schedule-item"><span>งวด '+s.installment_no+(s.due_at?' · '+new Intl.DateTimeFormat(language==='th'?'th-TH':'en-US',{dateStyle:'medium',timeZone:'Asia/Bangkok'}).format(new Date(s.due_at)):'')+'</span><strong>'+money(s.amount_due_thb)+'</strong></div>').join('');
    $('#dueNow').textContent=money(schedule[0]?.amount_due_thb||0);
    renderPaymentMethods(schedule[0]?.amount_due_thb||0);
    $('#slipField').classList.toggle('hidden',!(feature('slip_upload',true)&&totalPrice()>0));
    $('#slip').required=feature('slip_upload',true)&&totalPrice()>0;
    $('#consentRow').classList.toggle('hidden',!feature('pdpa',true));$('#consent').required=feature('pdpa',true);
    $('#submitBtn').textContent=t('submit');
  }

  function tlv(id,value){return id+String(value.length).padStart(2,'0')+value;}
  function crc16(s){
    let crc=0xFFFF;for(let c=0;c<s.length;c++){crc^=s.charCodeAt(c)<<8;for(let i=0;i<8;i++)crc=(crc&0x8000)?((crc<<1)^0x1021):(crc<<1);crc&=0xFFFF;}return crc.toString(16).toUpperCase().padStart(4,'0');
  }
  function promptPayPayload(id,type,amount){
    const clean=String(id||'').replace(/\D/g,'');let proxy;
    if(type==='PHONE'){const nine=clean.replace(/^66/,'').replace(/^0/,'').slice(-9);proxy=tlv('01','0066'+nine);}
    else if(type==='NATIONAL_ID')proxy=tlv('02',clean.slice(0,13));
    else proxy=tlv('03',clean);
    const merchant=tlv('00','A000000677010111')+proxy;
    let data=tlv('00','01')+tlv('01','12')+tlv('29',merchant)+tlv('53','764');
    if(Number(amount)>0)data+=tlv('54',Number(amount).toFixed(2));
    data+=tlv('58','TH')+'6304';return data+crc16(data);
  }
  function renderPaymentMethods(amount){
    const box=$('#paymentMethods'),methods=(cfg.payment_methods||[]);
    box.innerHTML=methods.map((m,i)=>{
      if(m.kind==='BANK')return '<div class="pay-card"><small>'+esc(t('bank'))+'</small><h3>'+esc(m.bank_name||'')+'</h3><p>'+esc(m.account_name||'')+'</p><div class="copy-line"><code>'+esc(m.account_number||'')+'</code><button type="button" class="copy-button" data-copy="'+esc(m.account_number||'')+'">'+esc(t('copy'))+'</button></div></div>';
      return '<div class="pay-card"><small>PromptPay</small><h3>'+esc(m.label||'PromptPay')+'</h3><div class="copy-line"><code>'+esc(m.promptpay_id||'')+'</code><button type="button" class="copy-button" data-copy="'+esc(m.promptpay_id||'')+'">'+esc(t('copy'))+'</button></div>'+(m.qr_enabled?'<div class="qr-target" data-qr="'+i+'"></div>':'')+'</div>';
    }).join('');
    methods.forEach((m,i)=>{if(m.kind==='PROMPTPAY'&&m.qr_enabled&&m.promptpay_id&&window.QRCode){const target=box.querySelector('[data-qr="'+i+'"]');if(target){const wrap=document.createElement('div');wrap.id='qrCode';target.appendChild(wrap);new QRCode(wrap,{text:promptPayPayload(m.promptpay_id,m.promptpay_type||'PHONE',amount),width:180,height:180,correctLevel:QRCode.CorrectLevel.M});}}});
  }

  function collectAnswers(block){
    const answers={};(cfg.fields||[]).filter(f=>f.is_active!==false).forEach(f=>{const el=block.querySelector('[name="'+CSS.escape(f.field_key)+'"]');if(!el)return;answers[f.field_key]=el.type==='checkbox'?el.checked:el.value;});
    return answers;
  }
  function collectBeneficiaries(group){
    return [...group.querySelectorAll('.beneficiary-card')].map(c=>({full_name:c.querySelector('[name="bene_full_name"]').value.trim(),address:c.querySelector('[name="bene_address"]').value.trim(),id_document:c.querySelector('[name="bene_id"]').value.trim(),phone:c.querySelector('[name="bene_phone"]').value.trim(),relationship:c.querySelector('[name="bene_relation"]').value.trim(),percentage:Number(c.querySelector('[name="bene_percent"]').value||0)}));
  }
  async function submit(e){
    e.preventDefault();if(!isOpen())return alerts.notice('warning','แจ้งเตือน',t('closed'));
    const form=e.currentTarget;
    if(!form.checkValidity()){form.reportValidity();return;}
    if(feature('insurance',true)){let invalid=false;all('.beneficiary-group').forEach(g=>{const total=[...g.querySelectorAll('[name="bene_percent"]')].reduce((n,x)=>n+Number(x.value||0),0);if(feature('beneficiary_total_100',true)&&Math.abs(total-100)>0.001)invalid=true;});if(invalid)return alerts.notice('warning','ผู้รับผลประโยชน์','เปอร์เซ็นต์ของแต่ละผู้สมัครต้องรวม 100%');}
    const runners=all('.runner-block').map((b,i)=>({runner_index:i+1,answers:collectAnswers(b),beneficiaries:feature('insurance',true)?collectBeneficiaries(document.querySelector('.beneficiary-group[data-runner="'+(i+1)+'"]')):[]}));
    const schedule=buildSchedule(totalPrice()),data={event_slug:eventSlug,category_id:selectedCategory?.id||null,package_id:selectedPackage?.id||null,payment_mode:paymentMode,language,runners,amount_confirmed_thb:schedule[0]?.amount_due_thb||0};
    const fd=new FormData();fd.append('data',JSON.stringify(data));if($('#slip').files[0])fd.append('slip',$('#slip').files[0]);
    try{
      alerts.loading('กำลังส่งใบสมัคร…');
      const out=await api('register',{method:'POST',body:fd});
      alerts.close();
      await alerts.fire({icon:'success',title:t('success'),html:'<p>'+esc(t('code'))+'</p><h2 style="letter-spacing:.04em">'+esc(out.registration_code)+'</h2><p>ยอดสมัคร '+esc(money(out.total_amount_thb))+'</p>',confirmButtonText:'ตกลง',allowOutsideClick:false});
      location.href='events.html';
    }catch(err){alerts.close();alerts.notice('error','ส่งใบสมัครไม่สำเร็จ',err.message||String(err));}
  }

  function translateStatic(){
    const map={categoryTitle:'category',categoryHint:'categoryHint',packageTitle:'package',packageHint:'packageHint',participantTitle:'participants',participantHint:'participantHint',insuranceTitle:'insurance',insuranceHint:'insuranceHint',paymentTitle:'payment',paymentHint:'paymentHint',dueLabel:'due',slipLabel:'slip',consentLabel:'consent'};
    Object.keys(map).forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=t(map[id]);});
    $('#payNextLink').textContent=language==='th'?'ชำระงวดถัดไป':language==='en'?'Next installment':language==='zh'?'支付下一期':language==='ja'?'次回分割払い':'Следующий платеж';
  }
  function renderStatic(){
    translateStatic();renderHero();renderEventMedia();renderCategories();renderPayment();
  }
  async function init(){
    try{
      if(!eventSlug)throw new Error('ไม่พบ Event');
      cfg=await api('config');
      language=localStorage.getItem('restart_language')||cfg.event.default_language||'th';
      renderLanguage();applyTheme();renderStatic();
      $('#loading').classList.add('hidden');$('#app').classList.remove('hidden');
    }catch(err){$('#loading').textContent=err.message||String(err);}
  }

  $('#language').addEventListener('change',e=>{language=e.target.value;localStorage.setItem('restart_language',language);renderLanguage();renderStatic();});
  $('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b||!feature('self_select_category',true))return;selectedCategory=(cfg.categories||[]).find(x=>x.id===b.dataset.category)||null;selectedPackage=null;renderCategories();});
  $('#packages').addEventListener('click',e=>{const b=e.target.closest('[data-package]');if(!b)return;selectedPackage=(cfg.packages||[]).find(x=>x.id===b.dataset.package)||null;renderPackages();});
  $('#paymentModes').addEventListener('change',e=>{if(e.target.name==='payment_mode'){paymentMode=e.target.value;renderPayment();}});
  $('#beneficiaryGroups').addEventListener('click',e=>{const add=e.target.closest('.add-bene'),remove=e.target.closest('.remove-bene');if(add){const g=add.closest('.beneficiary-group');g.querySelector('.beneficiary-items').insertAdjacentHTML('beforeend',beneficiaryCard(g.querySelectorAll('.beneficiary-card').length));updateBeneficiaryTotals();}if(remove){const g=remove.closest('.beneficiary-group');if(g.querySelectorAll('.beneficiary-card').length>1){remove.closest('.beneficiary-card').remove();updateBeneficiaryTotals();}}});
  $('#beneficiaryGroups').addEventListener('input',updateBeneficiaryTotals);
  $('#paymentMethods').addEventListener('click',async e=>{const b=e.target.closest('[data-copy]');if(!b)return;try{await navigator.clipboard.writeText(b.dataset.copy||'');alerts.toast('success',t('copied'));}catch{alerts.notice('warning','Clipboard','ไม่สามารถคัดลอกอัตโนมัติได้');}});
  $('#registrationForm').addEventListener('submit',submit);
  document.addEventListener('DOMContentLoaded',init);
})();