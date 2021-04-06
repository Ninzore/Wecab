const Axios = require('axios');
const HttpsProxyAgent = require("https-proxy-agent");

const PIC_MAX_SIZE = 30 * 1024 * 1024; //图片最大体积
const VID_MAX_SIZE = 100 * 1024 * 1024; //视频最大体积
let axios = false;
//console.log(PROXY);
if (PROXY.startsWith("http")) {
    axios = Axios.create({
        proxy: false,
        httpsAgent: new HttpsProxyAgent(PROXY)
    });
}
else axios = Axios;

/** 通过链接判断文件大小*/
module.exports = function sizeCheck(url, pic = true) { //true 图片 false 视频
    return axios({
        method: "head",
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        },
        timeout: 15000
    }).then(res => {
        //console.log(JSON.stringify(res.headers));
        if (pic == true) {
            return parseInt(res.headers["content-length"]) < PIC_MAX_SIZE ? true : ((res.headers["content-length"] / 1024 / 1024) + "MB"); //图片
        } else {
            return parseInt(res.headers["content-length"]) < VID_MAX_SIZE ? true : ((res.headers["content-length"] / 1024 / 1024) + "MB"); //视频
        }
    }).catch(err => {
        console.error(new Date().toString() + ",sizeCheck:" + url + "," + err);
        return "获取文件大小失败";
    });
}