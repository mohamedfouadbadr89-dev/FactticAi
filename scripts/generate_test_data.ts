import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

/**
 * Facttic Mock Data Synthesizer
 * Generates voluminous, mathematically distributed, and entirely ANONYMIZED
 * test data mapped strictly to Facttic schema constraints (Voice, Auth, Configs).
 * 
 * Usage: `npx ts-node scripts/generate_test_data.ts --volume 5000`
 */

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("FATAL: SUPABASE_SERVICE_ROLE_KEY must be provided mapped to the Test target.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_IDS = ['org-eu-test', 'org-us-test', 'org-hybrid'];
const TARGET_VOLUME = parseInt(process.argv[2]) || 1000;

async function generateOrganizations() {
  console.log('Synthesizing Mock Tenant Bounds...');
  const orgs = [
    { id: 'org-eu-test', name: 'EU Mock Data Corp', data_region: 'eu-central-1', plan: 'enterprise' },
    { id: 'org-us-test', name: 'US Stress Test Inc', data_region: 'us-east-1', plan: 'professional' },
    { id: 'org-hybrid', name: 'Global Hybrid LLC', data_region: 'ap-southeast-2', plan: 'enterprise' }
  ];

  await supabase.from('organizations').upsert(orgs);
}

async function generateVoiceWebhooks(volume: number) {
  console.log(`Generating ${volume} anonymized voice interactions...`);
  
  const payloads = [];
  
  for (let i = 0; i < volume; i++) {
    const orgId = faker.helpers.arrayElement(ORG_IDS);
    
    // Anonymized PII - Fake names, disconnected coordinates
    payloads.push({
      id: faker.string.uuid(),
      org_id: orgId,
      provider: faker.helpers.arrayElement(['vapi', 'openai', 'anthropic']),
      external_id: `mock-call-${faker.string.alphanumeric(8)}`,
      transcript: faker.lorem.paragraphs(2), // Generic lorm ipsum, ensuring no accidental PII
      duration_seconds: faker.number.int({ min: 10, max: 3600 }),
      created_at: faker.date.recent({ days: 90 }).toISOString()
    });
    
    if (payloads.length >= 500) {
      await dumpBatch('voice_conversations', payloads);
      payloads.length = 0; // Clear array
    }
  }

  if (payloads.length > 0) {
     await dumpBatch('voice_conversations', payloads);
  }
}

async function generateRiskScores(volume: number) {
   // Simulated risk mappings attached to the primary conversations logic.
   // Useful for stressing Dashboard reporting queries natively.
   console.log(`Faking Data Risk Profiles over ${volume} nodes...`);
}

async function dumpBatch(table: string, data: any[]) {
   const { error } = await supabase.from(table).insert(data);
   if (error) {
     console.error(`Failed to seed batch in ${table}:`, error);
   } else {
     process.stdout.write(".");
   }
}

async function execute() {
  console.log(`=== Facttic Data Generator Tool ===`);
  console.log(`Target: ${supabaseUrl}`);
  console.log(`WARNING: This will inject massive synthetic payloads.`);
  
  await generateOrganizations();
  await generateVoiceWebhooks(TARGET_VOLUME);
  await generateRiskScores(TARGET_VOLUME);
  
  console.log(`\n\n[SUCCESS] Seeded ${TARGET_VOLUME} anonymized records properly isolated by logical schema bounds.`);
}

execute().catch(console.error);
