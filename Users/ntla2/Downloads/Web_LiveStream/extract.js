const cp = require('child_process');
const fs = require('fs');
const res = cp.execSync('npx mammoth "C:/Users/ntla2/Downloads/Tổng hợp lỗi CRM Livestream FPTU.docx" --output-format=markdown', { maxBuffer: 1024 * 1024 * 50 }); // 50MB
const cleanText = res.toString('utf8').replace(/!\[.*?\]\(data:image\/.*?\)/g, '[IMAGE]');
fs.writeFileSync('feedback_clean.md', cleanText);
