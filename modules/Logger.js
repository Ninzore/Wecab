import Fs from 'fs';
import Path from 'path';
import config from './config';

const banListFile = Path.resolve(__dirname, '../data/ban.json');

if (!Fs.existsSync(banListFile)) {
    Fs.writeFileSync(
        banListFile,
        JSON.stringify({
            u: [],
            g: [],
        })
    );
}

let banList = require(banListFile);

function updateBanListFile() {
    Fs.writeFileSync(banListFile, JSON.stringify(banList));
}

/**
 * 各种记录
 *
 * @class Logger
 */
class Logger {
    constructor() {
        this.repeater = []; //复读
        this.date = new Date().getDate();
    }

    static ban(type, id) {
        switch (type) {
            case 'u':
                banList.u.push(id);
                break;
            case 'g':
                banList.g.push(id);
                break;
        }
        updateBanListFile();
    }

    static checkBan(u, g = 0) {
        if (banList.u.includes(u)) return true;
        if (g != 0 && banList.g.includes(g)) return true;
        return false;
    }

    /**
     * 记录复读情况
     *
     * @param {number} g 群号
     * @param {number} u QQ号
     * @param {string} msg 消息
     * @returns 如果已经复读则返回0，否则返回当前复读次数
     * @memberof Logger
     */
    rptLog(g, u, msg) {
        let t = this.repeater[g];
        //没有记录或另起复读则新建记录
        if (!t || t.msg != msg) {
            this.repeater[g] = {
                user: u,
                msg: msg,
                times: 1,
                done: false,
            };
            t = this.repeater[g];
        } else if (t.user != u) {
            //不同人复读则次数加1
            t.user = u;
            t.times++;
        }
        return t.done ? 0 : t.times;
    }

    /**
     * 标记该群已复读
     *
     * @param {number} g 群号
     * @memberof Logger
     */
    rptDone(g) {
        this.repeater[g].done = true;
    }
}

export default Logger;
