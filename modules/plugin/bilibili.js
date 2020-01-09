var axios = require('axios');

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
        }).catch(() => {
            //console.log(error);
        });
}

//choose 选择需要查找的人
//num 选择需要获取的微博，0为置顶或者最新，1是次新，以此类推，只允许0到9
function getDynamicList(uid, num = 0) {
    let header = httpHeader(uid);
    return axios(header).then(response => {
            // console.log(card)
            return (response.data.data.cards[num])
        })
        .catch(() => {
            //console.log(error);
        });
}

function getDynamicDetail(dynamic_id = "") {
    let header = httpHeader(0, dynamic_id, 0);
    return axios(header).then(response => {
            // console.log(JSON.parse(response.data.data.card.card))
            return response.data.data.card;
        })
        .catch(() => {
            //console.log(error);
        });
}

function dynamicProcess(dynamic) {
    let card = JSON.parse(dynamic.card);
    let text = "";
    let name = "";
    let pics = [];
    let video = "";
    let rt_dynamic = 0;
    // console.log(card)
    if ("user" in card){
        if ("uname" in card.user) name = card.user.uname;
        else if ("name" in card.user) name = card.user.name;
    }
    
    //投稿
    if ("videos" in card) {
        name = card.owner.name;
        text = card.dynamic;
        // console.log(card)
        video = "发布视频:\n" + card.title
    }
    else if ("item" in card) {
        //小视频
        if ("video_playurl" in card.item) {
            video = card.item.video_playurl;
            text = card.item.description;
            console.log(video_playurl);
        }
        //通常
        else{
            if ("content" in card.item) text = card.item.content;
            if ("pictures" in card.item) {
                if ("description" in card.item) text = card.item.description;
                let pictures = card.item.pictures;
                for (let pic of pictures) pics.push(pic.img_src);    
            }
            if ("origin" in card) {
                let origin = card.origin
                // console.log(origin)
                rt_dynamic = dynamicProcess({card : origin}, 0);
                // console.log(rt_dynamic)
            }
        }
    }
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

function sender(context, replyFunc, dynamicObj = {}, others = "") {
    let payload = "";
    // console.log(dynamicObj)
    if (dynamicObj != {}) {
        let pics = dynamicObj.pics.join("\n");
        payload = dynamicObj.name + ":\n" + dynamicObj.text + ":\n" + pics + ":\n" +dynamicObj.video;
        if (dynamicObj.rt_dynamic != 0) {
            let rt_dynamic = dynamicObj.rt_dynamic
            pics = rt_dynamic.pics.join("\n");
            payload += "\n转发自 " + rt_dynamic.name + ":\n" + rt_dynamic.text + ":\n" + pics + ":\n" +rt_dynamic.video;
        }
        replyFunc(context, payload)
    }
    else {
        console.log(others)
    }
}

function rtBilibili(context, replyFunc, name = "", num = 0, dynamic_id = "") {
    if (dynamic_id != "") {
        getDynamicDetail(dynamic_id).then(dynamic => {
            let clean_dynamic = dynamicProcess(dynamic);
            sender(context, replyFunc, clean_dynamic, "");
        })
    }
    else if (name != "") {
        searchName(name).then(name_card => {
            // console.log(name_card)
            getDynamicList(name_card.mid, num).then(dynamic => {
                // console.log(dynamic)
                let clean_dynamic = dynamicProcess(dynamic);
                sender(context, replyFunc, clean_dynamic, "");
            });
        });
    }
    else {
        console.log("error")
    }
}

function rtBiliByUrl(context, replyFunc, url){
    let dynamic_id = /https:\/\/t.bilibili.com\/(\d+)/.exec(url)[1];
    rtBilibili(context, replyFunc, "", 0, dynamic_id);
}

module.exports = {rtBilibili, rtBiliByUrl};
