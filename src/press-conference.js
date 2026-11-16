/* MINI FC27 — coletiva interativa original, com cena 3D leve e efeitos persistentes. */
(()=>{
const root=document.createElement('section');root.hidden=true;root.id='miniPressConference';
root.style.cssText='position:fixed;inset:0;z-index:230;background:#080e1e;color:white;font:14px Arial;overflow:auto';
root.innerHTML='<div style="position:relative;min-height:100dvh"><div id="pressCanvas" style="height:58dvh;min-height:180px"></div><div style="position:absolute;top:8px;left:12px;background:#071329bb;padding:8px;border-radius:8px">MINI FC27 · COLETIVA DE IMPRENSA</div><div style="position:absolute;top:8px;right:12px"><button id="pressSkip">PULAR COLETIVA</button></div><div style="padding:12px;background:#111a36"><h3 id="pressQuestion"></h3><div id="pressAnswers" style="display:flex;gap:8px;flex-wrap:wrap"></div><p id="pressFeedback" aria-live="polite"></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="pressAnswer">RESPONDER</button><button id="pressNext">PRÓXIMA PERGUNTA</button><button id="pressContinue">CONTINUAR CARREIRA</button></div></div></div>';
document.body.append(root);
const $=id=>root.querySelector('#'+id);
const questions=[
 {q:'Por que você decidiu contratar esse jogador?',a:['Acredito muito no potencial dele.','Foi uma decisão técnica e financeira.','Ele precisará demonstrar seu valor.']},
 {q:'O que espera dele nesta temporada?',a:['Espero uma temporada de grandes conquistas.','Vamos avaliar seu desempenho nos treinamentos.','Ele terá metas exigentes a cumprir.']},
 {q:'Ele será titular imediatamente?',a:['Terá oportunidades para mostrar seu futebol.','A escalação dependerá dos treinamentos.','Ele precisará conquistar seu espaço.']},
 {q:'Como pretende utilizar esse reforço?',a:['Será uma peça importante para nossa equipe.','Vamos estudar a melhor função para ele.','Terá de se adaptar às exigências táticas.']}
];
let current=null,scene,camera,renderer,raf=0,start=0,figures=[],speaker=null,shirt=null,flash=null;
let activeQuestions=questions;
const mat=c=>new THREE.MeshLambertMaterial({color:c});
function mesh(parent,geo,m,x,y,z){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o}
function human(x,z,shirtColor){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const skin=mat(0xc99375),cloth=mat(shirtColor);
 mesh(g,new THREE.CapsuleGeometry(.25,.42,4,8),cloth,0,1.25,0);
 const head=mesh(g,new THREE.SphereGeometry(.19,10,8),skin,0,1.88,0);
 const mouth=mesh(g,new THREE.BoxGeometry(.09,.014,.014),mat(0x733d3b),0,1.79,.183);
 const arms=[];
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.34,1.55,0);g.add(arm);mesh(arm,new THREE.CapsuleGeometry(.07,.35,3,6),skin,0,-.26,0);arms.push(arm);
 mesh(g,new THREE.CapsuleGeometry(.095,.45,3,7),mat(0x252735),side*.14,.52,0)}
 figures.push({g,head,mouth,arms});return g;
}
function cleanup(){cancelAnimationFrame(raf);if(scene)scene.traverse(o=>{o.geometry?.dispose?.();if(o.material?.dispose)o.material.dispose()});renderer?.dispose();renderer?.domElement?.remove();renderer=null;scene=null;figures=[]}
function build(){
 cleanup();scene=new THREE.Scene();scene.background=new THREE.Color(0x121b30);
 camera=new THREE.PerspectiveCamera(48,Math.max(1,$('pressCanvas').clientWidth)/Math.max(1,$('pressCanvas').clientHeight),.1,60);
 camera.position.set(0,2.4,7.7);camera.lookAt(0,1.3,0);
 renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.2));renderer.setSize($('pressCanvas').clientWidth,$('pressCanvas').clientHeight);$('pressCanvas').append(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xe5ecff,0x343b4b,2));
 const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(2,6,5);scene.add(key);
 const floor=mesh(scene,new THREE.BoxGeometry(13,.1,12),mat(0x222735),0,-.05,0);
 const backdrop=mesh(scene,new THREE.BoxGeometry(10,4,.2),mat(current.color||'#444c78'),0,2,-3);
 for(let x=-4;x<=4;x+=2)for(let y=1;y<4;y++){const badge=mesh(scene,new THREE.BoxGeometry(1.25,.25,.025),mat(0xe5e8f4),x,y,-2.86);}
 mesh(scene,new THREE.BoxGeometry(6,.16,1.25),mat(0x34364c),0,1.12,.35);
 for(const x of [-1.2,1.2]){mesh(scene,new THREE.CylinderGeometry(.025,.025,.5,6),mat(0x11131a),x,1.5,.48);mesh(scene,new THREE.SphereGeometry(.085,7,6),mat(0x151820),x,1.75,.48)}
 human(-1.3,-.5,0x293c62);speaker=human(1.3,-.5,current.color||'#576cb5');
 for(let i=0;i<7;i++)human((i-3)*1.25,3.1+(i%2)*.6,0x454954);
 shirt=new THREE.Group();scene.add(shirt);shirt.visible=false;
 mesh(shirt,new THREE.BoxGeometry(.9,.75,.08),mat(current.color||'#576cb5'),0,1.55,0);
 flash=new THREE.PointLight(0xffffff,0,10);flash.position.set(1,2.5,3);scene.add(flash);
 start=performance.now();animate(start);
}
function animate(now){
 if(root.hidden||!renderer)return;
 const t=(now-start)/1000,active=current?.phase==='questions';
 figures.forEach((f,i)=>{f.head.rotation.y=Math.sin(t*.8+i)*.08;f.mouth.scale.y=active&&i<2?1+Math.abs(Math.sin(t*7+i))*2:1;f.arms[0].rotation.x=Math.sin(t*1.3+i)*.08;f.arms[1].rotation.x=-Math.sin(t*1.2+i)*.08;});
 if(current?.phase==='photo'){shirt.visible=true;shirt.position.set(1.3,1.1+Math.sin(t)*.04,.55);speaker.position.y=Math.min(.5,(now-current.photoAt)/1200*.5);flash.intensity=(Math.floor(t*3)%3===0)?2.5:0;}else{shirt.visible=false;flash.intensity=0;}
 renderer.render(scene,camera);raf=requestAnimationFrame(animate);
}
function showQuestion(){
 const q=activeQuestions[current.index];$('pressAnswers').replaceChildren();$('pressQuestion').textContent='Jornalista: '+q.q;
 q.a.forEach((answer,i)=>{const b=document.createElement('button');b.textContent=answer;b.style.cssText='padding:10px;min-height:42px;border:1px solid #637cb5;border-radius:8px;background:'+(current.choice===i?'#6487ce':'#263657')+';color:white';b.onclick=()=>{current.choice=i;showQuestion()};$('pressAnswers').append(b)});
 $('pressFeedback').textContent=current.answered?'Resposta registrada.':'Escolha uma resposta e toque em RESPONDER.';
 $('pressAnswer').disabled=current.answered;$('pressNext').disabled=!current.answered;
}
function conclude(){
 if(current?.phase==='questions'&&!current.answered)return;
 if(current?.phase==='questions'&&current.index<activeQuestions.length-1){current.index++;current.choice=null;current.answered=false;showQuestion();return}
 current.phase='photo';current.photoAt=performance.now();$('pressQuestion').textContent='NOVO REFORÇO CONFIRMADO! '+current.player.name;
 $('pressAnswers').replaceChildren();$('pressFeedback').textContent='Fotografias oficiais e apresentação da camisa.';
 $('pressAnswer').disabled=true;$('pressNext').disabled=true;
}
function finish(){root.hidden=true;cleanup();current=null}
$('pressAnswer').onclick=()=>{
 if(!current||current.answered||current.choice===null)return;
 current.answered=true;
 const delta=[{morale:3,board:1,fans:2},{morale:0,board:2,fans:0},{morale:-2,board:1,fans:-1}][current.choice];
 current.apply?.(delta,{question:activeQuestions[current.index].q,answer:activeQuestions[current.index].a[current.choice]});
 showQuestion();
};
$('pressNext').onclick=conclude;$('pressSkip').onclick=finish;$('pressContinue').onclick=finish;
window.miniStartPressConference=(data,apply,customQuestions)=>{
 activeQuestions=Array.isArray(customQuestions)&&customQuestions.length?customQuestions:questions;
 current={...data,apply,index:0,choice:null,answered:false,phase:'questions'};root.hidden=false;showQuestion();build();
};
const triple=(q,a,b,c)=>({q,a:[a,b,c]});
window.miniPressMatchInterview=(context,apply)=>{
 const type=context?.type||'pre',home=context?.home||'Mandante',away=context?.away||'Visitante';
 let qs;
 if(type==='pre'){
  qs=[
   triple('Qual será sua estratégia para enfrentar '+away+'?','Vamos buscar o ataque desde o início.','Vamos manter o equilíbrio.','Precisamos ser mais agressivos na marcação.'),
   triple('Você pretende mudar a escalação?','Confio no nosso elenco.','Decidiremos após o aquecimento.','Ninguém tem vaga garantida.'),
   triple('Seu time está preparado para essa partida?','Estamos muito confiantes.','A preparação foi adequada.','Precisamos demonstrar mais em campo.')
  ];
 }else{
  const goalsHome=Number(context?.goalsHome),goalsAway=Number(context?.goalsAway);
  if(!Number.isFinite(goalsHome)||!Number.isFinite(goalsAway))return false;
  const result=goalsHome>goalsAway?'vitória':goalsHome<goalsAway?'derrota':'empate';
  qs=result==='vitória'?[
   triple('Como avalia a vitória por '+goalsHome+' a '+goalsAway+'?','Os jogadores merecem elogios.','Foi um bom trabalho coletivo.','Ainda temos muito a melhorar.'),
   triple('O que espera da próxima partida?','Queremos manter o ritmo.','Vamos preparar o próximo desafio.','Exigirei ainda mais da equipe.')
  ]:result==='derrota'?[
   triple('O que deu errado na derrota por '+goalsHome+' a '+goalsAway+'?','Confio na recuperação do grupo.','Vamos analisar nossos erros.','Precisamos de uma reação imediata.'),
   triple('Você mudará a escalação?','O elenco merece confiança.','Vamos avaliar as opções.','Alguns atletas precisarão melhorar.')
  ]:[
   triple('O que faltou no empate por '+goalsHome+' a '+goalsAway+'?','A equipe mostrou dedicação.','Faltou aproveitar as chances.','Precisamos ser mais eficientes.'),
   triple('Como avalia o desempenho coletivo?','Tivemos bons momentos.','Foi uma atuação equilibrada.','Espero mais concentração.')
  ];
 }
 const data={player:{name:type==='pre'?'Técnico de '+home:'Técnico de '+home},color:context.color||'#425d9a'};
 window.miniStartPressConference(data,apply,qs);return true;
};

})();
