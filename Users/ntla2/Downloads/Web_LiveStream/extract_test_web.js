const cp = require('child_process');
const fs = require('fs');

try {
    const res = cp.execSync('npx mammoth "C:/Users/ntla2/Downloads/Test web.docx" --output-format=markdown', { maxBuffer: 1024 * 1024 * 50 });
    const cleanText = res.toString('utf8').replace(/!\[.*?\]\(data:image\/.*?\)/g, '[IMAGE]');
    fs.writeFileSync('test_web_feedback.md', cleanText);
    console.log("Success");
} catch (e) {
    console.error("Error extracting docx:", e);
}
