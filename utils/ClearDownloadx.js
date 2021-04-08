const fs = require('fs-extra');
const logger2 = require('./logger2');

module.exports = async function ClearDownloadx() {
    return await new Promise(function (resolve, reject) {
        logger2.info("Clean /tmp/pic");
        fs.emptyDir('./tmp/pic');
        logger2.info("Clean /tmp/video");
        fs.emptyDir('./tmp/video');
        resolve();
    });
}