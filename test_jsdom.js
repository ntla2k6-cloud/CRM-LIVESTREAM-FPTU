const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('d:/PROJECT/index.html', 'utf8');
const scriptCode = fs.readFileSync('d:/PROJECT/app.js', 'utf8');

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "http://localhost:3000"
});

dom.window.addEventListener('error', event => {
  console.error("DOM ERROR:", event.error || event.message);
});

dom.window.addEventListener('unhandledrejection', event => {
  console.error("UNHANDLED PROMISE REJECTION:", event.reason);
});

try {
  dom.window.eval(scriptCode);
  console.log("app.js evaluated successfully.");
} catch (e) {
  console.error("EVAL ERROR:", e);
}

// Call loadData or whatever triggers populateDynamicSelects
setTimeout(() => {
  console.log("Checking if populateDynamicSelects exists...");
  try {
    console.log("Type:", typeof dom.window.populateDynamicSelects);
    dom.window.populateDynamicSelects(); dom.window.initAppAfterLogin();
    console.log("populateDynamicSelects executed successfully.");
  } catch (e) {
    console.error("populateDynamicSelects ERROR:", e);
  }
}, 1000);
