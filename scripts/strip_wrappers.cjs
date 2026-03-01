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
  if (!file.match(/\.(tsx|ts|jsx|js)$/)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Remove imports
  content = content.replace(/import\s+{\s*DashboardContainer\s*}\s+from\s+['"][^'"]+['"];?\n?/g, '');
  
  // Replace opening tags with inline div
  // <DashboardContainer className="..."> -> <div className="w-full max-w-7xl mx-auto p-6 md:p-8 ...">
  content = content.replace(/<DashboardContainer\s+className=["']([^"']+)["']>/g, '<div className="w-full max-w-7xl mx-auto p-6 md:p-8 $1">');
  
  // Replace <DashboardContainer> without className -> <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
  content = content.replace(/<DashboardContainer>/g, '<div className="w-full max-w-7xl mx-auto p-6 md:p-8">');
  
  // Replace closing tags
  content = content.replace(/<\/DashboardContainer>/g, '</div>');
  
  if (content !== original) {
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

console.log("CLEANED:", cleanedFiles.length, "files");
