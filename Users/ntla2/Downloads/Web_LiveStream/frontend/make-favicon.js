const fs = require('fs');
const base64 = fs.readFileSync('public/logo.jpg', 'base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>
    <clipPath id="circleView">
      <circle cx="128" cy="128" r="128" fill="#FFFFFF" />
    </clipPath>
  </defs>
  <image width="256" height="256" href="data:image/jpeg;base64,${base64}" clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice" />
</svg>`;
fs.writeFileSync('public/icon.svg', svg);
try {
  fs.unlinkSync('src/app/icon.tsx');
} catch (e) {}
