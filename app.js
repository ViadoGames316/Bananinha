const KEY='duckchainsaw_studio_v1';
const STATUSES=['Ideia','Produção','Pronto','Publicado'];
const STATUS_COLORS={'Ideia':'#7c5182','Produção':'#ff8920','Pronto':'#f7be8b','Publicado':'#3f9e6e'};
const NOTE_COLORS=['#f7be8b','#ff8920','#7c5182','#f0f0f0'];
const CARD_COLORS=['#ff8920','#7c5182','#b85f10','#f7be8b'];

function seed(){
  const t=new Date(), iso=d=>d.toISOString().slice(0,10);
  const plus=n=>{const d=new Date(t);d.setDate(d.getDate()+n);return iso(d)};
  return {
    theme:'dark',
    tasks:[
      {id:1,title:'Finalizar arte do carrossel de quinta',done:false,due:plus(1)},
      {id:2,title:'Responder comentários do último reel',done:true,due:plus(0)},
      {id:3,title:'Gravar bastidores do processo de design',done:false,due:plus(3)},
      {id:4,title:'Agendar posts da semana',done:false,due:plus(2)},
    ],
    posts:[
      {id:1,title:'Carrossel — Identidade DuckChainsaw',caption:'A paleta que define a marca: pêssego, roxo e laranja queimado. Cada cor com um propósito. 🦆',status:'Produção',date:plus(2),tags:['branding','identidade'],color:'#ff8920'},
      {id:2,title:'Reel — Bastidores do logo',caption:'Do rabisco ao vetor: como o patinho ganhou vida. Salva pra ver o before/after!',status:'Ideia',date:plus(5),tags:['reel','processo'],color:'#7c5182'},
      {id:3,title:'Post — Dica de grid',caption:'3 regras de grid que mudaram meu feed. A terceira é a que ninguém te conta…',status:'Pronto',date:plus(1),tags:['dica','feed'],color:'#b85f10'},
      {id:4,title:'Story — Enquete de paleta',caption:'Qual combinação grita mais DUCKCHENSAW? Vota aí 👇',status:'Publicado',date:plus(-2),tags:['story','enquete'],color:'#f7be8b'},
    ],
    canvas:{
      items:[
        {id:1,type:'note',x:120,y:100,w:220,text:'Semana 12 · foco: fechar identidade do feed 🦆',color:'#f7be8b'},
        {id:2,type:'note',x:400,y:180,w:220,text:'Ideias de reels:\n• before/after logo\n• paleta em 30s\n• rotina de design',color:'#7c5182',light:true},
        {id:3,type:'post',x:140,y:380,postId:3},
        {id:4,type:'img',x:460,y:430,color:'#b85f10',label:'mockup-feed.png'},
      ]
    }
  };
}

let state;
try{ state=JSON.parse(localStorage.getItem(KEY))||seed(); }catch(e){ state=seed(); }
if(!state.canvas) state.canvas=seed().canvas;
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const uid=()=>Date.now()+Math.floor(Math.random()*999);
const $=s=>document.querySelector(s);

function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2200);
}

/* ---------- THEME ---------- */
function applyTheme(){
  document.documentElement.dataset.theme=state.theme;
  $('#themeToggle').textContent=state.theme==='dark'?'☾':'☀';
}
$('#themeToggle').onclick=()=>{ state.theme=state.theme==='dark'?'light':'dark'; save(); applyTheme(); };

/* ---------- NAV ---------- */
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    btn.classList.add('active');
    $('#view-'+btn.dataset.view).classList.add('active');
    if(btn.dataset.view==='canvas') buildCanvas();
  };
});

