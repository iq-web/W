/* موشن جرافيكس: نص حركي مرتبط بالسكرول، جزيئات المشاهد، بارالاكس الزجاج، توهج المؤشر.
   لا يعتمد على أي مكتبة، ويحترم prefers-reduced-motion. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePtr = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  /* ---------- جزيئات المشاهد (بخار يصعد / ثلج يتساقط) ---------- */
  function initSceneFx() {
    if (reduced) return;
    $$('.scene[data-fx="rise"],.scene[data-fx="fall"]').forEach(scene => {
      const box = $('.sc-fx', scene);
      if (!box || box.childElementCount) return;
      const rise = scene.dataset.fx === 'rise';
      for (let i = 0; i < 9; i++) {
        const p = document.createElement('i');
        const size = rise ? 6 + Math.random() * 9 : 4 + Math.random() * 6;
        p.style.setProperty('--fx-x', (rise ? 34 + Math.random() * 32 : 8 + Math.random() * 84).toFixed(1) + '%');
        p.style.setProperty('--fx-s', size.toFixed(1) + 'px');
        p.style.setProperty('--fx-d', (2.4 + Math.random() * 2.2).toFixed(2) + 's');
        p.style.setProperty('--fx-l', (-Math.random() * 4).toFixed(2) + 's');
        p.style.setProperty('--fx-w', ((Math.random() - .5) * 26).toFixed(1) + 'px');
        box.appendChild(p);
      }
    });
  }

  /* ---------- بارالاكس الزجاج مع السكرول ---------- */
  function initGlassScroll() {
    const hero = $('#home');
    if (!hero || reduced) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      if (scrollY < 1400) hero.style.setProperty('--sy', String(Math.min(scrollY, 900)));
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- نص حركي متصل بسرعة ثابتة ودورة سلسة ---------- */
  function initKinetic() {
    const root = $('#kin');
    if (!root || reduced) return;
    const rows = $$('.kin-row', root).map(el => ({
      track: $('.kin-track', el),
      group: $('.kg', el),
      w: 0
    }));
    if (!rows.length) return;

    const measure = () => {
      rows.forEach(row => {
        const first = row.group;
        row.track.querySelectorAll('.kg.clone').forEach(c => c.remove());
        row.w = first.getBoundingClientRect().width;
        if (!row.w) return;
        const copies = Math.ceil(innerWidth / row.w) + 1;
        for (let i = 0; i < copies; i++) {
          const c = first.cloneNode(true);
          c.classList.add('clone');
          row.track.appendChild(c);
        }
        row.track.style.setProperty('--kin-distance', `${row.w}px`);
        row.track.style.setProperty('--kin-duration', `${Math.max(14, row.w / 48).toFixed(2)}s`);
      });
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    let resizeTimer = 0;
    addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(measure, 150); });
  }

  /* ---------- توهج يتبع المؤشر في كل الموقع ---------- */
  function initCursorGlow() {
    if (reduced || !finePtr) return;
    const el = document.createElement('div');
    el.id = 'cursorGlow';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, shown = false;
    const loop = () => {
      x += (tx - x) * .16;
      y += (ty - y) * .16;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      raf = (Math.abs(tx - x) > .4 || Math.abs(ty - y) > .4) ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; x = tx; y = ty; el.classList.add('on'); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => el.classList.remove('on'));
    document.addEventListener('pointerenter', () => { if (shown) el.classList.add('on'); });
  }

  /* ---------- سكرول: تقدّم + scrub + بارالاكس ---------- */
  function initScroll(){
    const bar=$('#pbar'),nav=$('#nav'),sc=$$('#scrub span'),scEl=$('#scrub'),pars=$$('[data-par]'),how=$('#how');
    let tick=false;
    const upd=()=>{
      tick=false;
      const max=document.documentElement.scrollHeight-innerHeight;
      bar.style.transform=`scaleX(${max>0?clamp(scrollY/max,0,1):0})`;
      nav.classList.toggle('scrolled',scrollY>40);
      const vh=innerHeight,r=scEl.getBoundingClientRect();
      const p=clamp((vh*.85-r.top)/(r.height+vh*.35),0,1);
      const n=Math.round(p*sc.length);
      sc.forEach((s,i)=>s.classList.toggle('on',i<n));
      const hr=how.getBoundingClientRect();
      how.querySelector('.steps').style.setProperty('--step-progress',String(clamp((vh*.82-hr.top)/(hr.height*.72),0,1)));
      if(!reduced)pars.forEach(el=>{const pr=el.parentElement.getBoundingClientRect();const c=pr.top+pr.height/2-vh/2;el.style.transform=`translate3d(0,${(c*Number(el.dataset.par)).toFixed(1)}px,0)`});
    };
    addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
    addEventListener('resize',upd);
    upd();
  }

  /* ---------- تنقل رئيسي بحركة كبسولة ناعمة ---------- */
  function initNavMotion(){
    const nav=$('.nav-links'),indicator=$('.nav-indicator');
    if(!nav||!indicator)return;
    const links=$$('a[href]',nav);
    const bottomLinks=$$('.bottom-nav a');
    let active=null,frame=0;
    const moveTo=link=>{
      if(!link){indicator.classList.remove('visible');return}
      const navRect=nav.getBoundingClientRect(),linkRect=link.getBoundingClientRect();
      indicator.style.setProperty('--nav-x',`${linkRect.left-navRect.left}px`);
      indicator.style.width=`${linkRect.width}px`;
      indicator.classList.add('visible');
    };
    const sync=()=>{
      frame=0;
      const hash=location.hash;
      let next=null;
      if(hash.startsWith('#/offers'))next=links.find(link=>link.getAttribute('href')==='#/offers');
      else if(hash.startsWith('#/browse'))next=links.find(link=>link.getAttribute('href')==='#/browse');
      else if(hash==='#catalog'||hash==='#about'||hash==='#contact')next=links.find(link=>link.getAttribute('href')===hash);
      else if(!hash.startsWith('#/')){
        const sections=['catalog','offers','products','about','contact'];
        const current=sections.map(id=>document.getElementById(id)).filter(section=>section&&getComputedStyle(section).display!=='none')
          .filter(section=>section.getBoundingClientRect().top<=150).pop();
        if(current){
          const target=current.id==='offers'?'#/offers':current.id==='products'?'#/browse':`#${current.id}`;
          next=links.find(link=>link.getAttribute('href')===target);
        }
      }
      active=next;
      links.forEach(link=>{
        if(link===active)link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
      const route=active?.getAttribute('href')||'#home';
      bottomLinks.forEach(link=>{
        const href=link.getAttribute('href');
        const current=href===route||(route==='#catalog'&&href==='#home'&&!location.hash);
        if(current)link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
      moveTo(active);
    };
    const scheduleSync=()=>{if(!frame)frame=requestAnimationFrame(sync)};
    links.forEach(link=>link.addEventListener('pointerenter',()=>moveTo(link)));
    nav.addEventListener('pointerleave',()=>moveTo(active));
    nav.addEventListener('focusin',event=>{const link=event.target.closest('a');if(link)moveTo(link)});
    nav.addEventListener('focusout',event=>{if(!nav.contains(event.relatedTarget))moveTo(active)});
    addEventListener('scroll',scheduleSync,{passive:true});
    addEventListener('resize',scheduleSync);
    addEventListener('hashchange',scheduleSync);
    sync();
  }

  /* ---------- تفاعل الماوس: توهج الهيرو + ميل 3D + مغناطيس ---------- */
  function initPointer(){
    if(!reduced&&!finePtr&&'DeviceOrientationEvent' in window){
      addEventListener('deviceorientation',event=>{
        if(event.gamma===null||event.beta===null)return;
        const hero=$('#home');
        hero.style.setProperty('--px',(clamp(event.gamma,-25,25)/25).toFixed(3));
        hero.style.setProperty('--py',(clamp(event.beta-35,-25,25)/25).toFixed(3));
      },{passive:true});
    }
    if(reduced||!finePtr)return;
    const hero=$('#home'),spot=$('#heroSpot');
    let tx=0,ty=0,cx=0,cy=0,raf=0;
    const loop=()=>{
      cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
      hero.style.setProperty('--px',cx.toFixed(4));hero.style.setProperty('--py',cy.toFixed(4));
      raf=(Math.abs(tx-cx)>.001||Math.abs(ty-cy)>.001)?requestAnimationFrame(loop):0;
    };
    hero.addEventListener('pointermove',e=>{
      const r=hero.getBoundingClientRect();
      tx=(e.clientX-r.left)/r.width-.5;ty=(e.clientY-r.top)/r.height-.5;
      spot.style.setProperty('--gx',(e.clientX-r.left)+'px');spot.style.setProperty('--gy',(e.clientY-r.top)+'px');
      if(!raf)raf=requestAnimationFrame(loop);
    });
    document.addEventListener('pointermove',e=>{
      const t=e.target.closest&&e.target.closest('.tilt');
      if(t){
        const r=t.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
        t.style.setProperty('--ry',((x-.5)*8).toFixed(2)+'deg');t.style.setProperty('--rx',((.5-y)*8).toFixed(2)+'deg');
        t.style.setProperty('--mx2',(x*100)+'%');t.style.setProperty('--my2',(y*100)+'%');
      }
      const m=e.target.closest&&e.target.closest('.magnetic');
      if(m){const r=m.getBoundingClientRect();m.style.setProperty('--mx',((e.clientX-r.left-r.width/2)*.18).toFixed(1)+'px');m.style.setProperty('--my',((e.clientY-r.top-r.height/2)*.28).toFixed(1)+'px')}
    });
    document.addEventListener('pointerout',e=>{
      const t=e.target.closest&&e.target.closest('.tilt');
      if(t&&!t.contains(e.relatedTarget)){t.style.setProperty('--rx','0deg');t.style.setProperty('--ry','0deg')}
      const m=e.target.closest&&e.target.closest('.magnetic');
      if(m&&!m.contains(e.relatedTarget)){m.style.setProperty('--mx','0px');m.style.setProperty('--my','0px')}
    });
  }

  /* Original, lightweight canvas interpretation of React Bits Aurora / OriginKit Reactive Lines. */
  function initHeroCanvas(){
    const canvas=$('#heroCanvas'),hero=$('#home');
    if(!canvas||!hero||reduced||!('IntersectionObserver'in window))return;
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)return;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    const particles=Array.from({length:matchMedia('(max-width:640px)').matches?9:20},(_,i)=>({
      x:((i*0.61803398875)%1),y:((i*0.38196601125)%1),phase:i*1.7,size:i%4===0?1.5:1
    }));
    const pointer={x:.5,y:.44,targetX:.5,targetY:.44};
    let width=0,height=0,dpr=1,visible=false,frame=0,lastTime=0;
    let colors=['#4F91BE','#78BCE8','#DDF2FF'];
    const rgba=(hex,alpha)=>{
      const value=hex.replace('#','');
      const normalized=value.length===3?value.split('').map(char=>char+char).join(''):value;
      const number=parseInt(normalized,16);
      return `rgba(${number>>16&255},${number>>8&255},${number&255},${alpha})`;
    };
    const readColors=()=>{
      const style=getComputedStyle(document.documentElement);
      colors=['--hero-a','--hero-b','--hero-c'].map((name,index)=>style.getPropertyValue(name).trim()||colors[index]);
    };
    const resize=()=>{
      const rect=hero.getBoundingClientRect();
      dpr=Math.min(window.devicePixelRatio||1,2);
      width=Math.max(1,rect.width);height=Math.max(1,rect.height);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const draw=time=>{
      frame=0;
      if(!visible||document.hidden||motion.matches)return;
      if(time-lastTime<15){frame=requestAnimationFrame(draw);return}
      lastTime=time;
      pointer.x+=(pointer.targetX-pointer.x)*.045;
      pointer.y+=(pointer.targetY-pointer.y)*.045;
      ctx.clearRect(0,0,width,height);
      ctx.globalCompositeOperation='screen';
      const t=time*.00012,scale=Math.min(width,height);
      const lights=[
        {x:.2,y:.32,r:.62,color:colors[0],phase:0},
        {x:.78,y:.26,r:.58,color:colors[1],phase:2.1},
        {x:.56,y:.72,r:.5,color:colors[2],phase:4.2}
      ];
      lights.forEach(light=>{
        const x=width*(light.x+Math.sin(t+light.phase)*.035)+(pointer.x-.5)*width*.055;
        const y=height*(light.y+Math.cos(t*.8+light.phase)*.035)+(pointer.y-.5)*height*.035;
        const radius=scale*light.r;
        const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);
        gradient.addColorStop(0,rgba(light.color,.17));
        gradient.addColorStop(.48,rgba(light.color,.075));
        gradient.addColorStop(1,rgba(light.color,0));
        ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
      });
      particles.forEach(particle=>{
        const x=particle.x*width+Math.sin(t*2+particle.phase)*8;
        const y=particle.y*height+Math.cos(t*1.7+particle.phase)*10;
        ctx.globalAlpha=.12+(.12*(1+Math.sin(t*4+particle.phase)));
        ctx.fillStyle=colors[2];ctx.beginPath();ctx.arc(x,y,particle.size,0,Math.PI*2);ctx.fill();
      });
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
      frame=requestAnimationFrame(draw);
    };
    const start=()=>{if(visible&&!frame&&!document.hidden&&!motion.matches)frame=requestAnimationFrame(draw)};
    const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0};
    const observer=new IntersectionObserver(entries=>{
      visible=entries.some(entry=>entry.isIntersecting);
      if(visible){resize();readColors();start()}else stop();
    },{rootMargin:'80px'});
    observer.observe(hero);
    if('ResizeObserver'in window)new ResizeObserver(()=>{resize();start()}).observe(hero);
    else addEventListener('resize',()=>{resize();start()},{passive:true});
    if(fine)hero.addEventListener('pointermove',event=>{
      const rect=hero.getBoundingClientRect();
      pointer.targetX=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
      pointer.targetY=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
    },{passive:true});
    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
    motion.addEventListener?.('change',event=>{
      if(event.matches){stop();ctx.clearRect(0,0,width,height)}
      else start();
    });
    new MutationObserver(readColors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  }

  function initClickSparks(){
    if(reduced)return;
    const layer=$('#clickFx');
    if(!layer)return;
    document.addEventListener('click',event=>{
      if(event.button!==0||event.detail===0||!event.target.closest('a,button,[role="button"]'))return;
      const count=matchMedia('(max-width:640px)').matches?4:6;
      for(let index=0;index<count;index++){
        const spark=document.createElement('i');
        const angle=(Math.PI*2*index/count)+(Math.random()-.5)*.24;
        const distance=18+Math.random()*20;
        spark.className='click-spark';
        spark.style.left=`${event.clientX}px`;spark.style.top=`${event.clientY}px`;
        spark.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);
        spark.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);
        layer.appendChild(spark);
        spark.addEventListener('animationend',()=>spark.remove(),{once:true});
      }
    },{passive:true});
  }


  /* ---------- يوقف أنيميشن الهيرو عندما يخرج من الشاشة ---------- */
  function initHeroVisibility() {
    const hero = $('#home');
    if (!hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(es => hero.classList.toggle('is-off', !es.some(e => e.isIntersecting)), { rootMargin: '60px' }).observe(hero);
  }

  function init() {
    initSceneFx();
    initGlassScroll();
    initKinetic();
    initCursorGlow();
    initScroll();
    initNavMotion();
    initPointer();
    initHeroCanvas();
    initClickSparks();
    initHeroVisibility();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
