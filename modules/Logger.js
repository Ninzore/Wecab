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
        this.searchMode = []; //搜图模式
        this.repeater = []; //复读
        this.searchCount = []; //搜索次数记录
        this.hsaSign = []; //每日签到
        this.date = new Date().getDate();
        this.adminSigned = false; //自动帮自己签到的标志

        setInterval(() => {
            //每日初始化
            let nowDate = new Date().getDate();
            if (this.date != nowDate) {
                this.date = nowDate;
                this.searchCount = [];
                this.hsaSign = [];
                this.adminSigned = false;
            }
        }, config.picfinder.searchModeTimeout * 1000);
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
     * 管理员是否可以签到（用于自动签到）
     *
     * @returns 可以或不可以
     * @memberof Logger
     */
    canAdminSign() {
        if (this.adminSigned) return false;
        this.adminSigned = true;
        return true;
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

    /**
     * 判断用户是否可以搜图
     *
     * @param {number} u QQ号
     * @param {*} limit 限制
     * @param {string} [key='search']
     * @returns 允许搜图则返回true，否则返回false
     * @memberof Logger
     */
    canSearch(u, limit, key = 'search') {
        if (!this.searchCount[u]) this.searchCount[u] = {};

        if (key == 'setu') {
            if (!this.searchCount[u][key])
                this.searchCount[u][key] = {
                    date: 0,
                    count: 0,
                };
            const setuLog = this.searchCount[u][key];
            if (setuLog.date + limit.cd * 1000 <= new Date().getTime() && limit.value == 0) return true;
            if (setuLog.date + limit.cd * 1000 > new Date().getTime() || setuLog.count >= limit.value) return false;
            return true;
        }

        if (limit == 0) return true;
        if (!this.searchCount[u][key]) this.searchCount[u][key] = 0;
        if (this.searchCount[u][key] < limit) return true;
        return false;
    }


    /**
     * 用户是否可以签到
     *
     * @param {number} u QQ号
     * @returns 可以则返回true，已经签到过则返回false
     * @memberof Logger
     */
    canSign(u) {
        if (this.hsaSign.includes(u)) return false;
        this.hsaSign.push(u);
        return true;
    }
}

export default Logger;
