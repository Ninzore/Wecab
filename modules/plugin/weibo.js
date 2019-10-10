var axios = require('axios');
var CQcode = require('../CQcode');

//示例:
//https://m.weibo.cn/api/container/getIndex?type=uid&value=6279793937&containerid=1076036279793937&page=2
function httpHeader(choose) {
    if (choose == 1){
        //烧钱
        uid = 5611537367;
        containerid = 1076035611537367;
        page_url = "https://m.weibo.cn/u/5611537367";
    }
    else if (choose == 2) {
        //方舟
        uid = 6279793937;
        containerid = 1076036279793937;
        page_url = "https://m.weibo.cn/u/6279793937";
    }
    else if (choose == 3) {
        //邦邦
        uid = 6314659177;
        containerid = 1076036314659177;
        page_url = "https://m.weibo.cn/u/6314659177";
    }
    else if (choose == 4) {
        //FF14
        uid = 1797798792;
        containerid = 1076031797798792;
        page_url = "https://m.weibo.cn/u/1797798792";
    }

    url = "https://m.weibo.cn/api/container/getIndex";

    headers = {
        "Host": "m.weibo.cn",
        "Referer": "https://m.weibo.cn/u/" + uid,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
        "Accept":'application/json, text/plain, */*',
        "X-Requested-With":"XMLHttpRequest"
    }

    //携带参数
    params = {
            "type": "uid",
            "value": uid,
            "containerid": containerid,
            "page": "1"
            };
    payload = {
        headers : headers,
        params : params
    }

    return payload;
}

//choose 选择需要查找的人
//num 选择需要获取的微博，0为置顶，1为最新，2是次新，以此类推，只允许0到9
function getWeibo(choose = 1, num = 1) {
    headers = httpHeader(choose).headers;
    params = httpHeader(choose).params;
    return new Promise(resolve => {
        axios({
            method:'GET',
            url: "https://m.weibo.cn/api/container/getIndex",
            params : params,
            headers: headers
        }).then(response => {
                resolve(response.data.data.cards[num].mblog);
        })
        .catch(() => {
            //console.log(error);
            return false;
        });
    });
}

