/* LIBER DOMINIORUM — Volume III · Código autoral, funciona sem frameworks nem build. */
(() => {
  'use strict';
  const DATA = Array.isArray(window.GRIMOIRE_ENTITIES) ? window.GRIMOIRE_ENTITIES : [];
  const $ = (q,r=document)=>r.querySelector(q), $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const small = s => esc(s).toUpperCase();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth < 790;
  const prettyCat={demonios:'DEMÔNIOS',anjos:'ANJOS',criaturas:'CRIATURAS'};
  const glyphCat={demonios:'✥',anjos:'✧',criaturas:'☾'};
  const sealByName={'Baal':'caos','Raziel':'coração','Leviatã':'escuridão','Seraphiel':'profano','Mare Somnia':'onírico'};
  const sealsOrder=['coração','escuridão','caos','profano','onírico'];
  const sealGlyph={'coração':'♥','escuridão':'✦','caos':'◈','profano':'†','onírico':'☾'};
  const clues={
    'coração':'O escriba de sete pergaminhos guarda o núcleo que ainda não vive.',
    'escuridão':'O oceano que possui dentes aprendeu a dar sombra ao impossível.',
    'caos':'Uma coroa de tempestades conhece o desejo de destruir.',
    'profano':'Sete chamas cantam no lugar em que o sagrado se desfaz.',
    'onírico':'Uma senhora de sonhos sem porta conserva a última passagem.'
  };
  const sceneInteraction={
    palace:'juramento',storm:'trovão',library:'escritura',ruins:'pedra',garden:'floração',theatre:'máscara',vault:'moeda',labyrinth:'reflexo',desert:'vento',forest:'raiz',sky:'constelação',crypt:'lápide',market:'chave',abyss:'abismo',mirror:'espelho',city:'rua',sea:'maré',fortress:'guardião',cathedral:'coro',bridge:'travessia',geometric:'geometria',tower:'relógio',moon:'lunar',court:'julgamento',mountain:'rocha',furnace:'brasas',marsh:'turfa',manor:'memória',river:'corrente',road:'caminho',winter:'neve',cave:'eco',dream:'sonho'
  };
  const sceneName={
    palace:'SALÃO DO SOBERANO',storm:'TEMPLO DA TORMENTA',library:'ARQUIVO VIVO',ruins:'CIDADE CAÍDA',garden:'JARDIM SECRETO',theatre:'PALCO DAS MÁSCARAS',vault:'COFRE DAS DÍVIDAS',labyrinth:'CORREDORES DO EU',desert:'DESERTO IMÓVEL',forest:'BOSQUE INQUIETO',sky:'OBSERVATÓRIO CELESTE',crypt:'TÚMULO DAS VOZES',market:'MERCADO DE CHAVES',abyss:'FRONTEIRA DO VAZIO',mirror:'CÂMARA DE REFLEXOS',city:'CIDADE SEM MORADORES',sea:'COSTA DO ABISMO',fortress:'BASTIÃO ETERNO',cathedral:'CATEDRAL VELADA',bridge:'PONTE DA PASSAGEM',geometric:'ARQUIVO DAS FORMAS',tower:'TORRE DO TEMPO',moon:'LAGO LUNAR',court:'TRIBUNAL DO VÉU',mountain:'ALTURAS ANTIGAS',furnace:'FORJA DAS CINZAS',marsh:'BREJO DO SEGREDO',manor:'MANSÃO DO PASSADO',river:'RIO DAS FONTES',road:'ESTRADA NOTURNA',winter:'PALÁCIO DE GELO',cave:'CAVERNAS DOS ECOS',dream:'SALA DOS SONHOS'
  };
  const names={demonios:'DOS INFERNAIS',anjos:'DOS CELESTES',criaturas:'DAS CRIATURAS'};
  const accents={demonios:'#a9766b',anjos:'#c3b6d5',criaturas:'#97bbb0'};
  const savedFavorites = new Set((()=>{try{return JSON.parse(localStorage.getItem('liber-favs-v3')||'[]');}catch{return [];}})());
  const gameState=new Map();
  const tabState=new Map();
  const horseOmenState=new Map();
  const collected=new Set();
  let gateHearts=0, altarStage=0,unlocked=false;
  let current=0, turning=false, opened=false, filter='all', search='', pending=null, flipSerial=0;
  let toastTimer, audioCtx=null, drone=null, soundOn=false, lockInput=false;

  const root=$('#spreadRoot'), sheet=$('#turnSheet'), faceFront=$('#turnFront'), faceBack=$('#turnBack');
  const sidebar=$('#sidebar'), stage=$('#bookStage');

  function readProgress(){
    try{
      const data=JSON.parse(sessionStorage.getItem('liber-progress-v3')||'null');
      if(!data)return;
      (data.seals||[]).forEach(s=>{if(sealsOrder.includes(s))collected.add(s);});
      gateHearts=Math.min(3,Math.max(0,Number(data.hearts)||0));
      altarStage=Math.min(5,Math.max(0,Number(data.altars)||0));
      unlocked=Boolean(data.unlocked)&&collected.size===5&&altarStage===5;
      if(data.game && typeof data.game==='object')Object.entries(data.game).forEach(([id,v])=>gameState.set(id,Math.max(0,Math.min(3,Number(v)||0))));
    }catch(_e){}
  }
  function saveProgress(){
    try{sessionStorage.setItem('liber-progress-v3',JSON.stringify({seals:[...collected],hearts:gateHearts,altars:altarStage,unlocked,game:Object.fromEntries(gameState)}));}catch(_e){}
  }
  function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
  function pulse(){const fl=$('#inkFlash');fl.classList.remove('active');void fl.offsetWidth;fl.classList.add('active');}
  function theme(color){document.documentElement.style.setProperty('--entity-color',color||'#b99972');}
  function hash(s){let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return n>>>0;}
  function rng(seed){let v=seed>>>0;return()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};}
  function idFor(e){return DATA.indexOf(e);}
  function tokens(e){let d=e.domain.replace(/, /g,'|').replace(/ e /g,'|').split('|').map(x=>x.trim());while(d.length<3)d.push(e.name);return d.slice(0,3);}
  const titleize = s=>s.charAt(0).toUpperCase()+s.slice(1);

  function sigilSvg(e){
    const rand=rng(hash(e.id));let lines='',stars='';
    const points=7+(hash(e.name)%7),radius=72;
    for(let i=0;i<points;i++){
      const a=(i/points)*Math.PI*2-Math.PI/2;
      const r1=31+(hash(e.id+i)%28),r2=50+(hash(e.name+i)%17);
      const a2=((i+(hash(e.title)%points)+1)%points)/points*Math.PI*2-Math.PI/2;
      lines+=`<line x1="${(100+r1*Math.cos(a)).toFixed(1)}" y1="${(100+r1*Math.sin(a)).toFixed(1)}" x2="${(100+r2*Math.cos(a2)).toFixed(1)}" y2="${(100+r2*Math.sin(a2)).toFixed(1)}" />`;
      const ang=i*6.283/points;
      stars+=`<circle cx="${(100+radius*Math.cos(ang)).toFixed(1)}" cy="${(100+radius*Math.sin(ang)).toFixed(1)}" r="${(rand()*1.8+1).toFixed(1)}"/>`;
    }
    return `<svg viewBox="0 0 200 200" role="img" aria-label="Selo único de ${esc(e.name)}" class="sigil-svg"><circle cx="100" cy="100" r="91" class="sigil-ring outer"/><circle cx="100" cy="100" r="73" class="sigil-ring mid"/><circle cx="100" cy="100" r="43" class="sigil-ring inner"/><g class="sigil-lines">${lines}</g><g class="sigil-stars">${stars}</g><text x="100" y="110" text-anchor="middle" class="sigil-glyph">${esc(e.glyph)}</text></svg>`;
  }

  function scenery(e){
    const rand=rng(hash(e.name)), scene=e.scene;
    let shapes='';
    const line=(x1,y1,x2,y2,w=1)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="currentColor" stroke-opacity=".24" stroke-width="${w}" fill="none"/>`;
    const stars=Array.from({length:36},(_,i)=>{const x=Math.round(rand()*700),y=Math.round(rand()*280);return `<circle cx="${x}" cy="${y}" r="${(rand()*1.5+.4).toFixed(1)}" fill="currentColor" opacity="${(rand()*.35+.1).toFixed(2)}"/>`;}).join('');
    const waves=()=>Array.from({length:8},(_,i)=>`<path d="M-50 ${310+i*32} Q120 ${273+i*30} 270 ${312+i*30} T750 ${307+i*29}" stroke="currentColor" stroke-opacity="${.08+i*.02}" stroke-width="2" fill="none"/>`).join('');
    const towers=()=>Array.from({length:9},(_,i)=>{const x=i*89-25,y=160+Math.floor(rand()*145),h=470-y;return `<rect x="${x}" y="${y}" width="${55+rand()*29}" height="${h}" fill="currentColor" opacity=".09"/><path d="M${x-7} ${y}l40 -${30+rand()*37}l40 ${30+rand()*37}" stroke="currentColor" opacity=".17" fill="none"/>`;}).join('');
    if(['sea','river','marsh'].includes(scene))shapes=waves()+`<path d="M0 290 Q280 240 700 315" stroke="currentColor" opacity=".28" fill="none" stroke-width="2"/>`;
    else if(['forest','garden'].includes(scene))shapes=Array.from({length:12},(_,i)=>{const x=rand()*700;return `<path d="M${x} 485v-${130+rand()*210}" stroke="currentColor" stroke-opacity=".25" stroke-width="${4+rand()*11}"/><path d="M${x-56} ${245+rand()*35}q56 -90 112 0" stroke="currentColor" opacity=".12" fill="none" stroke-width="24"/>`;}).join('');
    else if(['city','ruins','fortress','palace','cathedral','court','manor','crypt','library','theatre','tower','vault','market'].includes(scene))shapes=towers()+`<path d="M0 390H700M0 402H700" stroke="currentColor" opacity=".17"/>`;
    else if(['mountain','desert','furnace','winter'].includes(scene))shapes=`<path d="M0 385L120 212L224 343L345 130L500 365L593 207L720 375V510H0Z" fill="currentColor" opacity=".10"/><path d="M0 395L150 248L300 405L430 275L700 420" stroke="currentColor" fill="none" opacity=".23"/>`;
    else if(['sky','moon','dream','abyss','geometric','mirror','labyrinth','bridge','road','cave'].includes(scene))shapes=`<circle cx="355" cy="205" r="130" fill="none" stroke="currentColor" stroke-opacity=".14"/><circle cx="355" cy="205" r="98" fill="none" stroke="currentColor" stroke-opacity=".2"/><path d="M0 442Q350 215 700 442" fill="none" stroke="currentColor" stroke-opacity=".2"/>`;
    for(let i=0;i<4;i++){const x=Math.round(rand()*690);shapes+=line(x,460,x+Math.round(rand()*200-100),Math.round(rand()*250),.6);}
    return `<svg viewBox="0 0 700 500" class="scene-svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><g>${stars}${shapes}</g></svg>`;
  }

  const spreads=[];
  function add(kind,payload,group){spreads.push({kind,payload,group});}
  add('opening',null,'ABERTURA');add('atlas',null,'ABERTURA');
  for(const cat of ['demonios','anjos','criaturas']){
    add('section',cat,prettyCat[cat]);
    DATA.filter(e=>e.category===cat).forEach(e=>add('entity',e,prettyCat[cat]));
  }
  const gateIndex=spreads.length;
  add('gate',null,'LACRE PROIBIDO');
  const secretStart=spreads.length;
  add('annihilator',null,'APOCALIPSE');
  add('pillars',null,'APOCALIPSE');
  add('chronicle',null,'APOCALIPSE');
  for(const horse of ['Guerra','Peste','Fome','Morte'])add('horse',horse,'CAVALEIROS');
  add('manifestation',null,'APOCALIPSE');
  add('last',null,'ADVERTÊNCIA');
  const perEntity = new Map(spreads.map((s,i)=>[s.kind==='entity'?s.payload.name:null,i]).filter(([n])=>n));
  const perGroup={demonios:spreads.findIndex(s=>s.kind==='section'&&s.payload==='demonios'),anjos:spreads.findIndex(s=>s.kind==='section'&&s.payload==='anjos'),criaturas:spreads.findIndex(s=>s.kind==='section'&&s.payload==='criaturas')};
  // Os quatro decretos originais de Annihilator inspiraram as funções abaixo,
  // sem que as cartas sejam reproduzidas dentro do grimório.
  const Horsemen={
    Guerra:{
      number:'I',ordinal:'PRIMEIRO SELO',symbol:'⚔',color:'#c27370',
      subtitle:'Portador do Conflito · Ruptura das Eras',
      domain:'A decisão que transforma falsa paz em ruptura',
      essence:'Guerra é a primeira fratura consciente da ordem. Não existe para combater sem rumo, nem para se embriagar em fúria: sua autoridade repousa na precisão com que escolhe o ponto exato em que um sistema irá ceder.',
      origin:'Annihilator lhe confiou a abertura dos acontecimentos. Antes de uma batalha, Guerra reconhece a paz sustentada por mentiras, tratados esvaziados e alianças que já não possuem lealdade. A ruptura nasce de uma decisão irrevogável, não do acaso.',
      look:'A armadura de Guerra é composta por placas de ferro escurecido e fragmentos de estandartes antigos. Seu elmo não revela rosto, apenas uma fissura de luz rubra. A montaria pisa sobre um terreno dividido como mapa rasgado; cada ferradura deixa o desenho de uma fronteira nova.',
      sign:'As mesas de negociação ficam cercadas por sombras que lembram lanças. Selos diplomáticos se partem sem toque; bandeiras antes unidas passam a tremular em direções contrárias. O silêncio anterior ao conflito parece deliberado, como uma sentença que acaba de ser assinada.',
      conduct:'Ele oferece a oportunidade derradeira de escolha. Sua atuação não se espalha como uma explosão indiscriminada: aproxima lados opostos, mostra suas contradições e permite que alguém tome a decisão que transforma a tensão em guerra. A precisão é sua crueldade mais refinada.',
      contact:'Nos relatos ficcionais do culto, sua presença é consultada por meio de dois estandartes desenhados em um mesmo pergaminho. Entre eles escreve-se uma promessa impossível de conciliar. Se a tinta formar uma divisão reta, a audiência foi concedida.',
      warning:'Aqueles que confundem Guerra com glória se surpreendem ao descobrir que ele não premia vencedores. Sua função é a ruptura, e até a vitória conserva as marcas do que foi destruído para alcançá-la.',
      secret:'Sua espada mais temida não corta carne. Ela divide uma decisão em antes e depois — e nenhuma promessa consegue voltar ao estado anterior.',
      culmination:'Com o primeiro selo rompido, a marcha começa. Os outros três cavaleiros encontram o mundo já ferido.',
      omens:[
        {glyph:'⚑',name:'A FALSA PAZ',text:'Os estandartes permanecem de pé, mas a união que representam já não existe. A superfície da ordem começa a rachar.'},
        {glyph:'⌁',name:'A ESCOLHA',text:'Uma única decisão atravessa o salão. Não há explosão, apenas a certeza fria de que as alianças acabaram.'},
        {glyph:'⚔',name:'A MARCHA',text:'O primeiro selo cede. A guerra deixa de ser ameaça e se torna o começo calculado do colapso.'}
      ],
      interaction:'ROMPER A PAZ',realm:'O CAMPO DAS ALIANÇAS PARTIDAS'
    },
    Peste:{
      number:'II',ordinal:'SEGUNDO SELO',symbol:'☣',color:'#91a894',
      subtitle:'Arauto da Fragilidade · Corrupção Silenciosa',
      domain:'A falha interior que desmonta o que parecia invulnerável',
      essence:'Peste não é a espetacularidade da ruína, mas sua lentidão invisível. Ela revela que a solidez de qualquer corpo, cidade ou império sempre dependeu de equilíbrios frágeis, mesmo quando todos preferiam acreditar no contrário.',
      origin:'Depois que Guerra abre a primeira ferida, Peste torna visível a vulnerabilidade interna. A função deste cavaleiro não é castigar culpados, mas reduzir a pretensão de permanência de tudo aquilo que cresceu sem reconhecer seus limites.',
      look:'Uma figura alta envolvida por véus translúcidos e metais esverdeados que lembram prata oxidada. Sua coroa é formada por flores pálidas que envelhecem lentamente, sem perder a forma. Sua montaria parece feita de névoa entre costelas de porcelana.',
      sign:'Jardins continuam floridos, embora suas raízes já estejam escuras. Pedras de construções impecáveis exibem fissuras por dentro; a água guarda um reflexo turvo mesmo quando a superfície permanece imóvel. O estranhamento precede qualquer temor.',
      conduct:'Seu método é a discrição. Peste não convoca multidões nem precisa anunciar sua aproximação: deixa que os próprios limites internos se revelem. Quando se compreende o que está acontecendo, a confiança na integridade do mundo já se perdeu.',
      contact:'Na tradição fictícia do grimório, um círculo de flores desenhadas é colocado em torno da palavra “fragilidade”. O pedido não exige doença nem oferece cura; convida a enxergar o ponto de ruptura escondido dentro de algo aparentemente perfeito.',
      warning:'Quem a procura para punir outra pessoa não entende sua natureza. Peste não distribui justiça, não absolve e não escolhe a inocência como proteção. Sua presença demonstra o quanto a existência sempre foi vulnerável.',
      secret:'A flor no centro de sua coroa não morreu. Ela apenas permanece no instante anterior a desabrochar, presa entre promessa e decadência.',
      culmination:'Com o segundo selo quebrado, o mundo descobre que suas feridas não cicatrizam apenas porque se deseja que cicatrizem.',
      omens:[
        {glyph:'✿',name:'A APARÊNCIA INTACTA',text:'Tudo parece florescer. Nenhum alarme é ouvido. O mundo ainda se julga seguro.'},
        {glyph:'⟁',name:'A FISSURA INTERNA',text:'Uma rachadura surge por dentro da própria estrutura. A superfície ainda demora a compreender o que perdeu.'},
        {glyph:'☣',name:'A CORRUPÇÃO SILENCIOSA',text:'O segundo selo cede sem estrondo. A fragilidade que sempre existiu se torna impossível de ignorar.'}
      ],
      interaction:'REVELAR A FISSURA',realm:'O JARDIM QUE APODRECE POR DENTRO'
    },
    Fome:{
      number:'III',ordinal:'TERCEIRO SELO',symbol:'⌁',color:'#c2a879',
      subtitle:'Guardião do Vazio · Medidor da Escassez',
      domain:'A retirada que deixa a necessidade sem resposta',
      essence:'Fome não é a destruição das coisas; é a ausência delas. Seu domínio alcança alimentos e riqueza, mas também conforto, esperança, segurança e expectativa. Ele transforma a abundância em memória e preserva o desejo apenas para que nada consiga satisfazê-lo.',
      origin:'Quando Guerra já rompeu a ordem e Peste revelou suas fragilidades, Fome realiza a retirada. Não consome por voracidade pessoal: mede o que foi acumulado e retira o excesso, até que a necessidade se torne a única medida restante.',
      look:'Suas vestes parecem talhadas de linho gasto e espigas sem grãos. Os braços são longos e serenos. Em uma mão carrega uma balança com um prato vazio; na outra, uma chave que abre depósitos onde só permanece o eco. Seu cavalo caminha sem levantar poeira, como se o caminho também tivesse sido subtraído.',
      sign:'Mercados ainda exibem prateleiras, mas nada parece bastar. Banquetes se tornam lembranças antes de acabar. Palácios conservam seu luxo e perdem o conforto; palavras de esperança são pronunciadas sem que alguém consiga acreditar nelas.',
      conduct:'Fome não precisa incendiar celeiros nem derrubar cidades. Seu princípio é retirar. Ele esvazia, priva, mede a ausência e permite que o desejo sobreviva àquilo que o satisfaria. A crueldade reside em manter vivo o querer quando o mundo já não oferece resposta.',
      contact:'Os arquivos ficcionais descrevem uma tigela vazia diante de uma balança desenhada. De um lado escreve-se “necessidade”; do outro, “desejo”. O rito é contemplativo: não pede provisões, mas que o vazio revele o valor de tudo que se julgava inesgotável.',
      warning:'Confundir Fome com simples miséria diminui seu alcance. Uma pessoa pode estar cercada de riquezas e ainda assim ter tudo de essencial retirado. A ausência é seu instrumento, não a violência direta.',
      secret:'Em seu relicário não existe uma única migalha. O que guarda é o último instante em que a palavra “suficiente” ainda significava alguma coisa.',
      culmination:'Ao ceder o terceiro selo, nenhuma abundância permanece sem custo. O mundo aprende a desejar o que já não pode alcançar.',
      omens:[
        {glyph:'◉',name:'A ABUNDÂNCIA',text:'Os salões ainda brilham de riqueza. Há provisões, promessas e a convicção de que nunca faltarão.'},
        {glyph:'⚖',name:'A RETIRADA',text:'Sem ruína visível, a segurança desaparece. O peso da balança já não encontra contrapartida.'},
        {glyph:'∅',name:'O VAZIO',text:'O terceiro selo cede. O desejo continua respirando, mas tudo que o alimentaria se torna ausência.'}
      ],
      interaction:'ESVAZIAR A BALANÇA',realm:'O SALÃO DA ABUNDÂNCIA AUSENTE'
    },
    Morte:{
      number:'IV',ordinal:'QUARTO E ÚLTIMO SELO',symbol:'⌛',color:'#b6acc6',
      subtitle:'Último Passo · Silêncio Final',
      domain:'O encerramento lógico daquilo que não pode continuar',
      essence:'Morte não é fúria, castigo, julgamento nem misericórdia. É conclusão. Enquanto os outros três cavaleiros alteram o destino do mundo, Morte permanece além da pressa, guardando a função que ninguém mais pode executar.',
      origin:'A Guerra abre as feridas, a Peste as torna incuráveis e a Fome impede que cicatrizem. Quando tudo que poderia ser salvo já deixou de existir, Morte atravessa o último limiar. Annihilator não precisa explicar sua tarefa: a conclusão sempre esteve contida no começo.',
      look:'Um manto de tecido sem costuras envolve uma forma quase imóvel. O rosto é ausência sob um véu de cinzas claras. A ampulheta em sua mão não contém areia: sustenta apenas o espaço onde o tempo deveria cair. Sua montaria não tem cascos audíveis.',
      sign:'O som não desaparece de uma vez; simplesmente deixa de continuar. O último acorde permanece suspenso, os ponteiros parecem aguardar uma autorização impossível e todas as sombras apontam para a mesma porta.',
      conduct:'Não se adianta nem hesita. Não negocia destinos nem faz escolhas morais. Sua passagem ocorre quando o processo chegou ao limite extremo e nenhuma possibilidade de continuidade resta de pé. Não existe satisfação no gesto; apenas sua execução.',
      contact:'O culto descreve um símbolo de ampulheta sem areia, desenhado sobre uma folha branca e acompanhado por uma última palavra de despedida. Trata-se de reconhecimento da passagem, não de uma promessa de retorno.',
      warning:'É inútil buscar em Morte vingança ou salvação. O último cavaleiro não escolhe quem merece o fim. Ele encerra o que os acontecimentos anteriores já tornaram irreversível.',
      secret:'Há um degrau no fim da estrada que só aparece quando ninguém mais espera salvamento. Morte não o constrói; apenas o atravessa.',
      culmination:'Quando o último selo se rompe, Morte caminha. Depois de sua passagem, a própria ideia de continuidade encontra seu termo.',
      omens:[
        {glyph:'◷',name:'A ESPERA',text:'A última porta permanece fechada. Guerra, Peste e Fome já cumpriram suas funções.'},
        {glyph:'⌛',name:'O INSTANTE FINAL',text:'Nenhum veredito é pronunciado. A ampulheta deixa de medir aquilo que ainda poderia ser salvo.'},
        {glyph:'◌',name:'O SILÊNCIO',text:'O quarto selo se rompe. A marcha termina e nada depois dela exige outra palavra.'}
      ],
      interaction:'ENCERRAR O COMPASSO',realm:'A ESTRADA SEM REGRESSO'
    }
  };

  function panelLeft(content,cls='') {return `<section class="folio folio-left ${cls}"><div class="folio-inner">${content}</div></section>`;}
  function panelRight(content,cls='') {return `<section class="folio folio-right ${cls}"><div class="folio-inner">${content}</div></section>`;}
  function folioFrame(left,right){return `<div class="spread">${left}${right}</div>`;}
  function ornaments(label){return `<div class="folio-head"><span>LIBER · DOMINIORUM</span><span>${esc(label)}</span></div>`;}
  function foot(num,label='REGISTRO RESERVADO'){return `<div class="folio-foot"><span>✧ · ✣ · ✧</span><span>${esc(label)} · ${String(num+1).padStart(3,'0')}</span></div>`;}
  function badge(label){return `<span class="category-tag">${esc(label)}</span>`;}

  function renderOpening(n){
    const a=`${ornaments('PRÓLOGO / 000')}<div class="opening-inner"><div class="emblem-large">✣</div><p class="section-overline">TOMO I · AS FACES DO VÉU</p><h1 class="opening-title">O Livro<br><em>dos Domínios</em></h1><div class="rule-ornament">✧ ───────── ✢ ───────── ✧</div><p class="opening-lead">Nenhum grimório é inocente. Alguns escondem as respostas. Este prefere observar a pessoa que procura por elas.</p><p>O culto registrou nomes que atravessam os céus, infernos e margens do mundo. As páginas seguintes pertencem a essas existências, até o ponto em que a tinta parece ter medo de continuar.</p><button class="text-link" data-jump="1" type="button">ENTRAR NO ACERVO <span>→</span></button></div>${foot(n)}`;
    const b=`${ornaments('EPÍGRAFE DO TOMO PRIMEIRO')}<div class="colophon-profanum"><p class="colophon-brow">DO CÓDICE DOS NOMES VEDADOS</p><div class="colophon-verse"><span>O que é</span><em>sagrado</em><span>também conhece</span><strong>a queda.</strong></div><p class="colophon-text">Aqui a fé e a blasfêmia dividem a mesma margem. Nenhum nome será pronunciado sem deixar um eco. Nenhuma criatura será descrita sem que uma parte de seu mundo atravesse o papel.</p><div class="colophon-rule" aria-hidden="true">✦ ━━━━━ ✣ ━━━━━ ✦</div><p class="colophon-archivum">LXIV PRESENÇAS CATALOGADAS<br><b>CINCO LACRES · UM CONHECIMENTO INTERDITO</b></p><p class="colophon-ending">O livro já está aberto. A escolha de continuar pertence ao leitor.</p></div>${foot(n,'TOMO PRIMEIRO')}`;
    return folioFrame(panelLeft(a,'folio-night'),panelRight(b,'folio-night'));
  }
  function renderAtlas(n){
    const a=`${ornaments('I / CLASSIFICAÇÃO')}<p class="section-overline">REGISTRO DE ABERTURA</p><h2 class="big-serif">A Anatomia<br><em>do Invisível</em></h2><p class="dropcap">Este livro reúne sessenta e quatro registros individuais de demônios, anjos e criaturas, cada qual guardando o domínio que o moldou, o território em que se manifesta, seus sinais e as formas de contato descritas nas tradições ficcionais do culto.</p><p>Ao virar as folhas, cada nome abre um lugar próprio. Observe as insígnias, explore os aposentos e realize os gestos simbólicos que despertam as respostas ocultas de cada registro.</p><div class="atlas-stats"><div><b>19</b><span>INFERNAIS</span></div><div><b>19</b><span>CELESTES</span></div><div><b>26</b><span>CRIATURAS</span></div></div>${foot(n)}`;
    const b=`${ornaments('II / AS DIVISÕES')}<h3 class="minor-title">Escolha uma estante</h3><div class="atlas-categories"><button class="atlas-category infernal" data-jump="${perGroup.demonios}" type="button"><span>✥</span><div><strong>DEMÔNIOS</strong><small>Desejo, contrato, ruína e soberania</small></div><i>→</i></button><button class="atlas-category celestial" data-jump="${perGroup.anjos}" type="button"><span>✧</span><div><strong>ANJOS</strong><small>Vigília, mensagem, ordem e revelação</small></div><i>→</i></button><button class="atlas-category bestial" data-jump="${perGroup.criaturas}" type="button"><span>☾</span><div><strong>CRIATURAS</strong><small>Fronteiras, metamorfoses e mistérios</small></div><i>→</i></button></div><div class="archival-note"><b>NOTA À MARGEM</b><p>Uma quarta seção foi removida do índice público. Seus fragmentos encontram-se espalhados por cinco nomes. Encontre os símbolos e leve-os à Câmara Interdita.</p><button class="text-link" data-jump="${gateIndex}" type="button">VER O LACRE <span>↗</span></button></div>${foot(n,'MAPA DO ACERVO')}`;
    return folioFrame(panelLeft(a,'folio-paper'),panelRight(b,'folio-paper'));
  }
  function renderSection(cat,n){
    const count=DATA.filter(e=>e.category===cat).length;
    const pageData={
      demonios:{title:'Os Infernais',roman:'I',glyph:'✥',question:'Toda vontade possui uma sombra.',story:'A primeira ala não é feita apenas de violência, mas de escolhas levadas ao extremo. Aqui residem reis que perderam tronos, arquivistas que conhecem segredos demais, negociantes de promessas e vigias dos lugares onde a ambição aprende a falar.',label:'Ala das Coroas Quebradas'},
      anjos:{title:'Os Celestes',roman:'II',glyph:'✧',question:'Nem toda luz foi feita para consolar.',story:'Na segunda ala, as vozes não prometem descanso. Mensageiros, guardiões, escribas e testemunhas do tempo exibem uma forma de sagrado capaz de ser luminosa e assustadora na mesma medida.',label:'Ala dos Vitrais Feridos'},
      criaturas:{title:'As Criaturas',roman:'III',glyph:'☾',question:'O mundo tinha habitantes antes dos nomes.',story:'A terceira ala permanece próxima dos oceanos, cavernas, estradas, montanhas e sonhos. Cada criatura preserva um território particular e lembra ao leitor que nem tudo foi criado para servir a alguma teologia.',label:'Ala do Mundo Anterior'}
    }[cat];
    const first=DATA.find(e=>e.category===cat);
    const a=`${ornaments('LIVRO '+pageData.roman)}<div class="division-cover"><span class="division-symbol">${pageData.glyph}</span><p class="section-overline">${pageData.label}</p><h2>${pageData.title}</h2><blockquote>${pageData.question}</blockquote><p>${pageData.story}</p><button class="text-link" data-jump="${perEntity.get(first.name)}" type="button">ABRIR O PRIMEIRO REGISTRO <span>→</span></button></div>${foot(n,'ABERTURA DA DIVISÃO')}`;
    const list=DATA.filter(e=>e.category===cat).slice(0,12);
    const b=`${ornaments('ÍNDICE DA DIVISÃO')}<p class="section-overline">${count} REGISTROS VIVOS</p><h3 class="minor-title">Pessoas, lugares e presságios</h3><p>Os registros são organizados por presença. Cada nome guarda uma crônica, uma aparição, um método de comunicação e um relicário que responde a uma ação ritual simbólica.</p><div class="division-index">${list.map(e=>`<button data-jump="${perEntity.get(e.name)}" type="button"><span>${esc(e.glyph)}</span><b>${esc(e.name)}</b><small>${esc(e.domain)}</small><i>↗</i></button>`).join('')}</div>${foot(n,'CATÁLOGO PARCIAL')}`;
    return folioFrame(panelLeft(a,'folio-night division-'+cat),panelRight(b,'folio-paper'));
  }

  function tabs(e){const active=tabState.get(e.id)||'cronica';
    return `<div class="entity-tabs" role="tablist" aria-label="Seções do registro de ${esc(e.name)}">${[['cronica','CRÔNICA'],['aparicao','APARIÇÃO'],['contato','CONTATO'],['segredos','SEGREDOS'],['relicario','RELICÁRIO']].map(([k,title])=>`<button type="button" role="tab" aria-selected="${active===k}" data-action="tab" data-tab="${k}" data-id="${esc(e.id)}" class="${active===k?'active':''}">${title}</button>`).join('')}</div>`;
  }
  function encounterPane(e){
    const active=tabState.get(e.id)||'cronica';
    if(active==='cronica')return `<div class="tab-story"><p class="tab-overline">I · A HISTÓRIA POR TRÁS DO NOME</p><h3>Crônica da Existência</h3><p class="dropcap">${esc(e.origin)}</p><p>${esc(e.nature)}</p><div class="small-inscription">O LIVRO ADVERTE · NENHUMA ENTIDADE SE REDUZ A UM TÍTULO</div></div>`;
    if(active==='aparicao')return `<div class="tab-story"><p class="tab-overline">II · O TERRITÓRIO E A CARNE</p><h3>Manifestações</h3><div class="detail-kicker">DESCRIÇÃO VISUAL</div><p>${esc(e.looks)}</p><div class="detail-kicker">SINAIS DA PROXIMIDADE</div><p>${esc(e.signs)}</p><div class="detail-kicker">AMBIENTE VINCULADO</div><p>O território artístico desta página recebe o nome de <strong>${esc(e.realm)}</strong> e simboliza os temas associados a ${esc(e.name)}: ${esc(e.domain)}. Esse cenário é uma ambientação do grimório, não um local histórico comprovado.</p></div>`;
    if(active==='contato')return `<div class="tab-story"><p class="tab-overline">III · AUDIÊNCIA E CHAMADO</p><h3>Como Estabelecer Contato</h3><div class="ritual-mini"><div class="ritual-marker">01</div><div><b>COMUNICAÇÃO</b><p>${esc(e.contact)}</p></div></div><div class="ritual-mini"><div class="ritual-marker">02</div><div><b>INVOCAÇÃO SIMBÓLICA</b><p>${esc(e.rite)}</p></div></div><p class="fine-print">Os textos religiosos e folclóricos registram crenças e práticas de suas épocas; não há comprovação de comunicação ou invocação sobrenatural.</p></div>`;
    if(active==='segredos')return `<div class="tab-story"><p class="tab-overline">IV · O PREÇO DE SER OUVIDO</p><h3>Advertências e Segredos</h3><div class="secret-panel"><span>⛧</span><p>${esc(e.cost)}</p></div><div class="detail-kicker">ANOTAÇÃO RASURADA</div><p>${esc(e.secret)}</p><div class="secret-seal">NÃO É PERMISSÃO PARA OBEDECER · É APENAS UM REGISTRO</div></div>`;
    return renderRelic(e);
  }
  function renderRelic(e){
    const bits=tokens(e), step=gameState.get(e.id)||0;
    const order=[0,1,2].sort((a,b)=>(hash(e.id+a)%97)-(hash(e.id+b)%97));
    const seal=sealByName[e.name];
    const mode=sceneInteraction[e.scene]||'sinal';
    const choices=order.map(i=>`<button type="button" data-action="relic" data-id="${esc(e.id)}" data-choice="${i}" class="relic-choice ${i<step?'done':''}" ${step===3?'disabled':''}><span>${esc(['✧','✦','◈'][i])}</span>${esc(titleize(bits[i]))}</button>`).join('');
    let outcome='';
    if(step===3){
      outcome=`<div class="oracle-result"><small>RESPOSTA DO GRIMÓRIO</small><p>“${esc(e.oracle)}”</p></div>`;
      if(seal){
        const reward=collected.has(seal)
          ? `<span class="already-collected">${esc(sealGlyph[seal])} SELO RECOLHIDO</span>`
          : `<button class="button-gold reward-btn" type="button" data-action="collect" data-seal="${esc(seal)}">RECOLHER O SELO ${small(seal)} <span>${esc(sealGlyph[seal])}</span></button>`;
        outcome+=`<div class="sealed-reward"><b>FRAGMENTO DE ANNIHILATOR DETECTADO</b><p>O ${esc(seal)} responde à presença de ${esc(e.name)}.</p>${reward}</div>`;
      }
    } else {
      outcome='<p class="fine-print">Cada registro possui seu próprio ambiente, uma inscrição exclusiva e uma resposta revelada apenas após o gesto.</p>';
    }
    const count=step<3?`MARCA ${step} / 3 · O RECINTO AINDA NÃO RESPONDEU`:'✦ A AUDIÊNCIA FOI CONCLUÍDA ✦';
    return `<div class="tab-story relic-tab"><p class="tab-overline">V · RECINTO INTERATIVO</p><h3>O ${titleize(mode)} de ${esc(e.name)}</h3><p class="relic-instruction">Este recinto responde a uma sequência. Toque os três aspectos na ordem original do domínio: <strong>${esc(bits.join(' · '))}</strong>.</p><div class="relic-scene ${esc(e.scene)}" data-relic-id="${esc(e.id)}"><div class="relic-display"><span class="relic-main-symbol">${esc(e.glyph)}</span><span class="relic-orbit"></span></div><div class="relic-options">${choices}</div></div><p class="relic-counter">${count}</p>${outcome}</div>`;
  }
  function renderEntity(e,n){
    const fav=savedFavorites.has(e.id),cls=e.category;
    const a=`${ornaments('FÓLIO '+String(n).padStart(3,'0'))}<div class="entity-hero ${esc(e.scene)}" style="--entity-color:${esc(e.color)}"><div class="scene-visual">${scenery(e)}<div class="scene-sun"></div></div><div class="scene-caption">${small(sceneName[e.scene]||'TERRITÓRIO ANTIGO')}</div><div class="sigil-anchor">${sigilSvg(e)}</div><div class="entity-hero-content"><span class="entity-group">${esc(glyphCat[cls])} &nbsp; ${prettyCat[cls]} · REGISTRO ${String(idFor(e)+1).padStart(2,'0')}</span><h2>${esc(e.name)}</h2><p class="entity-epithet">${esc(e.title)}</p><div class="domain-rule"></div><span class="realm-label">DOMÍNIO</span><p class="domain-text">${esc(e.domain)}</p><span class="realm-label">TERRITÓRIO</span><p class="realm-text">${esc(e.realm)}</p></div></div>${foot(n,'INSÍGNIA INDIVIDUAL')}`;
    const b=`${ornaments('DOSSIÊ / '+prettyCat[cls])}<div class="right-entity-heading"><div><p class="tab-overline">ENTIDADE CATALOGADA · ${String(idFor(e)+1).padStart(2,'0')} / 64</p><h3>${esc(e.title)}</h3></div><button class="favorite ${fav?'on':''}" data-action="favorite" data-id="${esc(e.id)}" aria-label="${fav?'Remover dos salvos':'Salvar entidade'}" title="${fav?'Remover dos favoritos':'Salvar no relicário'}" type="button">${fav?'✦':'☆'}</button></div>${tabs(e)}<div class="entity-tab-content">${encounterPane(e)}</div><div class="entity-bottom-note"><span>✥ CLASSIS · ${prettyCat[cls]}</span><span>O LIVRO RECORDA</span></div>${foot(n,'CUSTODIA ARCANA')}`;
    return folioFrame(panelLeft(a,`folio-night themed ${cls}`),panelRight(b,`folio-paper entity-reading ${cls}`));
  }

  function renderGate(n){
    const all=collected.size===5;
    const left=`${ornaments('SEM NÚMERO')}<div class="gate-left"><div class="gate-red-seal">✣<div class="broken-ring"></div></div><p class="tab-overline">ARCHIVUM · NON LEGENDUM</p><h2>O Nome<br><em>Interdito</em></h2><p>Há uma presença que o culto se recusou a arquivar como todas as outras. A tinta sobre seu registro foi costurada, o papel queimado nas bordas e cinco fragmentos espalhados entre domínios que jamais deveriam tocar uns aos outros.</p><p><strong>Annihilator</strong> é o presságio do Apocalipse. A leitura de seu nome completo é negada àqueles que não reunirem os sinais do coração, da escuridão, do caos, da profanação e do sonho.</p><div class="threshold-counter">${collected.size} <small>/ 5 SELOS RECUPERADOS</small></div></div>${foot(n,'CLASSIFICAÇÃO REMOVIDA')}`;
    const hints=sealsOrder.map(s=>`<div class="clue-row ${collected.has(s)?'found':''}"><span class="clue-emblem">${sealGlyph[s]}</span><div><strong>${small(s)}</strong><p>${esc(clues[s])}</p></div><span class="clue-state">${collected.has(s)?'RECOLHIDO':'OCULTO'}</span></div>`).join('');
    const right=`${ornaments('RITO DE ACESSO')}<div class="gate-instructions"><p class="section-overline">A CÂMARA DOS CINCO PILARES</p><h3>O Coração ainda está morto.</h3><p>Procure as cinco presenças descritas nos enigmas. Em cada território, abra o <strong>Relicário</strong>, conclua a audiência e recolha a marca. Só depois o coração aceitará os três silêncios que o acordam.</p><div class="clue-list">${hints}</div>${!all?`<div class="gate-unready">✥ OS CINCO FRAGMENTOS AINDA NÃO FORMAM UM CORAÇÃO</div>`:renderGateRite()}</div>${foot(n,'QUEM ABRE RESPONDE')}`;
    return folioFrame(panelLeft(left,'folio-night forbidden'),panelRight(right,'folio-paper gate-right'));
  }
  function renderGateRite(){
    if(unlocked)return `<div class="gate-success"><span>✣</span><h3>O véu se rompeu.</h3><p>O coração respondeu aos cinco pilares. As folhas de Annihilator foram liberadas.</p><button class="button-gold" type="button" data-jump="${secretStart}">ENTRAR NO DOMÍNIO PROIBIDO <span>→</span></button></div>`;
    if(gateHearts<3)return `<div class="rite-action"><h4>Primeiro: os três silêncios</h4><p>Na escritura ficcional, três corações devem cessar para que o receptáculo viva. Toque os símbolos para representar a passagem.</p><div class="heart-row">${Array.from({length:3},(_,i)=>`<button class="heart-button ${i<gateHearts?'silent':''}" type="button" data-action="heart" aria-label="${i<gateHearts?'Coração silenciado':'Silenciar o coração simbólico '+(i+1)}" ${i<gateHearts?'disabled':''}><span class="heart-beat">♥</span></button>`).join('')}</div><span class="rite-caption">${gateHearts} / 3 SILÊNCIOS</span></div>`;
    if(altarStage<5){const s=sealsOrder[altarStage],labels=['PILAR PRINCIPAL','PILAR DA ESCURIDÃO','PILAR DO CAOS','PILAR PROFANO','PILAR ONÍRICO'];return `<div class="rite-action"><h4>Segundo: cinco dias de consagração</h4><p>Um sacrifício por dia, no altar correspondente, une simbolicamente cada pilar ao coração nesta narrativa. Os cinco dias são representados aqui por páginas do rito.</p><div class="days-ribbon">${sealsOrder.map((x,i)=>`<span class="${i<altarStage?'done':i===altarStage?'current':''}" title="Dia ${i+1} — ${esc(x)}">${i+1}</span>`).join('')}</div><p class="next-altar">DIA ${altarStage+1} / 5 · <strong>${labels[altarStage]}</strong></p><button class="button-gold" data-action="altar" type="button">CONSAGRAR ${small(s)} <span>${sealGlyph[s]}</span></button></div>`;}
    return `<div class="rite-action final-consent"><div class="ready-heart">♥</div><h4>O coração tornou a bater.</h4><p>Os altares foram erguidos e o rito está completo. A escolha de se manifestar continua pertencendo apenas a Annihilator.</p><p class="rite-vow">“Crie meu coração, alimenta-me com vidas, dê-me toda sua devoção.”</p><button class="button-gold" type="button" data-action="unlock">ENTREGAR A DEVOÇÃO E ABRIR O LIVRO <span>✣</span></button></div>`;
  }
  function special(left,right,n,tag='LIBER RESERVADO'){return folioFrame(panelLeft(ornaments(tag)+left+foot(n,tag),'folio-night forbidden'),panelRight(ornaments('CÓDICE VELADO')+right+foot(n,'ANOTAÇÃO RESTRITA'),'folio-night forbidden'))}
  function renderAnnihilator(n){
    return special(`<div class="special-left"><p class="section-overline warning">REGISTRO EXCOMUNGADO · O PRESSÁGIO</p><h2 class="special-title">ANNIHILATOR</h2><div class="annihilator-art"><div class="anh-ring ring-a"></div><div class="anh-ring ring-b"></div><div class="anh-void"><span>✣</span></div></div><p class="special-epithet">DEUS DA ESCURIDÃO · DEUS DO CAOS</p><blockquote>“Os quatro jamais foram o apocalipse. Foram apenas aqueles que vieram anunciar seu nome.”</blockquote></div>`,`<div class="special-right"><p class="section-overline">AQUELE QUE VEM DEPOIS DOS SINAIS</p><h3>O presságio não marcha à frente.</h3><p>Entre todos os domínios, somente Annihilator recebe uma classificação separada. Ele não é apresentado como criador de toda realidade nem como força sem limites. Seu poder pertence ao anúncio do fim e à transformação profana daquilo que o cerca.</p><p>Alguns o chamam de <strong>Deus da Escuridão</strong>; outros, de <strong>Deus do Caos</strong>. Nenhum desses nomes explica a totalidade de sua existência. Para o culto, a escuridão é sua matéria, o caos é seu impulso, a profanação é sua grandeza e o sonho permite que sua forma atravesse o impossível.</p><p>Ele não costuma combater diretamente. Guerra, Peste, Fome e Morte são seus emissários, e aqueles escolhidos para acompanhá-lo tornam-se profanos como o próprio senhor.</p><button class="text-link" data-jump="${n+1}" type="button">EXAMINAR OS CINCO PILARES <span>→</span></button></div>`,n,'ANNIHILATOR / VOLUME V');
  }
  const pillars=[
    ['♥','PILAR PRINCIPAL','O CORAÇÃO QUE BATE FORA DE UM CORPO','No centro do templo ergue-se um coração sem peito, vivo apenas enquanto a própria realidade lhe empresta espaço. Todo o ritual existe para construir sua futura morada.'],
    ['✦','PILAR DA ESCURIDÃO','A MATÉRIA QUE LHE É DEVIDA','O segundo altar envolve o coração em uma noite que não pertence à ausência de luz, mas a uma escuridão viva, mais antiga do que qualquer chama que tente afastá-la.'],
    ['◈','PILAR DO CAOS','A OBSESSÃO PELO FIM','O terceiro altar grava no coração a obsessão pelo fim, pelo caos e pela destruição. Não lhe oferece raiva passageira, mas uma direção inexorável.'],
    ['†','PILAR PROFANO','A GRANDIOSIDADE DA PROFANAÇÃO','O quarto altar desfaz a pretensão de pureza do lugar escolhido. Aquilo que se dizia santo torna-se o primeiro material da carne de seu senhor.'],
    ['☾','PILAR ONÍRICO','A POSSIBILIDADE DE EXISTIR','O quinto altar conecta sonho e matéria, concedendo ao coração a capacidade de manifestação. Sem essa passagem, seu poder permaneceria pressentido, nunca encarnado.']
  ];
  function renderPillars(n){
    return special(`<div class="special-left"><p class="section-overline warning">ANATOMIA DE UMA INVOCAÇÃO</p><h2>Os Cinco<br><em>Pilares</em></h2><p>Não são apenas altares separados. Cada pilar concede ao receptáculo uma propriedade que o torna cada vez menos parecido com um órgão e cada vez mais próximo de uma entidade.</p><div class="pillar-mandala"><span class="p-center">♥</span>${['✦','◈','†','☾'].map((x,i)=>`<span class="p-node p-${i}">${x}</span>`).join('')}</div><blockquote>“Crie meu coração, alimenta-me com vidas, dê-me toda sua devoção.”</blockquote></div>`,`<div class="special-right"><p class="section-overline">A ESTRUTURA DO CORPO QUE AINDA NÃO EXISTE</p><h3>Cinco partes. Uma só vontade.</h3><div class="pillar-records">${pillars.map((p,i)=>`<details class="pillar-details" ${i===0?'open':''}><summary><span>${p[0]}</span><b>${p[1]}</b><i>+</i></summary><p class="pillar-subtitle">${p[2]}</p><p>${p[3]}</p></details>`).join('')}</div></div>`,n,'SEQUÊNCIA DOS ALTARES');
  }
  function renderChronicle(n){
    return special(`<div class="special-left"><p class="section-overline warning">O RITO DO CORAÇÃO VIVO</p><h2>O Tempo<br><em>dos Sacrifícios</em></h2><p>Depois de erguidos os cinco pilares, três corações devem deixar de bater para que o receptáculo desperte. Em seguida, o culto registra cinco sacrifícios, cada um realizado em um dia diferente, no altar a que pertence.</p><div class="heart-relic"><span>♥</span><div class="blood-orbit"></div></div><p class="small-caps-center">CINCO DIAS · CINCO ALTARES · UM CORAÇÃO</p></div>`,`<div class="special-right"><h3>Os Cinco Dias</h3><div class="five-days">${pillars.map((p,i)=>`<div><span>DIA ${String(i+1).padStart(2,'0')}</span><b>${p[1]}</b><p>${['O receptáculo recebe o primeiro fôlego.','A noite o envolve como pele.','Sua pulsação aprende o desejo de destruição.','O local sagrado perde o nome que dizia merecer.','O sonho abre a passagem para a manifestação.'][i]}</p></div>`).join('')}</div><p class="fine-print dark-note">Este é um rito exclusivamente ficcional, apresentado como lore do culto. A interface não instrui a realizar qualquer sacrifício no mundo real.</p></div>`,n,'LIVRO DOS CINCO DIAS');
  }
  function renderHorse(h,n){
    const a=Horsemen[h],step=horseOmenState.get(h)||0,done=step>=3;
    const omen=step? a.omens[step-1] : {glyph:a.symbol,name:'O SELO AINDA DORME',text:'Acompanhe os três presságios para observar como este cavaleiro cumpre sua função sob o comando de Annihilator.'};
    const indicators=a.omens.map((it,i)=>`<span class="horse-omen-dot ${i<step?'illuminated':''}" title="${esc(it.name)}">${i+1<10?'0'+(i+1):i+1}</span>`).join('');
    const next=Horsemen[spreads[n+1]?.payload] ? `<button class="text-link horse-next" type="button" data-jump="${n+1}">PROSSEGUIR AO PRÓXIMO CAVALEIRO <span>→</span></button>` : `<button class="text-link horse-next" type="button" data-jump="${n+1}">VER A MANIFESTAÇÃO DO PRESSÁGIO <span>→</span></button>`;
    const left=`<div class="special-left horse-left horse-reimagined" style="--horse-color:${a.color}">
      <p class="section-overline warning">${a.ordinal} · DE QUATRO</p>
      <div class="horse-crest" aria-hidden="true"><div class="horse-crest-ring first"></div><div class="horse-crest-ring second"></div><span class="horse-crest-glyph">${a.symbol}</span><span class="horse-crest-roman">${a.number}</span></div>
      <h2>${esc(h)}</h2><p class="special-epithet">${esc(a.subtitle)}</p>
      <div class="horse-pronouncement"><span>DOMÍNIO DO CAVALEIRO</span><p>${esc(a.domain)}</p></div>
      <div class="horse-omen-chamber" aria-live="polite"><div class="horse-omen-heading"><span>FRAGMENTOS DO ${a.ordinal}</span><div class="horse-omen-dots">${indicators}</div></div>
        <div class="horse-omen-revelation ${done?'completed':''}"><div class="horse-omen-glyph">${omen.glyph}</div><div><strong>${omen.name}</strong><p>${omen.text}</p></div></div>
        ${done?`<div class="horse-omen-conclusion">${a.culmination}</div><button class="horse-omen-button completed" data-action="horse-reset" data-id="${h}" type="button">RECONSTITUIR O PRESSÁGIO <span>↺</span></button>`:`<button class="horse-omen-button" data-action="horseomen" data-id="${h}" type="button">${a.interaction} <span>⟶</span></button>`}
      </div>
    </div>`;
    const right=`<div class="special-right horse-document" style="--horse-color:${a.color}">
      <p class="section-overline">CÓDICE DOS EMISSÁRIOS · ${a.ordinal}</p><h3>${a.subtitle}</h3>
      <p class="horse-essence">${a.essence}</p>
      <div class="horse-file-cards">
        <details class="horse-file" open><summary><span>01</span> ESSÊNCIA E DECRETO <i>+</i></summary><p>${a.origin}</p></details>
        <details class="horse-file"><summary><span>02</span> APARIÇÃO E MONTARIA <i>+</i></summary><p>${a.look}</p></details>
        <details class="horse-file"><summary><span>03</span> COMO SUA VONTADE AGE <i>+</i></summary><p>${a.conduct}</p></details>
        <details class="horse-file"><summary><span>04</span> SINAIS DE SUA CHEGADA <i>+</i></summary><p>${a.sign}</p></details>
        <details class="horse-file"><summary><span>05</span> CONTATO FICCIONAL <i>+</i></summary><p>${a.contact}</p></details>
        <details class="horse-file"><summary><span>06</span> ADVERTÊNCIA E SEGREDO <i>+</i></summary><p>${a.warning}</p><p>${a.secret}</p></details>
      </div>
      <div class="horse-colophon"><span>${a.number} / IV</span><b>${a.realm}</b></div>${next}
    </div>`;
    return special(left,right,n,`CAVALEIRO ${a.number} / ${small(h)}`);
  }
  function renderManifestation(n){
    return special(`<div class="special-left"><p class="section-overline warning">O CORPO DO APOCALIPSE</p><h2>O Primeiro<br><em>Batimento</em></h2><div class="torso-image"><div class="rib rib-left"></div><div class="rib rib-right"></div><div class="torso-heart">♥</div></div><p>Se Annihilator decidir responder ao rito, um enorme tórax se erguerá para proteger o coração. Tudo ao redor se tornará profano e passará a compor o início de sua matéria.</p></div>`,`<div class="special-right"><h3>Quando o lugar que se diz santo apodrece</h3><p>O rito maior exige um local que se apresente como santo. Não basta a arquitetura de um templo para garantir santidade: o culto interpreta as falhas da fé e do poder como a prova de que o profano sempre encontrou caminhos escondidos.</p><p>O livro recorda a imagem de Lúcifer, que já foi anjo e hoje é chamado rei do inferno. Até a igreja que se proclama imaculada pode não ser santa; seu título não impede que ela se transforme em origem de uma profanação.</p><p>À medida que o coração recebe força, a construção ao seu redor deixa de ser apenas edifício: pedras, vitrais e colunas tornam-se o início de costelas, paredes e tendões de uma presença que ainda precisa escolher existir.</p><div class="special-quote">“O corpo ainda é um templo. O templo ainda é uma mentira.”</div></div>`,n,'O NASCIMENTO DO TÓRAX');
  }
  function renderLast(n){return special(`<div class="special-left"><p class="section-overline warning">O ÚLTIMO CAPÍTULO</p><h2>O Livro<br><em>Não Termina</em></h2><div class="emblem-large">✣</div><p>As páginas acabam, mas os domínios continuam. O nome de Annihilator permanece onde o culto o colocou: não como resposta para todas as coisas, e sim como advertência sobre o que é possível quando a realidade se volta contra si mesma.</p><button class="text-link" data-jump="1" type="button">VOLTAR AO ÍNDICE <span>↶</span></button></div>`,`<div class="special-right"><p class="section-overline">ANOTAÇÃO FINAL, AUTORIA SUPRIMIDA</p><blockquote class="last-prophecy">“Quando Guerra romper a falsa paz, quando Peste revelar as feridas que não se fecham, quando Fome retirar tudo que ainda sustentava a esperança e quando Morte concluir o que já não pode continuar, compreenderão que os quatro jamais foram o verdadeiro Apocalipse. Foram apenas os que anunciaram seu nome.”</blockquote><div class="final-insignia">✦ &nbsp; LIBER DOMINIORUM &nbsp; ✦</div><p>Este volume contém os nomes que foram autorizados a sobreviver à catalogação. Outros aguardam suas próprias folhas.</p></div>`,n,'EXPLICIT · LIBER PRIMUS');}
  function render(s,n){switch(s.kind){case'opening':return renderOpening(n);case'atlas':return renderAtlas(n);case'section':return renderSection(s.payload,n);case'entity':return renderEntity(s.payload,n);case'gate':return renderGate(n);case'annihilator':return renderAnnihilator(n);case'pillars':return renderPillars(n);case'chronicle':return renderChronicle(n);case'horse':return renderHorse(s.payload,n);case'manifestation':return renderManifestation(n);case'last':return renderLast(n);default:return '<div class="spread"></div>';}}

  function updateControls(){
    const s=spreads[current];
    $('#currentNumber').textContent=String(current).padStart(3,'0');$('#maxNumber').textContent=String(spreads.length-1).padStart(3,'0');
    $('#sectionMeta').textContent=`FÓLIO ${String(current).padStart(3,'0')} · ${s.kind==='entity'?s.payload.name.toUpperCase():s.group}`;
    $('#realmMeta').textContent=s.kind==='entity'?s.payload.realm.toUpperCase():s.kind==='gate'?'CONHECIMENTO VEDADO':s.group;
    $('#prevPage').disabled=current===0 || turning;
    $('#nextPage').disabled=current===spreads.length-1 || turning;
    $('#sealCount').textContent=`${collected.size} / 5`;
    $('#chamberState').textContent=unlocked?'CONHECIMENTO REVELADO':`LACRES DESCOBERTOS ${collected.size}/5`;
    $$('.archive-link.active').forEach(x=>x.classList.remove('active'));
    const active=$(`.archive-link[data-index="${current}"]`);if(active)active.classList.add('active');
  }
  function refresh(){root.innerHTML=render(spreads[current],current);const s=spreads[current];theme(s.kind==='entity'?s.payload.color:s.kind==='horse'?Horsemen[s.payload].color:['annihilator','gate','pillars','chronicle','manifestation','last'].includes(s.kind)?'#aa484e':'#b99972');updateControls();}
  function pageTarget(target){let n=Math.max(0,Math.min(spreads.length-1,Number(target)));if(n>=secretStart&&!unlocked){toast('Este conhecimento não permite leitores sem os cinco lacres.');return gateIndex;}return n;}
  function toPage(target,force=false){
    const n=pageTarget(target);
    if(n===current&&!force){closeMenu();return;}
    if(turning){pending=n;return;}
    const old=current,forward=n>old;
    const newHTML=render(spreads[n],n);
    const animation=opened&&!reduced&&!mobile();
    if(!animation){current=n;refresh();closeMenu();return;}
    turning=true;updateControls();
    const nextDoc=document.createElement('div');nextDoc.innerHTML=newHTML;
    const oldLeft=$('.folio-left',root)?.outerHTML||'',oldRight=$('.folio-right',root)?.outerHTML||'';
    const newLeft=$('.folio-left',nextDoc)?.outerHTML||'',newRight=$('.folio-right',nextDoc)?.outerHTML||'';
    root.innerHTML=`<div class="spread">${forward?oldLeft:newLeft}${forward?newRight:oldRight}</div>`;
    faceFront.innerHTML=forward?oldRight:oldLeft;
    faceBack.innerHTML=forward?newLeft:newRight;
    sheet.className='turn-sheet '+(forward?'forward':'backward');
    sheet.style.display='block';
    void sheet.offsetWidth;
    requestAnimationFrame(()=>requestAnimationFrame(()=>sheet.classList.add('turning')));
    playFlip();
    const serial=++flipSerial;
    let finished=false;
    let fallbackId=null;
    const onEnd=(ev)=>{if(ev.target===sheet&&ev.propertyName==='transform')done();};
    const done=()=>{
      if(finished||!turning||serial!==flipSerial)return;
      finished=true;clearTimeout(fallbackId);sheet.removeEventListener('transitionend',onEnd);
      turning=false;current=n;
      sheet.style.display='none';sheet.className='turn-sheet';sheet.style.transform='';faceFront.innerHTML='';faceBack.innerHTML='';
      refresh();closeMenu();
      if(pending!==null){const next=pending;pending=null;if(next!==current)toPage(next);}
    };
    sheet.addEventListener('transitionend',onEnd);
    fallbackId=setTimeout(done,1160);
  }

  function buildSidebar(){
    const base=DATA.filter(e=>{
      const fit=filter==='all'||filter===e.category||(filter==='favorite'&&savedFavorites.has(e.id));
      const q=search.toLocaleLowerCase('pt-BR');
      return fit&&(!q||[e.name,e.title,e.domain,e.realm].join(' ').toLocaleLowerCase('pt-BR').includes(q));
    });
    const chunks=[];
    if(filter==='all'&&!search){
      chunks.push(`<button class="archive-link index-link" type="button" data-index="0"><span class="link-glyph">✣</span><span><b>O Limiar</b><small>Prólogo</small></span></button>`);
      chunks.push(`<button class="archive-link index-link" type="button" data-index="1"><span class="link-glyph">◈</span><span><b>Atlas dos Domínios</b><small>Introdução</small></span></button>`);
    }
    ['demonios','anjos','criaturas'].forEach(cat=>{
      const group=base.filter(e=>e.category===cat);
      if(!group.length)return;
      chunks.push(`<button class="archive-group-heading" data-index="${perGroup[cat]}" type="button"><span>${glyphCat[cat]}</span>${prettyCat[cat]}<small>${group.length}</small></button>`);
      group.forEach(e=>chunks.push(`<button type="button" class="archive-link ${current===perEntity.get(e.name)?'active':''}" data-index="${perEntity.get(e.name)}"><span class="link-glyph" style="--link-color:${esc(e.color)}">${esc(e.glyph)}</span><span><b>${esc(e.name)}</b><small>${esc(e.title)}</small></span>${savedFavorites.has(e.id)?'<span class="saved-indicator">✦</span>':''}</button>`));
    });
    if(filter==='all'&&!search){
      chunks.push(`<button class="archive-group-heading" data-index="${gateIndex}" type="button"><span>⛧</span>${unlocked?'REGISTROS DO APOCALIPSE':'CÂMARA PROIBIDA'}<small>${unlocked?'ABERTA':'SELADA'}</small></button>`);
      if(unlocked){
        for(const h of ['Guerra','Peste','Fome','Morte']){
          const i=spreads.findIndex(x=>x.kind==='horse'&&x.payload===h);
          chunks.push(`<button class="archive-link ${i===current?'active':''}" data-index="${i}" type="button"><span class="link-glyph" style="--link-color:${Horsemen[h].color}">${Horsemen[h].symbol}</span><span><b>${h}</b><small>${Horsemen[h].ordinal}</small></span></button>`);
        }
      }
    }
    if(!base.length)chunks.push(`<p class="no-results">Nenhuma presença encontrada. Tente outro termo ou categoria.</p>`);
    $('#sidebarList').innerHTML=chunks.join('');
    $('#recordCount').textContent=base.length;
    $$('.chip').forEach(chip=>chip.classList.toggle('active',chip.dataset.filter===filter));
  }
  function closeMenu(){$('#sidebar').classList.remove('open');$('#sidebarBackdrop').classList.remove('open');$('#menuButton').setAttribute('aria-expanded','false');}
  function clickRelic(id,choice){
    const e=DATA.find(x=>x.id===id);if(!e)return;
    let step=gameState.get(id)||0;
    if(step>=3)return;
    if(Number(choice)===step){step++;gameState.set(id,step);if(step===3){pulse();toast(`O ${sceneInteraction[e.scene]||'selo'} respondeu. Uma inscrição de ${e.name} foi revelada.`);}else toast('O recinto reconheceu o aspecto. Continue.');}
    else{step=0;gameState.set(id,0);toast('A sequência foi quebrada. O recinto retornou ao silêncio.');}
    saveProgress();refresh();
  }
  function handleAction(button){
    const action=button.dataset.action, id=button.dataset.id;
    if(action==='horseomen'){
      if(!Horsemen[id])return;
      const step=horseOmenState.get(id)||0;
      if(step>=3)return;
      horseOmenState.set(id,step+1);
      pulse();refresh();
      toast(step===2?`${id.toUpperCase()} · O ${Horsemen[id].ordinal} FOI ROMPIDO.`:`${id.toUpperCase()} · O PRESSÁGIO SE REVELOU.`);
      return;
    }
    if(action==='horse-reset'){
      if(!Horsemen[id])return;
      horseOmenState.set(id,0);refresh();
      return;
    }
    if(action==='tab'){tabState.set(id,button.dataset.tab);refresh();return;}
    if(action==='favorite'){
      if(savedFavorites.has(id))savedFavorites.delete(id);else savedFavorites.add(id);
      try{localStorage.setItem('liber-favs-v3',JSON.stringify([...savedFavorites]));}catch(_e){}
      buildSidebar();refresh();return;
    }
    if(action==='relic'){clickRelic(id,button.dataset.choice);return;}
    if(action==='collect'){
      const s=button.dataset.seal;if(!sealsOrder.includes(s)||collected.has(s))return;
      const e=spreads[current]?.payload;
      if(!e||sealByName[e.name]!==s||(gameState.get(e.id)||0)!==3)return;
      collected.add(s);saveProgress();pulse();toast(`${sealGlyph[s]} O SELO DE ${s.toUpperCase()} FOI RECOLHIDO.`);refresh();return;
    }
    if(action==='heart'){
      if(collected.size!==5||gateHearts>=3)return;
      gateHearts++;saveProgress();pulse();refresh();toast(`O ${gateHearts}º coração simbólico silenciou.`);return;
    }
    if(action==='altar'){
      if(collected.size!==5||gateHearts!==3||altarStage>=5)return;
      altarStage++;saveProgress();pulse();refresh();toast(`DIA ${altarStage} CONCLUÍDO · O CORAÇÃO RECEBEU O PILAR.`);return;
    }
    if(action==='unlock'){
      if(collected.size!==5||gateHearts!==3||altarStage!==5)return;
      unlocked=true;saveProgress();pulse();buildSidebar();refresh();toast('A CÂMARA INTERDITA SE ABRIU. ANNIHILATOR RECONHECEU O CHAMADO.');return;
    }
  }

  root.addEventListener('click',ev=>{
    const btn=ev.target.closest('button');if(!btn||turning)return;
    if(btn.dataset.jump!==undefined){toPage(Number(btn.dataset.jump));return;}
    if(btn.dataset.action){handleAction(btn);return;}
  });
  $('#sidebarList').addEventListener('click',ev=>{const btn=ev.target.closest('[data-index]');if(btn)toPage(Number(btn.dataset.index));});
  $('#archiveShortcut').addEventListener('click',()=>toPage(gateIndex));
  $('#prevPage').addEventListener('click',()=>toPage(current-1));
  $('#nextPage').addEventListener('click',()=>toPage(current+1));
  $('#enterButton').addEventListener('click',()=>{
    opened=true;$('#app').inert=false;$('#threshold').classList.add('disappear');
    setTimeout(()=>{$('#threshold').hidden=true;},800);
    playFlip();refresh();
  });
  $('#menuButton').addEventListener('click',()=>{const will=!sidebar.classList.contains('open');sidebar.classList.toggle('open',will);$('#sidebarBackdrop').classList.toggle('open',will);$('#menuButton').setAttribute('aria-expanded',String(will));});
  $('#sidebarBackdrop').addEventListener('click',closeMenu);
  $('#searchInput').addEventListener('input',ev=>{search=ev.target.value.trim();buildSidebar();});
  $$('.chip').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;buildSidebar();}));
  $('#resetButton').addEventListener('click',()=>{
    if(!confirm('Reiniciar os cinco selos e o ritual de Annihilator nesta sessão? Os registros salvos continuarão guardados.'))return;
    collected.clear();gameState.clear();gateHearts=0;altarStage=0;unlocked=false;saveProgress();buildSidebar();toPage(gateIndex);refresh();toast('Os lacres voltaram a dormir.');
  });
  document.addEventListener('keydown',ev=>{
    if(ev.key==='Escape'){closeMenu();return;}
    if(!opened||ev.altKey||ev.ctrlKey||ev.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName))return;
    if(ev.key==='ArrowRight'){ev.preventDefault();toPage(current+1);}
    if(ev.key==='ArrowLeft'){ev.preventDefault();toPage(current-1);}
  });
  let touchStart=null;
  stage.addEventListener('touchstart',ev=>{if(ev.touches.length===1)touchStart={x:ev.touches[0].clientX,y:ev.touches[0].clientY};},{passive:true});
  stage.addEventListener('touchend',ev=>{if(!touchStart||ev.changedTouches.length!==1)return;const dx=ev.changedTouches[0].clientX-touchStart.x,dy=ev.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>95&&Math.abs(dx)>Math.abs(dy)*1.6)toPage(current+(dx<0?1:-1));},{passive:true});

  function ensureAudio(){
    if(audioCtx)return;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    audioCtx=new AC();drone=audioCtx.createGain();drone.gain.value=.004;drone.connect(audioCtx.destination);
    [48.99,73.42,98].forEach(f=>{const o=audioCtx.createOscillator();o.type='sine';o.frequency.value=f;o.connect(drone);o.start();});
    audioCtx.suspend();
  }
  function playFlip(){if(!soundOn||!audioCtx)return;try{const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.setValueAtTime(190,now);o.frequency.exponentialRampToValueAtTime(65,now+.19);g.gain.setValueAtTime(.001,now);g.gain.linearRampToValueAtTime(.014,now+.02);g.gain.exponentialRampToValueAtTime(.0001,now+.22);o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+.25);}catch(_e){}}
  $('#soundButton').addEventListener('click',async()=>{ensureAudio();if(!audioCtx){toast('Som indisponível neste navegador.');return;}soundOn=!soundOn;if(soundOn)await audioCtx.resume();else await audioCtx.suspend();$('#soundButton').setAttribute('aria-pressed',String(soundOn));$('#soundButton span').textContent=soundOn?'SOM ON':'SOM OFF';playFlip();});

  const canvas=$('#dustCanvas'),ctx=canvas.getContext('2d');
  if(ctx){let stars=[],w=0,h=0,dpr=1;function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const random=rng(446626);stars=Array.from({length:Math.min(140,Math.floor(w*h/15000)+35)},()=>({x:random()*w,y:random()*h,r:.3+random()*1.4,vy:.02+random()*.16,vx:(random()-.5)*.08,seed:random()*6}));}function paint(t){ctx.clearRect(0,0,w,h);stars.forEach(p=>{const a=.1+(Math.sin(t*.0007+p.seed)+1)*.1;ctx.beginPath();ctx.fillStyle=`rgba(220,183,136,${a})`;ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();if(!reduced){p.y-=p.vy;p.x+=p.vx;if(p.y<-3)p.y=h+3;if(p.x<-3)p.x=w+3;if(p.x>w+3)p.x=-3;}});if(!reduced)requestAnimationFrame(paint);}resize();addEventListener('resize',resize,{passive:true});requestAnimationFrame(paint);}

  readProgress();buildSidebar();refresh();
  $('#recordCount').textContent=DATA.length;
})();
