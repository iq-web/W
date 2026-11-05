/* تاج عدن — المنطق الكامل: المتجر (السلة، المنتجات، العروض، السلايدر، الثيم) ثم لوحة الإدارة.
   الإعدادات والبيانات: storage-config.js · الحركات والتأثيرات: motion.js */
(() => {
'use strict';
const CONFIG=window.TAJ_CONFIG;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePtr=matchMedia('(hover:hover) and (pointer:fine)').matches;
const P=CONFIG.products,C=CONFIG.categories;
const byId=id=>P.find(p=>p.id===id);
const catOf=id=>C.find(c=>c.id===id);
const normAr=s=>String(s||'').toLowerCase().replace(/[\u064B-\u065F]/g,'').replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
const normPhone=s=>String(s||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g,'');
const validPhone=p=>/^07\d{9}$/.test(p);
const validName=n=>String(n||'').trim().length>=2;
const intlWa=phone=>{const n=normPhone(phone||CONFIG.contact.whatsapp);return n.startsWith('07')?'964'+n.slice(1):n};
const waLink=(text,phone)=>`https://wa.me/${intlWa(phone)}${text?`?text=${encodeURIComponent(text)}`:''}`;
const contactNumbers=()=>[...new Set([CONFIG.contact.whatsapp,CONFIG.contact.whatsapp2].filter(Boolean))];
const contactChoices=(name,selected)=>`<fieldset class="contact-choice"><legend>اختار رقم التواصل — تاج عدن</legend>${contactNumbers().map((phone,index)=>`<label><input type="radio" name="${esc(name)}" value="${esc(phone)}" ${phone===(selected||CONFIG.contact.whatsapp)?'checked':''}><span>واتساب ${index+1}</span><b class="num">${esc(phone)}</b></label>`).join('')}</fieldset>`;

/* ---------- أيقونات الفئات ---------- */
const IC={
  kitchen:"M14 28h36v16a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8z M9 33h5 M50 33h5 M24 28v-4a8 8 0 0 1 16 0v4 M28 18h8 M27 12q3-4 0-7 M37 12q3-4 0-7",
  coffee:"M12 26h30v14a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12z M42 30h3a6 6 0 0 1 0 12h-3 M21 18q3-4 0-8 M29 18q3-4 0-8 M37 18q3-4 0-8 M10 56h36",
  cooling:"M20 8h24a3 3 0 0 1 3 3v42a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z M17 28h30 M24 16v6 M24 36v10",
  bakery:"M16 36h32l-4 20H20z M14 36a8 8 0 0 1 8-8 10 10 0 0 1 20 0 8 8 0 0 1 8 8z M32 18v-5 M27 42v9 M32 42v9 M37 42v9",
  furniture:"M22 8h20l2 24H20z M17 32h30v6H17z M22 38v18 M42 38v18 M26 46h12",
  serving:"M8 46h48 M12 46a20 20 0 0 1 40 0 M32 26v-5 M28 21h8 M6 52h52",
  packaging:"M10 22l22-10 22 10v26L32 58 10 48z M10 22l22 10 22-10 M32 32v26 M21 17l22 10",
  pos:"M10 12h44a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z M24 54h16 M32 42v12 M18 22h14 M18 30h28"
};
const icon=(n,c='')=>`<svg class="i ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const ico=cat=>`<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="${IC[cat]||IC.kitchen}"/></svg>`;
const hues=[['#4B381A','#17120A'],['#6B5124','#241B0D'],['#8A6A30','#302311']];
function art(p,withImg=true){
  const i=P.indexOf(p),h=hues[i%hues.length];
  const src=(p.images&&p.images.length?p.images[Math.min(p.featured||0,p.images.length-1)]:p.photo)||'';
  const img=withImg&&src?`<img class="pimg" src="${esc(src)}" alt="${esc(p.name)}" loading="lazy">`:'';
  return `<span class="art" style="--c1:${h[0]};--c2:${h[1]}"><span class="wm" aria-hidden="true">ج</span><span class="ico">${ico(p.cat)}</span>${img}</span>`;
}
document.addEventListener('error',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('pimg'))t.remove()},true);
document.addEventListener('load',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('pimg'))t.classList.add('loaded')},true);

/* ---------- المخزن ---------- */
let cart={};
function loadCart(){try{const r=JSON.parse(localStorage.getItem('ta_cart')||'{}');Object.keys(r).forEach(id=>{const q=Number(r[id]);if(byId(id)&&q>0)cart[id]=clamp(Math.floor(q),1,99)})}catch{cart={}}}
function saveCart(){try{localStorage.setItem('ta_cart',JSON.stringify(cart))}catch{}}
const cartCount=()=>Object.values(cart).reduce((a,b)=>a+b,0);

/* ---------- عدّ تصاعدي ---------- */
function animNum(el,to,suffix,dur){
  if(!el)return;
  const from=Number(el.dataset.v||0);
  el.dataset.v=String(to);
  if(reduced||from===to){el.textContent=String(Math.round(to));return}
  const t0=performance.now(),d=dur||700;
  const step=t=>{
    const k=clamp((t-t0)/d,0,1),e=1-Math.pow(1-k,3),v=from+(to-from)*e;
    el.textContent=String(Math.round(v));
    if(k<1)requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- الطبقات (سلة / عرض سريع) ---------- */
const app=$('#app'),overlay=$('#overlay');
let active=null,lastFocus=null;
function focusables(root){return $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',root).filter(x=>x.offsetParent!==null)}
function openLayer(el,trigger){
  if(active&&active!==el)closeLayer(true);
  if(!lastFocus||!active)lastFocus=trigger||document.activeElement;
  active=el;
  el.classList.add('open');el.setAttribute('aria-hidden','false');
  overlay.classList.add('open');app.inert=true;document.body.classList.add('lock');
  setTimeout(()=>{const f=focusables(el).find(x=>!x.classList.contains('close')&&!x.matches('[data-act="close"]'))||el;f.focus({preventScroll:true})},60);
}
function closeLayer(skip){
  if(!active)return;
  active.classList.remove('open');active.setAttribute('aria-hidden','true');
  overlay.classList.remove('open');app.inert=false;document.body.classList.remove('lock');
  const lf=lastFocus;active=null;
  if(!skip){lastFocus=null;if(lf&&document.contains(lf)&&lf.focus)lf.focus({preventScroll:true})}
}
overlay.addEventListener('click',()=>closeLayer());
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(active){closeLayer();return}if(menuOpen()){setMenu(false);$('#menuBtn').focus()}return}
  if(e.key==='Tab'&&active){
    const f=focusables(active);if(!f.length)return;
    const a=document.activeElement,first=f[0],last=f[f.length-1];
    if(e.shiftKey&&(a===first||a===active)){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&a===last){e.preventDefault();first.focus()}
  }
});

/* ---------- Toast ---------- */
function toast(msg,action){
  const w=$('#toasts'),t=document.createElement('div');
  t.className='toast';
  t.innerHTML=`<span>${esc(msg)}</span>${action?`<button type="button" data-act="${action.act}">${esc(action.label)}</button>`:''}`;
  w.appendChild(t);
  while(w.children.length>3)w.firstChild.remove();
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),360)},2800);
}

/* ---------- أنيميشن الإضافة للسلة ---------- */
const cartBtn=$('#cartBtn');
function pulseCart(){
  cartBtn.classList.remove('bump');void cartBtn.offsetWidth;cartBtn.classList.add('bump');
  if(reduced)return;
  const r=cartBtn.getBoundingClientRect(),ring=document.createElement('div');
  ring.className='ring';ring.style.left=r.left+r.width/2-24+'px';ring.style.top=r.top+r.height/2-24+'px';
  document.body.appendChild(ring);setTimeout(()=>ring.remove(),850);
}
function fly(btn,p){
  if(reduced||!btn||!btn.getBoundingClientRect||!cartBtn.offsetParent&&!cartBtn.getClientRects().length){pulseCart();return}
  const a=btn.getBoundingClientRect(),b=cartBtn.getBoundingClientRect();
  const el=document.createElement('div');el.className='fly';el.innerHTML=ico(p.cat);
  el.style.left=a.left+a.width/2-26+'px';el.style.top=a.top+a.height/2-26+'px';
  document.body.appendChild(el);
  const dx=(b.left+b.width/2)-(a.left+a.width/2),dy=(b.top+b.height/2)-(a.top+a.height/2);
  if(!el.animate){el.remove();pulseCart();return}
  const an=el.animate([
    {transform:'translate(0,0) scale(.6)',opacity:0},
    {transform:'translate(0,0) scale(1.1)',opacity:1,offset:.12},
    {transform:`translate(${dx*.45}px,${Math.min(dy*.45,0)-130}px) scale(1.15) rotate(-12deg)`,opacity:1,offset:.5},
    {transform:`translate(${dx}px,${dy}px) scale(.3) rotate(20deg)`,opacity:.5}
  ],{duration:900,easing:'cubic-bezier(.5,0,.2,1)'});
  an.onfinish=()=>{el.remove();pulseCart()};
  an.oncancel=()=>el.remove();
}
function flashBtn(btn){
  if(!btn||!btn.classList.contains('btn'))return;
  const l=btn.querySelector('.lbl');if(!l)return;
  if(!btn.dataset.l)btn.dataset.l=l.textContent;
  btn.classList.add('added');l.textContent='تمت الإضافة';
  clearTimeout(btn._t);
  btn._t=setTimeout(()=>{btn.classList.remove('added');l.textContent=btn.dataset.l},1400);
}
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.btn');if(!b||b.disabled||reduced)return;
  const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height)*2,sp=document.createElement('span');
  sp.className='ripple';sp.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;
  b.appendChild(sp);setTimeout(()=>sp.remove(),720);
});

/* ---------- عمليات السلة ---------- */
function addToCart(id,qty,btn){
  const p=byId(id);if(!p)return;
  if(p.published===false||p.stock&&p.stock.status==='out'){toast('هذا المنتج نفد حاليًا. تواصل عبر واتساب.');return}
  cart[id]=clamp((cart[id]||0)+(qty||1),1,99);
  saveCart();renderCart();
  flashBtn(btn);fly(btn,p);
  toast(`أُضيف: ${p.name}`,{act:'open-cart',label:'عرض السلة'});
}
function setQty(id,q){
  if(q<=0)delete cart[id];else cart[id]=clamp(q,1,99);
  saveCart();renderCart();
}
let view='list';
function renderCart(){
  const n=cartCount(),badge=$('#cartBadge');
  badge.textContent=n>99?'99+':String(n);badge.classList.toggle('show',n>0);
  $('#cartSub').textContent=n?` (${n})`:'';
  const body=$('#cartBody'),foot=$('#cartFoot');
  if(!n){
    view='list';
    body.innerHTML=`<div class="c-empty">${icon('cart')}<p>سلتك فارغة حاليًا.</p><button class="btn btn-primary" type="button" data-act="browse">تصفّح المنتجات</button></div>`;
    foot.innerHTML='';foot.hidden=true;return;
  }
  foot.hidden=false;
  if(view==='list'){
    body.innerHTML=Object.keys(cart).map(id=>{
      const p=byId(id),q=cart[id];
      return `<div class="citem">${art(p,false)}<div><div class="ci-name">${esc(p.name)}</div><div class="ci-unit">${esc(catOf(p.cat).name)}${p.offer?' · عرض خاص':''}</div>
      <div class="ci-row"><div class="qty"><button type="button" data-act="dec" data-id="${esc(p.id)}" aria-label="تقليل الكمية">${icon('minus')}</button><output aria-live="polite">${q}</output><button type="button" data-act="inc" data-id="${esc(p.id)}" aria-label="زيادة الكمية">${icon('plus')}</button></div></div>
      <button class="rm" type="button" data-act="rm" data-id="${esc(p.id)}" aria-label="حذف ${esc(p.name)}">${icon('trash')}حذف</button></div></div>`;
    }).join('');
    foot.innerHTML=`      <div class="sum total"><span>إجمالي القطع</span><b class="num" id="totVal" data-v="0">0</b></div>
      <button class="btn btn-primary" type="button" data-act="checkout">متابعة الطلب</button>
      <p class="dr-note">نراجع طلبك ونتواصل معك لتأكيد التفاصيل. التوصيل والتركيب يُتفق عليهما معك.</p>
      <div class="center"><button class="linkbtn" type="button" data-act="clear">تفريغ السلة</button></div>`;
    animNum($('#totVal'),n,false);
  }else{
    body.innerHTML=`<div class="form pt">
      <p class="lead">أدخل بياناتك ليصلنا طلبك مرتبًا عبر واتساب.</p>
      <label><span>الاسم</span><input id="coName" autocomplete="name" maxlength="50" value="${esc(co.name)}" aria-describedby="coHn"><small class="hint" id="coHn">حرفان على الأقل.</small></label>
      <label><span>رقم الهاتف</span><input id="coPhone" dir="ltr" inputmode="numeric" autocomplete="tel" maxlength="16" placeholder="07XXXXXXXXX" value="${esc(co.phone)}" aria-describedby="coHp"><small class="hint" id="coHp">رقم عراقي من 11 رقمًا يبدأ بـ 07.</small></label>
      ${contactChoices('coWhatsApp',co.whatsapp)}
      <div class="sum total"><span>إجمالي القطع</span><b class="num">${n}</b></div></div>`;
    foot.innerHTML=`<button class="btn btn-primary" type="button" data-act="send">إرسال الطلب عبر واتساب</button>
      <div class="center"><button class="linkbtn" type="button" data-act="back">رجوع للسلة</button></div>`;
  }
}
const co={name:'',phone:'',whatsapp:CONFIG.contact.whatsapp};
function buildOrder(name,phone){
  const ref='TA-'+new Date().toISOString().slice(2,10).replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
  const lines=Object.keys(cart).map((id,i)=>{const p=byId(id),q=cart[id];return `${i+1}) ${p.name} × ${q}`});
  const txt=['تاج عدن','────────','طلب جديد','',`الاسم: ${name}`,`الهاتف: ${phone}`,'','المنتجات:',...lines,'',`المرجع: ${ref}`].filter((l,i,a)=>!(l===''&&a[i-1]==='')).join('\n');
  return txt;
}

/* ---------- الفلترة والمنتجات ---------- */
const state={cat:'all',q:'',sort:'def',sub:''};
function productCard(p,i){
  const out=p.stock&&p.stock.status==='out';
  return `<article class="pcard tilt" style="--i:${Math.min(i,12)}">
    ${p.offer?'<span class="off">عرض خاص</span>':''}
    ${out?'<span class="stock-badge">نفذت الكمية</span>':''}
    <button class="art-btn" type="button" data-act="qv" data-id="${esc(p.id)}" aria-label="عرض ${esc(p.name)}">${art(p)}</button>
    <div class="pc-body"><span class="pc-cat">${esc(catOf(p.cat).name)}</span><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
      <a class="ask" href="${esc(waLink(`أريد الاستفسار عن ${p.name}`))}" target="_blank" rel="noreferrer noopener">استفسر عن المنتج${icon('arrow-left')}</a>
      <div class="pc-actions"><button class="btn btn-primary" type="button" data-act="add" data-id="${esc(p.id)}" ${out?'disabled':''}>${icon('plus')}<span class="lbl">${out?'نفذت الكمية':'أضف للسلة'}</span></button>${out?`<a class="mini" href="${esc(waLink(`أبلغوني عند توفر ${p.name}`))}" target="_blank" rel="noreferrer noopener">أبلغني عبر واتساب</a>`:`<button class="mini" type="button" data-act="qv" data-id="${esc(p.id)}">عرض سريع</button>`}</div>
    </div></article>`;
}
function renderProducts(){
  let list=P.filter(p=>p.published!==false&&(state.cat==='all'||p.cat===state.cat));
  if(state.sub){const sub=normAr(state.sub);list=list.filter(p=>normAr(p.sub||p.name).includes(sub)||normAr(p.name).includes(sub))}
  const q=normAr(state.q.trim());
  if(q)list=list.filter(p=>normAr(p.name+' '+p.desc+' '+catOf(p.cat).name).includes(q));
  if(state.sort==='offer')list=list.slice().sort((a,b)=>(b.offer?1:0)-(a.offer?1:0));
  else if(state.sort==='name')list=list.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
  $('#pGrid').innerHTML=list.length?list.map(productCard).join(''):`<div class="empty">لا توجد نتائج مطابقة. جرّب كلمة أخرى أو فئة مختلفة.</div>`;
  $('#countLine').textContent=`${list.length} منتج`;
  $$('#tabs .tab').forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.cat===state.cat)));
}
function renderTabs(){
  $('#tabs').innerHTML=`<button class="tab" type="button" data-act="filter" data-cat="all" aria-pressed="true">الكل</button>`+C.map(c=>`<button class="tab" type="button" data-act="filter" data-cat="${esc(c.id)}" aria-pressed="false">${esc(c.name)}</button>`).join('');
}
function renderCatalog(){
  $('#catGrid').innerHTML=C.map((c,i)=>`<article class="catcard tilt rv" style="--d:${i%4}">
    <div class="cc-top"><span class="cc-no">${String(i+1).padStart(2,'0')}</span><span class="cc-ico">${ico(c.id)}</span></div>
    <h3>${esc(c.name)}</h3><div class="cc-en">${esc(c.en)}</div>
    <div class="chips">${c.items.map(x=>`<button type="button" data-act="goto-sub" data-cat="${esc(c.id)}" data-sub="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <button class="go-btn" type="button" data-act="goto-cat" data-cat="${esc(c.id)}">تصفّح ${esc(c.name)}</button></article>`).join('');
  revealGenerated($('#catGrid'));
}
function renderOffers(){
  const list=P.filter(p=>p.published!==false&&p.offer&&(!p.offerEndsAt||Date.parse(p.offerEndsAt)>Date.now()));
  $('#offers').hidden=!list.length;
  $('#offerList').innerHTML=list.map((p,i)=>`<article class="ocard tilt${i===0?' feat':''}" style="--i:${Math.min(i,12)}">
    <span class="off">عرض خاص</span>${art(p)}
    <div class="pc-body"><span class="pc-cat">${esc(catOf(p.cat).name)}</span><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
      <a class="ask" href="${esc(waLink(`أريد تفاصيل العرض الخاص على ${p.name}`))}" target="_blank" rel="noreferrer noopener">تفاصيل العرض${icon('arrow-left')}</a>
      <div class="pc-actions"><button class="btn btn-primary" type="button" data-act="add" data-id="${esc(p.id)}" ${p.stock&&p.stock.status==='out'?'disabled':''}>${icon('plus')}<span class="lbl">${p.stock&&p.stock.status==='out'?'نفذت الكمية':'أضف للسلة'}</span></button>${p.stock&&p.stock.status==='out'?`<a class="mini" href="${esc(waLink(`أبلغوني عند توفر ${p.name}`))}" target="_blank" rel="noreferrer noopener">أبلغني عبر واتساب</a>`:`<button class="mini" type="button" data-act="qv" data-id="${esc(p.id)}">عرض</button>`}</div>
    </div></article>`).join('');
  sliderRefresh();
}

/* ---------- العرض السريع ---------- */
let qvId=null,qvQty=1,qvImage=0;
let galleryStart=null;
$('#qv').addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.target.closest('.qv-gallery'))galleryStart=e.clientX},{passive:true});
$('#qv').addEventListener('pointerup',e=>{
  if(galleryStart===null)return;
  const delta=e.clientX-galleryStart;galleryStart=null;
  const p=byId(qvId);
  if(!p||!p.images||p.images.length<2||Math.abs(delta)<36)return;
  const next=(qvImage+(delta<0?1:-1)+p.images.length)%p.images.length;
  const button=$(`.qv-thumbs button[data-index="${next}"]`);
  if(button)button.click();
});
function openQV(id,trigger){
  const p=byId(id);if(!p)return;
  qvId=id;qvQty=1;qvImage=Number(p.featured)||0;
  $('#qv').innerHTML=`<button class="close" type="button" data-act="close" aria-label="إغلاق">${icon('x')}</button>
  <div class="qv"><div class="qv-gallery">${art(p)}${p.images&&p.images.length>1?`<div class="qv-thumbs">${p.images.map((src,i)=>`<button type="button" data-act="qv-img" data-index="${i}" aria-label="عرض الصورة ${i+1}" aria-pressed="${i===(p.featured||0)}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>`:''}</div>
    <div class="qv-body"><span class="pc-cat">${esc(catOf(p.cat).name)}</span><h2 id="qvName">${esc(p.name)}</h2>
      <p>${esc(p.desc)}</p>
      <ul>${p.specs.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>
      <div class="qv-flag">${p.offer?'<span class="off-tag">عرض خاص</span>':''}<span class="qv-note">للتفاصيل والتوفر تواصل عبر واتساب.</span></div>
      <div class="qv-row"><div class="qty"><button type="button" data-act="qv-dec" aria-label="تقليل">${icon('minus')}</button><output id="qvQ" aria-live="polite">1</output><button type="button" data-act="qv-inc" aria-label="زيادة">${icon('plus')}</button></div>
      <button class="btn btn-primary" type="button" data-act="qv-add" ${(p.stock&&p.stock.status==='out')?'disabled':''}>${icon('plus')}<span class="lbl">${(p.stock&&p.stock.status==='out')?'نفذت الكمية':'أضف للسلة'}</span></button>
      ${(p.stock&&p.stock.status==='out')?`<a class="btn btn-ghost" href="${esc(waLink(`أبلغوني عند توفر ${p.name}`))}" target="_blank" rel="noreferrer noopener">أبلغني عبر واتساب</a>`:''}
      <a class="mini qv-ask" href="${esc(waLink(`أريد الاستفسار عن ${p.name}`))}" target="_blank" rel="noreferrer noopener">استفسر عن المنتج عبر واتساب</a>
      <a class="mini qv-phone" href="tel:${esc(normPhone(CONFIG.contact.whatsapp))}">اتصل بنا هاتفيًا</a></div>
    </div></div>`;
  openLayer($('#qv'),trigger);
}

/* ---------- القائمة ---------- */
const menuBtn=$('#menuBtn'),menuPanel=$('#menuPanel');
const menuOpen=()=>menuPanel.classList.contains('open');
function setMenu(o){menuPanel.classList.toggle('open',o);menuBtn.setAttribute('aria-expanded',String(o))}
menuBtn.addEventListener('click',()=>setMenu(!menuOpen()));
$$('#menuPanel a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));

/* ---------- نقرات عامة ---------- */
function scrollToEl(sel){const el=$(sel);if(el)el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'})}
function setCat(c){state.cat=c;state.sub='';renderProducts()}
document.addEventListener('click',e=>{
  if(menuOpen()&&!e.target.closest('#menuPanel')&&!e.target.closest('#menuBtn'))setMenu(false);
  const t=e.target.closest('[data-act]');if(!t)return;
  const id=t.dataset.id;
  switch(t.dataset.act){
    case 'add':addToCart(id,1,t);break;
    case 'qv':openQV(id,t);break;
    case 'qv-img':{
      const p=byId(qvId),index=Number(t.dataset.index);
      if(p&&p.images&&p.images[index]){
        qvImage=index;
        const image=$('#qv .qv-gallery .pimg');
        if(image)image.src=p.images[index];
        $$('.qv-thumbs button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
      }
      break;
    }
    case 'qv-inc':qvQty=clamp(qvQty+1,1,99);$('#qvQ').textContent=qvQty;break;
    case 'qv-dec':qvQty=clamp(qvQty-1,1,99);$('#qvQ').textContent=qvQty;break;
    case 'qv-add':{const b=t,pid=qvId,q=qvQty;addToCart(pid,q,b);setTimeout(()=>{if(active&&active.id==='qv')closeLayer(true)},650);break}
    case 'open-cart':view='list';renderCart();openLayer($('#cart'),t);break;
    case 'close':closeLayer();break;
    case 'inc':setQty(id,(cart[id]||0)+1);break;
    case 'dec':setQty(id,(cart[id]||0)-1);break;
    case 'rm':setQty(id,0);break;
    case 'clear':cart={};saveCart();view='list';renderCart();break;
    case 'browse':closeLayer(true);location.hash='#/browse';break;
    case 'checkout':view='form';renderCart();setTimeout(()=>{const i=$('#coName');if(i)i.focus()},50);break;
    case 'back':view='list';renderCart();break;
    case 'send':{
      const ph=normPhone(co.phone);
      if(!validName(co.name)||!validPhone(ph)){
        const n=$('#coName'),p=$('#coPhone');
        if(!validName(co.name))n.setAttribute('aria-invalid','true');
        if(!validPhone(ph))p.setAttribute('aria-invalid','true');
        (!validName(co.name)?n:p).focus();return;
      }
      const recipient=$('input[name="coWhatsApp"]:checked')?.value||CONFIG.contact.whatsapp;
      window.open(waLink(buildOrder(co.name.trim(),ph),recipient),'_blank','noopener');
      window.dispatchEvent(new Event('taj-order-sent'));
      toast('تم تجهيز طلبك. أكمل الإرسال من واتساب.');
      break;
    }
    case 'filter':setCat(t.dataset.cat);location.hash=t.dataset.cat==='all'?'#/browse':`#/browse/${t.dataset.cat}`;break;
    case 'goto-cat':setCat(t.dataset.cat);location.hash=`#/browse/${t.dataset.cat}`;break;
    case 'slide':slideBy(Number(t.dataset.dir));break;
    case 'goto-sub':setCat(t.dataset.cat);state.sub=t.dataset.sub;location.hash=`#/browse/${t.dataset.cat}/${encodeURIComponent(t.dataset.sub)}`;break;
  }
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='search'){state.q=t.value;renderProducts()}
  else if(t.id==='coName'){co.name=t.value;t.removeAttribute('aria-invalid')}
  else if(t.id==='coPhone'){co.phone=t.value;t.removeAttribute('aria-invalid')}
  else if(t.id==='cfName'||t.id==='cfPhone')t.removeAttribute('aria-invalid');
});
document.addEventListener('change',e=>{
  if(e.target.id==='sort'){state.sort=e.target.value;renderProducts()}
  else if(e.target.name==='coWhatsApp')co.whatsapp=e.target.value;
});
document.addEventListener('focusout',e=>{
  const t=e.target;
  if((t.id==='coName'||t.id==='cfName')&&t.value&&!validName(t.value))t.setAttribute('aria-invalid','true');
  if((t.id==='coPhone'||t.id==='cfPhone')&&t.value&&!validPhone(normPhone(t.value)))t.setAttribute('aria-invalid','true');
});
$('#contactForm').addEventListener('submit',e=>{
  e.preventDefault();
  const n=$('#cfName'),p=$('#cfPhone'),m=$('#cfMsg'),ph=normPhone(p.value);
  let bad=null;
  if(!validName(n.value)){n.setAttribute('aria-invalid','true');bad=bad||n}
  if(!validPhone(ph)){p.setAttribute('aria-invalid','true');bad=bad||p}
  if(bad){bad.focus();return}
  const txt=['تاج عدن','────────','رسالة جديدة','',`الاسم: ${n.value.trim()}`,`الهاتف: ${ph}`,m.value.trim()?`الرسالة: ${m.value.trim()}`:''].filter(Boolean).join('\n');
  const recipient=new FormData(e.currentTarget).get('cfWhatsApp');
  window.open(waLink(txt,recipient),'_blank','noopener');
  window.dispatchEvent(new Event('taj-order-sent'));
  toast('تم تجهيز رسالتك. أكمل الإرسال من واتساب.');
});

