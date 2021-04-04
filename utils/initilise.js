import axios from "axios";

function axiosAutoRetry() {
    axios.defaults.__retry = 2;
    let retry_delay = 500;
    
    axios.interceptors.response.use(undefined, err => {
        const status = err.response ? err.response.status : null;
        const config = err.config;

        if (!config  || status == 412 || config.__retry <= 0) return Promise.reject(err);
        console.log(`Error code ${status}, retry times = ${config.__retry}`)
    
        config.__retry --;
        return new Promise(resolve => {
            setTimeout(resolve, retry_delay);
        }).then(() => {
            return axios(config);
        });
    });
}

function permissionCheck(context, permission_reg) {
    if (permission_reg.test(context.sender.role)) return true;
    else {
        global.replyFunc(context, global.config.bot.noPermission, true);
        return false;
    }
}

function initialise(assign2global) {
    axiosAutoRetry();
    Object.assign(global, {permissionCheck, ...assign2global});
}

export {initialise};