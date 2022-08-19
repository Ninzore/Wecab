import Axios from "axios";
import HttpsProxyAgent from "https-proxy-agent";

const PROXY = global.config.proxy;

let axiosProxied = false;
if (PROXY.startsWith("http")) {
    axiosProxied = Axios.create({
        proxy: false,
        httpsAgent: new HttpsProxyAgent(PROXY)
    });
}
else axiosProxied = Axios;

export {axiosProxied};