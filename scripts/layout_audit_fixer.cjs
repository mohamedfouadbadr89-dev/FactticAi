const fs = require('fs');
const path = require('path');

const DIRS = [
  'components/dashboard',
  'components/dashboard/executive/full',
  'app/(dashboard)',
  'app/(dashboard)/executive'
];

function processFile(filePath) {
  let initial = fs.readFileSync(filePath, 'utf8');
  let content = initial;

  // 1) Grid gap = 16px (gap-4)
  content = content.replace(/gap-6/g, 'gap-4');
  
  // 2) Main padding = 28px
  // In DashboardContainer: change p-8 or p-6 to p-7 (28px tailwind class)
  if (filePath.includes('DashboardContainer')) {
    content = content.replace(/p-[4-8]/g, 'px-[28px] py-[28px]');
    content = content.replace(/max-w-7xl/g, ''); // Ensure no arbitrary max-width restrictions conflicting with mockup
  }
  
  // padding internal blocks to match spacing.
  content = content.replace(/p-8/g, 'p-7'); 
  content = content.replace(/p-6/g, 'p-7');
  
  // 3) Sidebar width = 240px
  if (filePath.includes('Sidebar.tsx')) {
    content = content.replace(/w-64/g, 'w-[240px]');
  }
  
  if (filePath.includes('layout.tsx')) {
     content = content.replace(/ml-64/g, 'ml-[240px]');
  }

  // 4) Topbar height = 56px
  if (filePath.includes('Topbar.tsx')) {
    content = content.replace(/h-16/g, 'h-[56px]');
  }

  // 5) Health gradient
  if (filePath.includes('ExecutiveHealthFull.tsx')) {
     content = content.replace(/to-\[\#11315B\]/g, 'to-[#1A2C4D]'); // Closer to generic mockup dark gradients.
  }

  // 6) No rounded-xl (use rounded-md)
  content = content.replace(/rounded-xl/g, 'rounded-md');
  content = content.replace(/rounded-lg/g, 'rounded-md');

  // 7) No shadow-lg
  content = content.replace(/shadow-lg/g, 'shadow-sm');
  content = content.replace(/shadow-md/g, 'shadow-sm');

  // 8) No bg-gray-50
  content = content.replace(/bg-gray-50/g, 'bg-[var(--parch)]');
  content = content.replace(/bg-slate-50/g, 'bg-[var(--parch)]');

  if (initial !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`MODIFIED: ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !fullPath.includes('.next') && !fullPath.includes('node_modules')) {
      traverseDir(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      processFile(fullPath);
    }
  }
}

DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    traverseDir(dir);
  }
});

console.log('AUDIT CORRECTIVE SCRIPT COMPLETE');
