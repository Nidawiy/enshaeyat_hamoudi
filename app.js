import { validateSnapshot } from './snapshot.js';

const $=id=>document.getElementById(id);
const AR='٠١٢٣٤٥٦٧٨٩',norm=s=>String(s||'').replace(/[٠-٩]/g,c=>AR.indexOf(c)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').normalize('NFKC').toLowerCase().trim();
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

const PAGE=60;
let S=null,cat='',sub='',loading=true,shown=PAGE;
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
const mainPrice=p=>p.retail;
// الموقع للزبائن: يقبل نسخة العرض العامة فقط ويحذف أي سعر غير سعر المفرد.
const publicOnly=n=>n.public?{...n,products:n.products.map(p=>({...p,wholesale:null,cartonPrice:null,piecesCount:null}))}:null;
function chipRow(box,rows,cur){box.replaceChildren();for(const [id,n,c] of rows){if(id&&!c&&id!==cur)continue;const b=el('button','chip'+(id===cur?' on':''),n);b.type='button';b.dataset.id=id;b.setAttribute('aria-pressed',id===cur);b.append(el('i','',c));box.append(b)}}
function emptyState(icon,title,text){const d=el('div','empty');d.append(el('span','ic',icon),el('b','',title));if(text)d.append(text);return d}
function price(label,v,big){const d=el('div','p'+(v==null?' na':''));if(label)d.append(el('small','',label));
  if(v==null&&big)d.append(el('b','','السعر عند الطلب'));else{d.append(el('b','',money(v)));if(v!=null)d.append(el('em','','د.ع'))}return d}
function card(p,cn,sn){
  const d=el('article','card');d.append(el('div','nm',p.name));
  const tags=el('div','tags');
  if(p.brand)tags.append(el('span','br',p.brand));
  if(p.model)tags.append(el('span','',p.model));
  if(!cat&&cn[p.categoryId])tags.append(el('span','',cn[p.categoryId]));
  if(!sub&&sn[p.subcategoryId])tags.append(el('span','',sn[p.subcategoryId]));
  if(tags.childElementCount)d.append(tags);
  const r=el('div','pr'),unit=p.unit&&p.unit!=='غير محدد'?p.unit:'';
  r.append(price('',p.retail,true));
  if(unit)r.append(el('span','u','لكل '+unit));
  d.append(r);return d;
}
function sorted(items){
  const k=$('sort').value;if(!k)return items;
  if(k==='name')return [...items].sort((a,b)=>a.name.localeCompare(b.name,'ar'));
  const dir=k==='asc'?1:-1;
  return [...items].sort((a,b)=>{const x=mainPrice(a),y=mainPrice(b);return x==null?(y==null?0:1):y==null?-1:(x-y)*dir});
}
function render(){
  const L=$('list');
  if(!S){$('chips').replaceChildren();$('chips2').replaceChildren();$('count').textContent='';$('upd-at').textContent='قائمة الأسعار';
    if(loading){$('meta').textContent='';L.replaceChildren(...Array.from({length:6},()=>el('div','skel')));L.className='grid';return}
    $('meta').textContent='';L.className='';
    L.replaceChildren(emptyState('📋','الأسعار غير متاحة حالياً','تواصل معنا لمعرفة الأسعار.'));return}
  const cn=Object.fromEntries(S.categories.map(c=>[c.id,c.name])),sn=Object.fromEntries(S.subcategories.map(c=>[c.id,c.name]));
  const cnt=f=>S.products.filter(f).length;
  chipRow($('chips'),[['','الكل',S.products.length],...S.categories.map(c=>[c.id,c.name,cnt(p=>p.categoryId===c.id)])],cat);
  const subs=cat?S.subcategories.filter(x=>x.categoryId===cat):[];
  chipRow($('chips2'),subs.length?[['','الكل',cnt(p=>p.categoryId===cat)],...subs.map(x=>[x.id,x.name,cnt(p=>p.subcategoryId===x.id)])]:[],sub);
  $('upd-at').replaceChildren('آخر تحديث للأسعار: ',el('b','',fmt(S.exportedAt)));
  const terms=norm($('q').value).split(/\s+/).filter(Boolean);
  const items=sorted(S.products.filter(p=>(!cat||p.categoryId===cat)&&(!sub||p.subcategoryId===sub)&&terms.every(t=>norm([p.name,p.brand,p.model,p.unit,cn[p.categoryId],sn[p.subcategoryId]].join(' ')).includes(t))));
  $('count').textContent=`${items.length} منتج`;$('meta').textContent='';
  if(!items.length){L.className='';L.replaceChildren(emptyState('🔍','لا توجد نتائج',terms.length?'جرّب كلمة أخرى أو اختر قسماً مختلفاً.':''));return}
  const g=el('div','grid');for(const p of items.slice(0,shown))g.append(card(p,cn,sn));
  L.className='';L.replaceChildren(g);
  if(items.length>shown){const m=el('button','more',`عرض المزيد (${items.length-shown} متبقٍ)`);m.type='button';m.onclick=()=>{shown+=PAGE;render()};L.append(m)}
}
const reset=()=>{shown=PAGE;render()};
let qt;$('q').addEventListener('input',()=>{$('clr').classList.toggle('on',!!$('q').value);clearTimeout(qt);qt=setTimeout(reset,120)});
$('clr').onclick=()=>{$('q').value='';$('clr').classList.remove('on');reset();$('q').focus()};
$('sort').addEventListener('change',reset);
const hit=e=>e.target.closest('.chip');
const toMenu=()=>{const y=$('menu').getBoundingClientRect().top+scrollY;if(scrollY>y)scrollTo(0,y)};
$('chips').addEventListener('click',e=>{const b=hit(e);if(b){cat=b.dataset.id;sub='';reset();toMenu();b.scrollIntoView({block:'nearest',inline:'center'})}});
$('chips2').addEventListener('click',e=>{const b=hit(e);if(b){sub=b.dataset.id;reset();toMenu()}});
$('top').onclick=()=>$('menu').scrollIntoView({behavior:'smooth'});
addEventListener('scroll',()=>$('top').classList.toggle('on',$('menu').getBoundingClientRect().top<-600),{passive:true});
// نسخة النشر العام: يقرأ catalog.json من الموقع نفسه ويعتمده إن كان أحدث من المحفوظ.
async function remote(){try{const r=await fetch('catalog.json',{cache:'no-cache'});if(!r.ok)return;const n=publicOnly(validateSnapshot(await r.json()));if(!n)return;
  if(!S||Date.parse(n.exportedAt)>Date.parse(S.exportedAt)){S=n;cat='';sub='';shown=PAGE;await save(n).catch(()=>{})}}catch(e){}
  finally{loading=false;render()}}
load().then(v=>{S=v?publicOnly(validateSnapshot(v)):null;if(S)loading=false;render();remote()}).catch(()=>{render();remote()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
