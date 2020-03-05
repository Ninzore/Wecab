var axios = require("axios");

var deleteMsg = true;

function pixivCheck(context, replyFunc, bot) {
    if (/^看看p站.*/i.test(context.message)) {
        pic_id = /(\d+)/.exec(context.message)[1];
        singleImage(pic_id, replyFunc, context, bot);
        return true;
    }
    else return false;
}

function checkImage(url) {
    return axios.head(url).then(ret => parseInt(ret.headers['content-length'])).catch(err => {return err.response.status});
}

function imageCQcode(pic_id) {
    return `[CQ:image,file=https://pixiv.cat/${pic_id}.jpg]`;
}

async function singleImage(pic_id, replyFunc, context, bot) {
    let payload = "";
    let url = `https://pixiv.cat/${pic_id}.jpg`
    let size = await checkImage(url);
    let flag = true;
    if (size == 404) {
        payload = "图被删了";
        flag = false;
    }
    else if (size > 3600000) {
        payload = "图太大发不出来，原图看这里" + url;
        flag = false;
    }
    else payload = imageCQcode(pic_id);

    sender(replyFunc, context, payload, bot, flag);
}

function sender(replyFunc, context, text, bot, flag) {
    replyFunc(context, text).then(res => {
        if (deleteMsg && flag && res && res.data && res.data.message_id)
            setTimeout(() => {
                bot('delete_msg', {
                    message_id : res.data.message_id,
                });
            }, 60 * 1000);
    })
    .catch(err => {
        console.error(`${new Date().toLocaleString()} [error] delete msg\n${err}`);
    });
}

module.exports = {pixivCheck};
