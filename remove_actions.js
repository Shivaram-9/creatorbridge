const fs = require('fs');

const path = 'client/src/pages/AdminDashboard.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/<th>Actions<\/th>/g, '');

const regex = /<td>\s*<div className="table-actions">\s*<button className=\{`btn btn-sm \$\{u\.isBanned \? 'btn-success' : 'btn-danger'\}`\} onClick=\{\(\) => handleToggleBan\(u\._id\)\}>\s*\{u\.isBanned \? 'Restore' : 'Suspend'\}\s*<\/button>\s*<\/div>\s*<\/td>/g;

c = c.replace(regex, '');

fs.writeFileSync(path, c);
console.log("Successfully removed Actions columns");
