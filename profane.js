/* EDIÇÃO VI — entrada tipográfica sem ilustrações ou capas. Efeitos ambientais e tinta preservados. */
(() => {
  'use strict';
  function setup() {
    const $ = (s, root=document) => root.querySelector(s);
    const openingButton = $('#enterButton');
    openingButton?.addEventListener('click', () => {
      const threshold=$('#threshold');
      threshold?.classList.add('unsealing');
      document.body.classList.add('has-crossed-threshold');
    });

    // Animated ink reveal on newly rendered folios. Child observer tracks only spread replacement.
    const root=$('#spreadRoot');
    if(root) {
      const observer = new MutationObserver(() => {
        // Não revele a tinta novamente enquanto a folha física está girando.
        if(root.classList.contains('flip-in-progress'))return;
        root.classList.remove('ink-arriving');
        void root.offsetWidth;
        root.classList.add('ink-arriving');
        const special = Boolean(root.querySelector('.forbidden-page, .special-spread, .gate-left, .horse-left, .special-left'));
        document.body.classList.toggle('on-forbidden-folio',special);
      });
      observer.observe(root,{childList:true});
    }

    // Ember field in the entrance. Uses one canvas, throttled on hidden tabs and reduced motion.
    const canvas=$('#profaneCanvas');
    const ctx=canvas?.getContext('2d',{alpha:true});
    if(!ctx)return;
    const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let particles=[], w=0,h=0,dpr=1, running=true,last=0;
    function resize(){
      const rect=canvas.getBoundingClientRect();
      w=Math.max(1,rect.width);h=Math.max(1,rect.height);dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count=Math.min(110,Math.max(45,Math.floor(w*h/13000)));
      particles=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,dx:(Math.random()-.5)*.35,dy:-(Math.random()*.55+.08),r:Math.random()*1.4+.35,phase:Math.random()*7,glow:Math.random(),life:Math.random()}));
    }
    function paint(t){
      if(!running || !canvas.isConnected || canvas.closest('.threshold')?.hidden) return;
      requestAnimationFrame(paint);
      if(document.hidden || t-last<28)return;
      last=t;
      ctx.clearRect(0,0,w,h);
      for(const p of particles){
        const a=(Math.sin(t*.0013+p.phase)+1)*.17+.13;
        ctx.beginPath();ctx.fillStyle=`rgba(${p.glow>.7?'248,160,96':'156,51,55'},${a})`;
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
        if(p.glow>.93){ctx.beginPath();ctx.strokeStyle=`rgba(230,85,60,${a*.45})`;ctx.moveTo(p.x,p.y+8);ctx.lineTo(p.x-p.dx*12,p.y-2);ctx.stroke();}
        if(!reduceMotion){p.x+=p.dx;p.y+=p.dy;if(p.y<-15){p.y=h+15;p.x=Math.random()*w;}if(p.x<0)p.x=w;if(p.x>w)p.x=0;}
      }
    }
    resize();window.addEventListener('resize',resize,{passive:true});
    if(!reduceMotion)requestAnimationFrame(paint);else paint(0);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden && !reduceMotion)last=0;});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
