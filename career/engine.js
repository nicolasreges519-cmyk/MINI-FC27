// MINI FC27 — carreira técnico (v10.2). Dados financeiros editados pelo jogador = cenário personalizado, não oficiais.
const KEY='mini-fc27-career-v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const money=n=>Number.isFinite(+n)&&+n>=0?Math.round(+n):null;
const uid=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2,8);
export class CareerEngine{
 constructor(catalog){this.catalog=catalog;this.state=null}
 save(){if(!this.state)return;localStorage.setItem(KEY,JSON.stringify(this.state))}
 load(){const raw=localStorage.getItem(KEY);if(!raw)return false;const data=JSON.parse(raw);this.validate(data);this.state=data;return true}
 validate(s){if(!s||s.schema!==1||!s.clubId||!s.clubs||!s.players||!Array.isArray(s.history)||!Array.isArray(s.offers))throw Error('Save inválido');for(const c of Object.values(s.clubs)){if(money(c.transferBudget)===null||money(c.wageBudget)===null||money(c.wageCommitted)===null)throw Error('Saldo inválido')}}
 start(clubId,transferBudget,wageBudget){
  if(!this.catalog.some(c=>c.id===clubId))throw Error('Clube não encontrado');
  if(money(transferBudget)===null||money(wageBudget)===null)throw Error('Defina os orçamentos do cenário');
  const clubs={},players={};
  for(const club of this.catalog){
   clubs[club.id]={id:club.id,transferBudget:club.id===clubId?money(transferBudget):0,wageBudget:club.id===clubId?money(wageBudget):0,wageCommitted:0,roster:[]};
   if(!club.rosterVerified)continue;
   for(const p of club.roster||[]){
    if(!p.id||!p.name||!Number.isFinite(+p.overall)||!Number.isFinite(+p.marketValue)||!Number.isFinite(+p.weeklyWage))continue;
    const id=club.id+':'+p.id;if(players[id])continue;
    players[id]={...clone(p),id,clubId:club.id};clubs[club.id].roster.push(id);
    clubs[club.id].wageCommitted+=money(p.weeklyWage)||0;
   }
  }
  this.state={schema:1,season:'2026/27',clubId,clubs,players,offers:[],history:[],loans:[],rules:{windowOpen:true},createdAt:new Date().toISOString()};
  this.save();return this.state;
 }
 current(){if(!this.state)throw Error('Inicie ou carregue uma carreira');return this.state}
 setWindow(open){this.current().rules.windowOpen=!!open;this.save()}
 player(id){const p=this.current().players[id];if(!p)throw Error('Jogador não encontrado');return p}
 club(id){const c=this.current().clubs[id];if(!c)throw Error('Clube não encontrado');return c}
 offer({playerId,fromClubId,toClubId,fee,weeklyWage,years,signingBonus=0}){
  const s=this.current(),p=this.player(playerId),buyer=this.club(toClubId),seller=this.club(fromClubId);
  if(fromClubId===toClubId||p.clubId!==fromClubId)throw Error('Clubes ou vínculo inválidos');
  if(toClubId!==s.clubId)throw Error('Propostas da IA ainda não implementadas');
  if(!s.rules.windowOpen)throw Error('Janela fechada para registro');
  for(const n of [fee,weeklyWage,signingBonus])if(money(n)===null)throw Error('Valor inválido');
  if(!Number.isInteger(+years)||+years<1||+years>5)throw Error('Duração inválida');
  if(buyer.transferBudget<money(fee)+money(signingBonus))throw Error('Orçamento de transferência insuficiente');
  if(buyer.wageBudget-buyer.wageCommitted<money(weeklyWage))throw Error('Orçamento salarial insuficiente');
  if(s.offers.some(o=>o.playerId===playerId&&o.status==='pending'))throw Error('Já existe uma proposta pendente');
  const o={id:uid(),playerId,fromClubId,toClubId,fee:money(fee),weeklyWage:money(weeklyWage),years:+years,signingBonus:money(signingBonus),status:'pending',createdAt:new Date().toISOString()};
  s.offers.push(o);this.save();return o;
 }
 decide(id,accept){
  const s=this.current(),o=s.offers.find(o=>o.id===id);if(!o||o.status!=='pending')throw Error('Proposta indisponível');
  // Aceitação automatizada experimental e transparente, baseada em valor; não simula uma negociação real com agente.
  if(!accept){o.status='rejected';this.save();return o}
  const p=this.player(o.playerId);
  if(o.fee<Math.round((+p.marketValue||0)*.9)){o.status='counter';o.counterFee=Math.round((+p.marketValue||0)*1.05);this.save();return o}
  o.status='clubAccepted';this.save();return o;
 }
 sign(id,accepted){
  const s=this.current(),o=s.offers.find(o=>o.id===id);if(!o||o.status!=='clubAccepted')throw Error('Clube ainda não aceitou');
  if(!accepted){o.status='playerRejected';this.save();return o}
  const p=this.player(o.playerId),buyer=this.club(o.toClubId),seller=this.club(o.fromClubId);
  if(!s.rules.windowOpen)throw Error('Janela fechada');
  if(p.clubId!==o.fromClubId)throw Error('Jogador mudou de clube');
  if(buyer.transferBudget<o.fee+o.signingBonus||buyer.wageBudget-buyer.wageCommitted<o.weeklyWage)throw Error('Saldo insuficiente');
  buyer.transferBudget-=o.fee+o.signingBonus;seller.transferBudget+=o.fee;
  seller.wageCommitted=Math.max(0,seller.wageCommitted-(money(p.weeklyWage)||0));buyer.wageCommitted+=o.weeklyWage;
  seller.roster=seller.roster.filter(x=>x!==p.id);buyer.roster.push(p.id);
  p.clubId=o.toClubId;p.weeklyWage=o.weeklyWage;p.contractYears=o.years;
  o.status='completed';s.history.push({type:'transfer',offerId:id,playerId:p.id,from:o.fromClubId,to:o.toClubId,fee:o.fee,date:new Date().toISOString()});
  this.save();return o;
 }
 listForSale(playerId){const p=this.player(playerId);if(p.clubId!==this.current().clubId)throw Error('Não pertence ao clube');p.listed=true;this.save()}
 credit(amount,reason){if(money(amount)===null||!reason)throw Error('Receita inválida');const s=this.current();this.club(s.clubId).transferBudget+=money(amount);s.history.push({type:'revenue',amount:money(amount),reason,date:new Date().toISOString()});this.save()}
 debit(amount,reason){const s=this.current(),c=this.club(s.clubId);if(money(amount)===null||c.transferBudget<money(amount)||!reason)throw Error('Despesa inválida');c.transferBudget-=money(amount);s.history.push({type:'expense',amount:money(amount),reason,date:new Date().toISOString()});this.save()}
 export(){return JSON.stringify(this.current(),null,2)}
 import(json){const s=JSON.parse(json);this.validate(s);this.state=s;this.save()}
}
