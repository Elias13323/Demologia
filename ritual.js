/* Sacramentum Velaris · A Câmara da Consagração.
   Simulador narrativo local: oito dias de RP, nenhuma instrução física real. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const overlay = $('#ritualOverlay');
  const app = $('#app');
  const button = $('#ritualChamberButton');
  if (!overlay || !button) return;

  const stages = [
    {day:1,kind:'heart',title:'O primeiro silêncio',caption:'Primeiro coração',recipient:'coração',
      description:'A primeira oferta ritualística desperta uma pulsação fraca no receptáculo. Sua energia parte da estrutura sacrificial independente e segue diretamente ao pilar central.',
      action:'REGISTRAR A PRIMEIRA OFERTA'},
    {day:2,kind:'heart',title:'O segundo silêncio',caption:'Segundo coração',recipient:'coração',
      description:'A segunda oferta fortalece os batimentos do coração. Nenhum dos quatro pilares externos recebe energia nesta etapa.',
      action:'CANALIZAR A SEGUNDA OFERTA'},
    {day:3,kind:'heart',title:'O coração desperta',caption:'Terceiro coração',recipient:'coração',
      description:'A terceira oferta permite que o coração permaneça ativo. Ele já vive, mas ainda não possui as essências necessárias à manifestação.',
      action:'DESPERTAR O CORAÇÃO'},
    {day:4,kind:'pillar',title:'A noite que o envolve',caption:'Escuridão',recipient:'escuridão',keeper:'Ophanim',
      description:'Ophanim conduz a energia à coluna da Escuridão. Esse pilar a recebe e transfere ao coração a natureza sombria devida a Annihilator.',
      action:'ALIMENTAR O PILAR DA ESCURIDÃO'},
    {day:5,kind:'pillar',title:'O desejo do fim',caption:'Caos',recipient:'caos',keeper:'Baal',
      description:'Baal conduz a energia ao pilar do Caos. O coração recebe a obsessão pela ruptura, pela desordem e pelo fim dos ciclos.',
      action:'ALIMENTAR O PILAR DO CAOS'},
    {day:6,kind:'pillar',title:'A passagem entre os véus',caption:'Onírico',recipient:'onírico',keeper:'Grimm',
      description:'Grimm é o condutor do pilar Onírico, que une sonho e matéria para tornar possível a manifestação de uma presença antiga.',
      action:'ALIMENTAR O PILAR ONÍRICO'},
    {day:7,kind:'pillar',title:'A queda do que se dizia santo',caption:'Profano',recipient:'profano',keeper:'Olhar',
      description:'Olhar conduz a oferta ao pilar Profano. O receptáculo recebe a capacidade de corromper o espaço que antes se declarava sagrado.',
      action:'ALIMENTAR O PILAR PROFANO'},
    {day:8,kind:'final',title:'A última oferta',caption:'Oferta final',recipient:'final',
      description:'A grande oferta conclusiva passa pela estrutura sacrificial e alcança a totalidade do núcleo. Os quatro pilares convergem, fortalecendo o coração para o chamado.',
      action:'CANALIZAR A OFERTA FINAL'}
  ];
  const storageKey = 'liber-sacramentum-ritual-v1';
  let step = 0;
  let responded = false;
  let notes = Array(8).fill('');
  let alignment = null;
  let busy = false;
  let priorFocus = null;
  let animationTimeout = null;
  let motionEnabled = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* O líquido do rito é desenhado por Canvas: não usa imagens nem interfere nos controles. */
  const fluidViewport = $('#riteFluidViewport');
  const fluidNucleus = $('#riteFluidNucleus');
  const fluidMapArea = $('.rite-map-scroll', overlay);
  let fluidFrame = 0;
  let fluidMotionStart = 0;
  let fluidResizeObserver = null;
  let lastFluidFrame = 0;

  const fluidDrops = Array.from({length:34}, (_,index) => ({
    side: index % 2 === 0 ? 'left' : 'right',
    speed: 10 + (index * 17 % 28),
    position: (index * 0.241828 + .11) % 1,
    radius: 3.1 + (index * 9 % 12) / 3,
    inset: 1 + (index * 11 % 26),
    phase: index * 1.31
  }));

  const fluidTopDrops = Array.from({length:18}, (_,index) => ({
    xSeed: (index * 0.12731 + .07) % 1,
    length: 18 + (index * 7 % 26),
    radius: 2.8 + (index * 5 % 8) / 2.4,
    speed: .35 + (index * 3 % 7) / 20,
    phase: index * .74
  }));

  function sizeFluidCanvas(canvas, width, height){
    if (!canvas || width < 1 || height < 1) return null;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.3);
    const cw = Math.round(width * ratio), ch = Math.round(height * ratio);
    if(canvas.width !== cw || canvas.height !== ch){canvas.width = cw;canvas.height = ch;}
    const ctx = canvas.getContext('2d', {alpha:true});
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    return ctx;
  }

  function drawViscousPool(ctx,w,h,t,isMap){
    const baseDepth = isMap ? Math.min(h*.15, 70) : Math.min(h*.24, 148);
    const baseY = h - baseDepth;
    ctx.save();
    let fill = ctx.createLinearGradient(0,baseY-34,0,h);
    fill.addColorStop(0,'rgba(8,7,11,0)');
    fill.addColorStop(.14,'rgba(6,6,9,.40)');
    fill.addColorStop(.36,'rgba(3,3,5,.88)');
    fill.addColorStop(1,'rgba(1,1,3,1)');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0,h);
    ctx.lineTo(0,baseY);
    for(let x=0;x<=w+10;x+=10){
      const wave=(isMap?5:14)*Math.sin(x*.014+t*.41)+(isMap?2.8:7.8)*Math.sin(x*.037-t*.22)+(isMap?1.7:4.4)*Math.sin(x*.071+t*.29);
      const pooled=Math.sin((x/w)*Math.PI)*(isMap?5:12);
      ctx.lineTo(x,baseY+wave+pooled);
    }
    ctx.lineTo(w,h);ctx.closePath();ctx.fill();
    ctx.lineWidth = isMap ? 1.1 : 1.55;
    ctx.strokeStyle=isMap?'rgba(114,87,87,.20)':'rgba(122,94,92,.30)';
    ctx.beginPath();
    for(let x=0;x<=w;x+=8){
      const wave=(isMap?5:14)*Math.sin(x*.014+t*.41)+(isMap?2.8:7.8)*Math.sin(x*.037-t*.22)+(isMap?1.7:4.4)*Math.sin(x*.071+t*.29);
      const pooled=Math.sin((x/w)*Math.PI)*(isMap?5:12);
      x===0?ctx.moveTo(0,baseY+wave+pooled):ctx.lineTo(x,baseY+wave+pooled);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawViscousSide(ctx,w,h,t,side,isMap){
    const left = side==='left';
    const edge = left?0:w;
    const dir=left?1:-1;
    const maxWidth = isMap?Math.min(28,w*.065):Math.min(112,w*.115);
    const points = [];
    for(let y=0;y<=h+18;y+=8){
      const rolling = (Math.sin(y*.013+t*.31+(left?1:3))*.28 + Math.sin(y*.039-t*.17)*.17 + Math.sin(y*.081+t*.31)*.14);
      const dripContour=(Math.pow(Math.max(0,Math.sin(y*.026+t*.23+(left?0.2:1.6))),6.5)*.52);
      const thick=maxWidth*(.58+rolling+dripContour);
      points.push({y,width:Math.max(isMap?8:24,thick)});
    }
    const grad=ctx.createLinearGradient(edge,0,edge+dir*maxWidth*2.2,0);
    grad.addColorStop(0,'rgba(0,0,2,1)');
    grad.addColorStop(.34,'rgba(2,2,5,.99)');
    grad.addColorStop(.72,'rgba(7,6,10,.88)');
    grad.addColorStop(1,'rgba(9,7,10,0)');
    ctx.fillStyle=grad;
    ctx.beginPath();ctx.moveTo(edge,0);
    for(const p of points)ctx.lineTo(edge+dir*p.width,p.y);
    ctx.lineTo(edge,h);ctx.closePath();ctx.fill();
    ctx.strokeStyle=isMap?'rgba(118,92,88,.16)':'rgba(126,97,92,.26)';ctx.lineWidth=isMap?.9:1.2;
    ctx.beginPath();points.forEach((p,i)=>{
      const x=edge+dir*(p.width*.84);
      i===0?ctx.moveTo(x,p.y):ctx.lineTo(x,p.y);
    });ctx.stroke();
  }

  function drawViscousCeiling(ctx,w,h,t,isMap){
    const depth = isMap ? Math.min(h*.08, 30) : Math.min(h*.16, 88);
    ctx.save();
    const fill = ctx.createLinearGradient(0,0,0,depth*2.1);
    fill.addColorStop(0,'rgba(1,1,3,1)');
    fill.addColorStop(.34,'rgba(3,3,5,.98)');
    fill.addColorStop(.82,'rgba(8,7,11,.72)');
    fill.addColorStop(1,'rgba(8,7,11,0)');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(w,0);
    for(let x=w;x>=0;x-=8){
      const sag = (isMap?4:12)*Math.sin(x*.016+t*.24)+(isMap?1.8:5)*Math.sin(x*.049-t*.18)+(isMap?1:3.4)*Math.sin(x*.083+t*.37);
      const stal = Math.pow(Math.max(0, Math.sin(x*.031+t*.33)), 8) * (isMap ? 8 : 20);
      ctx.lineTo(x, depth + sag + stal);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle=isMap?'rgba(122,94,91,.16)':'rgba(128,98,95,.28)';
    ctx.lineWidth=isMap?.8:1.15;
    ctx.beginPath();
    for(let x=0;x<=w;x+=8){
      const sag = (isMap?4:12)*Math.sin(x*.016+t*.24)+(isMap?1.8:5)*Math.sin(x*.049-t*.18)+(isMap?1:3.4)*Math.sin(x*.083+t*.37);
      const stal = Math.pow(Math.max(0, Math.sin(x*.031+t*.33)), 8) * (isMap ? 8 : 20);
      x===0?ctx.moveTo(0, depth+sag+stal):ctx.lineTo(x, depth+sag+stal);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawDrips(ctx,w,h,t,isMap){
    ctx.save();
    for (const d of fluidDrops){
      const extra = isMap ? Math.min(18,w*.032) : Math.min(56,w*.055);
      const x=d.side==='left'?(d.inset+extra):(w-d.inset-extra);
      const cadence=(t*d.speed/h + d.position)%1;
      const y=cadence*(h+170)-96;
      if(y<1||y>h+20)continue;
      const scale=isMap?.7:1.42;
      const r=d.radius*scale;
      const trail= (isMap?10:24)+(isMap?14:36)*(.5+.5*Math.sin(t*.52+d.phase));
      ctx.fillStyle='rgba(2,2,5,.99)';
      ctx.beginPath();
      ctx.moveTo(x-r*.42,y-trail);
      ctx.bezierCurveTo(x-r*.96,y-trail*.68,x-r*.64,y-r,x-r*1.12,y-r*.42);
      ctx.bezierCurveTo(x-r*.48,y-r*.10,x+r*.82,y-r*.48,x+r*.56,y-trail*.76);
      ctx.lineTo(x+r*.20,y-trail);
      ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.ellipse(x,y,r,r*1.9,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=isMap?'rgba(132,103,97,.14)':'rgba(136,108,102,.26)';ctx.lineWidth=isMap?.45:.85;
      ctx.beginPath();ctx.moveTo(x-r*.22,y-r);ctx.quadraticCurveTo(x-r*.66,y-r*.18,x-r*.16,y+r*.46);ctx.stroke();
    }
    for (const d of fluidTopDrops){
      const x = 38 + d.xSeed * (w - 76);
      const ceilingWave = (isMap?4:12)*Math.sin(x*.016+t*.24)+(isMap?1.8:5)*Math.sin(x*.049-t*.18)+(isMap?1:3.4)*Math.sin(x*.083+t*.37);
      const stal = Math.pow(Math.max(0, Math.sin(x*.031+t*.33)), 8) * (isMap ? 8 : 20);
      const y0 = (isMap ? Math.min(h*.08, 30) : Math.min(h*.16, 88)) + ceilingWave + stal - 2;
      const sway = Math.sin(t*.7 + d.phase) * (isMap?1:2.1);
      const len = (isMap?.68:1.38) * (d.length + Math.sin(t*d.speed + d.phase)*5);
      const r = d.radius * (isMap?.72:1.14);
      ctx.fillStyle='rgba(2,2,5,.99)';
      ctx.beginPath();
      ctx.moveTo(x-r*.34, y0);
      ctx.quadraticCurveTo(x-r*.7+sway, y0+len*.36, x-r*.22, y0+len*.74);
      ctx.quadraticCurveTo(x-r*.14, y0+len+r*.26, x, y0+len+r*1.46);
      ctx.quadraticCurveTo(x+r*.14, y0+len+r*.26, x+r*.22, y0+len*.74);
      ctx.quadraticCurveTo(x+r*.7+sway, y0+len*.36, x+r*.34, y0);
      ctx.closePath();
      ctx.fill();
      if(!isMap){
        ctx.strokeStyle='rgba(130,101,96,.22)';
        ctx.lineWidth=.72;
        ctx.beginPath();
        ctx.moveTo(x-r*.08, y0+r*.4);
        ctx.quadraticCurveTo(x-r*.35, y0+len*.44, x-r*.06, y0+len+r*.56);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Reflexos úmidos reforçam a densidade do piche sem produzir um retângulo luminoso.
  function drawWetHighlights(ctx,w,h,t,isMap){
    if(isMap)return;
    ctx.save();
    ctx.lineCap='round';
    for(const side of ['left','right']){
      const left=side==='left';
      const edge=left?0:w;
      const dir=left?1:-1;
      const maxWidth=Math.min(112,w*.115);
      // Reflexo acompanha exatamente a superfície móvel do líquido.
      ctx.beginPath();
      for(let y=0;y<h;y+=9){
        const rolling=Math.sin(y*.013+t*.31+(left?1:3))*.28 + Math.sin(y*.039-t*.17)*.17 + Math.sin(y*.081+t*.31)*.14;
        const contour=Math.pow(Math.max(0,Math.sin(y*.026+t*.23+(left?.2:1.6))),6.5)*.52;
        const thick=Math.max(24,maxWidth*(.58+rolling+contour));
        const x=edge+dir*(thick*.68 + 4.5*Math.sin(y*.021+t*.26));
        y===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      const reflection=ctx.createLinearGradient(left?0:w,0,left?Math.min(w*.1,90):w-Math.min(w*.1,90),0);
      reflection.addColorStop(0,'rgba(117,103,116,.20)');
      reflection.addColorStop(.55,'rgba(177,134,145,.24)');
      reflection.addColorStop(1,'rgba(79,68,86,.08)');
      ctx.strokeStyle=reflection;
      ctx.globalAlpha=.7 + .14*Math.sin(t*.65+(left?0:2));
      ctx.lineWidth=1.6;
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    // Faixas curvas em cima do depósito, como brilhos de óleo viscoso.
    const baseY=h-Math.min(h*.24,148);
    for(let i=0;i<5;i++){
      const x=w*(.15+i*.175);
      const y=baseY+25+i%2*14+4*Math.sin(t*.35+i);
      const spread=32+i*12;
      ctx.beginPath();
      ctx.moveTo(x-spread*.5,y);
      ctx.bezierCurveTo(x-spread*.15,y-4,x+spread*.18,y+5,x+spread*.5,y+1);
      ctx.strokeStyle=i%2?'rgba(112,85,98,.16)':'rgba(176,123,138,.17)';
      ctx.lineWidth=1.1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFluidCanvas(canvas,rect,time,isMap){
    if(!canvas || !rect)return;
    const w=rect.width,h=rect.height;
    const ctx=sizeFluidCanvas(canvas,w,h);
    if(!ctx)return;
    drawViscousCeiling(ctx,w,h,time,isMap);
    drawViscousSide(ctx,w,h,time,'left',isMap);
    drawViscousSide(ctx,w,h,time,'right',isMap);
    drawViscousPool(ctx,w,h,time,isMap);
    drawDrips(ctx,w,h,time,isMap);
    drawWetHighlights(ctx,w,h,time,isMap);
  }

  function drawFluid(time=0){
    if(overlay.hidden)return;
    drawFluidCanvas(fluidViewport,overlay.getBoundingClientRect(),time,false);
  }
  function animateFluid(timestamp){
    if(overlay.hidden || !motionEnabled){fluidFrame=0;return;}
    if(timestamp-lastFluidFrame>29){
      const seconds=(timestamp-fluidMotionStart)/1000;
      drawFluid(seconds);
      lastFluidFrame=timestamp;
    }
    fluidFrame=requestAnimationFrame(animateFluid);
  }
  function restartFluid(){
    cancelAnimationFrame(fluidFrame);
    fluidFrame=0;
    if(overlay.hidden)return;
    fluidMotionStart=performance.now();
    drawFluid(0);
    if(motionEnabled)fluidFrame=requestAnimationFrame(animateFluid);
  }
  window.addEventListener('resize',()=>{if(!overlay.hidden)drawFluid(0);},{passive:true});
  if('ResizeObserver' in window){
    fluidResizeObserver=new ResizeObserver(()=>{if(!overlay.hidden&&!motionEnabled)drawFluid(0);});
    fluidResizeObserver.observe(fluidMapArea);
  }

  function save(){
    try { localStorage.setItem(storageKey,JSON.stringify({step,responded,notes})); } catch (_err) { /* sem armazenamento permanente */ }
  }
  function load(){
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey)||'null');
      if (!stored || typeof stored !== 'object') return;
      step = Math.min(8,Math.max(0,Math.floor(Number(stored.step)||0)));
      responded = step === 8 && Boolean(stored.responded);
      if(Array.isArray(stored.notes))notes=notes.map((_,i)=>typeof stored.notes[i]==='string'?stored.notes[i].slice(0,60):'');
    } catch (_err) { step=0; responded=false; }
  }
  function isGateOpen(){
    try {
      const stored = JSON.parse(sessionStorage.getItem('liber-progress-v3')||'null');
      return Boolean(stored?.unlocked) && (stored?.seals||[]).length===5;
    } catch (_err) { return false; }
  }
  function numeral(n){return ['I','II','III','IV','V','VI','VII','VIII'][n-1] || n;}
  function titleOf(s){return s?.recipient==='coração'?'CORAÇÃO CENTRAL':s?.recipient==='final'?'TODA A ESTRUTURA':`PILAR ${s.recipient.toUpperCase()}`;}
  function render(){
    const done = step >= stages.length;
    const s = stages[Math.min(step,7)];
    $('#ritualProgressBadge').textContent = `${String(step).padStart(2,'0')} / 08 · OFERTAS`;
    $('#ritualDays').innerHTML = stages.map((st,i)=>`<div class="rite-day ${i<step?'done':i===step?'current':''}"><strong>DIA ${numeral(st.day)}</strong><span>${st.caption}</span>${notes[i]?'<small>REGISTRADO</small>':''}</div>`).join('');
    $('#ritualTally').textContent = `${Math.min(step,3)} / 3 CORAÇÕES · ${Math.max(0,Math.min(4,step-3))} / 4 PILARES · ${step>=8?'OFERTA FINAL CONCLUÍDA':'OFERTA FINAL PENDENTE'}`;
    $$('.rite-node[data-target]').forEach(n=>{
      const target=n.dataset.target;
      const fed = stages.slice(3,Math.min(step,7)).some(x=>x.recipient===target);
      n.classList.toggle('rite-fed',fed);
      n.classList.toggle('rite-selected',alignment===target && !done);
      n.classList.toggle('rite-locked',!fed && step < 3);
      n.disabled = done || step<3 || step>6 || busy;
      n.setAttribute('aria-pressed',String(alignment===target && !done));
      n.title = `${target.charAt(0).toUpperCase()+target.slice(1)}${fed?' · alimentado':''}`;
    });
    $('#ritualDiagram').closest('.rite-overlay')?.classList.toggle('rite-manifesting',responded);
    $('#ritualLogLabel').hidden=done;
    $('#ritualOfferingName').value=done?'':notes[step];
    if(done){
      $('#ritualStageLabel').textContent = responded?'O PRESSÁGIO RESPONDEU':'O CHAMADO FOI CONCLUÍDO';
      $('#ritualStageTitle').textContent=responded?'A primeira forma':'O último batimento';
      $('#ritualStageCopy').textContent=responded?'O coração é protegido pelo início de um tórax. A profanação alcança o território ao redor: Annihilator aceitou o chamado, e seus Cavaleiros podem ser reconhecidos.':'Os oito dias foram registrados. O receptáculo está preparado; nenhuma escritura obriga Annihilator a atender ao chamado.';
      $('#ritualRecipient').textContent = responded?'PRESENÇA · ANNIHILATOR':'DESTINO · O PRESSÁGIO DO FIM';
      $('#ritualInstruction').textContent = responded?'Uma manifestação narrativa, não uma vitória sobre todo o mundo.':'A decisão de manifestar-se pertence somente à entidade.';
      $('#ritualStatus').textContent=responded?'O coração continua a bater. O mundo não chegou ao fim; o presságio encontrou passagem.':'Todas as energias foram entregues à estrutura. O ritual aguarda uma resposta.';
      $('#ritualAction').hidden=responded;
      $('#ritualAction').disabled=false;
      $('#ritualAction').textContent='AGUARDAR A RESPOSTA DE ANNIHILATOR';
      return;
    }
    $('#ritualAction').hidden=false;
    $('#ritualStageLabel').textContent=`DIA ${numeral(s.day)} · ${s.kind==='heart'?'DESPERTAR':s.kind==='pillar'?'ALIMENTAÇÃO':'CONCLUSÃO'}`;
    $('#ritualStageTitle').textContent=s.title;
    $('#ritualStageCopy').textContent=s.description;
    $('#ritualRecipient').textContent=`DESTINO · ${titleOf(s)}${s.keeper?' · '+s.keeper.toUpperCase():''}`;
    $('#ritualInstruction').textContent = s.kind==='pillar'?'Selecione o pilar correto no núcleo central; então conduza até ele a energia armazenada na estrutura sacrificial.':'A transferência ocorre a partir da estrutura separada. Cada ativação representa um novo dia no RP.';
    $('#ritualStatus').textContent = s.kind==='pillar'?(alignment===s.recipient?'O pilar correto foi reconhecido. O canal está alinhado.':'Toque no pilar a ser alimentado. Apenas o destinatário do dia aceita a energia.'):(s.kind==='final'?'Os quatro pilares e o coração aguardam a energia conjunta.':'A estrutura sacrificial está preparada para enviar energia diretamente ao coração.');
    const action=$('#ritualAction');
    action.disabled=busy||(s.kind==='pillar' && alignment!==s.recipient);
    action.textContent=busy?'ENERGIA EM TRÂNSITO...':s.kind==='pillar'&&alignment!==s.recipient?'SELECIONE O PILAR CORRETO':s.action;
  }
  function completeTransfer(){
    if(busy||step>=8) return;
    const s = stages[step];
    if(s.kind==='pillar' && alignment!==s.recipient) return;
    busy=true;
    render();
    const diagram=$('#ritualDiagram');
    $$('.rite-flux',diagram).forEach(p=>p.classList.toggle('route-active',p.dataset.route===s.recipient));
    diagram.classList.remove('is-channeling');
    void diagram.offsetWidth;
    diagram.classList.add('is-channeling');
    $('#ritualStatus').textContent = 'A estrutura sacrificial recolhe e canaliza energia para '+titleOf(s).toLowerCase()+'.';
    const duration = motionEnabled ? 1400 : 260;
    animationTimeout=setTimeout(()=>{
      diagram.classList.remove('is-channeling');
      $$('.rite-flux',diagram).forEach(p=>p.classList.remove('route-active'));
      step++;alignment=null;busy=false;save();render();
      $('#ritualStatus').textContent = step===8?'Oitavo dia encerrado. O chamado agora depende da vontade de Annihilator.':`Dia ${numeral(s.day)} concluído. A energia foi recebida pelo núcleo.`;
    },duration);
  }
  function open(){
    priorFocus=document.activeElement;
    overlay.hidden=false;
    app.inert=true;
    document.body.style.overflow='hidden';
    $('#ritualSealed').hidden=isGateOpen();
    $('#ritualContent').hidden=!$('#ritualSealed').hidden;
    render();
    restartFluid();
    $('#ritualClose').focus({preventScroll:true});
  }
  function close(){
    cancelAnimationFrame(fluidFrame);
    fluidFrame=0;
    overlay.hidden=true;
    app.inert=false;
    document.body.style.overflow='';
    if(priorFocus && document.contains(priorFocus))priorFocus.focus({preventScroll:true});
  }
  button.addEventListener('click',open);
  $('#ritualClose').addEventListener('click',close);
  $('#ritualToGate').addEventListener('click',()=>{close();$('#archiveShortcut')?.click();});
  $('#ritualOfferingName').addEventListener('input',event=>{
    if(step<8){notes[step]=event.target.value.slice(0,60);save();}
  });
  $('#ritualAction').addEventListener('click',()=>{
    if(step===8 && !responded){responded=true;save();render();return;}
    completeTransfer();
  });
  $$('.rite-node[data-target]').forEach(el=>el.addEventListener('click',()=>{
    if(step<3||step>6||busy)return;
    const target=el.dataset.target;
    if(target!==stages[step].recipient){
      alignment=null;
      render();
      $('#ritualStatus').textContent=`O canal rejeita o destino. Neste dia, a energia pertence ao ${titleOf(stages[step]).toLowerCase()}.`;
      return;
    }
    alignment=target;render();
  }));
  $('#ritualReset').addEventListener('click',()=>{
    if(!confirm('Reiniciar apenas os oito dias desta área ritualística? Os cinco lacres e as páginas do grimório permanecerão como estão.'))return;
    clearTimeout(animationTimeout);
    $('#ritualDiagram').classList.remove('is-channeling');
    step=0;responded=false;notes=Array(8).fill('');alignment=null;busy=false;save();render();
  });
  $('#ritualMotion').addEventListener('click',()=>{
    motionEnabled=!motionEnabled;
    restartFluid();
    overlay.classList.toggle('no-rites-motion',!motionEnabled);
    overlay.classList.toggle('motion-allowed',motionEnabled);
    $('#ritualMotion').textContent=motionEnabled?'EFEITOS ON':'EFEITOS OFF';
    $('#ritualMotion').setAttribute('aria-pressed',String(motionEnabled));
  });
  document.addEventListener('keydown',event=>{
    if(overlay.hidden)return;
    if(event.key==='Escape'){
      event.preventDefault();event.stopImmediatePropagation();close();return;
    }
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.stopImmediatePropagation();return;
    }
    if(event.key==='Tab'){
      const focusable=$$('button:not([disabled]):not([hidden])',overlay).filter(el=>el.offsetParent!==null);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  },true);
  load();
  overlay.classList.toggle('no-rites-motion',!motionEnabled);
  overlay.classList.toggle('motion-allowed',motionEnabled);
  $('#ritualMotion').textContent=motionEnabled?'EFEITOS ON':'EFEITOS OFF';
  $('#ritualMotion').setAttribute('aria-pressed',String(motionEnabled));
  render();
})();
