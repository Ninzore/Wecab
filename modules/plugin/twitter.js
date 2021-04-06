const Downloadx = require('../../utils/Downloadx'); //输入url，返回文件路径
const ClearDownloadx = require('../../utils/ClearDownloadx');//删除临时文件
const Axios = require('axios');
const mongodb = require('mongodb').MongoClient;
const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec);
const HttpsProxyAgent = require("https-proxy-agent");
const fs = require('fs-extra');

const CONFIG = global.config.twitter;
const PROXY = global.config.proxy;
const DB_PATH = global.config.mongoDB;
const PERMISSION = CONFIG.permission;
const BEARER_TOKEN = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
const PIC_MAX_SIZE = 30 * 1024 * 1024; //图片最大体积
const VID_MAX_SIZE = 100 * 1024 * 1024; //视频最大体积
//const MAX_SIZE = 4194304;
const OPTION_MAP = {
    "仅原创": "origin_only",
    "仅转发": "retweet_only",
    "包含转发": "include_retweet",
    "不要转发": "no_retweet",
    "包含回复": "include_reply",
    "不要回复": "no_reply",
    "只看图": "pic_only",
    "全部": "all",
    "提醒": "notice"
}
const POSTTYPE_MAP = {
    "origin_only": [1, 0, 0, 1],
    "retweet_only": [0, 1, 0, 0],
    "include_retweet": [1, 1, 0, 1],
    "no_retweet": [1, 0, 1, 1],
    "include_reply": [1, 0, 1, 1],
    "no_reply": [1, 1, 0, 1],
    "pic_only": [0, 0, 0, 1],
    "all": [1, 1, 1, 1]
}

let axios = false;
let guest_token = "";
let cookie = "";
let connection = true;
let replyFunc = (context, msg, at = false) => { };
let cleardownload = false;
function twitterReply(replyMsg) {
    replyFunc = replyMsg;
}

/** 检查网络情况，如果连不上Twitter那后面都不用做了*/
async function checkConnection() {
    return axios.get("https://twitter.com", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        }
    }).then(res => {
        if (res.status == 200) {
            connection = true;
            console.log("Twitter successfully connected");
        }
        return true;
    }).catch(err => {
        console.error("Twitter checkConnection error with ",
            err.response ? [err.response.status, err.response.statusText].join(" ")
                : [err.errno, err.code].join(" "));
        return false;
    });
}

function setAgent() {
    if (PROXY.startsWith("http")) {
        axios = Axios.create({
            proxy: false,
            httpsAgent: new HttpsProxyAgent(PROXY)
        });
    }
    else axios = Axios;
}


function opt_dict(post_option) {
    let [origin, retweet, reply, pic, cook] = POSTTYPE_MAP[post_option];
    return {
        "origin": origin,
        "retweet": retweet,
        "reply": reply,
        "pic": pic
    }
}

/** option转文本*/
function toOptNl(option) {
    let { post } = option;
    let opt_string = "";
    for (key in OPTION_MAP) {
        if (OPTION_MAP[key] == post) opt_string = key;
    }
    if (option.bbq == true) opt_string += "; 需要烤架";
    if (option.notice != undefined) opt_string += "; 更新时提醒:" + option.notice;
    return opt_string;
}

function firstConnect() {
    checkConnection().then(res => {
        if (!res) {
            console.error("Twitter无法连接，功能暂停");
        }
        else {
            getGuestToken();
            setTimeout(() => getCookie(), 1000);

            let refresh = setInterval(() => {
                cookie = "";
                guest_token = "";
                getGuestToken();
                setTimeout(getCookie, 1000);
            }, 1 * 60 * 60 * 1000);
        }
    }).catch(err => {
        console.error("Twitter无法连接，功能暂停");
    });
}

/** 通过链接判断文件大小*/
function sizeCheck(url, pic = true) { //true 图片 false 视频
    return axios({
        method: "head",
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
        },
        timeout: 15000
    }).then(res => {
        //console.log(JSON.stringify(res.headers));
        if (pic == true) {
            return parseInt(res.headers["content-length"]) < PIC_MAX_SIZE ? true : ((res.headers["content-length"] / 1024 / 1024) + "MB"); //图片
        } else {
            return parseInt(res.headers["content-length"]) < VID_MAX_SIZE ? true : ((res.headers["content-length"] / 1024 / 1024) + "MB"); //视频
        }
    }).catch(err => {
        console.error(new Date().toString() + ",sizeCheck:" + url + "," + err);
        return "获取文件大小失败";
    });
}

