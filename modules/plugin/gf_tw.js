var axios = require('axios');

function getRes(url) {
    return new Promise(resolve => {
        axios({
            method:'GET',
            url: url,
            headers : {
                "Host": "gf.txwy.tw",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36"
            }
        }).then(response => {
                resolve(response.data);
        })
        .catch(() => {
            //console.log(error);

            return false;
        });
    });
}

function getDollPics(context, replyFunc) {
    //replyFunc(context, "test_2_pass");
    let url_archive = "https://gf.txwy.tw/archives/category/news";
    getRes(url_archive).then(data => {
        // var html = new DOMParser().parseFromString(data, 'text/html')
        // console.log(html);
        let new_doll_url = /(https:\/\/gf\.txwy\.tw\/archives\/\d{4}.html).*【情報】全新戰術人形公開/.exec(data);
        return new_doll_url[1];
        //console.log(new_doll_url);
    }).then(doll_url => {
        getRes(doll_url).then(data => {
            //replyFunc(context, "test_3_pass");
            patt = /https:\/\/twcdn.imtxwy.com\/tw\/gf\/banner\/news\d{4}\.jpg/g;
            var doll_pics;
            while ((doll_pics = patt.exec(data)) !== null) {
                // console.log(doll_pics[0]);
                payload = "[CQ:image,cache=0,file=" + doll_pics[0] + "]";
                replyFunc(context, payload);
              }
            //console.log(doll_pics[i]);
            //console.log(data);
        })
        //console.log(doll_url);
    })
}

function getSkinPics(context, replyFunc) {
    //replyFunc(context, "test_2_pass");
    let url_archive = "https://gf.txwy.tw/archives/category/news";
    getRes(url_archive).then(data => {
        // var html = new DOMParser().parseFromString(data, 'text/html')
        // console.log(html);
        let new_skin_url = /(https:\/\/gf\.txwy\.tw\/archives\/\d{4}.html).*主題裝扮/.exec(data);
        return new_skin_url[1];
        //console.log(new_skin_url);
    }).then(skin_url => {
        getRes(skin_url).then(data => {
            //replyFunc(context, "test_3_pass");
            patt = /https:\/\/twcdn.imtxwy.com\/tw\/gf\/banner\/news\d{4}\.jpg/g;
            var skin_pics;
            while ((skin_pics = patt.exec(data)) !== null) {
                // console.log(skin_pics[0]);
                payload = "[CQ:image,cache=0,file=" + skin_pics[0] + "]";
                replyFunc(context, payload);
              }
            //console.log(skin_pics[i]);
            //console.log(data);
        })
        //console.log(doll_url);
    })
}

module.exports = {getDollPics, getSkinPics};