/* MINI FC27 — apresentação 3D original, leve, com etapas cinematográficas. */
(()=>{
const screen=document.createElement('div');screen.id='miniSigningPresentation';screen.hidden=true;
screen.style.cssText='position:fixed;inset:0;z-index:220;background:#060b18;color:white;font:14px Arial;overflow:hidden';
screen.innerHTML='<div id="signStage" style="position:absolute;inset:0"></div><div style="position:absolute;left:3%;bottom:6%;max-width:70%;background:#071127cc;padding:15px;border-radius:12px"><strong style="color:#c3ff59">NOVO REFORÇO CONFIRMADO!</strong><h2 id="signName"></h2><div id="signDetails"></div><p id="signCaption"></p></div><div style="position:absolute;right:3%;top:4%;display:flex;gap:8px"><button id="signReplay" style="padding:10px">RECOMEÇAR</button><button id="signSkip" style="padding:10px">PULAR APRESENTAÇÃO</button></div>';
document.body.appendChild(screen);
const $=id=>screen.querySelector('#'+id);
let scene,camera,renderer,player,shirt,clock,frame=0,raf=0,entry=null,lights=[],crowd=[];
const stages=['Chegada ao estádio','Entrada no vestiário','Novo uniforme','Apresentação à imprensa','Fotografias oficiais','Entrada no gramado'];
function dispose(){cancelAnimationFrame(raf);if(renderer){renderer.dispose();renderer.domElement.remove();renderer=null;}if(scene)scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&o.material.dispose)o.material.dispose()});scene=null}
function show(data){
 dispose();entry=data;screen.hidden=false;frame=0;
 scene=new THREE.Scene();scene.background=new THREE.Color('#101b2e');
 camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);
 renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));renderer.setSize(innerWidth,innerHeight);$('signStage').append(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xddeeff,0x35432b,2));
 const spot=new THREE.DirectionalLight(0xffffff,2);spot.position.set(3,7,5);scene.add(spot);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(30,24),new THREE.MeshLambertMaterial({color:0x254a38}));ground.rotation.x=-Math.PI/2;scene.add(ground);
 const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.8});
 const skin=material(0xb88969),kit=material(data.color||'#5555aa'),dark=material(0x18202a),hair=material(0x282020);
 const part=(parent,geometry,mat,x,y,z)=>{const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m};
 player=new THREE.Group();scene.add(player);
 part(player,new THREE.CapsuleGeometry(.42,.65,5,12),kit,0,1.62,0);
 part(player,new THREE.SphereGeometry(.26,14,12),skin,0,2.54,0);
 part(player,new THREE.SphereGeometry(.26,12,9),hair,0,2.69,.02).scale.y=.35;
 for(const side of [-1,1]){
  part(player,new THREE.CapsuleGeometry(.12,.52,4,8),skin,side*.55,1.65,0);
  part(player,new THREE.CapsuleGeometry(.16,.72,4,9),dark,side*.2,.63,0);
  part(player,new THREE.BoxGeometry(.29,.16,.48),dark,side*.2,.1,-.13);
 }
 shirt=new THREE.Group();scene.add(shirt);
 const jersey=part(shirt,new THREE.BoxGeometry(.9,.8,.08),kit,0,1.8,0);
 part(shirt,new THREE.BoxGeometry(.26,.32,.08),kit,-.56,1.98,0);
 part(shirt,new THREE.BoxGeometry(.26,.32,.08),kit,.56,1.98,0);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 36px Arial';ctx.fillText(data.player.name.slice(0,20),256,90);ctx.font='bold 100px Arial';ctx.fillText(String(data.player.number||9),256,200);
 const texture=new THREE.CanvasTexture(canvas);part(shirt,new THREE.PlaneGeometry(.82,.52),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}),0,1.85,.052);
 for(let i=0;i<18;i++){const spectator=new THREE.Mesh(new THREE.BoxGeometry(.3,.7,.3),material(i%2?data.color||'#5544aa':'#cccccc'));spectator.position.set((i-9)*.7,.5,-8);scene.add(spectator);crowd.push(spectator)}
 $('signName').textContent=data.player.name;$('signDetails').textContent=[data.from+' → '+data.to,data.player.position||'Posição indisponível','Idade: '+(data.player.age??'não informada'),'GER: '+(data.player.overall??'não informado'),'Valor: € '+Math.round(data.amount).toLocaleString('pt-BR'),'Contrato: '+data.years+' anos'].join(' · ');
 clock=performance.now();animate(clock);
}
function animate(now){
 if(screen.hidden||!renderer)return;
 const t=(now-clock)/1000,stage=Math.min(5,Math.floor(t/4));frame=stage;
 $('signCaption').textContent=stages[stage];
 scene.background.set(stage===1?'#171825':stage>=5?'#223f5b':'#101b2e');
 ground.material.color.set(stage===1?'#353343':stage>=5?'#2b6937':'#283747');
 const step=t-stage*4;
 player.position.x=stage===0?-3+step*.75:stage===1?-1+step*.25:0;
 player.position.y=stage>=5?Math.abs(Math.sin(t*2))*.06:0;
 player.rotation.y=stage===3||stage===4?Math.sin(t*.5)*.4:Math.PI+Math.sin(t*.8)*.12;
 shirt.visible=stage===3||stage===4;
 shirt.position.set(0,Math.sin(t*1.3)*.06,stage===3?1:1.2);
 camera.position.set(stage===2?1.2:stage===4?1.5:3,stage===2?2.3:2.6,stage===2?4:stage===4?4:6);
 camera.lookAt(0,1.5,0);
 for(let i=0;i<crowd.length;i++)crowd[i].position.y=.5+(stage===5?Math.abs(Math.sin(t*3+i))*.25:0);
 renderer.render(scene,camera);
 if(t>=24){finish();return}
 raf=requestAnimationFrame(animate);
}
function finish(){screen.hidden=true;dispose()}
$('signSkip').onclick=finish;$('signReplay').onclick=()=>{if(entry)show(entry)};
window.miniShowSigningPresentation=show;
})();
