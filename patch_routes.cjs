const fs = require('fs');
const path = require('path');

const targetDirs = [
  'app/api/governance',
  'app/api/secops',
  'app/api/simulation',
  'app/api/forensics'
];

function findRouteFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findRouteFiles(fullPath, fileList);
    } else if (item === 'route.ts') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const middlewareBlock = `
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;
`;

for (const dir of targetDirs) {
  const fullDir = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullDir)) continue;
  
  const routeFiles = findRouteFiles(fullDir);
  for (const file of routeFiles) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Skip if already applied
    if (content.includes('verifyApiKey(')) continue;

    // Add import if not present
    if (!content.includes('verifyApiKey')) {
      content = `import { verifyApiKey } from '@/lib/security/verifyApiKey';\n` + content;
    }
    
    // Inject NextResponse import if not using it yet
    if (!content.includes('NextResponse')) {
        content = `import { NextResponse } from 'next/server';\n` + content;
    }

    // Try to find standard POST or GET
    let funcMatch = content.match(/export (?:async )?function (?:POST|GET|PUT|DELETE|PATCH)\s*\(\s*(req|request)\s*(:\s*(Next)?Request)?\s*\)\s*\{/);
    
    // Try to find withAuth wrapper
    let withAuthMatch = content.match(/export const (?:POST|GET|PUT|DELETE|PATCH) = (?:withAuth|withTenantAuth|withSuperadmin)\(\s*(?:async )?\(\s*(req|request)[^)]*\)\s*=>\s*\{/);
    
    if (funcMatch || withAuthMatch) {
      const matchToUse = funcMatch || withAuthMatch;
      const insertPosition = matchToUse.index + matchToUse[0].length;
      let reqVarName = matchToUse[1] || 'req';
      
      let localBlock = middlewareBlock.replace(/\(req\)/g, `(${reqVarName})`);

      content = content.slice(0, insertPosition) + localBlock + content.slice(insertPosition);
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Patched ${file}`);
    } else {
      console.log(`Could not auto-patch ${file}`);
    }
  }
}
