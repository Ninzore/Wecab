const config = require('../config');
const fs = require('fs');
const path = require('path');
const logger2 = require('./logger2'); //日志功能
const Axios = require('axios');
const HttpsProxyAgent = require("https-proxy-agent");
const MD5 = require('js-md5');
//const download = require('download');
//const axios = require('axios-https-proxy-fix');


let axios = false;
//console.log(config);
const PROXY = config.proxy; //发现套了一个default。。！
if (PROXY.startsWith("http")) {
    axios = Axios.create({
        proxy: false,
        httpsAgent: new HttpsProxyAgent(PROXY)
    });
}
else axios = Axios;
/*var proxyip = false;
if (PROXY_CONF.host.length > 0 && PROXY_CONF.port !== 0) {
    proxyip = {
        host: PROXY_CONF.host,
        port: PROXY_CONF.port
    }
    //"http://" + PROXY_CONF.host + ":" + PROXY_CONF.port;
}*/
module.exports = async function Downloadx(url, pic = true) {
    let name = MD5(url);
    logger2.info("下载文件 , " + url + " , " + name);
    let path2 = path.join(__dirname, `../tmp/`);
    if (fs.existsSync(path2) == false) {//没有tmp文件夹就创建文件夹
        fs.mkdirSync(path2);
    }
    let fileType2 = "";
    if (pic == true) {
        fileType2 = "jpg";
    }
    else {
        fileType2 = "mp4";
    }
    const mypath = path.resolve(path2, `${name}.${fileType2}`);
    if (fs.existsSync(mypath) == true) {
        return mypath;//如果图片或视频已经存在则直接返回路径
    }
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        //proxy: proxyip,
        timeout: 10000,
    }).catch(err => {
        logger2.info(new Date().toString() + ",获取下载资源失败:" + err);
        return false;
    });
    if (response != false) {
        const writer = fs.createWriteStream(mypath);
        response.data.pipe(writer);
        return await new Promise(async (resolve, reject) => {
            writer.on("finish",
                data => {
                    logger2.info(new Date().toString() + ",下载图片成功:" + JSON.stringify(data));
                    resolve(mypath);
                });
            writer.on("error",
                err => {
                    logger2.error(new Date().toString() + ",下载图片失败: " + JSON.stringify(err));
                    resolve("");
                });
        });
    } else {
        return "";
    }
}


/*
//const fileType = require('file-type');
//const imgType = fileType(await streamToBuffer(response.data)).ext;
//stream 转 buffer
function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        let buffers = [];
        stream.on('error', reject);
        stream.on('data', (data) => buffers.push(data))
        stream.on('end', () => resolve(Buffer.concat(buffers))
    });
}
//buffer 转 stream
let Duplex = require('stream').Duplex;

function bufferToStream(buffer) {
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}
//参考
//stream to buffer: https://stackoverflow.com/questions/14269233/node-js-how-to-read-a-stream-into-a-buffer
//buffer to stream: http://derpturkey.com/buffer-to-stream-in-node/
//转载于:https://www.cnblogs.com/xiaoniuzai/p/7223151.html
*/