const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
require('./build.cjs');
const root = path.resolve(__dirname,'../docs');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.txt':'text/plain; charset=utf-8','.json':'application/json','.zip':'application/zip'};
const port=Number(process.env.PORT||4174);
http.createServer((req,res)=>{
  let name;
  try {name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch {res.writeHead(400).end();return;}
  const file=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404).end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);
  });
}).listen(port,'127.0.0.1',()=>console.log('Preview: http://localhost:'+port));
