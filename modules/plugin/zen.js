import config from '../config';
var admin = parseInt(config.picfinder.admin);

function helpZen(context, replyFunc, bot, rand) {
    if (context.sender.role != "admin" && /^(来干我啊|口我|我超勇的).?$/.test(context.message)) {
        bot('set_group_ban', {group_id : context.group_id, user_id : context.user_id, duration : 60*rand.intBetween(1, 10)});
        replyFunc(context, "你很勇哦？");
        return true;
    }
    else if (context.sender.role != "admin" && /^(我要睡了|睡了).?$/.test(context.message)) {
        bot('set_group_ban', {group_id : context.group_id, user_id : context.user_id, duration : 60*60*rand.intBetween(1, 7)});
        replyFunc(context, "睡眠套餐来一份");
        return true;
    }
    else if (context.sender.role != "admin" && /^我[爱要]学习了?$/.test(context.message)) {
        bot('set_group_ban', {group_id : context.group_id, user_id : context.user_id, duration : 60*60*rand.intBetween(0.5, 2)});
        replyFunc(context, "你爱学习");
        return true;
    }
    else if (context.user_id == admin && /^口[他她]\s?\[CQ:at,qq=\d+\]\s?$/.test(context.message)) {
        let user_id = /\[CQ:at,qq=(\d+)\]\s?$/.exec(context.message)[1];
        bot('set_group_ban', {group_id : context.group_id, user_id : user_id, duration : 60*rand.intBetween(1, 10)});
        replyFunc(context, "正 义 执 行");
        return true;
    }
    else if (context.user_id == admin && /^放[他她]\s?\[CQ:at,qq=\d+\]\s?$/.test(context.message)) {
        let user_id = /\[CQ:at,qq=(\d+)\]\s?$/.exec(context.message)[1];
        bot('set_group_ban', {group_id : context.group_id, user_id : user_id, duration : 0});
        replyFunc(context, "放人放人");
        return true;
    }
    else return false;
}

export default helpZen;
