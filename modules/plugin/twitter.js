const axios = require('axios');
const mongodb = require('mongodb').MongoClient;
const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec);
const fs = require('fs-extra');

const DB_PORT = 27017;
const DB_PATH = "mongodb://127.0.0.1:" + DB_PORT;
const BEARER_TOKEN = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
const MAX_SIZE = 4194304;
const OPTION_MAP = {
    "仅原创" : [1, 0, 0, 1],
    "仅转发" : [0, 1, 0, 0],
    "包含转发" : [1, 1, 0, 1],
    "不要转发" : [1, 0, 1, 1],
    "仅回复" : [0, 0, 1, 0],
    "包含回复" : [1, 0, 1, 1],
    "不要回复" : [1, 1, 0, 1],
    "只看图" : [0, 0, 0, 1],
    "全部" : [1, 1, 1, 1]
} 

let guest_token = "";
let cookie = "";
let connection = true;
let replyFunc = (context, msg, at = false) => {console.log(msg)};

/** 用value找key*/
function toOptNl(option) {
    let {origin, retweet, reply, pic} = option;
    option = [origin, retweet, reply, pic];
    for (key in OPTION_MAP) {
        if (OPTION_MAP[key].join("") == option.join("")) return key;
    }
}

function opt_dict(option_list) {
    let [origin, retweet, reply, pic] = option_list;
    return {
        "origin" : origin,
        "retweet" : retweet,
        "reply" : reply,
        "pic" : pic
    }
}

function twitterReply(replyMsg) {
    replyFunc = replyMsg;
}

/** 检查网络情况，如果连不上Twitter那后面都不用做了*/
function checkConnection() {
    return axios.get("https://twitter.com").then(res => {connection = (res.status == 200) ? true : false}).catch(err => connection = false);
}

function firstConnect() {
    checkConnection().then(() => {
        if (!connection) {
            console.log("Twitter无法连接，功能暂停");
        }
        else {
            getGuestToken();
            setTimeout(() => getCookie(), 1000);
            let get_cookie_routine = setInterval(() => getCookie(), 20*60*60*1000);
            let get_gt_routine = setInterval(() => getGuestToken(), 0.9*60*60*1000);
        }
    });
}

function sizeCheck(url) {
    return axios.get(url).then(res => {
        return parseInt(res.headers["content-length"]) < MAX_SIZE ? true : false;
    }).catch(err => {
        console.error(url, err.response.status);
        return false;
    });
}

function httpHeader() {
    return headers = {
        "origin" : "https://twitter.com",
        "authorization" : BEARER_TOKEN,
        "cookie" : cookie,
        "x-guest-token" : guest_token,
        "x-twitter-active-user" : "yes",
        "sec-fetch-dest" : "document",
        "sec-fetch-mode" : "navigate",
        "sec-fetch-user" : "?1",
        "sec-fetch-site" : "same-site",
        "upgrade-insecure-requests" : "1",
        "user-agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
        "accept" : "application/json, text/plain, */*",
        "dnt" : "1",
        // "accept-encoding" : "gzip, deflate, br",
        "accept-language" : "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6",
        "x-twitter-client-language" : "zh-cn"
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
        method : "POST",
        url : "https://api.twitter.com/1.1/guest/activate.json",
        headers : headers
    }).then(res => {guest_token = res.data.guest_token;}).catch(err => console.log(err.response.data))
}

/** 获取一个cookie，后面要用*/
function getCookie() {
    if (!connection) return;
    let headers = httpHeader();
    delete headers.cookie;
    delete headers.authorization;
    axios({
        method : "GET",
        url : "https://twitter.com/explore",
        headers : headers
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
    }).catch(err => console.error('Twitter cookie设置出错，错误：', err.response.status, err.response.statusText));
}

/** 
 * 获取单条Twitter参考  
 * developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-statuses-lookup
 * @param {string} tweet_id_str 单条Tweet id
 * @returns {Promise} Tweet Object，如果错误，结果为false
 */
