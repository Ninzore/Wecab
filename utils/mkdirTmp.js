const path = require('path');
const fs = require('fs');

module.exports = function () {
    const tmpDir = path.join(__dirname, '../tmp/pic');
    const tmpDir2 = path.join(__dirname, '../tmp/video');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    if (!fs.existsSync(tmpDir2)) fs.mkdirSync(tmpDir2);
}