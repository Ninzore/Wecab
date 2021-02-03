const fs = require("fs-extra");

const YELLOWBOOK_PATH = "data/yellow_book.json";
const BLACKBOOK_PATH = "data/black_book.json";

let bot;
let replyFunc = {};
let all_groups = [];
let BLACKBOOK = [];
let YELLOWBOOK = {};

function init(replyMsg, main_bot, context = false) {
    replyFunc = replyMsg;
    bot = main_bot;

    if (!fs.existsSync(YELLOWBOOK_PATH)) fs.writeJSONSync(YELLOWBOOK_PATH, YELLOWBOOK);
    if (!fs.existsSync(BLACKBOOK_PATH)) fs.writeJSONSync(BLACKBOOK_PATH, BLACKBOOK);

    YELLOWBOOK = fs.readJsonSync(YELLOWBOOK_PATH);
    BLACKBOOK = fs.readJsonSync(BLACKBOOK_PATH);
    setTimeout(() => {
        bot("get_group_list").then(res => {
            for (let group of res.data) {
                all_groups.push(group.group_id);
            }
        });
    }, 500);
    if (context) replyFunc(context, "刷新完成");
}

function authentication(context) {
    if (context.sender.role == "member") {
        replyFunc(context, "不够格");
        return false;
    }
    else return true;
}

async function calling(context) {
    if (context.message.length > 200) {
        replyFunc(context, "太长了");
        return;
    }
    const sender_group = context.group_id;

    const reg = new RegExp("^发送(\\d{8,10})[,，]");
    const temp = reg.exec(context.message);
    const receiver = temp[1];
    if (receiver == sender_group) {
        replyFunc(context, "不能自己给自己发");
        return;
    } else if (BLACKBOOK.some(value => value == receiver)) {
        replyFunc(context, "该地址已禁用连线");
        return;
    } else if (BLACKBOOK.some(value => value == sender_group)) {
        replyFunc(context, "发送前自己得先解除封锁");
        return;
    }

    if (!all_groups.some(value => value == receiver)) {
        replyFunc(context, "目前未加入该群");
        return;
    }
    const sender = context.sender.card ? context.sender.card : context.sender.nickname;

    let sender_group_name = ""
    for (let name of Object.keys(YELLOWBOOK)) {
        if (YELLOWBOOK[name] == context.group_id) sender_group_name = name;
    }
    sender_group_name = sender_group_name ? sender_group_name : (await bot("get_group_info", {
        group_id : sender_group
    })).data.group_name;

    const message = `来自${sender_group_name}的${sender}说道:\n${context.message.substring(temp[0].length, context.message.length)}`;

    replyFunc(context, `发送成功了哟`);
    replyFunc({group_id : receiver, message_type : "group"}, message);
}

function connect(context) {
    if (!authentication(context)) return;
    BLACKBOOK = BLACKBOOK.filter(value => value != context.group_id);
    fs.writeJSONSync(BLACKBOOK_PATH, BLACKBOOK);
    replyFunc(context, "又能收发消息了");
    return;
}

function disconnect(context) {
    if (!authentication(context)) return;
    BLACKBOOK.push(context.group_id);
    fs.writeJSONSync(BLACKBOOK_PATH, BLACKBOOK);
    replyFunc(context, "不会再收发消息了");
    return;
}

function paging(context) {
    let receiver = /^发送(.+?)[,，]/.exec(context.message)[1];
    let group_id = YELLOWBOOK[receiver] || false;
    if (!group_id) {
        replyFunc(context, "查无此群");
        return;
    }

    context.message = context.message.replace(receiver, group_id);
    calling(context);
}

function yellowBook(context) {
    if (!authentication(context)) return;
    let text = "黄页总览\n" + Object.keys(YELLOWBOOK).join("，");
    replyFunc(context, text);
}

function dial(context) {
    if (/^发送\d{8,10}[,，].+/.test(context.message)) {
        calling(context);
        return true;
    }
    else if (/^发送.{2,8}[,，].+/.test(context.message)) {
        paging(context);
        return true;
    }
    else if (/^开启跨组消息$/.test(context.message)) {
        connect(context);
        return true;
    }
    else if (/^关闭跨组消息$/.test(context.message)) {
        disconnect(context);
        return true;
    }
    else if (/^查看黄页$/.test(context.message)) {
        yellowBook(context);
        return true;
    }
    else if (/^刷新黄页$/.test(context.message)) {
        init(replyFunc, bot, context);
        return true;
    }
    else return false;
}

module.exports = {dial, init};