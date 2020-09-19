const logger2 = require('./logger2'); //日志功能
export default e => {
    if (typeof e === 'object') {
        if (e.stack) {
            logger2.error(new Date().toString() + ":" + e.stack);
            delete e.stack;
        }
        logger2.error(new Date().toString() + ":" + JSON.stringify(e, Object.getOwnPropertyNames(e), 4));
    } else logger2.error(new Date().toString() + ":" + e);
};