
/* Winter Camp v137 — corrected full PDF data and stamp. */
(function(){
'use strict';
const W=620,H=877,S=2;
const green='#087347',light='#edf5ef',ink='#192b21',muted='#65756b';
const font=(size=11,bold=false)=>`${bold?'bold ':''}${size}px Tahoma, Arial, sans-serif`;
function text(ctx,t,x,y,size=11,bold=false,color=ink,align='right'){
 ctx.font=font(size,bold);ctx.fillStyle=color;ctx.textAlign=align;ctx.direction='rtl';
 ctx.fillText(String(t||''),x,y);
}
function wrap(ctx,value,width,size=11,bold=false){
 ctx.font=font(size,bold);
 const lines=[];
 for(const paragraph of String(value||'').split(/\n/)){
  let line='';
  for(const word of paragraph.split(/\s+/).filter(Boolean)){
   const test=line?line+' '+word:word;
   if(ctx.measureText(test).width>width&&line){lines.push(line);line=word;}
   else line=test;
  }
  lines.push(line||' ');
 }
 return lines;
}
function box(ctx,x,y,w,h){ctx.strokeStyle='#cbdcd1';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);}
function field(ctx,x,y,w,label,value,h=44){
 box(ctx,x,y,w,h);
 text(ctx,label,x+w-9,y+13,9,false,muted);
 const lines=wrap(ctx,value,w-18,11,true).slice(0,3);
 lines.forEach((v,i)=>text(ctx,v,x+w-9,y+29+i*12,11,true));
}
async function loadImage(src){
 if(!src)return null;
 return new Promise(resolve=>{
  const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);
  img.src=src;
  if(img.complete&&img.naturalWidth)resolve(img);
 });
}
function imageContain(ctx,img,x,y,w,h){
 if(!img)return;
 const ratio=Math.min(w/img.width,h/img.height);
 const dw=img.width*ratio,dh=img.height*ratio;
 ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}