/* ---------- تعبئة ثابتة ---------- */
function fillStatic(){
  $('#waFloat').href=waLink('مرحبًا، أريد الاستفسار عن معدات من تاج عدن.');
  $('#ctWa').textContent=contactNumbers().join(' · ');
  $('#ctLinks').innerHTML=`<div class="contact-numbers">${contactNumbers().map((phone,index)=>`<div class="contact-number"><b class="num">${esc(phone)}</b><a class="btn btn-primary" href="${esc(waLink('مرحبًا، أريد الاستفسار عن تجهيزات تاج عدن.',phone))}" target="_blank" rel="noreferrer noopener">واتساب ${index+1}</a><a class="mini" href="tel:${esc(normPhone(phone))}">اتصال هاتفي</a></div>`).join('')}</div>`;
  $('#cfWhatsAppChoices').innerHTML=contactChoices('cfWhatsApp',CONFIG.contact.whatsapp);
  $('#copyYear').textContent=CONFIG.brand.year;
  $('#credit').textContent=`Designed & developed by ${CONFIG.brand.developer}`;
  const highlights=["تجهيز المطاعم","معدات الكوفي","معدات المطابخ","التبريد والعرض"];
  const items=highlights.map((label,index)=>`<span>${label}</span>`).join('');
  $('#mqTrack').innerHTML=`<div class="mq-group">${items}</div><div class="mq-group" aria-hidden="true">${items}</div>`;
  const showcase=['coffee','kitchen','cooling'].map(category=>P.find(product=>product.cat===category)).filter(Boolean);
  $('#heroShowcase').innerHTML=showcase.map((product,index)=>`<article class="hero-product hero-product-${index+1}">${art(product)}<span>${esc(catOf(product.cat).name)}</span><b>${esc(product.name)}</b></article>`).join('');
  const hi=[['kitchen','top:18%;right:7%;width:84px;height:84px',22],['coffee','top:62%;right:11%;width:70px;height:70px',-16],['cooling','top:24%;left:8%;width:88px;height:88px',-24],['serving','top:68%;left:12%;width:76px;height:76px',18],['pos','top:46%;left:3%;width:56px;height:56px',30],['furniture','top:10%;left:36%;width:54px;height:54px',-12]];
  $('#heroIcons').innerHTML=hi.map(h=>`<div class="fi" style="${h[1]};--k:${h[2]}"><svg viewBox="0 0 64 64"><path d="${IC[h[0]]}"/></svg></div>`).join('');
  const counts={products:P.length,cats:C.length,offers:P.filter(p=>p.offer).length};
  $$('[data-count]').forEach(el=>{el.dataset.target=counts[el.dataset.count]});
}

