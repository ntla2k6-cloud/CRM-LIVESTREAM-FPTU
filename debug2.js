const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');
code = code.replace(
  'if (id === \'payroll\') {',
  'if (id === \'payroll\') {\n    alert(\'showPage payroll intercepted!\');'
);
fs.writeFileSync('app.js', code);
console.log('Injected debug into showPage');
