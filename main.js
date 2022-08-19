import { version } from './package.json';
import { CQWebSocket } from 'cq-websocket';
import config from './utils/config';
import {initialise} from "./utils/initilise";
import CQ from './utils/CQcode';
import userManagement from "./utils/userManagement";
import RptLogger from './utils/rptLogger';
import RandomSeed from 'random-seed';
import minimist from 'minimist';
import weibo from './plugin/weibo';
import bilibili from './plugin/bilibili';
import twitter from './plugin/twitter';
import dice from './plugin/dice';
import pokemon from './plugin/pokemon';
import pretendLearn from "./plugin/pretendLearn";
import translate from "./plugin/translate";
import pixivImage from "./plugin/pixivImage";
import helpZen from "./plugin/zen";
import nbnhhsh from "./plugin/nbnhhsh";
import iHaveAfriend from './plugin/iHaveAfriend';
import telephone from './plugin/telephone';

// 初始化开始
const setting = config.bot;
const bot = new CQWebSocket(config.cqws);
const rand = RandomSeed.create();
const rptLog = new RptLogger();

initialise({bot, "replyFunc": replyMsg});

bilibili.bilibiliReply(replyMsg);
twitter.twitterReply(replyMsg);
pretendLearn.learnReply(replyMsg, rptLog);
nbnhhsh.reply(replyMsg);
telephone.init(replyMsg, bot);

if (config.weibo.timelineCheck) weibo.checkWeiboDynamic();
if (config.bilibili.timelineCheck) setTimeout(() => bilibili.checkBiliDynamic(replyMsg), 20000);
if (config.twitter.timelineCheck) setTimeout(() => twitter.checkTwiTimeline(), 40000);

//好友请求
bot.on('request.friend', context => {
    let approve = setting.autoAddFriend;
    const answers = setting.addFriendAnswers;
    if (approve && answers.length > 0) {
        const comments = context.comment.split('\n');
        try {
            answers.forEach((ans, i) => {
                const a = /(?<=回答:).*/.exec(comments[i * 2 + 1])[0];
                if (ans != a) approve = false;
            });
        } catch (e) {
            console.error(e);
            approve = false;
        }
    }
    if (approve)
        bot('set_friend_add_request', {
            flag: context.flag,
            sub_type: 'invite',
            approve: true,
        });
});

//加群请求
const groupAddRequests = {};
bot.on('request.group.invite', context => {
    if (setting.autoAddGroup)
        bot('set_group_add_request', {
            flag: context.flag,
            approve: true,
        });
    else groupAddRequests[context.group_id] = context.flag;
});

//管理员指令
bot.on('message.private', (e, context) => {
    if (context.user_id != setting.admin) return;

    const args = parseArgs(context.message);

    //允许加群
    const group = args['add-group'];
    if (group && typeof group == 'number') {
        if (typeof groupAddRequests[context.group_id] == 'undefined') {
            replyMsg(context, `将会同意进入群${group}的群邀请`);
            //注册一次性监听器
            bot.once('request.group.invite', context2 => {
                if (context2.group_id == group) {
                    bot('set_group_add_request', {
                        flag: context2.flag,
                        type: 'invite',
                        approve: true,
                    });
                    replyMsg(context, `已进入群${context2.group_id}`);
                    return true;
                }
                return false;
            });
        } else {
            bot('set_group_add_request', {
                flag: groupAddRequests[context.group_id],
                type: 'invite',
                approve: true,
            });
            replyMsg(context, `已进入群${context2.group_id}`);
            delete groupAddRequests[context.group_id];
        }
    }

    //Ban
    const { 'ban-u': bu, 'ban-g': bg } = args;
    if (bu && typeof bu == 'number') {
        userManagement.ban('u', bu);
        replyMsg(context, `已封禁用户${bu}`);
    }
    if (bg && typeof bg == 'number') {
        userManagement.ban('g', bg);
        replyMsg(context, `已封禁群组${bg}`);
    }

    //superuser management
    const {"su": su, "desu": desu} = args;
    if (su && typeof su == 'number') {
        userManagement.addSu(su);
        replyMsg(context, `已设置管理员${su}`);
    }
    if (desu && typeof desu == 'number') {
        userManagement.rmSu(desu);
        replyMsg(context, `已取消管理员${desu}`);
    }

    //停止程序（利用pm2重启）
    if (args.shutdown) process.exit();
});

