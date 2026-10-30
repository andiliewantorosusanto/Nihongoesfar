import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { GET, POST } from './routes.ts';
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||3001),root=resolve('dist');
const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
 const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
 if(url.pathname.startsWith('/api/')){
 if(!['GET','POST'].includes(req.method||'')){res.writeHead(405);res.end();return}
 const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>150000){res.writeHead(413);res.end('Request too large');return}chunks.push(chunk)}
 // The browser origin is allowed only when it matches this listener or an explicitly configured public origin.
 const origin=req.headers.origin;const allowed=[`http://${req.headers.host}`,process.env.PUBLIC_ORIGIN].filter(Boolean);
 if(req.method==='POST'&&origin&&!allowed.includes(origin)){res.writeHead(403);res.end('Invalid origin');return}
 const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
 // The trusted reverse proxy can terminate TLS; normalize only after checking the configured origin.
 if(origin)headers.set('origin',url.origin);
 const request=new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
 const response=await(req.method==='POST'?POST:GET)(request,{params:Promise.resolve({resource:url.pathname.split('/')[2]})});
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
 }
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return}
 let file=resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
 try{if(!(await stat(file)).isFile())file=resolve(root,'index.html')}catch{if(extname(url.pathname)){res.writeHead(404);res.end();return}file=resolve(root,'index.html')}
 const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':file.includes('/assets/')?'public, max-age=31536000, immutable':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
 }catch(e){console.error(e);res.writeHead(500,{'Content-Type':'text/plain'});res.end('The notebook could not complete this request.')}
});
server.listen(port,host,()=>console.log(`Nihongoesfar ready at http://${host}:${port}`));
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>server.close(()=>process.exit(0)));
