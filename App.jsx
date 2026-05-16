import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Dumbbell, Play, Pause, RotateCcw, CheckCircle2, Circle,
  TrendingUp, Timer, Heart, Zap, RefreshCw, Moon,
  ChevronDown, ChevronUp
} from "lucide-react";

/* ─── FONTS & CSS VARS ───────────────────────────────────────────────────── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&family=Barlow:wght@300;400;500;600&display=swap');
    :root {
      --gold:#DDAD30; --gold-dim:#a07e1f; --cream:#E4DBC6;
      --navy:#0C2C47; --forest:#2E5749; --mint:#99E4D6;
      --bg:#0a0a0a; --s1:#111111; --s2:#1a1a1a; --s3:#222222; --bd:#1e1e1e;
    }
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    body{margin:0;background:var(--bg);color:#fff;font-family:'Barlow',sans-serif;-webkit-font-smoothing:antialiased}
    .fn-d{font-family:'Bebas Neue',sans-serif;letter-spacing:.04em}
    .fn-c{font-family:'Barlow Condensed',sans-serif}
    /* grain */
    .grain::after{content:'';position:fixed;inset:0;pointer-events:none;opacity:.03;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:128px;z-index:9999}
    .gold-tx{background:linear-gradient(135deg,#f0c84a,#DDAD30,#a07e1f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
    input[type=number]{-moz-appearance:textfield}
    ::-webkit-scrollbar{width:3px;height:3px}
    ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}
    .pf{transition:width .4s ease}
    .ec{transition:border-color .15s}
    .btn-press:active{transform:scale(.97)}
    .bnav{padding-bottom:env(safe-area-inset-bottom,0)}
    /* toggle */
    .tog{width:52px;height:28px;border-radius:14px;border:1px solid #2a2a2a;background:var(--s2);position:relative;cursor:pointer;transition:background .2s,border-color .2s}
    .tog.on{background:var(--gold);border-color:var(--gold)}
    .tog-th{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 2px 6px rgba(0,0,0,.4)}
    .tog.on .tog-th{transform:translateX(24px)}
  `}</style>
);

/* ─── DATA ───────────────────────────────────────────────────────────────── */
const STRETCHES = [
  "Butterfly Position","Child's Pose","Knee to Chest","Bridge",
  "Cobra Stretch","Hip Flexor Stretch","Straight Leg Forward Fold",
  "Standing Quad Stretch","Hamstring Stretches",
];

const mk = (n,r,note,rpe) => ({label:`Set ${n}`,reps:r,...(note&&{note}),...(rpe&&{rpe})});
const acc = (id,name,sets,note) => ({id,name,type:"accessory",sets,...(note&&{note})});
const s3  = r => [1,2,3].map(i=>mk(i,r));
const s2  = r => [1,2].map(i=>mk(i,r));

const WORKOUTS = {
  0:{name:"Push 1",sn:"PUSH 1",icon:null,theme:"push",
    warmup:"Shoulders & Chest — SLOW movement with 2.5 or 5 lb plate",
    exercises:[
      {id:"p1_b",name:"Flat Bench Press",type:"main",sets:[
        mk(1,4,"60% RPE",60),mk(2,4,"70% RPE",70),
        mk(3,6,"70% RPE",70),mk(4,6,"70% RPE",70),mk(5,6,"70% RPE",70),
      ]},
      acc("p1_td","Tricep Pushdown Cable",s3(10)),
      acc("p1_ci","Chest Incline Machine Press",s3(10)),
      acc("p1_sk","Tricep Skullcrusher",s2(10)),
      acc("p1_db","Bench Dumbbell Press",s3(10),"Or until failure for last sets"),
    ]},
  1:{name:"Pull 1 + Run",sn:"PULL 1",icon:null,theme:"pull",hasRun:true,
    warmup:"Back & Biceps — super light weight, SLOW movement",
    exercises:[
      {id:"pl1_r",name:"Barbell Rows",type:"main",sets:[
        mk(1,6,"Bar Only"),mk(2,6,"Bar Only"),
        mk(3,4,"60% RPE",60),mk(4,4,"70% RPE",70),
        mk(5,6,"70% RPE",70),mk(6,6,"70% RPE",70),mk(7,6,"70% RPE",70),
      ]},
      acc("pl1_ez","Bicep Cable EZ Bar Curls",s3(10)),
      acc("pl1_bm","Back Row Machine",s3(10),"Inside Grip"),
      acc("pl1_cg","Close Grip Cable Row",s3(10)),
      acc("pl1_sc","Seated Bicep Curl",s3(10)),
    ]},
  2:{name:"Active Rest Day",sn:"REST",icon:null,theme:"rest",isRest:true,warmup:null,exercises:[]},
  3:{name:"Legs 2 — Recovery",sn:"LEGS 2",icon:null,theme:"recovery",hasRun:true,isRecovery:true,
    warmup:"LIGHTWEIGHT — Movement & Blood Flow Focused. Target core, legs, lower back.",
    exercises:[
      acc("l2_cr","Upper Core Crunch",s3(10),"Put a mat rolled up under your mid-back and squeeze core together. Entire back should not lift off ground."),
      acc("l2_ha","Hip Abductors + Hip Adductors",s3(10)),
      acc("l2_ht","Hip Thrusters",s3(10)),
    ]},
  4:{name:"Push 2 + Run",sn:"PUSH 2",icon:null,theme:"push",hasRun:true,
    warmup:"Shoulders & Chest — SLOW movement with 2.5 or 5 lb plate",
    exercises:[
      {id:"p2_i",name:"Incline Bench Press",type:"main",sets:[
        mk(1,4,"Bar Only"),mk(2,4,"Bar Only"),
        mk(3,4,"60% RPE",60),mk(4,4,"75% RPE",75),
        mk(5,3,"75% RPE",75),mk(6,3,"75% RPE",75),mk(7,3,"75% RPE",75),mk(8,3,"75% RPE",75),
        mk(9,5,"50% RPE",50),
      ]},
      acc("p2_oc","Tricep Overhead Push Cable",s3(10)),
      acc("p2_cf","Chest Fly Machine",s3(10)),
      acc("p2_sd","Side Delt Flys",s2(10)),
      acc("p2_sa","Single Arm Cable Tricep Pushdown",s2(10)),
    ]},
  5:{name:"Pull 2",sn:"PULL 2",icon:null,theme:"pull",
    warmup:"Back & Biceps — super light weight, SLOW movement",
    exercises:[
      {id:"pl2_l",name:"Lat Pulldown",type:"main",sets:[1,2,3,4].map(i=>mk(i,10))},
      acc("pl2_pd",'Bicep "Palm Down" Cable Curls',s3(10)),
      acc("pl2_bm","Back Row Machine",s3(10),"Outside Grip"),
      acc("pl2_pu","Assisted Pull Ups",s3(10)),
    ]},
  6:{name:"Legs 1",sn:"LEGS 1",icon:null,theme:"legs",
    warmup:"As feel needed. Main lift warms up with Bar (2×6).",
    getExercises:sq=>[
      {id:sq?"l1_sq":"l1_dl",name:sq?"Squat":"Deadlift",type:"main",sets:[
        mk(1,6,"Bar Only"),mk(2,6,"Bar Only"),
        mk(3,4,"60% RPE",60),mk(4,4,"70% RPE",70),
        mk(5,6,"70% RPE",70),mk(6,6,"70% RPE",70),mk(7,6,"70% RPE",70),
      ]},
      acc("l1_ca","Calf Raises",s3(10)),
      acc("l1_qc","Quad Curls",s3(10)),
      acc("l1_hc","Hamstring Curls",s3(10)),
    ]},
};

const T = {
  push:     {a:"#DDAD30",b:"rgba(221,173,48,.12)",bd:"rgba(221,173,48,.22)",mbd:"rgba(221,173,48,.45)"},
  pull:     {a:"#99E4D6",b:"rgba(153,228,214,.10)",bd:"rgba(153,228,214,.18)",mbd:"rgba(153,228,214,.45)"},
  legs:     {a:"#E4DBC6",b:"rgba(228,219,198,.10)",bd:"rgba(228,219,198,.18)",mbd:"rgba(228,219,198,.45)"},
  recovery: {a:"#99E4D6",b:"rgba(46,87,73,.25)",bd:"rgba(153,228,214,.18)",mbd:"rgba(153,228,214,.45)"},
  rest:     {a:"#444",b:"rgba(255,255,255,.04)",bd:"rgba(255,255,255,.07)",mbd:"rgba(255,255,255,.15)"},
};

const DS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const DF = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/* ─── STORAGE ────────────────────────────────────────────────────────────── */
const lk  = (d,w) => `ip_v4_d${d}_w${w}`;
const sk  = ()    => `ip_sq`;
const ld  = (d,w) => { try{return JSON.parse(localStorage.getItem(lk(d,w)))||{};}catch{return{};} };
const sd  = (d,w,v)=> localStorage.setItem(lk(d,w),JSON.stringify(v));
const lsq = ()    => { try{return JSON.parse(localStorage.getItem(sk()))??true;}catch{return true;} };
const ssq = v     => localStorage.setItem(sk(),JSON.stringify(v));

/* ─── RPE TOOLTIP ────────────────────────────────────────────────────────── */
function RPE({a}) {
  const [o,setO]=useState(false);
  return (
    <span style={{position:"relative",display:"inline-flex",alignItems:"center",marginLeft:4}}>
      <button onClick={()=>setO(x=>!x)} style={{width:15,height:15,borderRadius:"50%",
        border:`1px solid ${a}44`,background:`${a}18`,color:a,fontSize:9,fontWeight:700,
        display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
        fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0}}>i</button>
      {o&&(
        <div style={{position:"absolute",bottom:20,left:0,zIndex:200,width:196,
          background:"#141414",border:"1px solid #2a2a2a",borderRadius:12,padding:"12px 14px",
          boxShadow:"0 24px 64px rgba(0,0,0,.9)"}}>
          <div className="fn-c" style={{fontWeight:700,fontSize:10,letterSpacing:".12em",color:"#DDAD30",marginBottom:8}}>RPE SCALE</div>
          {[["10","Max effort"],["9","1 rep left in tank"],["8","2 reps left"],["7","3 reps left"]].map(([n,d])=>(
            <div key={n} style={{display:"flex",gap:8,fontSize:12,color:"#aaa",marginBottom:4}}>
              <span style={{color:"#DDAD30",fontWeight:700,minWidth:18,fontFamily:"'Barlow Condensed',sans-serif"}}>{n}</span>
              <span>{d}</span>
            </div>
          ))}
          <button onClick={()=>setO(false)} style={{position:"absolute",top:8,right:10,
            background:"none",border:"none",color:"#999",cursor:"pointer",fontSize:16}}>&times;</button>
        </div>
      )}
    </span>
  );
}

/* ─── RUN TIMER ──────────────────────────────────────────────────────────── */
function RunTimer({a}) {
  const [t,setT]=useState(0);
  const [r,setR]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    if(r) ref.current=setInterval(()=>setT(x=>x+1),1000);
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[r]);
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const pct=Math.min((t/1200)*100,100);
  const done=t>=1200;
  return (
    <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:16,padding:"16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <Timer size={13} color={a}/>
        <span className="fn-c" style={{fontWeight:700,fontSize:11,letterSpacing:".12em",color:"#aaa"}}>20 MINUTE RUN</span>
        {done&&<span className="fn-c" style={{marginLeft:"auto",fontSize:11,color:"#99E4D6",fontWeight:700,letterSpacing:".08em"}}>✓ COMPLETE</span>}
      </div>
      <div className="fn-d" style={{fontSize:58,color:done?a:"#fff",textAlign:"center",letterSpacing:".06em",lineHeight:1,marginBottom:12}}>
        {fmt(t)}
      </div>
      <div style={{background:"var(--s3)",borderRadius:3,height:3,marginBottom:14,overflow:"hidden"}}>
        <div className="pf" style={{height:3,width:`${pct}%`,background:`linear-gradient(90deg,${a},${a}77)`}}/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center"}}>
        <button className="btn-press" onClick={()=>setR(x=>!x)}
          style={{display:"flex",alignItems:"center",gap:8,padding:"11px 28px",borderRadius:10,
            border:r?"1px solid var(--bd)":"none",cursor:"pointer",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,letterSpacing:".1em",
            background:r?"var(--s2)":a,color:r?"#fff":"#000"}}>
          {r?<Pause size={13}/>:<Play size={13}/>}{r?"PAUSE":"START"}
        </button>
        <button className="btn-press" onClick={()=>{setT(0);setR(false);}}
          style={{display:"flex",alignItems:"center",gap:8,padding:"11px 16px",borderRadius:10,
            background:"var(--s2)",border:"1px solid var(--bd)",color:"#aaa",cursor:"pointer",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,letterSpacing:".08em"}}>
          <RotateCcw size={13}/>RESET
        </button>
      </div>
    </div>
  );
}

/* ─── STRETCH CARD ───────────────────────────────────────────────────────── */
function StretchCard({a,logs,onToggle}) {
  const [o,setO]=useState(false);
  const done=STRETCHES.filter(s=>logs?.stretches?.[s]).length;
  return (
    <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:16,marginBottom:12,overflow:"hidden"}}>
      <button onClick={()=>setO(x=>!x)}
        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"14px 16px",background:"none",border:"none",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Heart size={13} color={a}/>
          <span className="fn-c" style={{fontWeight:700,fontSize:11,letterSpacing:".12em",color:"#aaa"}}>STRETCHING</span>
          <span className="fn-c" style={{fontSize:11,padding:"2px 8px",borderRadius:20,
            background:`${a}18`,color:a,fontWeight:700}}>{done}/{STRETCHES.length}</span>
        </div>
        {o?<ChevronUp size={13} color="#333"/>:<ChevronDown size={13} color="#333"/>}
      </button>
      {o&&(
        <div style={{padding:"0 12px 12px"}}>
          {STRETCHES.map(s=>(
            <button key={s} onClick={()=>onToggle(s)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:12,
                padding:"10px 8px",background:"none",border:"none",cursor:"pointer",borderRadius:8}}>
              {logs?.stretches?.[s]
                ?<CheckCircle2 size={17} color={a}/>
                :<Circle size={17} color="#2a2a2a"/>}
              <span style={{fontSize:13,color:logs?.stretches?.[s]?"#ddd":"#444",
                fontFamily:"'Barlow',sans-serif"}}>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── EXERCISE CARD ──────────────────────────────────────────────────────── */
function ExCard({ex,theme,logs,onChange}) {
  const [o,setO]=useState(true);
  const {a,b,bd,mbd}=T[theme];
  const done =ex.sets.filter((_,i)=>logs?.[`set${i}_done`]).length;
  const pct  =ex.sets.length?(done/ex.sets.length)*100:0;
  const vol  =ex.sets.reduce((s,_,i)=>{
    if(!logs?.[`set${i}_done`])return s;
    return s+(parseFloat(logs?.[`set${i}_weight`])||0)*(parseFloat(logs?.[`set${i}_reps`])||0);
  },0);
  const isMain=ex.type==="main";

  return (
    <div className="ec" style={{background:"var(--s1)",
      border:`1px solid ${o?(isMain?mbd:bd):"var(--bd)"}`,
      borderRadius:16,marginBottom:10,overflow:"hidden"}}>
      {/* Header */}
      <button onClick={()=>setO(x=>!x)}
        style={{width:"100%",display:"flex",alignItems:"flex-start",justifyContent:"space-between",
          padding:"14px 16px 12px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,
              fontSize:15,color:"#fff",letterSpacing:".02em"}}>{ex.name}</span>
            <span className="fn-c" style={{fontSize:9,padding:"2px 7px",borderRadius:4,fontWeight:700,
              letterSpacing:".1em",
              background:isMain?`${a}1a`:"rgba(255,255,255,.04)",
              color:isMain?a:"#444",
              border:`1px solid ${isMain?a+"33":"#2a2a2a"}`}}>
              {isMain?"MAIN LIFT":"ACCESSORY"}
            </span>
          </div>
          {ex.note&&<p style={{fontSize:11,color:"#999",margin:"0 0 4px",fontStyle:"italic",lineHeight:1.4}}>{ex.note}</p>}
          <div className="fn-c" style={{fontSize:11,color:"#777"}}>
            {done}/{ex.sets.length} sets
            {vol>0&&<span style={{color:a,marginLeft:8,fontWeight:700}}>{vol.toLocaleString()} lbs vol</span>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:12,flexShrink:0}}>
          <span className="fn-d" style={{fontSize:22,color:pct===100?a:"#2a2a2a",lineHeight:1}}>
            {Math.round(pct)}%
          </span>
          {o?<ChevronUp size={13} color="#333"/>:<ChevronDown size={13} color="#333"/>}
        </div>
      </button>

      {/* Progress bar */}
      {o&&<div style={{height:2,background:"var(--s3)",overflow:"hidden"}}>
        <div className="pf" style={{height:2,width:`${pct}%`,background:`linear-gradient(90deg,${a},${a}66)`}}/>
      </div>}

      {/* Sets */}
      {o&&(
        <div style={{padding:"12px 14px 14px"}}>
          {/* Column headers */}
          <div style={{display:"grid",gridTemplateColumns:"26px 1fr 88px 54px 54px",
            gap:5,marginBottom:8,padding:"0 2px"}}>
            {["","SET","TARGET","LBS","REPS"].map((h,i)=>(
              <div key={i} className="fn-c" style={{fontSize:9,color:"#333",
                letterSpacing:".1em",textAlign:i>=3?"center":"left"}}>{h}</div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {ex.sets.map((set,i)=>{
              const isDone=logs?.[`set${i}_done`]||false;
              const w=logs?.[`set${i}_weight`]||"";
              const r=logs?.[`set${i}_reps`]||"";
              const inputStyle={width:"100%",background:"var(--s2)",
                border:`1px solid ${isDone?a+"33":"#242424"}`,
                borderRadius:8,padding:"8px 4px",fontSize:12,color:"#fff",textAlign:"center",
                fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,outline:"none",
                transition:"border-color .15s"};
              return (
                <div key={i} style={{display:"grid",gridTemplateColumns:"26px 1fr 88px 54px 54px",
                  gap:5,alignItems:"center",padding:"7px 4px",borderRadius:10,
                  background:isDone?`${a}07`:"transparent",
                  border:`1px solid ${isDone?a+"1a":"transparent"}`}}>
                  <button onClick={()=>onChange(ex.id,`set${i}_done`,!isDone)}
                    style={{background:"none",border:"none",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                    {isDone?<CheckCircle2 size={17} color={a}/>:<Circle size={17} color="#2a2a2a"/>}
                  </button>
                  <div className="fn-c" style={{fontSize:12,fontWeight:700,
                    color:isDone?"#777":"#555",letterSpacing:".04em"}}>{set.label}</div>
                  <div style={{fontSize:11,color:isDone?"#555":"#444",
                    display:"flex",alignItems:"center",fontFamily:"'Barlow',sans-serif",lineHeight:1.3}}>
                    <span>{set.note||`${set.reps} reps`}</span>
                    {set.rpe&&<RPE a={a}/>}
                  </div>
                  <input type="number" inputMode="decimal" placeholder="—" value={w}
                    onChange={e=>onChange(ex.id,`set${i}_weight`,e.target.value)} style={inputStyle}/>
                  <input type="number" inputMode="numeric" placeholder={String(set.reps)} value={r}
                    onChange={e=>onChange(ex.id,`set${i}_reps`,e.target.value)} style={inputStyle}/>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PROGRESS ───────────────────────────────────────────────────────────── */
function Progress() {
  const data=useMemo(()=>{
    const map={};
    for(let d=0;d<7;d++) for(let w=-12;w<=0;w++){
      const logs=ld(d,w);
      const wo=WORKOUTS[d];
      const exs=wo?.getExercises?wo.getExercises(true):(wo?.exercises||[]);
      exs.forEach(ex=>{
        const vol=ex.sets.reduce((s,_,i)=>{
          if(!logs[ex.id]?.[`set${i}_done`])return s;
          return s+(parseFloat(logs[ex.id]?.[`set${i}_weight`])||0)*(parseFloat(logs[ex.id]?.[`set${i}_reps`])||0);
        },0);
        if(vol>0){
          if(!map[ex.name])map[ex.name]={total:0,sessions:0,maxW:0};
          map[ex.name].total+=vol;map[ex.name].sessions+=1;
          const mw=ex.sets.reduce((m,_,i)=>
            !logs[ex.id]?.[`set${i}_done`]?m:Math.max(m,parseFloat(logs[ex.id]?.[`set${i}_weight`])||0),0);
          map[ex.name].maxW=Math.max(map[ex.name].maxW,mw);
        }
      });
    }
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  },[]);
  const maxV=data.length?data[0][1].total:1;

  return (
    <div style={{maxWidth:480,margin:"0 auto",padding:"20px 14px 110px"}}>
      <div style={{marginBottom:24}}>
        <div className="fn-d gold-tx" style={{fontSize:34,lineHeight:1}}>PROGRESS</div>
        <div style={{height:2,width:56,background:"linear-gradient(90deg,#DDAD30,transparent)",marginTop:6}}/>
        <div className="fn-c" style={{fontSize:11,color:"#777",letterSpacing:".1em",marginTop:6}}>
          TOTAL VOLUME BY EXERCISE
        </div>
      </div>
      {data.length===0?(
        <div style={{textAlign:"center",paddingTop:60}}>
          <Dumbbell size={40} color="#1e1e1e" style={{margin:"0 auto 16px",display:"block"}}/>
          <div className="fn-d" style={{fontSize:28,color:"#1e1e1e",letterSpacing:".06em"}}>NO DATA YET</div>
          <div style={{fontSize:12,color:"#777",marginTop:6}}>Log your first session to see progress here.</div>
        </div>
      ):data.map(([name,d])=>(
        <div key={name} style={{background:"var(--s1)",border:"1px solid var(--bd)",
          borderRadius:14,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div className="fn-c" style={{fontWeight:700,fontSize:14,color:"#fff",letterSpacing:".02em"}}>{name}</div>
              <div className="fn-c" style={{fontSize:11,color:"#777",marginTop:2}}>
                {d.sessions} session{d.sessions>1?"s":""}
                {d.maxW>0&&<span style={{marginLeft:8}}>&middot; max {d.maxW} lbs</span>}
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
              <div className="fn-d" style={{fontSize:26,color:"#DDAD30",lineHeight:1}}>{d.total.toLocaleString()}</div>
              <div className="fn-c" style={{fontSize:9,color:"#777",letterSpacing:".1em"}}>TOTAL LBS</div>
            </div>
          </div>
          <div style={{height:3,background:"var(--s3)",borderRadius:2,overflow:"hidden"}}>
            <div className="pf" style={{height:3,background:"linear-gradient(90deg,#DDAD30,#a07e1f)",
              width:`${(d.total/maxV)*100}%`}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── DAY PILL ───────────────────────────────────────────────────────────── */
function DayPill({idx,sel,today,onSelect}) {
  const wo=WORKOUTS[idx];
  const isSel=idx===sel,isToday=idx===today;
  return (
    <button onClick={()=>onSelect(idx)} className="btn-press"
      style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",
        padding:"8px 10px",borderRadius:12,cursor:"pointer",transition:"all .15s",
        background:isSel?"#DDAD30":isToday?"#12110a":"var(--s1)",
        border:isSel?"none":isToday?"1px solid #DDAD3033":"1px solid var(--bd)"}}>
      <span className="fn-c" style={{fontSize:9,fontWeight:700,letterSpacing:".12em",
        color:isSel?"#000":"#444"}}>{DS[idx]}</span>
    </button>
  );
}

/* ─── APP ────────────────────────────────────────────────────────────────── */
export default function App() {
  const todayDow=new Date().getDay();
  const [day,setDay]   =useState(todayDow);
  const [tab,setTab]   =useState("workout");
  const [sq,setSq]     =useState(lsq);
  const [logs,setLogs] =useState(()=>ld(todayDow,0));
  const [rst,setRst]   =useState(false);

  useEffect(()=>setLogs(ld(day,0)),[day]);

  const onChange=useCallback((exId,key,val)=>{
    setLogs(prev=>{
      const next={...prev,[exId]:{...(prev[exId]||{}),[key]:val}};
      sd(day,0,next);return next;
    });
  },[day]);

  const onStretch=useCallback(s=>{
    setLogs(prev=>{
      const next={...prev,stretches:{...(prev.stretches||{}),[s]:!prev.stretches?.[s]}};
      sd(day,0,next);return next;
    });
  },[day]);

  const wo   =WORKOUTS[day];
  const exs  =wo.getExercises?wo.getExercises(sq):(wo.exercises||[]);
  const {a}  =T[wo.theme];
  const totS =exs.reduce((s,e)=>s+e.sets.length,0);
  const doneS=exs.reduce((s,e)=>s+e.sets.filter((_,i)=>logs?.[e.id]?.[`set${i}_done`]).length,0);
  const pctS =totS?(doneS/totS)*100:0;

  return (
    <>
      <FontLoader/>
      <div className="grain" style={{minHeight:"100vh",background:"var(--bg)"}}>

        {/* HEADER */}
        <div style={{position:"sticky",top:0,zIndex:30,
          background:"rgba(10,10,10,.97)",backdropFilter:"blur(16px)",
          borderBottom:"1px solid #141414"}}>
          <div style={{maxWidth:480,margin:"0 auto",padding:"14px 14px 12px"}}>
            {/* Brand + controls */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div>
                {/* Mini wordmark */}
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                  <span className="fn-d" style={{fontSize:10,letterSpacing:".2em",color:"#DDAD30"}}>IMPOSSIBLE</span>
                  <span style={{width:2,height:2,borderRadius:"50%",background:"#333"}}/>
                  <span className="fn-d" style={{fontSize:10,letterSpacing:".2em",color:"#333"}}>PERFORMANCE</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div>
                    <div className="fn-d" style={{fontSize:24,letterSpacing:".05em",color:"#fff",lineHeight:1}}>
                      {wo.sn||wo.name.toUpperCase()}
                    </div>
                    <div className="fn-c" style={{fontSize:10,color:"#333",letterSpacing:".08em"}}>
                      {DF[day]}
                      {day===todayDow&&<span style={{marginLeft:5,color:a,fontWeight:700}}>&middot; TODAY</span>}
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={()=>setRst(true)} className="btn-press"
                style={{padding:10,borderRadius:10,background:"var(--s1)",border:"1px solid var(--bd)",
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <RefreshCw size={13} color="#333"/>
              </button>
            </div>
            {/* Day pills */}
            {tab==="workout"&&(
              <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
                {[0,1,2,3,4,5,6].map(i=><DayPill key={i} idx={i} sel={day} today={todayDow} onSelect={setDay}/>)}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {tab==="workout"?(
          <div style={{maxWidth:480,margin:"0 auto",padding:"12px 14px 110px"}}>

            {/* Session progress bar */}
            {!wo.isRest&&totS>0&&(
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:14,padding:"12px 14px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span className="fn-c" style={{fontWeight:700,fontSize:10,letterSpacing:".14em",color:"#777"}}>SESSION PROGRESS</span>
                  <span className="fn-d" style={{fontSize:20,color:pctS===100?a:"#2a2a2a",letterSpacing:".04em"}}>
                    {doneS}/{totS} SETS
                  </span>
                </div>
                <div style={{height:4,background:"var(--s3)",borderRadius:3,overflow:"hidden"}}>
                  <div className="pf" style={{height:4,background:`linear-gradient(90deg,${a},${a}77)`,width:`${pctS}%`}}/>
                </div>
              </div>
            )}

            {/* Recovery banner */}
            {wo.isRecovery&&(
              <div style={{background:"rgba(46,87,73,.2)",border:"1px solid rgba(153,228,214,.18)",
                borderRadius:14,padding:"14px 16px",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <Heart size={13} color="#99E4D6"/>
                  <span className="fn-c" style={{fontWeight:700,fontSize:11,letterSpacing:".12em",color:"#99E4D6"}}>
                    ACTIVE RECOVERY FOCUS
                  </span>
                </div>
                <p style={{fontSize:12,color:"rgba(153,228,214,.65)",margin:0,lineHeight:1.6}}>
                  Lightweight today. Focus on movement, blood flow, and stretching. Volume over weight.
                </p>
              </div>
            )}

            {/* Rest day */}
            {wo.isRest&&(
              <div style={{textAlign:"center",padding:"48px 0 24px"}}>
                <Moon size={44} color="#141414" style={{margin:"0 auto 16px",display:"block"}}/>
                <div className="fn-d" style={{fontSize:38,color:"#333",letterSpacing:".06em",marginBottom:10}}>REST DAY</div>
                <p style={{fontSize:13,color:"#888",lineHeight:1.7,maxWidth:250,margin:"0 auto 32px"}}>
                  Recovery is where growth happens.<br/>Rest, hydrate, come back stronger.
                </p>
                <StretchCard a={a} logs={logs} onToggle={onStretch}/>
              </div>
            )}

            {/* Legs 1 toggle */}
            {day===6&&(
              <div style={{background:"var(--s1)",border:`1px solid ${T.legs.bd}`,borderRadius:14,
                padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div className="fn-c" style={{fontWeight:700,fontSize:11,letterSpacing:".12em",color:"#aaa"}}>MAIN LIFT — WEEK A/B</div>
                  <div style={{fontSize:11,color:"#777",marginTop:2,fontFamily:"'Barlow',sans-serif"}}>Alternates each week</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span className="fn-c" style={{fontWeight:700,fontSize:12,color:!sq?T.legs.a:"#2a2a2a"}}>DL</span>
                  <div className={`tog ${sq?"on":""}`} onClick={()=>{const v=!sq;setSq(v);ssq(v);}}>
                    <div className="tog-th"/>
                  </div>
                  <span className="fn-c" style={{fontWeight:700,fontSize:12,color:sq?T.legs.a:"#2a2a2a"}}>SQ</span>
                </div>
              </div>
            )}

            {/* Warmup */}
            {wo.warmup&&(
              <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:14,padding:"12px 16px",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <Zap size={12} color={a}/>
                  <span className="fn-c" style={{fontWeight:700,fontSize:10,letterSpacing:".14em",color:"#777"}}>WARM UP</span>
                </div>
                <p style={{fontSize:12,color:"#aaa",margin:0,lineHeight:1.6,fontFamily:"'Barlow',sans-serif"}}>{wo.warmup}</p>
              </div>
            )}

            {/* Run timer */}
            {wo.hasRun&&<RunTimer a={a}/>}

            {/* Exercises */}
            {exs.map(ex=>(
              <ExCard key={ex.id} ex={ex} theme={wo.theme}
                logs={logs[ex.id]||{}}
                onChange={(id,k,v)=>onChange(id,k,v)}/>
            ))}

            {/* Stretching */}
            {!wo.isRest&&<StretchCard a={a} logs={logs} onToggle={onStretch}/>}
          </div>
        ):<Progress/>}

        {/* BOTTOM NAV */}
        <div className="bnav" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:30,
          background:"rgba(10,10,10,.97)",backdropFilter:"blur(16px)",
          borderTop:"1px solid #141414"}}>
          <div style={{maxWidth:480,margin:"0 auto",display:"flex"}}>
            {[{id:"workout",Icon:Dumbbell,label:"WORKOUT"},{id:"progress",Icon:TrendingUp,label:"PROGRESS"}].map(({id,Icon,label})=>(
              <button key={id} onClick={()=>setTab(id)} className="btn-press"
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                  padding:"12px 0 10px",background:"none",border:"none",cursor:"pointer",gap:4}}>
                <Icon size={17} color={tab===id?"#DDAD30":"#2a2a2a"}/>
                <span className="fn-c" style={{fontWeight:700,fontSize:9,letterSpacing:".14em",
                  color:tab===id?"#DDAD30":"#2a2a2a"}}>{label}</span>
                {tab===id&&<div style={{width:20,height:2,borderRadius:1,
                  background:"linear-gradient(90deg,#DDAD30,#a07e1f)"}}/>}
              </button>
            ))}
          </div>
        </div>

        {/* RESET MODAL */}
        {rst&&(
          <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.85)"}} onClick={()=>setRst(false)}/>
            <div style={{position:"relative",background:"#0e0e0e",border:"1px solid #1e1e1e",
              borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"24px 20px 36px"}}>
              <div className="fn-d" style={{fontSize:26,letterSpacing:".06em",marginBottom:6}}>RESET LOG?</div>
              <div style={{height:2,width:40,background:"linear-gradient(90deg,#DDAD30,transparent)",marginBottom:12}}/>
              <p style={{fontSize:13,color:"#999",marginBottom:24,lineHeight:1.6,fontFamily:"'Barlow',sans-serif"}}>
                This clears all logged sets, weights and reps for {DF[day]}.
              </p>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setRst(false)} className="btn-press"
                  style={{flex:1,padding:13,borderRadius:10,background:"var(--s2)",
                    border:"1px solid var(--bd)",color:"#aaa",cursor:"pointer",
                    fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,letterSpacing:".1em"}}>
                  CANCEL
                </button>
                <button onClick={()=>{sd(day,0,{});setLogs({});setRst(false);}} className="btn-press"
                  style={{flex:1,padding:13,borderRadius:10,
                    background:"rgba(200,50,50,.12)",border:"1px solid rgba(200,50,50,.25)",
                    color:"#cc4444",cursor:"pointer",
                    fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,letterSpacing:".1em"}}>
                  RESET
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
