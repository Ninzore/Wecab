var axios = require('axios');
var mongodb = require('mongodb').MongoClient;

const db_port = 27017;
const db_path = "mongodb://127.0.0.1:" + db_port;

let replyFunc = (context, msg, at = false) => {};

function bilibiliReply(replyMsg) {
    replyFunc = replyMsg;
}

function httpHeader(uid = 0, dynamic_id = 0, keyword = "") {
    let url = "";
    let headers = {};
    let params = {};
    if (uid != 0) {
        url = "https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history";
        headers = {
            "Host" : "api.vc.bilibili.com",
            "User-Agent" : "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            "accept" : "text/html,application/json"
        };
        params = {
            "host_uid": uid
        };
    }
    else if (dynamic_id != 0){
        url = "https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/get_dynamic_detail";
        headers = {
            "Host" : "api.vc.bilibili.com",
            "User-Agent" : "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            "accept" : "text/html,application/json"
        };
        params = {
            "dynamic_id": dynamic_id
        };
    }
    else if(keyword) {
        method ='GET',
        url = "https://app.bilibili.com/x/v2/search/type";
        headers = {
            "User-Agent": "bili-universal/9150 CFNetwork/1120 Darwin/19.0.0 os/ios model/iPhone 11 mobi_app/iphone osVer/13.2.2 network/2"
        }
        params = {
            "build" : 9150,
            "keyword": keyword,
            "order" : "fans",
            "type" : 2,
        };
    }

    payload = {
        method : "GET",
        url : url,
        headers : headers,
        params : params
    }
    return payload;
}

function searchName(keyword = "") {
    let header = httpHeader(0, 0, keyword);
    return axios(header).then(response => {
            return response.data.data.items[0];
        }).catch(() => console.error(error));
}

//choose 选择需要查找的人
//num 选择需要获取的微博，0为置顶或者最新，1是次新，以此类推，只允许0到9
function getDynamicList(uid, num = 0) {
    let header = httpHeader(uid);
    return axios(header).then(response => {
            // console.log(card)
            return (response.data.data.cards[num])
        })
        .catch(() => console.error(error));
}

function getDynamicDetail(dynamic_id = "") {
    let header = httpHeader(0, dynamic_id, 0);
    return axios(header).then(response => {
            // console.log(JSON.parse(response.data.data.card.card))
            return response.data.data.card;
        }).catch(() => console.error(error));
}

function dynamicProcess(dynamic) {
    let card = JSON.parse(dynamic.card);
    let text = "";
    let name = "";
    let pics = "";
    let video = "";
    let rt_dynamic = 0;

    if ("user" in card){
        if ("uname" in card.user) name = card.user.uname;
        else if ("name" in card.user) name = card.user.name;
    }
    else if ("list" in card) name = card.list.name;
    
    //投稿
    if ("videos" in card) {
        name = card.owner.name;
        text = card.dynamic;
        // console.log(card)
        video = "发布视频:\n" + card.title;
    }
    //转发
    if ("origin" in card) {
        let origin = card.origin;
        rt_dynamic = dynamicProcess({card : origin});
    }
    if ("pic" in card) pics += "[CQ:image,cache=0,file=" + card.pic + "]"; 
    if ("item" in card) {
        //小视频
        if ("video_playurl" in card.item) {
            video = card.item.video_playurl;
            text = card.item.description;
        }
        //通常
        else {
            if ("content" in card.item && card.item.content.length > 0) text = card.item.content;
            else if ("description" in card.item && card.item.description.length > 0) text = card.item.description;
            if ("pictures" in card.item) {
                let pictures = card.item.pictures;
                for (let pic of pictures) pics += "[CQ:image,cache=0,file=" + pic.img_src + "]";  
            }
        }
    }
    else if ("title" in card && card.title.length > 0) text = "发布文章" + card.title;
    // console.log(name)
    // console.log(text)
    let dynamicObj = {
        name : name,
        text : text,
        pics : pics,
        video : video,
        rt_dynamic : rt_dynamic
    };
    return dynamicObj;
}


