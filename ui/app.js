async function appendLog(){
  const line = document.getElementById('logLine').value;
  const r = await fetch('/api/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({agent:'Axlon', message: line})});
  alert('Logged: ' + (await r.text()));
}

async function hashText(){
  const text = document.getElementById('hashText').value;
  const r = await fetch('/api/hash', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text})});
  document.getElementById('hashOut').textContent = await r.text();
}

function connectFeed(){
  const ev = new EventSource('/api/a2a/feed');
  const log = document.getElementById('log');
  ev.onmessage = (m)=>{
    const d = JSON.parse(m.data);
    log.textContent += `\n[${new Date(d.ts).toLocaleTimeString()}] ${d.from} → ${d.to}: ${d.body}`;
  };
}