/* ---------- عداد العروض ---------- */
function endTime(){
  return Date.parse(CONFIG.offers.endsAt);
}
const cd={D:$('#cdD'),H:$('#cdH'),M:$('#cdM'),S:$('#cdS')};
function makeCdDigit(value){
  const digit=document.createElement('span');
  digit.className='cd-digit';
  digit.dataset.value=String(value);
  const strip=document.createElement('span');
  strip.className='cd-strip';
  strip.dataset.position=String(10+value);
  strip.style.transform=`translateY(-${(10+value)*100/30}%)`;
  for(let i=0;i<30;i++){
    const numeral=document.createElement('span');
    numeral.textContent=String(i%10);
    strip.appendChild(numeral);
  }
  digit.appendChild(strip);
  return digit;
}
function setCd(el,v){
  const value=String(v).padStart(2,'0');
  if(el.dataset.value===value)return;
  const previous=el.dataset.value||'';
  if(previous.length!==value.length){
    el.replaceChildren(...[...value].map(char=>makeCdDigit(Number(char))));
  }else{
    [...el.children].forEach((digit,index)=>{
      const next=Number(value[index]),old=Number(digit.dataset.value);
      if(next===old)return;
      let step=next-old;
      if(step>5)step-=10;
      else if(step< -5)step+=10;
      const strip=digit.firstElementChild;
      const position=Number(strip.dataset.position)+step;
      digit.dataset.value=String(next);
      strip.dataset.position=String(position);
      if(reduced){
        strip.style.transition='none';
        strip.style.transform=`translateY(-${position*100/30}%)`;
        strip.offsetHeight;
        strip.style.transition='';
        return;
      }
      strip.addEventListener('transitionend',()=>{
        const centered=10+Number(digit.dataset.value);
        strip.style.transition='none';
        strip.dataset.position=String(centered);
        strip.style.transform=`translateY(-${centered*100/30}%)`;
        strip.offsetHeight;
        strip.style.transition='';
      },{once:true});
      strip.style.transform=`translateY(-${position*100/30}%)`;
    });
  }
  el.dataset.value=value;
}
function tickCd(){
  const t=endTime(),left=Math.max(0,(Number.isFinite(t)?t:0)-Date.now()),s=Math.floor(left/1000);
  const days=Math.floor(s/86400),hours=Math.floor(s%86400/3600),minutes=Math.floor(s%3600/60),seconds=s%60;
  setCd(cd.D,days);setCd(cd.H,hours);setCd(cd.M,minutes);setCd(cd.S,seconds);
  $('#offers .cd').setAttribute('aria-label',`${days} يوم، ${hours} ساعة، ${minutes} دقيقة، ${seconds} ثانية`);
}

/* ---------- كشف + عدّادات + scrub ---------- */
function initReveal(){
  const sc=$('#scrub'),hl=(sc.dataset.hl||'').split(',').filter(Boolean);
  const text=sc.textContent.trim();
  let marked=text;
  const words=text.split(/\s+/);
  const hlWords=new Set();
  hl.forEach(ph=>{const ws=ph.split(/\s+/);for(let i=0;i<=words.length-ws.length;i++){if(ws.every((w,k)=>words[i+k].replace(/[،.:]/g,'')===w))ws.forEach((_,k)=>hlWords.add(i+k))}});
  sc.setAttribute('aria-label',text);
  sc.innerHTML=words.map((w,i)=>`<span class="${hlWords.has(i)?'hl':''}" aria-hidden="true">${esc(w)}</span> `).join('');
  if(!('IntersectionObserver' in window)){
    $$('.rv').forEach(el=>el.classList.add('in'));
    $$('[data-count]').forEach(el=>{el.textContent=String(el.dataset.target||0)});
    return;
  }
  const io=new IntersectionObserver(es=>es.forEach(en=>{
    if(!en.isIntersecting)return;
    en.target.classList.add('in');io.unobserve(en.target);
  }),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  $$('.rv').forEach(el=>io.observe(el));
  const io2=new IntersectionObserver(es=>es.forEach(en=>{
    if(!en.isIntersecting)return;
    const el=en.target,to=Number(el.dataset.target||0);
    animNum(el,to,false,1400);io2.unobserve(el);
  }),{threshold:.6});
  $$('[data-count]').forEach(el=>io2.observe(el));
}
function revealGenerated(root){
  if(!root)return;
  const elements=$$('.rv',root);
  if(reduced||!('IntersectionObserver' in window)){elements.forEach(el=>el.classList.add('in'));return}
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target)}
  }),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  elements.forEach(el=>io.observe(el));
}


