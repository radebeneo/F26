const fs = require('fs');
const code = fs.readFileSync('src/db/seeds/players.ts', 'utf8');
const urls = [...code.matchAll(/imageUrl:\s*["'](https?:\/\/[^\/]+)/g)];
const domains = new Set(urls.map(m => m[1]));
console.log(Array.from(domains));