function httpHeader() {
    return headers = {
        "origin": "https://twitter.com",
        "authorization": BEARER_TOKEN,
        "cookie": cookie,
        "x-guest-token": guest_token,
        "x-twitter-active-user": "yes",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-site": "same-site",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
        "accept": "application/json, text/plain, */*",
        "dnt": "1",
        // "accept-encoding" : "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6",
        "x-twitter-client-language": "zh-cn"
    }
}

/** 获取一个Guest Token*/
function getGuestToken() {
    if (!connection) return;
    let headers = httpHeader();
    delete headers.cookie;
    delete headers.guest_token;
    headers["Host"] = "api.twitter.com";
    axios({
        method: "POST",
        url: "https://api.twitter.com/1.1/guest/activate.json",
        headers: headers,
        timeout: 10000
    }).then(res => {
        guest_token = res.data.guest_token;
    }).catch(err => {
        console.error("Twitter getGuestToken error with ",
            err.response ? [err.response.status, err.response.statusText].join(" ")
                : [err.errno, err.code].join(" "));
    });
}

/** 获取一个cookie，后面要用*/
function getCookie() {
    if (!connection) return;
    let headers = httpHeader();
    delete headers.cookie;
    delete headers.authorization;
    axios({
        method: "GET",
        url: "https://twitter.com/explore",
        headers: headers,
        timeout: 10000
    }).then(res => {
        let temp = "";
        let guest_id = "";  //expire 2 years
        let personalization_id = "";  //expire 2 years
        let ct0 = "";  //expire 1 day
        let twitter_sess = "";  //not necessary
        for (let i = 0; i < res.headers["set-cookie"].length; i++) {
            if (temp = /guest_id=.+?; /.exec(res.headers["set-cookie"][i])) guest_id = temp[0];
            else if (temp = /ct0=.+?; /.exec(res.headers["set-cookie"][i])) ct0 = temp[0];
            else if (temp = /personalization_id=.+?; /.exec(res.headers["set-cookie"][i])) personalization_id = temp[0];
            else if (temp = /(_twitter_sess=.+?);/.exec(res.headers["set-cookie"][i])) twitter_sess = temp[1];
        }
        cookie = `dnt=1; fm=0; csrf_same_site_set=1; csrf_same_site=1; gt=${guest_token}; ${ct0}${guest_id}${personalization_id}${twitter_sess}`;
    }).catch(err => {
        console.error('Twitter getCookie error ',
            err.response ? [err.response.status, err.response.statusText].join(" ")
                : [err.errno, err.code].join(" "));
    });
}

/** 
 * 获取单条Twitter参考  
 * developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-statuses-lookup
 * @param {string} tweet_id_str 单条Tweet id
 * @returns {Promise} Tweet Object，如果错误，结果为false
 */
async function getSingleTweet(tweet_id_str) {
    return axios({
        method: 'GET',
        url: "https://api.twitter.com/1.1/statuses/show.json",
        headers: {
            "authorization": BEARER_TOKEN,
        },
        params: {
            "id": tweet_id_str,
            "include_entities": "true",
            "include_ext_alt_text": "true",
            "include_card_uri": "true",
            "tweet_mode": "extended",
            "include_ext_media_color": "true",
            "include_ext_media_availability": "true",
            "include_cards": "1",
            "cards_platform": "Web-12",

        },
        timeout: 30000
    }).then(res => {
        return res.data;
    }).catch(err => {
        console.error('Twitter getSingleTweet error with ',
            err.response ? [err.response.status, err.response.statusText].join(" ")
                : [err.errno, err.code].join(" "));
        return false;
    });
}

/** 
 * 获取用户时间线，参考  
 * developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-user_timeline
 * @param {string} user_id 单条Tweet id
 * @param {number} count 获取数量，最大为200
 * @returns {Promise} 用户时间线，如果错误结果为false
 */