//设置监听器
if (setting.debug) {
    //私聊
    bot.on('message.private', debugPrivateAndAtMsg);
    //讨论组@
    //bot.on('message.discuss.@me', debugRrivateAndAtMsg);
    //群组@
    bot.on('message.group.@me', debugPrivateAndAtMsg);
    //群组
    bot.on('message.group', debugGroupMsg);
} else {
    //私聊
    bot.on('message.private', privateAndAtMsg);
    //讨论组@
    //bot.on('message.discuss.@me', privateAndAtMsg);
    //群组@
    bot.on('message.group.@me', privateAndAtMsg);
    //群组
    bot.on('message.group', groupMsg);
    //提醒
    bot.on('notice.group_increase', notice);
    bot.on('notice.group_decrease', notice);
}

//连接相关监听
bot.on('socket.connecting', (wsType, attempts) => console.log(`${getTime()} 连接中[${wsType}]#${attempts}`))
    .on('socket.failed', (wsType, attempts) => console.log(`${getTime()} 连接失败[${wsType}]#${attempts}`))
    .on('socket.error', (wsType, err) => {
        console.error(`${getTime()} 连接错误[${wsType}]`);
        console.error(err);
    })
    .on('socket.connect', (wsType, sock, attempts) => {
        console.log(`${getTime()} 连接成功[${wsType}]#${attempts}`);
        if (wsType === '/api') {
            setTimeout(() => {
                if (bot.isReady() && setting.admin > 0) {
                    bot('send_private_msg', {
                      user_id : setting.admin,
                      message : `已上线#${attempts}`,
                    });
                  }
            }, 1000);
        }
    });

//connect
bot.connect();

//以及每日需要更新的一些东西，暂时没用
// setInterval(() => {
//     if (bot.isReady()) {}
// }, 60 * 60 * 1000);

function notice(context) {
    context.message_type = 'group';
    if (userManagement.checkBan(context.user_id, context.group_id)) return true;
    if (context.notice_type == 'group_increase' 
        && setting.notification.group_increase.length > 0) replyMsg(context, setting.notification.group_increase);
    else if (context.notice_type == 'group_decrease'  
        && setting.notification.group_decrease.length > 0) replyMsg(context, setting.notification.group_decrease);
}

//通用处理
function commonHandle(e, context) {
    //黑名单检测
    if (userManagement.checkBan(context.user_id, context.group_id)) return true;

    // admin权限拉高
    if (context.user_id == config.bot.admin) {
        context.sender.role = "SU";
    }

    // SU权限拉高
    context = userManagement.updateRole(context);

    //兼容其他机器人
    const startChar = context.message.charAt(0);
    if (startChar == '/' || startChar == '<') return true;

    //通用指令
    const args = parseArgs(context.message);
    if (args.help) {
        replyMsg(context, 'https://github.com/Ninzore/Wecab/wiki');
        return true;
    }
    if (args.version) {
        replyMsg(context, version);
        return true;
    }
    if (args.about) {
        replyMsg(context, 'https://github.com/Ninzore/Wecab');
        return true;
    }

    return false;
}

//私聊以及群组@的处理
function privateAndAtMsg(e, context) {
    if (commonHandle(e, context)) {
        e.stopPropagation();
        return;
    }
    else if (pretendLearn.learn(context)) {
        e.stopPropagation();
        return;
    }
    //其他指令, 现在没有
    return;
}

