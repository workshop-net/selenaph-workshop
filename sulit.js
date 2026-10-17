/* Sulit Dito MNL — shared script for all pages */
(function(){
  const $  = (s,c)=> (c||document).querySelector(s);
  const $$ = (s,c)=> Array.prototype.slice.call((c||document).querySelectorAll(s));
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ready = ()=> document.body.classList.add('is-ready');
  window.addEventListener('load', ready);
  setTimeout(ready, 1600);

  const header = $('#header'), fill = $('#threadFill'), diamond = $('#threadDiamond'),
        mark = $('#heroMark'), toTop = $('#toTop');
  let ticking = false;
  function onScroll(){
    if(header) header.classList.toggle('scrolled', scrollY > 40);
    if(toTop) toTop.classList.toggle('show', scrollY > 600);
    document.body.classList.toggle('has-scrolled', scrollY > 40);
    if(fill){
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, scrollY / max) : 0;
      fill.style.height = (p * 100) + '%';
      diamond.style.top = (p * 100) + '%';
    }
    if (mark) mark.style.transform = 'translateY(calc(-50% + ' + (scrollY * .16) + 'px)) rotate(-8deg)';
    ticking = false;
  }
  addEventListener('scroll', ()=>{ if(!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
  onScroll();
  if(toTop) toTop.addEventListener('click', ()=> scrollTo({top:0, behavior: REDUCED ? 'auto' : 'smooth'}));

  const ro = new IntersectionObserver(es=> es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); ro.unobserve(e.target); }
  }), {threshold:.12});
  $$('.reveal').forEach(el=> ro.observe(el));

  function toast(msg){
    const c = $('#toasts'), t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>' + msg + '</span>';
    c.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=> t.remove(), 500); }, 3400);
  }

  /* typewriter (only on home page) */
  const noteEl = $('#typeNote');
  if(noteEl && !REDUCED){
    const txt = noteEl.textContent, holder = noteEl.parentElement;
    noteEl.textContent = '';
    setTimeout(()=>{
      holder.classList.add('typing');
      let i = 0;
      (function type(){
        noteEl.textContent = txt.slice(0, ++i);
        if(i < txt.length){ setTimeout(type, 40 + Math.random()*45); }
        else { setTimeout(()=> holder.classList.remove('typing'), 2800); }
      })();
    }, 2300);
  }

  /* confetti burst */
  const CCOLORS = ['#F26E1C','#2BA6DB','#FFC93C','#1C4A5A','#F7CBA2'];
  function confetti(x, y){
    if(REDUCED) return;
    for(let i=0;i<14;i++){
      const p = document.createElement('span');
      p.className = 'confetti';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.background = CCOLORS[i % CCOLORS.length];
      const a = Math.random() * Math.PI * 2, v = 55 + Math.random() * 75;
      p.style.setProperty('--dx', (Math.cos(a) * v).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(a) * v - 60).toFixed(1) + 'px');
      p.style.setProperty('--r', Math.round(Math.random() * 300 - 150) + 'deg');
      document.body.appendChild(p);
      setTimeout(()=> p.remove(), 950);
    }
  }

  /* picks (persisted across sulit pages) */
  const picks = JSON.parse(localStorage.getItem('sulitPicks') || '[]');
  const panel = $('#pickPanel'), pickBtn = $('#pickBtn'), count = $('#pickCount');
  let shownTotal = 0;
  function savePicks(){ localStorage.setItem('sulitPicks', JSON.stringify(picks)); }
  function animateTotal(to){
    const el = $('#ppTotal'); if(!el) return;
    const from = shownTotal; shownTotal = to;
    if(REDUCED || from === to){ el.textContent = '₱' + to.toLocaleString(); return; }
    const t0 = performance.now(), dur = 550;
    function tick(t){
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = '₱' + Math.round(from + (to - from) * e).toLocaleString();
      if(k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function renderPicks(){
    if(!panel) return;
    const list = $('#ppList');
    count.textContent = picks.length;
    count.classList.toggle('on', picks.length > 0);
    if(!picks.length){
      list.innerHTML = '<p class="pp-empty">No picks yet — the finds await.</p>';
      animateTotal(0);
      return;
    }
    list.innerHTML = picks.map((it,i)=>
      '<div class="pp-item"><span>' + it.name + '</span><span class="pp-price">₱' + it.price.toLocaleString() +
      '</span><button class="pp-x" data-i="' + i + '" aria-label="Remove">' +
      '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div>'
    ).join('');
    animateTotal(picks.reduce((s,i)=> s + i.price, 0));
  }
  $$('.reserve').forEach(b=> b.addEventListener('click', ()=>{
    const sizesEl = b.closest('.p-info').querySelector('.sizes');
    const chosen = sizesEl ? sizesEl.querySelector('.size.on') : null;
    const label = b.dataset.name + (chosen ? ' — ' + chosen.textContent : '');
    picks.push({name: label, price: +b.dataset.price});
    savePicks(); renderPicks();
    count.classList.remove('pop'); void count.offsetWidth; count.classList.add('pop');
    const r = pickBtn.getBoundingClientRect();
    confetti(r.left + r.width/2, r.top + r.height/2);
    toast(label + ' added to your picks.');
  }));
  if($('#ppList')){
    $('#ppList').addEventListener('click', e=>{
      const x = e.target.closest('.pp-x');
      if(x){ picks.splice(+x.dataset.i, 1); savePicks(); renderPicks(); }
    });
  }
  if($('#ppClear')){
    $('#ppClear').addEventListener('click', ()=>{
      if(picks.length){ picks.length = 0; savePicks(); renderPicks(); toast('Your picks have been cleared.'); }
    });
  }
  if(pickBtn) pickBtn.addEventListener('click', e=>{ e.stopPropagation(); panel.classList.toggle('open'); });
  document.addEventListener('click', e=>{
    if(panel && panel.classList.contains('open') && !panel.contains(e.target) && e.target !== pickBtn) panel.classList.remove('open');
  });
  renderPicks();

  $$('.sizes').forEach(group=>{
    group.addEventListener('click', e=>{
      const chip = e.target.closest('.size');
      if(!chip) return;
      $$('.size', group).forEach(c=> c.classList.remove('on'));
      chip.classList.add('on');
    });
  });

  const menu = $('#mobileMenu');
  if(menu){
    $('#burger').addEventListener('click', ()=> menu.classList.add('open'));
    $('#mmClose').addEventListener('click', ()=> menu.classList.remove('open'));
    $$('.mm-link').forEach(a=> a.addEventListener('click', ()=> menu.classList.remove('open')));
  }

  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape'){ if(panel) panel.classList.remove('open'); if(menu) menu.classList.remove('open'); }
  });
})();
