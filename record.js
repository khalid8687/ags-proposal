const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const videos = [
  { file: 'v1.html', out: 'vid1.webm', name: '2AM Crisis' },
  { file: 'v2.html', out: 'vid2.webm', name: '67% Revenue Stat' },
  { file: 'v3.html', out: 'vid3.webm', name: 'Zero CAPEX Deploy' },
  { file: 'v4.html', out: 'vid4.webm', name: 'AI WhatsApp Support' },
];

const ANIM_DIR = path.resolve(__dirname, 'animations');
const OUT_DIR  = path.resolve(__dirname, 'videos');
const TMP_DIR  = path.resolve(__dirname, '_tmp_vid');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const v of videos) {
    console.log(`\n🎬  Recording: ${v.name}...`);

    // Clean tmp dir before each recording
    fs.readdirSync(TMP_DIR).forEach(f => fs.unlinkSync(path.join(TMP_DIR, f)));

    const context = await browser.newContext({
      viewport: { width: 960, height: 540 },
      recordVideo: {
        dir: TMP_DIR,
        size: { width: 960, height: 540 },
      },
    });

    const page = await context.newPage();
    const animPath = path.join(ANIM_DIR, v.file);
    await page.goto('file:///' + animPath.replace(/\\/g, '/'));

    // Wait 8.5s for animation to complete + 0.5s buffer
    await page.waitForTimeout(9000);

    await context.close(); // triggers video save

    // Find the recorded file and move it
    await new Promise(r => setTimeout(r, 1000)); // wait for file to flush
    const files = fs.readdirSync(TMP_DIR);
    if (files.length > 0) {
      const src = path.join(TMP_DIR, files[0]);
      const dst = path.join(OUT_DIR, v.out);
      fs.renameSync(src, dst);
      const size = (fs.statSync(dst).size / 1024).toFixed(0);
      console.log(`   ✅  Saved: videos/${v.out}  (${size} KB)`);
    } else {
      console.log(`   ❌  No video file found for ${v.name}`);
    }
  }

  await browser.close();
  console.log('\n🏁  All videos recorded successfully!\n');
})();
