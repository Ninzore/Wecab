const path = require('path');
const fs = require('fs');

module.exports = function mkdirTmp() {
    for (let dir of ["./tmp", "./tmp/pic", "./tmp/video"]) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    }
}