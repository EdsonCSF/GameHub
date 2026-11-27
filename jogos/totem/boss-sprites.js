/* Totem Ascension v10.3.11 — atlas coordinates use the unmodified 1458×1536 sheets.
   Excludes the panel frames. Dark panel mattes are removed once at load time.
   Exports the same crop routine to Node for asset verification. */
(function(root){
'use strict';
const ATLAS={
 serpent:{file:'boss_atks1.webp',rects:[[24,29,126,335],[410,30,83,335],[25,408,130,270],[390,410,104,270]],top:57,width:27,height:37},
 storm:{file:'boss_atks1.webp',rects:[[543,29,85,338],[830,29,84,338],[543,408,85,272],[830,408,84,272]],top:55,width:29,height:38},
 wind:{file:'boss_atks1.webp',rects:[[963,30,84,335],[1325,30,107,335],[964,408,122,272],[1325,408,108,272]],top:59,width:28,height:37},
 alien:{file:'boss_atks1.webp',rects:[[27,739,177,324],[528,739,174,324],[27,1106,178,346],[528,1106,174,346]],top:47,width:32,height:42,arms:4},
 titan:{file:'boss_atks1.webp',rects:[[759,740,131,324],[1238,740,192,324],[759,1107,153,345],[1223,1107,209,345]],top:54,width:31,height:38},
 pixel:{file:'boss_atks.webp',rects:[[24,23,166,207],[534,23,166,207],[25,268,165,182],[534,268,166,182]],top:55,width:29,height:35},
 death:{file:'boss_atks.webp',rects:[[758,23,158,207],[1238,23,193,207],[758,268,158,182],[1238,268,193,182]],top:56,width:28,height:36},
 doll:{file:'boss_atks.webp',rects:[[25,506,159,194],[541,506,159,194],[25,745,159,189],[541,745,159,189]],top:55,width:28,height:36},
 drama:{file:'boss_atks.webp',rects:[[758,508,145,205],[1237,508,193,205],[758,750,145,184],[1237,750,193,184]],top:58,width:28,height:33},
 forest:{file:'boss_atks.webp',rects:[[25,993,159,204],[534,993,166,204],[25,1238,159,262],[534,1238,166,262]],top:56,width:30,height:35},
 ghost:{file:'boss_atks.webp',rects:[[758,993,156,202],[1238,993,193,202],[758,1238,156,262],[1238,1238,193,262]],top:55,width:29,height:38}
};
function crop(image,rect,magic,createCanvas){
 const [x,y,w,h]=rect,canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
 ctx.drawImage(image,x,y,w,h,0,0,w,h);
 const pixels=ctx.getImageData(0,0,w,h),data=pixels.data,n=w*h;
 if(magic){
  for(let i=0;i<n;i++){const p=i*4,v=Math.max(data[p],data[p+1],data[p+2]);const edge=Math.min(i%w,w-1-i%w,Math.floor(i/w),h-1-Math.floor(i/w));data[p+3]=Math.round(255*Math.min(1,Math.max(0,(v-60)/100))*Math.min(1,edge/8));}
 }else{
  // Flood only background connected to the outside; keep enclosed dark armour solid.
  const visited=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
  const visit=i=>{if(i<0||i>=n||visited[i])return;visited[i]=1;const p=i*4;
   if(Math.max(data[p],data[p+1],data[p+2])<68){queue[tail++]=i;data[p+3]=0;}};
  for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x)}
  for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1)}
  while(head<tail){const i=queue[head++],x=i%w;if(x)visit(i-1);if(x<w-1)visit(i+1);visit(i-w);visit(i+w)}
  // Feather the immediate cut edge without reducing the limb's interior opacity.
  for(let i=0;i<n;i++){const p=i*4;if(!data[p+3])continue;const x=i%w;
   if((x&&data[p-1]===0)||(x<w-1&&data[p+7]===0)||(i>=w&&data[p-w*4+3]===0)||(i<n-w&&data[p+w*4+3]===0)){
    const v=Math.max(data[p],data[p+1],data[p+2]);data[p+3]=Math.max(80,Math.min(255,(v-40)*5));
   }
  }
 }
 ctx.putImageData(pixels,0,0);return canvas;
}
const images=new Map(),cache=new Map();let fallback;
function localCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function decode(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Não foi possível carregar '+src));im.src=src;});}
function loadImage(file){if(!images.has(file))images.set(file,decode('img/'+file));return images.get(file);}
function embedded(file){
 if(!fallback)fallback=new Promise((resolve,reject)=>{if(root.BOSS_ATLAS_DATA)return resolve();const s=document.createElement('script');s.src='img/boss-atlas-data.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});
 return fallback.then(()=>decode(root.BOSS_ATLAS_DATA[file]));
}
function load(id){
 if(cache.has(id))return cache.get(id);
 const cfg=ATLAS[id];if(!cfg)return Promise.reject(new Error('Boss sem tileset: '+id));
 const render=im=>cfg.rects.map((rect,i)=>crop(im,rect,i>1,localCanvas).toDataURL('image/png'));
 const result=loadImage(cfg.file).then(render).catch(()=>embedded(cfg.file).then(render));
 cache.set(id,result);result.catch(()=>cache.delete(id));return result;
}
root.BossSprites={ATLAS,crop,load};
if(typeof module!=='undefined')module.exports=root.BossSprites;
})(typeof window!=='undefined'?window:globalThis);
