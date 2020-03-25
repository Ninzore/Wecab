var mongodb = require('mongodb').MongoClient;

var db_path = "mongodb://127.0.0.1:27017";
var replyFunc = (context, msg, at = false) => {};

function learnReply(replyMsg) {
    replyFunc = replyMsg;
}
/**
 * 教学环节
 * @param {object} context
 */
function teach(context) {
    let qa_with_mode = RegExp(/我教你\s?(?<qes>.+?)\s?[＞>]\s?(?<ans>.+?)\s?[＞>]\s?(?<mode_name>精确|模糊|正则)/i);
    let qa_common = RegExp(/我教你\s?(?<qes>.+?)\s?[＞>]\s?(?<ans>.+)/i);
    
    let result = context.message.match(qa_with_mode);
    if (result == undefined) {
        result = context.message.match(qa_common);
    }
    if (result != null) {
        let {groups : {qes, ans, mode_name}} = result;
        // console.log(qes)
        // console.log(groups)
        let qes_err = false;
        let text = "";
        //匹配模式选择
        let mode = "exact";
        if (mode_name != undefined) {
            switch (mode_name) {
                case "精确": 
                    if (qes.length < 2) {
                        qes_err = true;
                        text = "太短了";
                    } 
                    break;
                case "模糊": 
                    mode = "fuzzy";
                    if (qes.length < 2) {
                        qes_err = true;
                        text = "太短了";
                        return;
                    }
                    break;
                case "正则": 
                    mode = "regexp"; 
                    //处理CQ自带的转义
                    qes = qes.replace("&amp;", "&").replace("&#91;", "[").replace("&#93;", "]");
                    let test_reg = qes.replace(/"[CQ:.+?]"/g, "");
                    if (!/[\[\]\^\$\\d\\w\\s\\b\.\{\}\|]/i.test(test_reg)) {
                        text = "吾日三省吾身\n1. 我真的会正则吗？\n2. 精确和模糊不够用，必须要正则吗\n3. 这正则写对了吗？";
                        qes_err = true;
                        break;
                    }
                    else try {
                        new RegExp(qes);
                    } catch(err) {
                        qes_err = true;
                        text = "正则都写错了，重修去吧";
                    } finally {
                        break;
                    }
                default : 
                    qes_err = true;
                    text = "哇你会不会写啊？";
                    break;
            }
        }
        //如果没有指定模式，使用这里的配置
        else {
            if (qes.length < 2) {
                qes_err = true;
                text = "太短了";
            }
            else if (qes.length < 5) mode = "exact";
            else mode = "fuzzy";
        }
        //console.log(mode)
        //如果没有错误就写入数据库
        if (!qes_err) {
            mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
                let qa_set = mongo.db('qa_set').collection("qa" + String(context.group_id));
                await qa_set.updateOne({question : qes, mode : mode}, {$addToSet : {answers : ans}}, {upsert : true});
                mongo.close();
            }).catch((e) => {console.log(e)});
            text = "好我会了";
        }
        sender(context, text);
        return true;
    }
    else return false;
}

function remember(context) {
    let common = new RegExp(/\s?(?:想一?想|回忆)\s?(?<ans>.+)/i);
    let specific = new RegExp(/\s?(?:想一?想|回忆)\s?(?<ans>.+?)\s?[＞>]\s?(?<mode_name>精确|模糊|正则)/i);

    let match_result = context.message.match(specific);
    if (match_result == undefined) {
        match_result = context.message.match(common);
    }

    if (match_result != null) {
        let {groups : {ans, mode_name}} = match_result;
        let text = "";
        let result = "";
        let mode = "exact";
        mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
            let coll = mongo.db('qa_set').collection("qa" + String(context.group_id));
            if (mode_name != undefined) {
                switch (mode_name) {
                    case "精确": mode = "exact";
                    case "模糊": mode = "fuzzy";
                    case "正则": mode = "regexp";
                }
                result = await coll.find({answers : ans, mode : mode});
            }
            else result = await coll.find({answers : ans}).toArray();
            // console.log(result)
            if (result.length < 1) text = "从来没学过啊";
            else {
                let qes_and_mode = [];
                let mode_name = "";
                result.forEach(element => {
                    switch (element.mode) {
                        case "exact": mode_name = "精确"; break;
                        case "fuzzy": mode_name = "模糊"; break;
                        case "regexp": mode_name = "正则"; break;
                        default: mode_name = "不明"; break;
                    }
                    qes_and_mode.push(`${element.question}，模式为${mode_name}`);
                });
                let result_text = qes_and_mode.join("\n");
                text = `我想想，我有学过\n${result_text}`;
            }
            sender(context, text);
            // console.log(text);
            mongo.close();
        }).catch((err) => {console.log(err)});
        return true;
    }
    else return false;
}

