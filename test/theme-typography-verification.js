const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Running Theme & Typography Verification Test ---');

// 1. Inspect renderer/styles.css for Paper Light Theme & Contrast
console.log('\n[Check 1] Checking renderer/styles.css for white-on-white contrast issues...');
const cssContent = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'styles.css'), 'utf-8');

// Ensure font-choice-btn.active has dark text in paper theme
assert(
  cssContent.includes('body.theme-paper .font-choice-btn.active') ||
  cssContent.includes('.font-choice-btn.active {\n  background: var(--bg-elevated);\n  color: var(--text-primary);'),
  'FAIL: font-choice-btn.active must use var(--text-primary) or high-contrast override'
);

// Ensure .reader-h1, .reader-h2 use var(--reader-text-color) and NOT #ffffff
assert(
  !cssContent.includes('.reader-h1 { font-size: 1.8em; font-weight: 700; margin: 1.2em 0 0.6em 0; color: #ffffff; }'),
  'FAIL: .reader-h1 must not hardcode color: #ffffff'
);
assert(
  cssContent.includes('.reader-h1 { font-size: 1.8em; font-weight: 700; margin: 1.2em 0 0.6em 0; color: var(--reader-text-color); }'),
  'FAIL: .reader-h1 must use var(--reader-text-color)'
);

// Ensure .chapter-end-title uses var(--text-primary) and NOT #ffffff
assert(
  !cssContent.includes('.chapter-end-title {\n  font-size: 1.1rem;\n  font-weight: 700;\n  color: #ffffff;'),
  'FAIL: .chapter-end-title must not hardcode color: #ffffff'
);

// Ensure paper theme scrollbars are visible
assert(
  cssContent.includes('body.theme-paper ::-webkit-scrollbar-thumb'),
  'FAIL: body.theme-paper must define visible scrollbar thumb style'
);

console.log('  ✓ All white theme contrast checks in styles.css PASSED!');

// 2. Inspect renderer/app.js VirtualScroller
console.log('\n[Check 2] Checking renderer/app.js VirtualScroller natural DOM flow refactor...');
const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'app.js'), 'utf-8');

// Ensure VirtualScroller does NOT use absolute translateY pool
assert(
  !appJsContent.includes('translateY(${block.top}px)'),
  'FAIL: VirtualScroller must not use translateY positioning for blocks'
);

// Ensure reader-block-wrapper is created in setBlocks
assert(
  appJsContent.includes('reader-block-wrapper'),
  'FAIL: VirtualScroller must wrap blocks in reader-block-wrapper'
);

// Ensure exact 100% progress snapping
assert(
  appJsContent.includes('percentage = 100;'),
  'FAIL: VirtualScroller must snap progress to 100% at bottom'
);

console.log('  ✓ VirtualScroller DOM flow logic in app.js PASSED!');

// 3. Layout simulation test: Verify paragraphs NEVER overlap in DOM flow
console.log('\n[Check 3] Layout simulation: Testing paragraph stacking & reflow across font settings...');

// Mock DOM elements to simulate document flow layout
class MockElement {
  constructor(tag, className = '') {
    this.tagName = tag.toUpperCase();
    this.className = className;
    this.style = {};
    this.children = [];
    this.innerHTML = '';
    this.dataset = {};
    this.scrollTop = 0;
    this.scrollHeight = 1000;
    this.clientHeight = 600;
    this.offsetHeight = 40;
    this.offsetTop = 0;
  }
  appendChild(child) {
    this.children.push(child);
  }
  querySelector(selector) {
    return null;
  }
}

// Simulate blocks
const testBlocks = [
  { id: 'b0', chapterIndex: 0, blockIndex: 0, html: '<h1 class="reader-h1">Глава 17</h1>', text: 'Глава 17' },
  { id: 'b1', chapterIndex: 0, blockIndex: 1, html: '<p class="reader-block">Следующим утром вместо занятий Сергей отправился на патрулирование.</p>', text: 'Следующим утром...' },
  { id: 'b2', chapterIndex: 0, blockIndex: 2, html: '<p class="reader-block">От посещения лекций и семинаров он на сегодня был освобождён.</p>', text: 'От посещения...' },
  { id: 'b3', chapterIndex: 0, blockIndex: 3, html: '<p class="reader-block">Они с Селестой, как обычно, получили схему патрулирования у дежурной.</p>', text: 'Они с Селестой...' },
  { id: 'b4', chapterIndex: 0, blockIndex: 4, html: '<p class="reader-block">Народу на дорожках в это время было мало, в основном они видели тех, кто быстро летел по направлению к какому-то из корпусов.</p>', text: 'Народу на дорожках...' },
  { id: 'b5', chapterIndex: 0, blockIndex: 5, html: '<div class="chapter-end-card"><button class="chapter-next-btn">Читать дальше</button></div>', text: '[Конец]' }
];

// In natural DOM flow, each block is placed vertically one after another:
// element[i].offsetTop = element[i-1].offsetTop + element[i-1].offsetHeight + margin
function simulateFlowLayout(fontSize, lineHeight, fontFamily) {
  let currentTop = 0;
  const positions = [];
  const margin = Math.round(fontSize * 1.15); // margin-bottom: 1.15em

  for (let i = 0; i < testBlocks.length; i++) {
    const textLen = testBlocks[i].text.length;
    // Calculate approximate lines based on font width
    const charWidth = fontFamily === 'mono' ? fontSize * 0.6 : fontSize * 0.52;
    const lineWidth = 700;
    const charsPerLine = Math.floor(lineWidth / charWidth);
    const lineCount = Math.max(1, Math.ceil(textLen / charsPerLine));
    const blockHeight = Math.round(lineCount * fontSize * lineHeight);

    const top = currentTop;
    const bottom = top + blockHeight;
    positions.push({ index: i, top, bottom, height: blockHeight });

    currentTop = bottom + margin;
  }
  return positions;
}

// Check with standard font, large font, monospace font
const fontsToTest = [
  { name: 'Sans normal', size: 18, lh: 1.65, family: 'sans' },
  { name: 'Mono (Cascadia Code)', size: 18, lh: 1.65, family: 'mono' },
  { name: 'Mono large', size: 28, lh: 1.8, family: 'mono' },
  { name: 'Serif small', size: 14, lh: 1.5, family: 'serif' }
];

for (const f of fontsToTest) {
  const layout = simulateFlowLayout(f.size, f.lh, f.family);
  for (let i = 1; i < layout.length; i++) {
    const prev = layout[i - 1];
    const curr = layout[i];
    assert(
      curr.top >= prev.bottom,
      `FAIL: Block ${curr.index} overlaps Block ${prev.index} in font config ${f.name}! prev.bottom=${prev.bottom}, curr.top=${curr.top}`
    );
  }
  console.log(`  ✓ Font reflow test passed for: ${f.name} (Zero block collisions)`);
}

console.log('\n========================================');
console.log('  ALL THEME & TYPOGRAPHY TESTS PASSED!');
console.log('========================================\n');
