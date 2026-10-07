// Deterministic ZIP bundle of the editable project; no local caches or credentials.
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');
const selected=['effects','public','web','scripts','README.md','package.json','package-lock.json','tsconfig.json','remotion.tsx','.gitignore'];
const files=[];
function collect(name){const full=path.join(root,name);if(fs.statSync(full).isDirectory()){for(const child of fs.readdirSync(full).sort())collect(name+'/'+child);}else files.push(name);}
selected.forEach(collect);
const table=Array.from({length:256},(_,i)=>{let n=i;for(let k=0;k<8;k++)n=(n&1)?(0xedb88320^(n>>>1)):(n>>>1);return n>>>0;});
function crc32(data){let n=0xffffffff;for(const byte of data)n=table[(n^byte)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
const chunks=[],directory=[];let offset=0;
for(const file of files){
 const name=Buffer.from(file,'utf8'),data=fs.readFileSync(path.join(root,file)),compressed=zlib.deflateRawSync(data,{level:9}),crc=crc32(data);
 const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(33,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
 const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(8,10);central.writeUInt16LE(33,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);
 chunks.push(local,name,compressed);directory.push(central,name);offset+=local.length+name.length+compressed.length;
}
const cd=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
const out=path.join(root,'docs/downloads');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'motion-library-njx.zip'),Buffer.concat([...chunks,cd,end]));console.log('Packaged '+files.length+' source files into docs/downloads/motion-library-njx.zip');
