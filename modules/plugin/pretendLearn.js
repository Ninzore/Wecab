var mongodb = require('mongodb').MongoClient;

var db_path = "mongodb://127.0.0.1:27017";

function teach(context, replyFunc) {
        let qa = /\s?我教你\s?(.+?)\s?[＞>]\s?(.+)/i.exec(context.message);
        if (qa == null);
        else {
            let qes = qa[1];
            let ans = qa[2];
    
            let mode = 0;
            mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
                // if (err) console.log("database connection error during checkList")
                let coll = mongo.db('bot').collection('qa');
                await coll.updateOne({question : qes}, {$addToSet : {answers : ans, groups : context.group_id}, $set : {mode : mode}}, {upsert : true});
                let text = "好我会了";
                sender(replyFunc, context, text);
                mongo.close();
            }).catch((err) => {console.log(err)});
        }
}

function forget(context, replyFunc) {
        let match = /\s?(忘记|忘掉)\s?(.+)/i.exec(context.message);
        if (match == null);
        else {
            mongodb(db_path, {useUnifiedTopology: true}).connect().then((mongo) => {
                // if (err) console.log("database connection error during checkList")
                
            let text = "";
            let qes = match[2];
            let coll = mongo.db('bot').collection('qa');
            coll.findOneAndUpdate({question : qes},
                                {$pull : {groups : {$in : [context.group_id]}}},
                async (err, result) => {
                if (err) text = "database forget delete error";
                else {
                    // console.log(result)
                    if (result.value == null) text = "我还什么都没记住呢";
                    else if (!result.value.groups.includes(context.group_id)) text = "我还没记住呢";
                    else text = "我已经完全忘记了";
                }
                
                if (result.value != null){
                    await coll.findOne({_id : result.value._id}).then(check => {
                        if (check.groups.length == 0) coll.deleteOne({_id : result.value._id})
                    });
                }
                sender(replyFunc, context, text);
                mongo.close();
                });
        }).catch((err) => {console.log(err)});
    }
}

function talk(context, replyFunc) {
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(mongo => {
        // if (err) console.log("database connection error during checkList")

        let coll = mongo.db('bot').collection('qa');
        // let check = await coll.findOne({question : context.message, groups});
        coll.findOne({question : context.message, groups : {$elemMatch : {$eq : context.group_id}}}).then(result => {
            // console.log(result)
            if (result != null){
                let rand = Math.floor(Math.random() * result.answers.length);
                sender(replyFunc, context, result.answers[rand]);
            }
            else;
            mongo.close();
        });

    }).catch((err) => {console.log(err)});
}

function sender(replyFunc, context, text) {
    // console.log(text)
    replyFunc(context, text);
}

module.exports = {teach, talk, forget};
