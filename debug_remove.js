const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');
code = code.replace(
  'async function renderPayrollPage() {\n  console.log(\'renderPayrollPage CALLED\');\n  const tempPg = document.getElementById(\'page-payroll\');\n  if(tempPg) { tempPg.innerHTML = \'<h1>RENDER CALLED</h1>\'; return; }\n',
  'async function renderPayrollPage() {\n'
);
code = code.replace(
  'if (id === \'payroll\') {\n    alert(\'showPage payroll intercepted!\');',
  'if (id === \'payroll\') {'
);
fs.writeFileSync('app.js', code);
console.log('Removed debugs');
