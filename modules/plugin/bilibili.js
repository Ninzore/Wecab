const logger2 = require('../logger2'); //日志功能
const node_localStorage = require('node-localstorage');
const node_localStorage2 = node_localStorage.LocalStorage;
const wecab = new node_localStorage2('./wecab'); //插件是否连上机器人
var axios = require('axios');
var mongodb = require('mongodb').MongoClient;
const db_port = 27017;
const db_path = "mongodb://127.0.0.1:" + db_port;

const option_map = {
    "仅原创": "origin",
    "仅转发": "rt_only",
    "只看图": "pic_only",
    "视频更新": "video_only",
    "全部": "all"
}

/** 用value找key*/
function findKey(obj, value) {
    for (key in obj) {
        if (obj[key] === value) return key;
    }
}

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
            "Host": "api.vc.bilibili.com",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            "accept": "text/html,application/json"
        };
        params = {
            "host_uid": uid
        };
    } else if (dynamic_id != 0) {
        url = "https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/get_dynamic_detail";
        headers = {
            "Host": "api.vc.bilibili.com",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            "accept": "text/html,application/json"
        };
        params = {
            "dynamic_id": dynamic_id
        };
    } else if (keyword) {
        method = 'GET',
            url = "https://app.bilibili.com/x/v2/search/type";
        headers = {
            "User-Agent": "bili-universal/9150 CFNetwork/1120 Darwin/19.0.0 os/ios model/iPhone 11 mobi_app/iphone osVer/13.2.2 network/2"
        }
        params = {
            "build": 9150,
            "keyword": keyword,
            "order": "fans",
            "type": 2,
        };
    }

    payload = {
        method: "GET",
        url: url,
        headers: headers,
        params: params
    }
    return payload;
}

function searchName(keyword = "") {
    let header = httpHeader(0, 0, keyword);
    return axios(header).then(response => {
        return response.data.data.items[0];
    }).catch(err => {
        logger2.error(new Date().toString() + ",bili:" + err);
        return false;
    });
}

//choose 选择需要查找的人
//num 选择需要获取的b站动态，0为置顶或者最新，1是次新，以此类推，只允许0到9
function getDynamicList(uid, num = 0) {
    let header = httpHeader(uid);
    return axios(header).then(response => {
        //logger2.info(JSON.stringify(response.data.data.cards));
        //logger2.info(JSON.stringify(response.data.data.cards[-1]));
        return (response.data.data.cards[num])
    }).catch(err => logger2.error(new Date().toString() + ",bili1:" + err));
}

function getDynamicDetail(dynamic_id = "") {
    let header = httpHeader(0, dynamic_id, 0);
    return axios(header).then(response => {
        // logger2.info(JSON.parse(response.data.data.card.card))
        return response.data.data.card;
    }).catch(err => logger2.error(new Date().toString() + ",bili2:" + err));
}

