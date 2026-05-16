import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "pumpi_v1";
const defaultMachines = {
  lower: ["Mesa Flexora","Adutora","Abdutora","Cadeira Flexora","Cadeira Extensora","Leg Press","Panturrilha","Agachamento"],
  upper: ["Supino","Puxada Frontal","Remada","Desenvolvimento","Crucifixo","Bíceps","Tríceps","Ombro","Rosca Direta","Voador"],
};
const repOptions = ["6-8","8-10","10-12","12-15","6","8","10","12","15"];

const PERSONAS = [
  {keys:["abdutora"],          name:"Coice da Égua",          emoji:"🐴",color:"#ff7eb3"},
  {keys:["adutora"],           name:"Abre & Fecha",           emoji:"🦋",color:"#a78bfa"},
  {keys:["mesa flexora"],      name:"A Enrolada",             emoji:"🌀",color:"#60d0ff"},
  {keys:["cadeira flexora"],   name:"A Puxadinha",            emoji:"🪝",color:"#86efac"},
  {keys:["cadeira extensora"], name:"Pontapé da Fama",        emoji:"🦵",color:"#fbbf24"},
  {keys:["leg press"],         name:"Empurrão Rainha",        emoji:"👑",color:"#f472b6"},
  {keys:["agachamento"],       name:"Vai Fundo",              emoji:"🍑",color:"#fb923c"},
  {keys:["panturrilha"],       name:"Na Ponta do Pé",         emoji:"💃",color:"#34d399"},
  {keys:["hip thrust"],        name:"Empurra Bunda",          emoji:"🚀",color:"#c084fc"},
  {keys:["stiff"],             name:"Curvada Elegante",       emoji:"🎩",color:"#94a3b8"},
  {keys:["afundo","passada"],  name:"Passadinha Dramática",   emoji:"🎭",color:"#f59e0b"},
  {keys:["supino"],            name:"Peito Aberto",           emoji:"🦅",color:"#38bdf8"},
  {keys:["puxada"],            name:"Macacona",               emoji:"🦍",color:"#a3e635"},
  {keys:["remada"],            name:"A Barqueira",            emoji:"🚣",color:"#22d3ee"},
  {keys:["bíceps","bicep","rosca direta"], name:"Mostra o Músculo", emoji:"💪",color:"#fb7185"},
  {keys:["tríceps","tricep"],  name:"O Que Balança Atrás",   emoji:"🔔",color:"#a78bfa"},
  {keys:["ombro","desenvolv"], name:"Largura de Porta",       emoji:"🚪",color:"#60a5fa"},
  {keys:["crucifixo","voador"],name:"Cristo Redentor",        emoji:"🗿",color:"#4ade80"},
  {keys:["glut","gluteo"],     name:"Bunda Power",            emoji:"🍑",color:"#e879f9"},
];
const getPersona = name => {
  const n = name.toLowerCase();
  return PERSONAS.find(p=>p.keys.some(k=>n.includes(k))) || {name,emoji:"🏋️",color:"#94a3b8"};
};

function getTimeTheme() {
  const h = new Date().getHours();
  if (h>=6&&h<11)  return {id:"manha", label:"Manhã",    icon:"🌅",bg:"#f5f0e8",bgCard:"rgba(0,0,0,0.04)",  bgCardBorder:"rgba(0,0,0,0.09)",  header:"#f5f0e8",text:"#2a2318",textSub:"#8a7a6a",textMuted:"#b8a898",accent:"#c8622a",accentText:"#fff",   green:"#2e7d52",blue:"#2a5f8a",inputBg:"rgba(0,0,0,0.06)",      inputBorder:"rgba(0,0,0,0.12)",      divider:"rgba(0,0,0,0.08)",      scrollThumb:"#ccc",   modalBg:"#ece7de",danger:"#b33"};
  if (h>=11&&h<17) return {id:"tarde", label:"Tarde",    icon:"☀️",bg:"#111108",bgCard:"rgba(255,220,60,0.04)",bgCardBorder:"rgba(255,200,40,0.1)",header:"#111108",text:"#f5e8c0",textSub:"#9a8050",textMuted:"#4a3820",accent:"#f0b84a",accentText:"#111108",green:"#7ec8a4",blue:"#a8bfd4",inputBg:"rgba(255,200,60,0.07)", inputBorder:"rgba(255,200,60,0.14)", divider:"rgba(255,200,60,0.08)", scrollThumb:"#3a3010",modalBg:"#1a1610",danger:"#ff6b6b"};
  if (h>=17&&h<21) return {id:"noite", label:"Noite",    icon:"🌆",bg:"#0e0a16",bgCard:"rgba(180,80,255,0.04)",bgCardBorder:"rgba(180,80,255,0.1)",header:"#0e0a16",text:"#e8d0f8",textSub:"#7a5888",textMuted:"#3a2848",accent:"#b870ff",accentText:"#0e0a16",green:"#7ec8a4",blue:"#ff9f60",inputBg:"rgba(180,80,255,0.08)",inputBorder:"rgba(180,80,255,0.14)",divider:"rgba(180,80,255,0.08)",scrollThumb:"#3a2050",modalBg:"#180e22",danger:"#ff6b6b"};
  return              {id:"madrugada",label:"Madrugada",icon:"🌙",bg:"#060810",bgCard:"rgba(60,100,255,0.04)", bgCardBorder:"rgba(60,100,255,0.09)", header:"#060810",text:"#b8c8f0",textSub:"#3a4860",textMuted:"#1e2840",accent:"#4870ff",accentText:"#fff",   green:"#50a898",blue:"#7898e0",inputBg:"rgba(60,100,255,0.08)",  inputBorder:"rgba(60,100,255,0.14)", divider:"rgba(60,100,255,0.07)", scrollThumb:"#181e38",modalBg:"#0c1020",danger:"#ff6b6b"};
}

