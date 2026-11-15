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

 const negotiation=document.createElement('div');negotiation.id='negotiationScreen';negotiation.style.cssText='display:none;position:absolute;inset:0;z-index:5;background:linear-gradient(120deg,#071b39,#173f65 55%,#0c1834);color:white;padding:12px;overflow:auto;box-sizing:border-box';
 negotiation.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><h2 id="negTitle">NEGOCIAR TRANSFERÊNCIA</h2><button id="negExit">ENCERRAR NEGOCIAÇÃO</button></div><div id="negInfo"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><section style="background:#ffffff16;padding:12px;border-radius:12px"><label>Valor (€) <input id="negFee" type="number" min="0"></label><label>Parcelas <select id="negParts"><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label>Bônus (€) <input id="negBonus" type="number" min="0" value="0"></label><label>Futura venda (%) <input id="negSellOn" type="number" min="0" max="50" value="0"></label><label>Jogador em troca <select id="negExchange"><option value="">Nenhum</option></select></label><div id="negCosts"></div><div id="negContract" hidden><label>Salário semanal (€) <input id="negWage" type="number" min="0"></label><label>Duração (anos) <select id="negYears"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label><label>Bônus de assinatura (€) <input id="negSigning" type="number" min="0" value="0"></label><label>Papel <select id="negRole"><option value="starter">Titular</option><option value="important">Importante</option><option value="rotation">Rotação</option><option value="reserve">Reserva</option></select></label></div><button id="negSubmit">FAZER PROPOSTA</button></section><section style="background:#ffffff16;padding:12px;border-radius:12px"><h3 id="negRepresentative">Representante virtual do clube</h3><div id="negTension">Tensão baixa</div><div id="negMessages" style="max-height:35vh;overflow:auto;white-space:pre-wrap"></div><div id="negPlayer"></div></section></div>';
 root.appendChild(negotiation);
 const ng=id=>negotiation.querySelector('#'+id);
 let activeOffer=null,negPlayerId=null;
 function showNegotiation(playerId,offer=null){
  const p=engine.player(playerId);negPlayerId=playerId;activeOffer=offer;
  negotiation.style.display='block';ng('negSubmit').disabled=false;ng('negFee').value=offer?.counterFee??p.marketValue;
  ng('negWage').value=offer?.requestedWage??p.weeklyWage;
  ng('negPlayer').textContent=p.name+' · '+(p.position||'—')+' · GER '+p.overall+' · '+fmt(p.marketValue);
  ng('negRepresentative').textContent=offer?.status==='clubAccepted'||offer?.status==='contractCounter'?'Representante virtual do jogador':'Representante virtual de '+currentName(p.clubId);
  ng('negContract').hidden=!offer||!['clubAccepted','contractCounter'].includes(offer.status);
  ng('negTitle').textContent=ng('negContract').hidden?'NEGOCIAR TRANSFERÊNCIA':'NEGOCIAR CONTRATO';
  ng('negSubmit').textContent=ng('negContract').hidden?'FAZER PROPOSTA':'ENVIAR CONTRATO';
  ng('negTension').textContent=offer?.status==='rejected'?'Negociação encerrada':offer?.tension>=3?'Alta tensão':offer?.tension>=1?'Tensão moderada':'Baixa tensão';
  ng('negMessages').textContent=(offer?.messages||['Prepare sua proposta. Esta é uma simulação de negociação, não uma chamada real.']).join('\n\n');
  ng('negExchange').innerHTML='<option value="">Nenhum</option>'+Object.values(engine.state.players).filter(x=>x.clubId===engine.state.clubId).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');
  ng('negInfo').textContent='Orçamento disponível: '+fmt(engine.club(engine.state.clubId).transferBudget);
  updateCosts();
 }
 function updateCosts(){const fee=Number(ng('negFee').value)||0,parts=Number(ng('negParts').value)||1,bonus=Number(ng('negBonus').value)||0,budget=engine.club(engine.state.clubId).transferBudget;ng('negCosts').textContent='Imediato: '+fmt(Math.ceil(fee/parts)+bonus)+' | Futuro: '+fmt(fee-Math.ceil(fee/parts))+' | Restante: '+fmt(budget-Math.ceil(fee/parts)-bonus)}
 for(const id of ['negFee','negParts','negBonus'])ng(id).addEventListener('input',updateCosts);
 ng('negExit').onclick=()=>{if(activeOffer&&activeOffer.status!=='completed'&&activeOffer.status!=='rejected')try{engine.cancelNegotiation(activeOffer.id)}catch(e){}negotiation.style.display='none';render()};
 ng('negSubmit').onclick=()=>{try{
  if(!ng('negContract').hidden){
   const o=engine.negotiateContract(activeOffer.id,{weeklyWage:Number(ng('negWage').value),years:Number(ng('negYears').value),signingBonus:Number(ng('negSigning').value),role:ng('negRole').value});
   if(o.status==='completed'){window.dispatchEvent(new CustomEvent('mini-career-signing',{detail:{offerId:o.id}}));render();ng('negMessages').textContent='ACORDO CONCLUÍDO! Jogador transferido e orçamento atualizado.';ng('negSubmit').disabled=true;}else showNegotiation(negPlayerId,o);
  }else{
   const p=engine.player(negPlayerId);
   const o=engine.negotiateClub({playerId:p.id,fee:Number(ng('negFee').value),installments:Number(ng('negParts').value),bonus:Number(ng('negBonus').value),sellOn:Number(ng('negSellOn').value),exchangePlayerId:ng('negExchange').value||null});
   showNegotiation(negPlayerId,o);
   if(o.status==='rejected')ng('negSubmit').disabled=true;
  }
 }catch(e){alert(e.message)}};
 $('careerBuy').textContent='NEGOCIAR';$('careerBuy').onclick=()=>{if(selected)showNegotiation(selected)};
 $('careerSell').onclick=()=>{try{engine.listForSale(selected);render();alert('Atleta colocado à venda. Propostas automáticas da IA ainda pendentes.')}catch(e){alert(e.message)}};
 const replay=document.createElement('button');replay.textContent='REVER ÚLTIMA APRESENTAÇÃO';replay.onclick=()=>{const o=[...engine.state.offers].reverse().find(x=>x.status==='completed');if(o)window.dispatchEvent(new CustomEvent('mini-career-signing',{detail:{offerId:o.id,replay:true}}));else alert('Nenhuma contratação concluída nesta carreira.')};$('careerContent').appendChild(replay);
 $('careerExport').onclick=()=>{try{const a=document.createElement('a'),blob=new Blob([engine.export()],{type:'application/json'});const url=URL.createObjectURL(blob);a.href=url;a.download='mini-fc27-carreira.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){alert(e.message)}};
 $('careerImport').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{engine.import(await file.text());startView()}catch(err){alert('Importação falhou: '+err.message)}};
 $('careerClose').onclick=()=>{root.style.display='none';window.dispatchEvent(new Event('mini-career-close'))};
 try{engine.load()}catch(e){console.warn('Carreira inválida:',e.message)}
 startView();
 return {open(){root.style.display='flex';render()},engine};
}
