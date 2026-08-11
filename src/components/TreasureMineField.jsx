import { useEffect, useRef } from "react";
import useAnimationPreferences from "../contexts/useAnimationPreferences";
import { resolveMineFxFps } from "../ocean/oceanRuntimePolicy";

const TAU = Math.PI * 2;
const TREASURES = Object.freeze([
  { type: "diamond", x: 0.735, y: 0.43, size: 34, delay: 0.07 },
  { type: "emerald", x: 0.61, y: 0.63, size: 25, delay: 0.15 },
  { type: "ruby", x: 0.84, y: 0.62, size: 22, delay: 0.25 },
  { type: "sapphire", x: 0.53, y: 0.47, size: 23, delay: 0.19 },
  { type: "gold", x: 0.91, y: 0.43, size: 28, delay: 0.30 },
  { type: "amethyst", x: 0.70, y: 0.76, size: 27, delay: 0.36 },
  { type: "opal", x: 0.79, y: 0.78, size: 19, delay: 0.42 },
  { type: "aquamarine", x: 0.58, y: 0.78, size: 22, delay: 0.34 },
  { type: "topaz", x: 0.89, y: 0.76, size: 20, delay: 0.46 },
  { type: "red-coral", x: 0.47, y: 0.72, size: 30, delay: 0.28 },
  { type: "black-pearl", x: 0.95, y: 0.68, size: 16, delay: 0.50 },
]);

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function easeOut(value) {
  const t = clamp(value);
  return 1 - ((1 - t) ** 3);
}