function useTimer(startedAt, active) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(()=>{
    if (!active||!startedAt) return;
    const upd=()=>setElapsed(Math.floor((Date.now()-startedAt)/1000));
    upd(); const id=setInterval(upd,1000); return ()=>clearInterval(id);
  },[active,startedAt]);
  const s=elapsed%60,m=Math.floor(elapsed/60)%60,hh=Math.floor(elapsed/3600);
  return hh>0?`${String(hh).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function calcDuration(a,b){
  if (!a||!b) return null;
  const m=Math.floor((b-a)/60000),hh=Math.floor(m/60);
  return hh>0?`${hh}h ${m%60}min`:`${m}min`;
}

function Confetti({onDone}){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current; if(!c) return;
    const ctx=c.getContext("2d"); c.width=window.innerWidth; c.height=window.innerHeight;
    const cols=["#f0b84a","#ff6b6b","#7ec8a4","#c87aff","#ff9f43","#fff","#60d0ff","#ffb3d9"];
    const ps=Array.from({length:150},()=>({x:Math.random()*c.width,y:-30-Math.random()*300,d:1.5+Math.random()*3,color:cols[Math.floor(Math.random()*cols.length)],spin:(Math.random()-.5)*.18,angle:Math.random()*Math.PI*2,w:5+Math.random()*9,h:3+Math.random()*5,shape:Math.random()>.5?"rect":"circle",wave:Math.random()*Math.PI*2}));
    let fr,el=0;
    const draw=()=>{ctx.clearRect(0,0,c.width,c.height);const a=Math.max(0,1-el/200);ps.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=a;ctx.fillStyle=p.color;if(p.shape==="rect")ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);else{ctx.beginPath();ctx.arc(0,0,p.w/4,0,Math.PI*2);ctx.fill();}ctx.restore();p.y+=p.d;p.x+=Math.sin(p.wave+el*.025)*1.4;p.angle+=p.spin;p.wave+=.02;if(p.y>c.height+20){p.y=-20;p.x=Math.random()*c.width;}});el++;if(el<240)fr=requestAnimationFrame(draw);else onDone();};
    draw(); return ()=>cancelAnimationFrame(fr);
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:998,pointerEvents:"none"}}/>;
}

function CelebrationModal({theme,session,onClose}){
  const [conf,setConf]=useState(true);
  const total=(session.lower?.length||0)+(session.upper?.length||0);
  const dur=calcDuration(session.startedAt,session.finishedAt);
  const msgs=["Arrasou demais! 🔥","Mais um no bolso! 🏆","Você é incrível! ⚡","Missão cumprida! 🎯","Bumbum na nuca chegando! 🍑"];
  const [msg]=useState(()=>msgs[Math.floor(Math.random()*msgs.length)]);
  return(<>
    {conf&&<Confetti onDone={()=>setConf(false)}/>}
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:"20px"}} onClick={onClose}>
      <div style={{background:theme.modalBg,border:`2px solid ${theme.accent}50`,borderRadius:"28px",padding:"40px 28px 32px",textAlign:"center",maxWidth:"320px",width:"100%",boxShadow:`0 0 80px ${theme.accent}25`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:"64px",marginBottom:"12px",lineHeight:1}}>🍑</div>
        <h2 style={{color:theme.accent,fontSize:"22px",fontWeight:800,fontFamily:"'DM Sans',sans-serif",marginBottom:"6px"}}>{msg}</h2>
        {dur&&<p style={{color:theme.textSub,fontSize:"13px",fontFamily:"'DM Sans',sans-serif",marginBottom:"4px"}}>⏱ Duração: <strong style={{color:theme.text}}>{dur}</strong></p>}
        <p style={{color:theme.textSub,fontSize:"13px",fontFamily:"'DM Sans',sans-serif",marginBottom:"20px"}}>{total} exercícios · {session.lower?.length||0} lower · {session.upper?.length||0} upper</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",justifyContent:"center",marginBottom:"24px"}}>
          {[...(session.lower||[]),...(session.upper||[])].map((ex,i)=>(
            <span key={i} style={{background:`${theme.accent}18`,border:`1px solid ${theme.accent}30`,borderRadius:"8px",padding:"4px 10px",color:theme.accent,fontSize:"11px",fontFamily:"'DM Sans',sans-serif"}}>{ex.machine}{ex.weight?` ${ex.weight}kg`:""}</span>
          ))}
        </div>
        <button onClick={onClose} style={{background:theme.accent,border:"none",borderRadius:"14px",color:theme.accentText,fontWeight:800,fontSize:"15px",padding:"14px 32px",cursor:"pointer",width:"100%",fontFamily:"'DM Sans',sans-serif"}}>Fechar 💪</button>
      </div>
    </div>
  </>);
}
function HistoryModal({machine,history,theme,onClose}){
  const sorted=[...history].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const max=history.reduce((m,h)=>Math.max(m,parseFloat(h.weight)||0),0);
  const fmt=iso=>new Date(iso).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
  const fmtF=iso=>new Date(iso).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(6px)"}} onClick={onClose}>
      <div style={{background:theme.modalBg,border:`1px solid ${theme.bgCardBorder}`,borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:"480px",maxHeight:"75vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:"36px",height:"4px",background:`${theme.accent}40`,borderRadius:"2px",margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
          <div>
            <p style={{color:theme.textSub,fontSize:"10px",letterSpacing:"2px",textTransform:"uppercase",margin:0,fontFamily:"'DM Sans',sans-serif"}}>Histórico de carga</p>
            <h3 style={{color:theme.text,fontSize:"18px",fontWeight:700,margin:"4px 0 0",fontFamily:"'DM Sans',sans-serif"}}>{machine}</h3>
          </div>
          {max>0&&<div style={{textAlign:"right"}}><p style={{color:theme.textSub,fontSize:"10px",margin:0,fontFamily:"'DM Sans',sans-serif"}}>MÁXIMO</p><p style={{color:theme.accent,fontSize:"22px",fontWeight:700,margin:"2px 0 0",fontFamily:"'DM Mono',monospace"}}>{max}kg</p></div>}
        </div>
        {history.length>1&&(()=>{
          const cd=[...history].sort((a,b)=>new Date(a.date)-new Date(b.date));
          const mw=Math.max(...cd.map(h=>parseFloat(h.weight)||0));
          return(<div style={{marginBottom:"20px",padding:"14px",background:theme.bgCard,borderRadius:"12px",border:`1px solid ${theme.bgCardBorder}`}}>
            <p style={{color:theme.textMuted,fontSize:"10px",letterSpacing:"1.5px",marginBottom:"10px",fontFamily:"'DM Sans',sans-serif"}}>EVOLUÇÃO</p>
            <div style={{display:"flex",alignItems:"flex-end",gap:"5px",height:"56px"}}>
              {cd.map((h,i)=>{const pct=mw>0?((parseFloat(h.weight)||0)/mw)*100:0;return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}><div style={{width:"100%",height:`${Math.max(pct*.56,3)}px`,background:i===cd.length-1?theme.accent:`${theme.accent}40`,borderRadius:"3px 3px 0 0"}}/><span style={{color:theme.textMuted,fontSize:"8px",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{fmt(h.date)}</span></div>);})}
            </div>
          </div>);
        })()}
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {sorted.map((h,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:theme.bgCard,borderRadius:"10px",border:`1px solid ${theme.bgCardBorder}`}}>
              <div><p style={{color:theme.text,fontSize:"16px",fontWeight:600,margin:0,fontFamily:"'DM Mono',monospace"}}>{h.weight}kg</p>{h.reps&&<p style={{color:theme.textSub,fontSize:"11px",margin:"3px 0 0",fontFamily:"'DM Sans',sans-serif"}}>{h.reps} reps{h.rp?` · RP ${h.rp}`:""}</p>}</div>
              <div style={{textAlign:"right"}}><p style={{color:theme.textSub,fontSize:"12px",margin:0,fontFamily:"'DM Sans',sans-serif"}}>{fmtF(h.date)}</p>{i===0&&<span style={{background:`${theme.accent}20`,color:theme.accent,fontSize:"10px",padding:"2px 7px",borderRadius:"5px"}}>atual</span>}</div>
            </div>
          ))}
        </div>
        {history.length===0&&<p style={{color:theme.textMuted,textAlign:"center",fontSize:"13px",padding:"30px 0",fontFamily:"'DM Sans',sans-serif"}}>Sem histórico ainda.</p>}
      </div>
    </div>
  );
}

function ExerciseRow({exercise,onChange,onDelete,onShowHistory,theme,readonly}){
  const [prevW,setPrevW]=useState(exercise.weight);
  const hasH=(exercise.weightHistory||[]).length>0;
  const last=hasH?exercise.weightHistory[exercise.weightHistory.length-1]:null;
  const fmt=iso=>new Date(iso).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
  const handleBlur=val=>{
    if(val&&val!==prevW){
      const entry={weight:val,reps:exercise.reps,rp:exercise.rp,date:new Date().toISOString()};
      onChange({...exercise,weight:val,weightHistory:[...(exercise.weightHistory||[]),entry]});
      setPrevW(val);
    }
  };
  return(
    <div style={{padding:"10px",background:theme.bgCard,borderRadius:"12px",border:`1px solid ${theme.bgCardBorder}`,marginBottom:"8px",opacity:readonly?.72:1}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 80px 60px 80px 36px",gap:"6px",alignItems:"center"}}>
        <div>
          <span style={{color:theme.text,fontSize:"13px",fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>{exercise.machine}</span>
          {last&&<p style={{color:theme.textMuted,fontSize:"10px",margin:"2px 0 0",fontFamily:"'DM Sans',sans-serif"}}>atualizado {fmt(last.date)}</p>}
        </div>
        <input type="text" placeholder="kg" defaultValue={exercise.weight} disabled={readonly}
          onBlur={e=>!readonly&&handleBlur(e.target.value)}
          onChange={e=>!readonly&&onChange({...exercise,weight:e.target.value})}
          style={{background:theme.inputBg,border:`1px solid ${theme.inputBorder}`,borderRadius:"7px",color:theme.accent,fontSize:"13px",padding:"6px 7px",width:"100%",textAlign:"center",fontFamily:"'DM Mono',monospace",outline:"none"}}
        />
        <input type="number" placeholder="RP" value={exercise.rp} disabled={readonly}
          onChange={e=>!readonly&&onChange({...exercise,rp:e.target.value})}
          style={{background:theme.inputBg,border:`1px solid ${theme.inputBorder}`,borderRadius:"7px",color:theme.green,fontSize:"13px",padding:"6px 7px",width:"100%",textAlign:"center",fontFamily:"'DM Mono',monospace",outline:"none"}}
        />
        <select value={exercise.reps} disabled={readonly}
          onChange={e=>!readonly&&onChange({...exercise,reps:e.target.value})}
          style={{background:theme.inputBg,border:`1px solid ${theme.inputBorder}`,borderRadius:"7px",color:theme.blue,fontSize:"12px",padding:"6px 3px",width:"100%",textAlign:"center",fontFamily:"'DM Mono',monospace",outline:"none"}}
        >
          <option value="">rep</option>
          {repOptions.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={onDelete} disabled={readonly} style={{background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.2)",borderRadius:"7px",color:"#ff6b6b",fontSize:"15px",cursor:readonly?"default":"pointer",padding:"4px 0",width:"36px",display:"flex",alignItems:"center",justifyContent:"center",opacity:readonly?.4:1}}>×</button>
      </div>
      <button onClick={onShowHistory} style={{marginTop:"8px",width:"100%",background:hasH?`${theme.accent}10`:"transparent",border:hasH?`1px solid ${theme.accent}25`:`1px solid ${theme.bgCardBorder}`,borderRadius:"8px",padding:"6px",color:hasH?theme.accent:theme.textMuted,fontSize:"11px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>
        <span>📈</span>{hasH?`Ver evolução · ${(exercise.weightHistory||[]).length} registros`:"Sem histórico ainda"}
      </button>
    </div>
  );
}

function AddMachineModal({group,onAdd,onClose,existingMachines,theme}){
  const [custom,setCustom]=useState("");
  const suggestions=defaultMachines[group].filter(m=>!existingMachines.includes(m));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{background:theme.modalBg,border:`1px solid ${theme.bgCardBorder}`,borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:"480px",maxHeight:"70vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:"36px",height:"4px",background:`${theme.accent}50`,borderRadius:"2px",margin:"0 auto 20px"}}/>
        <p style={{color:theme.textSub,fontSize:"11px",textTransform:"uppercase",letterSpacing:"2px",marginBottom:"14px",fontFamily:"'DM Sans',sans-serif"}}>Adicionar · {group==="lower"?"Lower Body":"Upper Body"}</p>
        <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
          <input placeholder="Nome personalizado..." value={custom} onChange={e=>setCustom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&custom.trim()&&onAdd(custom.trim())}
            style={{flex:1,background:theme.inputBg,border:`1px solid ${theme.inputBorder}`,borderRadius:"10px",color:theme.text,fontSize:"14px",padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none"}}
          />
          <button onClick={()=>custom.trim()&&onAdd(custom.trim())} style={{background:theme.accent,border:"none",borderRadius:"10px",color:theme.accentText,fontWeight:700,fontSize:"14px",padding:"10px 16px",cursor:"pointer"}}>+</button>
        </div>
        {suggestions.length>0&&(<><p style={{color:theme.textMuted,fontSize:"11px",marginBottom:"10px",fontFamily:"'DM Sans',sans-serif"}}>SUGESTÕES</p><div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>{suggestions.map(s=><button key={s} onClick={()=>onAdd(s)} style={{background:theme.bgCard,border:`1px solid ${theme.bgCardBorder}`,borderRadius:"20px",color:theme.textSub,fontSize:"12px",padding:"6px 12px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{s}</button>)}</div></>)}
      </div>
    </div>
  );
}

function SessionView({session,onUpdate,theme,onFinish}){
  const [modal,setModal]=useState(null);
  const [histModal,setHistModal]=useState(null);
  const readonly=session.status==="done";
  const isActive=session.status==="active";
  const timer=useTimer(session.startedAt,isActive);
  const dur=calcDuration(session.startedAt,session.finishedAt);
  const addEx=(group,machine)=>{onUpdate({...session,[group]:[...(session[group]||[]),{id:Date.now(),machine,weight:"",rp:"",reps:"",weightHistory:[]}]});setModal(null);};
  const updEx=(group,id,data)=>onUpdate({...session,[group]:session[group].map(e=>e.id===id?{...e,...data}:e)});
  const delEx=(group,id)=>onUpdate({...session,[group]:session[group].filter(e=>e.id!==id)});
  const groups=[{key:"lower",label:"Lower Body",emoji:"🦵",color:theme.green},{key:"upper",label:"Upper Body",emoji:"💪",color:theme.blue}];
  const histEx=histModal?[...(session.lower||[]),...(session.upper||[])].find(e=>e.id===histModal):null;
  return(
    <div>
      <div style={{borderRadius:"16px",marginBottom:"20px",border:session.status==="done"?`1px solid ${theme.green}40`:session.status==="active"?`1px solid ${theme.accent}35`:`1px solid ${theme.bgCardBorder}`,background:session.status==="done"?`${theme.green}10`:session.status==="active"?`${theme.accent}08`:theme.bgCard}}>
        <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"22px"}}>{session.status==="done"?"✅":session.status==="active"?"🔥":"⏸️"}</span>
            <div>
              <p style={{color:session.status==="done"?theme.green:session.status==="active"?theme.accent:theme.textSub,fontSize:"11px",fontWeight:700,margin:0,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:"1.5px"}}>
                {session.status==="done"?"Treino Finalizado":session.status==="active"?"Em Andamento":"Não Iniciado"}
              </p>
              {session.status==="active"&&<p style={{color:theme.accent,fontSize:"22px",fontWeight:700,margin:"2px 0 0",fontFamily:"'DM Mono',monospace",letterSpacing:"2px"}}>{timer}</p>}
              {session.status==="done"&&dur&&<p style={{color:theme.textSub,fontSize:"12px",margin:"3px 0 0",fontFamily:"'DM Sans',sans-serif"}}>Duração: <strong>{dur}</strong></p>}
              {session.status==="pending"&&<p style={{color:theme.textMuted,fontSize:"12px",margin:"3px 0 0",fontFamily:"'DM Sans',sans-serif"}}>Toque em Iniciar quando estiver pronto</p>}
            </div>
          </div>
          {session.status==="pending"&&<button onClick={()=>onUpdate({...session,status:"active",startedAt:Date.now()})} style={{background:theme.accent,border:"none",borderRadius:"12px",color:theme.accentText,fontWeight:800,fontSize:"14px",padding:"12px 20px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${theme.accent}40`}}>▶ Iniciar</button>}
          {session.status==="active"&&<button onClick={onFinish} style={{background:theme.green,border:"none",borderRadius:"12px",color:"#fff",fontWeight:800,fontSize:"14px",padding:"12px 18px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 16px ${theme.green}40`}}>✓ Finalizar</button>}
          {session.status==="done"&&<button onClick={()=>onUpdate({...session,status:"active",finishedAt:null})} style={{background:theme.bgCard,border:`1px solid ${theme.bgCardBorder}`,borderRadius:"10px",color:theme.textSub,fontSize:"12px",padding:"8px 12px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>↩ Reabrir</button>}
        </div>
      </div>
      {groups.map(g=>(
        <div key={g.key} style={{marginBottom:"24px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontSize:"15px"}}>{g.emoji}</span>
              <span style={{color:g.color,fontSize:"12px",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif"}}>{g.label}</span>
              <span style={{color:theme.textMuted,fontSize:"11px",fontFamily:"'DM Sans',sans-serif"}}>({session[g.key]?.length||0})</span>
            </div>
            {!readonly&&<button onClick={()=>setModal(g.key)} style={{background:theme.bgCard,border:`1px solid ${theme.bgCardBorder}`,borderRadius:"8px",color:theme.textSub,fontSize:"12px",padding:"5px 10px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Máquina</button>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 80px 60px 80px 36px",gap:"6px",padding:"4px 10px",marginBottom:"4px"}}>
            {["Máquina","Peso","RP","Reps",""].map((h,i)=><span key={i} style={{color:theme.textMuted,fontSize:"10px",textTransform:"uppercase",letterSpacing:"1.5px",textAlign:i>0?"center":"left",fontFamily:"'DM Sans',sans-serif"}}>{h}</span>)}
          </div>
          {(session[g.key]||[]).length===0?(
            <div style={{textAlign:"center",padding:"18px",color:theme.textMuted,fontSize:"12px",fontFamily:"'DM Sans',sans-serif",border:`1px dashed ${theme.bgCardBorder}`,borderRadius:"10px"}}>
              {readonly?"Nenhum exercício registrado":"Adicione uma máquina"}
            </div>
          ):(session[g.key]||[]).map(ex=>(
            <ExerciseRow key={ex.id} exercise={ex} theme={theme} readonly={readonly}
              onChange={data=>updEx(g.key,ex.id,data)}
              onDelete={()=>delEx(g.key,ex.id)}
              onShowHistory={()=>setHistModal(ex.id)}
            />
          ))}
        </div>
      ))}
      {modal&&<AddMachineModal group={modal} theme={theme} onAdd={m=>addEx(modal,m)} onClose={()=>setModal(null)} existingMachines={(session[modal]||[]).map(e=>e.machine)}/>}
      {histEx&&<HistoryModal machine={histEx.machine} history={histEx.weightHistory||[]} theme={theme} onClose={()=>setHistModal(null)}/>}
    </div>
  );
}

function MetricsView({sessions,theme}){
  const T=theme;
  const doneSessions=sessions.filter(s=>s.status==="done");
  const allExercises=sessions.flatMap(s=>[...(s.lower||[]).map(e=>({...e,group:"lower",date:s.date})),...(s.upper||[]).map(e=>({...e,group:"upper",date:s.date}))]);
  const totalLower=sessions.reduce((a,s)=>a+(s.lower?.length||0),0);
  const totalUpper=sessions.reduce((a,s)=>a+(s.upper?.length||0),0);
  const totalSessions=sessions.length;
  const totalDone=doneSessions.length;
  const totalKgLifted=allExercises.reduce((acc,ex)=>acc+(ex.weightHistory||[]).reduce((a,h)=>a+(parseFloat(h.weight)||0),0),0);
  const sessionDays=[...new Set(doneSessions.map(s=>s.date.slice(0,10)))].sort();
  let bestStreak=0,cur=0;
  for(let i=0;i<sessionDays.length;i++){cur=i===0?1:(()=>{const d=(new Date(sessionDays[i])-new Date(sessionDays[i-1]))/(1000*60*60*24);return d===1?cur+1:1;})();if(cur>bestStreak)bestStreak=cur;}
  let streak=0;
  if(sessionDays.length){const today=new Date().toISOString().slice(0,10);const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);const last=sessionDays[sessionDays.length-1];if(last===today||last===yesterday){streak=1;for(let i=sessionDays.length-2;i>=0;i--){const d=(new Date(sessionDays[i+1])-new Date(sessionDays[i]))/(1000*60*60*24);if(d===1)streak++;else break;}}}
  const durations=doneSessions.filter(s=>s.startedAt&&s.finishedAt).map(s=>Math.floor((s.finishedAt-s.startedAt)/60000));
  const avgDur=durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):0;
  const lowerPct=(totalLower+totalUpper)>0?Math.round(totalLower/(totalLower+totalUpper)*100):50;
  const upperPct=100-lowerPct;
  const machineCount={};
  allExercises.forEach(e=>{machineCount[e.machine]=(machineCount[e.machine]||0)+1;});
  const topMachines=Object.entries(machineCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const machinePRs={};
  allExercises.forEach(ex=>{const best=Math.max(...(ex.weightHistory||[]).map(h=>parseFloat(h.weight)||0),0);if(best>0)machinePRs[ex.machine]=Math.max(machinePRs[ex.machine]||0,best);});
  const coiceCount=allExercises.filter(e=>e.machine.toLowerCase().includes("abdutora")).length;
  const coiceLevels=[{min:0,label:"Potro 🐴"},{min:5,label:"Égua Treinada 🐎"},{min:15,label:"Cavala Braba 🌪️"},{min:30,label:"Égua Lendária 👑"}];
  const coiceLevel=[...coiceLevels].reverse().find(l=>coiceCount>=l.min)||coiceLevels[0];
  const abCount=allExercises.filter(e=>e.machine.toLowerCase().includes("adutora")).length;
  const abLevels=[{min:0,label:"Fechadinha 🌸"},{min:5,label:"Abrindo o Jogo 🦋"},{min:15,label:"Borboleta Livre 🌺"},{min:30,label:"Rainha do Abre & Fecha 👸"}];
  const abLevel=[...abLevels].reverse().find(l=>abCount>=l.min)||abLevels[0];
  const bundaCount=totalLower;
  const bundaLevels=[{min:0,label:"Bunda Newbie 🌱"},{min:10,label:"Bunda Promissora 🌿"},{min:25,label:"Bunda em Construção 🧱"},{min:45,label:"Bunda Notável 🔥"},{min:70,label:"Bunda Respeitável 👏"},{min:100,label:"Bunda Lendária 👑"},{min:150,label:"BUNDA NA NUCA 🚀"}];
  const bundaLevel=[...bundaLevels].reverse().find(l=>bundaCount>=l.min)||bundaLevels[0];
  const nextBunda=bundaLevels.find(l=>bundaCount<l.min)||bundaLevels[bundaLevels.length-1];
  const bundaPct=Math.min(100,Math.round((bundaCount/(nextBunda.min||1))*100));
  const kgLevels=[{min:0,label:"Levantou um Chihuahua 🐕"},{min:500,label:"Levantou um Panda 🐼"},{min:2000,label:"Levantou uma Vaca 🐄"},{min:5000,label:"Levantou um Elefante Baby 🐘"},{min:15000,label:"Levantou um Carro 🚗"},{min:50000,label:"Levantou um Caminhão 🚛"}];
  const kgLevel=[...kgLevels].reverse().find(l=>totalKgLifted>=l.min)||kgLevels[0];
  const ratLevels=[{min:0,label:"Visitante Ocasional 🚶"},{min:3,label:"Frequentadora 🏃"},{min:7,label:"Academia Rat 🐀"},{min:14,label:"Viciada no Ferro 💊"},{min:21,label:"A Gym É Minha Casa 🏠"}];
  const ratLevel=[...ratLevels].reverse().find(l=>streak>=l.min)||ratLevels[0];
  const Bar=({pct,color,h=8})=>(<div style={{background:T.bgCard,borderRadius:"99px",height:`${h}px`,overflow:"hidden",border:`1px solid ${T.bgCardBorder}`}}><div style={{height:"100%",width:`${Math.min(100,pct)}%`,background:color,borderRadius:"99px",transition:"width .6s ease"}}/></div>);
  const Card=({children,style={}})=>(<div style={{background:T.bgCard,border:`1px solid ${T.bgCardBorder}`,borderRadius:"16px",padding:"16px",marginBottom:"12px",...style}}>{children}</div>);
  const Label=({children,color})=>(<span style={{background:`${color||T.accent}20`,color:color||T.accent,fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"20px",fontFamily:"'DM Sans',sans-serif"}}>{children}</span>);
  if(sessions.length===0) return(<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:"48px",marginBottom:"16px"}}>📊</div><p style={{color:T.textSub,fontSize:"14px",lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>Faça pelo menos um treino<br/>para ver suas métricas!</p></div>);
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
      {[{label:"Treinos",value:totalSessions,sub:`${totalDone} finalizados`},{label:"Exercícios",value:totalLower+totalUpper,sub:`${totalLower}L · ${totalUpper}U`},{label:"Streak",value:`${streak}🔥`,sub:`melhor: ${bestStreak} dias`}].map((s,i)=>(
        <div key={i} style={{background:T.bgCard,border:`1px solid ${T.bgCardBorder}`,borderRadius:"14px",padding:"14px 10px",textAlign:"center"}}>
          <p style={{color:T.accent,fontSize:"22px",fontWeight:800,margin:0,fontFamily:"'DM Mono',monospace"}}>{s.value}</p>
          <p style={{color:T.text,fontSize:"11px",fontWeight:600,margin:"4px 0 2px",fontFamily:"'DM Sans',sans-serif"}}>{s.label}</p>
          <p style={{color:T.textMuted,fontSize:"10px",margin:0,fontFamily:"'DM Sans',sans-serif"}}>{s.sub}</p>
        </div>
      ))}
    </div>
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
        <p style={{color:T.textSub,fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",margin:0}}>Upper vs Lower</p>
        <div style={{display:"flex",gap:"8px"}}><Label color={T.green}>🦵 {lowerPct}%</Label><Label color={T.blue}>💪 {upperPct}%</Label></div>
      </div>
      <div style={{display:"flex",gap:"4px",height:"28px",borderRadius:"10px",overflow:"hidden"}}>
        <div style={{flex:lowerPct,background:T.green,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:"11px",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{lowerPct>10?"Lower":""}</span></div>
        <div style={{flex:upperPct,background:T.blue,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:"11px",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{upperPct>10?"Upper":""}</span></div>
      </div>
      <p style={{color:T.textMuted,fontSize:"11px",margin:"10px 0 0",fontFamily:"'DM Sans',sans-serif",textAlign:"center"}}>{lowerPct>upperPct?"Foco total no fundão 🍑":"Parte de cima tá dominando 💪"}</p>
    </Card>
    <Card style={{border:`1px solid #e879f930`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
        <div><p style={{color:"#e879f9",fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",margin:0}}>🍑 Meta Bumbum na Nuca</p><p style={{color:T.text,fontSize:"18px",fontWeight:800,margin:"4px 0 0",fontFamily:"'DM Sans',sans-serif"}}>{bundaLevel.label}</p></div>
        <div style={{textAlign:"right"}}><p style={{color:"#e879f9",fontSize:"24px",fontWeight:800,margin:0,fontFamily:"'DM Mono',monospace"}}>{bundaCount}</p><p style={{color:T.textMuted,fontSize:"10px",margin:0,fontFamily:"'DM Sans',sans-serif"}}>exercícios lower</p></div>
      </div>
      <Bar pct={bundaPct} color="#e879f9" h={10}/>
      <p style={{color:T.textMuted,fontSize:"11px",margin:"8px 0 0",fontFamily:"'DM Sans',sans-serif"}}>{bundaCount<nextBunda.min?`Faltam ${nextBunda.min-bundaCount} para: ${nextBunda.label}`:"🎉 Nível máximo!"}</p>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
      <div style={{background:T.bgCard,border:`1px solid #ff7eb330`,borderRadius:"14px",padding:"14px"}}>
        <p style={{color:"#ff7eb3",fontSize:"20px",margin:"0 0 4px"}}>🐴</p>
        <p style={{color:T.text,fontSize:"12px",fontWeight:700,margin:"0 0 2px",fontFamily:"'DM Sans',sans-serif"}}>Coice da Égua</p>
        <p style={{color:"#ff7eb3",fontSize:"11px",fontWeight:600,margin:"0 0 6px",fontFamily:"'DM Sans',sans-serif"}}>{coiceLevel.label}</p>
        <p style={{color:T.textMuted,fontSize:"11px",margin:"0 0 8px",fontFamily:"'DM Sans',sans-serif"}}>{coiceCount} abdutoras</p>
        <Bar pct={Math.min(100,(coiceCount/30)*100)} color="#ff7eb3" h={6}/>
      </div>
      <div style={{background:T.bgCard,border:`1px solid #a78bfa30`,borderRadius:"14px",padding:"14px"}}>
        <p style={{color:"#a78bfa",fontSize:"20px",margin:"0 0 4px"}}>🦋</p>
        <p style={{color:T.text,fontSize:"12px",fontWeight:700,margin:"0 0 2px",fontFamily:"'DM Sans',sans-serif"}}>Abre & Fecha</p>
        <p style={{color:"#a78bfa",fontSize:"11px",fontWeight:600,margin:"0 0 6px",fontFamily:"'DM Sans',sans-serif"}}>{abLevel.label}</p>
        <p style={{color:T.textMuted,fontSize:"11px",margin:"0 0 8px",fontFamily:"'DM Sans',sans-serif"}}>{abCount} adutoras</p>
        <Bar pct={Math.min(100,(abCount/30)*100)} color="#a78bfa" h={6}/>
      </div>
    </div>
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
        <p style={{color:T.textSub,fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",margin:0}}>⚡ Força Total</p>
        <p style={{color:T.accent,fontSize:"20px",fontWeight:800,margin:0,fontFamily:"'DM Mono',monospace"}}>{totalKgLifted.toLocaleString("pt-BR")} kg</p>
      </div>
      <p style={{color:T.text,fontSize:"14px",fontWeight:600,margin:"0 0 4px",fontFamily:"'DM Sans',sans-serif"}}>{kgLevel.label}</p>
      <p style={{color:T.textMuted,fontSize:"11px",margin:0,fontFamily:"'DM Sans',sans-serif"}}>Total acumulado de kg levantados</p>
    </Card>
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
        <p style={{color:T.textSub,fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",margin:0}}>📅 Constância</p>
        <Label>{ratLevel.label}</Label>
      </div>
      <p style={{color:T.textMuted,fontSize:"11px",margin:"4px 0 10px",fontFamily:"'DM Sans',sans-serif"}}>{streak} dias seguidos · melhor: {bestStreak} dias</p>
      <Bar pct={Math.min(100,(streak/21)*100)} color={T.accent} h={8}/>
    </Card>
    {avgDur>0&&(<Card><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><p style={{color:T.textSub,fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",margin:0}}>⏱ Tempo Médio</p><p style={{color:T.text,fontSize:"14px",fontWeight:600,margin:"4px 0 0",fontFamily:"'DM Sans',sans-serif"}}>{avgDur>=60?`${Math.floor(avgDur/60)}h ${avgDur%60}min`:`${avgDur} min`} por treino</p></div><p style={{color:T.accent,fontSize:"32px",margin:0}}>{avgDur<30?"⚡":avgDur<60?"🔥":"🦾"}</p></div></Card>)}
    {topMachines.length>0&&(<Card><p style={{color:T.textSub,fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",margin:"0 0 12px"}}>🏆 Suas Favoritas</p>{topMachines.map(([name,count],i)=>{const p=getPersona(name);const pct=Math.round((count/topMachines[0][1])*100);return(<div key={name} style={{marginBottom:"10px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}><div style={{display:"flex",alignItems:"center",gap:"6px"}}><span style={{fontSize:"14px"}}>{p.emoji}</span><span style={{color:T.text,fontSize:"12px",fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>{p.name}</span>{i===0&&<span style={{background:`${T.accent}20`,color:T.accent,fontSize:"9px",padding:"1px 6px",borderRadius:"10px",fontFamily:"'DM Sans',sans-serif"}}>favorita</span>}</div><span style={{color:T.textSub,fontSize:"11px",fontFamily:"'DM Mono',monospace"}}>{count}x</span></div><Bar pct={pct} color={p.color} h={6}/></div>);})}</Card>)}
    {Object.keys(machinePRs).length>0&&(<Card><p style={{color:T.textSub,fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",margin:"0 0 12px"}}>🥇 Meus PRs</p><div style={{display:"flex",flexDirection:"column",gap:"6px"}}>{Object.entries(machinePRs).sort((a,b)=>b[1]-a[1]).map(([name,kg])=>{const p=getPersona(name);return(<div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:`${p.color}10`,border:`1px solid ${p.color}25`,borderRadius:"10px"}}><div style={{display:"flex",alignItems:"center",gap:"6px"}}><span style={{fontSize:"14px"}}>{p.emoji}</span><span style={{color:T.text,fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>{p.name}</span></div><span style={{color:p.color,fontSize:"14px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{kg}kg</span></div>);})}</div></Card>)}
  </div>);
}

export default function Pumpi(){
  const [data,setData]=useState({sessions:[]});
  const [activeSession,setActiveSession]=useState(null);
  const [tab,setTab]=useState("home");
  const [loaded,setLoaded]=useState(false);
  const [theme,setTheme]=useState(getTimeTheme());
  const [celebration,setCelebration]=useState(false);
  const T=theme;
  useEffect(()=>{const id=setInterval(()=>setTheme(getTimeTheme()),60000);return()=>clearInterval(id);},[]);
  useEffect(()=>{(async()=>{try{const s=await window.storage.get(STORAGE_KEY);if(s?.value)setData(JSON.parse(s.value));}catch{}setLoaded(true);})();},[]);
  const save=async nd=>{setData(nd);try{await window.storage.set(STORAGE_KEY,JSON.stringify(nd));}catch{}};
  const newSession=()=>{const s={id:Date.now(),date:new Date().toISOString(),status:"pending",startedAt:null,finishedAt:null,lower:[],upper:[]};save({...data,sessions:[s,...data.sessions]});setActiveSession(s.id);setTab("session");};
  const updateSession=updated=>{save({...data,sessions:data.sessions.map(s=>s.id===updated.id?updated:s)});setActiveSession(updated.id);};
  const finishSession=()=>{const s=data.sessions.find(s=>s.id===activeSession);if(!s)return;const updated={...s,status:"done",finishedAt:Date.now()};save({...data,sessions:data.sessions.map(s=>s.id===activeSession?updated:s)});setCelebration(true);};
  const deleteSession=id=>{save({...data,sessions:data.sessions.filter(s=>s.id!==id)});setTab("home");};
  const currentSession=data.sessions.find(s=>s.id===activeSession);
  const totalEx=s=>(s.lower?.length||0)+(s.upper?.length||0);
  const statusBadge=s=>{
    if(s.status==="done")   return{label:"✅ Finalizado",  color:T.green, bg:`${T.green}18`};
    if(s.status==="active") return{label:"🔥 Em andamento",color:T.accent,bg:`${T.accent}18`};
    return                        {label:"⏸ Não iniciado", color:T.textMuted,bg:T.bgCard};
  };
  if(!loaded) return <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:T.accent,fontFamily:"'DM Sans',sans-serif"}}>🍑</span></div>;
  return(
    <div style={{background:T.bg,minHeight:"100vh",maxWidth:"480px",margin:"0 auto",fontFamily:"'DM Sans',sans-serif",paddingBottom:"80px",transition:"background 2s ease"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder{color:${T.textMuted}!important;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        select option{background:${T.modalBg};color:${T.text};}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:2px;}
      `}</style>
      {celebration&&currentSession&&<CelebrationModal theme={T} session={currentSession} onClose={()=>setCelebration(false)}/>}
      <div style={{padding:"calc(env(safe-area-inset-top) + 20px) 20px 16px",borderBottom:`1px solid ${T.divider}`,position:"sticky",top:0,background:T.header,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          {tab==="session"?(
            <button onClick={()=>setTab("home")} style={{background:"none",border:"none",color:T.accent,fontSize:"14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Voltar</button>
          ):(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                <span style={{fontSize:"16px"}}>🍑</span>
                <span style={{color:T.accent,fontSize:"16px",fontWeight:800,fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.3px"}}>Pumpi</span>
                <span style={{color:T.textMuted,fontSize:"10px",letterSpacing:"1px",fontFamily:"'DM Sans',sans-serif"}}>{T.icon}</span>
              </div>
              <p style={{color:T.textSub,fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Progresso de Treino</p>
            </div>
          )}
          {tab==="home"&&<button onClick={newSession} style={{background:T.accent,border:"none",borderRadius:"12px",color:T.accentText,fontWeight:700,fontSize:"13px",padding:"10px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Nova Sessão</button>}
          {tab==="session"&&currentSession&&<div style={{textAlign:"right"}}><p style={{color:T.textSub,fontSize:"11px",fontFamily:"'DM Sans',sans-serif"}}>{new Date(currentSession.date).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</p><p style={{color:T.textMuted,fontSize:"10px",marginTop:"2px",fontFamily:"'DM Sans',sans-serif"}}>{totalEx(currentSession)} exercícios</p></div>}
        </div>
      </div>
      <div style={{padding:"20px"}}>
        {tab==="home"&&(data.sessions.length===0?(
          <div style={{textAlign:"center",padding:"70px 20px"}}>
            <div style={{fontSize:"56px",marginBottom:"16px"}}>🍑</div>
            <p style={{color:T.textSub,fontSize:"14px",lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>Bem-vinda ao Pumpi!<br/>Toque em "+ Nova Sessão" para começar.</p>
          </div>
        ):data.sessions.map(s=>{
          const total=totalEx(s),badge=statusBadge(s),dur=calcDuration(s.startedAt,s.finishedAt);
          return(
            <div key={s.id} onClick={()=>{setActiveSession(s.id);setTab("session");}} style={{background:T.bgCard,border:`1px solid ${T.bgCardBorder}`,borderRadius:"16px",padding:"16px",marginBottom:"10px",cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:total>0?"10px":"0"}}>
                <div>
                  <p style={{color:T.text,fontWeight:600,fontSize:"15px",fontFamily:"'DM Sans',sans-serif"}}>{new Date(s.date).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</p>
                  <p style={{color:T.textSub,fontSize:"12px",marginTop:"3px",fontFamily:"'DM Sans',sans-serif"}}>{s.lower?.length||0} lower · {s.upper?.length||0} upper{dur?` · ${dur}`:""}</p>
                </div>
                <span style={{background:badge.bg,color:badge.color,borderRadius:"8px",padding:"4px 10px",fontSize:"11px",fontWeight:600,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{badge.label}</span>
              </div>
              {total>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>{[...(s.lower||[]),...(s.upper||[])].slice(0,4).map((ex,i)=><span key={i} style={{background:T.bgCard,border:`1px solid ${T.bgCardBorder}`,borderRadius:"6px",padding:"3px 8px",color:T.textSub,fontSize:"11px",fontFamily:"'DM Sans',sans-serif"}}>{ex.machine}{ex.weight?` · ${ex.weight}kg`:""}</span>)}{total>4&&<span style={{color:T.textMuted,fontSize:"11px",padding:"3px 0",fontFamily:"'DM Sans',sans-serif"}}>+{total-4} mais</span>}</div>}
            </div>
          );
        }))}
        {tab==="session"&&currentSession&&(<><SessionView session={currentSession} onUpdate={updateSession} theme={T} onFinish={finishSession}/><button onClick={()=>deleteSession(currentSession.id)} style={{marginTop:"24px",background:"transparent",border:`1px solid ${T.danger}30`,borderRadius:"12px",color:T.danger,fontSize:"13px",padding:"12px",width:"100%",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:.6}}>Excluir sessão</button></>)}
        {tab==="metrics"&&<MetricsView sessions={data.sessions} theme={T}/>}
      </div>
      {tab!=="session"&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",background:T.header,borderTop:`1px solid ${T.divider}`,display:"flex",zIndex:20}}>
          {[{id:"home",label:"Treinos",icon:"🏠"},{id:"metrics",label:"Métricas",icon:"📊"}].map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1,padding:"14px 0 18px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
              <span style={{fontSize:"20px"}}>{n.icon}</span>
              <span style={{color:tab===n.id?T.accent:T.textMuted,fontSize:"10px",fontWeight:tab===n.id?700:400,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.5px"}}>{n.label}</span>
              {tab===n.id&&<div style={{width:"20px",height:"2px",background:T.accent,borderRadius:"1px"}}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
