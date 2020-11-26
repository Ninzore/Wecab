var axios = require('axios');

const API_URL = 'https://lab.magiconch.com/api/nbnhhsh/guess';
let replyFunc = (context, msg, at = false) => {console.log(msg)};

function reply(replyMsg) {
    replyFunc = replyMsg;
}

function letItGuess(heihua) {
    return axios({
        method : "POST",
        url : API_URL,
        data : {"text" : heihua}
    }).then(res => {return res.data}).catch(err => console.log(err.response.data))
}

function findAndGuess(context) {
    if (context.message.length > 100) {
        replyFunc(context, "太长了一口吃不下");
        return;
    } else if (/http|\[CQ:/.test(context.message)) {
        replyFunc(context, "别把怪东西带进来啊");
        return;
    }
    const message = context.message;
    context.message = message.substring(/[:：]/.exec(message).index+1, message.length);

    let heihua = context.message.match(/[a-z]{3,}/ig);
    if (heihua != undefined && heihua.length > 0) {
        heihua = heihua.join(',').toLowerCase();
        letItGuess(heihua).then(guess => {
            if (guess != undefined) replyOrigin(context, guess);
        })
    }
    else return;
}

function replyOrigin(context, guess) {
    let guessText = context.message;
    let nameReg = "";
    for (i in guess) {
        if ('trans' in guess[i]) {
            nameReg = new RegExp(guess[i].name, "i");
            guessText = guessText.replace(nameReg, guess[i].trans[0]);
        }
        else continue;
    }
    replyFunc(context, "翻译一下：" + guessText)
}

function demyth(context) {
    if (/^解[密谜][:：].+/.test(context.message)) {
        findAndGuess(context);
        return true;
    } else return false;
}

module.exports = {demyth, reply};