/* ---------- HOME ---------- */
function renderHome(){
  const h=new Date().getHours();
  $('#greeting').textContent = h<6?'Boa madrugada 🦆':h<12?'Bom dia ☀️':h<18?'Boa tarde 🌤️':'Boa noite 🌙';
  const pending=state.tasks.filter(t=>!t.done).length;
  $('#greetSub').textContent = pending?`Você tem ${pending} tarefa${pending>1?'s':''} pendente${pending>1?'s':''} esta semana.`:'Tudo em ordem por aqui. ✨';

  const now=new Date();
  const mon=new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7));
  const names=['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
  $('#weekStrip').innerHTML=Array.from({length:7},(_,i)=>{
    const d=new Date(mon); d.setDate(mon.getDate()+i);
    const iso=d.toISOString().slice(0,10);
    const isToday=iso===now.toISOString().slice(0,10);
    const dayTasks=state.tasks.filter(t=>t.due===iso);
    const dots=dayTasks.map(t=>`<span class="dot ${t.done?'done':''}"></span>`).join('');
    return `<div class="day ${isToday?'today':''}">
      <div class="dname">${names[i]}</div>
      <div class="dnum">${d.getDate()}</div>
      <div class="dots">${dots}</div>
    </div>`;
  }).join('');

  const published=state.posts.filter(p=>p.status==='Publicado').length;
  const producing=state.posts.filter(p=>p.status==='Produção').length;
  const ideas=state.posts.filter(p=>p.status==='Ideia').length;
  $('#statRow').innerHTML=`
    <div class="stat accent"><div class="s-num">${state.posts.length}</div><div class="s-label">Posts no pipeline</div></div>
    <div class="stat"><div class="s-num">${producing}</div><div class="s-label">Em produção</div></div>
    <div class="stat"><div class="s-num">${ideas}</div><div class="s-label">Ideias na fila</div></div>
    <div class="stat"><div class="s-num">${published}</div><div class="s-label">Publicados</div></div>`;

  $('#taskCount').textContent=state.tasks.filter(t=>!t.done).length;
  $('#taskList').innerHTML = state.tasks.length? state.tasks.map((t,i)=>`
    <div class="task ${t.done?'done':''}" style="animation-delay:${i*50}ms">
      <div class="check" onclick="toggleTask(${t.id})">✓</div>
      <div class="t-title">${esc(t.title)}</div>
      ${t.due?`<span class="t-due ${(!t.done&&t.due<new Date().toISOString().slice(0,10))?'late':''}">${fmtDate(t.due)}</span>`:''}
      <button class="del" onclick="delTask(${t.id})">✕</button>
    </div>`).join('')
    : `<div class="empty"><div class="e-duck">🦆</div><p>Nenhuma tarefa. Aproveite o vazio criativo.</p></div>`;

  const upcoming=state.posts.filter(p=>p.date&&p.status!=='Publicado').sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  $('#deadlineList').innerHTML = upcoming.length? upcoming.map((p,i)=>{
    const d=new Date(p.date+'T12:00');
    return `<div class="deadline" style="animation-delay:${i*60}ms">
      <div class="dl-date"><b>${d.getDate()}</b><span>${['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'][d.getMonth()]}</span></div>
      <div class="dl-info">
        <div class="dl-title">${esc(p.title)}</div>
        <div class="dl-sub">${p.status} · ${daysFrom(p.date)}</div>
      </div>
    </div>`;
  }).join('') : `<div class="empty"><div class="e-duck">📅</div><p>Sem prazos marcados.</p></div>`;

  $('#nav-posts-count').textContent=state.posts.length;
}

function daysFrom(iso){
  const diff=Math.round((new Date(iso+'T12:00')-new Date())/86400000);
  if(diff===0)return 'é hoje!';
  if(diff===1)return 'amanhã';
  if(diff===-1)return 'ontem (atrasado!)';
  return diff>0?`em ${diff} dias`:`atrasado há ${-diff} dias`;
}
function fmtDate(iso){
  const d=new Date(iso+'T12:00');
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','');
}
function esc(s){const d=document.createElement('div');d.textContent=s??'';return d.innerHTML}

function addTask(){
  const inp=$('#taskInput'); const title=inp.value.trim();
  if(!title)return toast('Escreva a tarefa primeiro 🙂');
  state.tasks.push({id:uid(),title,done:false,due:new Date().toISOString().slice(0,10)});
  inp.value=''; save(); renderHome();
}
function toggleTask(id){ const t=state.tasks.find(t=>t.id===id); t.done=!t.done; save(); renderHome(); }
function delTask(id){ state.tasks=state.tasks.filter(t=>t.id!==id); save(); renderHome(); toast('Tarefa removida'); }

/* ---------- POSTS ---------- */
let filterStatus='Todos', editingId=null, formStatus='Ideia', formColor='#ff8920';

function renderChips(){
  $('#statusChips').innerHTML=['Todos',...STATUSES].map(s=>
    `<button class="chip ${filterStatus===s?'active':''}" onclick="setFilter('${s}')">${s}</button>`).join('');
}
function setFilter(s){ filterStatus=s; renderChips(); renderPosts(); }

