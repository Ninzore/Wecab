var mongodb = require('mongodb').MongoClient;

var db_path = "mongodb://127.0.0.1:27017";

/**
 * 教学环节
 * @param {object} context
 */
function teach(context, replyFunc) {
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
        let err = false;
        let text = "";
        //匹配模式选择
        let mode = "exact";
        if (mode_name != undefined) {
            switch (mode_name) {
                case "精确": 
                    if (qes.length < 2) {
                        err = true;
                        text = "太短了";
                    } 
                    break;
                case "模糊": 
                    mode = "fuzzy";
                    if (qes.length < 3) {
                        err = true;
                        text = "太短了";
                        return;
                    }
                    break;
                case "正则": 
                    mode = "regexp"; 
                    try {
                        new RegExp(qes);
                    } catch(err) {
                        err = true;
                        text = "正则都写错了，重修去吧";
                    }
                    break;
                default : 
                    err = true;
                    text = "哇你会不会写啊？";
                    break;
            }
        }
        //如果没有指定模式，使用这里的配置
        else {
            if (qes.length < 2) {
                err = false;
                text = "太短了";
            }
            else if (qes.length < 5) mode = "fuzzy";
            else mode = "exact";
        }
        //console.log(mode)
        //如果没有错误就写入数据库
        if (!err) {
            mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
                let qa_set = mongo.db('qa_set').collection("qa" + String(context.group_id));
                await qa_set.updateOne({question : qes, mode : mode}, {$addToSet : {answers : ans}}, {upsert : true});
                mongo.close();
            }).catch((e) => {console.log(e)});
            text = "好我会了";
        }
        sender(replyFunc, context, text);
    }
}


function forget(context, replyFunc) {
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
                if (mode == "regexp" && !(/^([?/.+*]|\.\*)$/.test(qes))) {
                    let reg_exp = new RegExp(qes);
                    result = await coll.findOneAndDelete({question : reg_exp, mode : mode});
                }
                else result = await coll.findOneAndDelete({question : qes, mode : mode});
            }
            else result = await coll.findOneAndDelete({question : qes});
            // console.log(result)
            if (result.value == null) text = "我都还没记住呢";
            else text = `我已经完全忘记了${result.value.question}和它的${result.value.answers.length}个回应`;
            sender(replyFunc, context, text);
            // console.log(text);
            mongo.close();
        }).catch((err) => {console.log(err)});
    }
}

function talk(context, replyFunc) {
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('qa_set').collection("qa" + String(context.group_id));
        let order = ["exact", "regexp", "fuzzy"];
        
        let result = [];
        let answers = [];
        let reg_exp = "";

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

                    if (answers.length > 0) {
                        let rand = Math.floor(Math.random() * answers.length);
                        sender(replyFunc, context, answers[rand]);
                        // console.log(answers[rand]);
                        break;
                    }
                }
            }
            else continue;
        }
        mongo.close();
    }).catch((err) => {console.log(err)});
}

function sender(replyFunc, context, text) {
    // console.log(text);
    replyFunc(context, text);
}

module.exports = {teach, talk, forget};
