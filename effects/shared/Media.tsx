import React from 'react';
import {Img, OffthreadVideo, staticFile} from 'remotion';

export const mediaUrl = (src: string) =>
  /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src);
export const isVideo = (src: string) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(src);

export const Media: React.FC<{
  src: string;
  style?: React.CSSProperties;
}> = ({src, style}) => isVideo(src)
  ? <OffthreadVideo src={mediaUrl(src)} muted style={style}/>
  : <Img src={mediaUrl(src)} style={style}/>;

