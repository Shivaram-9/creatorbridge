const fs = require('fs');
const css = fs.readFileSync('temp2.css', 'utf8');
fs.appendFileSync('client/src/components/CreatePost.css', css, 'utf8');
