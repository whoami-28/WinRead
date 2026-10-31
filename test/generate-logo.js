const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate premium dark-graphite & amber ReadEra style SVG logo
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2028"/>
      <stop offset="100%" stop-color="#0e0f13"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3c3e4e"/>
      <stop offset="100%" stop-color="#1e1f26"/>
    </linearGradient>
    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f5a623"/>
      <stop offset="100%" stop-color="#d4820a"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- App Rounded Base -->
  <rect x="24" y="24" width="464" height="464" rx="104" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="4"/>

  <!-- Book Outline -->
  <g filter="url(#shadow)">
    <!-- Book Pages Base -->
    <path d="M96 140 C140 128, 220 128, 256 160 C292 128, 372 128, 416 140 L416 364 C372 352, 292 352, 256 384 C220 352, 140 352, 96 364 Z" 
          fill="#16171d" stroke="#ececf0" stroke-width="20" stroke-linejoin="round"/>

    <!-- Inner Spine Divider -->
    <line x1="256" y1="160" x2="256" y2="384" stroke="#ececf0" stroke-width="16" stroke-linecap="round"/>

    <!-- Left Page Text Lines -->
    <line x1="144" y1="204" x2="216" y2="204" stroke="#ececf0" stroke-width="14" stroke-linecap="round"/>
    <line x1="144" y1="244" x2="216" y2="244" stroke="#ececf0" stroke-width="14" stroke-linecap="round"/>
    <line x1="144" y1="284" x2="216" y2="284" stroke="#ececf0" stroke-width="14" stroke-linecap="round"/>
    <line x1="144" y1="324" x2="192" y2="324" stroke="#ececf0" stroke-width="14" stroke-linecap="round"/>

    <!-- Right Page Text Lines -->
    <line x1="296" y1="204" x2="368" y2="204" stroke="#ececf0" stroke-width="14" stroke-linecap="round"/>
    <line x1="296" y1="244" x2="368" y2="244" stroke="#ececf0" stroke-width="14" stroke-linecap="round"/>
    <line x1="296" y1="284" x2="368" y2="284" stroke="#ececf0" stroke-width="14" stroke-linecap="round"/>
    <line x1="320" y1="324" x2="368" y2="324" stroke="#ececf0" stroke-width="14" stroke-linecap="round"/>

    <!-- ReadEra Orange/Amber Bookmark Ribbon -->
    <path d="M304 100 L356 100 L356 424 L330 398 L304 424 Z" 
          fill="url(#ribbonGrad)" stroke="#16171d" stroke-width="6" stroke-linejoin="round"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(assetsDir, 'icon.svg'), logoSvg, 'utf8');
console.log('Logo SVG written to assets/icon.svg');