function dynamicProcess(dynamic, origin = false) {
    let card = JSON.parse(dynamic.card);
    let text = "";
    let name = "";
    let pics = "";
    let video = "";
    let rt_dynamic = 0;
    let url = "";
    if (origin == false) {
        //logger2.info(dynamic.desc.dynamic_id_str);
        url = "https://t.bilibili.com/" + dynamic.desc.dynamic_id_str.replace(/"/g, "");
    }
    if ("user" in card) {
        if ("uname" in card.user) name = card.user.uname;
        else if ("name" in card.user) name = card.user.name;
    } else if ("author" in card) name = card.author.name;


    //投稿
    if ("videos" in card) {
        name = card.owner.name;
        text = card.dynamic;
        video = "发布视频:\n" + card.title + "\n" + card.desc + "\nhttps://www.bilibili.com/video/" + dynamic.desc.bvid;
    }
    //转发
    if ("origin" in card) {
        let origin = card.origin;
        rt_dynamic = dynamicProcess({
            card: origin
        }, true);
    }
    if ("pic" in card) pics += "[CQ:image,cache=0,file=" + card.pic + "]";
    if ("item" in card) {
        //小视频
        if ("video_playurl" in card.item) {
            video = card.item.video_playurl;
            text = "小视频\n" + card.item.description;
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
    } else if ("summary" in card) {
        text = "发布文章" + card.title + "\n" + card.summary + "\nhttps://www.bilibili.com/read/cv" + dynamic.desc.rid_str;
        pics += "[CQ:image,cache=0,file=" + card.origin_image_urls[0] + "]";
    }
    //解析CV号专栏
    // logger2.info(name)
    // logger2.info(text)
    let dynamicObj = {
        name: name,
        text: text,
        pics: pics,
        video: video,
        rt_dynamic: rt_dynamic,
        url: url
    };
    return dynamicObj;
}


function addBiliSubscribe(context, name = "", option_nl) {
    var text = "";
    let group_id = context.group_id;
    let option = option_map[option_nl];
    searchName(name).then(name_card => {
        if (name_card == undefined || name_card == false) replyFunc(context, "名字未写正确", true);
        else getDynamicList(name_card.mid, 0).then(dynamic => {
            addData(dynamic.desc);
        });
    });

    function addData(desc = {}) {
        mongodb(db_path, {
            useUnifiedTopology: true
        }).connect(async (err, mongo) => {
            if (err) logger2.error(new Date().toString() + ",bili database openning error:" + err);
            let coll = mongo.db('bot').collection('bilibili');
            let name = desc.user_profile.info.uname;
            let uid = desc.uid;
            let dynamic_id = desc.dynamic_id_str;
            let timestamp = desc.timestamp;
            let people = await coll.find({
                uid: uid
            }).toArray();

            if (people.length == 0) {
                coll.insertOne({
                        uid: uid,
                        name: name,
                        dynamic_id: dynamic_id,
                        timestamp: timestamp,
                        [group_id]: option,
                        groups: [group_id]
                    },
                    (err) => {
                        if (err) text = new Date().toString() + ":" + "bilibili addBiliSubscribe database subscribes insert error:" + err;
                        else text = `已订阅${name}的B站动态，模式为${option_nl}`;
                        replyFunc(context, text, true);
                        mongo.close();
                    });
            } else {
                coll.findOneAndUpdate({
                        uid: uid
                    }, {
                        $addToSet: {
                            groups: group_id
                        },
                        $set: {
                            [group_id]: option
                        }
                    },
                    (err, result) => {
                        if (err) logger2.error(new Date().toString() + ",bilibili addBiliSubscribe database subscribes update error:" + err);
                        else {
                            // logger2.info(result)
                            if (result.value.groups.includes(group_id)) text = "重复订阅";
                            else text = `已订阅${result.value.name}的B站动态，模式为${option_nl}`;
                        }
                        replyFunc(context, text, true);
                        mongo.close();
                    });
            }
        });
    }
}

function rmBiliSubscribe(context, name = "") {
    let group_id = context.group_id;
    var text = "";
    searchName(name).then(name_card => {
        if (name_card == undefined || name_card == false) replyFunc(context, "名字未写正确", true);
        else getDynamicList(name_card.mid, 0).then(dynamic => {
            rmData(dynamic.desc)
        });
    });

    function rmData(desc) {
        let uid = desc.uid;
        let name = desc.user_profile.info.uname;
        mongodb(db_path, {
            useUnifiedTopology: true
        }).connect((err, mongo) => {
            if (err) logger2.error(new Date().toString() + ",bili database openning error:" + err);
            else {
                let coll = mongo.db('bot').collection('bilibili');
                coll.findOneAndUpdate({
                        uid: uid
                    }, {
                        $pull: {
                            groups: {
                                $in: [group_id]
                            },
                            $unset: {
                                [group_id]: []
                            }
                        }
                    },
                    async (err, result) => {
                        if (err) logger2.error(new Date().toString() + ",database bilibili unsubscribes error:" + err);
                        else {
                            if (!result.value.groups.includes(group_id)) text = "未订阅";
                            else text = "已取消订阅" + name + "的B站动态";
                            if (result.value.groups.length <= 1) await coll.deleteOne({
                                _id: result.value._id
                            });
                        }
                        replyFunc(context, text, true);
                        mongo.close();
                    });
            }
        });
    }
}

function checkBiliDynamic() {
    //return; //未做测试警告
    let check_interval = 3 * 60 * 1000;//3分钟
    let check_interval2 = 30000; //api调用延时 30秒
    let firish = false;
    let i = 0;
    setInterval(() => {
        if (wecab.getItem("huozhe") == "false") {
            logger2.info(new Date().toString() + ",连不上机器人，跳过订阅blibili");
            return;
        }
        if (firish == true) {
            return;
        }
        firish = true;
        mongodb(db_path, {
            useUnifiedTopology: true
        }).connect(async function (err, mongo) {
            if (err) logger2.error(new Date().toString() + ",bilibili update error:" + err);
            else {
                let coll = mongo.db('bot').collection('bilibili');
                let subscribes = await coll.find({}).toArray();
                //logger2.info("bilisubscribes:" + JSON.stringify(subscribes));
                mongo.close();
                i = 0;
                checkEach();

                function checkEach() {
                    if (subscribes[i] == undefined) {
                        return;
                    }
                    setTimeout(async function () {
                        if (subscribes[i].groups.length > 0) {
                            await getDynamicList(subscribes[i].uid, 0).then(dynamic => {
                                let last_timestamp = subscribes[i].timestamp;
                                let curr_timestamp = dynamic.desc.timestamp;
                                if (curr_timestamp > last_timestamp) {
                                    update(subscribes[i], dynamic);
                                }
                            });
                        }
                        i++;
                        if (i < subscribes.length) checkEach();
                        else firish = false;
                    }, check_interval2);
                }
            }
        });
    }, check_interval);

    function update(subscribe, dynamic) {
        mongodb(db_path, {
            useUnifiedTopology: true
        }).connect(async function (err, mongo) {
            if (err) logger2.error(new Date().toString() + ",bilibili error update");
            else {
                let coll = mongo.db('bot').collection('bilibili');
                let dynamic_id = dynamic.desc.dynamic_id_str;
                let clean_dynamic = dynamicProcess(dynamic);
                let curr_timestamp = dynamic.desc.timestamp;
                let groups = subscribe.groups;
                groups.forEach(group_id => {
                    if (checkOption(JSON.parse(dynamic.card)), subscribe[group_id]) {
                        sender({
                            group_id: group_id,
                            message_type: "group"
                        }, clean_dynamic);
                    } else;
                });
                await coll.updateOne({
                        uid: subscribe.uid
                    }, {
                        $set: {
                            timestamp: curr_timestamp,
                            dynamic_id: dynamic_id
                        }
                    },
                    (err, result) => {
                        if (err) logger2.error(new Date().toString() + ",database update error when checking bilibili dynamic updates:" + err);
                        mongo.close();
                    });
            }
        });
    }

    function checkOption(card, option) {
        if (option == "all") return true;
        let status = "";
        if ("origin" in card) status = "retweet";
        else if ("videos" in card) status = "pub_video";
        else if ("item" in card && "pictures" in card.item) status = "ori_with_pic"
        else status = "origin"

        if (option == "rt_only" && status == "retweet") return true;
        else if (option == "pic_only" && status == "ori_with_pic") return true;
        else if (option == "video_only" && status == "pub_video") return true;
        else if (option == "origin") {
            if (status == "ori_with_pic" || status == "pub_video" || status == "origin") return true;
        } else return false;
    }
}

function checkBiliSubs(context) {
    let group_id = context.group_id;
    var text = "";
    mongodb(db_path, {
        useUnifiedTopology: true
    }).connect((err, mongo) => {
        if (err) logger2.error(new Date().toString() + ",bili database openning error during checkBiliSubs");
        else {
            let coll = mongo.db('bot').collection('bilibili');
            coll.find({
                    groups: {
                        $elemMatch: {
                            $eq: group_id
                        }
                    }
                }, {
                    projection: {
                        _id: 0
                    }
                })
                .toArray().then(result => {
                    // logger2.info(result);
                    if (result.length > 0) {
                        let name_list = [];
                        let option_nl = "仅原创";
                        result.forEach(sub_obj => {
                            option_nl = findKey(option_map, sub_obj[group_id]);
                            name_list.push(`${sub_obj.name}，模式为${option_nl}`);
                        });
                        text = "本群已订阅: " + name_list.join("\n");
                    } else text = "未见任何B站订阅";
                    replyFunc(context, text);
                    mongo.close();
                });
        }
    });
}

/**
 * @param {object} context
 * @returns {} no return
 */
function clearSubs(context, group_id) {
    mongodb(db_path, {
        useUnifiedTopology: true
    }).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('bilibili');
        try {
            let matchs = await coll.find({
                groups: {
                    $in: [group_id]
                }
            }).toArray();
            if (matchs.length < 1) {
                replyFunc(context, `未见任何B站订阅`);
                return;
            }
            for (let item of matchs) {
                let res = await coll.findOneAndUpdate({
                    _id: item._id
                }, {
                    $pull: {
                        groups: {
                            $in: [group_id]
                        }
                    },
                    $unset: {
                        [group_id]: []
                    }
                }, {
                    returnOriginal: false
                });
                if (res.value.groups.length < 1) await coll.deleteOne({
                    _id: res.value._id
                });
            }
            replyFunc(context, `清理了${matchs.length}个B站订阅`);
        } catch (err) {
            logger2.error(new Date().toString() + ",bili清理:" + err);
            replyFunc(context, '中途错误，清理未完成');
        } finally {
            mongo.close();
        }
    }).catch(err => logger2.error(new Date().toString() + ":" + err + ",bili checkWeiboSubs error, group_id= " + group_id));
}

