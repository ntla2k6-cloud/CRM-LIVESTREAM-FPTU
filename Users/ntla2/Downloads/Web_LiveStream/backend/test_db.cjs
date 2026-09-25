const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_KnGzsjoARl81@ep-wild-moon-b46ynw3m-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true'
    }
  }
});
p.user.findMany().then(r => console.log('OK', r)).catch(e => console.error('ERR', e)).finally(()=>p.$disconnect());
