var axios = require('axios');
var mongodb = require('mongodb').MongoClient;

var db_port = 27017;
var db_path = "mongodb://127.0.0.1:" + db_port;

function httpHeader(uid = 0, mid = 0) {
    let containerid = "107603" + uid;
    let since_id = mid;
    // let page_url = "https://m.weibo.cn/u/" + uid;
    // let url = "https://m.weibo.cn/api/container/getIndex";
    
    headers = {
        "Host": "m.weibo.cn",
        "scheme": "https",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
        "Accept":'application/json, text/plain, */*',
        "X-Requested-With":"XMLHttpRequest"
    }

    //携带参数
    if (since_id == 0) {
        params = {
            "value": uid,
            "containerid": containerid,
        };
    }
    else {
        params = {
            "value": uid,
            "containerid": containerid,
            "since_id" : since_id
        };
    }

    payload = {
        headers : headers,
        params : params
    }

    return payload;
}

function getUserId(user_name = "", choose = 0) {
    return new Promise(resolve => {
        //烧钱
        if (choose == 1) resolve(5611537367);
        //方舟
        else if (choose == 2) resolve(6279793937);
        //邦邦
        else if (choose == 3) resolve(6314659177);
        //FF14
        else if (choose == 4) resolve(797798792);
        else {
            // console.log(user_name);
            user_name = encodeURI(user_name);
            axios({
                method:'GET',
                url: "https://m.weibo.cn/api/container/getIndex?containerid=100103type=1&q=",
                headers : {
                    "authority" : "m.weibo.cn",
                    // "path" : "/api/container/getIndex?containerid=100103type%3D1%26q%3D" + user_name,
                    "User-Agent" : "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                    "accept" : "text/html,application/json"
                },
                params : {
                    "containerid": "100103type=1&q=" + user_name,
                }
            }).then(response => {
                if (response.data.data.cards[0].card_group[0].user){
                    resolve(response.data.data.cards[0].card_group[0].user.id);
                }
                else{
                    resolve(response.data.data.cards[0].card_group[0].users[0].id)
                }
            })
            .catch(() => {
                //console.log(error);
            });
        }
    });
}


//choose 选择需要查找的人
//num 选择需要获取的微博，0为置顶或者最新，1是次新，以此类推，只允许0到9
function getWeibo(uid, num = 0, mid = 0) {
    if (mid != 0) {
        headers = httpHeader(uid, mid).headers;
        params = httpHeader(uid, mid).params;
    }
    else{
        headers = httpHeader(uid).headers;
        params = httpHeader(uid).params;
    }
    return new Promise(resolve => {
        axios({
            method:'GET',
            url: "https://m.weibo.cn/api/container/getIndex",
            params : params,
            headers: headers
        }).then(response => {
            if (num == -1) {
                for (let i=0; i<2; i++){
                    if (response.data.data.cards[i].card_type == 9) {
                        if ("isTop" in response.data.data.cards[i].mblog && response.data.data.cards[i].mblog.isTop == 1) {
                            resolve(response.data.data.cards[i].mblog);
                            return;
                        }
                        else{
                            console.log("没有置顶微博")
                        }
                    }
                }
            }
            else {
                let count = 0;
                let card_num_seq = [];
                for (let i=0; i<9; i++){
                    if (response.data.data.cards[i].card_type == 9) {
                        if ("isTop" in response.data.data.cards[i].mblog && response.data.data.cards[i].mblog.isTop == 1) {
                            count--
                        }
                        card_num_seq.push({card_num: i, mid : response.data.data.cards[i].mblog.mid});
                        // console.log(card_num_seq)
                        if (count == num) {
                            card_num_seq.sort(function(a,b){
                                if (a.mid > b.mid) return -1;
                                else return 1;
                            })
                            // console.log(card_num_seq)
                            resolve(response.data.data.cards[card_num_seq[num].card_num].mblog)
                            return 0;
                        } 
                        count++;
                    }
                }
            }
        })
        .catch(() => {
            //console.log(error);
        });
    });
}