async function getUserTimeline(user_id, count = 20, include_rt = 0, include_rp = 0) {
    return axios({
        method: 'GET',
        url: `https://twitter.com/i/api/2/timeline/profile/${user_id}.json`,
        headers: httpHeader(),
        params: {
            // screen_name : screen_name,
            "userId": user_id,
            "count": count,
            "include_tweet_replies": include_rp,
            "include_want_retweets": include_rt,
            "tweet_mode": "extended",
            "include_cards": "1",
            "cards_platform": "Web-12",
            "include_ext_alt_text": "true",
            "include_ext_media_color": "true",
            "include_ext_media_availability": "true",
            "include_entities": "true",
            "include_ext_alt_text": "true",
            "include_card_uri": "true"
        },
        timeout: 30000
    }).then(res => {
        let tweets = [];
        let user = res.data.globalObjects.users[user_id];
        for (let tweetid of Object.keys(res.data.globalObjects.tweets)) {
            let tweet = res.data.globalObjects.tweets[tweetid];
            tweet.user = { name: user.name, screen_name: user.screen_name };

            tweets.push(tweet);
        }

        tweets = tweets.sort((a, b) => { return (a.id_str > b.id_str) ? -1 : 1; });
        return tweets;
    }).catch(err => {
        console.error('Twitter getUserTimeline error with ',
            err.response ? [err.response.status, err.response.statusText].join(" ")
                : [err.errno, err.code].join(" "));
        return false;
    });
}

/** 
 * 使用name搜索用户，参考  
 * developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-users-search  
 * 关于user object，参考  
 * developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object
 * @param {string} name 用户名称
 * @returns {Promise} user_object，如果没有或者错误会返回false
 */
async function searchUser(name) {
    let header = httpHeader();
    header["x-guest-token"] = guest_token;
    return axios({
        method: "GET",
        url: "https://api.twitter.com/1.1/users/search.json",
        headers: header,
        params: {
            "q": name,
            "count": 1,
        },
        timeout: 30000
    }).then(res => {
        return res.data[0]
    }).catch(err => {
        console.error('Twitter searchUser error with ',
            err.response ? [err.response.status, err.response.statusText].join(" ")
                : [err.errno, err.code].join(" "));
        return false;
    })
}

/**
 * 增加订阅
 * @param {number} user Twitter用户 user_object
 * @param {string} option 偏好设置
 * @param {object} context
 */
function subscribe(user, option, context) {
    let uid = user.id_str;
    let group_id = context.group_id;
    let name = user.name;
    let username = user.screen_name;
    let tweet_id = user.status.id_str;
    let option_nl = toOptNl(option);

    mongodb(DB_PATH, { useUnifiedTopology: true }).connect().then(async mongo => {
        try {
            let twitter_db = mongo.db('bot').collection('twitter');
            let group_option = mongo.db('bot').collection('group_option');
            let twitter_local = await twitter_db.findOne({ uid: uid });

            if (twitter_local == null) {
                await twitter_db.insertOne({
                    uid: uid, name: name,
                    username: username, tweet_id: tweet_id, groups: [group_id]
                });
            }
            else {
                await twitter_db.updateOne({ _id: twitter_local._id }, { $addToSet: { groups: group_id } });
            }
            await group_option.updateOne({ group_id: context.group_id },
                { $set: { [`twitter.${uid}`]: option } }, { upsert: true });

            if (option.bbq === true) {
                const twe_sum = mongo.db('bot').collection('twe_sum');
                await twe_sum.updateOne({ group_id: context.group_id },
                    {
                        $setOnInsert: {
                            count: 0, count_done: 0, list: [],
                            today_all: [], today_raw: [], today_done: []
                        }
                    },
                    { upsert: true });
            }
            replyFunc(context, `已订阅${name}的Twitter，模式为${option_nl}`, true);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            mongo.close();
        }
    }).catch(err => console.error(err + "\nTwitter subscribe error, username= " + username));
}

/**
 * 取消订阅
 * @param {string} name Twitter用户名
 * @param {object} context
 */
function unSubscribe(name, context) {
    const group_id = context.group_id;
    let name_reg = new RegExp(name, 'i');

    mongodb(DB_PATH, { useUnifiedTopology: true }).connect().then(async mongo => {
        const twitter_db = mongo.db('bot').collection('twitter');
        twitter_db.findOneAndUpdate({ name: name_reg }, { $pull: { groups: { $in: [group_id] } } },
            async (err, result) => {
                if (err) console.error(err + "twitter unSubscribes delete error");
                else {
                    let text = "";
                    if (result.value == null || !result.value.groups.includes(group_id)) {
                        console.error(result.value, group_id);
                        replyFunc(context, "小火汁你压根就没订阅嗷", true);
                        mongo.close();
                        return;
                    }
                    else {
                        let uid = result.value.uid;
                        let screen_name = result.value.name;
                        if (result.value.groups.length <= 1) await twitter_db.deleteOne({ _id: result.value._id });

                        const group_option = mongo.db('bot').collection('group_option');
                        group_option.findOneAndUpdate({ group_id: context.group_id }, { $unset: { [`twitter.${uid}`]: "" } },
                            (err, result) => {
                                if (err) console.error(err + "\ngroup_option unset error");
                                else {
                                    text = "已取消订阅" + screen_name + "的Twitter";
                                    replyFunc(context, text, true);
                                }
                                mongo.close();
                            });
                    }
                    replyFunc(context, text, true);
                }
            });
    }).catch(err => console.error(err + "Twitter unsubscribe error, uid= " + uid));
}

