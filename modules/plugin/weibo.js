import axios from 'axios';
import config from '../config';
const mongodb = require('mongodb').MongoClient;

const admin = parseInt(config.picfinder.admin);

var db_port = 27017;
var db_path = "mongodb://127.0.0.1:" + db_port;
var replyFunc = (context, msg, at = false) => {console.log(msg)};

function weiboReply(replyMsg) {
    replyFunc = replyMsg;
}

/**
* @param {number} uid 用户uid
* @param {number} mid 单条微博mid
* @returns {object} http header
*/
function httpHeader(uid = 0, mid = 0) {
    let containerid = "107603" + uid;
    let since_id = mid;
    
    let headers = {
        "Host": "m.weibo.cn",
        "scheme": "https",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
        "Accept":'application/json, text/plain, */*',
        "X-Requested-With":"XMLHttpRequest",
    }

    let params = {
        "value": uid,
        "containerid": containerid,
    };
    //携带参数
    if (since_id != 0) params["since_id"] = since_id;

    let payload = {
        headers : headers,
        params : params
    }

    return payload;
}

/**
* @param {string} user_name 用户名
* @returns {Promise} number 用户uid，如果搜索不到返回false
*/
function getUserId(user_name = "") {
    user_name = encodeURI(user_name);
    return axios({
        method:'GET',
        url: "https://m.weibo.cn/api/container/getIndex",
        headers : httpHeader().headers,
        params : {
            "containerid" : "100103type=3&q=" + user_name,
            "page_type" : "searchall"
        }
    }).then(response => {
        if (response.data.ok != 1) {
            return false;
        }
        else if (response.data.data.cards.length > 0) return response.data.data.cards[1].card_group[0].user.id;
    })
    .catch(err => {console.error(err);});
}

/**
 * 从用户时间线获取微博
 * @param {number} uid 用户uid
 * @param {number} num 需要获取的微博，-1为查找最新，-2为查找置顶，0为置顶或者最新，1是次新，以此类推，只允许0到9
 * @returns {Promise} 单条微博mblog
*/
function getTimeline(uid, num = -1) {
    let payload = httpHeader(uid);
    return axios({
            method:'GET',
            url: "https://m.weibo.cn/profile/info",
            params : {uid : uid},
            headers: payload.headers
        }).then(response => {
            if (num == -2) {
                if ("isTop" in response.data.data.statuses[0] && response.data.data.statuses[0].isTop == 1) {
                    return response.data.data.statuses[0];
                }
                else response.data.data.statuses[0];
            }
            if (num == -1) {
                let card_num_seq = [0,1,2,3,4,5,6,7,8,9];
                let temp = 0;
                for (let i=0; i<response.data.data.statuses.length - 1; i++) {
                    if (response.data.data.statuses[i].id < response.data.data.statuses[i+1].id) {
                        temp = card_num_seq[i]
                        card_num_seq[i] = card_num_seq[i+1];
                        card_num_seq[i+1] = temp;
                    }
                }
                // console.log(card_num_seq)
                return response.data.data.statuses[card_num_seq[0]];
            }
            else return response.data.data.statuses[num];
        }).catch(err => console.error(err + " weibo getTimeline error, uid= " + uid));
}

/**
 * 增加订阅
 * @param {number} uid 微博用户id
 * @param {string} option 偏好设置
 * @param {object} context
 * @returns {boolean} 错误返回false
 */
