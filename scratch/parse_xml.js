const fs = require('fs');
const xml = fs.readFileSync('scratch/doc_xml.txt', 'utf8');
const matches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
if (matches) {
    const text = matches.map(m => m.replace(/<w:t[^>]*>/, '').replace('</w:t>', '')).join(' ');
    fs.writeFileSync('scratch/doc_text.txt', text);
    console.log("Successfully extracted text of length " + text.length);
} else {
    console.log("No text found!");
}
