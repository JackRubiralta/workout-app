// Quick driver: pre-seeds profile + body weight + program data so the
// onboarding screen is skipped, then taps the Coach tab and screenshots.
// Used to verify the post-onboarding chat empty-state and conversation
// rendering without going through manual form-fill.

const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function main() {
  const name = process.argv[2] || 'coach';
  fs.mkdirSync('/tmp/sshots', { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
    defaultViewport: { width: 414, height: 896, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    function iso(daysAgo, hour = 9) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, 0, 0, 0);
      return d.toISOString();
    }
    localStorage.setItem('@settings_v2', JSON.stringify({
      unitSystem: 'imperial',
      profile: { name: 'Jack', heightCm: 178 },
    }));
    localStorage.setItem('@bodyweight_log_v2', JSON.stringify({
      entries: [{ id: 'bw1', weight: 178.2, unit: 'lb', recordedAt: iso(2, 8) }],
    }));
    localStorage.setItem('@app_meta_v2', JSON.stringify({ schemaVersion: 2, migratedAt: iso(0) }));
  });

  page.on('pageerror', e => console.error('[pageerror]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console.error]', m.text()); });

  await page.goto(`http://localhost:${process.env.SSHOT_PORT || 8771}/`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await sleep(4000);

  // Tab labels use CSS text-transform:uppercase, so the DOM text is still
  // the original "Coach" — match against that.
  await tapText(page, 'Coach');
  await sleep(2500);

  if (process.env.SSHOT_TAP_PROFILE) {
    await tapText(page, 'Edit profile');
    await sleep(1500);
  }

  await page.screenshot({ path: `/tmp/sshots/${name}.png` });
  await browser.close();
  console.log(`/tmp/sshots/${name}.png`);
}

async function tapText(page, needle) {
  const handle = await page.evaluateHandle(s => {
    const leaf = Array.from(document.querySelectorAll('*'))
      .find(el => el.children.length === 0 && (el.textContent || '').trim() === s)
      || Array.from(document.querySelectorAll('*'))
        .find(el => el.children.length === 0 && (el.textContent || '').trim().includes(s));
    if (!leaf) return null;
    let cur = leaf;
    while (cur && cur !== document.body) {
      const cs = getComputedStyle(cur);
      if (
        cur.tagName === 'A' ||
        cur.tagName === 'BUTTON' ||
        cur.getAttribute('role') === 'button' ||
        cur.getAttribute('tabindex') !== null ||
        cs.cursor === 'pointer'
      ) {
        return cur;
      }
      cur = cur.parentElement;
    }
    return leaf;
  }, needle);
  const el = handle && (await handle.asElement());
  if (!el) {
    console.error(`tapText("${needle}") not found`);
    return;
  }
  const box = await el.boundingBox();
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  else await el.click();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
