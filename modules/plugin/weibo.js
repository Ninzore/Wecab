var axios = require('axios');

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
//num 选择需要获取的微博，0为置顶，1为最新，2是次新，以此类推，只允许0到9
function getWeibo(uid, num = 1, mid = 0) {
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
                if (response.data.data.cards[num].card_type == 9) {
                    resolve(response.data.data.cards[num].mblog);
                }
                else {
                    resolve(response.data.data.cards[num + 1].mblog);
                }
            })
            .catch(() => {
                //console.log(error);
            });
        });
}

function checkWeibo(choose = 1, num = 1) {
    return new Promise ((resolve) =>
        getWeibo(choose, 0, num).then(mblog => {
            resolve (mblog.id);
        })
    );
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
                .replace(/<br \/>/g , " ")
                .replace(/&quot;/g , "'")
                .replace(/网页链接/g, "")
                .replace(/\\.*?秒拍视频/g, "");
}

async function rtWeibo(context, replyFunc, choose, name = "", num = 1, uid = 0, mid=0) {
    let mblog;
    if (uid != 0 || mid != 0) {
        mblog = await getWeibo(uid, num, mid);
    }
    else {
        let uid = await getUserId(name, choose);
        mblog = await getWeibo(uid, num);
    }
    let text = textFilter(mblog.text);
    let id = mblog.id;
    if ("pics" in mblog) {
        let pics = mblog.pics;
        for (var pic of pics) {
            pid = pic.pid;
            pic_url = pic.large.url;
            let payload = "[CQ:image,cache=0,file=" + pic_url + "]";
            replyFunc(context, payload);
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
            let payload = "[CQ:image,cache=0,file=" + mblog.page_info.page_pic.url + "]";
            replyFunc(context, payload);
            replyFunc(context, media_src);
        }
    }
        if ("retweeted_status" in mblog) {
            let rt_user_info = mblog.retweeted_status.user.screen_name;
            rtWeiboDetail(mblog.retweeted_status.id, rt_user_info);
            if ("page_info" in mblog.retweeted_status) {
                let rt_page_info = mblog.retweeted_status.page_info;
                if ("media_info" in rt_page_info){
                    let rt_media = mblog.retweeted_status.page_info.media_info;
                    let rt_media_src;
                    if ("hevc_mp4_hd" in rt_media && rt_media.hevc_mp4_hd != "") {
                        media_src = "视频地址: " + rt_media.hevc_mp4_hd;
                    }
                    else if ("h265_mp4_hd" in rt_media && rt_media.h265_mp4_hd != "") {
                        media_src = "视频地址: " + rt_media.h265_mp4_hd;
                    }
                    else if ("mp4_720p_mp4" in rt_media && rt_media.mp4_720p_mp4 != "") {
                        rt_media_src = " 转发视频地址: " + rt_media.mp4_720p_mp4;
                    }
                    else if ("mp4_hd_url" in rt_media && rt_media.mp4_hd_url != "") {
                        rt_media_src = " 转发视频地址: " + rt_media.mp4_hd_url;
                    }
                    else {
                        rt_media_src = " 转发视频地址: " + rt_media.stream_url;
                    }
                    let payload = "[CQ:image,cache=0,file=" + rt_page_info.retweet_video_pic_url + "]";
                    replyFunc(context, payload);
                    replyFunc(context, rt_media_src);
                }
            }
    
    if ("pics" in mblog.retweeted_status) {
        for (var pic of mblog.retweeted_status.pics) {
            pid = pic.pid;
            pic_url = pic.large.url;
            let payload = "[CQ:image,cache=0,file=" + pic_url + "]";
            replyFunc(context, payload);
        }
    }
        }
        
    if (/\.\.\.全文/.exec(text)) {
        //console.log(查看全文);
        rtWeiboDetail(id);
        return
    }
    text = mblog.user.screen_name + ":\n" + text;
    replyFunc(context, text);
}

function rtWeiboDetail(context, replyFunc, id, rt_user_info = "") {
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
        text = "转发自：" + rt_user_info + "\n" + textFilter(text[1]);
        replyFunc(context, text);
    })
    .catch(() => {
        //console.log(error);
    });
}

function rtWeiboByUrl(context, replyFunc, url){
    let temp = /https:\/\/m.weibo.cn\/(\d+)\/(\d+)/.exec(url);
    let user_id = temp[1];
    let mid = temp[2];
    // console.log(user_id);
    // console.log(mid);
    rtWeibo(context, replyFunc, choose = 0, name = "", num = 0, uid = user_id, mid = mid);
}

module.exports = {rtWeibo, rtWeiboByUrl};
