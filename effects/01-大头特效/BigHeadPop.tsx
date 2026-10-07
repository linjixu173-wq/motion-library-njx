import React, {useCallback, useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {mediaUrl} from '../shared/Media';

const headKeyframe = z.object({
  seconds: z.number().min(0),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const bigHeadSchema = z.object({
  src: z.string().describe('素材路径，相对于 public'),
  mediaType: z.enum(['image', 'video']),
  centerX: z.number().min(0).max(1).describe('头部中心横坐标，0到1'),
  centerY: z.number().min(0).max(1).describe('头部中心纵坐标，0到1'),
  radiusX: z.number().min(.03).max(.6).describe('头部影响范围横向半径'),
  radiusY: z.number().min(.03).max(.6).describe('头部影响范围纵向半径'),
  strength: z.number().min(0).max(.75).describe('局部大头强度'),
  startSeconds: z.number().min(0).describe('变大开始时间'),
  speedLines: z.boolean().describe('漫画放射速度线'),
  shake: z.number().min(0).max(1).describe('冲击抖动强度'),
  headTrack: z.array(headKeyframe).describe('移动人物的手动头部中心关键帧，可留空'),
});
export type BigHeadProps = z.infer<typeof bigHeadSchema>;

export const bigHeadDefaults: BigHeadProps = {
  src: 'motion-library/assets/portrait.jpg', mediaType: 'image',
  centerX: .535, centerY: .2, radiusX: .26, radiusY: .19,
  strength: .64, startSeconds: .5, speedLines: true, shake: .35, headTrack: [],
};

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  gl_Position = vec4(position, 0., 1.);
  uv = vec2((position.x+1.)*.5, (1.-position.y)*.5);
}`;
const fragmentSource = `
precision highp float;
uniform sampler2D picture;
uniform vec2 center;
uniform vec2 radius;
uniform vec2 crop;
uniform float amount;
varying vec2 uv;
void main() {
  vec2 delta = uv - center;
  float r = length(delta / radius);
  vec2 samplePoint = uv;
  if (r < 1.) {
    float falloff = 1. - r*r;
    samplePoint = center + delta * (1. - amount*falloff*falloff);
  }
  samplePoint = (samplePoint - .5) * crop + .5;
  gl_FragColor = texture2D(picture, clamp(samplePoint, 0., 1.));
}`;

type Renderer = {
  gl: WebGLRenderingContext; program: WebGLProgram; texture: WebGLTexture;
  buffer: WebGLBuffer; shaders: WebGLShader[];
};
const setup = (canvas: HTMLCanvasElement): Renderer => {
  const gl = canvas.getContext('webgl', {alpha: false, preserveDrawingBuffer: true, antialias: true});
  if (!gl) throw new Error('大头特效需要浏览器 WebGL；导出可使用 --gl=angle');
  const shaders = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].map((type, i) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, i === 0 ? vertexSource : fragmentSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    return shader;
  });
  const program = gl.createProgram()!;
  shaders.forEach(shader => gl.attachShader(program, shader));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed');
  gl.useProgram(program);
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(gl.getUniformLocation(program, 'picture'), 0);
  return {gl, program, texture, buffer, shaders};
};

const dimensions = (source: CanvasImageSource) => {
  if (source instanceof HTMLVideoElement) return [source.videoWidth, source.videoHeight];
  if (source instanceof HTMLImageElement) return [source.naturalWidth, source.naturalHeight];
  if ('displayWidth' in source) return [source.displayWidth, source.displayHeight];
  return [Number(source.width), Number(source.height)];
};

const Warp: React.FC<{
  src: string; video: boolean; center: [number, number]; radius: [number, number]; amount: number;
}> = ({src, video, center, radius, amount}) => {
  const {width, height} = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Renderer | null>(null);
  const latestSource = useRef<CanvasImageSource | null>(null);
  const [cx, cy] = center;
  const [rx, ry] = radius;
  const draw = useCallback((source: CanvasImageSource) => {
    if (source instanceof SVGImageElement) throw new Error('请通过图片地址加载 SVG，不要传入 SVG DOM 节点');
    latestSource.current = source;
    if (!renderer.current) return;
    const [sw, sh] = dimensions(source);
    if (!sw || !sh) return;
    const {gl, program} = renderer.current;
    const ratio = (width / height) / (sw / sh);
    gl.viewport(0, 0, width, height);
    gl.uniform2f(gl.getUniformLocation(program, 'center'), cx, cy);
    gl.uniform2f(gl.getUniformLocation(program, 'radius'), rx, ry);
    gl.uniform2f(gl.getUniformLocation(program, 'crop'), Math.min(1, ratio), Math.min(1, 1/ratio));
    gl.uniform1f(gl.getUniformLocation(program, 'amount'), amount);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
  }, [width, height, cx, cy, rx, ry, amount]);

  useLayoutEffect(() => {
    const state = setup(canvas.current!);
    renderer.current = state;
    return () => {
      const {gl, program, texture, buffer, shaders} = state;
      gl.deleteTexture(texture); gl.deleteBuffer(buffer);
      gl.deleteProgram(program); shaders.forEach(shader => gl.deleteShader(shader));
      renderer.current = null;
    };
  }, [width, height]);
  useLayoutEffect(() => {
    if (latestSource.current) draw(latestSource.current);
  }, [draw]);

  return <AbsoluteFill>
    <canvas ref={canvas} width={width} height={height} style={{width:'100%', height:'100%'}}/>
    {video
      ? <OffthreadVideo src={mediaUrl(src)} muted onVideoFrame={draw} style={{position:'absolute',width:1,height:1,opacity:0}}/>
      : <Img src={mediaUrl(src)} onLoad={event => draw(event.currentTarget)} style={{position:'absolute',width:1,height:1,opacity:0}}/>}
  </AbsoluteFill>;
};

export const BigHeadPop: React.FC<BigHeadProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const local = frame - props.startSeconds * fps;
  const pop = local < 0 ? 0 : spring({frame:local, fps, config:{damping:12,stiffness:240,mass:.7}});
  const amount = Math.min(.78, props.strength * pop);
  const track = [...props.headTrack].sort((a,b) => a.seconds - b.seconds);
  let cx=props.centerX, cy=props.centerY;
  if (track.length === 1) {cx=track[0].x; cy=track[0].y;}
  if (track.length > 1) {
    const times=track.map(point=>point.seconds);
    cx=interpolate(t,times,track.map(point=>point.x),{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
    cy=interpolate(t,times,track.map(point=>point.y),{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  }
  const impact=local<0?0:Math.exp(-local/fps*7)*props.shake;
  return <AbsoluteFill style={{background:'#121212',overflow:'hidden'}}>
    <AbsoluteFill style={{transform:`translate(${Math.sin(local*1.8)*impact*20}px,${Math.cos(local*1.3)*impact*12}px) scale(${1+impact*.025})`}}>
      <Warp src={props.src} video={props.mediaType==='video'} center={[cx,cy]} radius={[props.radiusX,props.radiusY]} amount={amount}/>
    </AbsoluteFill>
    {props.speedLines && <svg width={width} height={height} style={{position:'absolute',opacity:Math.min(1,pop)*.62,pointerEvents:'none'}} viewBox={`0 0 ${width} ${height}`}>
      {Array.from({length:52}, (_,i)=>{
        const angle=i*Math.PI*2/52;
        const length=1.0+((i*17)%11)/30;
        const start=.53+((i*13)%7)/55+Math.sin(frame*.18+i)*.018;
        const dx=Math.cos(angle)*width*.9, dy=Math.sin(angle)*height*.9;
        return <line key={i} x1={width*cx+dx*start} y1={height*cy+dy*start} x2={width*cx+dx*length} y2={height*cy+dy*length} stroke={i%3===0?'#fff':'#101010'} strokeWidth={1+i%4} opacity={.25+(i%5)*.1}/>;
      })}
    </svg>}
  </AbsoluteFill>;
};

