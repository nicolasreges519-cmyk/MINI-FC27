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
  action('FAZER PROPOSTA',()=>{
   if(club===state.club)return;
   const amount=Number(prompt('Proposta em euros (valor inteiro)',estimate(p)));
   if(!Number.isSafeInteger(amount)||amount<=0||amount>state.transferBudget)return alert('Proposta inválida ou orçamento insuficiente.');
   const min=estimate(p);if(amount<min*.85)return alert('Clube recusou: oferta abaixo do valor estimado.');
   if(amount<min*1.05)return alert('Contraproposta do clube: '+money(Math.ceil(min*1.05)));
   const salary=Number(prompt('Salário semanal oferecido (€)',Math.round(min/400)));
   if(!Number.isSafeInteger(salary)||salary<=0||salary>state.wageBudget)return alert('Salário inválido ou orçamento insuficiente.');
   const years=Number(prompt('Duração do contrato em anos (1 a 5)',3));
   if(!Number.isInteger(years)||years<1||years>5)return alert('Contrato inválido.');
   if(salary<min/600)return alert('Jogador pediu salário maior.');
   const seller=state.rosters[club],index=seller.findIndex(x=>x.name===p.name&&x.number===p.number);
   if(index<0)return alert('Atleta indisponível.');
   const [signed]=seller.splice(index,1);state.rosters[state.club].push(signed);
   state.transferBudget-=amount;state.wageBudget-=salary;
   state.contracts[state.club+'|'+signed.name]={salary,years};
   state.history.push(state.club+' contratou '+signed.name+' de '+club+' por '+money(amount));
   save();render();alert('Contratação concluída no modo carreira. Escalação será sincronizada ao selecionar o clube.');
  });
 }
 if(tab==='sell')action('COLOCAR À VENDA',()=>{if(!state.listed.includes(identity))state.listed.push(identity);state.history.push(p.name+' colocado à venda');save();render();alert('Jogador listado. Propostas de IA ainda não implementadas.')});
 if(tab==='loans')action('Observar empréstimo',()=>{state.loans.push(identity);save();alert('Interesse registrado. Contrato de empréstimo ainda não implementado.')});
}
$('careerSearch').addEventListener('input',render);
$('careerExit').onclick=()=>{root.hidden=true;fcScreen('')};
$('careerExport').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mini-fc27-carreira.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('careerImport').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed||!fcClubs.some(c=>c.name===parsed.club)||!parsed.rosters||!Number.isFinite(parsed.transferBudget)||!Array.isArray(parsed.history))throw Error('Formato inválido');state=parsed;save();render()}catch(e){alert('Arquivo de carreira inválido')}};
window.miniCareerOpen=()=>{state=load();if(!state||!state.rosters){const options=fcClubs.filter(c=>c.roster?.length);const club=options[0];if(!club)return alert('Nenhum clube com elenco disponível');const name=prompt('Clube para iniciar carreira:\n'+options.map(c=>c.name).join(', '),club.name);const selectedClub=options.find(c=>c.name.toLowerCase()===String(name).toLowerCase());if(!selectedClub)return alert('Escolha um clube da lista');state=base(selectedClub);save()}root.hidden=false;render()};
window.miniCareerRosterFor=club=>state?.rosters?.[club]||null;
})();