function textFilter(text) {
    return text.replace(/<a  href=.*?>(#.*?#)<\/span><\/a>/g , "$1")
                .replace(/<a href="\/status\/.*\d">/g, "")
                .replace(/<a href='\/n\/.*?'>/g, "")
                .replace(/<a  href=.*?>/g, "")
                .replace(/<a data-url=.*?微博视频/g, "")
                .replace(/<a data-url=.*?href=\\?"(.*?)".*?>/g, '$1')
                .replace(/<span class=\\"surl-text\\">(.*?)<\/span>/g, " $1")
                .replace(/<img alt=.*?>/g, "")
                .replace(/<img style=.*?<\/span>/g, "")
                .replace(/<\/?span.*?>/g, "")
                .replace(/<\/a>/g, "")
                .replace(/<br \/>/g , "\r")
                .replace(/&quot;/g , "'")
                .replace(/网页链接/g, "")
                .replace(/\\.*?秒拍视频/g, "");
}

function rtWeibo(context, replyFunc, choose = 1, num = 1) {
    // message = "choose=" + choose + "\rnum=" + num;
	// replyFunc(context, message);
    getWeibo(choose, num).then(mblog => {
        //replyFunc(context, "test_2 pass");
        let text = textFilter(mblog.text);
        let pics = mblog.pics;
        let id = mblog.id;
        if (mblog.page_info) {
            let media = mblog.page_info.media_info;
            if (media.mp4_720p_mp4) {
                text += " 视频地址: " + media.mp4_720p_mp4;
            }
            if (media.mp4_hd_url) {
                text += " 视频地址: " + media.mp4_hd_url;
            }
            else {text += " 视频地址: " + media.h5_url;}
            let payload = "[CQ:image,cache=0,file=" + mblog.page_info.page_pic.url + "]";
            replyFunc(context, payload);
        }
        if (mblog.retweeted_status) {
            let rt_user_info = mblog.retweeted_status.user.screen_name;
            if (mblog.retweeted_status.page_info.media_info) {
                let rt_media = mblog.retweeted_status.page_info.media_info;
                if (rt_media.mp4_720p_mp4) {
                    text += " 转发视频地址: " + rt_media.mp4_720p_mp4;
                }
                else if (rt_media.mp4_hd_url) {
                    text += " 转发视频地址: " + rt_media.mp4_hd_url;
                }
                else {text += " 转发视频地址: " + rt_media.h5_url;}
                let retweet_video_pic_url = "[CQ:image,cache=0,file=" + mblog.retweeted_status.page_info.page_pic.url + "]";
                replyFunc(context, retweet_video_pic_url);
            }
            if (mblog.retweeted_status.pics) {
                for (var pic of mblog.retweeted_status.pics) {
                    let pic_url = pic.large.url;
                    let payload = "[CQ:image,cache=0,file=" + pic_url + "]";
                    replyFunc(context, payload);
                }
                let retweet_pic_url = "[CQ:image,cache=0,file=" + mblog.retweeted_status.bmiddle_pic + "]";
                replyFunc(context, retweet_pic_url);
            }
            rtWeiboDetail(context, replyFunc, mblog.retweeted_status.id, rt_user_info);
        }
        if (pics) {
            for (var pic of pics) {
                let pic_url = pic.large.url;
                let payload = "[CQ:image,cache=0,file=" + pic_url + "]";
                replyFunc(context, payload);
            }
        }
        if (/\.\.\.全文/.exec(text)) {
            rtWeiboDetail(context, replyFunc, id);
            return
        }
        //console.log(text);
        replyFunc(context, text);
        //replyFunc(context, "test_3 pass");
    });
}

function rtWeiboDetail(context, replyFunc, id, rt_user_info = "") {
    axios({
        method:'GET',
        url: "https://m.weibo.cn/detail/" + id,
        headers : {
            "Host": "m.weibo.cn",
            "Referer": "https://m.weibo.cn/u/" + id,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            "Accept":'application/json, text/plain, */*',
            "X-Requested-With":"XMLHttpRequest"
        }
    }).then(response => {
        //console.log(response.data)
        let text = /text": "(.*)\"/.exec(response.data);
        if (rt_user_info != "") text = "转发自：" + rt_user_info + "\r" + textFilter(text[1]);
        else text = textFilter(text[1]);
        replyFunc(context, text);
        //console.log(text)
    })
    .catch(() => {
        //console.log(error);
    });
}

function checkWeibo(choose = 1, num = 1) {
    return new Promise ((resolve) =>
        getWeibo(choose, num).then(mblog => {
            resolve (mblog.id);
        })
    );
}

// function weiboChecker(context, replyFunc) {
//     var shaoQian = {
//         id : 0,
//         new_id : 0
//     };
//     var fangZou = {
//         id : 0,
//         new_id : 0
// 	};
// 	replyMsg(context, "已设置自动获取微博");
//     async function ticker() {
// 		setInterval(ticker, 20000);
//         shaoQian.new_id = await weibo.checkWeibo(1, 1);
//         // console.log(shaoQian.new_id);
//         // console.log(fangZou.new_id);
//         if (shaoQian.id == shaoQian.new_id) {
// 			//console.log("烧钱没发");
// 			message = "烧钱id= " + shaoQian.new_id;
// 			replyMsg(context, message);
//         }
//         else if (shaoQian.id != shaoQian.new_id) {
//             shaoQian.id = shaoQian.new_id;
//             weibo.rtWeibo(context, replyFunc, choose = 1, num = 1);
// 			// console.log("烧钱发了");
// 			message = "烧钱新微博id= " + shaoQian.new_id;
// 			replyMsg(context, message);
// 		}
// 		fangZou.new_id = await weibo.checkWeibo(2, 1);
//         if (fangZou.id == fangZou.new_id) {
// 			// console.log("方舟没发");
// 			replyMsg(context, "方舟没发");
// 			message = "方舟微博id= " + shaoQian.new_id;
// 			replyMsg(context, message);
//         }
//         else if (fangZou.id != fangZou.new_id) {
//             fangZou.id = fangZou.new_id;
//             weibo.rtWeibo(context, replyFunc, choose = 2, num = 1);
// 			// console.log("方舟发了");
// 			message = "烧钱新微博id= " + shaoQian.new_id;
// 			replyMsg(context, message);
//         }
//     }
//     ticker()
// }

module.exports = {rtWeibo, checkWeibo}