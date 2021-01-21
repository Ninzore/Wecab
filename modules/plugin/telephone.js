let bot;
let replyFunc = (context, msg, at = false) => {};
let yellow_book = [];
let black_book = [];

function init(replyMsg, main_bot) {
    replyFunc = replyMsg;
    bot = main_bot;
    setTimeout(() => {
        bot("get_group_list").then(res => {
            for (let group of res.data) {
                yellow_book.push(group.group_id);
            }
        });
    }, 500);
}

async function connect(context) {
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
    }

    if (!yellow_book.some(value => value == receiver)) {
        replyFunc(context, "目前未加入该群");
        return;
    }
    const sender = context.sender.card ? context.sender.card : context.sender.nickname;
    const sender_group_name = (await bot("get_group_info", {
        group_id : sender_group
    })).data.group_name;
    const message = `来自${sender_group_name}的${sender}说道:\n${context.message.substring(temp[0].length, context.message.length)}`;

    replyFunc(context, `发送成功了哟`);
    replyFunc({group_id : receiver, message_type : "group"}, message);
}

function paging(context) {
    if (!black_book.some(value => value == context.group_id) && 
        /^发送\d{8,10}[,，].+/.test(context.message)) {
        connect(context);
        return true;
    }
    else if (/^通信列表$/.test(context.message)) {
        replyFunc(context, yellow_book.join(", "));
        return true;
    }
    else return false;
}

module.exports = {paging, init};