function subscribe(uid, option, context) {
    let group_id = context.group_id;
    let option_nl = opt2optnl(option);
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('weibo');
        let weibo = await coll.find({weibo_uid : uid}).toArray();
        if (weibo.length == 0) {
            let mblog = await getTimeline(uid);
            if (mblog == undefined) return false;
            let mid = mblog.mid;
            let screen_name = mblog.user.screen_name;
            coll.insertOne({weibo_uid : uid, name : screen_name, mid : mid, groups : [group_id], [group_id] : option},
                (err) => {
                    if (err) console.error(err + " database subscribes insert error");
                    else replyFunc(context, `已订阅${screen_name}的微博，模式为${option_nl}`, true);
                });
        }
        else {
            coll.findOneAndUpdate({weibo_uid : uid},
                                  {$addToSet : {groups : group_id}, $set : {[group_id] : option}},
                (err, result) => {
                    if (err) console.error(err + " database subscribes update error");
                    else {
                        // console.log(result)
                        if (result.value.groups.includes(group_id)) text = "多次订阅有害我的身心健康";
                        else text = `已订阅${result.value.name}的微博，模式为${option_nl}`;
                        replyFunc(context, text, true);
                        // console.log(text)
                    }
                });
        }
        mongo.close();
    }).catch(err => console.error(err + "weibo subscribe error, uid= " + uid));
}

/**
 * 取消订阅
 * @param {string} name 微博用户名
 * @param {object} context
 * @returns {} no return
 */
function unSubscribe(name, context) {
    let group_id = context.group_id;
    let name_reg = new RegExp(name, 'i')
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('weibo');
        await coll.findOneAndUpdate({name : name_reg},
                                    {$pull : {groups : {$in : [group_id]}}, $unset : {[group_id] : []}},
            async (err, result) => {
                if (err) console.log(err + "database subscribes delete error");
                else {
                    let text = "";
                    if (result.value == null || !result.value.groups.includes(group_id)) text = "小火汁你压根就没订阅嗷";
                    else {
                        text = "已取消订阅" + result.value.name + "的微博";
                        if (result.value.groups.length <= 1) await coll.deleteOne({_id : result.value._id});
                    }
                    replyFunc(context, text, true);
                }
            mongo.close();
        });
    }).catch(err => console.error(err + "weibo unsubscribe error, uid= " + uid));
}

/**
 * 每过x分钟检查一次订阅列表，如果订阅一个微博账号的群的数量是0就删除
 */
function checkWeiboDynamic() {
    let check_interval = 6 * 60 * 1000;
    let i = 0;
    setInterval(() => {
        mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
            let coll = mongo.db('bot').collection('weibo');
            let subscribes = await coll.find({}).toArray();
            mongo.close();
            i = 0;
            checkEach();

            function checkEach() {
                setTimeout(async function() {
                    try{
                        // console.log(subscribes[i].name, `i=${i+1}, len=${subscribes.length}`);
                        let stored_info = subscribes[i];
                        let mblog = await getTimeline(stored_info.weibo_uid);
                        let last_mid = stored_info.mid;
                        let current_mid = mblog.mid;
    
                        if (current_mid > last_mid) {
                            let groups = stored_info.groups;
                            groups.forEach(group_id => {
                                if (checkOption(mblog, stored_info[group_id])) {
                                    format(mblog, true).then(payload => replyFunc({group_id : group_id, message_type : "group"}, payload)).catch(err => console.error(err));
                                }
                                else;
                            });
                            mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
                                let coll = mongo.db('bot').collection('weibo');
                                coll.updateOne({weibo_uid : stored_info.weibo_uid},
                                    {$set : {mid : current_mid}}, 
                                    (err, result) => {
                                        if (err) console.error(err + " database update error during checkWeibo");
                                        mongo.close();
                                    });
                            }).catch(err => console.error(err));
                        }
                        i++;
                        if (i < subscribes.length) checkEach();
                    } catch(err) {
                        console.error(err, '\n', subscribes[i]);
                        i++;
                        if (i < subscribes.length) checkEach();
                    }
                }, (check_interval-subscribes.length*1000)/subscribes.length);
            }
        }).catch(err => console.error(err));
    }, check_interval);

    function checkOption(mblog, option) {
        if (option == "all") return true;
        let status = "";
        if ("retweeted_status" in mblog) status = "with_rt";
        else if (mblog.pic_num > 0 && "pics" in mblog) status = "ori_with_pic";
        else status = "origin"

        if (option == "rt_only" && status == "with_rt") return true;
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
function checkWeiboSubs(context) {
    let group_id = context.group_id;
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('weibo');
        await coll.find({groups : {$elemMatch : {$eq : group_id}}}, {projection: {_id : 0}})
            .toArray().then(result => {
                if (result.length > 0) {
                    let name_list = [];
                    result.forEach(weibo_obj => {
                        let option_nl = "仅原创";
                        option_nl = opt2optnl(weibo_obj[group_id])
                        name_list.push(`${weibo_obj.name}，${option_nl}`);
                    });
                    let subs = "本群已订阅:\n" + name_list.join("\n");
                    replyFunc(context, subs, true);
                }
                else replyFunc(context, "你一无所有", true);
            })
        mongo.close();
    }).catch(err => console.error(err + " weibo checkWeiboSubs error, group_id= " + group_id));
}

