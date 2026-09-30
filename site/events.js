(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TEXT={
    th:{title:'เลือก EVENT ที่ต้องการสมัคร',hint:'ระบบสมัครกลางของ RESTART',admin:'สำหรับเจ้าหน้าที่',open:'เปิดรับสมัคร',closed:'ปิดรับสมัคร',detail:'รายละเอียด Event',cta:'ดูรายละเอียด / สมัคร →',empty:'ยังไม่มี Event ที่เปิดเผยแพร่'},
    en:{title:'Choose an EVENT to register',hint:'RESTART central registration platform',admin:'Staff',open:'Registration open',closed:'Registration closed',detail:'Event details',cta:'View details / Register →',empty:'No published events yet'},
    zh:{title:'选择要报名的 EVENT',hint:'RESTART 统一报名系统',admin:'工作人员',open:'开放报名',closed:'报名已关闭',detail:'活动详情',cta:'查看详情 / 报名 →',empty:'暂无公开活动'},
    ja:{title:'参加する EVENT を選択',hint:'RESTART 共通申込システム',admin:'スタッフ',open:'受付中',closed:'受付終了',detail:'イベント詳細',cta:'詳細 / 申込 →',empty:'公開中のイベントはありません'},
    ru:{title:'Выберите EVENT для регистрации',hint:'Единая система регистрации RESTART',admin:'Для сотрудников',open:'Регистрация открыта',closed:'Регистрация закрыта',detail:'Описание события',cta:'Подробнее / Регистрация →',empty:'Нет опубликованных событий'}
  };
  let language=localStorage.getItem('restart_language')||'th',events=[],translations=[];
  const t=k=>(TEXT[language]||TEXT.th)[k]||k;
  const fmt=v=>v?new Intl.DateTimeFormat(language==='th'?'th-TH':language==='zh'?'zh-CN':language==='ja'?'ja-JP':language==='ru'?'ru-RU':'en-US',{dateStyle:'medium',timeZone:'Asia/Bangkok'}).format(new Date(v+'T00:00:00+07:00')):'';
  const trFor=e=>translations.find(x=>x.event_id===e.id&&x.language===language)||null;
  function render(){
    document.documentElement.lang=language;document.querySelector('#language').value=language;
    document.querySelector('#pageTitle').textContent=t('title');document.querySelector('#pageHint').textContent=t('hint');document.querySelector('#adminLink').textContent=t('admin');
    const grid=document.querySelector('#eventGrid');
    if(!events.length){grid.innerHTML='<div class="panel"><h2>'+esc(t('empty'))+'</h2></div>';return;}
    grid.innerHTML=events.map(e=>{
      const tr=trFor(e),name=tr?.name||e.name,desc=tr?.description||e.description,location=tr?.location_name||e.location_name,accent=e.theme?.accent||'#ffb097';
      const status=e.status==='OPEN'?t('open'):e.status==='CLOSED'?t('closed'):t('detail'),dates=[fmt(e.event_date_start),fmt(e.event_date_end)].filter(Boolean).join(' – ');
      return '<a class="event-card" href="register.html?event='+encodeURIComponent(e.slug)+'" style="--event-accent:'+esc(accent)+'">'+
        '<div class="event-cover">'+(e.banner_url?'<img src="'+esc(e.banner_url)+'" alt="'+esc(name)+'">':e.logo_url?'<img style="object-fit:contain;padding:28px" src="'+esc(e.logo_url)+'" alt="'+esc(name)+'">':'<span class="brand-mark">R</span>')+'</div>'+
        '<div class="event-card-body"><span class="eyebrow">'+esc(status)+'</span><h2>'+esc(name)+'</h2><div class="event-badges">'+(dates?'<span class="event-badge">'+esc(dates)+'</span>':'')+(location?'<span class="event-badge">'+esc(location)+'</span>':'')+'</div>'+(desc?'<p>'+esc(desc)+'</p>':'')+'<strong style="color:'+esc(accent)+'">'+esc(t('cta'))+'</strong></div></a>';
    }).join('');
  }
  async function init(){
    try{
      const cfg=window.RRIH_CONFIG,client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.PUBLISHABLE_KEY);
      const q=await client.from('restart_events').select('id,slug,name,description,location_name,event_date_start,event_date_end,status,logo_url,banner_url,theme').in('status',['PUBLISHED','OPEN','CLOSED']).order('event_date_start',{ascending:true});
      if(q.error)throw q.error;events=q.data||[];
      if(events.length){const tq=await client.from('restart_event_translations').select('event_id,language,name,description,location_name').in('event_id',events.map(e=>e.id));if(tq.error)throw tq.error;translations=tq.data||[];}
      document.querySelector('#loading').classList.add('hidden');render();
    }catch(err){document.querySelector('#loading').textContent='โหลด Event ไม่สำเร็จ: '+(err?.message||err);}
  }
  document.querySelector('#language').addEventListener('change',e=>{language=e.target.value;localStorage.setItem('restart_language',language);render();});
  document.addEventListener('DOMContentLoaded',init);
})();