function renderPosts(){
  const q=($('#searchInput').value||'').toLowerCase();
  const list=state.posts.filter(p=>
    (filterStatus==='Todos'||p.status===filterStatus) &&
    (!q||(p.title+' '+p.caption+' '+(p.tags||[]).join(' ')).toLowerCase().includes(q))
  );
  $('#postsGrid').innerHTML = list.length? list.map((p,i)=>`
    <div class="post-card card" style="animation-delay:${i*60}ms" onclick="openPostModal(${p.id})">
      <div class="post-thumb" style="background:linear-gradient(140deg,${p.color},rgba(0,0,0,.55))">
        <span class="status-badge" style="background:${STATUS_COLORS[p.status]}">${p.status}</span>
        ${p.date?`<span class="pt-date">📅 ${fmtDate(p.date)}</span>`:''}
      </div>
      <div class="post-body">
        <div class="post-title">${esc(p.title)}</div>
        <div class="post-caption">${esc(p.caption)}</div>
        <div class="post-foot">
          <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div>
          <button class="copy-btn" title="Copiar legenda" onclick="copyCaption(event,${p.id})">⧉</button>
        </div>
      </div>
    </div>`).join('')
    : `<div class="empty" style="grid-column:1/-1"><div class="e-duck">🪶</div><p>Nada por aqui ainda. Crie seu primeiro post!</p></div>`;
}

function copyCaption(e,id){
  e.stopPropagation();
  const p=state.posts.find(p=>p.id===id);
  navigator.clipboard?.writeText(p.caption||'').then(()=>toast('Legenda copiada! 📋'),()=>toast('Não deu pra copiar 😅'));
}

