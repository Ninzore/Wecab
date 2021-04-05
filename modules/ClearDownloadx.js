const empty = require('empty-folder');
const logger2 = require('./logger2'); //日志功能
//https://www.jb51.net/article/127906.htm nodejs判断文件、文件夹是否存在及删除的方法

module.exports = async function ClearDownloadx() {
    return await new Promise(function (resolve, reject) {
        empty('./tmp', false, (o) => {
            if (o.error) {
                logger2.error(new Date().toString() + " ,清空下载缓存tmp文件夹失败, " + o.error);
            } else {
                //logger2.info(new Date().toString() + " ,成功清空下载缓存tmp文件夹");
            }
            resolve(null);
        });
        //console.log(o.removed);
        //console.log(o.failed);
    });
}