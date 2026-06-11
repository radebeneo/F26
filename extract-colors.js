const fs = require('fs');
const PNG = require('pngjs').PNG;

function getSwatches(imagePath) {
  return new Promise((resolve) => {
    fs.createReadStream(imagePath)
      .pipe(new PNG({ filterType: 4 }))
      .on('parsed', function() {
        const colors = {};
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const idx = (this.width * y + x) << 2;
            const r = this.data[idx];
            const g = this.data[idx + 1];
            const b = this.data[idx + 2];
            const a = this.data[idx + 3];

            if (a < 255) continue;

            const hex = '#' + 
              r.toString(16).padStart(2, '0') + 
              g.toString(16).padStart(2, '0') + 
              b.toString(16).padStart(2, '0');
            
            if (!colors[hex]) {
              colors[hex] = { count: 0, sumX: 0, sumY: 0 };
            }
            colors[hex].count++;
            colors[hex].sumX += x;
            colors[hex].sumY += y;
          }
        }

        const swatches = Object.entries(colors)
          .filter(([hex, data]) => data.count > 4000 && data.count < 5000)
          .map(([hex, data]) => ({
            hex,
            x: Math.round(data.sumX / data.count),
            y: Math.round(data.sumY / data.count),
            count: data.count
          }));
        
        // Sort by column (x), then by row (y)
        swatches.sort((a, b) => {
          if (Math.abs(a.x - b.x) > 100) return a.x - b.x;
          return a.y - b.y;
        });

        resolve(swatches);
      });
  });
}

async function run() {
  const images = ['web-colors.png'];
  for (const img of images) {
    console.log(`\n--- ${img} ---`);
    const swatches = await getSwatches(`public/colors/${img}`);
    console.log(swatches.map(s => `${s.hex} (x:${s.x}, y:${s.y})`).join('\n'));
  }
}

run();
