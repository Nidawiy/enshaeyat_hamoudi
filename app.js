import { validateSnapshot } from './snapshot.js';

const $=id=>document.getElementById(id);
const AR='٠١٢٣٤٥٦٧٨٩',norm=s=>String(s||'').replace(/[٠-٩]/g,c=>AR.indexOf(c)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').normalize('NFKC').toLowerCase().trim();
const money=v=>v==null?'—':new Intl.NumberFormat('en-US').format(v);
const fmt=i=>new Intl.DateTimeFormat('ar-IQ',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Baghdad'}).format(new Date(i));
const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('catalog-viewer',1);r.onupgradeneeded=()=>r.result.createObjectStore('s');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function stored(mode, value){
  const d=await open();
  try{return await new Promise((resolve,reject)=>{
    const t=d.transaction('s',mode), store=t.objectStore('s');
    const request=mode==='readonly'?store.get('snap'):store.put(value,'snap');
    t.oncomplete=()=>resolve(mode==='readonly'?request.result||null:undefined);
    t.onabort=()=>reject(t.error||new Error('تعذر حفظ نسخة العرض. بقيت النسخة السابقة محفوظة.'));
    t.onerror=()=>reject(t.error);
  })}finally{d.close()}
}
const load=()=>stored('readonly'),save=value=>stored('readwrite',value);

let S=null,cat='',sub='',busy=false;
function chipRow(el,rows,cur){el.replaceChildren();for(const [id,n,c] of rows){const b=document.createElement('button');b.className='chip'+(id===cur?' on':'');b.dataset.id=id;b.append(n);const i=document.createElement('i');i.textContent=c;b.append(i);el.append(b)}}
function render(){
  if(!S){$('meta').textContent='';$('chips').innerHTML='';$('chips2').innerHTML='';$('list').innerHTML='<div class="empty">لا توجد أسعار بعد.<br>أرسل ملف نسخة العرض من الماك (AirDrop) ثم افتحه هنا.<br><button class="pick" id="pick">اختيار الملف</button></div>';$('pick').onclick=()=>$('file').click();return}
  const cn=Object.fromEntries(S.categories.map(c=>[c.id,c.name])),sn=Object.fromEntries(S.subcategories.map(c=>[c.id,c.name]));
  const cnt=f=>S.products.filter(f).length;
  chipRow($('chips'),[['','الكل',S.products.length],...S.categories.map(c=>[c.id,c.name,cnt(p=>p.categoryId===c.id)])],cat);
  const subs=cat?S.subcategories.filter(x=>x.categoryId===cat):[];
  chipRow($('chips2'),subs.length?[['','الكل',cnt(p=>p.categoryId===cat)],...subs.map(x=>[x.id,x.name,cnt(p=>p.subcategoryId===x.id)])]:[],sub);
  const terms=norm($('q').value).split(/\s+/).filter(Boolean);
  const items=S.products.filter(p=>(!cat||p.categoryId===cat)&&(!sub||p.subcategoryId===sub)&&terms.every(t=>norm([p.name,p.brand,p.model,p.unit,cn[p.categoryId],sn[p.subcategoryId]].join(' ')).includes(t)));
  $('meta').textContent=`${items.length} منتج · آخر تحديث للأسعار: ${fmt(S.exportedAt)}`;
  const L=$('list');L.textContent='';
  if(!items.length){L.innerHTML='<div class="empty">لا توجد نتائج.</div>';return}
  for(const p of items.slice(0,300)){
    const d=document.createElement('div');d.className='card';
    const n=document.createElement('div');n.className='nm';n.textContent=p.name;
    const s=document.createElement('div');s.className='sub';s.textContent=[p.brand,p.model,cn[p.categoryId],sn[p.subcategoryId],p.unit&&p.unit!=='غير محدد'?p.unit:''].filter(Boolean).join(' · ');
    const r=document.createElement('div');r.className='pr';
    for(const [l,v] of [['جملة',p.wholesale],['مفرد',p.retail],['كارتون',p.cartonPrice]]){if(l!=='مفرد'&&(S.public||(l==='كارتون'&&v==null)))continue;const x=document.createElement('div');x.innerHTML='<small></small><b></b>';x.firstChild.textContent=l;x.lastChild.textContent=money(v);r.append(x)}
    d.append(n,s,r);L.append(d)}
  if(items.length>300){const m=document.createElement('div');m.className='meta';m.textContent='عُرض أول 300 نتيجة. ضيّق البحث لعرض الباقي.';L.append(m)}
}
$('q').addEventListener('input',render);
const hit=e=>e.target.closest('.chip');
$('chips').addEventListener('click',e=>{const b=hit(e);if(b){cat=b.dataset.id;sub='';render();scrollTo(0,0)}});
$('chips2').addEventListener('click',e=>{const b=hit(e);if(b){sub=b.dataset.id;render();scrollTo(0,0)}});
$('file').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f||busy)return;busy=true;$('file').disabled=true;
  try{if(f.size>30e6)throw Error('الملف أكبر من المتوقع.');const n=validateSnapshot(JSON.parse(await f.text()));
    if(S&&Date.parse(n.exportedAt)<Date.parse(S.exportedAt)&&!confirm('هذه النسخة أقدم من المحفوظة على الجهاز. استبدالها؟'))return;
    await save(n);S=n;cat='';sub='';render();alert(`تم التحديث: ${n.products.length} منتج.`)}catch(x){alert(x.message||'تعذر قراءة الملف.')}finally{busy=false;$('file').disabled=false}});
// زر صغير لتحديث النسخة يظهر في أسفل القائمة
const foot=document.createElement('div');foot.className='meta';foot.innerHTML='<button class="chip" id="upd">تحديث الأسعار من ملف</button>';document.body.append(foot);$('upd').onclick=()=>$('file').click();
// نسخة النشر العام: يقرأ catalog.json من الموقع نفسه ويعتمده إن كان أحدث من المحفوظ.
async function remote(){try{const r=await fetch('catalog.json',{cache:'no-cache'});if(!r.ok)return;const n=validateSnapshot(await r.json());
  if(!S||Date.parse(n.exportedAt)>Date.parse(S.exportedAt)){await save(n);S=n;cat='';sub=''}
  if(S.public)foot.remove();render()}catch(e){}}
load().then(v=>{S=v?validateSnapshot(v):null;render();remote()}).catch(()=>{render();$('meta').textContent='تعذر قراءة النسخة المحفوظة. يمكنك اختيار ملف نسخة عرض صالح.';remote()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
