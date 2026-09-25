const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
c = c.replace('color       String?  @default("#F58220")', 'color       String?  @default("#F58220")\n    project     String?  @default("Khác")\n    day         Int?\n    time        String?\n    registered  String?');
fs.writeFileSync('backend/prisma/schema.prisma', c);