/**
 * 每过x分钟检查一次订阅列表，如果订阅一个Twitter账号的群的数量是0就删除
 */
async function checkTwiTimeline() {
    if (!connection) return;
    const mongo = await mongodb(DB_PATH, { useUnifiedTopology: true }).connect();
    const twitter_db = mongo.db('bot').collection('twitter');
    let subscribes = await twitter_db.find({}).toArray();
    let check_interval = subscribes.length > 0 ? subscribes.length * 30 * 1000 : 5 * 60 * 1000;
    mongo.close();

    async function refreshTimeline() {
        await mongodb(DB_PATH, { useUnifiedTopology: true }).connect().then(async mongo => {
            const twitter_db = mongo.db('bot').collection('twitter');
            const group_option = mongo.db('bot').collection('group_option');
            let subscribes = await twitter_db.find({}).toArray();
            let options = await group_option.find({}).toArray();
            cleardownload = true;//用来规避看看推特撞到清理缓存
            await ClearDownloadx();//清理缓存
            cleardownload = false;

            if (subscribes.length > 0 && options.length > 0) {
                i = 0;
                check_interval = subscribes.length * 30 * 1000;
                setTimeout(refreshTimeline, check_interval + 30000);
                checkEach();
            }
            else if (subscribes.length < 1 || options.length < 1) {
                console.error("twitter subs less than 1");
                setTimeout(refreshTimeline, 5 * 60 * 1000);//5分钟一次
            }
            else if (subscribes == undefined || options == undefined) {
                subscribes = await twitter_db.find({}).toArray();
                subscribes != undefined ? checkEach() : console.error("twitter database error");
            }
            mongo.close();

            function checkEach() {
                setTimeout(async () => {
                    process: try {
                        if (subscribes[i] == undefined) break process;
                        let curr_s = subscribes[i];
                        let tweet_list = await getUserTimeline(curr_s.uid, 5, 1, 1);
                        if (tweet_list != undefined && tweet_list.length > 0 && tweet_list[0].id_str > curr_s.tweet_id) {
                            tweet_list = tweet_list.filter(t => t.id_str > curr_s.tweet_id);
                            let groups = curr_s.groups;
                            let url_list = [];
                            for (let group_id of groups) {
                                let option = false;
                                let post = false;

                                for (let group of options) {
                                    if (group.group_id == group_id) {
                                        option = group.twitter[curr_s.uid];
                                        break;
                                    }
                                }
                                if (!option) throw `Twitter转发时出错，${group_id}这个组没有配置`;
                                else post = opt_dict(option.post);

                                for (let tweet of tweet_list) {
                                    let status = checkStatus(tweet);
                                    if (needPost(status, post)) {
                                        let url = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
                                        let addon = [];
                                        if (status != "retweet") {
                                            if (option.notice != undefined) addon.push(`${option.notice}`);
                                            url_list.push(url);
                                        }
                                        addon.push(url);
                                        const context = { group_id: group_id, message_type: "group" };
                                        format(tweet, false, context).then(payload => {
                                            payload += `\n\n${addon.join("\n")}`
                                            replyFunc(context, payload);
                                        }).catch(err => console.error(err));
                                    }
                                }
                            }

                            //不好办啊
                            setTimeout(updateTwitter, 500, tweet_list, curr_s);
                        }
                    } catch (err) {
                        console.error(err, '\n', subscribes[i]);
                    } finally {
                        i++;
                        if (i < subscribes.length) checkEach();
                    }
                }, (check_interval - subscribes.length * 1000) / subscribes.length);
            }
        });
    }
    setTimeout(refreshTimeline, 5000);

    function checkStatus(tweet) {
        let status = "";
        if ("retweeted_status" in tweet || "retweeted_status_id_str" in tweet || /^RT @/.test(tweet.full_text)) status = "retweet";
        else if ("in_reply_to_status_id_str" in tweet && tweet.in_reply_to_status_id_str != null) status = "reply";
        else if ("media" in tweet.entities && tweet.entities.media[0].type == "photo") status = "pic";
        else status = "origin"

        return status;
    }

    function needPost(status, option) {
        switch (status) {
            case "origin": if (option.origin == 1) return true; break;
            case "reply": if (option.reply == 1) return true; break;
            case "retweet": if (option.retweet == 1) return true; break;
            case "pic": if (option.pic == 1) return true; break;
            default: return false;
        }
        return false;
    }

    function updateTwitter(tweet_list, subscribe) {
        mongodb(DB_PATH, { useUnifiedTopology: true }).connect().then(async mongo => {
            const twitter_db = mongo.db('bot').collection('twitter');
            await twitter_db.updateOne(
                { _id: subscribe._id },
                { $set: { tweet_id: tweet_list[0].id_str, name: tweet_list[0].user.name } })
                .then(result => {
                    if (result.result.ok != 1 && result.result.nModified < 1) {
                        console.error(tweet_list[0].id_str, subscribe.tweet_id, tweet_list[0].user.name,
                            result, "\n twitter_db update error during checkTwitter");
                    }
                })
                .catch(err => console.error(err + "\n twitter_db update error during checkTwitter"));
            mongo.close();
        });
    }
}

