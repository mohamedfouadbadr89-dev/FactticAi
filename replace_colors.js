import fs from 'fs';
import path from 'path';

const directories = ['app', 'components'];

const replacements = [
  { from: /\bbg-white\b/g, to: 'bg-[var(--card-bg)]' },
  { from: /\bbg-gray-50\b/g, to: 'bg-[var(--bg-primary)]' },
  { from: /\btext-slate-800\b/g, to: 'text-[var(--text-primary)]' },
  { from: /\btext-slate-900\b/g, to: 'text-[var(--text-primary)]' },
  { from: /\btext-gray-500\b/g, to: 'text-[var(--text-secondary)]' },
  { from: /\bborder-gray-200\b/g, to: 'border-[var(--border-color)]' },
  { from: /\bborder-slate-200\b/g, to: 'border-[var(--border-color)]' }, // also catching slate-200 
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

for (const dir of directories) {
  processDirectory(dir);
}
console.log('Done.');
