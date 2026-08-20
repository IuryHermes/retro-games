const base='http://127.0.0.1:8790';
const password=process.env.ADMIN_PASSWORD;
if(!password)throw new Error('Defina ADMIN_PASSWORD sem gravar a senha no codigo ou no repositorio.');
const username=process.env.ADMIN_USERNAME||'admin';
const login=await fetch(`${base}/api/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
const loginData=await login.json();
if(!login.ok)throw new Error(`login HTTP ${login.status}`);
const cookie=login.headers.get('set-cookie')?.split(';')[0]||'';
for(const [action,detail] of [['overview',{}],['accounts',{}],['referrals-admin',{}],['rooms',{}],['payments',{}],['games',{system:'snes'}],['audit',{}]]){
  const admin=await fetch(`${base}/api/admin`,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':loginData.csrf,Cookie:cookie},body:JSON.stringify({action,...detail})});
  const data=await admin.json();
  if(!admin.ok)throw new Error(`${action} HTTP ${admin.status}: ${data.erro||''}`);
  console.log(JSON.stringify({action,status:admin.status}));
}