/**
 * @param {object} context
 * @returns {} no return
 */
function checkSubs(context) {
    const group_id = context.group_id;
    mongodb(DB_PATH, { useUnifiedTopology: true }).connect().then(async mongo => {
        const group_option = mongo.db('bot').collection('group_option');
        let options = await group_option.findOne({ group_id: group_id });

        let subs = [];
        for (let sub in options.twitter) {
            let name = options.twitter[sub].name;
            let option_nl = toOptNl(options.twitter[sub]);
            subs.push(`${name}，模式为${option_nl}`)
        }
        if (subs.length < 1) {
            replyFunc(context, "你一无所有", true);
        }
        else {
            replyFunc(context, `本群已订阅:\n${subs.join("\n")}`)
        }
        mongo.close();
    }).catch(err => console.error(err + "\n Twitter checkSubs error, group_id= " + group_id));
}

/**
 * @param {object} context
 * @returns {} no return
 */
function clearSubs(context, group_id) {
    mongodb(DB_PATH, { useUnifiedTopology: true }).connect().then(async mongo => {
        const TWI = mongo.db('bot').collection('twitter');
        const GROUP_OPTION = mongo.db('bot').collection('group_option');

        try {
            await GROUP_OPTION.updateOne({ group_id: group_id }, { $set: { twitter: {} } });

            let matchs = await TWI.find({ groups: { $in: [group_id] } }).toArray();
            if (matchs.length < 1) { replyFunc(context, `未见任何Twitter订阅`); return; }
            for (let item of matchs) {
                let res = await TWI.findOneAndUpdate({ _id: item._id }, { $pull: { groups: { $in: [group_id] } } }, { returnOriginal: false });
                if (res.value.groups.length < 1) await TWI.deleteOne({ _id: res.value._id });
            }
            replyFunc(context, `清理了${matchs.length}个Twitter订阅`);
        }
        catch (err) {
            console.error(err);
            replyFunc(context, '中途错误，清理未完成');
        }
        finally { mongo.close(); }
    }).catch(err => console.error(err + " Twitter clearSubs error, group_id= " + group_id));
}

/**
 * 整理tweet_obj
 * @param {object} tweet Tweet object
 * @param {string} end_point 是否停止进一步挖掘
 * @param {object} end_point 用于发送的context
 * @returns Promise  排列完成的Tweet String
 */
