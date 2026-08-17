import http from 'node:http';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const scrypt = promisify(scryptCallback);
const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.ADMIN_PORT || 8790);
const workerUrl = String(process.env.WORKER_URL || 'https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev').replace(/\/$/, '');
const passwordFile = process.env.PASSWORD_HASH_FILE || join(root, '.password-hash');
const sessions = new Map();
const attempts = new Map();
const maxBody = 256 * 1024;
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml' };
const securityHeaders = {
  'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer', 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':"default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};

function send(res, status, body, headers={}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { ...securityHeaders, 'Content-Type':typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', ...headers });
  res.end(data);
}
function cookie(req, name) {
  const match = String(req.headers.cookie || '').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}
function clientIp(req) { return String(req.socket.remoteAddress || 'unknown'); }
async function body(req) {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size += chunk.length; if (size > maxBody) throw new Error('BODY_TOO_LARGE'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
async function makeHash(password) {
  const salt=randomBytes(16); const derived=await scrypt(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${Buffer.from(derived).toString('hex')}`;
}
async function verify(password) {
  const [kind,saltHex,hashHex]=String(await readFile(passwordFile,'utf8')).trim().split(':');
  if (kind !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected=Buffer.from(hashHex,'hex'); const actual=Buffer.from(await scrypt(password, Buffer.from(saltHex,'hex'), expected.length));
  return expected.length === actual.length && timingSafeEqual(expected,actual);
}
function session(req) {
  const token=cookie(req,'neo_admin'); const item=sessions.get(token);
  if (!item || item.expires < Date.now()) { if (token) sessions.delete(token); return null; }
  item.expires=Date.now()+8*60*60*1000; return { token, ...item };
}
function safeEqualText(left,right) {
  const a=Buffer.from(String(left||'')), b=Buffer.from(String(right||''));
  return a.length===b.length && timingSafeEqual(a,b);
}
function requireSession(req,res,mutating=false) {
  const current=session(req); if (!current) { send(res,401,{erro:'Faça login novamente.'}); return null; }
  if (mutating && !safeEqualText(req.headers['x-csrf-token'],current.csrf)) { send(res,403,{erro:'Proteção da sessão recusou a ação.'}); return null; }
  return current;
}
async function proxyAdmin(payload) {
  const response=await fetch(`${workerUrl}/internal/admin-console`,{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Key':process.env.WORKER_ADMIN_KEY || ''},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
  const data=await response.json().catch(()=>({erro:`Worker respondeu HTTP ${response.status}`}));
  return { status:response.status, data };
}
async function serve(req,res,path) {
  const file=path==='/'?'index.html':path.slice(1);
  if (!/^(index\.html|app\.js|styles\.css)$/.test(file)) return send(res,404,{erro:'Não encontrado.'});
  const data=await readFile(join(root,'public',file));
  res.writeHead(200,{...securityHeaders,'Content-Type':mime[extname(file)]||'application/octet-stream'}); res.end(data);
}

const server=http.createServer(async (req,res)=>{
  try {
    const url=new URL(req.url,'http://local');
    if (req.method==='GET' && url.pathname==='/api/session') { const current=session(req); return send(res,current?200:401,current?{authenticated:true,csrf:current.csrf}:{authenticated:false}); }
    if (req.method==='POST' && url.pathname==='/api/login') {
      const ip=clientIp(req); const state=attempts.get(ip)||{count:0,until:0};
      if (state.until>Date.now()) return send(res,429,{erro:'Muitas tentativas. Aguarde alguns minutos.'});
      const input=await body(req); const ok=String(input.username||'').toLowerCase()==='admin' && await verify(String(input.password||'')).catch(()=>false);
      if (!ok) { state.count++; if(state.count>=5){state.until=Date.now()+5*60*1000;state.count=0;} attempts.set(ip,state); return send(res,401,{erro:'Usuário ou senha inválidos.'}); }
      attempts.delete(ip); const token=randomBytes(32).toString('base64url'); const csrf=randomBytes(24).toString('base64url'); sessions.set(token,{csrf,expires:Date.now()+8*60*60*1000});
      return send(res,200,{authenticated:true,csrf},{'Set-Cookie':`neo_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`});
    }
    if (req.method==='POST' && url.pathname==='/api/logout') { const current=requireSession(req,res,true); if(!current)return; sessions.delete(current.token); return send(res,200,{ok:true},{'Set-Cookie':'neo_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}); }
    if (req.method==='POST' && url.pathname==='/api/change-password') {
      if(!requireSession(req,res,true))return; const input=await body(req);
      if(!await verify(String(input.current||'')).catch(()=>false))return send(res,403,{erro:'Senha atual incorreta.'});
      if(String(input.password||'').length<12)return send(res,400,{erro:'Use pelo menos 12 caracteres.'});
      const temp=`${passwordFile}.new`; await writeFile(temp,await makeHash(String(input.password)),{mode:0o600}); await rename(temp,passwordFile); await unlink(join(root,'INITIAL_PASSWORD.txt')).catch(()=>{}); sessions.clear();
      return send(res,200,{ok:true,mensagem:'Senha alterada. Entre novamente.'},{'Set-Cookie':'neo_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
    }
    if (req.method==='POST' && url.pathname==='/api/admin') { if(!requireSession(req,res,true))return; const result=await proxyAdmin(await body(req)); return send(res,result.status,result.data); }
    if (req.method==='GET' && url.pathname==='/api/health') { if(!requireSession(req,res))return; const result=await proxyAdmin({action:'overview'}); return send(res,result.status,{...result.data,console:{up:true,startedAt:started}}); }
    if (req.method==='GET') return serve(req,res,url.pathname);
    send(res,405,{erro:'Método não permitido.'});
  } catch(error) { send(res,error.message==='BODY_TOO_LARGE'?413:500,{erro:'Falha interna do painel.'}); }
});
const started=Date.now();
server.listen(port,'0.0.0.0',()=>console.log(`Neo admin ativo na porta ${port}`));