/**
 * @param {object} context
 * @returns {} no return
 */
function clearSubs(context, group_id) {
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async mongo => {
        let coll = mongo.db('bot').collection('weibo');
        try {
            let matchs = await coll.find({groups : {$in : [group_id]}}).toArray();
            if (matchs.length < 1) {replyFunc(context, `未见任何微博订阅`); return;}
            for (let item of matchs) {
                let res = await coll.findOneAndUpdate({_id : item._id}, {$pull : {groups : {$in : [group_id]}}, $unset : {[group_id] : []}}, {returnOriginal : false});
                if (res.value.groups.length < 1) await coll.deleteOne({_id : res.value._id});
            }
            replyFunc(context, `清理了${matchs.length}个微博订阅`);
        }
        catch(err) {
            console.error(err);
            replyFunc(context, '中途错误，清理未完成');
        }
        finally {mongo.close();}
    }).catch(err => console.error(err + " weibo checkWeiboSubs error, group_id= " + group_id));
}

/**
 * @param {string} text 需要过滤的html
 * @returns {string} 处理完成
 */
function textFilter(text) {
    // console.log(text)
    return text.replace(/[\r\n]/g, "")
                .replace(/<a href="\/status\/.*\d">/g, "")
                .replace(/<a href='\/n\/.+?'>(.+?)<\/a>/g, "$1")  //@
                .replace(/<a  href="https:\/\/m.weibo.cn\/search.+?<span class="surl-text">(.+?)<\/span><\/a>/g, "$1")  //tag
                .replace(/<a  href="https:\/\/m.weibo.cn\/p\/index\?extparam.+?<span class="surl-text">(.+?)<\/span><\/a>/g, "[$1超话]")  //超话
                .replace(/<span class="url-icon"><img alt=(\[.+?\]).+?\/><\/span>/g, "$1")  //表情
                .replace(/<a data-url=\\?\"(.*?)\\?\".*?<\/a>/g, "$1")
                .replace(/<a data-url=.*?href=\\?"(.*?)".*?>/g, '$1')
                .replace(/<img style=.*?>/g, "")
                .replace(/<span.+?span>/g, "")
                .replace(/<a.+<\/a>/g, "")
                .replace(/<br \/>/g , "\n")
                .replace(/&quot;/g , "'")
                .replace(/&gt;/g , ">")
                .replace(/&lt;/g , "<")
                .replace(/网页链接/g, "")
                .replace(/\\.*?秒拍视频/g, "");
}

/**
* @param {object} mblog 单条微博mblog，可以是Promise
* @param {boolean} textForm 是否整理为成string
* @returns {Promise} Promise，由文字，图片，链接集合的单条微博的array或string
*/
async function format(mblog, textForm = false) {
    mblog = await mblog;
    let payload = [`${mblog.user.screen_name}的微博`];
    let text = mblog.text;
    if (/<a.+>全文<\/\a>/.test(text)) text = await weiboText(mblog.id);
    payload.push(textFilter(text));
    if ("pics" in mblog) {
        let pics = mblog.pics;
        let pic_str = "";
        let pic_url = "";
        for (let pic of pics) {
            pic_url = pic.large.url;
            pic_str += `[CQ:image,cache=0,file=${pic_url}]`;
        }
        payload.push(pic_str);
    }
    if ("page_info" in mblog) {
        if("media_info" in mblog.page_info){
            let media = mblog.page_info.media_info;
            let media_src = "视频地址: ";
            if ("hevc_mp4_hd" in media && media.hevc_mp4_hd != "") media_src += media.hevc_mp4_hd;
            else if ("h265_mp4_hd" in media && media.h265_mp4_hd != "") media_src += media.h265_mp4_hd;
            else if ("mp4_720p_mp4" in media && media.mp4_720p_mp4 != "") media_src += media.mp4_720p_mp4;
            else if ("mp4_hd_url" in media && media.mp4_hd_url != "") media_src += media.mp4_hd_url;
            else media_src += media.stream_url;
            payload.push(`[CQ:image,cache=0,file=${mblog.page_info.page_pic.url}]`, media_src);
        }
    }

    if ("retweeted_status" in mblog) {
        let rt_weibo = await format(mblog.retweeted_status);
        payload = payload.concat("转发自: " + rt_weibo)
    }
    // console.log(payload)
    if (textForm = true) payload = payload.join("\n");
    return payload;
}

/**
 * @param {string} option 偏好设置
 * @returns {string} 中文偏好设置 
 */
function opt2optnl(option = "origin") {
    let option_nl = "仅原创"
    switch (option) {
        case "origin": option_nl = "仅原创"; break;
        case "rt_only": option_nl = "仅转发"; break;
        case "pic_only": option_nl = "只看图"; break;
        case "all": option_nl = "全部"; break;
        default: break;
    }
    return option_nl;
}

/**
 * @param {string} option_nl 中文偏好设置
 * @returns {string} 偏好设置 
 */
function optnl2opt(option_nl = "仅原创") {
    let option = "origin";
    switch (option_nl) {
        case "仅原创": option = "origin"; break;
        case "仅转发": option = "rt_only"; break;
        case "只看图": option = "pic_only"; break;
        case "全部": option = "all"; break;
        default: break;
    }
    return option;
}

/**
 * @param {string} id 微博id
 * @returns {Promise} 单条微博的完整文字部分
 */
function weiboText(id) {
    return axios.get("https://m.weibo.cn/statuses/extend?id=" + id, {headers : httpHeader().headers})
                .then(res => res.data.data.longTextContent)
                .catch(err => {return err.response.status})
}

/**
 * @param {string} id 微博id
 * @param {object} context
 * @returns {} no return
 */
function rtSingleWeibo(id, context) {
    axios.get("https://m.weibo.cn/statuses/show?id=" + id, {headers : httpHeader().headers}).then(async res => {
        let payload = await format(res.data.data, true);
        replyFunc(context, payload);
    }).catch(err => console.error(err));
}

/**
 * 通过用户名添加订阅
 * @param {string} name 微博用户名
 * @param {string} option_nl 偏好设置，可以是"仅原创"，"包含转发"，"仅带图"
 * @param {object} context
 * @returns {boolean} 成功返回true
 */
async function addSubByName(name, option_nl, context) {
    let uid = await getUserId(name);
    if (!uid) {
        replyFunc(context, "没这人", true);
        return true;
    }
    else {
        let option = optnl2opt(option_nl)
        subscribe(uid, option, context);
        return false;
    }
}

/**
 * 通过用户uid添加订阅
 * @param {string} url 单条微博url m.weibo.cn
 * @param {string} option_nl 偏好设置，可以是"仅原创"，"包含转发"，"仅带图"
 * @param {object} context
 */
function addSubByUid(url, option_nl, context) {
    axios.get(url, {params : httpHeader().headers}).then(res => {
        let temp = /https:\/\/m.weibo.cn(\/(\d+)\/\d+|\/u\/(\d+))/.exec(url);
        let uid = temp[2] ? temp[2] : temp[3]
        let option = optnl2opt(option_nl);
        subscribe(uid, option, context);
    }).catch(err => {
        replyFunc(context, "无法订阅这个人", true);
        console.error(err);
    });
}

/**
 * @param {string} name 微博用户名
 * @param {number} num 需要获取的微博，-1为查找最新，-2为查找置顶，0为置顶或者最新，1是次新，以此类推，最高到9
 * @returns {} no return
 */
function rtWeibo(name, num, context) {
    getUserId(name).then(uid => {
        if (uid) getTimeline(uid, num).then(res => {
            format(res).then(payload => {
                replyFunc(context, payload);
            }).catch(err => {console.error(err); replyFunc(context, "中途错误", true);});
        }).catch(err => {console.error(err); replyFunc(context, "等下再试", true);});
        else replyFunc(context, "查无此人", true);
    }).catch(err => {console.error(err); replyFunc(context, "中途错误", true);});
}

/**
 * @param {object} context 
 * @returns {boolean} 如果是这里的功能，返回true，否则为false
 */
function weiboAggr(context) {
    if (/^看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(置顶)|(最新))?微博/.test(context.message)) {	
		let num = 1;
        let name = "";
        if (/置顶/.test(context.message)) (num = -1);
        else if (/最新/.test(context.message)) (num = 0);
        else if (/上上上条/.test(context.message)) (num = 3);
        else if (/上上条/.test(context.message)) (num = 2);
        else if (/上条/.test(context.message)) (num = 1);
	    else if (/第.+?条/.test(context.message)) {
            let temp = /第([0-9]|[一二三四五六七八九])条/.exec(context.message)[1];
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
        else num = -1;       
        name = /看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(置顶)|(最新))?微博/.exec(context.message)[1];
        rtWeibo(name, num, context);
        return true;
	}
    else if (/^看看\s?https:\/\/m.weibo.cn\/\d+\/\d+$/.test(context.message)) {
        let id = /https:\/\/m.weibo.cn\/\d+\/(\d+)/.exec(context.message)[1];
        rtSingleWeibo(id, context);
        return true;
    }
    else if (/^\[CQ:rich.+"appid":"1109224783".+"qqdocurl":".+?(\d+)\?/.test(context.message)) {
        let id = /^\[CQ:rich.+"appid":"1109224783".+"qqdocurl":".+?(\d+)\?/.exec(context.message)[1];
        rtSingleWeibo(id, context);
        return true;
    }
    else if (/^订阅.+的?微博([>＞](仅转发|只看图|全部))?/.test(context.message)) {
        let {groups : {name, option_nl}} = /订阅(?<name>.+)的?微博([>＞](?<option_nl>仅转发|只看图|全部))?/.exec(context.message);
        if (option_nl == undefined) option_nl = "仅原创"
        addSubByName(name, option_nl, context);
        return true;
    }
    else if (/^订阅微博\s?https:\/\/m.weibo.cn.+([>＞](仅转发|只看图|全部))?/.test(context.message)) {
        let {groups : {url, option_nl}} = /(?<url>https:\/\/m.weibo.cn.+)([>＞](?<option_nl>仅转发|只看图|全部))?/.exec(context.message);
        if (option_nl == undefined) option_nl = "仅原创"
        addSubByUid(url, option_nl, context);
        return true;
    }
    else if (/^取消订阅.+的?微博$/.test(context.message)) {
        let name = /取消订阅(.+)的?微博/i.exec(context.message)[1];
        unSubscribe(name, context);
        return true;
    }
    else if (/^查看(订阅微博|微博订阅)$/.test(context.message)) {
        checkWeiboSubs(context);
        return true;
    }
    else if (/^清空微博订阅$/.test(context.message)) {
        if (/owner|admin/.test(context.sender.role) || context.user_id == admin) clearSubs(context, context.group_id);
        else replyFunc(context, '您配吗？');
        return true;
    }
    else return false;
}

export default {weiboAggr, checkWeiboDynamic, weiboReply, clearSubs};
