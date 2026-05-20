import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nibdvppatasucybzfzet.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYmR2cHBhdGFzdWN5YnpmemV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDI1NTUsImV4cCI6MjA5NDUxODU1NX0.H4lPCHC-bdlrf1JEXzWd1x-kzHeSdpFq6UFIepjhGUk";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    storageKey: "pumpi_auth",
    storage: {
      getItem: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
      setItem: (key, value) => { try { localStorage.setItem(key, value); } catch {} },
      removeItem: (key) => { try { localStorage.removeItem(key); } catch {} },
    },
  },
});

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

// Mescla sessões do Supabase com localStorage preservando weightHistory
function mergeSessions(remote,local){
  return remote.map(r=>{
    const l=local.find(s=>s.id===r.id);
    if(!l) return r;
    const mergeExs=(remExs=[],locExs=[])=>remExs.map(ex=>{
      const locEx=locExs.find(e=>e.machine===ex.machine);
      const rh=ex.weightHistory||[];
      const lh=locEx?.weightHistory||[];
      return{...ex,weightHistory:rh.length>=lh.length?rh:lh};
    });
    return{...r,lower:mergeExs(r.lower,l.lower),upper:mergeExs(r.upper,l.upper)};
  });
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

function LoginScreen({theme,onLogin}){
  const T=theme;
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [username,setUsername]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");

  const handleSubmit=async()=>{
    setLoading(true); setError(""); setSuccess("");
    try{
      if(mode==="login"){
        const{data,error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        if(data.user) onLogin(data.user);
      } else {
        const{data,error}=await supabase.auth.signUp({email,password});
        if(error) throw error;
        if(data.user){
          await supabase.from("profiles").upsert({
            id:data.user.id,
            username:username.trim().toLowerCase(),
            email:email.trim().toLowerCase()
          },{onConflict:"id"});
          if(data.session) onLogin(data.user);
          else setSuccess("Conta criada! Verifique seu email para confirmar. 🍑");
        }
      }
    } catch(e){ setError(e.message||"Erro ao entrar"); }
    setLoading(false);
  };

  const handleForgotPassword=async()=>{
    if(!email){setError("Digite seu email primeiro!");return;}
    setLoading(true);
    const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:"https://pumpi-two.vercel.app/confirmed.html"});
    if(error) setError(error.message);
    else setSuccess("Email de recuperação enviado! 🍑");
    setLoading(false);
  };

  const inp={background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:"12px",color:T.text,fontSize:"15px",padding:"14px 16px",width:"100%",fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:"10px"};

  return(
    <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{width:"100%",maxWidth:"360px"}}>
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <div style={{fontSize:"64px",marginBottom:"12px"}}>🍑</div>
          <h1 style={{color:T.accent,fontSize:"28px",fontWeight:800,fontFamily:"'DM Sans',sans-serif"}}>Pumpi</h1>
          <p style={{color:T.textSub,fontSize:"13px",fontFamily:"'DM Sans',sans-serif",marginTop:"4px"}}>Progresso de Treino</p>
        </div>
        <div style={{display:"flex",background:T.bgCard,borderRadius:"12px",padding:"4px",marginBottom:"20px",border:`1px solid ${T.bgCardBorder}`}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,padding:"10px",background:mode===m?T.accent:"transparent",border:"none",borderRadius:"8px",color:mode===m?T.accentText:T.textSub,fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              {m==="login"?"Entrar":"Cadastrar"}
            </button>
          ))}
        </div>
        {mode==="signup"&&<input placeholder="Username (ex: laura)" value={username} onChange={e=>setUsername(e.target.value)} style={inp}/>}
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} type="email" style={inp}/>
        <input placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} type="password" style={{...inp,marginBottom:"16px"}}/>
        {error&&<p style={{color:T.danger,fontSize:"12px",fontFamily:"'DM Sans',sans-serif",marginBottom:"10px",textAlign:"center"}}>{error}</p>}
        {success&&<p style={{color:T.green,fontSize:"12px",fontFamily:"'DM Sans',sans-serif",marginBottom:"10px",textAlign:"center"}}>{success}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{background:T.accent,border:"none",borderRadius:"14px",color:T.accentText,fontWeight:800,fontSize:"16px",padding:"16px",width:"100%",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:loading?.7:1}}>
          {loading?"...":(mode==="login"?"Entrar 🍑":"Criar conta 🍑")}
        </button>
        {mode==="login"&&(
          <button onClick={handleForgotPassword} disabled={loading} style={{background:"none",border:"none",color:T.textMuted,fontSize:"13px",cursor:"pointer",width:"100%",marginTop:"14px",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline"}}>
            Esqueci minha senha
          </button>
        )}
      </div>
    </div>
  );
}
