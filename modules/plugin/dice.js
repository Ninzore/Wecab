function dice(context, replyFunc, rand) {
    let content = context.message;
    let num = 0;
    let arr = [];
    let sum = 0;
    let message = "";

    if (/\.dice\d{1,3}x\d,(\d{1,2})/.exec(content)) {
        let reOut = /\.dice(\d{1,3})x(\d),(\d{1,2})/.exec(content);
        num = reOut[2];
        let low = parseInt(reOut[3]);
        let high = parseInt(reOut[1]);
        for (let i=0;i<num;i++)
        {
            arr[i] = rand.intBetween(low, high);
            sum += arr[i]; 
        }
        message = num + "个最低为" + low + "的D" + high + ": " + arr.join(" ") + "， 总计 " + sum;
    }
    else if (/\.dice\d{1,3}x\d/.exec(content)) {
        let reOut = /\.dice(\d{1,3})x(\d)/.exec(content);
        let high = reOut[1];
        num = reOut[2];
        for (var i=0;i<num;i++)
        {
            arr[i] = rand.intBetween(1, high);
            sum += arr[i]; 
        }
        message = num + "个D" + high + ": " + arr.join(" ") + "， 总计 " + sum;
    }
    else if (/\.dice\d{1,3},\d{1,2}/.exec(content)) {
        let reOut = /\.dice(\d{1,3}),(\d{1,2})/.exec(content);
        let high = parseInt(reOut[1]);
        let low = parseInt(reOut[2]);
        let val = rand.intBetween(low, high);
        message = "最低为" + low + "的D" + high + " = "  + val;
    }
    else if (/\.dice\d{1,3}/.exec(content)) {
        let reOut = /\.dice(\d{1,3})/.exec(content);
        let high = parseInt(reOut[1]);
        let val = rand.intBetween(1, high);
        message = "D" + high + " = " + val;
    }
    else {
        message = "格式不对，参考\n.dice6  扔一个D6\n.dice8x5  扔5个D8\n.dice16,10  扔1个最低为10的D16\n.dice20x3,10  扔3个最低为10的D20";
    }
    replyFunc(context, message, true);
}

module.exports = dice;