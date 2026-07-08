const fs = require('fs');
const https = require('https');

const code = fs.readFileSync('src/db/seeds/players.ts', 'utf8');
const urls = [...code.matchAll(/imageUrl:\s*["'](https?:\/\/[^\/]+[^"']+)["']/g)].map(m => m[1]);

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', (e) => {
      resolve(e.message);
    });
  });
}

async function main() {
  console.log(`Found ${urls.length} urls. Checking first 10...`);
  for (let i = 0; i < 10 && i < urls.length; i++) {
    const status = await checkUrl(urls[i]);
    console.log(`${status} - ${urls[i]}`);
  }
}

main();