function getSingleTweet(tweet_id_str) {
    return axios({
        method:'GET',
        url: "https://api.twitter.com/1.1/statuses/show.json",
        headers : {
            "authorization" : BEARER_TOKEN,
        },
        params : {
            "id" : tweet_id_str,
            "include_entities" : "true",
            "include_ext_alt_text" : "true",
            "include_card_uri" : "true",
            "tweet_mode" : "extended",
            "include_ext_media_color" : "true",
            "include_ext_media_availability" : "true",
            "include_cards" : "1",
            "cards_platform" : "Web-12",
            
        }
    }).then(res => {return res.data; 
    }).catch(err => {
        console.error(err.response.data);
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
function getUserTimeline(user_id, count = 2, include_rt = false, exclude_rp = true) {
    return axios({
        method:'GET',
        url: "https://api.twitter.com/1.1/statuses/user_timeline.json",
        headers : {"Authorization" : BEARER_TOKEN},
       params : {
            // screen_name : screen_name,
            "user_id" : user_id,
            "count" : count,
            "exclude_replies" : exclude_rp,
            "include_rts" : include_rt,
            "tweet_mode" : "extended"
        }
    }).then(res => {return res.data;
    }).catch(err => {
        console.error(err.response.data);
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
function searchUser(name) {
    let header = httpHeader();
    header["x-guest-token"] = guest_token;
    return axios({
        method : "GET",
        url : "https://api.twitter.com/1.1/users/search.json",
        headers : header,
        params : {
            "q": name,
            "count": 1,
        }
    }).then(res => {return res.data[0]
    }).catch(err => {
        console.log(err.response.data);
        return false;
    })
}

/** 
 * 
 * @param {string} name 用户名称
 * @returns {Promise} user_object，如果没有或者错误会返回false
 */
function fetch(name) {
    let header = httpHeader();
    header["x-guest-token"] = guest_token;
    return axios({
        method : "GET",
        url : "https://api.twitter.com/1.1/users/search.json",
        headers : header,
        params : {
            "q": name,
            "count": 1,
        }
    }).then(res => {return res.data[0]
    }).catch(err => {
        console.error(err.response.data);
        return false;
    })
}

/**
 * 增加订阅
 * @param {number} uid Twitter用户id_str
 * @param {string} option 偏好设置
 * @param {object} context
 */
function subscribe(uid, option, context) {
    let group_id = context.group_id;
    let option_nl = toOptNl(option);

    mongodb(DB_PATH, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('twitter');
        let res = await coll.find({uid : uid}).toArray();
        if (res.length == 0) {
            let tweet = (await getUserTimeline(uid, 15, true))[0];
            if (tweet == undefined) {
                replyFunc(context, `无法订阅这个人的Twitter`, true);
                return false;
            }
            let tweet_id = tweet.id_str;
            let name = tweet.user.name;
            coll.insertOne({uid : uid, name : name, tweet_id : tweet_id, groups : [group_id], [group_id] : option},
                (err) => {
                    if (err) console.error(err + " Twitter subscribes insert error");
                    else replyFunc(context, `已订阅${name}的Twitter，模式为${option_nl}`, true);
                });
        }
        else {
            coll.findOneAndUpdate({uid : uid},
                                  {$addToSet : {groups : group_id}, $set : {[group_id] : option}},
                (err, result) => {
                    if (err) console.error(err + " Twitter subscribes update error");
                    else {
                        if (result.value.groups.includes(group_id)) text = "多次订阅有害我的身心健康";
                        else text = `已订阅${result.value.name}的Twitter，模式为${option_nl}`;
                        replyFunc(context, text, true);
                    }
                });
        }
        mongo.close();
    }).catch(err => console.error(err + " Twitter subscribe error, uid= " + uid));
}

/**
 * 取消订阅
 * @param {string} name Twitter用户名
 * @param {object} context
 */
function unSubscribe(name, context) {
    let group_id = context.group_id;
    let name_reg = new RegExp(name, 'i')
    mongodb(DB_PATH, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('twitter');
        await coll.findOneAndUpdate({name : name_reg},
                                    {$pull : {groups : {$in : [group_id]}}, $unset : {[group_id] : []}},
            async (err, result) => {
                if (err) console.error(err + "database subscribes delete error");
                else {
                    let text = "";
                    if (result.value == null || !result.value.groups.includes(group_id)) text = "小火汁你压根就没订阅嗷";
                    else {
                        text = "已取消订阅" + result.value.name + "的Twitter";
                        if (result.value.groups.length <= 1) await coll.deleteOne({_id : result.value._id});
                    }
                    replyFunc(context, text, true);
                }
            mongo.close();
        });
    }).catch(err => console.error(err + "Twitter unsubscribe error, uid= " + uid));
}

/**
 * 每过x分钟检查一次订阅列表，如果订阅一个Twitter账号的群的数量是0就删除
 */
function checkTwiTimeline() {
    if (!connection) return;
    let check_interval = 5 * 60 * 1000;

    setInterval(async () => {
        await mongodb(DB_PATH, {useUnifiedTopology: true}).connect().then(async mongo => {
            let coll = mongo.db('bot').collection('twitter');
            let subscribes = await coll.find({}).toArray();
            if (subscribes != undefined && subscribes.length > 0) {
                i = 0;
                checkEach();
            }
            else {
                subscribes = await coll.find({}).toArray();
                subscribes != undefined ? console.log(subscribes.length) : console.error("twitter database error")
            }
            mongo.close();

            function checkEach() {
                setTimeout(async() => {
                    try {
                        let tweet_list = await getUserTimeline(subscribes[i].uid, 10, true, false);
                        if (tweet_list != undefined) {
                            let last_tweet_id = subscribes[i].tweet_id;
                            let current_id = tweet_list[0].id_str;
                            if (current_id > last_tweet_id) {
                                let groups = subscribes[i].groups;
                                for (let tweet of tweet_list) {
                                    if (tweet.id_str > last_tweet_id) {
                                        groups.forEach(group_id => {
                                            if (checkOption(tweet, subscribes[i][group_id])) {
                                                format(tweet).then(payload => {
                                                    payload += `\n\nhttps://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
                                                    replyFunc({group_id : group_id, message_type : "group"}, payload);
                                                }).catch(err => console.error(err));
                                            }
                                        });
                                    }
                                }
                                await mongodb(DB_PATH, {useUnifiedTopology: true}).connect().then(async mongo => {
                                    let coll = mongo.db('bot').collection('twitter');
                                    await coll.updateOne({uid : subscribes[i].uid},
                                                    {$set : {tweet_id : current_id, name : tweet_list[0].user.name}}, 
                                        (err, result) => {if (err) console.error(err + " database update error during checkTwitter");});
                                });
                            }
                        }
                    } catch(err) {
                        console.error(err, '\n', subscribes[i]);
                    } finally {
                        i++;
                        if (i < subscribes.length) checkEach();
                    }
                }, (check_interval-subscribes.length*1000)/subscribes.length);
            }
        });
    }, check_interval)

    function checkOption(tweet, option) {
        let status = "";
        if ("retweeted_status" in tweet || "retweeted_status_id_str" in tweet || /^RT @/.test(tweet.full_text)) status = "retweet";
        else if ("in_reply_to_status_id" in tweet && tweet.in_reply_to_status_id != null) status = "reply";
        else if ("media" in  tweet.entities && tweet.entities.media[0].type == "photo") status = "pic";
        else status = "origin"

        switch (status) {
            case "origin" : if (option.origin == 1) return true; break;
            case "reply" : if (option.reply == 1) return true; break;
            case "retweet" : if (option.retweet == 1) return true; break;
            case "pic" : if (option.pic == 1) return true; break;
            default : return false;
        }
    }
}

/**
 * @param {object} context
 * @returns {} no return
 */
function checkSubs(context) {
    let group_id = context.group_id;
    mongodb(DB_PATH, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('twitter');
        await coll.find({groups : {$elemMatch : {$eq : group_id}}}, {projection: {_id : 0}})
            .toArray().then(result => {
                if (result.length > 0) {
                    let name_list = [];
                    result.forEach(twitter_obj => {
                        let option_nl = "仅原创";
                        option_nl = toOptNl(twitter_obj[group_id]);
                        name_list.push(`${twitter_obj.name}，${option_nl}`);
                    });
                    let subs = "本群已订阅:\n" + name_list.join("\n");
                    replyFunc(context, subs, true);
                }
                else replyFunc(context, "你一无所有", true);
            })
        mongo.close();
    }).catch(err => console.error(err + " Twitter checkWeiboSubs error, group_id= " + group_id));
}

/**
 * @param {object} context
 * @returns {} no return
 */
function clearSubs(context, group_id) {
    mongodb(DB_PATH, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('twitter');
        try {
            let matchs = await coll.find({groups : {$in : [group_id]}}).toArray();
            if (matchs.length < 1) {replyFunc(context, `未见任何Twitter订阅`); return;}
            for (let item of matchs) {
                let res = await coll.findOneAndUpdate({_id : item._id}, {$pull : {groups : {$in : [group_id]}}, $unset : {[group_id] : []}}, {returnOriginal : false});
                if (res.value.groups.length < 1) await coll.deleteOne({_id : res.value._id});
            }
            replyFunc(context, `清理了${matchs.length}个Twitter订阅`);
        }
        catch(err) {
            console.error(err);
            replyFunc(context, '中途错误，清理未完成');
        }
        finally {mongo.close();}
    }).catch(err => console.error(err + " Twitter clearSubs error, group_id= " + group_id));
}

/**
 * 整理tweet_obj
 * @param {object} tweet Tweet object
 * @param {string} from_user Twitter用户名
 * @returns Promise  排列完成的Tweet String
 */
async function format(tweet, end_point=false) {
    let payload = [];
    let text = "";
    if('full_text' in tweet) text = tweet.full_text;
    else text = tweet.text;
    if ("retweeted_status" in tweet) {
        let rt_status = await format(tweet.retweeted_status)
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
                        src = [media[i].media_url_https.substring(0, media[i].media_url_https.length-4), '?format=jpg&name=4096x4096'].join("");
                        pics += await sizeCheck(src) ? `[CQ:image,cache=0,file=${src}]` : `[CQ:image,cache=0,file=${media[i].media_url_https}] 注：这不是原图`;
                    }
                    else if (media[i].type == "animated_gif") {
                        try {
                            await exec(`ffmpeg -i ${media[i].video_info.variants[0].url} -loop 0 -y ${__dirname}/temp.gif`)
                                .then(async ({stdout, stderr}) => {
                                    if (stdout.length == 0) {
                                        if (fs.statSync(`${__dirname}/temp.gif`).size < MAX_SIZE) {
                                            let gif = fs.readFileSync(`${__dirname}/temp.gif`);
                                            let base64gif = Buffer.from(gif, 'binary').toString('base64');
                                            pics += `[CQ:image,file=base64://${base64gif}]`;
                                        }
                                        else pics += `这是一张动图 [CQ:image,cache=0,file=${media[i].media_url_https}]` + `动起来看这里${media[i].video_info.variants[0].url}`;
                                    }
                                })
                        } catch(err) {
                            console.error(err);
                            pics += `这是一张动图 [CQ:image,cache=0,file=${media[i].media_url_https}]` + `动起来看这里${media[i].video_info.variants[0].url}`;
                        }
                    }
                    else if (media[i].type == "video") {
                        let mp4obj = [];
                        for (let j = 0; j < media[i].video_info.variants.length; j++) {
                            if (media[i].video_info.variants[j].content_type == "video/mp4") mp4obj.push(media[i].video_info.variants[j]);
                        }
                        mp4obj.sort((a, b) => {return b.bitrate - a.bitrate;});
                        payload.push(`[CQ:image,cache=0,file=${media[i].media_url_https}]`,
                                     `视频地址: ${mp4obj[0].url}`);
                    }
                }
            }
        }
        if (pics != "") payload.push(pics);
    }
    if ("is_quote_status" in tweet && tweet.is_quote_status == true) {
        let quote_tweet = await getSingleTweet(tweet.quoted_status_id_str);
        payload.push("提到了", await format(quote_tweet));
        text = text.replace(tweet.quoted_status_permalink.url, "");
    }
    if ("in_reply_to_status_id" in tweet && tweet.in_reply_to_status_id != null && !end_point) {
        let reply_tweet = await getSingleTweet(tweet.in_reply_to_status_id_str);
        payload.push("回复了", await format(reply_tweet, true));
    }
    if ("card" in tweet) {
        // payload.push(tweet.binding_values.title.string_value, urlExpand(card.url));
        if (/poll\dchoice/.test(tweet.card.name)) {
            if ("image_large" in tweet.card.binding_values) {
                payload.push(`[CQ:image,cache=0,file=${tweet.card.binding_values.image_large.url}]`);
            }

            let end_time = new Intl.DateTimeFormat('zh-Hans-CN', {month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai'})
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
                if (sizeCheck(tweet.card.binding_values.photo_image_full_size_original.image_value.url)) {
                    payload.push(`[CQ:image,cache=0,file=${tweet.card.binding_values.photo_image_full_size_original.image_value.url}]`);
                }
                else payload.push(`[CQ:image,cache=0,file=${tweet.card.binding_values.photo_image_full_size_large.image_value.url}]`);
            }
            payload.push(tweet.card.binding_values.title.string_value, tweet.card.binding_values.description.string_value);
        }
    }
    if ("urls" in tweet.entities && tweet.entities.urls.length > 0) {
        for (let i = 0; i <  tweet.entities.urls.length; i++) {
            text = text.replace(tweet.entities.urls[i].url, tweet.entities.urls[i].expanded_url);
        }
    }
    payload.unshift(`${tweet.user.name}的Twitter`, text);
    return payload.join("\n");
}

/**
 * 将Twitter的t.co短网址扩展为原网址
 * @param {string} twitter_short_url Twitter短网址
 * @returns Promise  原网址
 */
function urlExpand(twitter_short_url) {
    return axios({
        method : "GET",
        url : twitter_short_url,
        headers : httpHeader()
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
            getUserTimeline(user.id_str, 20).then(async timeline => {
                if (timeline.length-1 < num) timeline = await getUserTimeline(user.id_str, 50);
                if (timeline.length-1 < num) timeline = await getUserTimeline(user.id_str, 1, true, false);
                format(timeline[num]).then(tweet_string => {
                    let payload = [tweet_string, `https://twitter.com/${user.screen_name}/status/${timeline[num].id_str}`].join('\n\n');
                    replyFunc(context, payload);
                }).catch(err => console.error(err));
            });
        }
    });
}

function rtSingleTweet(tweet_id_str, context) {
    getSingleTweet(tweet_id_str).then(tweet => {
        format(tweet).then(tweet_string => replyFunc(context, tweet_string))
    });
}

/**
 * 通过用户名添加订阅
 * @param {string} name Twitter用户名
 * @param {string} option_nl 偏好设置，可以是"仅原创"，"包含转发"，"仅带图"
 * @param {object} context
 * @returns {boolean} 成功返回true
 */
async function addSubByName(name, option_nl, context) {
    let user = await searchUser(name);
    if (!user) {
        replyFunc(context, "没这人", true);
        return true;
    }
    else {
        let option = OPTION_MAP[option_nl] || [1, 0, 0, 1];
        option = opt_dict(option);
        subscribe(user.id_str, option, context);
        return true;
    }
}

function twitterAggr(context) {
    if (connection && /^看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(最新))?\s?(推特|Twitter)$/i.test(context.message)) {	
		let num = 1;
        let name = "";
        if (/最新/.test(context.message)) (num = 0);
        else if (/上上上条/.test(context.message)) (num = 3);
        else if (/上上条/.test(context.message)) (num = 2);
        else if (/上一?条/.test(context.message)) (num = 1);
	    else if (/第.+?条/.test(context.message)) {
            let temp = /第([0-9]|[一二三四五六七八九])条/.exec(context.message)[1];
            if (temp==0 || temp=="零") (num = 0);
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
        else num = 0;       
        name = /看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上{1,3}一?条)|(置顶)|(最新))?\s?(推特|Twitter)/i.exec(context.message)[1];
        rtTimeline(context, name, num);
        return true;
	}
    else if (connection && /^看看https:\/\/(mobile\.)?twitter.com\/.+?\/status\/(\d+)/i.test(context.message)) {
        let tweet_id = /status\/(\d+)/i.exec(context.message)[1];
        rtSingleTweet(tweet_id, context);
        return true;
    }
    else if (connection && /^订阅(推特|Twitter)https:\/\/twitter.com\/.+(\/status\/\d+)?([>＞](仅转发|只看图|全部))?/i.test(context.message)) {
        let name = (/status\/\d+/.test(context.message) && /\.com\/(.+)\/status/.exec(context.message)[1] ||
                    /\.com\/(.+)[>＞]/.exec(context.message)[1]);
        let option_nl = /[>＞](仅转发|只看图|全部)/.exec(context.message)[1];
        if (option_nl == undefined) option_nl = "仅原创"
        addSubByName(name, option_nl, context);
        return true;
    }
    else if (connection && /^订阅.+的?(推特|Twitter)([>＞](仅转发|只看图|全部))?/i.test(context.message)) {
        let {groups : {name, option_nl}} = /订阅(?<name>.+)的?(推特|Twitter)([>＞](?<option_nl>.{2,4}))?/i.exec(context.message);
        addSubByName(name, option_nl, context);
        return true;
    }
    else if (/^取消订阅.+的?(推特|Twitter)$/i.test(context.message)) {
        let name = /取消订阅(.+)的?(推特|Twitter)/i.exec(context.message)[1];
        unSubscribe(name, context);
        return true;
    }
    else if (/^查看(推特|Twitter)订阅$/i.test(context.message)) {
        checkSubs(context);
        return true;
    }
    else if (/^清空(推特|Twitter)订阅$/i.test(context.message)) {
        if (/owner|admin/.test(context.sender.role)) clearSubs(context, context.group_id);
        else replyFunc(context, '您配吗？');
        return true;
    }
    else return false;
}


firstConnect();

module.exports = {twitterAggr, twitterReply, checkTwiTimeline, clearSubs};
