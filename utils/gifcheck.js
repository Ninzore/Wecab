const logger2 = require('./logger2'); //日志功能
const promisify = require("util").promisify;
const exec = promisify(require('child_process').exec);

/** 通过ffmpeg判断gif总帧数多少*/
module.exports = async function gifCheck(dir) {
    return new Promise(async (resolve, reject) => {
        exec(`ffmpeg -i ${dir}/temp.gif -f null -`) //判断gif的总帧数 https://www.npmjs.com/package/gif-meta https://github.com/indatawetrust/gif-meta
            .then(async giftemp => {
                let giftemp2 = /frame=(.+?)fps/.exec(giftemp.stderr)[1].replace("fps", "").trim();
                resolve(giftemp2);
            }).catch(err => {
                logger2.error("gifCheck " + err);
                resolve();
            });
    });
}