import React from 'react';
import {Composition, Folder} from 'remotion';
import {BigHeadPop, bigHeadDefaults, bigHeadSchema, MemoryFlash, memoryFlashDefaults, memoryFlashSchema, PhotoStack, photoStackDefaults, photoStackSchema} from './index';

export const MotionLibraryCompositions:React.FC=()=> <Folder name="动态镜头库">
  <Folder name="01-大头特效">
    <Composition id="Motion-BigHead" component={BigHeadPop} schema={bigHeadSchema} defaultProps={bigHeadDefaults} durationInFrames={120} fps={30} width={900} height={1200}/>
  </Folder>
  <Folder name="02-回忆频闪">
    <Composition id="Motion-MemoryFlash" component={MemoryFlash} schema={memoryFlashSchema} defaultProps={memoryFlashDefaults} durationInFrames={180} fps={30} width={1920} height={1080}/>
  </Folder>
  <Folder name="03-图片堆叠">
    <Composition id="Motion-PhotoStack" component={PhotoStack} schema={photoStackSchema} defaultProps={photoStackDefaults} durationInFrames={150} fps={30} width={1920} height={1080}/>
  </Folder>
</Folder>;

