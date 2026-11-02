export async function api(resource:string,body?:unknown){
 const key=sessionStorage.getItem('owner-key');
 const headers:Record<string,string>={'Content-Type':'application/json',...(key?{Authorization:'Bearer '+key}:{})};
 const r=await fetch('/api/'+resource,{headers,...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})});
 const d=await r.json();if(!r.ok)throw new Error(d.error||'Something went wrong. Please try again.');return d;
}