/* ---------- السلايدر (عروض): scroll-snap + أزرار + نقاط + سحب بالماوس + لوحة مفاتيح ---------- */
const sl={track:null,dots:null,prev:null,next:null,pages:1,page:0,raf:0,drag:null,ro:null};
const slRtl=()=>getComputedStyle(sl.track).direction==='rtl';
const slEdge=el=>{const r=el.getBoundingClientRect(),t=sl.track.getBoundingClientRect();return slRtl()?r.right-t.right:r.left-t.left};
function slCards(){return sl.track?Array.from(sl.track.children):[]}
function slMetrics(){
  const cards=slCards(),max=sl.track.scrollWidth-sl.track.clientWidth;
  if(cards.length<2||max<=2)return{pages:1,max};
  const step=cards[1].getBoundingClientRect().left-cards[0].getBoundingClientRect().left;
  return{pages:clamp(Math.ceil(max/Math.abs(step)-.05)+1,1,cards.length),max};
}
function slCurrent(max,pages){
  if(Math.abs(sl.track.scrollLeft)>=max-2)return pages-1;
  let best=0,bd=Infinity;
  slCards().forEach((c,i)=>{const d=Math.abs(slEdge(c));if(d<bd){bd=d;best=i}});
  return clamp(best,0,pages-1);
}
function sliderUpdate(){
  sl.raf=0;
  if(!sl.track)return;
  const m=slMetrics(),page=slCurrent(m.max,m.pages);
  if(m.pages!==sl.pages||!sl.dots.childElementCount){
    sl.pages=m.pages;
    sl.dots.innerHTML=Array.from({length:m.pages},(_,i)=>`<button type="button" role="tab" data-act="slide-to" data-page="${i}" aria-label="الصفحة ${i+1} من ${m.pages}"></button>`).join('');
  }
  sl.page=page;
  Array.from(sl.dots.children).forEach((d,i)=>{d.setAttribute('aria-selected',String(i===page));d.tabIndex=i===page?0:-1});
  sl.prev.disabled=page<=0;sl.next.disabled=page>=m.pages-1;
  sl.dots.parentElement.hidden=m.pages<=1;
}
const sliderSchedule=()=>{if(!sl.raf)sl.raf=requestAnimationFrame(sliderUpdate)};
function sliderGo(i){
  const cards=slCards();if(!cards.length)return;
  const m=slMetrics(),idx=clamp(i,0,m.pages-1),card=cards[Math.min(idx,cards.length-1)];
  const left=sl.track.scrollLeft+slEdge(card);
  sl.track.scrollTo({left,behavior:reduced?'auto':'smooth'});
}
function slideBy(dir){sliderGo(sl.page+(dir<0?-1:1))}
function sliderRefresh(){if(!sl.track)return;sl.pages=0;sl.dots.innerHTML='';sl.track.scrollLeft=0;sliderUpdate()}
function initSlider(){
  sl.track=$('#offerList');sl.dots=$('#offerDots');sl.prev=$('#offerPrev');sl.next=$('#offerNext');
  if(!sl.track)return;
  sl.track.addEventListener('scroll',sliderSchedule,{passive:true});
  if('ResizeObserver' in window){sl.ro=new ResizeObserver(sliderSchedule);sl.ro.observe(sl.track)}else addEventListener('resize',sliderSchedule);
  sl.dots.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)sliderGo(Number(b.dataset.page))});
  sl.track.addEventListener('keydown',e=>{
    const rtl=slRtl();let go=null;
    if(e.key==='ArrowLeft')go=rtl?1:-1;else if(e.key==='ArrowRight')go=rtl?-1:1;
    else if(e.key==='Home'){e.preventDefault();sliderGo(0);return}
    else if(e.key==='End'){e.preventDefault();sliderGo(sl.pages-1);return}
    if(go===null)return;
    e.preventDefault();slideBy(go);
  });
  /* سحب بالماوس (اللمس يستخدم التمرير الأصلي) */
  sl.track.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse'||e.button!==0)return;
    sl.drag={x:e.clientX,s:sl.track.scrollLeft,moved:false};
    addEventListener('pointermove',slMove);addEventListener('pointerup',slUp);addEventListener('pointercancel',slUp);
  });
  sliderUpdate();
}
function slMove(e){
  const d=sl.drag;if(!d)return;
  const dx=e.clientX-d.x;
  if(!d.moved&&Math.abs(dx)>5){d.moved=true;sl.track.classList.add('dragging')}
  if(d.moved)sl.track.scrollLeft=d.s-dx;
}
function slUp(){
  removeEventListener('pointermove',slMove);removeEventListener('pointerup',slUp);removeEventListener('pointercancel',slUp);
  const d=sl.drag;sl.drag=null;
  if(!d||!d.moved)return;
  sl.track.classList.remove('dragging');
  const stop=ev=>{ev.stopPropagation();ev.preventDefault()};
  sl.track.addEventListener('click',stop,{capture:true,once:true});
  setTimeout(()=>sl.track.removeEventListener('click',stop,{capture:true}),0);
  const m=slMetrics();sliderGo(slCurrent(m.max,m.pages));
}

/* ---------- الثيم الموحّد (يُستخدم أيضًا من لوحة الإدارة) ---------- */
const TajTheme={
  key:'taj_theme',
  get(){return document.documentElement.dataset.theme==='light'?'light':'dark'},
  apply(theme){
    const t=theme==='light'?'light':'dark',root=document.documentElement,b=$('#themeSwitcher');
    root.dataset.theme=t;
    try{localStorage.setItem(this.key,t)}catch{}
    const label=t==='dark'?'التبديل إلى الوضع الفاتح':'التبديل إلى الوضع الداكن';
    if(b){b.setAttribute('aria-label',label);b.title=label}
    const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=t==='dark'?'#0B0A08':'#FBF8F0';
  },
  set(theme,ev){
    if(ev&&!reduced&&document.startViewTransition){document.startViewTransition(()=>this.apply(theme))}
    else this.apply(theme);
  }
};
window.TajTheme=TajTheme;
function initTheme(){
  TajTheme.apply(TajTheme.get());
  const b=$('#themeSwitcher');
  if(b)b.addEventListener('click',e=>TajTheme.set(TajTheme.get()==='dark'?'light':'dark',e));
}

/* ---------- تشغيل ---------- */
loadCart();
fillStatic();
renderTabs();renderCatalog();renderOffers();renderProducts();renderCart();
initReveal();initSlider();initTheme();
tickCd();setInterval(tickCd,1000);
window.TajAden={products:P,categories:C,config:CONFIG,refresh:()=>{renderTabs();renderCatalog();renderOffers();renderProducts();renderCart();fillStatic();},filter:(cat,sub='')=>{state.cat=cat||'all';state.sub=sub;state.q='';renderProducts();},removeFromCart:id=>{delete cart[id];saveCart();renderCart();}};


})();

