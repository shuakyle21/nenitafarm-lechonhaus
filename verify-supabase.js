import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');

// Simple .env parser
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      envConfig[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing environment variables in .env');
  process.exit(1);
}

console.log('Testing connection to:', supabaseUrl);
// console.log('Using key:', supabaseKey); // Don't log secrets

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Connection failed:', error.message);
      if (error.code === 'PGRST301') {
        console.error(
          'Hint: The table "menu_items" might not exist. Did you run the schema.sql script?'
        );
      }
    } else {
      console.log('Connection successful! "menu_items" table found.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
