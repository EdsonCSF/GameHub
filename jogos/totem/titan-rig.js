/* v10.3.16 — continuous inverse skin deformation. One stable pose, no cutout joints. */
(()=>{
'use strict';
const W=288,H=384,N=W*H;
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
function create(image){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const c=canvas.getContext('2d',{willReadFrequently:true});
 c.drawImage(image,0,0,image.width/4,image.height/3,10,10,W-20,H-20);
 let source;try{source=c.getImageData(0,0,W,H).data;}catch(e){return null;}
 const out=c.createImageData(W,H),data=out.data;
 const head=new Float32Array(N),left=new Float32Array(N),right=new Float32Array(N),chest=new Float32Array(N);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x,u=x/W,v=y/H;
  head[i]=(1-smooth(.30,.48,v))*(1-smooth(.23,.43,Math.abs(u-.5)));
  left[i]=(1-smooth(.22,.42,u))*smooth(.31,.54,v);
  right[i]=smooth(.58,.78,u)*smooth(.31,.54,v);
  chest[i]=Math.exp(-Math.pow((v-.53)/.23,2))*(1-smooth(.18,.42,Math.abs(u-.5)));
 }
 let last=-Infinity;
 function render(now,rage=0){
  if(now-last<40&&now>=last)return canvas;last=now;
  const t=now/1000,speed=1+rage*.2,phase=t*1.43*speed;
  const inhale=.5-.5*Math.cos(phase),hx=Math.sin(t*.88)*2.7,hy=Math.sin(phase-.65)*1.4,ha=Math.sin(t*.73)*.022;
  const la=Math.sin(t*1.06+.6)*.055,ra=Math.sin(t*.94+2.1)*.048;
  const breath=.033*inhale*(1+rage*.22),lift=inhale*2.7;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x,k=i*4,h=head[i],l=left[i],r=right[i],b=chest[i];
   const dx=h*(hx-ha*(y-H*.34))+l*(-la*(y-H*.43))+r*(-ra*(y-H*.43))+(x-W*.5)*breath*b;
   const dy=h*(hy+ha*(x-W*.5))+l*(la*(x-W*.24))+r*(ra*(x-W*.76))-lift*b;
   const sx=x-dx,sy=y-dy,ix=sx|0,iy=sy|0;
   if(sx<0||sy<0||ix>=W-1||iy>=H-1){data[k]=data[k+1]=data[k+2]=data[k+3]=0;continue;}
   const fx=sx-ix,fy=sy-iy,a=(1-fx)*(1-fy),bb=fx*(1-fy),cc=(1-fx)*fy,d=fx*fy,j=(iy*W+ix)*4;
   const aa=source[j+3]*a,ab=source[j+7]*bb,ac=source[j+W*4+3]*cc,ad=source[j+W*4+7]*d,alpha=aa+ab+ac+ad;
   data[k+3]=alpha;
   if(alpha>0){for(let q=0;q<3;q++)data[k+q]=(source[j+q]*aa+source[j+4+q]*ab+source[j+W*4+q]*ac+source[j+W*4+4+q]*ad)/alpha;}
   else data[k]=data[k+1]=data[k+2]=0;
  }
  c.putImageData(out,0,0);return canvas;
 }
 return {render};
}
window.TitanRig={create};
})();
