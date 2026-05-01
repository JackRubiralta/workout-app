#!/usr/bin/env node
// Headless puppeteer driver for the expo-web build.
// Usage:
//   node scripts/sshot.js <name>                       # screenshot + diag the home page
//   node scripts/sshot.js <name> --click "<selector>"  # click element first
//   node scripts/sshot.js <name> --tapText "Day 1"     # click first node containing text
//   node scripts/sshot.js <name> --scroll 600          # scroll Y px
//
// Always writes /tmp/sshots/<name>.png and prints { width, scrollWidth, scrollHeight }.

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const name = args[0] || 'shot';
  const out = `/tmp/sshots/${name}.png`;
  fs.mkdirSync('/tmp/sshots', { recursive: true });

  const click = argFlag(args, '--click');
  const taps = argMulti(args, '--tapText'); // sequential
  const holds = argMulti(args, '--holdText'); // sequential, for HoldButton
  const scrollY = parseInt(argFlag(args, '--scroll') || '0', 10);
  const wait = parseInt(argFlag(args, '--wait') || '4000', 10);

  const seed = args.includes('--seed');
  const seedActive = args.includes('--seedActive');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
    defaultViewport: { width: 414, height: 896, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  });
  const page = await browser.newPage();

  if (seed || seedActive) {
    await page.evaluateOnNewDocument((withActive) => {
      function iso(daysAgo, hour = 9) {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        d.setHours(hour, 0, 0, 0);
        return d.toISOString();
      }
      function entry(exIndex, setIndex, name, label, isWarmup, weight, reps, ts) {
        return { exerciseIndex: exIndex, setIndex, exerciseName: name, setLabel: label, isWarmup,
          weight, reps, unit: 'lb', toFailure: false, restSeconds: 120, timestamp: ts, isPlaceholder: false };
      }
      const sessions = [
        { id: 's_d_1_0', startedAt: iso(1, 9), completedAt: iso(1, 10), abandonedAt: null,
          dayIndex: 0, dayTitle: 'PUSH', dayFocus: 'Chest Focus', dayColor: '#FF4757',
          entries: [
            entry(1, 1, 'Flat DB Bench Press', 'Set 1', false, 85, 8, iso(1, 9)),
            entry(1, 2, 'Flat DB Bench Press', 'Set 2', false, 85, 7, iso(1, 9)),
            entry(2, 0, 'Incline DB Bench Press', 'Set 1', false, 70, 10, iso(1, 9)),
            entry(2, 1, 'Incline DB Bench Press', 'Set 2', false, 70, 9, iso(1, 9)),
          ], undoStack: [] },
        { id: 's_d_3_1', startedAt: iso(3, 9), completedAt: iso(3, 10), abandonedAt: null,
          dayIndex: 1, dayTitle: 'PULL', dayFocus: 'Lat Focus', dayColor: '#3742FA',
          entries: [
            entry(2, 0, 'Lat Pulldowns', 'Set 1', false, 135, 10, iso(3, 9)),
            entry(2, 1, 'Lat Pulldowns', 'Set 2', false, 135, 9, iso(3, 9)),
            entry(2, 2, 'Lat Pulldowns', 'Set 3', false, 135, 8, iso(3, 9)),
          ], undoStack: [] },
        { id: 's_d_5_0', startedAt: iso(5, 9), completedAt: iso(5, 10), abandonedAt: null,
          dayIndex: 0, dayTitle: 'PUSH', dayFocus: 'Chest Focus', dayColor: '#FF4757',
          entries: [
            entry(1, 1, 'Flat DB Bench Press', 'Set 1', false, 80, 8, iso(5, 9)),
            entry(1, 2, 'Flat DB Bench Press', 'Set 2', false, 80, 7, iso(5, 9)),
            entry(2, 0, 'Incline DB Bench Press', 'Set 1', false, 65, 10, iso(5, 9)),
            entry(2, 1, 'Incline DB Bench Press', 'Set 2', false, 65, 10, iso(5, 9)),
          ], undoStack: [] },
        { id: 's_d_8_1', startedAt: iso(8, 9), completedAt: iso(8, 10), abandonedAt: null,
          dayIndex: 1, dayTitle: 'PULL', dayFocus: 'Lat Focus', dayColor: '#3742FA',
          entries: [
            entry(2, 0, 'Lat Pulldowns', 'Set 1', false, 130, 10, iso(8, 9)),
            entry(2, 1, 'Lat Pulldowns', 'Set 2', false, 130, 9, iso(8, 9)),
          ], undoStack: [] },
        { id: 's_d_10_0', startedAt: iso(10, 9), completedAt: iso(10, 10), abandonedAt: null,
          dayIndex: 0, dayTitle: 'PUSH', dayFocus: 'Chest Focus', dayColor: '#FF4757',
          entries: [
            entry(1, 1, 'Flat DB Bench Press', 'Set 1', false, 75, 8, iso(10, 9)),
            entry(1, 2, 'Flat DB Bench Press', 'Set 2', false, 75, 8, iso(10, 9)),
            entry(2, 0, 'Incline DB Bench Press', 'Set 1', false, 60, 10, iso(10, 9)),
          ], undoStack: [] },
        { id: 's_d_15_1', startedAt: iso(15, 9), completedAt: iso(15, 10), abandonedAt: null,
          dayIndex: 1, dayTitle: 'PULL', dayFocus: 'Lat Focus', dayColor: '#3742FA',
          entries: [
            entry(2, 0, 'Lat Pulldowns', 'Set 1', false, 125, 10, iso(15, 9)),
            entry(2, 1, 'Lat Pulldowns', 'Set 2', false, 125, 9, iso(15, 9)),
          ], undoStack: [] },
        // Older period — gives the trend chip a baseline.
        { id: 's_d_32_0', startedAt: iso(32, 9), completedAt: iso(32, 10), abandonedAt: null,
          dayIndex: 0, dayTitle: 'PUSH', dayFocus: 'Chest Focus', dayColor: '#FF4757',
          entries: [
            entry(1, 1, 'Flat DB Bench Press', 'Set 1', false, 70, 8, iso(32, 9)),
            entry(1, 2, 'Flat DB Bench Press', 'Set 2', false, 70, 7, iso(32, 9)),
            entry(2, 0, 'Incline DB Bench Press', 'Set 1', false, 55, 10, iso(32, 9)),
          ], undoStack: [] },
        { id: 's_d_36_1', startedAt: iso(36, 9), completedAt: iso(36, 10), abandonedAt: null,
          dayIndex: 1, dayTitle: 'PULL', dayFocus: 'Lat Focus', dayColor: '#3742FA',
          entries: [
            entry(2, 0, 'Lat Pulldowns', 'Set 1', false, 120, 10, iso(36, 9)),
            entry(2, 1, 'Lat Pulldowns', 'Set 2', false, 120, 8, iso(36, 9)),
          ], undoStack: [] },
        { id: 's_d_42_0', startedAt: iso(42, 9), completedAt: iso(42, 10), abandonedAt: null,
          dayIndex: 0, dayTitle: 'PUSH', dayFocus: 'Chest Focus', dayColor: '#FF4757',
          entries: [
            entry(1, 1, 'Flat DB Bench Press', 'Set 1', false, 65, 8, iso(42, 9)),
            entry(2, 0, 'Incline DB Bench Press', 'Set 1', false, 50, 10, iso(42, 9)),
          ], undoStack: [] },
      ];
      let activeSessionId = null;
      if (withActive) {
        // Add a half-finished PUSH session for today
        const todayId = 's_active_today';
        sessions.unshift({
          id: todayId, startedAt: iso(0, 9), completedAt: null, abandonedAt: null,
          dayIndex: 0, dayTitle: 'PUSH', dayFocus: 'Chest Focus', dayColor: '#FF4757',
          entries: [
            entry(0, 0, 'Bike Warmup', 'Warm-up', false, 0, 0, iso(0, 9)),
            entry(1, 0, 'Flat DB Bench Press', 'Warm-up', true, 50, 12, iso(0, 9)),
            entry(1, 1, 'Flat DB Bench Press', 'Set 1', false, 80, 8, iso(0, 9)),
          ], undoStack: [],
        });
        activeSessionId = todayId;
      }
      localStorage.setItem('@workout_sessions_v2', JSON.stringify({ sessions, activeSessionId }));
      localStorage.setItem('@app_meta_v2', JSON.stringify({ schemaVersion: 2, migratedAt: new Date().toISOString() }));

      function fmt(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      const logsByDate = {};
      // 14 days: prior 7 (older) and recent 7 (newer). Recent runs higher
      // so the trend chip has a positive baseline.
      const dayPattern = [
        // older 7 (-13 → -7)
        [1900, 145, 200, 60, 22],
        [2050, 155, 215, 62, 24],
        [1820, 140, 195, 55, 21],
        [2180, 165, 225, 65, 26],
        [1950, 150, 205, 60, 22],
        [2200, 170, 230, 64, 25],
        [2010, 158, 215, 60, 24],
        // recent 7 (-6 → 0)
        [2350, 185, 240, 70, 30],
        [2180, 170, 220, 65, 28],
        [2520, 200, 260, 75, 32],
        [1900, 150, 200, 55, 25],
        [2400, 180, 250, 70, 28],
        [2100, 165, 220, 60, 26],
        [765, 77, 70, 13, 3.5], // today, partial
      ];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const idx = 13 - i;
        const [cal, p, c, f, fi] = dayPattern[idx];
        const items = [
          { id: 'f' + i + 'a', name: 'Greek yogurt with berries', quantity: 1, unit: 'cup', calories: Math.round(cal * 0.18), protein: Math.round(p * 0.18), carbs: Math.round(c * 0.2), fat: Math.round(f * 0.1), fiber: 3, addedAt: iso(i, 8) },
          // multi-component meal — sushi platter
          { id: 'f' + i + 'b', name: 'Sushi platter', quantity: 8, unit: 'pieces', calories: Math.round(cal * 0.45), protein: Math.round(p * 0.5), carbs: Math.round(c * 0.45), fat: Math.round(f * 0.4), fiber: Math.round(fi * 0.4), addedAt: iso(i, 13),
            source: 'photo', confidence: 'high', notes: 'Mixed nigiri and rolls',
            components: [
              { name: 'Salmon nigiri', quantity: 2, unit: 'pieces', calories: 90, protein: 9, carbs: 13, fat: 2, fiber: 0 },
              { name: 'Tuna roll', quantity: 6, unit: 'pieces', calories: 220, protein: 16, carbs: 38, fat: 3, fiber: 1 },
              { name: 'Avocado roll', quantity: 4, unit: 'pieces', calories: 180, protein: 3, carbs: 32, fat: 5, fiber: 4 },
              { name: 'Edamame', quantity: 1, unit: 'cup', calories: 120, protein: 11, carbs: 9, fat: 5, fiber: 4 },
              { name: 'Soy sauce', quantity: 1, unit: 'tbsp', calories: 8, protein: 1, carbs: 1, fat: 0, fiber: 0 },
            ],
          },
          { id: 'f' + i + 'c', name: 'Salmon & veg', quantity: 1, unit: 'plate', calories: Math.round(cal * 0.37), protein: Math.round(p * 0.32), carbs: Math.round(c * 0.35), fat: Math.round(f * 0.5), fiber: Math.round(fi * 0.6), addedAt: iso(i, 19) },
        ];
        logsByDate[fmt(d)] = items;
      }
      localStorage.setItem('@nutrition_log_v2', JSON.stringify({
        logsByDate,
        goals: { calories: 2400, protein: 180, carbs: 250, fat: 70 },
      }));

      // body weight series — gentle downward trend over 6 weeks
      const bwEntries = [];
      const bwSeries = [180.5, 180.2, 179.8, 179.4, 179.1, 178.6, 178.2, 177.8, 177.5, 177.2, 176.8, 176.4];
      for (let i = bwSeries.length - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 4); // every ~4 days
        d.setHours(7, 30, 0, 0);
        bwEntries.push({
          id: 'bw_' + i,
          weight: bwSeries[bwSeries.length - 1 - i],
          unit: 'lb',
          recordedAt: d.toISOString(),
        });
      }
      localStorage.setItem('@bodyweight_log_v2', JSON.stringify({ entries: bwEntries }));
    }, seedActive);
  }

  page.on('pageerror', e => console.error('[pageerror]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console.error]', m.text()); });

  await page.goto(`http://localhost:${process.env.SSHOT_PORT || 8765}/`, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(wait);

  for (const needle of taps) {
    const handle = await page.evaluateHandle((s) => {
      const leaf = Array.from(document.querySelectorAll('*'))
        .find(el => el.children.length === 0 && (el.textContent || '').trim() === s)
        || Array.from(document.querySelectorAll('*'))
          .find(el => el.children.length === 0 && (el.textContent || '').trim().includes(s));
      if (!leaf) return null;
      let cur = leaf;
      while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        if (cur.tagName === 'A' || cur.tagName === 'BUTTON' || cur.getAttribute('role') === 'button'
            || cur.getAttribute('tabindex') !== null || cs.cursor === 'pointer') {
          return cur;
        }
        cur = cur.parentElement;
      }
      return leaf;
    }, needle);
    const el = handle && (await handle.asElement());
    if (el) {
      const box = await el.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      } else {
        await el.click();
      }
      await sleep(wait);
    } else {
      console.error(`tapText("${needle}") found no node`);
    }
  }
  if (click) {
    await page.click(click).catch(e => console.error('click failed:', e.message));
    await sleep(wait);
  }

  // Hold-press a HoldButton (700ms by default — longer than the 650ms threshold)
  for (const needle of holds) {
    const handle = await page.evaluateHandle((s) => {
      const leaf = Array.from(document.querySelectorAll('*'))
        .find(el => el.children.length === 0 && (el.textContent || '').trim() === s)
        || Array.from(document.querySelectorAll('*'))
          .find(el => el.children.length === 0 && (el.textContent || '').trim().includes(s));
      if (!leaf) return null;
      let cur = leaf;
      while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        if (cs.cursor === 'pointer') return cur;
        cur = cur.parentElement;
      }
      return leaf;
    }, needle);
    const el = handle && (await handle.asElement());
    if (el) {
      const box = await el.boundingBox();
      if (box) {
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await sleep(750); // longer than holdDuration in HoldButton
        await page.mouse.up();
      }
      await sleep(wait);
    } else {
      console.error(`holdText("${needle}") found no node`);
    }
  }

  if (scrollY) {
    // RN-web ScrollView is a nested div with overflow-y:auto; scroll it directly.
    await page.evaluate(y => {
      const candidates = Array.from(document.querySelectorAll('*')).filter(el => {
        const cs = getComputedStyle(el);
        return (cs.overflowY === 'auto' || cs.overflowY === 'scroll')
          && el.scrollHeight > el.clientHeight + 4;
      });
      candidates.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));
      const target = candidates[0] || document.scrollingElement;
      target.scrollTop = (target.scrollTop || 0) + y;
      window.scrollBy(0, y);
    }, scrollY);
    await sleep(900);
  }

  const diag = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    bodyWidth: document.body.scrollWidth,
    devicePixelRatio: window.devicePixelRatio,
  }));
  console.log(JSON.stringify(diag));

  await page.screenshot({ path: out });
  await browser.close();
  console.log(out);
}

function argFlag(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
function argMulti(args, name) {
  const out = [];
  for (let i = 0; i < args.length; i++) if (args[i] === name && args[i + 1] != null) out.push(args[i + 1]);
  return out;
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
main().catch(e => { console.error(e); process.exit(1); });