function openPostModal(id){
  editingId=id||null;
  const p=id?state.posts.find(p=>p.id===id):null;
  $('#modalTitle').textContent=p?'Editar post':'Novo post';
  $('#f-title').value=p?.title||'';
  $('#f-caption').value=p?.caption||'';
  $('#f-date').value=p?.date||'';
  $('#f-tags').value=(p?.tags||[]).join(', ');
  formStatus=p?.status||'Ideia'; formColor=p?.color||CARD_COLORS[0];
  renderFormSegs();
  $('#modalBack').classList.add('open');
  setTimeout(()=>$('#f-title').focus(),80);
}
function renderFormSegs(){
  $('#f-status').innerHTML=STATUSES.map(s=>`<button class="${formStatus===s?'on':''}" onclick="formStatus='${s}';renderFormSegs()">${s}</button>`).join('');
  $('#f-color').innerHTML=CARD_COLORS.map(c=>`<button class="${formColor===c?'on':''}" style="${formColor===c?`background:${c};border-color:${c};color:#fff`:''}" onclick="formColor='${c}';renderFormSegs()">●</button>`).join('');
}
function closePostModal(){ $('#modalBack').classList.remove('open'); }
$('#modalBack').addEventListener('click',e=>{ if(e.target===e.currentTarget) closePostModal(); });

function savePost(){
  const title=$('#f-title').value.trim();
  if(!title)return toast('Dá um título pro post 🙂');
  const data={
    title, caption:$('#f-caption').value.trim(), status:formStatus, color:formColor,
    date:$('#f-date').value||null,
    tags:$('#f-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
  };
  if(editingId){ Object.assign(state.posts.find(p=>p.id===editingId),data); toast('Post atualizado ✨'); }
  else{ state.posts.push({id:uid(),...data}); toast('Post criado 🦆'); }
  save(); closePostModal(); renderPosts(); renderHome();
}

/* ---------- CANVAS ---------- */
let zoom=1;
const wrap=$('#canvasWrap'), surface=$('#canvasSurface');

function buildCanvas(){
  surface.innerHTML='';
  surface.style.transform=`scale(${zoom})`;
  state.canvas.items.forEach(it=>surface.appendChild(canvasEl(it)));
}
function canvasEl(it){
  const el=document.createElement('div');
  el.className='c-item'; el.style.left=it.x+'px'; el.style.top=it.y+'px';
  const del=document.createElement('button');
  del.className='c-del no-drag'; del.textContent='✕';
  del.onclick=e=>{ e.stopPropagation(); state.canvas.items=state.canvas.items.filter(i=>i.id!==it.id); save(); el.remove(); toast('Removido do quadro'); };

  if(it.type==='note'){
    el.classList.add('c-note'); el.style.width=(it.w||220)+'px';
    el.style.background=it.color;
    el.style.color = it.color==='#7c5182'?'#fff':(it.color==='#ff8920'?'#fff':'#1a1108');
    el.textContent=it.text;
    el.title='Duplo clique para editar';
    el.addEventListener('dblclick',()=>{
      el.contentEditable=true; el.classList.add('editing'); el.focus();
      const range=document.createRange(); range.selectNodeContents(el);
      const sel=getSelection(); sel.removeAllRanges(); sel.addRange(range);
    });
    el.addEventListener('blur',()=>{
      el.contentEditable=false; el.classList.remove('editing');
      it.text=el.textContent; save();
    });
    el.appendChild(del);
  }
  if(it.type==='img'){
    el.classList.add('c-img'); el.style.background=`linear-gradient(140deg,${it.color},rgba(0,0,0,.6))`;
    el.innerHTML=`<div class="ci-icon">🖼️</div><div>${esc(it.label||'imagem.png')}</div>`;
    el.appendChild(del);
  }
  if(it.type==='post'){
    const p=state.posts.find(p=>p.id===it.postId)||state.posts[0];
    if(!p){ return document.createElement('div'); }
    el.classList.add('c-post');
    el.innerHTML=`<div class="cp-thumb" style="background:linear-gradient(140deg,${p.color},rgba(0,0,0,.55))"></div>
      <div class="cp-body"><div class="cp-title">${esc(p.title)}</div><div class="cp-sub">${p.status}${p.date?' · '+fmtDate(p.date):''}</div></div>`;
    el.appendChild(del);
  }
  makeDraggable(el,it);
  return el;
}
function makeDraggable(el,it){
  el.addEventListener('pointerdown',e=>{
    if(e.target.closest('.no-drag')||el.isContentEditable)return;
    e.preventDefault();
    const sx=e.clientX, sy=e.clientY, ox=it.x, oy=it.y;
    el.setPointerCapture(e.pointerId);
    const move=ev=>{
      it.x=ox+(ev.clientX-sx)/zoom; it.y=oy+(ev.clientY-sy)/zoom;
      el.style.left=it.x+'px'; el.style.top=it.y+'px';
    };
    const up=()=>{ el.removeEventListener('pointermove',move); el.removeEventListener('pointerup',up); save(); };
    el.addEventListener('pointermove',move); el.addEventListener('pointerup',up);
  });
}
function addCanvasItem(type){
  if(type==='note'){
    const colors=NOTE_COLORS;
    state.canvas.items.push({id:uid(),type,x:160+Math.random()*500,y:120+Math.random()*300,w:220,text:'Nova nota… duplo clique para editar',color:colors[Math.floor(Math.random()*colors.length)],light:Math.random()>.5});
  }
  if(type==='post'){
    if(!state.posts.length)return toast('Crie um post primeiro 🙂');
    state.canvas.items.push({id:uid(),type,x:160+Math.random()*500,y:120+Math.random()*300,postId:state.posts[0].id});
  }
  if(type==='img'){
    state.canvas.items.push({id:uid(),type,x:160+Math.random()*500,y:120+Math.random()*300,color:CARD_COLORS[Math.floor(Math.random()*4)],label:'referencia.png'});
  }
  save(); buildCanvas();
}
function zoomBy(d){ zoom=Math.min(1.5,Math.max(.4,+(zoom+d).toFixed(2))); surface.style.transform=`scale(${zoom})`; $('#zoomLabel').textContent=Math.round(zoom*100)+'%'; }
function resetZoom(){ zoom=1; surface.style.transform='scale(1)'; $('#zoomLabel').textContent='100%'; }

wrap.addEventListener('pointerdown',e=>{
  if(e.target!==wrap&&e.target!==surface)return;
  wrap.classList.add('panning');
  const sx=e.clientX, sy=e.clientY, sl=wrap.scrollLeft, st=wrap.scrollTop;
  const move=ev=>{ wrap.scrollLeft=sl-(ev.clientX-sx); wrap.scrollTop=st-(ev.clientY-sy); };
  const up=()=>{ wrap.classList.remove('panning'); wrap.removeEventListener('pointermove',move); wrap.removeEventListener('pointerup',up); };
  wrap.addEventListener('pointermove',move); wrap.addEventListener('pointerup',up);
});

/* ---------- INIT ---------- */
applyTheme();
renderChips();
renderHome();
renderPosts();
buildCanvas();
