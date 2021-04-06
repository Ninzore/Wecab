const fs = require('fs-extra');
//const logger2 = require('./logger2'); //日志功能
//https://www.jb51.net/article/127906.htm nodejs判断文件、文件夹是否存在及删除的方法

//删除所有的文件(将所有文件夹置空)
/*function emptyDir(filePath) {
    const files = fs.readdirSync(filePath)//读取该文件夹
    files.forEach((file) => {
        const nextFilePath = `${filePath}/${file}`
        const states = fs.statSync(nextFilePath)
        if (states.isDirectory()) {
            emptyDir(nextFilePath)
        } else {
            fs.unlinkSync(nextFilePath)
            //logger2.info(`删除文件 ${nextFilePath} 成功`)
        }
    })
}*/
//https://leotian.cn/posts/ee16/

module.exports = async function ClearDownloadx() {
    return await new Promise(function (resolve, reject) {
        fs.emptyDir('./tmp/pic');
        fs.emptyDir('./tmp/video');
        resolve(null);
    });
}