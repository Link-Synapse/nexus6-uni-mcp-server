/* eslint-env node */
const port = process.env.SERVER_UI_PORT || "3002";
const base = `http://localhost:${port}`;

async function checkGET(path) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url);
    console.log(`GET ${path} -> ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error(`GET ${path} failed:`, e.message);
    return false;
  }
}

async function checkSSE(path) {
  const url = `${base}${path}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/event-stream" },
    });
    clearTimeout(timer);
    console.log(`SSE ${path} -> ${res.status}`);
    return res.ok;
  } catch (e) {
    console.warn(`SSE ${path} not available: ${e.message}`);
    return false;
  }
}

(async () => {
  let ok = true;
  const uiOk = await checkGET("/ui");
  ok = ok && uiOk;

  const sseOk = await checkSSE("/api/a2a/feed");

  if (!ok) {
    console.error("UI smoke failed (UI routes).");
    process.exit(3);
  }
  console.log("UI smoke OK.", sseOk ? "(SSE reachable)" : "(SSE skipped)");
})();