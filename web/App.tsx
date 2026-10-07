import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {BigHeadPop,bigHeadDefaults,type BigHeadProps,MemoryFlash,memoryFlashDefaults,type MemoryFlashProps,PhotoStack,photoStackDefaults,type PhotoStackProps} from '../effects';
import './style.css';

const repo='https://github.com/linjixu173-wq/motion-library-njx';
const local=(name:string)=>new URL(name,document.baseURI).href;
const resolve=(name:string)=>local(name);
type Id='head'|'memory'|'stack';
type Settings=Record<string,unknown>;
type Control={key:string;label:string;min:number;max:number;step:number;unit?:string};
const effects:Record<Id,{name:string;en:string;tag:string;description:string;note:string;duration:number;width:number;height:number;file:string;folder:string;image:string;controls:Control[]}>= {
  head:{name:'大头特效',en:'BIG HEAD POP',tag:'局部变形',description:'一个夸张的念头，先从脑袋开始。',note:'头部区域连续放大，保留原图。换人物后，调节头部位置与范围。',duration:120,width:900,height:1200,file:'BigHeadPop.tsx',folder:'01-大头特效',image:'portrait.jpg',controls:[{key:'strength',label:'放大强度',min:0,max:.75,step:.01},{key:'centerX',label:'头部横向位置',min:0,max:1,step:.01},{key:'centerY',label:'头部纵向位置',min:0,max:1,step:.01},{key:'radiusX',label:'横向影响范围',min:.03,max:.6,step:.01},{key:'radiusY',label:'纵向影响范围',min:.03,max:.6,step:.01},{key:'shake',label:'冲击抖动',min:0,max:1,step:.01}]},
  memory:{name:'回忆频闪',en:'MEMORY FLASH',tag:'蒙版 · 残影',description:'人物留在此刻，回忆从身后掠过。',note:'前景保留原始照片，以椭圆蒙版柔化边缘；背景快速切换、旋转与推拉。',duration:180,width:1920,height:1080,file:'MemoryFlash.tsx',folder:'02-回忆频闪特效',image:'crown16.jpg',controls:[{key:'intervalSeconds',label:'切换间隔',min:.2,max:1.5,step:.05,unit:'s'},{key:'rotation',label:'背景旋转',min:0,max:30,step:1,unit:'°'},{key:'zoom',label:'背景推拉',min:0,max:.7,step:.01},{key:'feather',label:'蒙版柔化',min:1,max:40,step:1,unit:'%'},{key:'foregroundWidth',label:'人物画面宽度',min:.2,max:.9,step:.01},{key:'flashStrength',label:'亮度脉冲',min:0,max:.2,step:.01}]},
  stack:{name:'图片堆叠',en:'PHOTO STACK',tag:'弹性入场',description:'让每一张画面，都有落下的分量。',note:'新卡片弹入，旧卡片向后错开。替换图片即可用于回忆、介绍或信息展示。',duration:150,width:1920,height:1080,file:'PhotoStack.tsx',folder:'03-图片堆叠放置特效',image:'crown20.jpg',controls:[{key:'intervalSeconds',label:'入场间隔',min:.2,max:1.5,step:.05,unit:'s'},{key:'cardWidth',label:'卡片大小',min:.3,max:.85,step:.01},{key:'tilt',label:'落下角度',min:0,max:15,step:1,unit:'°'},{key:'depth',label:'层叠距离',min:0,max:60,step:1,unit:'px'},{key:'corner',label:'圆角',min:0,max:60,step:1,unit:'px'},{key:'border',label:'白边宽度',min:0,max:28,step:1,unit:'px'}]},
};
const initial:Record<Id,Settings>={
  head:{...bigHeadDefaults,src:resolve(bigHeadDefaults.src)},
  memory:{...memoryFlashDefaults,foreground:resolve(memoryFlashDefaults.foreground),backgrounds:memoryFlashDefaults.backgrounds.map(resolve)},
  stack:{...photoStackDefaults,images:photoStackDefaults.images.map(resolve)},
};
const Stage:React.FC<{effect:Id;settings:Settings}>=({effect,settings})=> effect==='head'?<BigHeadPop {...settings as unknown as BigHeadProps}/>:effect==='memory'?<MemoryFlash {...settings as unknown as MemoryFlashProps}/>:<PhotoStack {...settings as unknown as PhotoStackProps}/>;
const getId=():Id=>{const id=location.hash.slice(1);return id in effects?id as Id:'stack';};