async function format(tweet, end_point = false, context = false) {
    if (!tweet) return "Twitter转发时错误";
    let payload = [];
    let text = "";
    if ('full_text' in tweet) text = tweet.full_text;
    else text = tweet.text;
    text = text.replace(/&amp;/g, "&").replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

    try {
        if ("retweeted_status" in tweet) {
            let rt_status = await format(tweet.retweeted_status, true);
            payload.push(`来自${tweet.user.name}的Twitter\n转推了`, rt_status);
            return payload.join("\n");
        }
        let pics = "";
        let src = "";
        if ("extended_entities" in tweet) {
            for (entity in tweet.extended_entities) {
                if (entity == "media") {
                    let media = tweet.extended_entities.media;
                    for (let i = 0; i < media.length; i++) {
                        text = text.replace(media[i].url, "");
                        if (media[i].type == "photo") {
                            src = [media[i].media_url_https.substring(0, media[i].media_url_https.length - 4), (media[i].media_url_https.search("jpg") != -1 ? '?format=jpg&name=orig' : '?format=png&name=orig')].join(""); //?format=png&name=orig 可能出现这种情况
                            let temp = await sizeCheck(src);
                            pics += (temp == true ? `[CQ:image,cache=0,file=file:///${await Downloadx(src)}]` : `[CQ:image,cache=0,file=file:///${await Downloadx(media[i].media_url_https)}] 注:这不是原图,原图大小为${temp}`);
                        }
                        else if (media[i].type == "animated_gif") {
                            try {
                                console.log("media[i].video_info.variants[0].url:" + media[i].video_info.variants[0].url);
                                let gifpath0 = __dirname; //获取twitter.js文件的绝对路径
                                let gifpath = await Downloadx(media[i].video_info.variants[0].url); //下载gif视频并获得本地路径
                                let gifpath2 = await Downloadx(media[i].media_url_https); //gif第一帧封面
                                await exec(`ffmpeg -i ${gifpath} -loop 0 -y ${gifpath0}/temp.gif`)
                                    .then(async ({
                                        stdout,
                                        stderr
                                    }) => {
                                        if (stdout.length == 0) {
                                            //console.log("gifpath0:" + gifpath0);
                                            if (fs.statSync(`${gifpath0}/temp.gif`).size < PIC_MAX_SIZE) { //gif图片不能超过30MB，否则发不出来
                                                try {
                                                    await exec(`ffmpeg -i ${gifpath0}/temp.gif -f null -`) //判断gif的总帧数 https://www.npmjs.com/package/gif-meta https://github.com/indatawetrust/gif-meta
                                                        .then(async giftemp => {
                                                            let giftemp2 = /frame=(.+?)fps/.exec(JSON.stringify(giftemp.stderr))[1].replace("fps", "").trim();
                                                            console.info("gif的总帧数:" + giftemp2);
                                                            if (giftemp2 <= 300) {//帧数过高可能发不出来gif,gif和插件模块放在一块，不在tmp文件夹里
                                                                pics += `这是一张动图 [CQ:image,cache=0,file=file:///${gifpath2}]` + `\n原gif视频地址: ${media[i].video_info.variants[0].url}\n`
                                                                pics += `[CQ:image,cache=0,file=file:///${gifpath0}/temp.gif]`;
                                                            } else {
                                                                if (fs.statSync(`${gifpath}`).size < VID_MAX_SIZE) {//视频mp4不能超过100MB，否则发不出来
                                                                    if (context) {
                                                                        replyFunc(context, `[CQ:video,file=file:///${gifpath},cover=file:///${gifpath2}]`);
                                                                    }
                                                                }
                                                                payload.push(`[CQ:image,cache=0,file=file:///${gifpath2}]`, `原gif视频地址: ${media[i].video_info.variants[0].url}`);
                                                            }
                                                        })
                                                } catch (err) {
                                                    console.error(new Date().toString() + ",判断gif的总帧数:" + err);
                                                }
                                            } else pics += `这是一张动图[CQ:image,cache=0,file=file:///${await Downloadx(media[i].media_url_https)}]` + `动起来看这里${media[i].video_info.variants[0].url}`;
                                        }
                                    })
                            } catch (err) {
                                console.error(new Date().toString() + ",推特动图:" + err);
                                pics += `这是一张动图 [CQ:image,cache=0,file=file:///${await Downloadx(media[i].media_url_https)}]` + `动起来看这里${media[i].video_info.variants[0].url}`;
                            }
                        }
                        else if (media[i].type == "video") {
                            let mp4obj = [];
                            for (let j = 0; j < media[i].video_info.variants.length; j++) {
                                if (media[i].video_info.variants[j].content_type == "video/mp4") {
                                    mp4obj.push(media[i].video_info.variants[j]);
                                }
                            }
                            mp4obj.sort((a, b) => { return b.bitrate - a.bitrate; });
                            let tmp = await sizeCheck(mp4obj[0].url, false);
                            if (tmp == true) {
                                if (context) {
                                    replyFunc(context, `[CQ:video,cache=0,file=file:///${await Downloadx(mp4obj[0].url)},cover=file:///${await Downloadx(media[i].media_url_https)}]`);
                                }
                                payload.push(`[CQ:image,cache=0,file=file:///${temp}]`, `视频地址: ${mp4obj[0].url}`);
                            }
                        } else {
                            payload.push(`该视频超过100MB，无法直接发送.该视频大小为${tmp}`, `视频地址: ${mp4obj[0].url}`);
                        }
                    }
                }
            }
            if (pics != "") payload.push(pics);
        }
        if (!end_point && "is_quote_status" in tweet && tweet.is_quote_status == true) {
            let quote_tweet = await getSingleTweet(tweet.quoted_status_id_str);
            payload.push("引用了", await format(quote_tweet, true));
            text = text.replace(tweet.quoted_status_permalink.url, "");
        }
        if ("in_reply_to_status_id" in tweet && tweet.in_reply_to_status_id != null && !end_point) {
            let reply_tweet = await getSingleTweet(tweet.in_reply_to_status_id_str);
            payload.push("回复了", await format(reply_tweet, true));
        }
        if ("card" in tweet) {
            if (/poll\dchoice/.test(tweet.card.name)) {
                if ("image_large" in tweet.card.binding_values) {
                    payload.push(`[CQ:image,cache=0,file=file:///${await Downloadx(tweet.card.binding_values.image_large.url)}]`);
                }

                let end_time = new Intl.DateTimeFormat('zh-Hans-CN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' })
                    .format(new Date(tweet.card.binding_values.end_datetime_utc.string_value))
                payload.push("", tweet.card.binding_values.counts_are_final.boolean_value === true ? "投票已结束"
                    : `正在投票,结束时间${end_time}`);
                let nchoice = parseInt(/\d/.exec(tweet.card.name)[0]);
                let count = "";
                let lable = "";
                for (i = 1; i < nchoice + 1; i++) {
                    lable = tweet.card.binding_values[`choice${i}_label`].string_value;
                    count = tweet.card.binding_values[`choice${i}_count`].string_value;
                    payload.push(`${lable}:  ${count}`);
                }
            }
            else if (/summary/.test(tweet.card.name)) {
                if ("photo_image_full_size_original" in tweet.card.binding_values) {
                    payload.push(`[CQ:image,cache=0,file=file:///${await Downloadx(tweet.card.binding_values.photo_image_full_size_original.image_value.url)}]`);
                }
                if ("title" in tweet.card.binding_values) payload.push(tweet.card.binding_values.title.string_value)
                if ("description" in tweet.card.binding_values) payload.push(tweet.card.binding_values.description.string_value);
            }
        }
        if ("urls" in tweet.entities && tweet.entities.urls.length > 0) {
            for (let i = 0; i < tweet.entities.urls.length; i++) {
                text = text.replace(tweet.entities.urls[i].url, tweet.entities.urls[i].expanded_url);
            }
        }
        payload.unshift(`${tweet.user.name}的Twitter`, text);
        return payload.join("\n");
    }
    catch (err) {
        console.error(err);
        payload.push(`${tweet.user.name}的Twitter`, text);
        return payload.join("\n");
    }
}

