const axios = require('axios');
const mongodb = require('mongodb').MongoClient;
const puppeteer = require('puppeteer');

var db_port = 27017;
var db_path = "mongodb://127.0.0.1:" + db_port;
let bearer_token = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
let guest_token = "";
let cookie = "";
let connection = true;

let option_map = {
    "仅原创" : "origin",
    "仅转发" : "rt_only",
    "只看图" : "pic_only",
    "全部" : "all"
} 
let replyFunc = (context, msg, at = false) => {console.log(msg)};

/** 用value找key*/
function findKey(obj, value) {
    for (key in obj) {
        if (obj[key] === value) return key;
    }
}

function twitterReply(replyMsg) {
    replyFunc = replyMsg;
}

/** 检查网络情况，如果连不上Twitter那后面都不用做了*/
function checkConnection() {
    return axios.get("https://twitter.com").then(res => {connection = (res.headers.status == "200 OK") ? true : false}).catch(err => connection = false);
}

function httpHeader() {
    return headers = {
        "origin" : "https://twitter.com",
        "authorization" : bearer_token,
        "cookie" : cookie,
        "x-guest-token" : guest_token,
        "x-twitter-active-user" : "yes",
        "sec-fetch-dest" : "empty",
        "sec-fetch-mode" : "cors",
        "sec-fetch-site" : "same-site",
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
    axios({
        method : "GET",
        url : "https://twitter.com/",
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
    }).catch(err => console.log(err.response))
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
        url: "https://api.twitter.com/1.1/statuses/lookup.json",
        headers : {
            "authorization" : bearer_token,
        },
        params : {
            "id" : tweet_id_str,
            "include_entities" : "true",
            "include_ext_alt_text" : "true",
            "include_card_uri" : "true",
            "tweet_mode" : "extended"
        }
    }).then(res => {return res.data[0]; 
    }).catch(err => {
        console.log(err.response.data);
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
function getUserTimeline(user_id, count = 2, include_rts = false) {
    return axios({
        method:'GET',
        url: "https://api.twitter.com/1.1/statuses/user_timeline.json",
        headers : {"Authorization" : bearer_token},
       params : {
            // screen_name : screen_name,
            "user_id" : user_id,
            "count" : count,
            "exclude_replies" : true,
            "include_rts" : include_rts,
            "tweet_mode" : "extended"
        }
    }).then(res => {return res.data;
    }).catch(err => {
        console.log(err.response.data);
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
 * 增加订阅
 * @param {number} uid Twitter用户id_str
 * @param {string} option 偏好设置
 * @param {object} context
 */
function subscribe(uid, option, context) {
    let group_id = context.group_id;
    let option_nl = findKey(option_map, option);
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
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
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('twitter');
        await coll.findOneAndUpdate({name : name_reg},
                                    {$pull : {groups : {$in : [group_id]}}, $unset : {[group_id] : []}},
            async (err, result) => {
                if (err) console.log(err + "database subscribes delete error");
                else {
                    let text = "";
                    if (result.value == null || !result.value.groups.includes(group_id)) text = "小火汁你压根就没订阅嗷";
                    else {
                        text = "已取消订阅" + result.value.name + "的Twitter";
                        if (result.value.groups.length <= 1) await coll.deleteOne({_id : result.value._id});
                    }
                    replyFunc(context, text, true);
                    // console.log(text)
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
    setInterval(() => {
        mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
            let coll = mongo.db('bot').collection('twitter');
            let subscribes = await coll.find({}).toArray();
            for (let i = 0; i < subscribes.length; i++) {
                let tweet = (await getUserTimeline(subscribes[i].uid, 2, true))[0];
                if (tweet == undefined) {
                    tweet = (await getUserTimeline(subscribes[i].uid, 15, true))[0];
                    if (tweet == undefined) {
                        console.log(`这个人有问题${subscribes[i].name}`);
                        continue;
                    }
                }
                let last_tweet_id = subscribes[i].tweet_id;
                let current_id = tweet.id_str;
                if (current_id != last_tweet_id) {
                    let groups = subscribes[i].groups;
                    groups.forEach(group_id => {
                        if (checkOption(tweet, subscribes[i][group_id])) {
                            format(tweet).then(payload => {
                                payload += `\nhttps://twitter.com/${tweet.user.screen_name}/status/${current_id}`
                                replyFunc({group_id : group_id}, payload);
                            }).catch(err => console.error(err));
                        }
                    });
                    coll.updateOne({uid : subscribes[i].uid},
                                    {$set : {tweet_id : current_id, name : tweet.user.name}}, 
                        (err, result) => {if (err) console.error(err + " database update error during checkTwitter");});
                }
            }
            mongo.close();
        }).catch(err => console.error(err));
    }, 5 * 60 * 1000);

    function checkOption(tweet, option) {
        if (option == "all") return true;
        let status = "";
        if ("retweeted_status" in tweet) status = "retweet";
        if ("media" in  tweet.entities && tweet.entities.media[0].type == "photo") status = "ori_with_pic";
        else status = "origin"

        if (option == "rt_only" && status == "retweet") return true;
        else if (option == "pic_only" && status == "ori_with_pic") return true;
        else if (option == "origin") {
            if (status == "ori_with_pic" || status == "origin") return true;
        }
        else return false;
    }
}

/**
 * @param {object} context
 * @returns {} no return
 */
function checkSubs(context) {
    let group_id = context.group_id;
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('twitter');
        await coll.find({groups : {$elemMatch : {$eq : group_id}}}, {projection: {_id : 0}})
            .toArray().then(result => {
                if (result.length > 0) {
                    let name_list = [];
                    result.forEach(twitter_obj => {
                        let option_nl = "仅原创";
                        option_nl = findKey(option_map, twitter_obj[group_id]);
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
 * 整理tweet_obj
 * @param {object} tweet Tweet object
 * @param {string} from_user Twitter用户名
 * @returns Promise  排列完成的Tweet String
 */
async function format(tweet) {
    let payload = [];
    let text = tweet.full_text;
    if ("retweeted_status" in tweet) {
        let rt_status = await format(tweet.retweeted_status)
        payload.push(`来自${tweet.user.name}的Twitter\n转推了`, rt_status);
        return payload.join("\n");
    }
    let pics = "";
    if ("extended_entities" in tweet) {
        for (entity in tweet.extended_entities) {
            if (entity == "media") {
                let media = tweet.extended_entities.media;
                for (let i = 0; i < media.length; i++) {
                    text = text.replace(media[i].url, "");
                    if (media[i].type == "photo") {
                        pics += (`[CQ:image,cache=0,file=${media[i].media_url_https.substring(0, media[i].media_url_https.length-4)}?format=jpg&name=4096x4096]`);
                    }
                    else if (media[i].type == "animated_gif") {
                        pics += (`这是一张动图 [CQ:image,cache=0,file=${media[i].media_url_https}]`, `动起来看这里${media[i].video_info.variants[0].url}`);
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
    if ("card" in tweet) {
        payload.push(tweet.binding_values.title.string_value, urlExpand(card.url));
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
 * Twitter截图相关功能
 * @param {object} context 
 * @param {string} twitter_url 单条Tweet网址
 * @param {object} trans_args 所有翻译相关选项
 */
function tweetShot(context, twitter_url, trans_args={}) {
    (async () => {
        let browser = await puppeteer.launch({
            args: ['--no-sandbox']
        });
        let page = await browser.newPage();
        await page.setExtraHTTPHeaders({
            "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
            "accept-language" : "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6"
        });
        await page.emulateTimezone('Asia/Tokyo');
        await page.goto(twitter_url, {waitUntil : "networkidle0"});
        if (Object.keys(trans_args).length > 0) {
            await page.evaluate(trans_args => {
                let banner = document.getElementsByTagName('header')[0];
                banner.parentNode.removeChild(banner);
                let article = document.getElementsByClassName('css-1dbjc4n r-156q2ks')[0];
     
                let trans_place = document.createElement('div');
                let node_group_info = document.createElement('span');
                let node_trans_article = document.createElement('span');
                trans_place.className = node_group_info.className = node_trans_article.className = 'css-901oao r-hkyrab r-gwet1z r-1blvdjr r-16dba41 r-ad9z0x r-bcqeeo r-bnwqim r-qvutc0';
    
                if (trans_args.group_info == undefined) trans_args.group_info = "翻译自日文"
                if (trans_args.group_html == undefined) trans_args.group_html = `<p style="color:#1DA1F2; font-size:16px">${trans_args.group_info}</p>`;
    
                let trans_article_html = "";
                if (trans_args.trans_html != undefined) trans_article_html = trans_args.trans_html;
                else if (trans_args.style != undefined && trans_args.style !== "") trans_article_html = `<div style="${trans_args.style};">${trans_args.translation}</div>`
                else {
                    let font = (trans_args.font != undefined || trans_args.font != "") ? trans_args.font : "";
                    let size = (trans_args.size != undefined || trans_args.size != "") ? trans_args.size : "";
                    let color = (trans_args.color != undefined || trans_args.color != "") ? trans_args.color : "black";
                    let background = (trans_args.background != undefined || trans_args.background != "") ? trans_args.background : "";
                    let translation = (trans_args.translation != undefined || trans_args.translation != "") ? trans_args.translation : "你忘了加翻译";
                    let text_decoration = (trans_args.text_decoration != undefined || trans_args.text_decoration !== "") ? trans_args.text_decoration : "";
                    trans_article_html = `<div style="font-family: ${font}; font-size: ${size}; text-decoration: ${text_decoration}; color: ${color}; background: ${background};">${translation}</div>`;
                }
                node_group_info.innerHTML = trans_args.group_html;
                node_trans_article.innerHTML = trans_article_html;
                
                trans_place.appendChild(node_group_info);
                trans_place.appendChild(node_trans_article);
                article.appendChild(trans_place);
    
                document.querySelector("#react-root").scrollIntoView();
            }, trans_args);
            await page.waitFor(1000);
        }
        else {
            await page.evaluate(() => {
                let banner = document.getElementsByTagName('header')[0];
                banner.parentNode.removeChild(banner);
                document.querySelector("#react-root").scrollIntoView();
            });
        }
        let tweet_box = await page.$('article').then((tweet_article) => {return tweet_article.boundingBox()});
        await page.setViewport({
            width: 800,
            height: Math.round(tweet_box.height + 200),
            deviceScaleFactor: 1.5,
        });
        await page.setViewport({
            width: 800,
            height: Math.round(tweet_box.height + 200),
            deviceScaleFactor: 1.5,
        }, trans_args);
        await page.screenshot({
            type : "jpeg",
            quality : 100,
            encoding : "base64",
            clip : {x : tweet_box.x, y : tweet_box.y+2, width : tweet_box.width, height : tweet_box.height-109},
        }).then(pic64 => replyFunc(context, `[CQ:image,file=base64://${pic64}]`));
        await browser.close();
    })().catch(err => {console.log(err); replyFunc(context, "出错惹", true)});
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
        console.log(err.response.data);
        return false;
    });
}

function rtTimeline(context, name, num, option={shot:false, link:false}) {
    searchUser(name).then(user => {
        if (!user) replyFunc(context, "没这人");
        else if (user.protected == true) replyFunc(context, "这人的Twitter受保护");
        else {
            getUserTimeline(user.id_str, 15).then(async timeline => {
                if (timeline.length-1 < num) timeline = await getUserTimeline(user.id_str, 30);
                if(option.shot) tweetShot(context, `https://twitter.com/${user.screen_name}/status/${timeline[num].id_str}`);
                else if (option.link) replyFunc(context, `https://twitter.com/${user.screen_name}/status/${timeline[num].id_str}`, true)
                else format(timeline[num]).then(tweet_string => replyFunc(context, tweet_string));
            }).catch(err => console.log(err));
        }
    })
}

function rtSingleTweet(tweet_id_str, context) {
    getSingleTweet(tweet_id_str).then(tweet => {
        format(tweet).then(tweet_string => replyFunc(context, tweet_string))
    });
}

function cookTweet(context) {
    let {groups : {twitter_url, text}} = /(?<twitter_url>https:\/\/twitter.com\/.+?\/status\/\d+)[>＞](?<text>.+)/i.exec(context.message);

    let translation = text.split(/[>＞](?<!<\/?\w{1,5}>)/)[0];
    let style_options = text.split(/[>＞](?<!<\/?\w{1,5}>)/)[1];
    if (style_options == undefined || style_options == "") {
        tweetShot(twitter_url, {translation:translation});
        return;
    }
    style_options = style_options.split(/[+＋]/);
    let trans_args = {};
    let option = "";
    let style = "";
    let option_map = {
        "颜色" : "color",
        "大小" : "size",
        "字体" : "font-size",
        "装饰" : "text_decoration",
        "背景" : "background",
        "汉化组" : "group_info",
        "group_html" : "group_html",
        "trans_html" : "trans_html",
        "style" : "style",
        "error" : false
    }
    
    for (i in style_options) {
        option = style_options[i].split(/(?<!(style|class))[=＝]/).filter((noEmpty) => {return noEmpty != undefined});
        style = option_map[option[0].replace(" ", "")] || option_map["error"];
        if (!style) {
            replyFunc(context, `没有${option[0]}这个选项`, true);
            return;
        }
        else trans_args[style] = option[1];
    }
    if (trans_args.trans_html == undefined && translation.length <= 0) {
        replyFunc(context, "你没加翻译", true);
        return;
    }
    if(translation.length > 0) trans_args.translation = translation;
    tweetShot(context, twitter_url, trans_args);
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
        let option = option_map[option_nl];
        subscribe(user.id_str, option, context);
        return false;
    }
}

function twitterAggr(context) {
    if (connection && /^看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(置顶)|(最新))?\s?(推特|Twitter)([＞>](截图|链接))?$/i.test(context.message)) {	
		let num = 1;
        let name = "";
        if (/置顶/.test(context.message)) (num = -1);
        else if (/最新/.test(context.message)) (num = 0);
        else if (/上上上条/.test(context.message)) (num = 3);
        else if (/上上条/.test(context.message)) (num = 2);
        else if (/上条/.test(context.message)) (num = 1);
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
        name = /看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(置顶)|(最新))?\s?(推特|Twitter)([＞>](截图|链接))?/i.exec(context.message)[1];
        if (/[＞>]截图/.test(context.message)) rtTimeline(context, name, num, {shot:true});
        else if (/[＞>]链接/.test(context.message)) rtTimeline(context, name, num, {link:true});
        else rtTimeline(context, name, num);
        return true;
	}
    else if (connection && /^看看(推特|Twitter)https:\/\/twitter.com\/.+?\/status\/(\d+)/i.test(context.message)) {
        let tweet_id = /^看看(推特|Twitter)https:\/\/twitter.com\/.+?\/status\/(\d+)/i.exec(context.message)[2];
        rtSingleTweet(tweet_id, context);
        return true;
    }
    else if (connection && /^(推特|Twitter)截图\s?https:\/\/twitter.com\/.+?\/status\/\d+/i.test(context.message)) {
        let twitter_url = /https:\/\/twitter.com\/.+?\/status\/\d+/i.exec(context.message)[0];
        tweetShot(context, twitter_url);
        return true;
    }
    else if (connection && /^烤制\s?https:\/\/twitter.com\/.+?\/status\/\d+.+/i.test(context.message)) {
        cookTweet(context);
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
        let {groups : {name, option_nl}} = /订阅(?<name>.+)的?(推特|Twitter)([>＞](?<option_nl>仅转发|只看图|全部))?/i.exec(context.message);
        if (option_nl == undefined) option_nl = "仅原创"
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
    else return false;
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

firstConnect()

module.exports = {twitterAggr, twitterReply, checkTwiTimeline};