function sender(context, dynamicObj = {}, at = false) {
    let payload = [];
    if (Object.keys(dynamicObj).length != 0) {
        for (let item in dynamicObj) {
            if (item === "name") payload.push(dynamicObj[item] + "的B站动态");
            else if (item === "rt_dynamic" && dynamicObj[item] != 0) {
                let rt_payload = [];
                for (let item in dynamicObj.rt_dynamic) {
                    if (item === "name") rt_payload.push(["转发自", dynamicObj.rt_dynamic[item], "的B站动态"].join(""));
                    else if (dynamicObj.rt_dynamic[item] != 0) rt_payload.push(dynamicObj.rt_dynamic[item]);
                }
                payload.push(rt_payload.join("\n"));
            } else if (dynamicObj[item] != 0) payload.push(dynamicObj[item]);
        }
        replyFunc(context, payload.join("\n"), at);
    }
}

function rtBilibili(context, name = "", num = 0, dynamic_id = "") {
    if (dynamic_id != "") {
        getDynamicDetail(dynamic_id).then(dynamic => {
            if (dynamic == undefined) sender(context, "输错了");
            else {
                let clean_dynamic = dynamicProcess(dynamic);
                sender(context, clean_dynamic);
            }
        });
    } else if (name != "") {
        searchName(name).then(name_card => {
            //console.log(name_card);
            if (name_card == undefined || name_card == false) {
                replyFunc(context, "未发现该用户或者输入0-9之外的数字", true);
            } else {
                //console.log(name_card.mid);
                getDynamicList(name_card.mid, num).then(dynamic => {
                    //console.log(dynamic);
                    let clean_dynamic = dynamicProcess(dynamic);
                    sender(context, clean_dynamic);
                });
            }
        });
    } else {
        logger2.error(new Date().toString() + ",error rtBilibili");
    }
}

