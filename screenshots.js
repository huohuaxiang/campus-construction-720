// 无头 Chrome 批量截图：node screenshots.js [--days=0,210,720] [--weather=clear,rain] [--tods=noon,night] [--cams=overview,entrance]
const puppeteer = require('puppeteer-core');
const path = require('path'); const fs = require('fs');
const args = Object.fromEntries(process.argv.slice(2).map(s => s.replace(/^--/, '').split('=')));
const days = (args.days || '0,210,360,520,720').split(',').map(Number);
const weathers = (args.weather || 'clear,cloudy,overcast,rain,fog').split(',');
const tods = (args.tods || 'dawn,noon,dusk,night').split(',');
const cams = (args.cams || 'overview,entrance,field,B01,B02,B03,B04,B05,B06,B07,B08,B09,B10').split(',');
const out = path.resolve(args.out || 'shots');
fs.mkdirSync(out, { recursive: true });
const file = path.resolve('校园建造720天.html');
const exe = process.env.CHROME || '/usr/local/bin/chromium';
(async () => {
  const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'] });
  let errors = 0;
  for (const day of days) for (const weather of weathers) for (const tod of tods) for (const cam of cams) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
    page.on('pageerror', e => { errors++; console.error('PAGEERROR', day, weather, tod, cam, e.message); });
    page.on('console', m => { if (m.type() === 'error') { errors++; console.error('CONSOLE', day, weather, tod, cam, m.text()); } });
    const url = 'file://' + file + `?day=${day}&weather=${weather}&tod=${tod}&cam=${cam}&hud=0&still=1`;
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    try { await page.waitForFunction('window.__READY===true', { timeout: 60000 }); }
    catch { errors++; console.error('NOT READY', day, weather, tod, cam); await page.close(); continue; }
    await new Promise(r => setTimeout(r, 350));
    const name = `d${String(day).padStart(3,'0')}-${weather}-${tod}-${cam}.png`;
    await page.screenshot({ path: path.join(out, name) });
    console.log(name);
    await page.close();
  }
  await browser.close();
  if (errors) { console.error(`FAILED with ${errors} page errors`); process.exit(1); }
  console.log('OK');
})();