function read(el,selector){return el.querySelector(selector)?.textContent?.trim()||'';}
function pair(el,selector){
 return [...el.querySelectorAll(selector)].map(node=>({
  label:read(node,'small'),value:read(node,'strong')
 }));
}
function pdfFromJpeg(jpeg,w,h){
 const b64=jpeg.split(',')[1],bin=atob(b64),jpg=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)jpg[i]=bin.charCodeAt(i);
 const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
 function add(v){const bytes=typeof v==='string'?enc.encode(v):v;parts.push(bytes);length+=bytes.length;}
 add('%PDF-1.4\n');
 function obj(n,prefix,raw,suffix){offsets[n]=length;add(n+' 0 obj\n'+prefix);if(raw)add(raw);if(suffix)add(suffix);add('\nendobj\n');}
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
 obj(4,`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`,jpg,'\nendstream');
 const stream='q 595.28 0 0 841.89 0 0 cm /Im0 Do Q\n';
 obj(5,`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`);
 const xref=length;
 add('xref\n0 6\n0000000000 65535 f \n');
 for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 return new Blob(parts,{type:'application/pdf'});
}
async function generate(root){
 const canvas=document.createElement('canvas');canvas.width=W*S;canvas.height=H*S;
 const ctx=canvas.getContext('2d');ctx.scale(S,S);
 ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
 ctx.fillStyle=green;ctx.beginPath();ctx.arc(W+5,-5,65,0,Math.PI*2);ctx.fill();
 const logoNode=root.querySelector('.wc-contract-paper-head img');
 const logo=await loadImage(logoNode?.currentSrc||logoNode?.src||'invoice_logo.png')||await loadImage('invoice_logo.png')||await loadImage('logo.png');
 imageContain(ctx,logo,240,19,140,69);
 text(ctx,'WINTER CAMP',310,100,18,true,ink,'center');
 text(ctx,'وينتر كامب للصوتيات والإنتاج الصوتي',310,119,10,false,ink,'center');
 text(ctx,'عقد تأجير معدات صوتية',310,146,20,true,green,'center');
 ctx.fillStyle=green;ctx.fillRect(170,155,280,2);
 let y=168;
 const meta=pair(root,'.wc-contract-meta > div');
 field(ctx,317,y,265,meta[0]?.label,meta[0]?.value,43);
 field(ctx,38,y,265,meta[1]?.label,meta[1]?.value,43);
 y+=52;
 function section(title){
  ctx.fillStyle=light;ctx.fillRect(38,y,544,25);
  ctx.fillStyle=green;ctx.fillRect(579,y,3,25);
  text(ctx,title,570,y+17,12,true,green);y+=32;
 }
 function grid(items){
  for(let i=0;i<items.length;i+=2){
   const a=items[i],b=items[i+1];
   const h= i===0 && items.some(v=>String(v.value).length>95)?63:49;
   field(ctx,317,y,265,a?.label,a?.value,h);
   if(b)field(ctx,38,y,265,b.label,b.value,h);
   y+=h+7;
  }
 }
 section('بيانات أطراف العقد');
 const groups=[...root.querySelectorAll('.wc-contract-grid')];
 const parties=groups[0]?pair(groups[0],':scope > div'):[];
 const rental=groups[1]?pair(groups[1],':scope > div'):[];
 if(parties.length<4||rental.length<4)throw new Error('بيانات العقد غير مكتملة، لا يمكن إرسال ملف ناقص');
 grid(parties);
 section('تفاصيل التأجير');
 grid(rental);
 const money=[...root.querySelectorAll('.wc-contract-money > div')].map(n=>({label:n.childNodes[0]?.textContent?.trim()||'',value:n.querySelector('b')?.textContent?.trim()||''}));
 const bw=176;for(let i=0;i<3;i++){
  const x=406-i*184;ctx.fillStyle=light;ctx.fillRect(x,y,bw,42);
  text(ctx,money[i]?.label||'',x+bw/2,y+15,10,false,ink,'center');
  text(ctx,money[i]?.value||'',x+bw/2,y+31,12,true,green,'center');
 }y+=52;
 section('الشروط والأحكام');
 const terms=read(root,'.wc-contract-paper-terms');
 let termLines=wrap(ctx,terms,526,10);
 // Scale terms to fit a one-page A4, while retaining all lines.
 const spaceForTerms=Math.max(110,714-y);
 const lineH=Math.min(15,Math.max(9,spaceForTerms/Math.max(1,termLines.length)));
 const fontSize=Math.min(10,Math.max(8,lineH-3));
 termLines=wrap(ctx,terms,526,fontSize);
 const height=Math.min(spaceForTerms,termLines.length*lineH+15);
 box(ctx,38,y,544,height);
 ctx.save();ctx.beginPath();ctx.rect(43,y+4,534,height-7);ctx.clip();
 termLines.forEach((line,i)=>text(ctx,line,572,y+13+i*lineH,fontSize));
 ctx.restore();y+=height+9;
 const notes=read(root,'.wc-contract-notes');
 const noteLines=wrap(ctx,notes,526,10);
 noteLines.forEach((line,i)=>text(ctx,line,572,y+9+i*12,10));
 y+=Math.max(20,noteLines.length*12+6);
 const signY=Math.max(y+6,747);
 if(signY>780)throw new Error('العقد أطول من صفحة A4؛ لم يتم إنشاء ملف ناقص');
 ctx.strokeStyle='#9cb5a4';ctx.beginPath();ctx.moveTo(38,signY);ctx.lineTo(252,signY);ctx.moveTo(368,signY);ctx.lineTo(582,signY);ctx.stroke();
 text(ctx,'اعتماد المؤجر',573,signY+18,11,true);
 text(ctx,'Winter Camp',573,signY+35,10);
 const tenant=root.querySelector('.wc-contract-tenant-approval');
 text(ctx,read(tenant,'b'),245,signY+18,10,true,ink,'right');
 const signImg=tenant?.querySelector('img');
 if(signImg){
  const image=await loadImage(signImg.currentSrc||signImg.src);
  if(!image)throw new Error('تعذر تحميل صورة توقيع المستأجر؛ لن يتم إنشاء PDF بدون التوقيع');
  imageContain(ctx,image,44,signY+24,130,35);
 }else{
  text(ctx,read(tenant,'p'),245,signY+37,9,false,ink,'right');
 }
 text(ctx,read(tenant,'small'),245,signY+66,8,false,muted,'right');
 const stampNode=root.querySelector('.wc-contract-stamp');
 const stamp=await loadImage(stampNode?.currentSrc||stampNode?.src||'stamp.png')||await loadImage('stamp.png');
 if(!stamp)throw new Error('تعذر تحميل صورة الختم؛ تأكد من وجود stamp.png على الموقع');
 imageContain(ctx,stamp,268,signY-9,84,84);
 ctx.fillStyle=green;ctx.fillRect(38,853,544,1.5);
 text(ctx,'WINTER CAMP · أبها، المملكة العربية السعودية',310,868,9,true,green,'center');
 return pdfFromJpeg(canvas.toDataURL('image/jpeg',0.94),canvas.width,canvas.height);
}
function save(blob,filename){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
window.WCContractPDF={generate,save,async share(blob,filename){
 const file=new File([blob],filename,{type:'application/pdf'});
 if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
  await navigator.share({files:[file],title:filename});
  return true;
 }
 save(blob,filename);return false;
}};
})();
