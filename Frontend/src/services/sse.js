// Lightweight SSE/event-emitter helper used by dashboard
const listeners = {};

function on(event, cb){
  if(!listeners[event]) listeners[event] = new Set();
  listeners[event].add(cb);
}

function off(event, cb){
  if(!listeners[event]) return;
  listeners[event].delete(cb);
}

function emit(event, data){
  if(!listeners[event]) return;
  for(const cb of Array.from(listeners[event])){
    try{ cb(data); }catch(e){ console.error('sse listener error', e); }
  }
}

// Optionally connect to real SSE endpoint if available
if(typeof window !== 'undefined' && window.EventSource){
  try{
    // allow overriding API base at runtime (window.__API_BASE__) or via Vite env VITE_API_BASE
    const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4001';
    const base = (API_BASE || '').replace(/\/$/, '');
    const es = new EventSource(base + '/sse');
    es.addEventListener('message', e => {
      try{
        const payload = JSON.parse(e.data || '{}');
        if(payload && payload.type) emit(payload.type, payload.data);
        else emit('message', payload);
      }catch(err){
        emit('message', e.data);
      }
    });
    es.addEventListener('error', e => { emit('error', e); });
  }catch(err){ /* ignore connection errors, app uses fallback emitter */ }
}

export default { on, off, emit };
