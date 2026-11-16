/* MINI FC27 career market — offline gameplay prototype, fictional financial values.
   Existing club rosters remain source records; career changes are persisted separately. */
(()=>{
const key='mini-fc27-manager-v1';
let state=null,tab='market',selected=null;
const money=n=>'€ '+Math.round(n).toLocaleString('pt-BR');
const estimate=p=>Math.max(100000,Math.round((p.overall||p.rating||65)*125000));
const base=club=>({club:club.name,season:'2026/27',transferBudget:25000000,wageBudget:750000,
  rosters:Object.fromEntries(fcClubs.map(c=>[c.name,(c.roster||[]).map(p=>({...p}))])),
  history:[],watch:[],offers:[],contracts:{},listed:[],loans:[]});
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch(e){alert('Não foi possível salvar o progresso neste navegador.')} }
function load(){try{return JSON.parse(localStorage.getItem(key))}catch(e){return null}}
const root=document.createElement('section');root.id='miniCareerMarket';root.hidden=true;
root.style.cssText='position:fixed;inset:0;z-index:180;background:linear-gradient(130deg,#100a24,#332059 60%,#140c2b);color:#fff;font:13px Arial;overflow:auto;padding:12px;box-sizing:border-box';
root.innerHTML='<div style="display:flex;align-items:center;gap:10px;justify-content:space-between"><h2>CENTRAL DE TRANSFERÊNCIAS</h2><button id="careerExit">Voltar</button></div><div id="careerBalance"></div><nav id="careerTabs" style="display:flex;gap:7px;flex-wrap:wrap;margin:12px 0"></nav><div style="display:grid;grid-template-columns:minmax(240px,1.5fr) minmax(200px,1fr);gap:12px"><div><input id="careerSearch" placeholder="Pesquisar jogador ou clube" style="width:95%;padding:10px;background:#241943;color:white;border:1px solid #7461a4;border-radius:7px"/><div id="careerList" style="max-height:58vh;overflow:auto"></div></div><aside id="careerDetails" style="background:#ffffff13;border:1px solid #ffffff28;border-radius:10px;padding:12px"></aside></div><footer style="margin-top:12px;display:flex;gap:8px"><button id="careerExport">Exportar carreira</button><label style="padding:8px;background:#4c3978;border-radius:6px">Importar carreira <input id="careerImport" type="file" accept=".json,application/json" style="max-width:140px"/></label></footer><small>Economia fictícia para gameplay. Valores, salários e avaliações não são dados financeiros oficiais.</small>';
document.body.appendChild(root);
const $=id=>root.querySelector('#'+id);
const tabs=[['market','Mercado'],['watch','Lista de transferências'],['loans','Empréstimos'],['sell','Vender jogadores'],['history','Histórico']];
function allPlayers(){return fcClubs.flatMap(c=>(state.rosters[c.name]||[]).map((p,i)=>({club:c.name,p,i})))}
function render(){
 $('careerBalance').textContent=state.club+' · Temporada '+state.season+' · Transferências: '+money(state.transferBudget)+' · Salários semanais disponíveis: '+money(state.wageBudget);
 $('careerTabs').replaceChildren();tabs.forEach(([id,label])=>{const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:9px;background:'+(id===tab?'#8061ca':'#352753')+';color:white;border:0;border-radius:7px';b.onclick=()=>{tab=id;selected=null;render()};$('careerTabs').append(b)});
 const q=$('careerSearch').value.toLowerCase();$('careerSearch').style.display=tab==='history'?'none':'block';
 let rows=allPlayers();
 if(tab==='market')rows=rows.filter(x=>x.club!==state.club);
 if(tab==='sell')rows=rows.filter(x=>x.club===state.club);
 if(tab==='watch')rows=rows.filter(x=>state.watch.includes(x.club+'|'+x.p.name));
 if(tab==='loans')rows=rows.filter(x=>x.club!==state.club);
 if(tab==='history'){rows=[]}
 rows=rows.filter(x=>(x.p.name+' '+x.club+' '+x.p.position).toLowerCase().includes(q)).slice(0,350);
 $('careerList').replaceChildren();
 if(tab==='history'){state.history.slice().reverse().forEach(h=>{const d=document.createElement('p');d.textContent=h;$('careerList').append(d)})}
 else rows.forEach(x=>{const b=document.createElement('button');b.style.cssText='display:block;width:100%;padding:10px;text-align:left;background:#ffffff12;border:1px solid #ffffff1c;color:white;margin:4px 0;border-radius:7px';b.textContent=(x.p.position||'--')+' · '+x.p.name+' · '+x.club+' · '+money(estimate(x.p));b.onclick=()=>{selected=x;details()};$('careerList').append(b)});
 details();
}
function details(){
 const pane=$('careerDetails');pane.replaceChildren();if(!selected){pane.textContent='Selecione um atleta. Dados ausentes não são inventados.';return}
 const {club,p}=selected;const title=document.createElement('h3');title.textContent=p.name;pane.append(title);
 for(const [k,v] of Object.entries({'Clube':club,'Posição':p.position||'Não verificada','GER':p.overall??'Sem dados','Idade':p.age??'Sem dados','Nacionalidade':p.nationality??'Sem dados','Valor estimado':money(estimate(p))})){const line=document.createElement('p');line.textContent=k+': '+v;pane.append(line)}
 const action=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.style.cssText='display:block;margin:8px 0;padding:10px;background:#7356bb;color:white;border:0;border-radius:7px';b.onclick=fn;pane.append(b)};
 const identity=club+'|'+p.name;
 if(tab==='market'||tab==='watch'){
  action('Adicionar à lista',()=>{if(!state.watch.includes(identity))state.watch.push(identity);save();render()});
  action('NEGOCIAR',()=>openNegotiation(selected));
 }
 if(tab==='sell')action('COLOCAR À VENDA',()=>{if(!state.listed.includes(identity))state.listed.push(identity);state.history.push(p.name+' colocado à venda');save();render();alert('Jogador listado. Propostas de IA ainda não implementadas.')});
 if(tab==='loans')action('Observar empréstimo',()=>{state.loans.push(identity);save();alert('Interesse registrado. Contrato de empréstimo ainda não implementado.')});
}

/* Negociação em duas etapas; nenhuma transferência financeira antes da assinatura. */
const deal=document.createElement('section');deal.hidden=true;deal.id='miniNegotiation';
deal.style.cssText='position:fixed;inset:0;z-index:190;overflow:auto;padding:14px;box-sizing:border-box;color:white;font:14px Arial;background:linear-gradient(125deg,#07162e,#182e57 55%,#11152d)';
deal.innerHTML='<header style="display:flex;justify-content:space-between;align-items:center"><h2 id="dealTitle">NEGOCIAÇÃO</h2><button id="dealClose">ENCERRAR NEGOCIAÇÃO</button></header><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px"><section style="padding:14px;border-radius:16px;background:#ffffff12;border:1px solid #ffffff25"><h3>PROPOSTA</h3><div id="dealFields" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div><p id="dealTotals"></p><button id="dealSubmit" style="padding:12px;background:#55a8f4;border:0;border-radius:8px;font-weight:bold">FAZER PROPOSTA</button></section><section style="padding:14px;border-radius:16px;background:#ffffff12;border:1px solid #ffffff25"><h3 id="dealRepresentative">Representante do clube</h3><p id="dealPlayer"></p><label>Tensão: <meter id="dealTension" min="0" max="3" value="0"></meter></label><p id="dealMessage" style="min-height:75px;line-height:1.5"></p><div id="dealStatus"></div></section></div>';
document.body.appendChild(deal);
const D=id=>deal.querySelector('#'+id);
let negotiation=null;
const field=(id,label,value,min=0,max=999999999)=>{const wrap=document.createElement('label');wrap.textContent=label;wrap.style.cssText='display:flex;flex-direction:column;gap:5px';const input=document.createElement('input');input.id=id;input.type='number';input.min=min;input.max=max;input.step='1';input.value=value;input.style.cssText='padding:10px;min-width:0;width:100%;box-sizing:border-box;border:1px solid #8ba6ca;border-radius:8px;background:#101e3d;color:white';wrap.append(input);D('dealFields').append(wrap);return input};
function openNegotiation(entry){
 if(!entry||entry.club===state.club)return;
 negotiation={club:entry.club,name:entry.p.name,number:entry.p.number,phase:'club',tension:0,attempts:0,asking:Math.ceil(estimate(entry.p)*1.12),accepted:0};
 deal.hidden=false;root.hidden=true;drawDeal();
}
function drawDeal(){
 const n=negotiation;if(!n)return;
 const p=(state.rosters[n.club]||[]).find(x=>x.name===n.name&&x.number===n.number);
 if(!p){D('dealMessage').textContent='Jogador indisponível.';return}
 D('dealTitle').textContent=n.phase==='club'?'NEGOCIAR TRANSFERÊNCIA':'NEGOCIAR CONTRATO';
 D('dealRepresentative').textContent=n.phase==='club'?'Representante de '+n.club:'Representante do jogador';
 D('dealPlayer').textContent=p.name+' · '+(p.position||'Posição indisponível')+' · '+n.club+' · Valor estimado '+money(estimate(p));
 D('dealTension').value=n.tension;
 D('dealFields').replaceChildren();
 if(n.phase==='club'){
  field('dealAmount','Transferência (€)',n.counter||estimate(p));
  field('dealInstallments','Parcelas (1 a 4)',1,1,4);
  field('dealBonus','Bônus por desempenho (€)',0);
  field('dealSellOn','Futura venda (%)',0,0,50);
  D('dealMessage').textContent=n.message||'Estamos disponíveis para analisar uma proposta pelo atleta.';
  D('dealSubmit').textContent='FAZER PROPOSTA';
 }else{
  field('dealSalary','Salário semanal (€)',Math.ceil(estimate(p)/420));
  field('dealYears','Contrato (anos)',3,1,5);
  field('dealSigning','Bônus de assinatura (€)',0);
  field('dealGoalBonus','Bônus por gols (€)',0);
  D('dealMessage').textContent=n.message||'Vamos discutir salário e duração do contrato.';
  D('dealSubmit').textContent='PROPOR CONTRATO';
 }
 D('dealTotals').textContent='Disponível: '+money(state.transferBudget)+' em transferências · '+money(state.wageBudget)+'/semana em salários'+(n.accepted?' · Taxa acordada: '+money(n.accepted):'');
}
function fail(message){negotiation.message=message;drawDeal()}
D('dealSubmit').onclick=()=>{
 const n=negotiation;if(!n||n.tension>=3)return;
 const get=id=>Number(D(id)?.value);
 if(n.phase==='club'){
  const amount=get('dealAmount'),installments=get('dealInstallments'),bonus=get('dealBonus'),sellOn=get('dealSellOn');
  if(![amount,installments,bonus,sellOn].every(Number.isSafeInteger)||amount<=0||bonus<0||installments<1||installments>4||sellOn<0||sellOn>50)return fail('Revise os valores da proposta.');
  // Sem calendário de parcelas, reservar o custo integral evita orçamento ficticiamente infinito.
  if(amount+bonus>state.transferBudget)return fail('Orçamento insuficiente para garantir a proposta e seus bônus.');
  n.attempts++;
  const demand=Math.ceil(n.asking*(1+n.tension*.035));
  const effective=amount+bonus*.35+estimate((state.rosters[n.club]||[]).find(x=>x.name===n.name)||{})*sellOn/300;
  if(effective<demand*.72){n.tension=Math.min(3,n.tension+1);n.message=n.tension>=3?'Negociação encerrada pelo clube vendedor.':'A proposta está muito abaixo do esperado. Precisamos de '+money(demand)+'.';drawDeal();D('dealSubmit').disabled=n.tension>=3;return}
  if(effective<demand){n.tension=Math.min(3,n.tension+(n.attempts>2?1:0));n.counter=demand;n.message='Podemos conversar, mas pedimos uma contraproposta de '+money(demand)+'.';drawDeal();return}
  n.accepted=amount;n.bonus=bonus;n.installments=installments;n.sellOn=sellOn;n.phase='contract';n.tension=0;n.message='O clube aceitou. Agora precisamos do acordo com o jogador.';drawDeal();
 }else{
  const salary=get('dealSalary'),years=get('dealYears'),signing=get('dealSigning'),goalBonus=get('dealGoalBonus');
  if(![salary,years,signing,goalBonus].every(Number.isSafeInteger)||salary<=0||years<1||years>5||signing<0||goalBonus<0)return fail('Dados do contrato inválidos.');
  if(salary>state.wageBudget||n.accepted+n.bonus+signing>state.transferBudget)return fail('Orçamento insuficiente. Nenhum valor foi descontado.');
  const roster=state.rosters[n.club]||[],i=roster.findIndex(p=>p.name===n.name&&p.number===n.number);
  if(i<0)return fail('Jogador não está mais disponível.');
  const required=Math.ceil(estimate(roster[i])/500);
  if(salary<required){n.tension=Math.min(3,n.tension+1);n.message='O representante pede pelo menos '+money(required)+' por semana.';drawDeal();D('dealSubmit').disabled=n.tension>=3;return}
  const [signed]=roster.splice(i,1);state.rosters[state.club].push(signed);
  state.transferBudget-=n.accepted+n.bonus+signing;state.wageBudget-=salary;
  state.contracts[state.club+'|'+signed.name]={salary,years,signing,goalBonus,installments:n.installments,sellOn:n.sellOn};
  state.history.push(state.club+' contratou '+signed.name+' de '+n.club+' por '+money(n.accepted)+' + bônus de '+money(n.bonus));
  const presentation={player:{...signed},from:n.club,to:state.club,amount:n.accepted,years,color:fcClubs.find(c=>c.name===state.club)?.color||'#5a62a8'};
  state.presentations=state.presentations||[];state.presentations.push(presentation);
  save();deal.hidden=true;root.hidden=false;selected=null;render();
  const startPress=()=>{
   if(n.accepted<15000000)return;
   state.pressReputation=state.pressReputation||{morale:{},board:50,fans:50};
   window.miniStartPressConference?.(presentation,(delta,answer)=>{
    const reputation=state.pressReputation;
    reputation.morale[signed.name]=Math.max(0,Math.min(100,(reputation.morale[signed.name]??50)+delta.morale));
    reputation.board=Math.max(0,Math.min(100,reputation.board+delta.board));
    reputation.fans=Math.max(0,Math.min(100,reputation.fans+delta.fans));
    state.history.push('Coletiva: '+answer.question+' — '+answer.answer);
    save();
   });
  };
  window.miniShowSigningPresentation?.({...presentation,onFinish:startPress});
 }
};
D('dealClose').onclick=()=>{deal.hidden=true;root.hidden=false;negotiation=null;render()};
const replay=document.createElement('button');replay.textContent='REVER ÚLTIMA APRESENTAÇÃO';replay.style.cssText='padding:10px;background:#61479e;color:white;border:0;border-radius:8px';replay.onclick=()=>{const last=state?.presentations?.at(-1);if(last)window.miniShowSigningPresentation?.(last);else alert('Nenhuma contratação apresentada ainda.')};root.querySelector('footer').append(replay);
$('careerSearch').addEventListener('input',render);
$('careerExit').onclick=()=>{root.hidden=true;fcScreen('')};
$('careerExport').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mini-fc27-carreira.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('careerImport').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed||!fcClubs.some(c=>c.name===parsed.club)||!parsed.rosters||!Number.isFinite(parsed.transferBudget)||!Array.isArray(parsed.history))throw Error('Formato inválido');state=parsed;save();render()}catch(e){alert('Arquivo de carreira inválido')}};
window.miniCareerOpen=()=>{state=load();if(!state||!state.rosters){const options=fcClubs.filter(c=>c.roster?.length);const club=options[0];if(!club)return alert('Nenhum clube com elenco disponível');const name=prompt('Clube para iniciar carreira:\n'+options.map(c=>c.name).join(', '),club.name);const selectedClub=options.find(c=>c.name.toLowerCase()===String(name).toLowerCase());if(!selectedClub)return alert('Escolha um clube da lista');state=base(selectedClub);save()}root.hidden=false;render()};
window.miniCareerPressMatch=(context)=>{
 if(!state?.club)return false;
 state.pressReputation=state.pressReputation||{morale:{},board:50,fans:50,manager:50,lockerRoom:50};
 const apply=(delta,answer)=>{
  const r=state.pressReputation;
  r.board=Math.max(0,Math.min(100,r.board+delta.board));
  r.fans=Math.max(0,Math.min(100,r.fans+delta.fans));
  r.manager=Math.max(0,Math.min(100,(r.manager??50)+delta.board));
  r.lockerRoom=Math.max(0,Math.min(100,(r.lockerRoom??50)+delta.morale));
  for(const p of (state.rosters[state.club]||[]))r.morale[p.name]=Math.max(0,Math.min(100,(r.morale[p.name]??50)+delta.morale));
  state.history.push('Entrevista '+(context.type==='pre'?'pré-jogo':'pós-jogo')+': '+answer.question+' — '+answer.answer);
  save();
 };
 return window.miniPressMatchInterview?.(context,apply)||false;
};
window.miniCareerRosterFor=club=>state?.rosters?.[club]||null;
})();
