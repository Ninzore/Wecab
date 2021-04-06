const fs = require('fs');
const path = require('path');
const logger2 = require('./logger2'); //日志功能
const Axios = require('axios');
const HttpsProxyAgent = require("https-proxy-agent");
const MD5 = require('js-md5');
const PROXY = global.config.proxy;
const join = path.join;

let axios = false;
//console.log(PROXY);
if (PROXY.startsWith("http")) {
    axios = Axios.create({
        proxy: false,
        httpsAgent: new HttpsProxyAgent(PROXY)
    });
}
else axios = Axios;
/**
 * 
 * @param startPath  起始目录文件夹路径
 * @returns {Array}
 */
//https://www.imooc.com/wenda/detail/459466 nodejs的FS或path如何获取某文件夹下的所有文件的文件名呢。
function findSync(startPath) {
    let result = [];

    function finder(path) {
        let files = fs.readdirSync(path);
        files.forEach((val, index) => {
            let fPath = join(path, val);
            let stats = fs.statSync(fPath);
            //if(stats.isDirectory()) finder(fPath);
            if (stats.isFile()) {
                //logger.info(fPath);
                result.push(fPath);
            }
        });
    }
    finder(startPath);
    return result;
}
module.exports = async function Downloadx(url, pic = true) {
    let name = MD5(url);
    logger2.info("下载文件 , " + url + " , 转成md5值:" + name);
    let path2 = path.join(__dirname, `../tmp/`);
    /*if (fs.existsSync(path2) == false) {//没有tmp文件夹就创建文件夹
        fs.mkdirSync(path2);
    }*/
    /*let temp = await findSync(path2);
    let tmp = "";
    for (let i = 0; i < temp.length; i++) {
        tmp = temp[i].split(".")[0].split("\\tmp\\")[1] || temp[i].split(".")[0].split("/tmp/")[1];//windows路径+linux路径
        //logger2.info(tmp + "," + name);
        if (name == tmp) {
            logger2.info("找到文件:" + temp[i]);
            return temp[i];//如果图片或视频已经存在则直接返回路径
        }
    }*/
    let temp = ["jpeg", "mp4", "jpg"]
    let tmp = "";
    for (let i = 0; i < temp.length; i++) {
        tmp = path.resolve(path2, `${name}.${temp[i]}`);
        if (fs.existsSync(path.resolve(path2, `${name}.${temp[i]}`)) == true) {
            logger2.info("找到文件:" + tmp);
            return tmp;//如果图片或视频已经存在则直接返回路径
        }
    }
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        timeout: 30000,
    }).catch(err => {
        logger2.info(new Date().toString() + ",获取下载资源失败:" + err);
        return false;
    });
    if (response != false) {
        const fileType = response.headers["content-type"].split("/")[1];
        logger2.info("content-type:" + fileType);
        const mypath = path.resolve(path2, `${name}.${fileType}`);
        const writer = fs.createWriteStream(mypath);
        response.data.pipe(writer);
        return await new Promise(async (resolve, reject) => {
            writer.on("finish",
                data => {
                    logger2.info(new Date().toString() + ",下载资源成功:" + JSON.stringify(data));
                    resolve(mypath);
                });
            writer.on("error",
                err => {
                    logger2.error(new Date().toString() + ",下载资源失败: " + JSON.stringify(err));
                    resolve("");
                });
        });
    } else {
        return "";
    }
}