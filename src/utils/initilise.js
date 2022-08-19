import axios from "axios";
import mkdirTmp from './mkdirTmp';
import {download} from './download';
import logger from './logger';
import {sizeCheck} from './sizeCheck';

function axiosAutoRetry() {
    axios.defaults.__retry = 2;
    let retry_delay = 500;
    
    axios.interceptors.response.use(undefined, async err => {
        const status = err.response ? err.response.status : null;
        const config = err.config;

        if (!config || status == 429 || status == 412 || config.__retry <= 0) return Promise.reject(err);
        console.log(`Error code ${status}, retry times = ${config.__retry}`)
    
        config.__retry --;
        return new Promise(resolve => {
            setTimeout(resolve, retry_delay);
        }).then(() => {
            return axios(config);
        });
    });
}

function permissionCheck(context, permitRoles) {
    if (permitRoles.some(role => context.sender.role == role)) return true;
    else {
        global.replyFunc(context, global.config.bot.noPermissionReply, true);
        return false;
    }
}

function initialise(assign2global) {
    axiosAutoRetry();
    mkdirTmp();
    Object.assign(global, {logger, permissionCheck, download, sizeCheck, ...assign2global});
}

export {initialise};