function addBiliSubscribe(context, name = "") {
    var text = "";
    let group_id = context.group_id;
    searchName(name).then(name_card => {
        if (name_card == undefined) sender(context, {}, "你名字写对了吗", true);
        else getDynamicList(name_card.mid, 0).then(dynamic => {
            addData(dynamic.desc)
        });
    });

    function addData(desc = {}) {
        mongodb(db_path, {useUnifiedTopology: true}).connect(async (err, mongo) => {
            if (err) text = "database openning error";
            let coll = mongo.db('bot').collection('bilibili');
            let name = desc.user_profile.info.uname;
            let uid = desc.uid;
            let dynamic_id = desc.dynamic_id_str;
            let timestamp = desc.timestamp;
            let people = await coll.find({uid : uid}).toArray();

            if (people.length == 0) {
                coll.insertOne({uid : uid,
                                name : name,
                                dynamic_id : dynamic_id,
                                timestamp : timestamp,
                                groups : [group_id]},
                    (err) => {
                        if (err) text = "database subscribes update error";
                        else text = "已订阅" + name + "的B站动态";
                        sender(context, {}, text, true);
                    });
            }
            else {
                coll.findOneAndUpdate({uid : uid},
                                      {$addToSet : {groups : group_id}},
                    (err, result) => {
                        if (err) text = "database subscribes update error";
                        else {
                            // console.log(result)
                            if (result.value.groups.includes(group_id)) text = "多次订阅有害我的身心健康";
                            else text = "已订阅" + result.value.name + "的B站动态";
                         }
                         sender(context, {}, text, true);
                     });
            }
            mongo.close();
        });
    }
}

function rmBiliSubscribe(context, name = "") {
    let group_id = context.group_id;
    var text = "";
    searchName(name).then(name_card => {
        if (name_card == undefined) sender(context, {}, "你名字写对了吗", true);
        else getDynamicList(name_card.mid, 0).then(dynamic => {
            rmData(dynamic.desc)
        });
    });
    function rmData(desc) {
        let uid = desc.uid;
        let name = desc.user_profile.info.uname;
        mongodb(db_path, {useUnifiedTopology: true}).connect((err, mongo) => {
            if (err) text = "database openning error";
            else {
                let coll = mongo.db('bot').collection('bilibili');
                coll.findOneAndUpdate({uid : uid},
                                      {$pull : {groups : {$in : [group_id]}}},
                    (err, result) => {
                        if (err) {
                            text = "database subscribes delete error";
                            console.error(err);
                        }
                        else {
                            if (!result.value.groups.includes(group_id)) text = "小火汁你压根就没订阅嗷";
                            else text = "已取消订阅" + name + "的B站动态";
                        }
                    sender(context, {}, text, true);
                    mongo.close();
                });
            }
        });
    }
}

function checkBiliDynamic() {
    setInterval(() => {
        mongodb(db_path, {useUnifiedTopology: true}).connect(async function(err, mongo) {
            if (err) console.error("bilibili error update");
            else {
                let coll = mongo.db('bot').collection('bilibili');
                let subscribes = await coll.find({}).toArray();
                mongo.close();
                for (let i = 0; i < subscribes.length; i++) {
                    let id = subscribes[i]._id;
                    if (subscribes[i].groups.length > 0) {
                        getDynamicList(subscribes[i].uid, 0).then(dynamic => {
                            let last_timestamp = subscribes[i].timestamp;
                            let curr_timestamp = dynamic.desc.timestamp;
                            if (!"desc" in dynamic) console.log(dynamic);
                            if (curr_timestamp > last_timestamp) {
                                update(subscribes[i], dynamic)
                            }
                        });
                    }
                    else {
                        deleteEmpty(id);
                    }
                }
            }
        });
    }, 5 * 60000);

    function update(subscribe, dynamic) {
        mongodb(db_path, {useUnifiedTopology: true}).connect(async function(err, mongo) {
            if (err) console.error("bilibili error update");
            else {
                let coll = mongo.db('bot').collection('bilibili');
                let clean_dynamic = dynamicProcess(dynamic);
                let dynamic_id = dynamic.desc.dynamic_id_str;
                let curr_timestamp = dynamic.desc.timestamp;
                let groups = subscribe.groups;
                groups.forEach(group_id => {
                    sender({group_id:group_id, message_type : "group"}, clean_dynamic, "");
                });
                await coll.updateOne({uid : subscribe.uid},
                            {$set : {timestamp : curr_timestamp, dynamic_id : dynamic_id}}, 
                    (err, result) => {
                        // if (err) console.log("database update error when checking bilibili");
                        if (err) console.error(err);
                        // else console.log(result);
                        mongo.close();
                    });
            }
        });
    }

    function deleteEmpty(id) {
        mongodb(db_path, {useUnifiedTopology: true}).connect(async function(err, mongo) {
            if (err) console.error("Bilibili error delete empty");
            else {
                let coll = mongo.db('bot').collection('bilibili');
                await coll.findOneAndDelete({_id : id}, (err, result) => {
                    if (err) console.error("database delete error when checking bilibili");
                    // else console.log("delete bilibili subsctibe:" + result.value.name);
                    mongo.close();
                });
            }
        });
    }
}

