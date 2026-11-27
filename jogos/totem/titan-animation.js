/* v10.3.16 — isolated Titan presentation. No combat or save state owned here. */
(()=>{
'use strict';
let canvas,ctx,image,ready=false,frame=0,mode='idle',started=0,active=false,impactPoint=null;
let lastCell=0,previousCell=0,poseChanged=0,rig=null,rage=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const atlas=new Image(),background=new Image();
function load(im,src){return new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=src;});}
function loadAtlas(){
 if(typeof location==='undefined'||location.protocol!=='file:')return load(atlas,'img/titan-states.png');
 return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='img/titan-atlas-data.js';s.onload=()=>load(atlas,window.TITAN_ATLAS_DATA).then(resolve,reject);s.onerror=reject;document.head.appendChild(s);});
}
Promise.all([loadAtlas(),load(background,'img/titan-background.webp')]).then(()=>{image=atlas;rig=window.TitanRig?.create(image);ready=true;if(active)mount();}).catch(error=>console.warn('Titã: arte original mantida por falha no carregamento.',error));
function mount(){
 const field=document.querySelector('.battle-field'),overlay=document.getElementById('boss-overlay');if(!field||!ready)return;
 if(!canvas){canvas=document.createElement('canvas');canvas.id='titan-sprite';canvas.setAttribute('aria-hidden','true');ctx=canvas.getContext('2d');field.appendChild(canvas);}
 overlay.dataset.titanSprites='ready';canvas.hidden=false;cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);
}
function play(next){if(!active)return;mode=next;started=performance.now();if(next==='hand'||next==='meteor'){
 const f=canvas?.parentElement.getBoundingClientRect(),t=document.getElementById('boss-tower')?.getBoundingClientRect();
 impactPoint=f?{x:f.width/2,y:t&&t.height>0?t.top-f.top+Math.min(20,t.height*.25):f.height*.82}:null;
}}
function draw(now){
 if(!active||!canvas)return;
 const ov=document.getElementById('boss-overlay');
 if(!ov.hidden&&!document.hidden){
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(2,devicePixelRatio||1);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const t=now-started;let cell=0,dx=0,dy=0,scale=1,rotation=0;
 let dw=Math.min(w*.92,h*.85),dh=dw*4/3,x=w/2,y=h*.43;
 if(mode==='idle'&&!reduced.matches){dy=Math.sin(now/1000*.8)*1.5;}
 if(mode==='idle'){cell=0; /* One anchored drawing: no frame-to-frame jitter. */ }
 else if(mode==='defeat'){cell=11;const p=Math.min(1,t/1700);dy=p*35;scale=1-p*.14;rotation=reduced.matches?0:p*.06;}
 else if(mode==='hurt'){cell=t<120?8:t<420?9:t<700?10:11;dx=reduced.matches?0:-Math.sin(Math.min(1,t/1100)*Math.PI)*3;rotation=reduced.matches?0:-Math.sin(Math.min(1,t/1100)*Math.PI)*.009;if(t>1100)play('idle');}
 else {const hitAt=mode==='meteor'?3300:3100;cell=t<1000?4:t<hitAt-260?5:t<hitAt+320?6:7;
 const reach=Math.max(0,Math.min(1,(t-(hitAt-500))/500));const recover=Math.max(0,Math.min(1,(t-hitAt-320)/900));
 const amount=reach*(1-recover);if(impactPoint){dy=(impactPoint.y-(y+dh*.34))*amount;dx=(impactPoint.x-x)*amount;}scale=1+amount*.045;if(t>hitAt+1350)play('idle');}
 drawTension(now,w,h,x,y,dw,dh,t);
 if(mode==='defeat')ctx.globalAlpha=Math.max(0,1-t/1700);else if(ov.classList.contains('victory'))ctx.globalAlpha=.3;else ctx.globalAlpha=1;
 ctx.save();if(mode==='hurt'&&t<160)ctx.filter='brightness(1.4)';ctx.translate(x+dx,y+dy);ctx.rotate(rotation);ctx.scale(scale,scale);
 const sw=image.width/4,sh=image.height/3;
 if(lastCell!==cell){previousCell=lastCell;lastCell=cell;poseChanged=now;}
 const blend=reduced.matches?1:Math.min(1,(now-poseChanged)/140);
 const opacity=ctx.globalAlpha;
 function paint(index,alpha){
  if(alpha<=0)return;ctx.globalAlpha=opacity*alpha;
  const sx=(index%4)*sw,sy=Math.floor(index/4)*sh;
  if(mode==='idle'&&index===0){
   if(rig&&!reduced.matches){const pose=rig.render(now,rage);ctx.drawImage(pose,-dw/2-dw*10/268,-dh/2-dh*10/364,dw*288/268,dh*384/364);}
   else{const breath=reduced.matches?0:(1-Math.cos(now/4400*Math.PI*2))*.014;const width=dw*(1+breath),height=dh*(1+breath*.7);ctx.drawImage(image,sx,sy,sw,sh,-width/2,dh/2-height,width,height);}
  }else ctx.drawImage(image,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);
 }
 if(blend<1)paint(previousCell,1-blend);paint(cell,blend);ctx.restore();
 }
 frame=requestAnimationFrame(draw);
}
function drawTension(now,w,h,x,y,dw,dh,t){
 const attacking=mode==='hand'||mode==='meteor';
 if(!attacking)return;
 const hitAt=mode==='meteor'?3300:3100,p=Math.min(1,t/hitAt);
 if(t>hitAt)return;
 const target=impactPoint||{x:w/2,y:h*.82};
 ctx.save();ctx.globalAlpha=reduced.matches?.35:.18+p*.48;
 ctx.strokeStyle='#ffc879';ctx.lineWidth=1.5;ctx.translate(target.x,target.y);
 // Converging rings telegraph exactly where the hit is headed.
 for(let i=0;i<2;i++){const r=18+(1-p)*(40+i*24);ctx.beginPath();ctx.ellipse(0,0,r,r*.28,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
 if(reduced.matches)return;
 ctx.save();
 // Sparse rising stone chips; only the special sends stones down onto the tower.
 for(let i=0;i<9;i++){
  const cycle=(t/1450+i*.117)%1;
  let px=x+(i%2?-1:1)*(dw*.31+Math.sin(i)*12),py=y+dh*.18-cycle*60;
  if(mode==='meteor'&&t>hitAt-900){const f=Math.min(1,(t-hitAt+900)/(900+i*15));px=target.x+(i-4)*31*(1-f);py=target.y-h*.65*(1-f);}
  const sz=3+i%3;ctx.globalAlpha=.3+p*.55;ctx.fillStyle=i%3?'#79716a':'#e0b47a';ctx.save();ctx.translate(px,py);ctx.rotate(i+cycle);ctx.fillRect(-sz/2,-sz/2,sz,sz*1.25);ctx.restore();
 }
 ctx.restore();
}
function setState(state={}){
 if(!active)return;rage=state.health<=.35&&!state.victory?1:0;
 document.getElementById('boss-overlay')?.classList.toggle('titan-enraged',!!rage);
}
function impact(){
 if(!active)return;const field=document.querySelector('.battle-field');if(!field)return;
 const fr=field.getBoundingClientRect(),tr=document.getElementById('boss-tower')?.getBoundingClientRect();
 const x=fr.width/2,y=tr&&tr.height?tr.top-fr.top+Math.min(20,tr.height*.25):fr.height*.82;
 const burst=document.createElement('div');burst.className='titan-rock-impact';burst.style.left=x+'px';burst.style.top=y+'px';burst.setAttribute('aria-hidden','true');
 for(let i=0;i<30;i++){const p=document.createElement('i');p.className=i<18?'rock':'spark';const a=i*2.399; p.style.cssText='--dx:'+Math.cos(a)*(45+i*4)+'px;--dy:'+(-45-Math.abs(Math.sin(a))*125)+'px;--spin:'+(i*59)+'deg;--size:'+(i<18?7+i%5*3:3)+'px';burst.appendChild(p);}field.appendChild(burst);setTimeout(()=>burst.remove(),1500);
 const tower=document.getElementById('boss-tower');tower?.classList.remove('hit');if(tower){void tower.offsetWidth;tower.classList.add('hit');setTimeout(()=>tower.classList.remove('hit'),450);}
}
window.TitanAnimation={setBoss(id){active=id==='titan';rage=0;document.getElementById('boss-overlay')?.classList.remove('titan-enraged');lastCell=previousCell=0;poseChanged=-1000;mode='idle';started=performance.now();cancelAnimationFrame(frame);delete document.getElementById('boss-overlay').dataset.titanSprites;if(canvas)canvas.hidden=true;if(active)mount();},play,impact,setState,reset(){rage=0;document.getElementById('boss-overlay')?.classList.remove('titan-enraged');play('idle');document.querySelectorAll('.titan-rock-impact').forEach(e=>e.remove());}};
})();
