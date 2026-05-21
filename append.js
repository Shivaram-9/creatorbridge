const fs = require('fs');
const css = fs.readFileSync('temp.css', 'utf8');
fs.appendFileSync('client/src/pages/Home.css', css, 'utf8');