function App(){
  const [id,setId]=useState<Id>(getId);
  const [values,setValues]=useState(initial);
  const [tab,setTab]=useState<'preview'|'code'>('preview');
  const [code,setCode]=useState('');
  const [status,setStatus]=useState('');
  const [uploadKey,setUploadKey]=useState(0);
  const player=useRef<PlayerRef>(null);
  const urls=useRef<string[]>([]);
  const entry=effects[id];
  const settings=values[id];
  useEffect(()=>{const change=()=>setId(getId());window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
  useEffect(()=>()=>urls.current.forEach(URL.revokeObjectURL),[]);
  useEffect(()=>{let active=true;setCode('正在读取源码…');fetch(local('code/'+entry.file+'.txt')).then(r=>{if(!r.ok)throw new Error();return r.text();}).then(text=>{if(active)setCode(text);}).catch(()=>{if(active)setCode('源码加载失败，请使用 GitHub 源码链接。');});return()=>{active=false;};},[entry.file]);
  useEffect(()=>{if(!status)return;const timeout=setTimeout(()=>setStatus(''),3200);return()=>clearTimeout(timeout);},[status]);
  const change=(key:string,value:unknown)=>setValues(old=>({...old,[id]:{...old[id],[key]:value}}));
  const select=(next:Id)=>{location.hash=next;setId(next);setTab('preview');};
  const reset=()=>{setValues(old=>({...old,[id]:initial[id]}));setUploadKey(n=>n+1);player.current?.seekTo(0);setStatus('已恢复默认效果');};
  const upload=(list:FileList|null)=>{
    const files=Array.from(list||[]).filter(f=>f.type.startsWith('image/')).slice(0,12);
    if(!files.length)return;
    const added=files.map(file=>URL.createObjectURL(file));urls.current.push(...added);
    change(id==='stack'?'images':id==='head'?'src':'foreground',id==='stack'?added:added[0]);
    player.current?.seekTo(0);setStatus('图片已载入，仅在当前浏览器预览');
  };
  const downloadProps=()=>{
    if(JSON.stringify(settings).includes('blob:')){setStatus('本地图片请先放入项目 public，再设置素材路径');return;}
    const base=local('');
    const text=JSON.stringify(settings,null,2).split(base).join('');
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=entry.file.replace('.tsx','.props.json');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <>
    <header className="topbar"><a className="brand" href="#stack"><span className="brand-mark">NJX<span>↗</span></span><span>阿基的动态镜头库<small>MOTION ARCHIVE / 001</small></span></a><nav><a href={repo} target="_blank" rel="noreferrer">GitHub 源码 ↗</a><a className="download" href="./downloads/motion-library-njx.zip" download>下载代码包 <span>↓</span></a></nav></header>
    <main>
      <section className="intro"><div><p className="eyebrow"><span/> MADE TO MOVE</p><h1>收藏灵感，让画面动起来<span>。</span></h1><p>从参考录屏重建的可复用镜头。选一个动效，调一调，再放进你的视频。</p></div><div className="collection-count"><strong>03</strong><span>可调动效<br/>持续收藏中</span></div></section>
      <div className="workspace">
        <aside className="library"><div className="section-heading">全部动效 <span>03</span></div>{(Object.keys(effects) as Id[]).map((key,i)=><button type="button" key={key} className={'effect-card '+(id===key?'active':'')} onClick={()=>select(key)} aria-pressed={id===key}><div className={'thumb '+key}><img src={local('motion-library/assets/'+effects[key].image)} alt=""/><span className="thumb-number">0{i+1}</span>{key==='head'?<span className="head-ring"/>:key==='memory'?<span className="flash-lines"/>:<span className="stack-lines"/>}<span className="duration">{effects[key].duration/30}s</span></div><div className="card-label"><span>{effects[key].name}<small>{effects[key].en}</small></span><span className="card-arrow">↗</span></div></button>)}<p className="library-foot">每一段节奏，<br/>都能成为新的表达。</p></aside>
        <section className="editor"><div className="editor-heading"><div><span className="tag">{entry.tag}</span><h2>{entry.name}</h2><p>{entry.description}</p></div><div className="view-tabs" aria-label="预览或源码"><button className={tab==='preview'?'selected':''} onClick={()=>setTab('preview')}>效果预览</button><button className={tab==='code'?'selected':''} onClick={()=>{player.current?.pause();setTab('code');}}>源码</button></div></div>
          <div className="stage-shell" style={{display:tab==='preview'?'flex':'none'}}><Player key={id} ref={player} component={Stage} inputProps={{effect:id,settings}} durationInFrames={entry.duration} initialFrame={id==="stack"?75:30} fps={30} compositionWidth={entry.width} compositionHeight={entry.height} controls loop autoPlay={false} initiallyMuted style={{width:id==='head'?'min(100%, 315px)':'100%'}} acknowledgeRemotionLicense errorFallback={({error})=><div className="player-error">预览暂时无法加载。<br/>{error.message}<br/>可下载代码包在 Remotion 中运行。</div>}/></div>
          {tab==='code'&&<div className="code-shell"><div className="code-file"><span>{entry.file}</span><a href={`${repo}/blob/main/effects/${encodeURIComponent(entry.folder)}/${entry.file}`} target="_blank" rel="noreferrer">在 GitHub 查看 ↗</a></div><pre><code>{code}</code></pre></div>}
          <div className="stage-toolbar"><span><i/> {entry.width} × {entry.height} <b>/</b> 30 FPS <b>/</b> {entry.duration/30} 秒</span><button onClick={()=>{setTab('preview');player.current?.seekTo(0);player.current?.play();}}>↻ 重新播放</button></div>
          <div className="effect-note"><span>镜头笔记</span><p>{entry.note}</p></div>
        </section>
        <aside className="inspector"><div className="section-heading">调整效果 <button onClick={reset}>重置 ↺</button></div><p className="inspector-tip">拖动滑杆，实时看变化。</p><div className="sliders">{entry.controls.map(control=><label className="control" key={control.key}><span>{control.label}<output>{Number(settings[control.key]).toFixed(control.step<1?2:0)}{control.unit||''}</output></span><input type="range" min={control.min} max={control.max} step={control.step} value={Number(settings[control.key])} onChange={e=>change(control.key,Number(e.target.value))}/></label>)}</div>
          {id==='head'&&<label className="toggle">漫画速度线<input type="checkbox" checked={Boolean(settings.speedLines)} onChange={e=>change('speedLines',e.target.checked)}/></label>}
          {id==='stack'&&<label className="toggle">背景网格<input type="checkbox" checked={Boolean(settings.grid)} onChange={e=>change('grid',e.target.checked)}/></label>}
          {id==='memory'&&<label className="select-label">蒙版形状<select value={String(settings.mask)} onChange={e=>change('mask',e.target.value)}><option value="oval">椭圆蒙版</option><option value="soft-rectangle">两侧渐隐</option><option value="none">完整原图</option></select></label>}
          <div className="asset-section"><p>换成你的画面</p><label className="upload">＋ {id==='stack'?'选择图片，可多选':'选择一张人物照片'}<input key={`${id}-${uploadKey}`} type="file" accept="image/*" multiple={id==='stack'} onChange={e=>upload(e.target.files)}/></label><small>仅在浏览器内预览，刷新后恢复示例。</small></div><button className="save-props" onClick={downloadProps}>保存参数 .json ↓</button>
        </aside>
      </div>
      <section className="howto"><div><span>01 / PREVIEW</span><h3>先找到感觉</h3><p>切换镜头、播放与拖动时间线，感受运动节奏。</p></div><div><span>02 / CUSTOMIZE</span><h3>再调成你的</h3><p>替换图片，调整大小、节奏与蒙版；保存喜欢的参数。</p></div><div><span>03 / CREATE</span><h3>带进下一支视频</h3><p>下载完整代码包，在 Remotion 中组合镜头并导出视频。</p></div></section>
    </main><footer><span>阿基 / NJX <b>·</b> 把灵感留在时间线上</span><span>参考重建 · Remotion 4.0.533 · 2026</span></footer>{status&&<div className="toast" role="status">{status}</div>}
  </>;
}
createRoot(document.getElementById('root')!).render(<App/>);
