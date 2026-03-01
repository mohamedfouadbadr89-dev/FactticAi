const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = ['app', 'components', 'lib'];
const DISALLOWED_PATTERNS = [
  { regex: /bg-black/g, reason: 'bg-black' },
  { regex: /bg-zinc-/g, reason: 'bg-zinc' },
  { regex: /text-white/g, reason: 'text-white' },
  { regex: /dark:/g, reason: 'dark:' },
  { regex: /className="[^"]*\bfixed\b[^"]*"/g, reason: 'fixed positioning' },
  { regex: /container mx-auto/g, reason: 'container mx-auto wrapper' }
];

let filesWithIssues = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !fullPath.includes('.next') && !fullPath.includes('node_modules')) {
      scanDir(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      let issuesFound = [];
      for (const pattern of DISALLOWED_PATTERNS) {
        if (pattern.regex.test(content)) {
           // Exclude intentionally white layouts or fixed elements in the new shell
           if (pattern.reason === 'text-white' && (fullPath.includes('ExecutiveHealthCard') || fullPath.includes('Sidebar.tsx'))) {
              continue; // allowed text-white here
           }
           if (pattern.reason === 'fixed positioning' && (fullPath.includes('Sidebar.tsx'))) {
              continue; // allowed fixed here
           }

           issuesFound.push(pattern.reason);
        }
      }
      
      if (issuesFound.length > 0) {
        filesWithIssues.push({ path: fullPath, issues: issuesFound });
      }
    }
  }
}

DIRECTORIES_TO_SCAN.forEach(dir => scanDir(dir));

console.log('--- FINAL AUDIT RESULTS ---');
if (filesWithIssues.length === 0) {
  console.log('PASS: No conflicting CSS, layouts, or redundant classes found.');
} else {
  filesWithIssues.forEach(f => {
    console.log(`WARNING: ${f.path}`);
    console.log(`  Issues: ${f.issues.join(', ')}`);
  });
}
