function response(context, replyFunc) {
    let record_name = "";
    let text = "";
    if (/^DD斩首.?$/i.test(context.message)) {
        record_name = recordCQcode("dd.mp3");
        text = "DD斬首ー！";
        sender(replyFunc, context, record_name);
        sender(replyFunc, context, text);
        return true;
    }
    if (/^是狗妈.?$/.test(context.message)) {
        record_name = recordCQcode("登場.mp3");
        text = "唐辛子星から参りました、カグラナナです！";
        sender(replyFunc, context, record_name);
        sender(replyFunc, context, text);
        return true;
    }
    if (/^peko$/.test(context.message)) {
        record_name = recordCQcode("ha↑ha↑ha↑ha↑.mp3");
        text = "哈↑哈↑哈↑哈↑";
        sender(replyFunc, context, record_name);
        sender(replyFunc, context, text);
        return true;
    }
    if (/^噫hihihi$/.test(context.message)) {
        record_name = recordCQcode("噫hihihi.mp3");
        text = "噫hihihi";
        sender(replyFunc, context, record_name);
        sender(replyFunc, context, text);
        return true;
    }
    else return false;
}

function recordCQcode(record_name) {
    return `[CQ:record,file=${record_name}]`;
}

function sender(replyFunc, context, text) {
    replyFunc(context, text)
}

module.exports = {response};
