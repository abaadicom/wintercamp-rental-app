/* Winter Camp remote contract workflow v120. No privileged key in browser. */
(()=>{'use strict';
const SETTINGS='wk_public_supabase_v120';
const $=s=>document.querySelector(s);
const escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DEFAULT_CONFIG={"url": "https://tgafpdgfbynlcdoruqzu.supabase.co", "key": "sb_publishable_pQuupeVfhucyvuy_ptJKew_6xGp2Vb3"};
const config=()=>{try{return {...DEFAULT_CONFIG,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')}}catch{return {...DEFAULT_CONFIG}}};
const setConfig=x=>localStorage.setItem(SETTINGS,JSON.stringify(x));
let session=null;
const SESSION_KEY='wk_admin_session_v124';
// Store only a short-lived session for the current browser tab; never store a password.
try {
  const saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
  if(saved?.access_token && saved?.refresh_token) session=saved;
} catch { /* storage may be unavailable */ }
function rememberSession(s){
  session=s;
  try { sessionStorage.setItem(SESSION_KEY,JSON.stringify(s)); } catch {}
}
function forgetSession(){
  session=null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}
async function silentAuth(){
  const c=config();
  if(!validate(c)||!session?.access_token) return null;
  if(session.expires_at>Date.now()/1000+90) return session.access_token;
  if(!session.refresh_token){forgetSession();return null;}
  try {
    const r=await fetch(c.url+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST',
      headers:{'Content-Type':'application/json',apikey:c.key},
      body:JSON.stringify({refresh_token:session.refresh_token})
    });
    const data=await r.json();
    if(!r.ok||!data.access_token) {forgetSession();return null;}
    rememberSession({access_token:data.access_token,refresh_token:data.refresh_token,
      expires_at:Math.floor(Date.now()/1000)+Number(data.expires_in||3600)});
    return session.access_token;
  } catch {return null;}
}

function validate(c){return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(c.url||'') && /^(sb_publishable_|eyJ)/.test(c.key||'')}
function setup(){const c=config();openModal('ربط Supabase — إعداد لمرة واحدة',`<div class="wc-contract-form"><p>أدخل عنوان مشروع Supabase ومفتاح <b>publishable / anon</b> العام فقط. لا تدخل service_role أو secret key.</p><label>Project URL<input id="wkUrl" dir="ltr" placeholder="https://xxxx.supabase.co" value="${escHtml(c.url)}"></label><label>Publishable / anon key<input id="wkKey" dir="ltr" type="text" value="${escHtml(c.key)}"></label><div class="card-actions"><button class="small-btn primary" id="wkCfgSave">حفظ الاتصال</button></div></div>`);$('#wkCfgSave').onclick=()=>{const x={url:$('#wkUrl').value.trim().replace(/\/$/,''),key:$('#wkKey').value.trim()};if(!validate(x)){toast('تحقق من رابط المشروع والمفتاح العام فقط');return}setConfig(x);closeModal();toast('تم حفظ إعداد الاتصال العام')};}
async function auth(){const c=config();if(!validate(c)){setup();return null}const existing=await silentAuth();if(existing)return existing;
return new Promise(resolve=>{openModal('دخول مدير العقود',`<div class="wc-contract-form"><p>تسجيل الدخول مطلوب لإصدار الروابط فقط، ولا يؤثر على فتح البرنامج.</p><label>البريد الإلكتروني<input id="wkEmail" type="email" autocomplete="username"></label><label>كلمة المرور<input id="wkPass" type="password" autocomplete="current-password"></label><div class="card-actions"><button id="wkLogin" class="small-btn primary">دخول</button><button id="wkSettings" class="small-btn">إعدادات الاتصال</button></div><p id="wkLoginMsg"></p></div>`);$('#wkSettings').onclick=()=>{setup();resolve(null)};$('#wkLogin').onclick=async()=>{const btn=$('#wkLogin');btn.disabled=true;try{const r=await fetch(c.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key},body:JSON.stringify({email:$('#wkEmail').value.trim(),password:$('#wkPass').value})});const data=await r.json();if(!r.ok||!data.access_token)throw Error(data.error_description||data.msg||'فشل الدخول');rememberSession({access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(data.expires_in||3600)});closeModal();resolve(session.access_token);queueMicrotask(checkPendingContracts)}catch(e){$('#wkLoginMsg').textContent=e.message;btn.disabled=false}}})}
async function call(fn,body){const token=await auth();if(!token)return null;return callWithToken(fn,body,token)}
async function callWithToken(fn,body,token){
  const c=config();
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(c.url+'/functions/v1/'+fn,{
      method:'POST',
      headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+token},
      body:JSON.stringify(body),signal:controller.signal,cache:'no-store'
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.error)throw Error(data.error||'HTTP '+response.status);
    return data;
  }catch(err){
    if(err.name==='AbortError')throw Error('انتهت مهلة الاتصال بالخادم');
    throw err;
  }finally{clearTimeout(timer);}
}
const find=id=>db.contracts?.find(x=>String(x.bookingId)===String(id));
const booking=id=>db.bookings?.find(x=>String(x.id)===String(id));
function whatsapp(phone,number,url){const digits=String(phone).replace(/\D/g,'');const to=digits.startsWith('0')?'966'+digits.slice(1):digits.startsWith('966')?digits:'966'+digits;const message=`مرحبًا، نرجو مراجعة عقد تأجير المعدات الصوتية من Winter Camp رقم ${number} واعتماده عبر الرابط الخاص التالي (صالح لمدة 72 ساعة):\n${url}\nيرجى عدم مشاركة الرابط مع الآخرين.`;window.open('https://wa.me/'+to+'?text='+encodeURIComponent(message),'_blank','noopener')}
async function send(id){const c=find(id),b=booking(id);if(!c||!b)return toast('العقد أو الحجز غير موجود');if(c.status==='remote_approved')return toast('هذا العقد معتمد بالفعل');if(c.status==='remote_sent'){openModal('رابط العقد '+escHtml(c.contractNumber),`<div class="wc-contract-form"><p>العقد بانتظار موافقة العميل.</p><div class="card-actions"><button id="wkRefresh" class="small-btn primary">تحديث حالة العقد</button><button id="wkResend" class="small-btn">إعادة فتح واتساب</button></div></div>`);$('#wkRefresh').onclick=()=>refresh(id);$('#wkResend').onclick=()=>{if(!c.remoteUrl)return toast('الرابط غير محفوظ على هذا الجهاز');whatsapp(c.phone,c.contractNumber,c.remoteUrl)};return}
if(c.status!=='pending_remote')return toast('احفظ مسودة التوقيع عن بُعد أولًا');if(!confirm('إصدار عقد رسمي برقم من Supabase ورابط توقيع خاص؟'))return;
try{const result=await call('wk-contract-issue',{booking_id:String(b.id),customer_name:c.name,customer_phone:c.phone,customer_id_number:c.nationalId,equipment_details:String(b.device||''),terms:c.terms,contract_details:{returnAt:c.returnAt,notes:c.notes,bookingDate:b.date,location:b.location,agreed:b.agreed,paid:b.paid}});if(!result)return;const prev={...c};Object.assign(c,{contractNumber:result.number,remoteId:result.contract_id,remoteUrl:result.signing_url,remoteExpires:result.expires_at,status:'remote_sent'});try{save()}catch(e){Object.assign(c,prev);throw Error('تم إنشاء العقد في الخادم لكن تعذر حفظ بياناته محليًا؛ لا تصدر عقدًا جديدًا قبل استعادة الرابط')};closeModal();go('contracts');whatsapp(c.phone,c.contractNumber,c.remoteUrl);toast('تم إصدار '+c.contractNumber+' وفتح واتساب')}catch(e){toast(e.message);alert(e.message)}}
async function refresh(id){const c=find(id);if(!c?.remoteId)return toast('لم يصدر العقد بعد');try{const result=await call('wk-contract-status',{contract_id:c.remoteId});if(!result)return;if(result.status==='approved'){c.status='remote_approved';c.signedAt=result.approved_at;c.approvalMethod=result.approval_method;c.signature=result.approval_method==='signature'?(result.signature_data||''):'';try{save()}catch(e){console.warn('Could not save contract signature locally',e);toast('تم الاعتماد، وتعذر حفظ التوقيع محليًا؛ يمكن استرجاعه من الخادم')}announceApproval(c);closeModal();go('contracts')}else toast('حالة العقد: '+(result.status==='pending'?'بانتظار موافقة العميل':result.status))}catch(e){toast(e.message);alert(e.message)}}

// Optional notifications: request permission only after an explicit user click.
const ALERT_KEY='wk_approved_alerts_v125';
function getAlerts(){try{return JSON.parse(localStorage.getItem(ALERT_KEY)||'[]')}catch{return []}}
function storeAlert(contract){
  const current=getAlerts();
  if(current.some(x=>x.id===contract.remoteId))return;
  current.unshift({id:contract.remoteId,number:contract.contractNumber,at:new Date().toISOString()});
  try{localStorage.setItem(ALERT_KEY,JSON.stringify(current.slice(0,15)))}catch{}
}
function announceApproval(contract){
  storeAlert(contract);
  toast('✓ تم توقيع واعتماد العقد '+contract.contractNumber);
  // Browser notifications are best-effort and only while the app is running.
  if('Notification' in window && Notification.permission==='granted'){
    try{new Notification('Winter Camp — تم توقيع العقد',{
      body:'تم اعتماد العقد '+contract.contractNumber+' من العميل',
      tag:'wk-'+contract.remoteId
    })}catch{}
  }
}
function notificationsPanel(){
  const list=getAlerts();
  return `<div class="wk-approval-alert" role="status">🔔 إشعارات العقود
    <small>${list.length?'آخر اعتماد: '+escHtml(list[0].number):'سيظهر هنا إشعار عند اكتشاف اعتماد عقد جديد.'}</small>
    <button type="button" class="small-btn" data-wk-notifications style="margin-top:8px">تفعيل إشعارات المتصفح</button>
    <button type="button" class="small-btn" data-wk-login-check style="margin-top:8px">تسجيل دخول المدير / فحص الآن</button>
  </div>`;
}
document.addEventListener('click',async e=>{
  if(e.target.closest('[data-wk-notifications]')){
    if(!('Notification' in window))return toast('إشعارات المتصفح غير متاحة هنا. إشعارات البرنامج تعمل عند فتحه.');
    try{
      const p=await Notification.requestPermission();
      toast(p==='granted'?'تم تفعيل إشعارات المتصفح أثناء تشغيل البرنامج':'يمكنك متابعة إشعارات الاعتماد داخل البرنامج');
    }catch{toast('تعذر تفعيل إشعارات المتصفح على هذا الجهاز')}
  }
  if(e.target.closest('[data-wk-login-check]')){
    e.preventDefault();
    const btn=e.target.closest('[data-wk-login-check]');
    if(btn.disabled)return;
    btn.disabled=true;
    const original=btn.textContent;
    btn.textContent='جاري فحص العقود…';
    try {
      const token=await auth();
      if(!token)return;
      const candidates=(db.contracts||[]).filter(c=>c.remoteId &&
        (c.status==='remote_sent'||c.status==='remote_approved'));
      if(!candidates.length){toast('تم تسجيل الدخول، ولا توجد عقود إلكترونية للفحص على هذا الجهاز');return;}
      let approved=0,changed=false,failed=0;
      for(const contract of candidates){
        try{
          const result=await callWithToken('wk-contract-status',{contract_id:contract.remoteId},token);
          if(result.status==='approved'){
            const signature=result.approval_method==='signature'?(result.signature_data||''):'';
            if(contract.status!=='remote_approved'||contract.signature!==signature)changed=true;
            contract.status='remote_approved';
            contract.signedAt=result.approved_at;
            contract.approvalMethod=result.approval_method;
            contract.signature=signature;
            approved++;
          }
        }catch(err){failed++;console.warn('Contract status check failed',err);}
      }
      if(changed){
        try{save()}catch(err){toast('تم جلب العقود لكن تعذر حفظها محليًا');}
        go('contracts');
      }
      if(failed)alert('تم فحص '+(candidates.length-failed)+' عقد، وتعذر الاتصال بشأن '+failed+' عقد. تحقق من إعدادات Supabase وصلاحيات مدير العقود.');
      else toast('اكتمل الفحص: '+approved+' عقد معتمد من أصل '+candidates.length);
    }catch(err){alert('تعذر فحص العقود: '+(err.message||String(err)));}
    finally{btn.disabled=false;btn.textContent=original;}
  }
});

// Automatic status updates while this app is open. No background login prompts.
let polling=false;
let lastCheck=0;
async function checkPendingContracts(){
  if(polling||document.hidden||!navigator.onLine) return;
  const pending=(db.contracts||[]).filter(c=>c.status==='remote_sent'&&c.remoteId);
  if(!pending.length) return;
  const token=await silentAuth();
  if(!token) return;
  const c=config();
  polling=true;
  try {
    let changed=false;
    const newlyApproved=[];
    for(const contract of pending){
      try {
        const response=await fetch(c.url+'/functions/v1/wk-contract-status',{
          method:'POST',
          headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+token},
          body:JSON.stringify({contract_id:contract.remoteId}),
          cache:'no-store'
        });
        if(response.status===401||response.status===403){
          // Stop silent checks if permission is revoked or the session is invalid.
          if(response.status===401)forgetSession();
          break;
        }
        if(!response.ok)continue;
        const result=await response.json();
        if(result.status==='approved'){
          contract.status='remote_approved';
          contract.signedAt=result.approved_at;
          contract.approvalMethod=result.approval_method;
          contract.signature=result.approval_method==='signature'?(result.signature_data||''):'';
          changed=true;
          newlyApproved.push(contract);
        }
      }catch{/* Network errors are retried on the next check. */}
    }
    if(changed){
      try{save()}catch(e){console.warn('Could not save remote contract status',e);return;}
      newlyApproved.forEach(contract=>announceApproval(contract));
      if(currentPage==='contracts')go('contracts');
    }
  } finally {polling=false;lastCheck=Date.now();}
}
// Checks are throttled and only run when the page is visible and a manager session exists.
setInterval(()=>{if(Date.now()-lastCheck>=12000)checkPendingContracts();},12000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkPendingContracts();});
window.addEventListener('focus',checkPendingContracts);
window.addEventListener('online',checkPendingContracts);
setTimeout(checkPendingContracts,1500);
document.addEventListener('click',e=>{const el=e.target.closest('[data-wk-remote]');if(el){e.preventDefault();send(el.dataset.wkRemote)}});
async function getApproved(id){return call('wk-contract-status',{contract_id:id});}
window.WKRemote={setup,refresh,getApproved,notificationsPanel,checkPendingContracts};
})();
