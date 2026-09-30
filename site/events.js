(() => {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = v => v ? new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeZone:'Asia/Bangkok'}).format(new Date(v+'T00:00:00+07:00')) : '';
  async function init(){
    try{
      const cfg=window.RRIH_CONFIG;
      const client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.PUBLISHABLE_KEY);
      const {data,error}=await client.from('restart_events').select('slug,name,description,location_name,event_date_start,event_date_end,status,logo_url,banner_url,theme').in('status',['PUBLISHED','OPEN','CLOSED']).order('event_date_start',{ascending:true});
      if(error) throw error;
      document.querySelector('#loading').classList.add('hidden');
      const grid=document.querySelector('#eventGrid');
      if(!data?.length){
        grid.innerHTML='<div class="panel"><h2>ยังไม่มี Event ที่เปิดเผยแพร่</h2><p class="muted">กรุณาตรวจสอบอีกครั้งภายหลัง</p></div>';
        return;
      }
      grid.innerHTML=data.map(e=>{
        const accent=e.theme?.accent||'#ffb097';
        const status=e.status==='OPEN'?'เปิดรับสมัคร':e.status==='CLOSED'?'ปิดรับสมัคร':'รายละเอียด Event';
        const dates=[fmt(e.event_date_start),fmt(e.event_date_end)].filter(Boolean).join(' – ');
        return '<a class="event-card" href="register.html?event='+encodeURIComponent(e.slug)+'" style="--event-accent:'+esc(accent)+'">'+
          '<div class="event-cover">'+(e.banner_url?'<img src="'+esc(e.banner_url)+'" alt="'+esc(e.name)+'">':e.logo_url?'<img style="object-fit:contain;padding:28px" src="'+esc(e.logo_url)+'" alt="'+esc(e.name)+'">':'<span class="brand-mark">R</span>')+'</div>'+
          '<div class="event-card-body"><span class="eyebrow">'+esc(status)+'</span><h2>'+esc(e.name)+'</h2>'+
          '<div class="event-badges">'+(dates?'<span class="event-badge">'+esc(dates)+'</span>':'')+(e.location_name?'<span class="event-badge">'+esc(e.location_name)+'</span>':'')+'</div>'+
          (e.description?'<p>'+esc(e.description)+'</p>':'')+
          '<strong style="color:'+esc(accent)+'">ดูรายละเอียด / สมัคร →</strong></div></a>';
      }).join('');
    }catch(err){
      document.querySelector('#loading').textContent='โหลด Event ไม่สำเร็จ: '+(err?.message||err);
    }
  }
  document.addEventListener('DOMContentLoaded',init);
})();