/* لوحة الإدارة والتوجيه والتخزين التجريبي المحلي. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
  const nowIso = () => new Date().toISOString();
  const defaultLoginHash = 'ebc7c916268f5822c2c6b0128caaea10986edd37e58db908e02d9606882890e1';
  const DB_NAME = 'taj-aden-demo';
  const DB_STORE = 'website';
  const THEME_KEY = 'taj_theme';
  const icon = (n) => `<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const storedTheme = () => { try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };
  const SESSION_KEY = 'taj_admin_session';
  const SESSION_AT = 'taj_admin_activity';
  const LOCK_KEY = 'taj_login_lock';
  const $root = $('#adminRoot');
  const model = window.TajAden;
  if (!model) {
    console.error('تعذّر تحميل بيانات المتجر قبل لوحة الإدارة.');
    return;
  }

  let db;
  let offers = [];
  let settings = {
    whatsapp: model.config.contact.whatsapp,
    whatsapp2: model.config.contact.whatsapp2,
    address: 'الوزيرية — قرب الفلكة',
    hours: 'يوميًا، بالتنسيق عبر الهاتف',
    theme: localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  };
  let tab = 'overview';
  let productQuery = '';
  let productFilter = 'all';
  let editingId = null;
  let formImages = [];
  let lastDeleted = null;
  let deleteTimer = 0;
  let idleTimer = 0;
  let routeTransition = null;
  let offerQuery = '';
  let categories = model.categories;

  function toast(message, action) {
    const wrap = $('#toasts');
    if (!wrap) return;
    const item = document.createElement('div');
    item.className = 'toast';
    item.innerHTML = `<span>${esc(message)}</span>${action ? `<button type="button" data-admin-action="${esc(action)}">${action === 'undo-delete' ? 'تراجع' : 'إغلاق'}</button>` : ''}`;
    wrap.appendChild(item);
    setTimeout(() => {
      item.classList.add('out');
      setTimeout(() => item.remove(), 380);
    }, 3500);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('هذا المتصفح لا يدعم التخزين المحلي IndexedDB.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('تعذّر فتح قاعدة البيانات المحلية.'));
    });
  }

  function readState() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const request = tx.objectStore(DB_STORE).get('site');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('تعذّرت قراءة بيانات الموقع.'));
    });
  }

  function saveState() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put({
        products: model.products,
        categories,
        offers,
        settings,
        savedAt: nowIso()
      }, 'site');
      tx.oncomplete = () => { scheduleOfferRefresh();resolve(); };
      tx.onerror = () => reject(tx.error || new Error('تعذّر حفظ البيانات. قد تكون مساحة المتصفح ممتلئة.'));
      tx.onabort = () => reject(tx.error || new Error('أُلغِي حفظ البيانات.'));
    });
  }

  function showError(error) {
    console.error(error);
    toast(error?.message || 'حدث خطأ غير متوقع.');
  }

  function prepareProduct(product) {
    if (!product.stock) product.stock = { status: 'available', qty: 0 };
    if (!Array.isArray(product.images)) product.images = product.photo ? [product.photo] : [];
    if (!Array.isArray(product.specs)) product.specs = [];
    if (product.published === undefined) product.published = true;
    if (product.offer === undefined) product.offer = Boolean(product.old || product.offerId);
    delete product.price;
    delete product.old;
    delete product.basePrice;
    if (!product.sub) product.sub = '';
    return product;
  }

  function loadSeedOffers() {
    const endsAt = model.config.offers.endsAt;
    model.products.forEach(product => {
      prepareProduct(product);
      if (product.offer && !product.offerId) {
        product.offerId = `seed-${product.id}`;
        product.offerEndsAt = endsAt;
        offers.push({
          id: product.offerId,
          name: `عرض ${product.name}`,
          reason: 'عرض تأسيسي',
          startsAt: new Date(Date.now() - 86400000).toISOString(),
          endsAt,
          productIds: [product.id]
        });
      }
    });
  }

  function offerStatus(offer) {
    const start = Date.parse(offer.startsAt || 0);
    const end = Date.parse(offer.endsAt || 0);
    if (end <= Date.now()) return 'منتهي';
    if (start > Date.now()) return 'مجدول';
    return 'فعّال';
  }

  function syncOffers() {
    model.products.forEach(product => {
      prepareProduct(product);
      if (!product.offerId) return;
      const offer = offers.find(item => item.id === product.offerId && item.productIds.includes(product.id));
      const status = offer ? offerStatus(offer) : 'منتهي';
      if (status === 'فعّال') {
        product.offer = true;
        product.offerEndsAt = offer.endsAt;
      } else if (status === 'مجدول') {
        product.offer = false;
        product.offerEndsAt = offer.endsAt;
      } else {
        product.offer = false;
        product.offerId = '';
        product.offerEndsAt = '';
      }
    });
    const nextExpiry = offers.filter(item => offerStatus(item) === 'فعّال').sort((a,b) => Date.parse(a.endsAt)-Date.parse(b.endsAt))[0];
    if (nextExpiry) model.config.offers.endsAt = nextExpiry.endsAt;
    model.refresh();
  }

  let offerRefreshTimer = 0;
  function scheduleOfferRefresh() {
    clearTimeout(offerRefreshTimer);
    if (!offers.length) return;
    const nextChange = offers.flatMap(offer => [Date.parse(offer.startsAt||0),Date.parse(offer.endsAt||0)])
      .filter(time => Number.isFinite(time) && time > Date.now()).sort((a,b)=>a-b)[0];
    if (!nextChange) return;
    offerRefreshTimer=setTimeout(async()=>{
      const expired=offers.some(offer=>offerStatus(offer)==='منتهي'&&offer.productIds.some(id=>model.products.some(product=>product.offerId===offer.id)));
      syncOffers();
      try { await saveState(); } catch(error) { showError(error); }
      if(expired)toast('انتهى عرض خاص تلقائيًا.');
      if(location.hash.startsWith('#/offers')&&!activeOffers().length)location.hash='#home';
      if(document.body.classList.contains('route-admin'))renderAdminTab();
    },Math.min(Math.max(50,nextChange-Date.now()+100),24*60*60*1000));
  }

  function activeOffers() {
    return offers.filter(item => offerStatus(item) === 'فعّال');
  }

  function adminAuthenticated() {
    const token = localStorage.getItem(SESSION_KEY);
    const activity = Number(localStorage.getItem(SESSION_AT) || 0);
    return Boolean(token && activity && Date.now() - activity < 15 * 60 * 1000);
  }

  function logout(showMessage = false) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_AT);
    clearTimeout(idleTimer);
    document.body.classList.remove('route-admin');
    if (location.hash.startsWith('#/admin')) location.hash = '#home';
    if (showMessage) toast('تم تسجيل الخروج.');
  }

  function refreshIdle() {
    if (!adminAuthenticated()) return;
    localStorage.setItem(SESSION_AT, String(Date.now()));
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => logout(true), 15 * 60 * 1000);
  }

  function applyTheme(theme, transitionEvent) {
    settings.theme = theme === 'light' ? 'light' : 'dark';
    window.TajTheme.set(settings.theme, transitionEvent);
  }

  function routeView() {
    const hash = location.hash || '#home';
    const route = hash.slice(1);
    document.body.classList.remove('route-browse', 'route-offers', 'route-admin');
    if (route.startsWith('/admin')) {
      if (!adminAuthenticated()) {
        location.hash = '#home';
        $('#menuBtn')?.click();
        toast('سجّل الدخول بحساب الإدارة أولًا.');
        return;
      }
      document.body.classList.add('route-admin');
      refreshIdle();
      renderAdmin();
      document.title = 'لوحة الإدارة — تاج عدن';
      return;
    }
    if (route.startsWith('/browse')) {
      document.body.classList.add('route-browse');
      const [, , cat = 'all', ...subParts] = route.split('/');
      let sub = '';
      try { sub = subParts.length ? decodeURIComponent(subParts.join('/')) : ''; }
      catch { location.hash='#/browse';return; }
      const validCat = cat === 'all' || categories.some(item => item.id === cat) ? cat : 'all';
      model.filter(validCat, sub);
      const search = $('#search');
      if (search) search.value = '';
      const title = validCat === 'all' ? 'كل المنتجات' : categories.find(item => item.id === validCat)?.name || 'المنتجات';
      const heading = $('#productTitle');
      if (heading) heading.textContent = title;
      document.title = `${title} — تاج عدن`;
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return;
    }
    if (route.startsWith('/offers')) {
      if (!activeOffers().length) {
        location.hash = '#home';
        toast('لا توجد عروض فعّالة حاليًا.');
        return;
      }
      document.body.classList.add('route-offers');
      document.title = 'العروض — تاج عدن';
      return;
    }
    document.title = 'تاج عدن — تجهيز المطاعم والكوفيات';
  }

  function routeChanged() {
    const change = () => routeView();
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      change();
      return;
    }
    const previous = routeTransition;
    routeTransition = null;
    try {
      if (previous?.skipTransition) {
        try {
          previous.skipTransition();
        } catch (error) {
          if (error.name !== 'InvalidStateError') throw error;
        }
      }
      const transition = document.startViewTransition(change);
      routeTransition = transition;
      transition.ready.catch(error => {
        if (error.name === 'TimeoutError') {
          try {
            transition.skipTransition();
            console.warn('استمر التنقل دون حركة انتقال الصفحة بسبب تأخر تحديث المحتوى.');
          } catch (skipError) {
            if (skipError.name !== 'InvalidStateError') {
              console.warn('تعذّر تجاوز حركة انتقال الصفحة؛ سيبقى المسار الحالي ظاهرًا.',skipError);
            }
          }
        } else if (error.name !== 'AbortError' && error.name !== 'InvalidStateError') {
          console.error('تعذّر تهيئة انتقال الصفحة.',error);
        }
      });
      transition.finished.catch(error => {
        if (error.name !== 'AbortError' && error.name !== 'InvalidStateError' && error.name !== 'TimeoutError') {
          console.error('تعذّر إنهاء انتقال الصفحة.',error);
        }
      }).finally(() => {
        if (routeTransition === transition) routeTransition = null;
      });
    } catch (error) {
      if (error.name !== 'InvalidStateError' && error.name !== 'AbortError') {
        console.error('تعذّر تشغيل انتقال الصفحة؛ سيُعرض المسار مباشرةً.',error);
      }
      change();
    }
  }

  function renderAdmin() {
    if (!$root || !adminAuthenticated()) return;
    $root.innerHTML = `<div class="admin-shell">
      <header class="admin-head"><div><h1>لوحة تاج عدن</h1><p>إدارة المتجر والعروض والإعدادات.</p></div><button class="btn btn-ghost" type="button" data-admin-action="logout">تسجيل الخروج</button></header>
      <div class="admin-warning">وضع تجريبي محلي: البيانات محفوظة في هذا المتصفح فقط، وتسجيل الدخول ليس حماية إنتاجية. لا ترفع هذه النسخة مباشرةً لموقع حقيقي.</div>
      <nav class="admin-tabs" aria-label="أقسام الإدارة" role="tablist">
        ${[['overview','نظرة عامة'],['products','المنتجات'],['offers','العروض'],['settings','الفئات والإعدادات']].map(([id,label]) => `<button class="admin-tab" type="button" role="tab" aria-selected="${tab === id}" data-admin-tab="${id}">${label}</button>`).join('')}
      </nav><section id="adminContent" aria-live="polite"></section></div>`;
    renderAdminTab();
  }

  function renderAdminTab() {
    const content = $('#adminContent');
    if (!content) return;
    if (tab === 'overview') {
      const out = model.products.filter(item => item.stock?.status === 'out').length;
      content.innerHTML = `<div class="admin-stats">
        ${[['المنتجات',model.products.length],['العروض الفعّالة',activeOffers().length],['نفدت كميتها',out],['الفئات',categories.length]].map(([label,value]) => `<article class="admin-card"><small>${label}</small><strong data-counter="${value}">0</strong></article>`).join('')}
      </div><div class="admin-card" style="margin-top:16px"><h2>ابدأ من هنا</h2><p>انشر منتجًا جديدًا، أضف صورًا متعددة، أو أنشئ عرضًا مؤقتًا. كل تغييراتك محفوظة محليًا في هذا المتصفح.</p><button class="btn btn-primary" type="button" data-admin-action="new-product">إضافة منتج</button></div>`;
      content.querySelectorAll('[data-counter]').forEach(el => {
        const end = Number(el.dataset.counter);
        const start = performance.now();
        const step = time => {
          const progress = Math.min(1, (time - start) / 650);
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) requestAnimationFrame(step);
        };
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) el.textContent = String(end);
        else requestAnimationFrame(step);
      });
    } else if (tab === 'products') renderProductsAdmin(content);
    else if (tab === 'offers') renderOffersAdmin(content);
    else if (tab === 'settings') renderSettings(content);
  }

  function renderProductsAdmin(content) {
    const list = model.products.filter(product => {
      const query = productQuery.trim().toLowerCase();
      const matchText = !query || `${product.name} ${product.desc}`.toLowerCase().includes(query);
      const matchFilter = productFilter === 'all' || (productFilter === 'hidden' ? product.published === false : product.stock?.status === productFilter);
      return matchText && matchFilter;
    });
    content.innerHTML = `<div class="admin-toolbar">
      <input id="adminProductSearch" type="search" placeholder="بحث بالاسم والوصف..." value="${esc(productQuery)}" aria-label="بحث المنتجات">
      <select id="adminProductFilter" aria-label="فلترة المنتجات"><option value="all">كل الحالات</option><option value="available">متوفر</option><option value="limited">كمية محدودة</option><option value="out">نفدت الكمية</option><option value="hidden">مخفي</option></select>
      <button class="btn btn-primary" type="button" data-admin-action="new-product">نشر منتج</button>
      <button class="admin-chip" type="button" data-admin-action="bulk-hide">إخفاء المحدد</button><button class="admin-chip" type="button" data-admin-action="bulk-delete">حذف المحدد</button>
    </div><div class="admin-list">${list.length ? list.map((product, index) => `<article class="admin-row" style="animation-delay:${Math.min(index,12)*35}ms">
      <div><label><input type="checkbox" data-product-select="${esc(product.id)}" aria-label="تحديد ${esc(product.name)}"> <strong>${esc(product.name)}</strong></label>
      <p>${esc(categories.find(item => item.id === product.cat)?.name || 'فئة غير معروفة')} · ${product.published === false ? 'مخفي' : product.stock?.status === 'out' ? 'نفدت الكمية' : product.stock?.status === 'limited' ? `كمية محدودة (${Number(product.stock.qty)||0})` : 'متوفر'}</p></div>
      <div class="admin-actions"><button type="button" data-admin-action="edit-product" data-id="${esc(product.id)}">تعديل</button><button type="button" data-admin-action="copy-product" data-id="${esc(product.id)}">نسخ</button><button type="button" data-admin-action="stock-out" data-id="${esc(product.id)}">نفدت الكمية</button><button type="button" data-admin-action="delete-product" data-id="${esc(product.id)}">حذف</button></div>
    </article>`).join('') : '<div class="admin-empty">لا توجد منتجات مطابقة.</div>'}</div>`;
    $('#adminProductFilter').value = productFilter;
  }

  function renderProductForm(product) {
    editingId = product?.id || null;
    const item = product ? prepareProduct(product) : {
      id: '', cat: categories[0]?.id || '', sub: '', name: '', desc: '', specs: [],
      images: [], featured: 0, offer: false,
      stock: { status: 'available', qty: 0 }, published: true
    };
    formImages = [...(item.images || [])];
    const offer = offers.find(candidate => candidate.productIds.includes(item.id) && offerStatus(candidate) !== 'منتهي');
    const cats = categories.map(category => `<option value="${esc(category.id)}" ${item.cat === category.id ? 'selected' : ''}>${esc(category.name)}</option>`).join('');
    const endLocal = offer?.endsAt ? new Date(offer.endsAt).toISOString().slice(0,16) : new Date(Date.now()+7*86400000).toISOString().slice(0,16);
    $('#adminContent').innerHTML = `<form id="productForm" class="admin-form" novalidate>
      <h2 class="wide">${editingId ? 'تعديل المنتج' : 'نشر منتج جديد'}</h2>
      <label>الفئة<select name="cat" required>${cats}</select></label>
      <label>التصنيف الفرعي<input name="sub" value="${esc(item.sub)}" maxlength="70"></label>
      <label>اسم المنتج<input name="name" value="${esc(item.name)}" required maxlength="100"></label>
      <label class="wide">الوصف<textarea name="desc" maxlength="500" required>${esc(item.desc)}</textarea></label>
      <label class="wide">المواصفات — ميزة واحدة في كل سطر<textarea name="specs" maxlength="1500">${esc((item.specs||[]).join('\n'))}</textarea></label>
      <label>حالة المخزون<select name="stockStatus"><option value="available" ${item.stock.status==='available'?'selected':''}>متوفر</option><option value="limited" ${item.stock.status==='limited'?'selected':''}>كمية محدودة</option><option value="out" ${item.stock.status==='out'?'selected':''}>نفدت الكمية</option></select></label>
      <label>الكمية المتاحة<input name="stockQty" type="number" min="0" step="1" value="${Number(item.stock.qty)||0}"></label>
      <label class="inline"><input name="published" type="checkbox" ${item.published!==false?'checked':''}> نشر المنتج للزوار</label>
      <label class="inline"><input name="offerEnabled" id="offerEnabled" type="checkbox" ${offer?'checked':''}> إدخال المنتج في العروض</label>
      <div class="wide" id="offerFields" ${offer?'':'hidden'}><div class="admin-form">
        <label>اسم العرض<input name="offerName" value="${esc(offer?.name||'عرض خاص')}"></label>
        <label>سبب العرض<input name="offerReason" value="${esc(offer?.reason||'')}"></label>
        <label class="wide">ينتهي في<input name="offerEnds" type="datetime-local" value="${esc(endLocal)}"></label>
      </div></div>
      <div class="image-drop" id="imageDrop"><label>اسحب الصور إلى هنا أو اختر عدة صور<input id="imageFiles" type="file" accept="image/*" multiple></label><small>تُضغط الصور إلى WebP قدر الإمكان، مع حفظها محليًا في المتصفح.</small></div>
      <div class="image-thumbs" id="imageThumbs"></div>
      <div class="admin-preview"><strong>معاينة المنتج</strong><div id="productPreview">${previewCard(item)}</div></div>
      <div class="wide admin-actions"><button class="btn btn-primary" type="submit">${editingId?'حفظ التعديلات':'نشر المنتج'}</button><button class="admin-chip" type="button" data-admin-action="cancel-form">إلغاء</button></div>
      <p class="wide login-error" id="productFormError" role="alert"></p></form>`;
    $('#productForm').dataset.featured = String(Number(item.featured)||0);
    renderImageThumbs();
  }

  function previewCard(product) {
    return `<article class="pcard"><span class="art">${product.images?.[product.featured||0] ? `<img class="pimg" src="${esc(product.images[product.featured||0])}" alt="">` : '<span class="wm">ج</span>'}</span><div class="pc-body"><span class="pc-cat">${esc(categories.find(category => category.id === product.cat)?.name || '')}</span><h3>${esc(product.name || 'اسم المنتج')}</h3><p>${esc(product.desc || 'وصف المنتج')}</p></div></article>`;
  }

  function renderImageThumbs() {
    const target = $('#imageThumbs');
    if (!target) return;
    target.innerHTML = formImages.map((image, index) => `<div class="image-thumb"><img src="${esc(image)}" alt="صورة ${index+1}"><button type="button" class="${index === Number($('#productForm')?.dataset.featured||0) ? 'featured' : ''}" data-image-action="feature" data-index="${index}">${index === Number($('#productForm')?.dataset.featured||0) ? 'الصورة الرئيسية' : 'اجعلها رئيسية'}</button><button type="button" data-image-action="up" data-index="${index}" ${index===0?'disabled':''}>${icon('arrow-up')}<span>رفع</span></button><button type="button" data-image-action="down" data-index="${index}" ${index===formImages.length-1?'disabled':''}>${icon('arrow-down')}<span>خفض</span></button><button type="button" data-image-action="delete" data-index="${index}">حذف الصورة</button></div>`).join('');
  }

  function updatePreview() {
    const form = $('#productForm');
    if (!form) return;
    const data = new FormData(form);
    const card = $('#productPreview');
    if (card) card.innerHTML = previewCard({
      cat: data.get('cat'), name: data.get('name'), desc: data.get('desc'),
      images: formImages,
      featured: Number(form.dataset.featured||0)
    });
    const fields = $('#offerFields');
    if (fields) fields.hidden = !data.get('offerEnabled');
  }

  async function imageToWebp(file) {
    if (!file.type.startsWith('image/')) throw new Error(`الملف ${file.name} ليس صورة.`);
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذّر تجهيز مساحة ضغط الصور.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .82));
    if (!blob) throw new Error(`تعذّر ضغط الصورة ${file.name}.`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`تعذّرت قراءة الصورة ${file.name}.`));
      reader.readAsDataURL(blob);
    });
  }

  function findOrCreateOffer(product, data) {
    const offerName = String(data.get('offerName') || '').trim();
    const ends = Date.parse(String(data.get('offerEnds') || ''));
    if (!offerName || !Number.isFinite(ends) || ends <= Date.now()) {
      throw new Error('أدخل اسم العرض وموعد انتهاء مستقبليًا.');
    }
    const endsAt = new Date(ends).toISOString();
    let offer = offers.find(item => item.id === product.offerId && offerStatus(item) !== 'منتهي');
    if (offer && offer.productIds.length > 1) {
      offer.productIds = offer.productIds.filter(id => id !== product.id);
      offer = null;
    }
    if (!offer) {
      offer = { id: `offer-${crypto.randomUUID()}`, productIds: [], startsAt: nowIso() };
      offers.push(offer);
    }
    Object.assign(offer, {
      name: offerName,
      reason: String(data.get('offerReason') || '').trim(),
      endsAt,
      productIds: [...new Set([...(offer.productIds || []), product.id])]
    });
    product.offerId = offer.id;
    product.offerEndsAt = offer.endsAt;
    product.offer = true;
  }

  async function saveProduct(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const error = $('#productFormError');
    error.textContent = '';
    const name = String(data.get('name') || '').trim();
    if (name.length < 2 || !categories.some(item => item.id === data.get('cat'))) {
      error.textContent = 'تحقق من اسم المنتج والفئة.';
      return;
    }
    const previous = model.products.find(item => item.id === editingId);
    const product = previous || { id: `p-${crypto.randomUUID()}`, images: [], specs: [], stock: { status:'available',qty:0 } };
    Object.assign(product, {
      cat: String(data.get('cat')),
      sub: String(data.get('sub') || '').trim(),
      name,
      desc: String(data.get('desc') || '').trim(),
      specs: String(data.get('specs') || '').split('\n').map(value => value.trim()).filter(Boolean),
      stock: { status: String(data.get('stockStatus')), qty: Math.max(0,Math.floor(Number(data.get('stockQty'))||0)) },
      published: Boolean(data.get('published')),
      images: formImages,
      featured: Math.max(0,Number(form.dataset.featured)||0)
    });
    if (data.get('offerEnabled')) {
      try { findOrCreateOffer(product,data); }
      catch (caught) { error.textContent = caught.message; return; }
    } else {
      if (product.offerId) {
        offers = offers.filter(offer => {
          offer.productIds = offer.productIds.filter(id => id !== product.id);
          return offer.productIds.length > 0;
        });
      }
      product.offerId = '';
      product.offerEndsAt = '';
      product.offer = false;
    }
    if (!previous) model.products.unshift(product);
    try {
      await saveState();
      model.refresh();
      toast(previous ? 'تم حفظ تعديلات المنتج.' : 'تم نشر المنتج.');
      tab = 'products';
      renderAdminTab();
    } catch (caught) { showError(caught); }
  }

  function renderOffersAdmin(content) {
    const filtered = offers.filter(offer => !offerQuery || `${offer.name} ${offer.reason}`.toLowerCase().includes(offerQuery.toLowerCase()));
    const end = new Date(Date.now()+7*86400000).toISOString().slice(0,16);
    content.innerHTML = `<form class="admin-form" id="bulkOfferForm">
      <h2 class="wide">إنشاء عرض وتطبيقه على منتجات متعددة</h2>
      <label>اسم العرض<input name="name" required></label>
      <label>سبب العرض<input name="reason"></label>
      <label>يبدأ في<input name="startsAt" type="datetime-local" value="${esc(new Date().toISOString().slice(0,16))}" required></label>
      <label>ينتهي في<input name="endsAt" type="datetime-local" value="${esc(end)}" required></label>
      <div class="wide"><p>المنتجات المشمولة</p><div class="settings-grid">${model.products.map(product => `<label class="inline"><input type="checkbox" name="productIds" value="${esc(product.id)}">${esc(product.name)}</label>`).join('')}</div></div>
      <button class="btn btn-primary wide" type="submit">تطبيق العرض المحدد</button><p class="wide login-error" id="bulkOfferError" role="alert"></p>
    </form>
    <div class="admin-toolbar"><input id="adminOfferSearch" type="search" value="${esc(offerQuery)}" placeholder="بحث في العروض" aria-label="بحث العروض"></div>
      <div class="admin-list">${filtered.length ? filtered.map((offer,index) => `<article class="admin-row" style="animation-delay:${Math.min(index,12)*35}ms"><div><h3>${esc(offer.name)}</h3><p><span class="offer-badge">${offerStatus(offer)}</span> · ${esc(offer.reason||'دون سبب')} · ينتهي ${new Date(offer.endsAt).toLocaleString('ar-IQ')} · ${offer.productIds.length} منتج</p></div><div class="admin-actions"><button type="button" data-admin-action="extend-offer" data-id="${esc(offer.id)}">تمديد 7 أيام</button><button type="button" data-admin-action="end-offer" data-id="${esc(offer.id)}">إنهاء الآن</button><button type="button" data-admin-action="delete-offer" data-id="${esc(offer.id)}">حذف العرض</button></div></article>`).join('') : '<div class="admin-empty">لا توجد عروض مسجلة.</div>'}</div>`;
  }

  async function saveBulkOffer(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    const ids = data.getAll('productIds').map(String);
    const startsAt = Date.parse(String(data.get('startsAt')||''));
    const endsAt = Date.parse(String(data.get('endsAt')||''));
    if (!ids.length || !String(data.get('name')||'').trim() || !Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt >= endsAt) {
      $('#bulkOfferError').textContent='أدخل اسمًا ومدة صحيحة، وحدد منتجًا واحدًا على الأقل.';
      return;
    }
    const offer = {
      id:`offer-${crypto.randomUUID()}`,
      name:String(data.get('name')).trim(),
      reason:String(data.get('reason')||'').trim(),
      startsAt:new Date(startsAt).toISOString(),
      endsAt:new Date(endsAt).toISOString(),
      productIds:ids
    };
    offers.forEach(old => { old.productIds = old.productIds.filter(productId => !ids.includes(productId)); });
    offers.push(offer);
    ids.forEach(id => {
      const product = model.products.find(item => item.id === id);
      if (!product) return;
      product.offerId = offer.id;
      product.offerEndsAt = offer.endsAt;
    });
    offers = offers.filter(item => item.productIds.length);
    syncOffers();
    await saveState();
    renderAdminTab();
    toast(offerStatus(offer)==='مجدول'?'تمت جدولة العرض.':'تم تطبيق العرض على المنتجات المحددة.');
  }

  function renderSettings(content) {
    content.innerHTML = `<form class="admin-form" id="settingsForm">
      <h2 class="wide">الفئات وبيانات المتجر</h2>
      <p class="wide">سمِّ فئات المتجر وأضف الأنواع الفرعية التي تظهر للزبائن عند تصفح المنتجات.</p>
      <div class="category-admin-list wide">${categories.map((category,index) => `<section class="category-admin-card">
        <div class="category-admin-heading"><strong>الفئة ${index+1}</strong><span>${category.items.length} أنواع فرعية</span></div>
        <label>اسم الفئة<input data-category-name="${esc(category.id)}" value="${esc(category.name)}" maxlength="60" required></label>
        <label>الاسم بالإنجليزية<input data-category-en="${esc(category.id)}" value="${esc(category.en||'')}" maxlength="40" placeholder="مثال: KITCHEN"></label>
        <label class="wide">الأنواع الفرعية — كل نوع في سطر<textarea data-category-items="${esc(category.id)}" maxlength="1200" rows="3">${esc(category.items.join('\n'))}</textarea></label>
        <div class="category-admin-actions"><button type="button" data-admin-action="cat-up" data-index="${index}" aria-label="رفع الفئة" ${index===0?'disabled':''}>↑ ترتيب</button><button type="button" data-admin-action="cat-down" data-index="${index}" aria-label="خفض الفئة" ${index===categories.length-1?'disabled':''}>↓ ترتيب</button><button type="button" class="category-delete" data-admin-action="delete-category" data-id="${esc(category.id)}">حذف الفئة</button></div>
      </section>`).join('')}</div>
      <section class="category-create wide">
        <h3>إضافة فئة جديدة</h3>
        <p>اكتب اسم الفئة، وأضف الأنواع الفرعية إن وجدت. تقدر تعدّلها لاحقًا.</p>
        <div class="category-create-fields">
          <label>اسم الفئة<input id="newCategoryName" maxlength="60" placeholder="مثال: معدات التنظيف"></label>
          <label>الاسم بالإنجليزية <small>(اختياري)</small><input id="newCategoryEn" maxlength="40" placeholder="مثال: CLEANING"></label>
          <label class="wide">الأنواع الفرعية <small>(اختياري — كل نوع في سطر)</small><textarea id="newCategoryItems" maxlength="1200" rows="3" placeholder="مثال: مكانس تجارية&#10;معدات تعقيم"></textarea></label>
        </div>
        <button type="button" class="btn btn-ghost" data-admin-action="create-category">إضافة الفئة</button>
      </section>
      <label>رقم واتساب<input name="whatsapp" dir="ltr" value="${esc(settings.whatsapp)}"></label>
      <label>رقم واتساب الثاني<input name="whatsapp2" dir="ltr" value="${esc(settings.whatsapp2||model.config.contact.whatsapp2)}"></label>
      <label>العنوان<input name="address" value="${esc(settings.address)}"></label>
      <label>ساعات العمل<input name="hours" value="${esc(settings.hours)}"></label>
      <div class="wide"><h3>قالب الموقع</h3><div class="theme-options">
        <button type="button" data-theme-choice="dark">داكن</button><button type="button" data-theme-choice="light">فاتح</button>
      </div></div>
      <div class="wide admin-actions"><button class="btn btn-primary" type="submit">حفظ الإعدادات</button><button class="admin-chip" type="button" data-admin-action="export">تصدير JSON</button><label class="admin-chip">استيراد JSON<input type="file" id="importFile" accept="application/json,.json" hidden></label></div>
      <p class="wide">تغيير كلمة المرور المحلية (تجزئة فقط؛ لا تعتبرها مصادقة آمنة):</p>
      <label>كلمة المرور الحالية<input name="oldPassword" type="password" autocomplete="current-password"></label>
      <label>كلمة المرور الجديدة<input name="newPassword" type="password" autocomplete="new-password"></label>
      <button class="btn btn-ghost wide" type="button" data-admin-action="change-password">تغيير كلمة المرور</button>
    </form>`;
    content.querySelectorAll('[data-theme-choice]').forEach(button => {
      if (button.dataset.themeChoice === settings.theme) button.setAttribute('aria-pressed','true');
    });
  }

  async function sha256(value) {
    if (!crypto.subtle) throw new Error('يتطلب التحقق Web Crypto. افتح الموقع عبر HTTPS أو localhost.');
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),byte => byte.toString(16).padStart(2,'0')).join('');
  }

  async function verifyLogin(user, password) {
    const expected = localStorage.getItem('taj_admin_hash') || defaultLoginHash;
    const actual = await sha256(`${user}:${password}`);
    return actual === expected;
  }

  function readSelected() {
    return [...document.querySelectorAll('[data-product-select]:checked')].map(input => input.dataset.productSelect);
  }

  async function deleteProducts(ids) {
    const targets = model.products.filter(item => ids.includes(item.id));
    if (!targets.length) return;
    if (!confirm(`حذف ${targets.length} منتج؟ يمكنك التراجع خلال 6 ثوانٍ.`)) return;
    lastDeleted = targets.map(item => ({...item,images:[...(item.images||[])]}));
    offers.forEach(offer => { offer.productIds = offer.productIds.filter(id => !ids.includes(id)); });
    offers = offers.filter(offer => offer.productIds.length > 0);
    model.products.splice(0,model.products.length,...model.products.filter(item => !ids.includes(item.id)));
    clearTimeout(deleteTimer);
    await saveState();
    model.refresh();
    toast('حُذفت المنتجات. التراجع متاح 6 ثوانٍ.', 'undo-delete');
    deleteTimer = setTimeout(() => { lastDeleted = null; },6000);
    renderAdminTab();
  }

  async function restoreDelete() {
    if (!lastDeleted) return;
    model.products.unshift(...lastDeleted);
    lastDeleted = null;
    clearTimeout(deleteTimer);
    await saveState();
    model.refresh();
    renderAdminTab();
    toast('تم التراجع عن الحذف.');
  }

  async function exportData() {
    const file = new Blob([JSON.stringify({products:model.products,categories,offers,settings},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'taj-aden-backup.json';
    link.click();
    URL.revokeObjectURL(url);
    toast('تم تصدير نسخة JSON.');
  }

  async function importData(file) {
    if (!file) return;
    let data;
    try { data = JSON.parse(await file.text()); }
    catch { throw new Error('ملف JSON غير صالح.'); }
    if (!Array.isArray(data.products) || !Array.isArray(data.categories) || !Array.isArray(data.offers) || !data.categories.length) {
      throw new Error('يجب أن يحتوي الملف على قوائم منتجات وفئات وعروض صالحة.');
    }
    const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
    const uniqueIds = items => {
      const ids = items.map(item => item?.id);
      return ids.every(validId) && new Set(ids).size === ids.length;
    };
    const validCategories = uniqueIds(data.categories) && data.categories.every(item =>
      typeof item.name === 'string' && Array.isArray(item.items) && item.items.every(value => typeof value === 'string')
    );
    const validProducts = uniqueIds(data.products) && data.products.every(item =>
      item && typeof item.name === 'string' &&
      data.categories.some(category => category.id === item.cat)
    );
    const validProductIds = new Set(data.products.map(item => item?.id));
    const validOffers = uniqueIds(data.offers) && data.offers.every(item =>
      typeof item.name === 'string' &&
      Array.isArray(item.productIds) && item.productIds.every(id => validId(id) && validProductIds.has(id)) &&
      Number.isFinite(Date.parse(item.startsAt)) && Number.isFinite(Date.parse(item.endsAt))
    );
    if (!validCategories || !validProducts || !validOffers || !confirm('سيستبدل الاستيراد المنتجات والفئات والعروض الحالية. هل تتابع؟')) {
      if (!validCategories || !validProducts || !validOffers) throw new Error('يتضمن الملف بيانات فئات أو منتجات أو عروض غير صالحة.');
      return;
    }
    model.products.splice(0,model.products.length,...data.products.map(prepareProduct));
    categories = data.categories;
    model.categories.splice(0,model.categories.length,...categories);
    offers = data.offers;
    settings = {...settings,...(data.settings||{})};
    syncOffers();
    await saveState();
    model.refresh();
    toast('تم استيراد نسخة JSON.');
    renderAdminTab();
  }

  function updateContact() {
    model.config.contact.whatsapp = settings.whatsapp;
    model.config.contact.whatsapp2 = settings.whatsapp2||model.config.contact.whatsapp2;
    model.refresh();
  }

  async function changePassword() {
    const form = $('#settingsForm');
    const oldPassword = String(new FormData(form).get('oldPassword') || '');
    const newPassword = String(new FormData(form).get('newPassword') || '');
    if (newPassword.length < 8) throw new Error('كلمة المرور الجديدة يجب ألا تقل عن 8 محارف.');
    const username = $('#loginUser').value.trim();
    const valid = await verifyLogin(username,oldPassword);
    if (!valid) throw new Error('كلمة المرور الحالية غير صحيحة.');
    localStorage.setItem('taj_admin_hash',await sha256(`${username}:${newPassword}`));
    toast('تم تغيير كلمة المرور على هذا المتصفح.');
    form.elements.oldPassword.value = '';
    form.elements.newPassword.value = '';
  }

  function parseCategoryItems(value) {
    const items = String(value || '').split(/[\n,]/).map(item => item.trim()).filter(Boolean);
    if (items.length > 30 || items.some(item => item.length > 70)) {
      throw new Error('أضف 30 نوعًا فرعيًا كحد أقصى، وبحد أقصى 70 حرفًا لكل نوع.');
    }
    return [...new Map(items.map(item => [item.toLocaleLowerCase('ar-IQ'), item])).values()];
  }

  function syncCategories() {
    model.categories.splice(0,model.categories.length,...categories);
    model.refresh();
  }

  async function createCategory() {
    const nameInput = $('#newCategoryName');
    const name = nameInput.value.trim();
    const en = $('#newCategoryEn').value.trim();
    if (name.length < 2) {
      nameInput.focus();
      throw new Error('اكتب اسمًا للفئة من حرفين على الأقل.');
    }
    if (categories.some(category => category.name.trim().toLocaleLowerCase('ar-IQ') === name.toLocaleLowerCase('ar-IQ'))) {
      nameInput.focus();
      throw new Error('هذا الاسم موجود مسبقًا. اختر اسمًا آخر.');
    }
    if (en.length > 40) throw new Error('الاسم الإنجليزي يجب ألا يتجاوز 40 حرفًا.');
    const category = {
      id: `category-${crypto.randomUUID()}`,
      name,
      en,
      items: parseCategoryItems($('#newCategoryItems').value)
    };
    categories.push(category);
    syncCategories();
    await saveState();
    renderAdminTab();
    toast('تمت إضافة الفئة. تقدر الآن تختارها عند نشر منتج.');
  }

  async function deleteCategory(id) {
    const category = categories.find(item => item.id === id);
    if (!category) throw new Error('الفئة المطلوبة غير موجودة.');
    if (categories.length <= 1) throw new Error('لا يمكن حذف آخر فئة في المتجر.');
    const productCount = model.products.filter(product => product.cat === id).length;
    if (productCount) {
      throw new Error(`لا يمكن حذف هذه الفئة؛ فيها ${productCount} منتج. انقل المنتجات إلى فئة أخرى أو احذفها أولًا.`);
    }
    if (!confirm(`حذف فئة «${category.name}»؟`)) return;
    categories = categories.filter(item => item.id !== id);
    syncCategories();
    await saveState();
    renderAdminTab();
    toast('تم حذف الفئة.');
  }

  window.addEventListener('hashchange',routeChanged);
  document.addEventListener('click', async event => {
    const target = event.target;
    const action = target.closest('[data-admin-action]');
    const actionName = action?.dataset.adminAction;
    if (target.closest('#menuBtn') && !document.body.classList.contains('route-admin')) {
      setTimeout(() => $('#loginUser')?.focus(),80);
    }
    if (actionName === 'undo-delete') {
      try { await restoreDelete(); } catch (error) { showError(error); }
      return;
    }
    if (target.closest('[data-theme-choice]')) {
      settings.theme = target.closest('[data-theme-choice]').dataset.themeChoice === 'light' ? 'light' : 'dark';
      applyTheme(settings.theme, event);
      saveState().catch(showError);
      if (tab === 'settings') renderAdminTab();
      return;
    }
    if (!actionName) {
      const imageAction = target.closest('[data-image-action]');
      if (imageAction) {
        const index = Number(imageAction.dataset.index);
        const form=$('#productForm');
        let featured=Number(form?.dataset.featured||0);
        if (imageAction.dataset.imageAction === 'delete') {
          formImages.splice(index,1);
          if(index<featured)featured--;
          else if(index===featured)featured=Math.min(featured,formImages.length-1);
        }
        if (imageAction.dataset.imageAction === 'up' && index > 0) {
          [formImages[index-1],formImages[index]] = [formImages[index],formImages[index-1]];
          if(featured===index)featured--;
          else if(featured===index-1)featured++;
        }
        if (imageAction.dataset.imageAction === 'down' && index < formImages.length-1) {
          [formImages[index+1],formImages[index]] = [formImages[index],formImages[index+1]];
          if(featured===index)featured++;
          else if(featured===index+1)featured--;
        }
        if (imageAction.dataset.imageAction === 'feature') {
          featured=index;
        }
        if(form)form.dataset.featured=String(Math.max(0,featured));
        renderImageThumbs();
        updatePreview();
      }
      const adminTab = target.closest('[data-admin-tab]');
      if (adminTab) { tab = adminTab.dataset.adminTab; renderAdminTab(); }
      const adminAction = target.closest('[data-admin-action]');
      if (adminAction) event.stopPropagation();
      if (target.closest('#offerEnabled')) updatePreview();
      return;
    }
    event.preventDefault();
    if (document.body.classList.contains('route-admin')) refreshIdle();
    try {
      if (actionName === 'logout') logout(true);
      else if (actionName === 'new-product') renderProductForm(null);
      else if (actionName === 'edit-product') renderProductForm(model.products.find(item => item.id === action.dataset.id));
      else if (actionName === 'cancel-form') { tab = 'products'; renderAdminTab(); }
      else if (actionName === 'copy-product') {
        const original = model.products.find(item => item.id === action.dataset.id);
        if (original) {
          const copy = {...original,id:`p-${crypto.randomUUID()}`,name:`${original.name} — نسخة`,images:[...(original.images||[])],specs:[...(original.specs||[])],offerId:'',offerEndsAt:'',offer:false};
          model.products.unshift(copy);await saveState();model.refresh();renderAdminTab();toast('تم نسخ المنتج.');
        }
      } else if (actionName === 'stock-out') {
        const product = model.products.find(item => item.id === action.dataset.id);
        if (product) {
          product.stock = {...product.stock,status:'out'};
          model.removeFromCart(product.id);
          await saveState();model.refresh();renderAdminTab();toast('تم تحديث المخزون.');
        }
      } else if (actionName === 'delete-product') await deleteProducts([action.dataset.id]);
      else if (actionName === 'bulk-delete') await deleteProducts(readSelected());
      else if (actionName === 'bulk-hide') {
        readSelected().forEach(id => {const product=model.products.find(item=>item.id===id);if(product)product.published=false;});
        await saveState();model.refresh();renderAdminTab();toast('تم إخفاء المنتجات المحددة.');
      } else if (actionName === 'extend-offer') {
        const offer = offers.find(item => item.id === action.dataset.id);
        if (offer) { offer.endsAt = new Date(Math.max(Date.now(),Date.parse(offer.endsAt))+7*86400000).toISOString();syncOffers();await saveState();renderAdminTab();toast('تم تمديد العرض 7 أيام.'); }
      } else if (actionName === 'end-offer') {
        const offer = offers.find(item => item.id === action.dataset.id);
        if (offer && confirm('إنهاء العرض الآن؟')) { offer.endsAt=nowIso();syncOffers();await saveState();renderAdminTab();toast('تم إنهاء العرض.'); }
      } else if (actionName === 'delete-offer') {
        const offer=offers.find(item=>item.id===action.dataset.id);
        if(offer&&confirm('حذف هذا العرض؟')){offer.productIds.forEach(id=>{const p=model.products.find(item=>item.id===id);if(p){p.offer=false;p.offerId='';p.offerEndsAt='';}});offers=offers.filter(item=>item.id!==offer.id);await saveState();model.refresh();renderAdminTab();toast('تم حذف العرض.');}
      } else if (actionName === 'create-category') await createCategory();
      else if (actionName === 'delete-category') await deleteCategory(action.dataset.id);
      else if (actionName === 'cat-up' || actionName === 'cat-down') {
        const index=Number(action.dataset.index),step=actionName==='cat-up'?-1:1,next=index+step;
        if(next>=0&&next<categories.length){[categories[index],categories[next]]=[categories[next],categories[index]];syncCategories();await saveState();renderAdminTab();}
      } else if (actionName === 'export') await exportData();
      else if (actionName === 'change-password') await changePassword();
    } catch (error) { showError(error); }
  });

  document.addEventListener('submit', async event => {
    if (event.target.id === 'loginForm') {
      event.preventDefault();
      const user = $('#loginUser').value.trim();
      const password = $('#loginPass').value;
      const error = $('#loginError');
      const panel = $('#menuPanel');
      const lockUntil = Number(localStorage.getItem(LOCK_KEY)||0);
      if (Date.now() < lockUntil) {
        error.textContent = `محاولات كثيرة. أعد المحاولة بعد ${Math.ceil((lockUntil-Date.now())/1000)} ثانية.`;
        return;
      }
      try {
        if (await verifyLogin(user,password)) {
          localStorage.removeItem(LOCK_KEY);
          localStorage.setItem(SESSION_KEY,crypto.randomUUID());
          localStorage.setItem(SESSION_AT,String(Date.now()));
          $('#loginPass').value='';
          error.textContent = 'تم تسجيل الدخول بنجاح.';
          setTimeout(() => { panel.classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');location.hash='#/admin'; },400);
        } else {
          const count = Number(sessionStorage.getItem('taj_failed_logins')||0)+1;
          sessionStorage.setItem('taj_failed_logins',String(count));
          error.textContent = 'البيانات غير صحيحة';
          panel.classList.remove('shake');void panel.offsetWidth;panel.classList.add('shake');
          if (count >= 5) {
            localStorage.setItem(LOCK_KEY,String(Date.now()+30000));
            sessionStorage.removeItem('taj_failed_logins');
            error.textContent = 'محاولات كثيرة. تم قفل الدخول 30 ثانية.';
          }
        }
      } catch (caught) { error.textContent = caught.message; }
    } else if (event.target.id === 'productForm') {
      await saveProduct(event);
    } else if (event.target.id === 'settingsForm') {
      event.preventDefault();
      const data = new FormData(event.target);
      let categoryEdits;
      try {
        categoryEdits = categories.map(category => {
          const name = [...event.target.querySelectorAll('[data-category-name]')].find(input => input.dataset.categoryName === category.id)?.value.trim();
          const en = [...event.target.querySelectorAll('[data-category-en]')].find(input => input.dataset.categoryEn === category.id)?.value.trim();
          const items = [...event.target.querySelectorAll('[data-category-items]')].find(input => input.dataset.categoryItems === category.id)?.value;
          return {...category,name:name||'',en:en||'',items:parseCategoryItems(items)};
        });
      } catch (error) {
        showError(error);
        return;
      }
      if (categoryEdits.some(category => category.name.length < 2 || category.name.length > 60 || category.en.length > 40)) {
        showError(new Error('تحقق من أسماء الفئات: الاسم العربي من حرفين إلى 60 حرفًا، والإنجليزي 40 حرفًا كحد أقصى.'));
        return;
      }
      const categoryNames = categoryEdits.map(category => category.name.toLocaleLowerCase('ar-IQ'));
      if (new Set(categoryNames).size !== categoryNames.length) {
        showError(new Error('توجد فئات تحمل الاسم نفسه. اجعل أسماء الفئات مختلفة.'));
        return;
      }
      const whatsapp = String(data.get('whatsapp')||'').trim();
      const whatsapp2 = String(data.get('whatsapp2')||'').trim();
      if (!/^07\d{9}$/.test(whatsapp) || !/^07\d{9}$/.test(whatsapp2)) {
        showError(new Error('أدخل رقمي واتساب عراقيين صحيحين، كل رقم من 11 رقمًا ويبدأ بـ 07.'));
        return;
      }
      categoryEdits.forEach((edited,index) => Object.assign(categories[index],edited));
      syncCategories();
      settings = {...settings,whatsapp,whatsapp2,address:String(data.get('address')||'').trim(),hours:String(data.get('hours')||'').trim()};
      updateContact();
      await saveState();
      renderAdminTab();
      toast('تم حفظ الإعدادات والفئات.');
    } else if (event.target.id === 'bulkOfferForm') {
      try { await saveBulkOffer(event); } catch (error) { showError(error); }
    }
  });

  document.addEventListener('input', event => {
    if (event.target.id === 'adminProductSearch') { productQuery=event.target.value;renderAdminTab();$('#adminProductSearch')?.focus(); }
    else if (event.target.id === 'adminOfferSearch') { offerQuery=event.target.value;renderAdminTab();$('#adminOfferSearch')?.focus(); }
    else if (event.target.matches('[data-category-name]')) return;
    else if (event.target.closest('#productForm')) updatePreview();
  });

  document.addEventListener('change', async event => {
    if (event.target.id === 'adminProductFilter') { productFilter=event.target.value;renderAdminTab(); }
    else if (event.target.id === 'imageFiles') {
      const files = [...event.target.files];
      if (!files.length) return;
      const input = event.target;
      input.disabled = true;
      try {
        for (const file of files) formImages.push(await imageToWebp(file));
        renderImageThumbs();updatePreview();
      } catch (error) { showError(error); }
      finally { input.disabled=false;input.value=''; }
    } else if (event.target.id === 'importFile') {
      try { await importData(event.target.files[0]); } catch (error) { showError(error); }
      event.target.value='';
    }
  });

  document.addEventListener('dragover', event => {
    if (event.target.closest('#imageDrop')) event.preventDefault();
  });
  document.addEventListener('drop', async event => {
    if (!event.target.closest('#imageDrop')) return;
    event.preventDefault();
    try {
      for (const file of [...event.dataTransfer.files]) formImages.push(await imageToWebp(file));
      renderImageThumbs();updatePreview();
    } catch (error) { showError(error); }
  });

  document.addEventListener('pointerdown', refreshIdle, {passive:true});
  document.addEventListener('keydown', refreshIdle);

  $('#passToggle')?.addEventListener('click', event => {
    const input = $('#loginPass');
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    event.currentTarget.setAttribute('aria-pressed',String(visible));
    event.currentTarget.setAttribute('aria-label',visible?'إخفاء كلمة المرور':'إظهار كلمة المرور');
  });

  openDatabase().then(async connection => {
    db = connection;
    const saved = await readState();
    if (saved) {
      model.products.splice(0,model.products.length,...saved.products.map(prepareProduct));
      categories = saved.categories;
      model.categories.splice(0,model.categories.length,...categories);
      offers = saved.offers || [];
      settings = {...settings,...(saved.settings||{})};
      /* Migrate the old contact/theme state so legacy local data cannot bring back removed accounts. */
      if (!settings.whatsapp || ['07779836432','9647779836432','07740100034'].includes(settings.whatsapp)) settings.whatsapp = '07711117619';
      if (!settings.whatsapp2 || settings.whatsapp2 === '07740100034') settings.whatsapp2 = '07811117619';
      if (!settings.address || settings.address === 'العراق' || settings.address.includes('الكرادة')) settings.address = 'الوزيرية — قرب الفلكة';
      delete settings.telegram;
      delete settings.instagram;
      settings.theme = storedTheme();
    } else {
      loadSeedOffers();
      await saveState();
    }
    applyTheme(settings.theme);
    syncOffers();
    model.refresh();
    updateContact();
    routeChanged();
    scheduleOfferRefresh();
  }).catch(error => {
    showError(error);
    routeChanged();
  });

  window.addEventListener('taj-order-sent',() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors=['#D6AE52','#F2D98B','#FFFFFF','#98701F'];
    for(let index=0;index<26;index++){
      const piece=document.createElement('i');
      piece.className='confetti-piece';
      piece.style.setProperty('--x',`${40+Math.random()*20}vw`);
      piece.style.setProperty('--y',`${36+Math.random()*20}vh`);
      piece.style.setProperty('--dx',`${Math.random()*240-120}px`);
      piece.style.setProperty('--dy',`${150+Math.random()*220}px`);
      piece.style.setProperty('--rot',`${Math.random()*720-360}deg`);
      piece.style.setProperty('--c',colors[index%colors.length]);
      document.body.appendChild(piece);
      setTimeout(()=>piece.remove(),1400);
    }
  });
})();
