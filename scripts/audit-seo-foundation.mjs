import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(process.argv.find(a=>a.startsWith('--root='))?.slice(7)||resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const site='https://neoterminalroom.com.br';
const read=p=>readFile(resolve(root,p),'utf8');
const attr=(tag,key)=>tag.match(new RegExp('\\b'+key+'=["\x27]([^"\x27]*)["\x27]','i'))?.[1]||'';
const locs=text=>[...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const files=['sitemap-static.xml','sitemap-games.xml'];
const urls=(await Promise.all(files.map(async file=>locs(await read(file))))).flat();
const counts={urls:urls.length,uniqueUrls:new Set(urls).size,games:0,static:0,withTitle:0,withDescription:0,oneH1:0,matchingCanonical:0,withOpenGraph:0,withSchema:0,withBreadcrumbs:0,withAnalytics:0};
const issues={},titles=new Map(),descriptions=new Map(),systems={};
function issue(type,url,detail=''){(issues[type]??=[]).push({url,detail});}
for(const url of urls){
 const pathname=decodeURIComponent(new URL(url).pathname);
 const path=pathname.endsWith('/')?pathname+'index.html':pathname;
 let html;try{html=await read(path.replace(/^\//,''));}catch{issue('missingFile',url);continue;}
 const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'';
 const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
 const description=attr(metas.find(m=>attr(m,'name')==='description')||'','content');
 const canonical=attr([...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).find(m=>attr(m,'rel')==='canonical')||'','href');
 const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
 const h1=[...markup.matchAll(/<h1\b/gi)].length;
 for(const match of markup.matchAll(/<a\b[^>]*>/gi)){
  const href=attr(match[0],'href');if(!href||href.startsWith('#'))continue;
  let target;try{target=new URL(href,url);}catch{continue;}
  if(target.origin!==site)continue;
  const targetPath=decodeURIComponent(target.pathname);
  const file=resolve(root,'.'+targetPath+(targetPath.endsWith('/')?'index.html':''));
  if(!existsSync(file))issue('missingInternalLink',url,target.pathname);
 }
 const game=pathname.startsWith('/jogos/');counts[game?'games':'static']++;
 if(game){const system=pathname.split('/')[2];systems[system]=(systems[system]||0)+1;}
 for(const [ok,key,type] of [[title,'withTitle','missingTitle'],[description,'withDescription','missingDescription'],[h1===1,'oneH1','h1Count'],[canonical===url,'matchingCanonical','canonicalMismatch'],[metas.some(m=>attr(m,'property')==='og:title'),'withOpenGraph','missingOpenGraph']]){if(ok)counts[key]++;else issue(type,url,type==='canonicalMismatch'?canonical:type==='h1Count'?String(h1):'');}
 if(/analytics-consent\.js/.test(html))counts.withAnalytics++;
 const schemas=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 if(schemas.length)counts.withSchema++;
 if(/BreadcrumbList/.test(html))counts.withBreadcrumbs++;
 for(const schema of schemas){try{JSON.parse(schema[1]);}catch{issue('invalidSchemaJson',url);}}
 if(metas.some(m=>attr(m,'name')==='robots'&&/noindex/.test(attr(m,'content'))))issue('noindexInSitemap',url);
 for(const [value,map] of [[title,titles],[description,descriptions]]){if(value)map.set(value,[...(map.get(value)||[]),url]);}
}
const duplicates=map=>[...map].filter(([,items])=>items.length>1).map(([text,items])=>({text,urls:items}));
const samples=[site+'/',site+'/robots.txt',site+'/sitemap.xml',site+'/sitemap-games.xml',site+'/sitemap-static.xml',site+'/apoie.html',site+'/ofertas.html',site+'/coletaneas.html',site+'/auditoria-url-inexistente-20260908/', 'http://neoterminalroom.com.br/','https://www.neoterminalroom.com.br/',...Object.keys(systems).map(system=>urls.find(url=>url.includes('/jogos/'+system+'/')))];
const live=[];
if(process.argv.includes('--live'))for(let i=0;i<samples.length;i+=4){await Promise.all(samples.slice(i,i+4).map(async url=>{try{const response=await fetch(url,{signal:AbortSignal.timeout(20000)});const html=await response.text();live.push({url,status:response.status,finalUrl:response.url,contentType:response.headers.get('content-type'),robots:response.headers.get('x-robots-tag'),canonical:attr([...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).find(m=>attr(m,'rel')==='canonical')||'','href')});}catch(error){live.push({url,error:error.message});}}));}
const result={auditedAt:new Date().toISOString(),scope:'All URLs in local sitemaps; live sample only, not Google indexing proof',counts,systems,issueCounts:Object.fromEntries(Object.entries(issues).map(([k,v])=>[k,v.length])),issues,duplicateTitles:duplicates(titles),duplicateDescriptions:duplicates(descriptions),live};
const output=resolve(root,process.argv.find(a=>a.startsWith('--output='))?.slice(9)||'docs/plano-90-dias/auditoria-seo.json');
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,issues:undefined,duplicateTitles:result.duplicateTitles.length,duplicateDescriptions:result.duplicateDescriptions.length},null,2));
