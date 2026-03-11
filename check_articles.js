const { execSync } = require('child_process');
const output = execSync('npx supabase db psql -c "SELECT column_name FROM information_schema.columns WHERE table_name=\'articles\'"');
console.log(output.toString());
