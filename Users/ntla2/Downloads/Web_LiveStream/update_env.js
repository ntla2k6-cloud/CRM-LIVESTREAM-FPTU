const fs = require('fs');
let c = fs.readFileSync('backend/.env', 'utf8');
c = c.replace(/DATABASE_URL=".+"/, 'DATABASE_URL="postgresql://neondb_owner:npg_KnGzsjoARl81@ep-wild-moon-b46ynw3m-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"');
c = c.replace(/DIRECT_URL=".+"/, 'DIRECT_URL="postgresql://neondb_owner:npg_KnGzsjoARl81@ep-wild-moon-b46ynw3m.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"');
fs.writeFileSync('backend/.env', c);

let c2 = fs.readFileSync('frontend/.env.local', 'utf8');
c2 = c2.replace(/DATABASE_URL=".+"/, 'DATABASE_URL="postgresql://neondb_owner:npg_KnGzsjoARl81@ep-wild-moon-b46ynw3m-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"');
c2 = c2.replace(/DIRECT_URL=".+"/, 'DIRECT_URL="postgresql://neondb_owner:npg_KnGzsjoARl81@ep-wild-moon-b46ynw3m.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"');
fs.writeFileSync('frontend/.env.local', c2);
