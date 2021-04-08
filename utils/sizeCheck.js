const Axios = require('axios');
const logger2 = require('./logger2');
const HttpsProxyAgent = require("https-proxy-agent");

const PIC_MAX_SIZE = 30 * 1024 * 1024; //图片最大体积
const VID_MAX_SIZE = 100 * 1024 * 1024; //视频最大体积
let axios = false;

if (PROXY.startsWith("http")) {
    axios = Axios.create({
        proxy: false,
        httpsAgent: new HttpsProxyAgent(PROXY)
    });
}
else axios = Axios;

/** 通过链接判断文件大小*/
module.exports = async function sizeCheck(url) {
    return axios({
        method: "head",
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        },
        timeout: 3000
    }).then(res => {
        let filetype = res.headers["content-type"];
        let max_size = filetype == "image/jpeg" ? PIC_MAX_SIZE : VID_MAX_SIZE
        if (parseInt(res.headers["content-length"]) < max_size) return true;
        else {
            logger2.warn([url, filetype, "exceed maximum allowed size", max_size].join(" "));
            return false;
        }
    }).catch(err => {
        logger2.error("sizeCheck:" + url, err);
        return false;
    });
}