export const $=id=>document.getElementById(id);
export function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
export function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{$('status').textContent='Storage unavailable. Export a backup before leaving.';return false;}}
export function download(name,value){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
export function announce(message){$('status').textContent=message;}
