const fs = require('fs');
const path = 'src/data/translations.js';
const text = fs.readFileSync(path, 'utf8');
const langRx = /\b(en|te)\s*:\s*\{/g;
let result = '';
let lastIndex = 0;
while (true) {
  const match = langRx.exec(text);
  if (!match) break;
  const start = match.index + match[0].length;
  let depth = 1;
  let i = start;
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    i++;
  }
  const body = text.slice(start, i - 1);
  const lines = body.split(/\r?\n/);
  const seen = new Set();
  const fixedLines = [];
  const keyRx = /^\s*['\"]?([A-Za-z0-9_]+)['\"]?\s*:/;
  for (const line of lines) {
    const km = keyRx.exec(line);
    if (km) {
      const key = km[1];
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
    }
    fixedLines.push(line);
  }
  result += text.slice(lastIndex, start) + fixedLines.join('\n');
  lastIndex = i - 1;
}
result += text.slice(lastIndex);
fs.writeFileSync('src/data/translations.fixed.js', result, 'utf8');
console.log('fixed translation file written');