function rememberAll(context) {
    let common = new RegExp(/\s?你学过什么/i);

    let match_result = context.message.match(common);

    if (match_result != null) {
        let text = "";
        let result = "";
        // console.log(mode_name);
        // console.log(ans);
        mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
            let coll = mongo.db('qa_set').collection("qa" + String(context.group_id));
            result = await coll.find({}).toArray();
            // console.log(result)
            
            if (result.length < 1) text = "脑袋空空的啊";
            else {
                let qes_and_mode = [];
                let mode_name = "";
                result.forEach(element => {
                    switch (element.mode) {
                        case "exact": mode_name = "精确"; break;
                        case "fuzzy": mode_name = "模糊"; break;
                        case "regexp": mode_name = "正则"; break;
                        default: mode_name = "不明"; break;
                    }
                    qes_and_mode.push(`${element.question}，模式为${mode_name}`);
                });
                let result_text = qes_and_mode.join("\n");
                text = `我想想，我有学过\n${result_text}`;
            }
            sender(context, text);
            mongo.close();
        }).catch((err) => {console.log(err)});
        return true;
    }
    else return false;
}

function forget(context) {
    let common = new RegExp(/\s?(?:忘记|忘掉)\s?(?<qes>.+)/i);
    let specific = new RegExp(/\s?(?:忘记|忘掉)\s?(?<qes>.+?)\s?[＞>]\s?(?<mode_name>精确|模糊|正则)/i);

    let match_result = context.message.match(specific);
    if (match_result == undefined) {
        match_result = context.message.match(common);
    }

    if (match_result != null) {
        let {groups : {qes, mode_name}} = match_result;
        let text = "";
        let result = "";
        let mode = "exact";
        // console.log(mode_name);
        mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
            let coll = mongo.db('qa_set').collection("qa" + String(context.group_id));

            if (mode_name != undefined) {
                switch (mode_name) {
                    case "精确": mode = "exact";
                    case "模糊": mode = "fuzzy";
                    case "正则": mode = "regexp";
                }
                if (mode == "regexp" && !(/^(\.|\.\*)$/.test(qes))) {
                    //处理CQ自带的转义
                    qes = qes.replace("&amp;", "&").replace("&#91;", "[").replace("&#93;", "]");
                    let reg_exp = new RegExp(qes);
                    result = await coll.findOneAndDelete({question : reg_exp, mode : mode});
                }
                else result = await coll.findOneAndDelete({question : qes, mode : mode});
            }
            else result = await coll.findOneAndDelete({question : qes});
            // console.log(result)
            if (result.value == null) text = "我都还没记住呢";
            else text = `我已经完全忘记了${result.value.question}和它的${result.value.answers.length}个回应`;
            sender(context, text);
            // console.log(text);
            mongo.close();
        }).catch((err) => {console.log(err)});
        return true;
    }
    else return false;
}

function talk(context) {
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('qa_set').collection("qa" + String(context.group_id));
        let order = ["exact", "regexp", "fuzzy"];
        
        let result = [];
        let answers = [];
        let reg_exp = "";
        let cplt_flag = false;
        //按照order的顺序，循环检测匹配项
        for (let i = 0; i < order.length; i++) {
            result = await coll.find({mode : order[i]}).toArray();
            // console.log(result)
            if (result != null) {
                for (let j = 0; j < result.length; j++) {
                    switch (order[i]) {
                        case "exact": {
                            if (context.message == result[j].question) answers = result[j].answers;
                            break;
                        }
                        case "fuzzy": {
                            if (context.message.split(result[j].question).length > 1) answers = result[j].answers;
                            break;
                        }
                        case "regexp": {
                            reg_exp = new RegExp(result[j].question);
                            if (reg_exp.test(context.message)) answers = result[j].answers;
                            break;
                        }
                    }

                    //如果有回应，发送并标记已发送flag;
                    if (answers.length > 0) {
                        let rand = Math.floor(Math.random() * answers.length);
                        sender(context, answers[rand]);
                        // console.log(answers[rand]);
                        cplt_flag = true;
                        break;
                    }
                }
            }
            if (cplt_flag) break;
        }
        mongo.close();
    }).catch((err) => {console.log(err)});
}

function learn(context) {
    if ("group_id" in context) {
        if (teach(context)) {
            return true;
        }
        else if (forget(context)) {
            return true;
        }
        else if (remember(context)) {
            return true
        }
        else if (rememberAll(context) && /owner|admin/.test(context.sender.role)) {
            return true
        }
        else return false;
    }
    else return false;
}

function sender(context, text) {
    // console.log(text);
    replyFunc(context, text);
}

module.exports = {learn, talk, learnReply};
