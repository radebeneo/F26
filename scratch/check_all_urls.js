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
  console.log(`Found ${urls.length} urls. Checking all...`);
  const failed = [];
  for (let i = 0; i < urls.length; i++) {
    const status = await checkUrl(urls[i]);
    if (status !== 200) {
      failed.push(`${status} - ${urls[i]}`);
    }
  }
  console.log('Failed URLs:');
  console.log(failed.join('\n'));
}

main();
