const logger2 = require('./logger2'); //日志功能
const exec2 = promisify(require('child_process').exec);

/** 通过ffmpeg判断gif总帧数多少*/
module.exports = function gifCheck(dir) {
    return await new Promise(async (resolve, reject) => {
        exec2(`ffmpeg -i ${dir}/temp.gif -f null -`) //判断gif的总帧数 https://www.npmjs.com/package/gif-meta https://github.com/indatawetrust/gif-meta
            .then(async giftemp => {
                let giftemp2 = /frame=(.+?)fps/.exec(JSON.stringify(giftemp.stderr))[1].replace("fps", "").trim();
                //logger2.info("gif的总帧数:" + giftemp2);
                resolve(giftemp2);
            }).catch(err => {
                logger2.error("gif的总帧数:" + err);
                resolve(null);
            });
    });
}