const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost:3000/' });

const window = dom.window;
const document = window.document;
const localStorage = { getItem: () => null, setItem: () => {} };
window.localStorage = localStorage;
window.fetch = async () => ({ ok: true, json: async () => ([]) });

try {
  code = 'class MutationObserver { observe(){} disconnect(){} }; window.requestAnimationFrame = (cb) => cb(); window.VS_ROLE = "admin"; window.VS_USER = {linkedStaffId: 1}; ' + code;
  dom.window.eval(code);
  console.log('REACHED END OF FILE WITHOUT ERRORS');
} catch(e) {
  console.log('ERROR:', e.stack);
}