function checkBiliSubs(context) {
    let group_id = context.group_id;
    var text = "";
    mongodb(db_path, {useUnifiedTopology: true}).connect((err, mongo) => {
        if (err) console.error("database openning error during checkBiliSubs");
        else {
            let coll = mongo.db('bot').collection('bilibili');
            coll.find({groups : {$elemMatch : {$eq : group_id}}}, {projection: {_id : 0, name : 1}})
                .toArray().then(result => {
                    // console.log(result);
                    if (result.length > 0) {
                        let name_list = [];
                        result.forEach(name_obj => {
                            name_list.push(name_obj.name);
                        });
                        text = "本群已订阅: " + name_list.join(", ");
                    }
                    else text = "你一无所有";
                    sender(context, {}, text, true);
                    mongo.close();
                });
        }
    });
}

function sender(context, dynamicObj = {}, others = "", at = false) {
    let payload = "";
    if (Object.keys(dynamicObj).length != 0) {
        payload = dynamicObj.name + "\n" + dynamicObj.text + "\n"  + dynamicObj.video + dynamicObj.pics;
        if (dynamicObj.rt_dynamic != 0) {
            let rt_dynamic = dynamicObj.rt_dynamic
            payload += `\n转发自${rt_dynamic.name}的B站动态${rt_dynamic.text}\n${rt_dynamic.video}\n${rt_dynamic.pics}`;
        }
        replyFunc(context, payload, at);
    }
    else {
        replyFunc(context, others, at);
    }
}

function rtBilibili(context, name = "", num = 0, dynamic_id = "") {
    if (dynamic_id != "") {
        getDynamicDetail(dynamic_id).then(dynamic => {
            if (dynamic == undefined) sender(context, 0, "你码输错了", true);
            else {
                let clean_dynamic = dynamicProcess(dynamic);
                sender(context, clean_dynamic, "");
            }
        });
    }
 
    else if (name != "") {
        searchName(name).then(name_card => {
            if (name_card == undefined) sender(context, 0, "没这人", true);
            else getDynamicList(name_card.mid, num).then(dynamic => {
                let clean_dynamic = dynamicProcess(dynamic);
                sender(context, clean_dynamic);
            });
        });
    }
    else {
        console.error("error rtBilibili");
    }
}

function rtBiliByUrl(context){
    let dynamic_id = /https:\/\/t.bilibili.com\/(\d+)/.exec(context.message)[1];
    rtBilibili(context, "", 0, dynamic_id);
}

function bilibiliCheck (context) {
    if (/^看看.+?B站$/i.test(context.message)) {	
		var num = 1;
        var name = "";
        if (/置顶/.test(context.message)) (num = -1);
        else if (/最新/.test(context.message)) (num = 0);
        else if (/上上上条/.test(context.message)) (num = 3);
        else if (/上上条/.test(context.message)) (num = 2);
        else if (/上条/.test(context.message)) (num = 1);
	    else if (/第.+?条/.test(context.message)) {
            let temp = /第([0-9]?[一二三四五六七八九]?)条/.exec(context.message)[1];
            if (temp==0 || temp=="零") (num = -1);
            else if (temp==1 || temp=="一") (num = 0);
            else if (temp==2 || temp=="二") (num = 1);
            else if (temp==3 || temp=="三") (num = 2);
            else if (temp==4 || temp=="四") (num = 3);
            else if (temp==5 || temp=="五") (num = 4);
            else if (temp==6 || temp=="六") (num = 5);
            else if (temp==7 || temp=="七") (num = 6);
            else if (temp==8 || temp=="八") (num = 7);
            else if (temp==9 || temp=="九") (num = 8);
        }
        else (num = 0);       
        name = /看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(置顶)|(最新))?B站/i.exec(context.message)[1];
        rtBilibili(context, name, num);
        return true;
	}
    else if (/^看看B站https:\/\/t.bilibili.com\/(\d+).+?/i.test(context.message)) {
        rtBiliByUrl(context);
        return true;
    }
    else if (/^订阅.+?B站$/i.test(context.message)) {
        let name = /订阅(.+?)B站$/i.exec(context.message)[1];
        console.log(`${context.group_id} ${name} 添加B站订阅`);
        addBiliSubscribe(context, name);
        return true;
    }
    else if (/^取消订阅.+?B站$/i.test(context.message)) {
        let name = /取消订阅(.+?)B站$/i.exec(context.message)[1];
        console.log(`${context.group_id} ${name} B站订阅取消`);
        rmBiliSubscribe(context, name);
        return true;
    }
    else if (/^查看(订阅B站|B站订阅)$/i.test(context.message)) {
        checkBiliSubs(context);
        return true;
    }
    else return false;
}

module.exports = {bilibiliCheck, checkBiliDynamic, bilibiliReply};
