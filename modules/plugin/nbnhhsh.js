const logger2 = require('../logger2'); //日志功能

var axios = require('axios');

const API_URL = 'https://lab.magiconch.com/api/nbnhhsh/guess';
let replyFunc = (context, msg, at = false) => { logger2.info("nbnhhsh:" + msg) };

function reply(replyMsg) {
    replyFunc = replyMsg;
}

function letItGuess(heihua) {
    return axios({
        method: "POST",
        url: API_URL,
        data: { "text": heihua }
    }).then(res => { return res.data }).catch(err => logger2.info("nbnhhsh1:" + err.response.data))
}

function findAndGuess(context) {
    if (/http/.test(context.message)) return;
    let heihua = context.message.match(/[a-z]{3,}/ig);
    if (heihua != undefined && heihua.length > 0) {
        heihua = heihua.join(',').toLowerCase();
        letItGuess(heihua).then(guess => {
            if (guess != undefined) replyOnrigin(context, guess);
        })
    } else return;
}

function replyOnrigin(context, guess) {
    let guessText = context.message;
    let nameReg = "";
    for (i in guess) {
        if ('trans' in guess[i]) {
            nameReg = new RegExp(guess[i].name, "i");
            guessText = guessText.replace(nameReg, guess[i].trans[0]);
        } else continue;
    }
    replyFunc(context, "翻译一下：" + guessText)
}

module.exports = { findAndGuess, reply };