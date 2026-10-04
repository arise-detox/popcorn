// Serveur local facultatif. Aucun paquet à installer. Node.js 18 ou ultérieur.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try {
    const url=new URL(req.url,'http://localhost');
    const decoded=decodeURIComponent(url.pathname);
    const file=path.resolve(root,'.'+decoded+(decoded.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Accès interdit');return;}
    const content=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(404);res.end('Fichier introuvable');}
}).listen(8080,'127.0.0.1',()=>console.log('Popcorn : http://localhost:8080 — Ctrl+C pour arrêter.'));