function noise(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function rockMassPath(ctx, width, height) {
  ctx.beginPath();
  ctx.moveTo(width * 0.37, height * 0.18);
  ctx.lineTo(width * 0.44, height * 0.10);
  ctx.lineTo(width * 0.53, height * 0.16);
  ctx.lineTo(width * 0.61, height * 0.08);
  ctx.lineTo(width * 0.70, height * 0.13);
  ctx.lineTo(width * 0.80, height * 0.07);
  ctx.lineTo(width * 0.89, height * 0.15);
  ctx.lineTo(width, height * 0.11);
  ctx.lineTo(width, height);
  ctx.lineTo(width * 0.20, height);
  ctx.lineTo(width * 0.28, height * 0.86);
  ctx.lineTo(width * 0.32, height * 0.68);
  ctx.lineTo(width * 0.35, height * 0.49);
  ctx.closePath();
}

function drawRockMass(ctx, width, height, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  rockMassPath(ctx, width, height);
  const gradient = ctx.createLinearGradient(width * 0.30, height * 0.08, width, height);
  gradient.addColorStop(0, "#172126");
  gradient.addColorStop(0.32, "#10191d");
  gradient.addColorStop(0.72, "#24241d");
  gradient.addColorStop(1, "#0b1011");
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.clip();
  const random = noise(0x8a351);
  for (let index = 0; index < 105; index += 1) {
    const x = width * (0.28 + random() * 0.76);
    const y = height * (0.07 + random() * 0.94);
    const rx = 9 + random() * 43;
    const ry = 5 + random() * 22;
    const shade = 23 + Math.floor(random() * 30);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((random() - 0.5) * 0.8);
    ctx.fillStyle = `rgba(${shade + 5},${shade + 3},${Math.max(10, shade - 4)},${0.08 + random() * 0.18})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  for (let index = 0; index < 15; index += 1) {
    const x = width * (0.39 + index * 0.041);
    const y = height * (0.22 + ((index * 17) % 48) / 100);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + width * 0.015, y + height * 0.06, x - width * 0.015, y + height * 0.12, x + width * 0.032, y + height * 0.21);
    ctx.strokeStyle = index % 4 === 0 ? "rgba(202,158,66,.20)" : "rgba(132,169,165,.10)";
    ctx.lineWidth = index % 4 === 0 ? 1.8 : 1;
    ctx.stroke();
  }
  ctx.restore();
}

function polygon(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function drawRawDiamond(ctx, x, y, size, pulse) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.09);
  ctx.shadowColor = `rgba(178,238,255,${0.18 + pulse * 0.20})`;
  ctx.shadowBlur = 12 + pulse * 7;
  const points = [[0,-size], [size*.64,-size*.30], [size*.48,size*.55], [0,size*.90], [-size*.58,size*.48], [-size*.72,-size*.24]];
  polygon(ctx, points);
  const g = ctx.createLinearGradient(-size, -size, size, size);
  g.addColorStop(0, "#9bbbc0"); g.addColorStop(.20, "#eef8f4"); g.addColorStop(.48, "#a4dce3"); g.addColorStop(.72, "#ffffff"); g.addColorStop(1, "#728e9b");
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,.46)"; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0,-size); ctx.lineTo(0,size*.9); ctx.moveTo(-size*.72,-size*.24); ctx.lineTo(0,size*.12); ctx.lineTo(size*.64,-size*.30);
  ctx.strokeStyle = "rgba(255,255,255,.23)"; ctx.stroke();
  ctx.restore();
}

function drawPrism(ctx, x, y, size, light, mid, dark, rotation = 0) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rotation);
  ctx.shadowColor = mid; ctx.shadowBlur = 9;
  polygon(ctx, [[-size*.45,-size*.9],[size*.38,-size*.75],[size*.60,size*.52],[0,size],[-size*.62,size*.50]]);
  const g = ctx.createLinearGradient(-size,-size,size,size);
  g.addColorStop(0, light); g.addColorStop(.35, mid); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-size*.45,-size*.9); ctx.lineTo(0,size); ctx.moveTo(size*.38,-size*.75); ctx.lineTo(0,size*.08); ctx.strokeStyle="rgba(255,255,255,.15)"; ctx.stroke();
  ctx.restore();
}

function drawRoughGem(ctx, x, y, size, inner, outer, glow, seed) {
  const random = noise(seed);
  ctx.save(); ctx.translate(x, y); ctx.shadowColor = glow; ctx.shadowBlur = 10;
  const points = Array.from({ length: 9 }, (_, i) => {
    const a = -Math.PI/2 + i * TAU / 9;
    const r = size * (0.72 + random() * 0.30);
    return [Math.cos(a)*r, Math.sin(a)*r];
  });
  polygon(ctx, points);
  const g = ctx.createRadialGradient(-size*.25,-size*.28,1,0,0,size);
  g.addColorStop(0,"rgba(255,255,255,.72)"); g.addColorStop(.18,inner); g.addColorStop(.72,outer); g.addColorStop(1,"#111516");
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle="rgba(255,255,255,.18)"; ctx.stroke();
  for (let i=0;i<4;i+=1){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(points[i*2][0],points[i*2][1]);ctx.strokeStyle="rgba(255,255,255,.12)";ctx.stroke();}
  ctx.restore();
}

function drawGold(ctx, x, y, size, pulse) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(-.18); ctx.shadowColor=`rgba(255,190,52,${.18+pulse*.18})`; ctx.shadowBlur=10;
  ctx.beginPath(); ctx.moveTo(-size*.9,-size*.05); ctx.quadraticCurveTo(-size*.65,-size*.85,-size*.05,-size*.68); ctx.quadraticCurveTo(size*.55,-size*.9,size*.88,-size*.22); ctx.quadraticCurveTo(size*.92,size*.55,size*.22,size*.70); ctx.quadraticCurveTo(-size*.55,size*.82,-size*.84,size*.25); ctx.closePath();
  const g=ctx.createRadialGradient(-size*.3,-size*.38,2,0,0,size);g.addColorStop(0,"#fff1a9");g.addColorStop(.22,"#f3c64e");g.addColorStop(.64,"#a96512");g.addColorStop(1,"#4b2c08");ctx.fillStyle=g;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="rgba(255,236,168,.28)";ctx.stroke();ctx.restore();
}

function drawAmethyst(ctx, x, y, size) {
  ctx.save(); ctx.translate(x,y);
  for(let i=0;i<7;i+=1){const a=(i-3)*.22;const h=size*(.65+(i%3)*.16);const px=(i-3)*size*.21;ctx.save();ctx.translate(px,size*.32);ctx.rotate(a);polygon(ctx,[[-size*.13,0],[0,-h],[size*.13,0],[size*.08,size*.38],[-size*.09,size*.38]]);const g=ctx.createLinearGradient(0,-h,0,size*.4);g.addColorStop(0,"#e1c2ff");g.addColorStop(.35,"#8b5fd1");g.addColorStop(1,"#39225e");ctx.fillStyle=g;ctx.fill();ctx.strokeStyle="rgba(255,255,255,.20)";ctx.stroke();ctx.restore();}
  ctx.restore();
}

function drawOpal(ctx, x, y, size, time) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(.16); ctx.shadowColor="rgba(161,226,236,.20)";ctx.shadowBlur=8;
  const g=ctx.createRadialGradient(-size*.25,-size*.3,1,0,0,size);g.addColorStop(0,"#fffef2");g.addColorStop(.52,"#cbdde0");g.addColorStop(1,"#627981");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,size*.72,size,0,0,TAU);ctx.fill();ctx.clip();
  const hues=["rgba(75,233,255,.35)","rgba(255,101,174,.30)","rgba(124,255,146,.28)","rgba(255,207,82,.24)"];
  for(let i=0;i<7;i+=1){ctx.fillStyle=hues[i%hues.length];ctx.beginPath();ctx.arc(Math.sin(time*.001+i*2.1)*size*.43,Math.cos(time*.0012+i)*size*.58,size*(.10+(i%3)*.04),0,TAU);ctx.fill();}
  ctx.restore();
}

function drawCoral(ctx, x, y, size, time) {
  ctx.save();ctx.translate(x,y);ctx.lineCap="round";ctx.lineJoin="round";ctx.shadowColor="rgba(255,83,92,.18)";ctx.shadowBlur=7;
  const sway=Math.sin(time*.0018)*size*.035;
  const branch=(sx,sy,ex,ey,w)=>{ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+ex)*.5+sway,(sy+ey)*.5,ex,ey);ctx.strokeStyle="#b93f47";ctx.lineWidth=w;ctx.stroke();ctx.strokeStyle="rgba(255,139,135,.38)";ctx.lineWidth=Math.max(1,w*.22);ctx.stroke();};
  branch(0,size*.75,0,-size*.68,size*.20);branch(0,size*.10,-size*.62,-size*.38,size*.14);branch(-size*.24,-size*.12,-size*.52,-size*.72,size*.10);branch(0,-size*.04,size*.58,-size*.48,size*.13);branch(size*.25,-size*.24,size*.42,-size*.78,size*.09);branch(-size*.05,size*.30,size*.48,size*.08,size*.10);ctx.restore();
}

function drawPearlShell(ctx, x, y, size, pulse) {
  ctx.save();ctx.translate(x,y);ctx.rotate(-.12);
  ctx.fillStyle="#4e5b5d";ctx.beginPath();ctx.ellipse(0,size*.16,size,size*.58,0,0,Math.PI);ctx.fill();
  ctx.fillStyle="#8c9998";ctx.beginPath();ctx.ellipse(0,size*.05,size*.92,size*.52,0,Math.PI,TAU);ctx.fill();
  const g=ctx.createRadialGradient(-size*.16,-size*.16,1,0,0,size*.45);g.addColorStop(0,"#ffffff");g.addColorStop(.40,"#73808a");g.addColorStop(.78,"#262c39");g.addColorStop(1,"#080a12");ctx.fillStyle=g;ctx.shadowColor=`rgba(210,235,255,${.16+pulse*.16})`;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(0,-size*.05,size*.38,0,TAU);ctx.fill();ctx.restore();
}

function drawTreasure(ctx, item, width, height, reveal, time) {
  const local=easeOut((reveal-item.delay)/.36); if(local<=0)return;
  const x=width*item.x,y=height*item.y,size=item.size*Math.min(1.05,width/1280),pulse=(Math.sin(time*.004+item.x*8)+1)*.5;
  ctx.save();ctx.globalAlpha=local;ctx.translate(x,y);ctx.scale(.74+local*.26,.74+local*.26);ctx.translate(-x,-y);
  if(item.type==="diamond")drawRawDiamond(ctx,x,y,size,pulse);
  if(item.type==="emerald")drawPrism(ctx,x,y,size,"#d0ffe3","#1f9a69","#07543c",-.08);
  if(item.type==="ruby")drawRoughGem(ctx,x,y,size,"#ffb1a9","#7f1727","rgba(255,68,83,.28)",31);
  if(item.type==="sapphire")drawRoughGem(ctx,x,y,size,"#c0d8ff","#244782","rgba(78,133,255,.24)",49);
  if(item.type==="gold")drawGold(ctx,x,y,size,pulse);
  if(item.type==="amethyst")drawAmethyst(ctx,x,y,size);
  if(item.type==="opal")drawOpal(ctx,x,y,size,time);
  if(item.type==="aquamarine")drawPrism(ctx,x,y,size,"#d5fbff","#56c9d5","#25647a",.13);
  if(item.type==="topaz")drawPrism(ctx,x,y,size,"#fff0a9","#e5a52c","#7a4d12",-.16);
  if(item.type==="red-coral")drawCoral(ctx,x,y,size,time);
  if(item.type==="black-pearl")drawPearlShell(ctx,x,y,size,pulse);
  ctx.restore();
}

function drawExcavationCover(ctx,width,height,reveal,cover,time){
  const c=cover.getContext("2d");if(!c)return;c.clearRect(0,0,width,height);drawRockMass(c,width,height,.99);c.globalCompositeOperation="destination-out";
  TREASURES.forEach((item,index)=>{const local=easeOut((reveal-item.delay*.82)/.40);if(local<=0)return;const cx=width*item.x,cy=height*item.y,r=(item.size*1.8+20)*local*Math.min(1.1,width/1200);c.beginPath();for(let p=0;p<16;p+=1){const a=p*TAU/16;const jag=.78+(((p*13+index*17)%9)/8)*.28;const px=cx+Math.cos(a)*r*jag,py=cy+Math.sin(a)*r*.70*jag;p?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();});
  c.globalCompositeOperation="source-over";ctx.drawImage(cover,0,0);
  const dust=clamp(1-Math.abs(reveal-.52)*2.2,0,.48);ctx.save();ctx.globalAlpha=dust;for(let i=0;i<34;i+=1){const phase=(time*.0008+i*.071)%1,x=width*(.41+((i*37)%58)/100),y=height*(.20+((i*19)%65)/100)-phase*18;ctx.fillStyle=i%5===0?"rgba(222,191,127,.56)":"rgba(136,137,122,.40)";ctx.beginPath();ctx.arc(x,y,.7+(i%4)*.45,0,TAU);ctx.fill();}ctx.restore();
}

function drawGlints(ctx,width,height,reveal,time){if(reveal<.60)return;ctx.save();ctx.globalCompositeOperation="screen";TREASURES.forEach((item,index)=>{const phase=(time*.00045+index*.137)%1;if(phase>.14)return;const s=(1-phase/.14)*clamp((reveal-.60)/.4),x=width*item.x,y=height*item.y-item.size*.55,l=7+item.size*.24;ctx.strokeStyle=`rgba(255,255,241,${.34*s})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-l,y);ctx.lineTo(x+l,y);ctx.moveTo(x,y-l);ctx.lineTo(x,y+l);ctx.stroke();});ctx.restore();}

