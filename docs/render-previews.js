// Renders Postman-style SAMPLE panels (expected request/response) to docs/screenshots/preview/<id>.png
const path = require('path');
const { chromium } = require('playwright');
const { items, queryString, BASE_URL } = require('./api-spec');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const colors = { GET: '#2e7d32', POST: '#b26a00', PUT: '#1565c0', DELETE: '#c62828' };
const hl = (json) => esc(json).replace(/"([^"]+)":/g, '<span style="color:#9c27b0">"$1"</span>:')
  .replace(/: "([^"]*)"/g, ': <span style="color:#1b5e20">"$1"</span>')
  .replace(/: (-?\d+\.?\d*|true|false)/g, ': <span style="color:#0d47a1">$1</span>');
const html = (it) => {
  const url = BASE_URL + it.path.replace(/\{\{destinationId\}\}/, it.expected.data && it.expected.data._id ? it.expected.data._id : ':id') + queryString(it.query);
  const body = it.bodyPreview || it.body;
  const ok = it.status < 400;
  return `<html><body style="margin:0;background:#fff;font-family:Inter,Arial,sans-serif;width:1100px">
  <div style="background:#ff6c37;color:#fff;padding:8px 16px;font-weight:700;font-size:14px">Postman &nbsp;·&nbsp; Destiny Travels API &nbsp;·&nbsp; ${esc(it.id)}</div>
  <div style="display:flex;gap:10px;padding:14px 16px;border-bottom:1px solid #ddd;align-items:center">
    <div style="background:#f3f3f3;border:1px solid #ccc;border-radius:4px;padding:7px 14px;font-weight:700;color:${colors[it.method]}">${it.method}</div>
    <div style="flex:1;background:#f3f3f3;border:1px solid #ccc;border-radius:4px;padding:7px 12px;font:13px 'DejaVu Sans Mono',monospace;word-break:break-all">${esc(url)}</div>
    <div style="background:#1565c0;color:#fff;border-radius:4px;padding:8px 20px;font-weight:700">Send</div></div>
  ${body ? `<div style="padding:10px 16px 0;font-size:12px;color:#555;font-weight:700">Body · raw · JSON${it.bodyNote ? ' — ' + esc(it.bodyNote) : ''}</div>
  <pre style="margin:6px 16px;padding:10px;background:#fafafa;border:1px solid #e3e3e3;font:12px/1.45 'DejaVu Sans Mono',monospace;white-space:pre-wrap">${hl(JSON.stringify(body, null, 2))}</pre>` : ''}
  <div style="padding:10px 16px;font-size:13px;border-top:1px solid #ddd;display:flex;gap:18px;align-items:center">
    <b>Response</b><span style="color:${ok ? '#2e7d32' : '#c62828'};font-weight:700">${it.status} ${{200:'OK',201:'Created',400:'Bad Request',404:'Not Found',409:'Conflict'}[it.status]}</span><span style="color:#777">Body · Pretty · JSON</span></div>
  <pre style="margin:0 16px 8px;padding:10px;background:#fafafa;border:1px solid #e3e3e3;font:12px/1.45 'DejaVu Sans Mono',monospace;white-space:pre-wrap">${hl(JSON.stringify(it.expected, null, 2))}</pre>
  ${it.expectedNote ? `<div style="padding:0 16px 6px;font-size:11px;color:#777">${esc(it.expectedNote)}</div>` : ''}
  <div style="margin:6px 16px 12px;padding:6px 10px;background:#fff8e1;border:1px solid #ffe082;font-size:11px;color:#6d4c00">SAMPLE OUTPUT — illustrates the expected request and response. Not captured from a live run. IDs and timestamps will differ.</div>
  </body></html>`;
};
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 400 }, deviceScaleFactor: 2 });
  for (const it of items) {
    await page.setContent(html(it));
    await page.locator('body').screenshot({ path: path.join(__dirname, 'screenshots', 'preview', it.id + '.png') });
  }
  await browser.close();
  console.log(items.length + ' preview panels rendered');
})();
