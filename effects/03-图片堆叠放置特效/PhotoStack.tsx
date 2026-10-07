import React from 'react';
import {AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {mediaUrl} from '../shared/Media';

export const photoStackSchema=z.object({
  images:z.array(z.string()).min(1).max(12).describe('要依次堆叠的图片'),
  intervalSeconds:z.number().min(.2).max(3).describe('每张图片间隔'),
  cardWidth:z.number().min(.3).max(.85).describe('卡片占画面宽度'),
  cardAspect:z.number().min(.65).max(2.2).describe('卡片宽高比'),
  border:z.number().min(0).max(28).describe('白边宽度'),
  corner:z.number().min(0).max(60).describe('圆角半径'),
  tilt:z.number().min(0).max(15).describe('落下后的轻微角度'),
  depth:z.number().min(0).max(60).describe('每层纵向错开距离'),
  background:z.string().describe('背景颜色'),
  grid:z.boolean().describe('显示参考中的暗色网格'),
});
export type PhotoStackProps=z.infer<typeof photoStackSchema>;
export const photoStackDefaults:PhotoStackProps={
  images:['motion-library/assets/crown12.jpg','motion-library/assets/crown16.jpg','motion-library/assets/crown20.jpg'],
  intervalSeconds:.65,cardWidth:.6,cardAspect:1.65,border:10,corner:30,tilt:3,depth:34,background:'#0b0d10',grid:true,
};

export const PhotoStack:React.FC<PhotoStackProps>=(props)=>{
  const frame=useCurrentFrame();
  const {fps,width,height}=useVideoConfig();
  const interval=Math.max(1,Math.round(props.intervalSeconds*fps));
  const cardWidth=width*props.cardWidth,cardHeight=cardWidth/props.cardAspect;
  const active=Math.min(props.images.length-1,Math.floor(frame/interval));
  return <AbsoluteFill style={{background:props.background,overflow:'hidden',
    backgroundImage:props.grid?'linear-gradient(rgba(170,185,200,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(170,185,200,.08) 1px,transparent 1px)':undefined,
    backgroundSize:'40px 40px',
  }}>
    <AbsoluteFill style={{background:'radial-gradient(ellipse,transparent 10%,rgba(0,0,0,.6))'}}/>
    {props.images.map((src,i)=>{
      const local=frame-i*interval;
      if(local<0)return null;
      const enter=spring({frame:local,fps,config:{damping:17,stiffness:210,mass:.85}});
      // The older cards settle backwards each time a new card arrives.
      let depth=0;
      for(let j=i+1;j<=active;j++)depth+=spring({frame:frame-j*interval,fps,config:{damping:22,stiffness:170}});
      const direction=i%2===0?1:-1;
      const x=direction*Math.min(depth,3)*width*.012+(1-enter)*direction*width*.13;
      const y=(1-enter)*height*.72-Math.min(depth,4)*props.depth;
      const angle=direction*props.tilt+(1-enter)*direction*12;
      const scale=(.86+.14*enter)*Math.pow(.965,Math.min(depth,6));
      return <div key={i} style={{
        position:'absolute',width:cardWidth,height:cardHeight,left:(width-cardWidth)/2,top:(height-cardHeight)/2,
        padding:props.border,background:'#f8f5ec',borderRadius:props.corner,
        boxShadow:'0 24px 65px rgba(0,0,0,.65)',boxSizing:'border-box',overflow:'hidden',
        transform:`translate(${x}px,${y}px) rotate(${angle}deg) scale(${scale})`,
        opacity:Math.min(1,Math.max(0,enter*3)),
      }}>
        <Img src={mediaUrl(src)} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:Math.max(0,props.corner-props.border/2)}}/>
      </div>;
    })}
  </AbsoluteFill>;
};

