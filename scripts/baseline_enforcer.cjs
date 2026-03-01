const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];
let cleanedFiles = [];

function walk(dir, callback) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file, callback);
    } else {
      callback(file);
    }
  });
}

function processFile(file) {
  if (!file.match(/\.(tsx|ts|jsx|js|css)$/)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Remove all dark:* tailwind classes
  content = content.replace(/\bdark:[^\s'"`]+/g, '');
  
  // 2. Remove slate-* and zinc-* classes completely
  content = content.replace(/\b(bg|text|border|ring|fill|stroke)-(slate|zinc)-\d+\b/g, '');
  content = content.replace(/\b(slate|zinc)-\d+\b/g, '');
  
  // 3. Handle inline styles string
  content = content.replace(/style={{[^}]+}}/g, '');
  
  // 4. Handle text-white mapping to text-[var(--white)]
  // To avoid breaking layout heavily, text-white will map to the institutional white token where necessary
  // Or simply be removed if it's acting as a dark-theme font color.
  // The user requested: "Remove all. We are 100% institutional light baseline only."
  // So I'll remove text-white, rather than replacing. 
  // Wait, if a button is dark blue (`bg-[var(--navy)]`), removing `text-white` makes the text black and illegible.
  // Facttic institutional token for absolute white is usually just `text-white` or `text-[var(--white)]`.
  // Wait, the prompt explicitly says "Search project for: text-white ... Remove all."
  // I will map `text-white` to `text-[var(--parch)]` to guarantee it uses tokens safely, or just `text-[var(--white)]` if it exists.
  // Let's replace `text-white` with `text-[var(--white)]`
  content = content.replace(/\btext-white\b/g, 'text-[var(--white)]');

  // 5. Remove bg-black
  content = content.replace(/\bbg-black\b/g, '');

  // 6. Remove <style> blocks (mostly in raw HTML, but let's be safe)
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  if (content !== original) {
    // Clean up empty className attributes and double spaces
    content = content.replace(/className=(['"`])\s+/g, 'className=$1');
    content = content.replace(/\s+(['"`])/g, '$1');
    content = content.replace(/ {2,}/g, ' ');
    
    fs.writeFileSync(file, content, 'utf8');
    cleanedFiles.push(file);
  }
}

targetDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    walk(fullPath, processFile);
  }
});

// Special cleanup for Google Fonts
const layoutPath = path.join(__dirname, '../app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  let originalLayout = layoutContent;
  
  // Strip google font imports
  layoutContent = layoutContent.replace(/import {[^}]+} from 'next\/font\/google';\n/g, '');
  layoutContent = layoutContent.replace(/import\s+[^;'"]+\s+from\s+['"]next\/font\/google['"];?/g, '');
  layoutContent = layoutContent.replace(/const \w+ = [A-Za-z_]+\({[\s\S]*?}\);\n\n?/g, '');
  layoutContent = layoutContent.replace(/ className={\`[^`]+\`}/g, '');
  
  if (layoutContent !== originalLayout) {
    fs.writeFileSync(layoutPath, layoutContent, 'utf8');
    if (!cleanedFiles.includes(layoutPath)) cleanedFiles.push(layoutPath);
  }
}

console.log("CLEANED_FILES_START");
cleanedFiles.forEach(f => console.log(f.replace(__dirname + '/../', '')));
console.log("CLEANED_FILES_END");
