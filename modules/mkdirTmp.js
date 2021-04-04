const path = require('path');
const fs = require('fs');

module.exports = function() {
    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
}