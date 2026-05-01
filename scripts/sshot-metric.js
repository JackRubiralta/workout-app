const puppeteer = require('puppeteer-core');
const fs = require('fs');
async function main() {
  const args = process.argv.slice(2);
  const name = args[0] || 'metric';
  const tap = args[1];
  fs.mkdirSync('/tmp/sshots', { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium', headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
    defaultViewport: { width: 414, height: 896, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    function iso(d, h=9){const x=new Date();x.setDate(x.getDate()-d);x.setHours(h,0,0,0);return x.toISOString();}
    function entry(ei, si, name, label, w, isWarmup, weight, reps, ts){return {exerciseIndex:ei,setIndex:si,exerciseName:name,setLabel:label,isWarmup,weight,reps,unit:'lb',toFailure:false,restSeconds:120,timestamp:ts,isPlaceholder:false};}
    const sessions = [
      { id:'s_1', startedAt:iso(1,9), completedAt:iso(1,10), abandonedAt:null, dayIndex:0, dayTitle:'PUSH', dayFocus:'Chest', dayColor:'#FF4757',
        entries:[entry(1,1,'Flat DB Bench','Set 1',false,false,80,8,iso(1,9)), entry(1,2,'Flat DB Bench','Set 2',false,false,80,7,iso(1,9))], undoStack:[]},
      { id:'s_2', startedAt:iso(3,9), completedAt:iso(3,10), abandonedAt:null, dayIndex:0, dayTitle:'PUSH', dayFocus:'Chest', dayColor:'#FF4757',
        entries:[entry(1,1,'Flat DB Bench','Set 1',false,false,75,8,iso(3,9))], undoStack:[]},
    ];
    localStorage.setItem('@workout_sessions_v2', JSON.stringify({sessions, activeSessionId:null}));
    localStorage.setItem('@app_meta_v2', JSON.stringify({schemaVersion:2}));
    localStorage.setItem('@bodyweight_log_v2', JSON.stringify({entries:[
      {id:'b1', weight:180, unit:'lb', recordedAt:iso(20,8)},
      {id:'b2', weight:178, unit:'lb', recordedAt:iso(10,8)},
      {id:'b3', weight:176.4, unit:'lb', recordedAt:iso(0,8)},
    ]}));
    localStorage.setItem('@settings_v2', JSON.stringify({unitSystem:'metric'}));
  });
  await page.goto('http://localhost:8765/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));
  if (tap) {
    const handle = await page.evaluateHandle((s) => {
      const leaf = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && (el.textContent||'').trim() === s)
        || Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && (el.textContent||'').trim().includes(s));
      if (!leaf) return null;
      let cur = leaf;
      while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        if (cur.tagName === 'A' || cur.tagName === 'BUTTON' || cur.getAttribute('role') === 'button' || cs.cursor === 'pointer') return cur;
        cur = cur.parentElement;
      }
      return leaf;
    }, tap);
    const el = handle && await handle.asElement();
    if (el) { const box = await el.boundingBox(); if (box) await page.mouse.click(box.x+box.width/2, box.y+box.height/2); }
    await new Promise(r => setTimeout(r, 2500));
  }
  await page.screenshot({ path: `/tmp/sshots/${name}.png` });
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
