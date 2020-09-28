const canvas = require('canvas');
const logger2 = require('../logger2'); //日志功能

async function counterfeit(context, replyFunc, bot) {
    try {
        if (context.message.length > 200) {
            replyFunc(context, "文字内容超过200字符");
            return true;
        } else if (/\[CQ:image/.test(context.message) || /\[CQ:face/.test(context.message)) {
            replyFunc(context, "暂不支持插入图片或者表情");
            return true;
        }
        let user_id = context.user_id; ///\[CQ:at,qq=(\d+)\]/.exec(context.message);
        if (!user_id) throw 1;
        //else user_id = user_id[1];
        const member_info = context.sender;
        /*await bot("get_group_member_info", {不能获取自己QQ的信息 { data: null, retcode: 102, status: 'failed' }
               user_id: user_id,
               group_id: context.group_id,
           });*/
        //console.log(member_info);
        //if (!member_info || member_info.status != "ok") throw 1;
        let name = member_info.card ? member_info.card : member_info.nickname;
        if (!name) throw 2;
        if (name.length > 16) name = name.substring(0, 16) + "...";
        let message = context.message.substr(4);
        //console.log(message);
        if (!message) throw 3;
        //else message = message[1];
        message = message.replace(/\r\n/g, "<br>").split("<br>");
        /*const raw = await canvas.loadImage(`${__dirname}/qq_chat.jpg`);
        const base = canvas.createCanvas(raw.width, raw.height);
        let ctx = base.getContext("2d");
        ctx.drawImage(raw, 0, 0);*/
        //let message = /(?:(?<!CQ)[:：](.+)|['"‘“](.+?)['"’”]$)/.exec(message);
        //if (!message) throw 4;
        //else message = message.filter((noEmpty) => {
        //    return noEmpty != undefined
        //})[1];
        //分行
        let len_list = [];
        for (let i in message) {
            let lines = [];
            for (let index = 0; index < message[i].length; index++) {
                let line = "";
                let length = 0;
                while (length < 30 && index < message[i].length) {
                    let char = message[i].charAt(index);
                    if (/[\x00-\xff]/.test(char)) length++;
                    else length += 2;
                    line += char;
                    index++;
                }
                lines.push(line);
                len_list.push(length);
            }
            message[i] = lines;
        }
        message = message.flat();

        // 背景
        const longest = 16 * Math.max(...len_list);
        const text_width = longest + 130 + 100;
        const name_width = name.length * 21 + 135;
        let width = text_width > name_width ? text_width : name_width;
        if (width > 830) width = 830;
        const height = 145 + 35 * message.length;

        const base = canvas.createCanvas(width, height);
        let ctx = base.getContext("2d");
        ctx.fillStyle = "#ECECF6";
        ctx.fillRect(0, 0, width, height);

        // 画气泡
        const bubble = {
            x: 130,
            y: 78,
            width: longest + 42,
            height: 35 * message.length + 42,
            r: 30
        };
        ctx.beginPath();
        ctx.moveTo(bubble.x + bubble.r, bubble.y);
        ctx.arcTo(bubble.x + bubble.width, bubble.y, bubble.x + bubble.width, bubble.y + bubble.height, bubble.r);
        ctx.arcTo(bubble.x + bubble.width, bubble.y + bubble.height, bubble.x, bubble.y + bubble.height, bubble.r);
        ctx.arcTo(bubble.x, bubble.y + bubble.height, bubble.x, bubble.y, bubble.r);
        ctx.arcTo(bubble.x, bubble.y, bubble.x + bubble.width, bubble.y, bubble.r);
        ctx.closePath();
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();

        // 填充名字
        ctx.fillStyle = "#959595";
        ctx.font = "800 20px Source Han Sans SC";
        ctx.fillText(name, 136, 60);

        // 填充文字
        ctx.fillStyle = "#000000";
        ctx.font = "400 32px SimHei";
        ctx.fillText(message.join("\n"), 150, 127);

        // 填充头像
        let head = await canvas.loadImage(`http://q1.qlogo.cn/g?b=qq&s=100&nk=${user_id}`);
        if (!head) throw 1;
        let round_head = canvas.createCanvas(head.width, head.height);
        let head_ctx = round_head.getContext("2d");

        // 把头像弄圆
        head_ctx.beginPath();
        head_ctx.arc(89 / 2, 89 / 2, 89 / 2, 0, Math.PI * 2, false);
        head_ctx.fill()
        head_ctx.closePath();
        head_ctx.clip();

        head_ctx.drawImage(head, 0, 0, 89, 89);
        ctx.drawImage(head_ctx.canvas, 29, 29, 89, 89);

        // 出图
        const img64 = base.toBuffer("image/jpeg", {
            quality: 1
        }).toString("base64");
        replyFunc(context, `[CQ:image,file=base64://${img64}]`);
        return true;
    } catch (err) {
        replyFunc(context, "出错惹");
        logger2.error("iHaveAfriend," + new Date().toString() + ":" + err);
    }
}

function deal(context, replyFunc, bot) {
    if (/合成文本/.test(context.message)) {
        counterfeit(context, replyFunc, bot)
    } else return false;
}

module.exports = {
    deal
};