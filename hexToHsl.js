const fs = require('fs');

function hexToHsl(hex) {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const palette = {
  neutral: {
    50:  "#f7f7f8", 100: "#ededf1", 200: "#d8d9df", 300: "#b6b7c3",
    400: "#8e90a2", 500: "#707287", 600: "#5a5b6f", 700: "#49495b",
    800: "#3f404d", 900: "#383842", 950: "#29292e",
  },
  primaryBrand: {
    50:  "#edf9ff", 100: "#d7f0ff", 200: "#b9e7ff", 300: "#88daff",
    400: "#50c3ff", 500: "#28a5ff", 600: "#0a84ff", 700: "#005cff",
    800: "#004bd5", 900: "#0244a6", 950: "#03122b",
  },
  secondaryGreen: {
    50:  "#f1fcf3", 100: "#defae4", 200: "#bef4cb", 300: "#8beaa2",
    400: "#51d772", 500: "#30d158", 600: "#1d9c3d", 700: "#1a7b32",
    800: "#1a612d", 900: "#175027", 950: "#072c12",
  },
  secondaryRed: {
    50:  "#fff1f2", 100: "#ffe4e7", 200: "#fecdd4", 300: "#fda4b1",
    400: "#fc7088", 500: "#f43056", 600: "#e21c4c", 700: "#bf1140",
    800: "#a0113c", 900: "#88133a", 950: "#4c051b",
  },
  secondaryYellow: {
    50:  "#fffcea", 100: "#fff3c5", 200: "#ffe785", 300: "#ffd346",
    400: "#ffbe1b", 500: "#ff9f0a", 600: "#e27300", 700: "#bb4e02",
    800: "#7c320b", 900: "#572205", 950: "#481800",
  }
};

console.log(`--background: ${hexToHsl('#ffffff')};`);
console.log(`--foreground: ${hexToHsl(palette.neutral[950])};`);
console.log(`--primary: ${hexToHsl(palette.primaryBrand[500])};`);
console.log(`--primary-foreground: ${hexToHsl('#ffffff')};`);
console.log(`--secondary: ${hexToHsl(palette.neutral[100])};`);
console.log(`--secondary-foreground: ${hexToHsl(palette.neutral[900])};`);
console.log(`--muted: ${hexToHsl(palette.neutral[100])};`);
console.log(`--muted-foreground: ${hexToHsl(palette.neutral[500])};`);
console.log(`--accent: ${hexToHsl(palette.secondaryYellow[500])};`);
console.log(`--destructive: ${hexToHsl(palette.secondaryRed[500])};`);
console.log(`--border: ${hexToHsl(palette.neutral[200])};`);
console.log(`--ring: ${hexToHsl(palette.primaryBrand[500])};`);

fs.writeFileSync('palette.json', JSON.stringify(palette, null, 2));