function renderMineBase(ctx,width,height,reveal,time,cover){ctx.clearRect(0,0,width,height);drawRockMass(ctx,width,height,.92);TREASURES.forEach(item=>drawTreasure(ctx,item,width,height,reveal,time));drawExcavationCover(ctx,width,height,reveal,cover,time);}

function renderMineFx(ctx,width,height,reveal,time){ctx.clearRect(0,0,width,height);drawGlints(ctx,width,height,reveal,time);}

export default function TreasureMineField(){
  const baseCanvasRef=useRef(null),fxCanvasRef=useRef(null),hostRef=useRef(null),rafRef=useRef(0),startedAtRef=useRef(0),activeRef=useRef(false),completedRef=useRef(false),lastFxRef=useRef(0);
  const { animationsEnabled,animationsPaused,ultraLite }=useAnimationPreferences();
  useEffect(()=>{const host=hostRef.current,baseCanvas=baseCanvasRef.current,fxCanvas=fxCanvasRef.current;if(!host||!baseCanvas||!fxCanvas)return undefined;const baseCtx=baseCanvas.getContext("2d",{alpha:true}),fxCtx=fxCanvas.getContext("2d",{alpha:true,desynchronized:true});if(!baseCtx||!fxCtx)return undefined;let destroyed=false,width=1,height=1,dpr=1;const cover=document.createElement("canvas");
    const paintFinalBase=(now=performance.now())=>{renderMineBase(baseCtx,width,height,1,now,cover);completedRef.current=true;};
    const resize=()=>{const rect=host.getBoundingClientRect();width=Math.max(1,Math.round(rect.width));height=Math.max(1,Math.round(rect.height));dpr=Math.min(window.devicePixelRatio||1,ultraLite?1:1.4);for(const canvas of [baseCanvas,fxCanvas]){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;}cover.width=width;cover.height=height;baseCtx.setTransform(dpr,0,0,dpr,0,0);fxCtx.setTransform(dpr,0,0,dpr,0,0);if(completedRef.current)paintFinalBase();else renderMineBase(baseCtx,width,height,activeRef.current?1:.02,performance.now(),cover);renderMineFx(fxCtx,width,height,completedRef.current?1:.02,performance.now());};
    const frame=now=>{if(destroyed)return;if(!activeRef.current||animationsPaused){rafRef.current=0;return;}if(!startedAtRef.current)startedAtRef.current=now;const duration=ultraLite||!animationsEnabled?1:960,reveal=completedRef.current?1:(duration<=1?1:clamp((now-startedAtRef.current)/duration));if(!completedRef.current){renderMineBase(baseCtx,width,height,reveal,now,cover);if(reveal>=1)completedRef.current=true;}const runtimeQuality=document.documentElement.dataset.runtimeQuality||"high",fxFps=animationsEnabled?resolveMineFxFps(runtimeQuality,ultraLite):0;if(fxFps>0&&now-lastFxRef.current>=1000/fxFps){lastFxRef.current=now;renderMineFx(fxCtx,width,height,reveal,now);}else if(fxFps===0){renderMineFx(fxCtx,width,height,reveal,now);}if(reveal<1||fxFps>0)rafRef.current=requestAnimationFrame(frame);else rafRef.current=0;};
    const start=()=>{activeRef.current=true;startedAtRef.current=completedRef.current?performance.now():0;lastFxRef.current=0;cancelAnimationFrame(rafRef.current);rafRef.current=requestAnimationFrame(frame);};
    const stop=()=>{activeRef.current=false;startedAtRef.current=0;cancelAnimationFrame(rafRef.current);rafRef.current=0;fxCtx.clearRect(0,0,width,height);};
    const observer=new IntersectionObserver(entries=>{const entry=entries[0];if(entry?.isIntersecting&&entry.intersectionRatio>.10)start();else stop();},{threshold:[0,.10,.30]});observer.observe(host);const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;ro?.observe(host);window.addEventListener("resize",resize,{passive:true});resize();
    return()=>{destroyed=true;observer.disconnect();ro?.disconnect();window.removeEventListener("resize",resize);cancelAnimationFrame(rafRef.current);};
  },[animationsEnabled,animationsPaused,ultraLite]);
  return <div ref={hostRef} className="treasure-mine-field" aria-hidden="true" data-mine-field="excavation-runtime" data-render-mode="static-base-dynamic-fx"><canvas ref={baseCanvasRef} className="treasure-mine-canvas treasure-mine-base-canvas"/><canvas ref={fxCanvasRef} className="treasure-mine-canvas treasure-mine-fx-canvas"/><span className="mine-shaft-light"/><span className="mine-dust-overlay"/></div>;
}
