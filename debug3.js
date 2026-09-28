const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');
code = code.replace(
  'if(tempPg) tempPg.innerHTML = \'<h1>RENDER CALLED</h1>\';\n',
  'if(tempPg) { tempPg.innerHTML = \'<h1>RENDER CALLED</h1>\'; return; }\n'
);
fs.writeFileSync('app.js', code);
console.log('Fixed debug script');
