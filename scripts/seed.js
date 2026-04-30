#!/usr/bin/env node
// Inject demo sessions into the running app's localStorage so we can see
// populated history / non-empty nutrition for visual review. Run while
// expo-web is up at http://localhost:8765.

const puppeteer = require('puppeteer-core');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
    defaultViewport: { width: 414, height: 896, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:8765/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);

  await page.evaluate(() => {
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

    function pushSession(daysAgo, dayIndex, dayTitle, dayFocus, dayColor, completed, entries) {
      return {
        id: 's_demo_' + daysAgo + '_' + dayIndex,
        startedAt: iso(daysAgo, 9),
        completedAt: completed ? iso(daysAgo, 10) : null,
        abandonedAt: null,
        dayIndex, dayTitle, dayFocus, dayColor,
        entries, undoStack: [],
      };
    }

    const sessions = [
      // 6 days ago — PUSH
      pushSession(6, 0, 'PUSH', 'Chest Focus', '#FF4757', true, [
        entry(0, 0, 'Bike Warmup', 'Warm-up', false, 0, 0, iso(6, 9)),
        entry(1, 0, 'Flat DB Bench Press', 'Warm-up', true, 50, 12, iso(6, 9)),
        entry(1, 1, 'Flat DB Bench Press', 'Set 1', false, 75, 8, iso(6, 9)),
        entry(1, 2, 'Flat DB Bench Press', 'Set 2', false, 75, 8, iso(6, 9)),
        entry(2, 0, 'Incline DB Bench Press', 'Set 1', false, 60, 10, iso(6, 9)),
        entry(2, 1, 'Incline DB Bench Press', 'Set 2', false, 60, 9, iso(6, 9)),
        entry(2, 2, 'Incline DB Bench Press', 'Set 3', false, 60, 8, iso(6, 9)),
      ]),
      // 4 days ago — PULL
      pushSession(4, 1, 'PULL', 'Lat Focus', '#3742FA', true, [
        entry(0, 0, 'Bike Warmup', 'Warm-up', false, 0, 0, iso(4, 9)),
        entry(1, 0, 'Pull-Ups (overhand, wide)', 'Set 1', false, 0, 8, iso(4, 9)),
        entry(1, 1, 'Pull-Ups (overhand, wide)', 'Set 2', false, 0, 7, iso(4, 9)),
        entry(1, 2, 'Pull-Ups (overhand, wide)', 'Set 3', false, 0, 6, iso(4, 9)),
        entry(2, 0, 'Lat Pulldowns', 'Set 1', false, 130, 10, iso(4, 9)),
        entry(2, 1, 'Lat Pulldowns', 'Set 2', false, 130, 9, iso(4, 9)),
      ]),
      // 2 days ago — PUSH again with PR
      pushSession(2, 0, 'PUSH', 'Chest Focus', '#FF4757', true, [
        entry(1, 1, 'Flat DB Bench Press', 'Set 1', false, 80, 8, iso(2, 9)),  // PR
        entry(1, 2, 'Flat DB Bench Press', 'Set 2', false, 80, 7, iso(2, 9)),
        entry(2, 0, 'Incline DB Bench Press', 'Set 1', false, 65, 10, iso(2, 9)),
        entry(2, 1, 'Incline DB Bench Press', 'Set 2', false, 65, 10, iso(2, 9)),
      ]),
    ];

    const v2 = { sessions, activeSessionId: null };
    localStorage.setItem('@workout_sessions_v2', JSON.stringify(v2));
    localStorage.setItem('@app_meta_v2', JSON.stringify({ schemaVersion: 2, migratedAt: new Date().toISOString() }));

    // Some food logged today
    function fmt(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    const today = new Date();
    const dateKey = fmt(today);
    const items = [
      { id: 'f1', name: 'Greek yogurt with berries', quantity: 1, unit: 'cup', calories: 220, protein: 17, carbs: 25, fat: 4, fiber: 3, addedAt: iso(0, 8) },
      { id: 'f2', name: 'Grilled chicken breast', quantity: 200, unit: 'g', calories: 330, protein: 60, carbs: 0, fat: 7, fiber: 0, addedAt: iso(0, 13) },
      { id: 'f3', name: 'Brown rice', quantity: 1, unit: 'cup', calories: 215, protein: 5, carbs: 45, fat: 1.5, fiber: 3.5, addedAt: iso(0, 13) },
    ];
    const nut = {
      logsByDate: { [dateKey]: items },
      goals: { calories: 2400, protein: 180, carbs: 250, fat: 70 },
    };
    localStorage.setItem('@nutrition_log_v2', JSON.stringify(nut));
  });
  console.log('seeded');
  await browser.close();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
main().catch(e => { console.error(e); process.exit(1); });