function rtBiliByUrl(context) {
    //看看https://t.bilibili.com/h5/dynamic/detail/436188125440999377
    let dynamic_id = /\.com\/(\d+)|dynamic\/detail\/(\d+)/.exec(context.message).filter((noEmpty) => {
        return noEmpty != undefined
    })[1];
    //let dynamic_id = /https:\/\/t.bilibili.com\/(\d+)/.exec(context.message) || /https:\/\/t.bilibili.com\/h5\/dynamic\/detail\/(\d+)/.exec(context.message);
    if (dynamic_id != null) {
        rtBilibili(context, "", 0, dynamic_id);
        //rtBilibili(context, "", 0, dynamic_id[1]);
    } else {
        logger2.error(new Date().toString() + ",error rtBiliByUrl:" + context.message);
    }
}

function rtBiliByB23(context) {
    let url = /https:\/\/b23\.tv\/[0-9a-zA-Z]{6}/.exec(context.message)[0];
    axios.head(url, {
        headers: {
            "Accept": "application/json",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36",
            "Host": "b23.tv"
        }
    }).then(res => {
        switchPath(res);
    }).catch(res => {
        // when using head method there may be a Z_BUF_ERROR, code -5
        if (err.errno === -5) switchPath(err);
        else {
            logger2.error(new Date().toString() + ",bili3:" + res.errno + "," + res.code);
            replyFunc(context, "rtBiliByB23出错啦");
        }
    });

    function switchPath(res) {
        path = res.request.path;
        if (/^\/video/.test(path)) {
            let bv = path.substring(0, path.indexOf("?"));
            replyFunc(context, ["https://bilibili.com", bv].join(""));
        } else {
            let dynamic_id = /\d{18}/.exec(path)[0];
            rtBilibili(context, "", 0, dynamic_id);
        }
    }
}