/**
 * 将Twitter的t.co短网址扩展为原网址
 * @param {string} twitter_short_url Twitter短网址
 * @returns Promise  原网址
 */
function urlExpand(twitter_short_url) {
    return axios({
        method: "GET",
        url: twitter_short_url,
        headers: httpHeader(),
        timeout: 30000
    }).then(res => {
        return /URL=(http.+?)">/.exec(res.data)[1];
    }).catch(err => {
        console.error(err.response.data);
        return false;
    });
}

function rtTimeline(context, name, num) {
    searchUser(name).then(user => {
        if (!user) replyFunc(context, "没这人");
        else if (user.protected == true) replyFunc(context, "这人的Twitter受保护");
        else {
            getUserTimeline(user.id_str, 10).then(async timeline => {
                let tweets = [];
                for (let tweet of timeline) {
                    if (!"retweeted_status_id_str" in tweet
                        || !/^RT @/.test(tweet.full_text)) {
                        tweets.push(tweet);
                    }
                }
                if (tweets.length < num) tweets = timeline;
                let choose_one = tweets[num];
                choose_one.user = { name: user.name };
                format(choose_one).then(tweet_string => {
                    let payload = [tweet_string, `https://twitter.com/${user.screen_name}/status/${choose_one.id_str}`].join('\n\n');
                    replyFunc(context, payload);
                }).catch(err => console.error(err));
            });
        }
    });
}

function rtSingleTweet(tweet_id_str, context) {
    getSingleTweet(tweet_id_str).then(tweet => {
        format(tweet, false, context).then(tweet_string => replyFunc(context, tweet_string));
    });
}

/**
 * 通过用户名添加订阅
 * @param {string} name Twitter用户名
 * @param {string} option_nl 偏好设置，可以是"仅原创"，"包含转发"，"仅带图"
 * @param {object} context
 * @returns {boolean} 成功返回true
 */
