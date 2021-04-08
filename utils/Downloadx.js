const fs = require('fs-extra');
const path = require('path');
const logger2 = require('./logger2');
const Axios = require('axios');
const HttpsProxyAgent = require("https-proxy-agent");
const MD5 = require('js-md5');
const PROXY = global.config.proxy;

let axios = false;
if (PROXY.startsWith("http")) {
    axios = Axios.create({
        proxy: false,
        httpsAgent: new HttpsProxyAgent(PROXY)
    });
}
else axios = Axios;

async function Downloadx(url) {
    let name = MD5(url);
    logger2.info(["下载文件", url, "目标文件名", name].join(", "));
    
    //如果已经存在则直接返回路径
    for (let ext of ["jpg", "mp4"]) {
        let tmpdir = ext == "jpg" ? "./tmp/pic" : "./tmp/video";
        if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp");
        if (!fs.existsSync(tmpdir)) fs.mkdirSync(tmpdir);
        
        let tmp = path.join(tmpdir, `${name}.${ext}`);
        if (fs.existsSync(tmp)) {
            logger2.info("已存在文件: " + tmp);
            return tmp;
        }
    }
    
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        timeout: 3000,
    }).catch(err => {
        logger2.warn("下载资源失败:", err);
        return false;
    });

    if (response) {
        const fileType = response.headers["content-type"].split("/")[1].replace("jpeg", "jpg");
        let mypath = "";
        let filename = `${name}.${fileType}`;

        if (fileType == "jpg") mypath = path.join("./tmp/pic", filename);
        else if (fileType == "mp4") mypath = path.join("./tmp/video", filename);
        else return false;

        const writer = fs.createWriteStream(mypath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on("finish", () => {
                logger2.info("下载资源成功: " + filename);
                resolve(mypath);
            });
            writer.on("error", err => {
                logger2.warn("下载资源失败: " + url, err);
                reject(err);
            });
        });
    } else {
        return false;
    }
}

module.exports = Downloadx;