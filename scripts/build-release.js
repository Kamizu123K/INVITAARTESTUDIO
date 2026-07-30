'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const dist = path.join(root, 'dist');
const target = path.join(dist, `invita-arte-studio-${version}`);
const excluded = new Set(['node_modules', 'dist', '.git', '.env', 'runtime-data']);

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

function copyTree(source, destination) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const src = path.join(source, entry.name);
    const dst = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dst, { recursive: true });
      copyTree(src, dst);
    } else if (entry.isFile()) {
      fs.copyFileSync(src, dst);
    }
  }
}

copyTree(root, target);
fs.mkdirSync(path.join(target, 'runtime-data'), { recursive: true });
fs.writeFileSync(path.join(target, 'runtime-data', '.gitkeep'), 'Datos de ejecución local.\n');

const manifest = [];
function hashFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) hashFiles(full);
    else {
      const data = fs.readFileSync(full);
      manifest.push({
        file: path.relative(target, full).replace(/\\/g, '/'),
        bytes: data.length,
        sha256: crypto.createHash('sha256').update(data).digest('hex')
      });
    }
  }
}
hashFiles(target);
fs.writeFileSync(path.join(dist, `manifest-${version}.json`), JSON.stringify({ version, generatedAt: new Date().toISOString(), files: manifest }, null, 2));
console.log(`Build generado: ${target}`);
console.log(`Archivos: ${manifest.length}`);
