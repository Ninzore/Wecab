import axios from "axios";

const deleteMsg = global.config.pixiv.deleteMsg;

function pixivCheck(context, replyFunc, bot) {
    if (/^看看p站.?/i.test(context.message)) {
        let pic_id = /\d+/.exec(context.message);
        if (pic_id != null) singleArtwork(pic_id[0], replyFunc, context, bot);
        return true;
    }
    else return false;
}

async function checkImage(url, method = 'HEAD') {
    return axios({
        url,
        method
    }).catch(err => {return err.response});
}

function imageCQcode(pic_id) {
    return `[CQ:image,,cache=0,file=https://pixiv.cat/${pic_id}.jpg]`;
}

async function singleArtwork(pic_id, replyFunc, context, bot) {
    let payload = "";
    let url = `https://pixiv.cat/${pic_id}.jpg`
    let res = await checkImage(url, "GET");
    let delete_flag = true;
    
    if (res.status == 404) {
        if (/這個作品ID中有多張圖片/.test(res.data)) {
            let i = 1;
            do {
                let url = `https://pixiv.cat/${pic_id}-${i}.jpg`;
                res = await checkImage(url);
                if (res.status != 200) break;
                else if (parseInt(res.headers['content-length']) > 26214400) payload += "图太大发不出来，原图看这里" + url;
                else payload += imageCQcode(`${pic_id}-${i}`);
                i++;
            }
            while (res != false);
        }
        else {
            payload = "图可能被删了";
            delete_flag = false;
        }
    }
    else if (parseInt(res.headers['content-length']) > 26214400) {
        payload = "图太大发不出来，原图看这里" + url;
        delete_flag = false;
    }
    else payload = imageCQcode(pic_id);
    sender(replyFunc, context, payload, bot, delete_flag);
}

function sender(replyFunc, context, payload, bot, delete_flag) {
    replyFunc(context, payload).then(res => {
        if (deleteMsg && delete_flag && res && res.data && res.data.message_id)
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

export default {pixivCheck};