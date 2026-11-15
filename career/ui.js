import {CareerEngine} from './engine.js';
export function mountCareer(catalog){
 const engine=new CareerEngine(catalog),root=document.getElementById('careerCenter');
 const $=id=>root.querySelector('#'+id);
 const fmt=n=>'€ '+Number(n||0).toLocaleString('pt-BR');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let selected=null,tab='market';
 const clubs=new Map(catalog.map(c=>[c.id,c]));
 const currentName=id=>clubs.get(id)?.name||id;
 const visiblePlayers=()=>engine.state?Object.values(engine.state.players):[];
 function startView(){
  $('careerSetup').hidden=!!engine.state;$('careerContent').hidden=!engine.state;
  $('careerClub').innerHTML=catalog.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');
  render();
 }
 function render(){
  if(!engine.state)return;
  const s=engine.state,c=engine.club(s.clubId);
  $('careerTitle').textContent='Carreira Técnico · '+currentName(s.clubId);
  $('careerBudget').textContent='Transferências: '+fmt(c.transferBudget)+' | Salários disponíveis/semana: '+fmt(c.wageBudget-c.wageCommitted);
  $('careerWarning').textContent='Dados oficiais não verificados permanecem indisponíveis. Orçamentos são de cenário personalizado.';
  root.querySelectorAll('[data-career-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.careerTab===tab));
  const list=$('careerPlayers');list.replaceChildren();
  let players=visiblePlayers();
  if(tab==='sell')players=players.filter(p=>p.clubId===s.clubId);
  if(tab==='loans')players=[];
  if(tab==='offers')players=[];
  const query=$('careerSearch').value.toLocaleLowerCase('pt-BR'),pos=$('careerPosition').value;
  players=players.filter(p=>(p.name||'').toLocaleLowerCase('pt-BR').includes(query)&&(!pos||p.position===pos));
  for(const p of players.slice(0,250)){
   const btn=document.createElement('button');btn.className='careerPlayer';btn.textContent=(p.position||'—')+'  '+p.name+'  GER '+p.overall+'  '+currentName(p.clubId)+'  '+fmt(p.marketValue);
   btn.addEventListener('click',()=>{selected=p.id;renderDetail()});list.appendChild(btn)
  }
  if(!players.length)list.textContent=tab==='loans'?'Empréstimos ainda não implementados.':'Nenhum jogador verificado disponível nesta lista.';
  $('careerOfferList').replaceChildren();
  for(const o of s.offers){const el=document.createElement('div');el.className='careerOffer';const p=s.players[o.playerId];el.textContent=(p?.name||o.playerId)+' · '+fmt(o.fee)+' · '+o.status+' ';
   if(o.status==='pending'){const b=document.createElement('button');b.textContent='Analisar proposta';b.onclick=()=>{try{const outcome=engine.decide(o.id,true);alert(outcome.status==='counter'?'Contraproposta: '+fmt(outcome.counterFee):'Clube aceitou. Negocie o contrato.');render()}catch(e){alert(e.message)}};el.appendChild(b)}
   if(o.status==='clubAccepted'){const b=document.createElement('button');b.textContent='Concluir contrato';b.onclick=()=>{try{engine.sign(o.id,true);render()}catch(e){alert(e.message)}};el.appendChild(b)}
   $('careerOfferList').appendChild(el)}
  renderDetail();
 }
 function renderDetail(){
  const p=selected&&engine.state?.players[selected];$('careerDetail').replaceChildren();
  if(!p){$('careerDetail').textContent='Selecione um atleta. Não há fotos ou modelos 3D oficiais vinculados aos elencos.';return}
  const title=document.createElement('h3');title.textContent=p.name;$('careerDetail').appendChild(title);
  for(const [k,v] of [['Clube',currentName(p.clubId)],['Nacionalidade',p.nationality||'Não verificada'],['Posição',p.position],['GER',p.overall],['Idade',p.age??'Não verificada'],['Potencial',p.potential??'Não verificado'],['Valor',fmt(p.marketValue)],['Salário semanal',fmt(p.weeklyWage)],['Contrato (anos)',p.contractYears??'Não verificado']]){const d=document.createElement('div');d.textContent=k+': '+v;$ ('careerDetail').appendChild(d)}
  $('careerActions').hidden=false;$('careerBuy').hidden=p.clubId===engine.state.clubId;$('careerSell').hidden=p.clubId!==engine.state.clubId;
 }
 $('careerStart').onclick=()=>{try{engine.start($('careerClub').value,Number($('careerInitialBudget').value),Number($('careerInitialWages').value));startView()}catch(e){alert(e.message)}};
 $('careerSearch').oninput=render;$('careerPosition').onchange=render;
 root.querySelectorAll('[data-career-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.careerTab;render()});
 $('careerBuy').onclick=()=>{if(!selected)return;const p=engine.player(selected);const fee=prompt('Valor da proposta (€)',String(p.marketValue));if(fee===null)return;const wage=prompt('Salário semanal (€)',String(p.weeklyWage));if(wage===null)return;try{engine.offer({playerId:p.id,fromClubId:p.clubId,toClubId:engine.state.clubId,fee:Number(fee),weeklyWage:Number(wage),years:3});tab='offers';render()}catch(e){alert(e.message)}};
 $('careerSell').onclick=()=>{try{engine.listForSale(selected);render();alert('Atleta colocado à venda. Propostas automáticas da IA ainda pendentes.')}catch(e){alert(e.message)}};
 $('careerExport').onclick=()=>{try{const a=document.createElement('a'),blob=new Blob([engine.export()],{type:'application/json'});const url=URL.createObjectURL(blob);a.href=url;a.download='mini-fc27-carreira.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){alert(e.message)}};
 $('careerImport').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{engine.import(await file.text());startView()}catch(err){alert('Importação falhou: '+err.message)}};
 $('careerClose').onclick=()=>{root.style.display='none';window.dispatchEvent(new Event('mini-career-close'))};
 try{engine.load()}catch(e){console.warn('Carreira inválida:',e.message)}
 startView();
 return {open(){root.style.display='flex';render()},engine};
}
