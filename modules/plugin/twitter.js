var axios = require("axios");
var mongodb = require('mongodb').MongoClient;
var htmlparser = require("htmlparser2")

var db_port = 27017;
var db_path = "mongodb://127.0.0.1:" + db_port;
var replyFunc = (context, msg, at = false) => {};

function twiReply(replyMsg) {
    replyFunc = replyMsg;
}

function rss(user_id, option) {
    let filter = "";
    let url = `https://rsshub.app/twitter/user/${user_id}`;
    
    if (option == "仅原创") filter = "/exclude_rts_replies";
    else if (option == "包含转发") filter = "/exclude_replies";
    else if (option == "包含回复") filter = "/exclude_rts";
    else if (option == "全部") filter = "";

    url += filter + "?limit=5";
    return axios.get(url).then(res => htmlparser.parseFeed(res.data, {xmlMode:true})).catch(err => {return err.response.status});
}

async function subscribe(group_id, user_id, option) {
    let result = "";
    let timeline = await rss(user_id, option);
    if (timeline == 404) return result = "名字写错了，或者是无法订阅此人";

    return mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection("twitter");
        let timestamp = new Date(timeline.items[0].pubDate).getTime();
        await coll.updateOne({user_id : user_id},
                            {$addToSet : {groups : group_id}, $set : {screen_name: timeline.title.substr(0, timeline.title.length - 10), option : option, timestamp : timestamp}},
                            {upsert : true});
        mongo.close();
        result = `已订阅${timeline.title}，模式为${option}`;
        return result;
    }).catch((e) => {console.log(e);});
}

function unsubscribe(group_id, screen_name) {
    let result = "";
    return mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection("twitter");
        let name_reg = new RegExp(screen_name)
        let doc = await coll.findOneAndUpdate({screen_name : name_reg},
                                              {$pull : {groups : {$in : [group_id]}}},
                                              {returnOriginal : false});
        // console.log(doc);
        if (doc.value == null) {
            mongo.close();
            return result = "你还没订阅怎么就想取消了";
        }
        else if (doc.value.groups.length <= 0) {
            await coll.deleteOne({_id : doc.value._id});
        }
        result = `已取消订阅${doc.value.screen_name}的Twitter`;
        mongo.close();
        return result;
    }).catch(err => {console.log(err);});
}

function checkTimeline() {
    try{
        setInterval(() => {
        mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
            let coll = mongo.db('bot').collection('twitter');
            let subscribes = await coll.find({}).toArray();
            mongo.close();
            for (let i = 0; i < subscribes.length; i++) {
                let timeline = await rss(subscribes[i].user_id, subscribes[i].option);
                let last_timestamp = subscribes[i].timestamp;
                let curr_timestamp = new Date(timeline.items[0].pubDate).getTime();
                if (curr_timestamp > last_timestamp) update(subscribes[i], timeline);
            }
            
        });
        }, 5 * 60000);
    } catch(err) {console.err(err)};

    function update(subscribe, timeline) {
        try {
            mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
                let coll = mongo.db('bot').collection('twitter');
                let curr_timestamp = new Date(timeline.items[0].pubDate).getTime();
                let groups = subscribe.groups;
                sendNewTwitter(timeline, groups)
                // console.log(subscribe)
                await coll.updateOne({_id : subscribe._id},
                                    {$set : {screen_name : timeline.title.substr(0, timeline.title.length - 10), timestamp : curr_timestamp}});
                mongo.close();
            })
        } catch(err) {console.error(err)};
    }
    function sendNewTwitter(timeline, groups) {
        groups.forEach(group_id => {
            let payload = rssFormat(timeline);
            replyFunc({group_id:group_id}, payload);
        });
    }
}

function checkTwiSubs(context) {
    let group_id = context.group_id;
    var text = "";
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(mongo => {
        let coll = mongo.db('bot').collection('twitter');
        coll.find({groups : {$elemMatch : {$eq : group_id}}}, {projection: {_id : 0}})
            .toArray().then(result => {
                // console.log(result);
                mongo.close();
                if (result.length > 0) {
                    let name_list = [];
                    result.forEach(name_obj => {
                        name_list.push(name_obj.screen_name);
                    });
                    text = "本群已订阅: " + name_list.join(", ");
                }
                else text = "你一无所有";
                replyFunc(context, text);
                // console.log(text);
            });
    }).catch(err => console.log(err));
}

function rssFormat(timeline) {
    let output = [];
    output.push(timeline.title);
    let link_reg = new RegExp(timeline.link)
    if (!link_reg.test(timeline.items[0].id)) output.push("转发：");
    if (/^Re/.test(timeline.items[0].title)) output.push("回复推文: " + timeline.items[0].link);
    if ("description" in timeline.items[0]) output.push(replaceXML(timeline.items[0].description));
    else output.push(replaceXML(timeline.items[0].title));
    // console.log(output.join("\n"))
    return output.join("\n")
    function replaceXML(text) {
        // console.log(text)
       return text.replace(/<a.+?"(?<http>.+?)".+?<\/a>/g, "$<http>")
                   .replace(/<img src="(?<imgsrc>.+?)".+?>/g, "[CQ:image,cache=0,file=$<imgsrc>]")
                   .replace(/<video.+?poster="(?<poster>.+?)".+?<\/video>/g, "[CQ:image,cache=0,file=$<poster>]")
                   .replace(/<br>/g, "\n")
    }
}

function aggragation(context) {
    let {group_id, message} = context;
    if (/^订阅.+?(twitter|推特)([>＞](包含转发|包含回复|全部))?$/i.test(message)) {
        let {groups : {user_id, option}} = /订阅(?<user_id>.+?)(?:[Tt]witter|推特)(?:[>＞](?<option>包含转发|包含回复|全部))?$/.exec(message);
        if (option == undefined) option = "仅原创";
        // console.log(user_id)
        subscribe(group_id, user_id, option).then(result => {replyFunc(context, result, true)});
        return true;
    }
    else if (/^取消订阅.+?(twitter|推特)$/i.test(message)) {
        let screen_name = /取消订阅(.+?)(?:[Tt]witter|推特)$/.exec(message)[1]
        unsubscribe(group_id, screen_name).then(result => {replyFunc(context, result, true)});
        return true;
    }
    else if (/查看(twitter|推特)订阅$/i.test(message)) {
        checkTwiSubs(context);
        return true;
    }
    else return false;
}

module.exports = {aggragation, checkTimeline, twiReply};
