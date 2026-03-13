const fs = require('fs');
const path = require('path');

const files = [
  'src/api/webhooks/voice.ts',
  'src/api/settings/tenant/route.ts',
  'src/api/voice/riskScores.ts',
  'src/api/webhooks/chat.ts',
  'src/api/auth/sso/route.ts',
  'src/api/webhooks/auth.ts',
  'src/analysis/chatRiskAnalysis.ts',
  'src/database/voiceRiskScores.ts',
  'src/database/voiceConversations.ts',
  'src/analysis/voiceRiskAnalysis.ts',
  'src/database/chatConversations.ts'
];

files.forEach(file => {
  const filePath = path.join('/Users/macbookpro/Desktop/FactticAI', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('console.error')) {
    content = content.replace(/console\.error/g, 'logger.error');
    if (!content.includes('import { logger }')) {
      // Find the last import and insert after it, or insert at top
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLine + 1) + "import { logger } from '@/lib/logger';\n" + content.slice(endOfLine + 1);
      } else {
        content = "import { logger } from '@/lib/logger';\n" + content;
      }
    }
    fs.writeFileSync(filePath, content);
  }
});
console.log('Done replacing console.error');
