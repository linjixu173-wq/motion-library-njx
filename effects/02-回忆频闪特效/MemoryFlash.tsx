import React from 'react';
import {AbsoluteFill, Img, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {Media, mediaUrl} from '../shared/Media';

export const memoryFlashSchema = z.object({
  foreground: z.string().describe('前景原图路径，相对于 public'),
  backgrounds: z.array(z.string()).min(1).describe('背景图片或视频列表'),
  intervalSeconds: z.number().min(.2).max(3).describe('背景切换间隔'),
  rotation: z.number().min(0).max(30).describe('旋转幅度，度'),
  zoom: z.number().min(0).max(.7).describe('背景推拉强度'),
  blur: z.number().min(0).max(18).describe('背景基础模糊'),
  mask: z.enum(['oval','soft-rectangle','none']).describe('原图蒙版形状'),
  feather: z.number().min(1).max(40).describe('蒙版边缘柔化百分比'),
  foregroundWidth: z.number().min(.2).max(.9).describe('前景占画面宽度'),
  foregroundHeight: z.number().min(.5).max(1.6).describe('前景占画面高度'),
  foregroundCenterX: z.number().min(0).max(1).describe('人物在原图中的横向中心'),
  liftPixels: z.number().min(0).max(500).describe('人物入场上升距离'),
  flashStrength: z.number().min(0).max(.35).describe('短暂亮度脉冲'),
});
export type MemoryFlashProps=z.infer<typeof memoryFlashSchema>;
export const memoryFlashDefaults:MemoryFlashProps={
  foreground:'motion-library/assets/portrait.jpg',
  backgrounds:['motion-library/assets/crown12.jpg','motion-library/assets/crown16.jpg','motion-library/assets/crown20.jpg'],
  intervalSeconds:.65,rotation:12,zoom:.3,blur:2,mask:'oval',feather:12,
  foregroundWidth:.5,foregroundHeight:1.15,foregroundCenterX:.5357,liftPixels:150,flashStrength:.09,
};

export const MemoryFlash:React.FC<MemoryFlashProps>=(props)=>{
  const frame=useCurrentFrame();
  const {fps,width,height}=useVideoConfig();
  const interval=Math.max(1,Math.round(props.intervalSeconds*fps));
  const beat=Math.floor(frame/interval),p=(frame%interval)/interval;
  const entrance=spring({frame,fps,config:{damping:18,stiffness:145}});
  const sources=props.backgrounds;
  const current=sources[beat%sources.length];
  const direction=beat%2?1:-1;
  const scale=1.35+props.zoom*(1-p);
  const rotation=direction*props.rotation*(.7-p);
  const flash=Math.max(0,1-p*7)*props.flashStrength;
  const x=props.foregroundCenterX*100;
  const mask=props.mask==='none'?undefined:props.mask==='oval'
    ? `radial-gradient(ellipse 36% 46% at ${x}% 48%,#000 ${100-props.feather}%,transparent 100%)`
    : `linear-gradient(90deg,transparent,#000 ${props.feather}%,#000 ${100-props.feather}%,transparent)`;
  const photoWidth=width*props.foregroundWidth;
  return <AbsoluteFill style={{background:'#05070b',overflow:'hidden'}}>
    {[0,1,2,3].map(layer=><AbsoluteFill key={layer} style={{
      transform:`translate(${direction*(p-.5)*85}px,0) rotate(${rotation+direction*layer*2}deg) scale(${scale+layer*.055})`,
      opacity:layer===0?1:.13,
      filter:`blur(${props.blur+layer*3+(1-p)*3}px) brightness(.72) saturate(.88)`,
    }}>
      <Sequence from={beat*interval} layout="none">
        <Media src={current} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      </Sequence>
    </AbsoluteFill>)}
    <AbsoluteFill style={{background:'radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,.65))'}}/>
    <div style={{
      position:'absolute',left:width*.5-photoWidth*props.foregroundCenterX,top:height*.015,
      width:photoWidth,height:height*props.foregroundHeight,
      transform:`translateY(${(1-entrance)*props.liftPixels}px) scale(${.98+entrance*.02})`,
      transformOrigin:`${x}% 50%`,
    }}>
      <Img src={mediaUrl(props.foreground)} style={{width:'100%',height:'100%',objectFit:'cover',maskImage:mask,WebkitMaskImage:mask}}/>
    </div>
    <AbsoluteFill style={{opacity:flash,background:beat%2?'#d5b784':'#9cb2d2',mixBlendMode:'screen'}}/>
  </AbsoluteFill>;
};

