'use strict';

const fs = require('node:fs');
const path = require('node:path');

function unquote(value) {
  const text = String(value || '').trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function loadEnv(rootDir) {
  const file = path.join(rootDir, '.env');
  if (!fs.existsSync(file)) return process.env;
  const content = fs.readFileSync(file, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = unquote(line.slice(index + 1));
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) process.env[key] = value;
  }
  return process.env;
}

module.exports = { loadEnv };