//增加订阅
async function addSubscribe(context, replyFunc, choose = null, name = null) {
    let uid = false;
    let group_id = context.group_id;
    if (choose > 0) uid = await getUserId("", choose);
    else if (name.length > 1) uid = await getUserId(name, 0);
    else replyFunc(context, "你名字写对了吗", true);
    if (!uid) replyFunc(context, "查无此人", true);
    else {
        mongodb(db_path, {useUnifiedTopology: true}).connect(async (err, mongo) => {
            if (err) replyFunc(context, "database openning error", true);
            let coll = mongo.db('bot').collection('weibo');
            let weibo = await coll.find({weibo_uid : uid}).toArray();
            if (weibo.length == 0) {
                let mblog = await getWeibo(uid);
                let mid = mblog.mid;
                let screen_name = mblog.user.screen_name;
                coll.insertOne({weibo_uid : uid,
                                name : screen_name,
                                mid : mid,
                                groups : [group_id]},
                    (err) => {
                        if (err) replyFunc(context, "database subscribes update error", true);
                        else {
                            let text = "已订阅" + screen_name + "的微博";
                            replyFunc(context, text, true);
                        }
                    });
            }
            else {
                coll.findOneAndUpdate({weibo_uid : uid},
                                      {$addToSet : {groups : group_id}},
                    (err, result) => {
                        if (err) console.log("database subscribes update error");
                        else {
                            // console.log(result)
                            if (result.value.groups.includes(group_id)) text = "多次订阅有害我的身心健康";
                            else text = "已订阅" + result.value.name + "的微博";
                            replyFunc(context, text, true);
                         }
                     });
            }
            mongo.close();
        });
    }
}

//取消订阅
async function rmSubscribe(context, replyFunc, choose = null, name = null) {
    let uid = false;
    let group_id = context.group_id;
    if (choose > 0) uid = await getUserId("", choose);
    else if (name.length > 1) uid = await getUserId(name, 0);
    else console.log("你名字写了吗");
    if (!uid) console.log("你名字写对了吗");
    else {
        let mblog = await getWeibo(uid);
        let screen_name = mblog.user.screen_name;
        mongodb(db_path, {useUnifiedTopology: true}).connect((err, mongo) => {
            if (err) replyFunc(context, "database openning error", true);
            else {
                let coll = mongo.db('bot').collection('weibo');
                coll.findOneAndUpdate({weibo_uid : uid},
                                      {$pull : {groups : {$in : [group_id]}}},
                    (err, result) => {
                        if (err) replyFunc(context, "database subscribes delete error", true);
                        else {
                            let text = "";
                            if (!result.value.groups.includes(group_id)) text = "小火汁你压根就没订阅嗷";
                            else text = "已取消订阅" + screen_name + "的微博";
                            replyFunc(context, text, true);
                        }
                    mongo.close();
                });
            }
        }).catch(err => console.log(err));
    }
}


//每过x分钟检查一次订阅列表，如果订阅一个微博账号的群的数量是0就删除
function checkWeiboDynamic(replyFunc) {
    setInterval(() => {
        mongodb(db_path, {useUnifiedTopology: true}).connect(async function(err, mongo) {
            if (err) console.log("database openning error during checkWeibo");
            else {
                let coll = mongo.db('bot').collection('weibo');
                let subscribes = await coll.find({}).toArray();
                for (let i = 0; i < subscribes.length; i++) {
                    let id = subscribes[i]._id;
                    if (subscribes[i].groups.length > 0) {
                        let mblog = await getWeibo(subscribes[i].weibo_uid);
                        let last_mid = subscribes[i].mid;
                        let current_mid = mblog.mid;
                        if (current_mid > last_mid) {
                            let groups = subscribes[i].groups;
                            let send_target = {};
                            groups.forEach(group_id => {
                                send_target = {group_id : group_id}
                                weiboSender(send_target, replyFunc, mblog);
                            });
                            coll.updateOne({weibo_uid : subscribes[i].weibo_uid},
                                           {$set : {mid : current_mid}}, 
                                (err, result) => {
                                    if (err) console.log("database update error during checkWeibo");
                                });
                        }
                    }
                    else await coll.findOneAndDelete({_id : id}, (err, result) => {
                        if (err) console.log("database delete error during checkWeibo");
                        else;
                    });
                }
                mongo.close();
            }
        });
    }, 5 * 60000);
}

