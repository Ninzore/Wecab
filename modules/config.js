import conf from '../config.json';
import dConf from '../config.default.json';

function isObject(obj) {
    return typeof obj == 'object' && !Array.isArray(obj);
}

function recursiveCopy(c, dc) {
    for (let key in dc) {
        if (isObject(c[key]) && isObject(dc[key])) recursiveCopy(c[key], dc[key]);
        else if (typeof c[key] == 'undefined' || typeof c[key] != typeof dc[key]) c[key] = dc[key];
    }
}

if (!global.config) {
    recursiveCopy(conf, dConf);
    global.config = conf;
}

export default global.config;