function bilibiliCheck(context) {
    if (/^看看.+?B站$/i.test(context.message)) {
        var num = 1;
        var name = "";
        if (/置顶/.test(context.message))(num = 0); //-1
        else if (/最新/.test(context.message))(num = 0);
        else if (/上上上条/.test(context.message))(num = 3);
        else if (/上上条/.test(context.message))(num = 2);
        else if (/上一?条/.test(context.message))(num = 1);
        else if (/第.+?条/.test(context.message)) {
            let temp = /第([0-9]?[一二三四五六七八九]?)条/.exec(context.message);
            if (temp != null) {
                temp = temp[1];
            } else {
                temp = 0;
            }
            if (temp == 0 || temp == "零")(num = 0);
            else if (temp == 1 || temp == "一")(num = 0);
            else if (temp == 2 || temp == "二")(num = 1);
            else if (temp == 3 || temp == "三")(num = 2);
            else if (temp == 4 || temp == "四")(num = 3);
            else if (temp == 5 || temp == "五")(num = 4);
            else if (temp == 6 || temp == "六")(num = 5);
            else if (temp == 7 || temp == "七")(num = 6);
            else if (temp == 8 || temp == "八")(num = 7);
            else if (temp == 9 || temp == "九")(num = 8);
        } else(num = 0);
        //正则表达式无法处理看看星街彗星第11条B站，会分离出星街彗星第11作为名字
        name = /看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上{1,3}一?条)|(置顶)|(最新))?B站/i.exec(context.message)[1]; //logger2.info(/看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(置顶)|(最新))?B站/i.exec(context.message));
        //logger2.info(num);
        logger2.info("看看b站1");
        rtBilibili(context, name, num);
        return true;
    } else if (/^看看https:\/\/t.bilibili.com\/(\d+).+?/i.test(context.message) || /^看看https:\/\/t.bilibili.com\/h5\/dynamic\/detail\/(\d+).+?/i.test(context.message)) {
        logger2.info("看看b站2");
        rtBiliByUrl(context);
        return true;
    } else if (/^看看https:\/\/b23\.tv\/[0-9a-zA-Z]{6}$/i.test(context.message)) {
        logger2.info("看看b站3");
        rtBiliByB23(context);
        return true;
    } else if (/^订阅.+?B站([>＞](仅转发|只看图|全部|视频更新))?/i.test(context.message)) {
        let {
            groups: {
                name,
                option_nl
            }
        } = /订阅(?<name>.+?)B站([>＞](?<option_nl>仅转发|只看图|视频更新|全部))?/i.exec(context.message);
        logger2.info(`${context.group_id} ${name} 添加B站订阅`);
        if (option_nl == undefined) option_nl = "仅原创"
        addBiliSubscribe(context, name, option_nl);
        return true;
    } else if (/^取消订阅.+?B站$/i.test(context.message)) {
        let name = /取消订阅(.+?)B站$/i.exec(context.message)[1];
        logger2.info(`${context.group_id} ${name} B站订阅取消`);
        rmBiliSubscribe(context, name);
        return true;
    } else if (/^查看(订阅B站|B站订阅)$/i.test(context.message)) {
        checkBiliSubs(context);
        return true;
    } else if (/^清空B站订阅$/.test(context.message)) {
        if (/owner|admin/.test(context.sender.role)) clearSubs(context, context.group_id);
        else replyFunc(context, '无权限');
        return true;
    } else return false;
}

module.exports = {
    bilibiliCheck,
    checkBiliDynamic,
    bilibiliReply,
    clearSubs
};