//输出该群订阅的所有微博名称
function checkSubscribes(context, replyFunc) {
    let group_id = context.group_id;
    mongodb(db_path, {useUnifiedTopology: true}).connect(async function(err, mongo) {
        if (err) replyFunc(context, "database openning error during checkSubscribes", true);
        else {
            let coll = mongo.db('bot').collection('weibo');
            await coll.find({groups : {$elemMatch : {$eq : group_id}}}, {projection: {_id : 0, name : 1}})
                .toArray().then(result => {
                    // console.log(result);
                    if (result.length > 0) {
                        let name_list = [];
                        result.forEach(name_obj => {
                            name_list.push(name_obj.name);
                        });
                        let names = "本群已订阅: " + name_list.join(", ");
                        replyFunc(context, names, true);
                    }
                    else replyFunc(context, "你一无所有", true);
                })
            mongo.close();
        }
    });
}

function textFilter(text) {
    // console.log(text)
    return text .replace(/<a href="\/status\/.*\d">/g, "")
                .replace(/<a href='\/n\/.*?'>/g, "")
                .replace(/<a  href=.*?>/g, "")
                .replace(/<a  href=.*?>(#.*?#)<\/span>/g , "$1")
                .replace(/<a data-url=\\?\"(.*?)\\?\".*?>/g, "$1")
                .replace(/<a data-url=.*?href=\\?"(.*?)".*?>/g, '$1')
                .replace(/<span class=\\"surl-text\\">(.*?)<\/span>/g, " $1")
                .replace(/<img alt=.*?>/g, "")
                .replace(/<img style=.*?>/g, "")
                .replace(/<span.+?span>/g, "")
                .replace(/<\/a>/g, "")
                .replace(/<br \/>/g , "\n")
                .replace(/&quot;/g , "'")
                .replace(/网页链接/g, "")
                .replace(/\\.*?秒拍视频/g, "");
}

async function rtWeibo(context, replyFunc, choose = 1, name = "", num = 0, uid = 0, mid=0) {
    // getUserId(name, choose).then(uid => {
    //     console.log(uid)
    let mblog;
    if (uid != 0 && mid != 0) {
        mblog = await getWeibo(uid, num, mid);
    }
    else if (uid != 0 && mid == 0) {
        mblog = await getWeibo(uid, num);
    }
    else {
        let uid = await getUserId(name, choose);
        mblog = await getWeibo(uid, num);
    }
    weiboSender(context, replyFunc, mblog);
}

async function weiboSender(send_target, replyFunc, mblog) {
    let text = textFilter(mblog.text);
    // console.log(mblog)
    // let text = textFilter(mblog.page_info.content2);
    let id = mblog.id;
    let payload = "";
    if ("pics" in mblog) {
        let pics = mblog.pics;
        for (let pic of pics) {
            pid = pic.pid;
            pic_url = pic.large.url;
            payload += "[CQ:image,cache=0,file=" + pic_url + "]";
        }
    }
    if ("page_info" in mblog) {
        if("media_info" in mblog.page_info){
            let media = mblog.page_info.media_info;
            let media_src = "";
            if ("hevc_mp4_hd" in media && media.hevc_mp4_hd != "") {
                media_src = "视频地址: " + media.hevc_mp4_hd;
            }
            else if ("h265_mp4_hd" in media && media.h265_mp4_hd != "") {
                media_src = "视频地址: " + media.h265_mp4_hd;
            }
            else if ("mp4_720p_mp4" in media && media.mp4_720p_mp4 != "") {
                media_src = "视频地址: " + media.mp4_720p_mp4;
            }
            else if ("mp4_hd_url" in media && media.mp4_hd_url != "") {
                media_src = "视频地址: " + media.mp4_hd_url;
            }
            else {
                media_src = "视频地址: " + media.stream_url;
            }
            payload = "[CQ:image,cache=0,file=" + mblog.page_info.page_pic.url + "]";
        }
    }

    if ("retweeted_status" in mblog) {
        let rt_user_info = mblog.retweeted_status.user.screen_name;
        rtWeiboDetail(send_target, replyFunc, mblog.retweeted_status.id, rt_user_info);

        if ("page_info" in mblog.retweeted_status) {
            let rt_page_info = mblog.retweeted_status.page_info;
            if ("media_info" in rt_page_info){
            let rt_media = mblog.retweeted_status.page_info.media_info;
            let rt_media_src = "";
            if ("mp4_720p_mp4" in rt_media) {
                rt_media_src = " 转发视频地址: " + rt_media.mp4_720p_mp4;
            }
            else if ("mp4_hd_url" in rt_media) {
                rt_media_src = " 转发视频地址: " + rt_media.mp4_hd_url;
            }
            else {
                rt_media_src = " 转发视频地址: " + rt_media.stream_url;
            }
            payload = "[CQ:image,cache=0,file=" + rt_page_info.retweet_video_pic_url + "]";
            }
        }
    
        if ("pics" in mblog.retweeted_status) {
            for (var pic of mblog.retweeted_status.pics) {
                pid = pic.pid;
                pic_url = pic.large.url;
                payload += ("[CQ:image,cache=0,file=" + pic_url + "]");
            }
        }
    }
    if (/\.\.\.全文/.exec(text)) {
        //console.log(查看全文);
        rtWeiboDetail(send_target, replyFunc, id);
        replyFunc(send_target, payload);
        return 0;
    }
    text = mblog.user.screen_name + ":\n" + text + payload + media_src + rt_media_src;
    replyFunc(send_target, text);
}

function rtWeiboDetail(context, replyFunc, id, rt_user_info = null) {
    // console.log(id)
    return new Promise(resolve => {
        axios({
            method:'GET',
            url: "https://m.weibo.cn/detail/" + id,
            headers : {
                "Host": "m.weibo.cn",
                "Referer": "https://m.weibo.cn/u/" + id,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                "Accept":'application/json',
                "X-Requested-With":"XMLHttpRequest"
            }
        }).then(response => {
            // console.log(response.data)
            let text = /text": "(.*)\"/.exec(response.data);
            if (rt_user_info != null){
                text = "转发自：" + rt_user_info + "\n" + textFilter(text[1]);
            }
            else text = textFilter(text[1]);
            replyFunc(context, text);
        })
        .catch(() => {
            //console.log(error);
        });
    });
}

function rtWeiboByUrl(context, replyFunc, url){
    let temp = /https:\/\/m.weibo.cn\/(\d+)\/(\d+)/.exec(url);
    let user_id = temp[1];
    let mid = temp[2];
    rtWeibo(context, replyFunc, choose = 0, name = "", num = 0, uid = user_id, mid = mid);
}

function weiboCheck(context, replyMsg) {
    if (/^看看.+?微博$/gi.test(context.message)) {	
		var num = 1;
        var choose = 0;
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
        if (/(烧钱|少前)/.test(context.message)) (choose = 1);
        else if (/(方舟|明日方舟)/.test(context.message)) (choose = 2);
        else if (/(邦邦)/.test(context.message)) (choose = 3);
        else if (/(FF|狒狒|菲菲)/.test(context.message)) (choose = 4);
        else choose = 0;
        name = /看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(置顶)|(最新))?微博/i.exec(context.message)[1];
        rtWeibo(context, replyMsg, choose, name, num);
        return true;
	}
    else if (/^看看微博\s?https:\/\/m.weibo.cn\/\d+\/\d+$/g.test(context.message)) {
	// replyMsg(context, "pass1")
        let url = /https:\/\/m.weibo.cn\/\d+\/\d+/.exec(context.message)[0];
	   // replyMsg(context, url);
        rtWeiboByUrl(context, replyMsg, url);
        return true;
    }
    else if (/^订阅.+?微博$/gi.exec(context.message)) {
        let choose = 0;
        let name = "";
        if (/(烧钱|少前)/.exec(context.message)) (choose = 1);
        else if (/(方舟|明日方舟)/.exec(context.message)) (choose = 2);
        else if (/(邦邦)/.exec(context.message)) (choose = 3);
        else if (/(FF|狒狒|菲菲)/.exec(context.message)) (choose = 4);
        else name = /^订阅(.+?)微博$/gi.exec(context.message)[1];
        addSubscribe(context, replyMsg, choose, name);
        return true;
    }
    else if (/^取消订阅.+?微博$/g.test(context.message)) {
        let choose = 0;
        let name = "";
        if (/(烧钱|少前)/.test(context.message)) (choose = 1);
        else if (/(方舟|明日方舟)/.test(context.message)) (choose = 2);
        else if (/(邦邦)/.test(context.message)) (choose = 3);
        else if (/(FF|狒狒|菲菲)/.test(context.message)) (choose = 4);
        else name = /^取消订阅(.+?)微博$/gi.exec(context.message)[1];
        rmSubscribe(context, replyMsg, choose, name);
        return true;
    }
    else if (/^查看(订阅微博|微博订阅)$/g.exec(context.message)) {
        checkSubscribes(context, replyMsg);
        return true;
    }
    else return false;
}

module.exports = {weiboCheck, checkWeiboDynamic};