//调试模式
function debugPrivateAndAtMsg(e, context) {
    if (context.user_id != setting.admin) {
        e.stopPropagation();
        return setting.replys.debug;
    }
    return privateAndAtMsg(e, context);
}

function debugGroupMsg(e, context) {
    if (context.user_id != setting.admin) e.stopPropagation();
    else return groupMsg(e, context);
}

//群组消息处理
function groupMsg(e, context) {
    let text_bak = context.message;
    context.message = pretendLearn.replaceEqual(context);
    translate.orientedTrans(context);
    
    if (commonHandle(e, context)) {
        e.stopPropagation();
        return;
    }
 
    const { group_id, user_id } = context;

    if (weibo.weiboAggr(context, replyMsg) ||
        bilibili.bilibiliCheck(context) ||
        twitter.twitterAggr(context) ||
        pixivImage.pixivCheck(context, replyMsg, bot) ||
        helpZen(context, replyMsg, bot, rand) ||
        translate.transEntry(context) ||
        iHaveAfriend.deal(context, replyMsg, bot) ||
        nbnhhsh.demyth(context) ||
        pokemon.pokemonCheck(context, replyMsg) ||
        telephone.dial(context)
    ) {
        e.stopPropagation();
        return;
    }
    else if (/^\.dice.+/g.exec(context.message)) {
        dice(context, replyMsg, rand);
        e.stopPropagation();
        return;
    }
    else if (setting.repeat.enable) {
        context.message = text_bak;
        //复读（
        //随机复读，rptLog得到当前复读次数
        if (rptLog.rptLog(group_id, user_id, context.message) >= setting.repeat.times && getRand() <= setting.repeat.probability) {
            rptLog.rptDone(group_id);
            //延迟2s后复读
            setTimeout(() => {
                replyMsg(context, context.message);
            }, 1000);
        } else if (getRand() <= setting.repeat.commonProb) {
            //平时发言下的随机复读
            setTimeout(() => {
                replyMsg(context, context.message);
            }, 1000);
        } else {
            if (getRand() <= config.learn.probability) pretendLearn.talk(context);
        }
    }
}


/**
 * 判断消息是否有图片
 *
 * @param {string} msg 消息
 * @returns 有则返回true
 */
function hasImage(msg) {
    return msg.indexOf('[CQ:image') !== -1;
}

/**
 * 回复消息
 *
 * @param {object} context 消息对象
 * @param {string} msg 回复内容
 * @param {boolean} at 是否at发送者
 */
function replyMsg(context, msg, at = false) {
    if (typeof msg !== 'string' || msg.length === 0) return;
    switch (context.message_type) {
        case 'private':
            return bot('send_private_msg', {
                user_id: context.user_id,
                message: msg,
            });
        case 'group':
            return bot('send_group_msg', {
                group_id: context.group_id,
                message: at ? CQ.at(context.user_id) + msg : msg,
            });
        case 'discuss':
            return bot('send_discuss_msg', {
                discuss_id: context.discuss_id,
                message: at ? CQ.at(context.user_id) + msg : msg,
            });
    }
}

/**
 * 生成随机浮点数
 *
 * @returns 0到100之间的随机浮点数
 */
function getRand() {
    return rand.floatBetween(0, 100);
}

function getTime() {
    return new Date().toLocaleString();
}

function parseArgs(str, enableArray = false, _key = null) {
    const m = minimist(
        str
            .replace(/(--\w+)(?:\s*)(\[CQ:)/g, '$1 $2')
            .replace(/(\[CQ:[^\]]+\])(?:\s*)(--\w+)/g, '$1 $2')
            .split(' '),
        {
            boolean: true,
        }
    );
    if (!enableArray) {
        for (const key in m) {
            if (key == '_') continue;
            if (Array.isArray(m[key])) m[key] = m[key][0];
        }
    }
    if (_key && typeof m[_key] == 'string' && m._.length > 0) m[_key] += ' ' + m._.join(' ');
    return m;
}
