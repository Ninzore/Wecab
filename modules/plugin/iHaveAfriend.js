const canvas = require('canvas');

async function draw(context, replyFunc, bot) {
    if (!/合成文本/.test(context.message)) return false;
    let user_id = context.user_id; ///\[CQ:at,qq=(\d+)\]/.exec(context.message);
    if (!user_id) return false;
    //else user_id = user_id[1];
    const member_info = context.sender;
    /*await bot("get_group_member_info", {不能获取自己QQ的信息 { data: null, retcode: 102, status: 'failed' }
           user_id: user_id,
           group_id: context.group_id,
       });*/
    //console.log(member_info);
    //if (!member_info || member_info.status != "ok") return false;
    let name = member_info.card ? member_info.card : member_info.nickname;
    if (!name) return false;
    if (name.length > 16) name = name.substring(0, 16) + "...";
    let message = context.message.substr(4);
    //console.log(message);
    if (!message) return false;
    //else message = message[1];
    message = message.replace(/\[CQ.+?\]/g, "");
    const raw = await canvas.loadImage(`${__dirname}/qq_chat.jpg`);
    const base = canvas.createCanvas(raw.width, raw.height);
    let ctx = base.getContext("2d");
    ctx.drawImage(raw, 0, 0);

    // 填充名字
    ctx.fillStyle = "#959595";
    ctx.font = "800 20px Source Han Sans";
    ctx.fillText(name, 136, 60);

    // 填充文字
    ctx.fillStyle = "#000000";
    ctx.font = "300 32px Sans";
    ctx.fillText(message, 150, 127);

    // 填充头像
    let head = await canvas.loadImage(`http://q1.qlogo.cn/g?b=qq&s=100&nk=${user_id}`);
    let round_head = canvas.createCanvas(head.width, head.height);
    let head_ctx = round_head.getContext("2d");

    // 弄圆
    head_ctx.beginPath();
    head_ctx.arc(89 / 2, 89 / 2, 89 / 2, 0, Math.PI * 2, false);
    head_ctx.fill()
    head_ctx.closePath();
    head_ctx.clip();

    head_ctx.drawImage(head, 0, 0, 89, 89);
    ctx.drawImage(head_ctx.canvas, 29, 29, 89, 89);

    const img64 = base.toBuffer("image/jpeg", { quality: 1 }).toString("base64");
    replyFunc(context, `[CQ:image,file=base64://${img64}]`);
    return true;
}

module.exports = { draw };