async function addSub(name, option_nl, context) {
    let user = await searchUser(name);
    if (!user) {
        replyFunc(context, "没这人", true);
        return true;
    }
    if (option_nl == undefined) option_nl = "仅原创";
    let option_list = option_nl.split(/[;；]/).filter((noEmpty) => { return noEmpty != undefined });
    let option = {
        username: user.screen_name,
        name: user.name
    };
    for (let opt of option_list) {
        let opt_ = opt.split(/(?<!\[CQ:.+)[=＝]/);
        let opt_inter = OPTION_MAP[opt_[0].trim()] || false;
        if (!opt_inter) {
            replyFunc(context, `没有${opt}这个选项`, true);
            return true;
        }
        else {
            if (opt_inter == "notice") {
                let people = opt_[1].trim();
                if (!/\[CQ:at/.test(people)) {
                    replyFunc(context, "你这提醒区怎么一个at都么有搞mea?", true);
                    return true;
                }
                option.notice = people;
            }
            else option.post = opt_inter;
        }
    }
    if (option.post == undefined) option.post = "origin_only";
    subscribe(user, option, context);
    return true;
}

function twitterAggr(context) {
    if (!CONFIG.enable) return false;
    if (connection && /^看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(最新))?\s?(推特|Twitter)$/i.test(context.message) && cleardownload == false) {	
		let num = 1;
        let name = "";
        if (/最新/.test(context.message)) (num = 0);
        else if (/上上上条/.test(context.message)) (num = 3);
        else if (/上上条/.test(context.message)) (num = 2);
        else if (/上一?条/.test(context.message)) (num = 1);
        else if (/第.+?条/.test(context.message)) {
            let temp = /第([0-9]|[一二三四五六七八九])条/.exec(context.message)[1];
            if (temp == 0 || temp == "零") (num = 0);
            else if (temp == 1 || temp == "一") (num = 0);
            else if (temp == 2 || temp == "二") (num = 1);
            else if (temp == 3 || temp == "三") (num = 2);
            else if (temp == 4 || temp == "四") (num = 3);
            else if (temp == 5 || temp == "五") (num = 4);
            else if (temp == 6 || temp == "六") (num = 5);
            else if (temp == 7 || temp == "七") (num = 6);
            else if (temp == 8 || temp == "八") (num = 7);
            else if (temp == 9 || temp == "九") (num = 8);
        }
        else num = 0;
        name = /看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上{1,3}一?条)|(置顶)|(最新))?\s?(推特|Twitter)/i.exec(context.message)[1];
        rtTimeline(context, name, num);
        return true;
    }
    else if (connection && /^看看https:\/\/(mobile\.)?twitter.com\/.+?\/status\/(\d+)/i.test(context.message) && cleardownload == false) {
        let tweet_id = /status\/(\d+)/i.exec(context.message)[1];
        rtSingleTweet(tweet_id, context);
        return true;
    }
    else if (connection && /^订阅(推特|Twitter)https:\/\/twitter.com\/.+(\/status\/\d+)?([>＞](.{2,}))?/i.test(context.message)) {
        if (!global.permissionCheck(context, PERMISSION)) return true;
        let name = (/status\/\d+/.test(context.message) && /\.com\/(.+)\/status/.exec(context.message)[1] ||
            /\.com\/(.+)[>＞]/.exec(context.message)[1]);
        let option_nl = /[>＞](?<option_nl>.{2,})/.exec(context.message)[1];
        if (option_nl == undefined) option_nl = "仅原创"
        addSub(name, option_nl, context);
        return true;
    }
    else if (connection && /^订阅.+的?(推特|Twitter)([>＞](?<option_nl>.{2,}))?/i.test(context.message)) {
        if (!global.permissionCheck(context, PERMISSION)) return true;
        let {groups : {name, option_nl}} = /订阅(?<name>.+)的?(推特|Twitter)([>＞](?<option_nl>.{2,}))?/i.exec(context.message);
        addSub(name, option_nl, context);
        return true;
    }
    else if (/^取消订阅.+的?(推特|Twitter)$/i.test(context.message)) {
        if (!global.permissionCheck(context, PERMISSION)) return true;
        let name = /取消订阅(.+)的?(推特|Twitter)/i.exec(context.message)[1];
        unSubscribe(name, context);
        return true;
    }
    else if (/^查看(推特|Twitter)订阅$/i.test(context.message)) {
        checkSubs(context);
        return true;
    }
    else if (/^清空(推特|Twitter)订阅$/i.test(context.message)) {
        if (global.permissionCheck(context, ["SU", "owner"])) clearSubs(context, context.group_id);
        return true;
    }
    else return false;
}

setAgent();
firstConnect();

module.exports = { twitterAggr, twitterReply, checkTwiTimeline, clearSubs };