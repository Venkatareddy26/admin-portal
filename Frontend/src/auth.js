// Minimal auth helper for the frontend app
export function setToken(token){
  try{ localStorage.setItem('app_token', token); }catch(e){}
}

export function getToken(){
  try{ return localStorage.getItem('app_token'); }catch(e){ return null; }
}

export function clearToken(){
  try{ localStorage.removeItem('app_token'); }catch(e){}
}

export default { setToken, getToken, clearToken };
