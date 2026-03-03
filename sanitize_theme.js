import fs from 'fs';
import path from 'path';

const directories = ['app', 'components'];

const replacements = [
  { from: /\bbg-white\b/g, to: 'bg-[var(--card-bg)]' },
  { from: /\bbg-gray-\d+\b/g, to: 'bg-[var(--bg-primary)]' },
  { from: /\bbg-slate-\d+\b/g, to: 'bg-[var(--bg-primary)]' },
  { from: /\bbg-neutral-\d+\b/g, to: 'bg-[var(--bg-primary)]' },

  { from: /\btext-gray-\d+\b/g, to: 'text-[var(--text-secondary)]' },
  { from: /\btext-slate-[56]00\b/g, to: 'text-[var(--text-secondary)]' },
  { from: /\btext-slate-[789]00\b/g, to: 'text-[var(--text-primary)]' },
  { from: /\btext-black\b/g, to: 'text-[var(--text-primary)]' },

  { from: /\bborder-gray-\d+\b/g, to: 'border-[var(--border-color)]' },
  { from: /\bborder-slate-\d+\b/g, to: 'border-[var(--border-color)]' },
  
  { from: /\bfrom-blue-\d+\b/g, to: 'from-[var(--accent)]' },
  { from: /\bto-blue-\d+\b/g, to: 'to-[var(--accent)]' },
  { from: /\bbg-blue-500\b/g, to: 'bg-[var(--accent)]' },
  { from: /\bbg-blue-600\b/g, to: 'bg-[var(--accent)]' },
  { from: /\bbg-blue-[51]0+\b/g, to: 'bg-[var(--accent-soft)]' },
  { from: /\btext-blue-\d+\b/g, to: 'text-[var(--accent)]' },
  
  { from: /\bhover:bg-gray-\d+\b/g, to: 'hover:bg-[var(--accent-soft)]' },
  { from: /\bhover:bg-slate-\d+\b/g, to: 'hover:bg-[var(--accent-soft)]' },
  { from: /\bhover:text-gray-\d+\b/g, to: 'hover:text-[var(--accent)]' },
  { from: /\bhover:text-slate-\d+\b/g, to: 'hover:text-[var(--accent)]' },
  { from: /\bhover:bg-blue-\d+\b/g, to: 'hover:bg-[var(--accent-soft)]' },
  { from: /\bhover:text-blue-\d+\b/g, to: 'hover:text-[var(--accent)]' },
  { from: /\bhover:bg-white\b/g, to: 'hover:bg-[var(--card-bg)]' },

  { from: /\beven:bg-gray-\d+\b/g, to: 'even:bg-[var(--bg-secondary)]' },
  { from: /\beven:bg-slate-\d+\b/g, to: 'even:bg-[var(--bg-secondary)]' },
  { from: /\bodd:bg-gray-\d+\b/g, to: 'odd:bg-[var(--bg-secondary)]' }
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
console.log('Phase 1 replacement complete.');
