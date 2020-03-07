else if (pixivImage.pixivCheck(context, replyMsg, bot));
else if (weibo.weiboCheck(context, replyMsg));
else if (bilibili.bilibiliCheck(context, replyMsg));
else if (pokemon.pokemonCheck(context, replyMsg));
else if (/^\.dice.+/g.exec(context.message)) {
    dice(context, replyMsg, rand);
}
