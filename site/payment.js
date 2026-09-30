(() => {
'use strict';
const $=s=>document.querySelector(s),cfg0=window.RRIH_CONFIG,alerts=window.RRIHAlerts;
const slug=new URLSearchParams(location.search).get('event')||'';
let cfg=null,lookup=null,language=localStorage.getItem('restart_language')||'th';
const TEXT={
 th:{back:'กลับหน้าสมัคร',hint:'ใช้เลขบัตรประชาชน/Passport พร้อมรหัสสมัคร เพื่อปกป้องข้อมูลของผู้สมัคร',id:'เลขบัตรประชาชน / Passport',code:'รหัสสมัคร',search:'ค้นหาใบสมัคร',total:'ยอดสมัคร',slip:'แนบสลิปชำระเงิน',submit:'ส่งสลิปงวดนี้',complete:'ชำระครบทุกงวดแล้ว',installment:'งวด',bank:'ธนาคาร',copy:'คัดลอก',copied:'คัดลอกแล้ว',waiting:'รอตรวจสลิป'},
 en:{back:'Back to registration',hint:'Use your ID/passport and registration code to securely access installment status.',id:'ID / Passport',code:'Registration code',search:'Find registration',total:'Registration total',slip:'Upload payment slip',submit:'Submit this installment slip',complete:'All installments are paid',installment:'Installment',bank:'Bank',copy:'Copy',copied:'Copied',waiting:'Pending slip review'},
 zh:{back:'返回报名',hint:'请使用身份证/护照和报名编号安全查询分期付款状态。',id:'身份证 / 护照',code:'报名编号',search:'查询报名',total:'报名总额',slip:'上传付款凭证',submit:'提交本期付款凭证',complete:'所有分期已支付',installment:'第',bank:'银行',copy:'复制',copied:'已复制',waiting:'付款凭证待审核'},
 ja:{back:'申込へ戻る',hint:'ID/パスポートと申込番号を使って安全に分割払い状況を確認できます。',id:'ID / パスポート',code:'申込番号',search:'申込を検索',total:'申込合計',slip:'支払証明をアップロード',submit:'この回の支払証明を送信',complete:'すべての支払いが完了しました',installment:'第',bank:'銀行',copy:'コピー',copied:'コピーしました',waiting:'確認待ち'},
 ru:{back:'Назад к регистрации',hint:'Для безопасного просмотра рассрочки используйте ID/паспорт и код регистрации.',id:'ID / Паспорт',code:'Код регистрации',search:'Найти заявку',total:'Сумма регистрации',slip:'Загрузить подтверждение оплаты',submit:'Отправить подтверждение платежа',complete:'Все платежи оплачены',installment:'Платеж',bank:'Банк',copy:'Копировать',copied:'Скопировано',waiting:'Ожидает проверки'}
};
const t=k=>(TEXT[language]||TEXT.th)[k]||k;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('th-TH',{maximumFractionDigits:2})+' ฿';
const api=async(action,{method='GET',body}={})=>{
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),30000);
 try{
  const url=cfg0.SUPABASE_URL+'/functions/v1/restart-registration-api?action='+encodeURIComponent(action)+(action==='config'?'&slug='+encodeURIComponent(slug):'');
  const r=await fetch(url,{method,signal:ctl.signal,headers:{apikey:cfg0.PUBLISHABLE_KEY,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body==null?undefined:body instanceof FormData?body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'ดำเนินการไม่สำเร็จ');return data;
 }finally{clearTimeout(timer);}
};
function applyLanguage(){
 document.documentElement.lang=language;$('#language').value=language;
 const tr=(cfg.translations||[]).find(x=>x.language===language)||null;
 $('#eventName').textContent=tr?.name||cfg.event.name;$('#backRegister').textContent=t('back');$('#lookupHint').textContent=t('hint');$('#idLabel').textContent=t('id');$('#codeLabel').textContent=t('code');$('#lookupButton').textContent=t('search');$('#totalLabel').textContent=t('total');$('#slipLabel').textContent=t('slip');$('#submitPaymentButton').textContent=t('submit');$('#complete').textContent=t('complete');
}
function applyTheme(){
 const th=cfg.event.theme||{},root=document.documentElement,map={background:'--event-bg',surface:'--event-surface',text:'--event-text',accent:'--event-accent',secondary:'--event-secondary'};
 Object.keys(map).forEach(k=>{if(th[k])root.style.setProperty(map[k],th[k]);});
 $('#backRegister').href='register.html?event='+encodeURIComponent(slug);document.title=(cfg.event.name||'RESTART')+' · Payment';applyLanguage();
}
function crc16(s){let crc=0xFFFF;for(let c=0;c<s.length;c++){crc^=s.charCodeAt(c)<<8;for(let i=0;i<8;i++)crc=(crc&0x8000)?((crc<<1)^0x1021):(crc<<1);crc&=0xFFFF;}return crc.toString(16).toUpperCase().padStart(4,'0');}
function tlv(id,v){return id+String(v.length).padStart(2,'0')+v;}
function ppPayload(id,type,amount){
 const clean=String(id||'').replace(/\D/g,'');let proxy;
 if(type==='PHONE'){const nine=clean.replace(/^66/,'').replace(/^0/,'').slice(-9);proxy=tlv('01','0066'+nine);}
 else if(type==='NATIONAL_ID')proxy=tlv('02',clean.slice(0,13));else proxy=tlv('03',clean);
 const merchant=tlv('00','A000000677010111')+proxy;
 let data=tlv('00','01')+tlv('01','12')+tlv('29',merchant)+tlv('53','764');
 if(Number(amount)>0)data+=tlv('54',Number(amount).toFixed(2));
 data+=tlv('58','TH')+'6304';return data+crc16(data);
}
function renderMethods(amount){
 const methods=cfg.payment_methods||[];
 $('#methods').innerHTML=methods.map((m,i)=>{
  if(m.kind==='BANK')return '<div class="pay-card"><small>'+esc(t('bank'))+'</small><h3>'+esc(m.bank_name||'')+'</h3><p>'+esc(m.account_name||'')+'</p><div class="copy-line"><code>'+esc(m.account_number||'')+'</code><button type="button" class="copy-button" data-copy="'+esc(m.account_number||'')+'">'+esc(t('copy'))+'</button></div></div>';
  return '<div class="pay-card"><small>PromptPay</small><h3>'+esc(m.label||'PromptPay')+'</h3><div class="copy-line"><code>'+esc(m.promptpay_id||'')+'</code><button type="button" class="copy-button" data-copy="'+esc(m.promptpay_id||'')+'">'+esc(t('copy'))+'</button></div>'+(m.qr_enabled?'<div class="qr-target" data-qr="'+i+'"></div>':'')+'</div>';
 }).join('');
 methods.forEach((m,i)=>{if(m.kind==='PROMPTPAY'&&m.qr_enabled&&m.promptpay_id&&window.QRCode){const t=$('[data-qr="'+i+'"]');if(t){const q=document.createElement('div');q.id='qrCode';t.appendChild(q);new QRCode(q,{text:ppPayload(m.promptpay_id,m.promptpay_type||'PHONE',amount),width:180,height:180,correctLevel:QRCode.CorrectLevel.M});}}});
}
function renderLookup(){
 $('#result').classList.remove('hidden');$('#personName').textContent=lookup.participant_name;$('#totalAmount').textContent=money(lookup.total_amount_thb);
 $('#summary').textContent=lookup.registration_code+' · '+lookup.payment_mode+' · '+lookup.registration_status;
 $('#scheduleList').innerHTML=(lookup.schedules||[]).map(s=>'<div class="status-line"><span>'+esc(t('installment'))+' '+s.installment_no+(s.due_at?' · '+new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeZone:'Asia/Bangkok'}).format(new Date(s.due_at)):'')+'</span><span><strong>'+money(s.amount_due_thb)+'</strong> · '+esc(s.status)+'</span></div>').join('');
 const next=(lookup.schedules||[]).find(s=>s.id===lookup.next_schedule_id);
 $('#complete').classList.toggle('hidden',!!next);
 $('#nextBlock').classList.toggle('hidden',!next);
 if(next){$('#nextTitle').textContent=t('installment')+' '+next.installment_no+' · '+money(next.amount_due_thb)+(next.status==='PENDING_REVIEW'?' · '+t('waiting'):'');$('#payForm').classList.toggle('hidden',!lookup.can_submit);renderMethods(next.amount_due_thb);}
}
$('#language').addEventListener('change',e=>{language=e.target.value;localStorage.setItem('restart_language',language);applyLanguage();if(lookup)renderLookup();});
$('#lookupForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!e.currentTarget.checkValidity()){e.currentTarget.reportValidity();return;}
 try{alerts.loading('กำลังค้นหาใบสมัคร…');lookup=await api('lookup',{method:'POST',body:{event_slug:slug,id_document:$('#idDocument').value.trim(),registration_code:$('#registrationCode').value.trim()}});alerts.close();renderLookup();}
 catch(err){alerts.close();alerts.notice('error','ค้นหาไม่สำเร็จ',err.message);}
});
$('#payForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!lookup?.next_schedule_id)return;const file=$('#slip').files[0];if(!file){alerts.notice('warning','กรุณาแนบสลิป');return;}
 const fd=new FormData();fd.append('event_slug',slug);fd.append('id_document',$('#idDocument').value.trim());fd.append('registration_code',$('#registrationCode').value.trim());fd.append('schedule_id',lookup.next_schedule_id);fd.append('slip',file);
 try{alerts.loading('กำลังส่งสลิป…');await api('submit-payment',{method:'POST',body:fd});lookup=await api('lookup',{method:'POST',body:{event_slug:slug,id_document:$('#idDocument').value.trim(),registration_code:$('#registrationCode').value.trim()}});alerts.close();renderLookup();await alerts.notice('success','ส่งสลิปแล้ว','สถานะเป็นรอตรวจสอบจาก Admin');}
 catch(err){alerts.close();alerts.notice('error','ส่งสลิปไม่สำเร็จ',err.message);}
});
$('#methods').addEventListener('click',async e=>{const b=e.target.closest('[data-copy]');if(!b)return;try{await navigator.clipboard.writeText(b.dataset.copy||'');alerts.toast('success',t('copied'));}catch{alerts.notice('warning','Clipboard','กรุณาคัดลอกด้วยตนเอง');}});
document.addEventListener('DOMContentLoaded',async()=>{
 try{if(!slug)throw new Error('ไม่พบ Event');cfg=await api('config');applyTheme();}catch(err){document.querySelector('main').innerHTML='<div class="wrap panel">'+esc(err.message||err)+'</div>';}
});
})();