import axios from "axios";

function initialise() {
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

export {initialise};