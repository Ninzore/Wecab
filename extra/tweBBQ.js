const puppeteer = require('puppeteer');

const twemoji_reg = new RegExp(/(?:\ud83d\udc68\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffc-\udfff]|\ud83d\udc68\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffd-\udfff]|\ud83d\udc68\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc68\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffd\udfff]|\ud83d\udc68\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffe]|\ud83d\udc69\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffc-\udfff]|\ud83d\udc69\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffc-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffd-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb\udffd-\udfff]|\ud83d\udc69\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc69\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc69\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffd\udfff]|\ud83d\udc69\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb-\udffd\udfff]|\ud83d\udc69\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffe]|\ud83d\udc69\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb-\udffe]|\ud83e\uddd1\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\u200d\ud83e\udd1d\u200d\ud83e\uddd1|\ud83d\udc6b\ud83c[\udffb-\udfff]|\ud83d\udc6c\ud83c[\udffb-\udfff]|\ud83d\udc6d\ud83c[\udffb-\udfff]|\ud83d[\udc6b-\udc6d])|(?:\ud83d[\udc68\udc69]|\ud83e\uddd1)(?:\ud83c[\udffb-\udfff])?\u200d(?:\u2695\ufe0f|\u2696\ufe0f|\u2708\ufe0f|\ud83c[\udf3e\udf73\udf7c\udf84\udf93\udfa4\udfa8\udfeb\udfed]|\ud83d[\udcbb\udcbc\udd27\udd2c\ude80\ude92]|\ud83e[\uddaf-\uddb3\uddbc\uddbd])|(?:\ud83c[\udfcb\udfcc]|\ud83d[\udd74\udd75]|\u26f9)((?:\ud83c[\udffb-\udfff]|\ufe0f)\u200d[\u2640\u2642]\ufe0f)|(?:\ud83c[\udfc3\udfc4\udfca]|\ud83d[\udc6e\udc70\udc71\udc73\udc77\udc81\udc82\udc86\udc87\ude45-\ude47\ude4b\ude4d\ude4e\udea3\udeb4-\udeb6]|\ud83e[\udd26\udd35\udd37-\udd39\udd3d\udd3e\uddb8\uddb9\uddcd-\uddcf\uddd6-\udddd])(?:\ud83c[\udffb-\udfff])?\u200d[\u2640\u2642]\ufe0f|(?:\ud83d\udc68\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68|\ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d[\udc68\udc69]|\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\u2764\ufe0f\u200d\ud83d\udc68|\ud83d\udc68\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc68\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\u2764\ufe0f\u200d\ud83d[\udc68\udc69]|\ud83d\udc69\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d[\udc66\udc67]|\ud83c\udff3\ufe0f\u200d\u26a7\ufe0f|\ud83c\udff3\ufe0f\u200d\ud83c\udf08|\ud83c\udff4\u200d\u2620\ufe0f|\ud83d\udc15\u200d\ud83e\uddba|\ud83d\udc3b\u200d\u2744\ufe0f|\ud83d\udc41\u200d\ud83d\udde8|\ud83d\udc68\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\ud83d[\udc66\udc67]|\ud83d\udc6f\u200d\u2640\ufe0f|\ud83d\udc6f\u200d\u2642\ufe0f|\ud83e\udd3c\u200d\u2640\ufe0f|\ud83e\udd3c\u200d\u2642\ufe0f|\ud83e\uddde\u200d\u2640\ufe0f|\ud83e\uddde\u200d\u2642\ufe0f|\ud83e\udddf\u200d\u2640\ufe0f|\ud83e\udddf\u200d\u2642\ufe0f|\ud83d\udc08\u200d\u2b1b)|[#*0-9]\ufe0f?\u20e3|(?:[©®\u2122\u265f]\ufe0f)|(?:\ud83c[\udc04\udd70\udd71\udd7e\udd7f\ude02\ude1a\ude2f\ude37\udf21\udf24-\udf2c\udf36\udf7d\udf96\udf97\udf99-\udf9b\udf9e\udf9f\udfcd\udfce\udfd4-\udfdf\udff3\udff5\udff7]|\ud83d[\udc3f\udc41\udcfd\udd49\udd4a\udd6f\udd70\udd73\udd76-\udd79\udd87\udd8a-\udd8d\udda5\udda8\uddb1\uddb2\uddbc\uddc2-\uddc4\uddd1-\uddd3\udddc-\uddde\udde1\udde3\udde8\uddef\uddf3\uddfa\udecb\udecd-\udecf\udee0-\udee5\udee9\udef0\udef3]|[\u203c\u2049\u2139\u2194-\u2199\u21a9\u21aa\u231a\u231b\u2328\u23cf\u23ed-\u23ef\u23f1\u23f2\u23f8-\u23fa\u24c2\u25aa\u25ab\u25b6\u25c0\u25fb-\u25fe\u2600-\u2604\u260e\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262a\u262e\u262f\u2638-\u263a\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267b\u267f\u2692-\u2697\u2699\u269b\u269c\u26a0\u26a1\u26a7\u26aa\u26ab\u26b0\u26b1\u26bd\u26be\u26c4\u26c5\u26c8\u26cf\u26d1\u26d3\u26d4\u26e9\u26ea\u26f0-\u26f5\u26f8\u26fa\u26fd\u2702\u2708\u2709\u270f\u2712\u2714\u2716\u271d\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u2764\u27a1\u2934\u2935\u2b05-\u2b07\u2b1b\u2b1c\u2b50\u2b55\u3030\u303d\u3297\u3299])(?:\ufe0f|(?!\ufe0e))|(?:(?:\ud83c[\udfcb\udfcc]|\ud83d[\udd74\udd75\udd90]|[\u261d\u26f7\u26f9\u270c\u270d])(?:\ufe0f|(?!\ufe0e))|(?:\ud83c[\udf85\udfc2-\udfc4\udfc7\udfca]|\ud83d[\udc42\udc43\udc46-\udc50\udc66-\udc69\udc6e\udc70-\udc78\udc7c\udc81-\udc83\udc85-\udc87\udcaa\udd7a\udd95\udd96\ude45-\ude47\ude4b-\ude4f\udea3\udeb4-\udeb6\udec0\udecc]|\ud83e[\udd0c\udd0f\udd18-\udd1c\udd1e\udd1f\udd26\udd30-\udd39\udd3d\udd3e\udd77\uddb5\uddb6\uddb8\uddb9\uddbb\uddcd-\uddcf\uddd1-\udddd]|[\u270a\u270b]))(?:\ud83c[\udffb-\udfff])?|(?:\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc65\udb40\udc6e\udb40\udc67\udb40\udc7f|\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc73\udb40\udc63\udb40\udc74\udb40\udc7f|\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc77\udb40\udc6c\udb40\udc73\udb40\udc7f|\ud83c\udde6\ud83c[\udde8-\uddec\uddee\uddf1\uddf2\uddf4\uddf6-\uddfa\uddfc\uddfd\uddff]|\ud83c\udde7\ud83c[\udde6\udde7\udde9-\uddef\uddf1-\uddf4\uddf6-\uddf9\uddfb\uddfc\uddfe\uddff]|\ud83c\udde8\ud83c[\udde6\udde8\udde9\uddeb-\uddee\uddf0-\uddf5\uddf7\uddfa-\uddff]|\ud83c\udde9\ud83c[\uddea\uddec\uddef\uddf0\uddf2\uddf4\uddff]|\ud83c\uddea\ud83c[\udde6\udde8\uddea\uddec\udded\uddf7-\uddfa]|\ud83c\uddeb\ud83c[\uddee-\uddf0\uddf2\uddf4\uddf7]|\ud83c\uddec\ud83c[\udde6\udde7\udde9-\uddee\uddf1-\uddf3\uddf5-\uddfa\uddfc\uddfe]|\ud83c\udded\ud83c[\uddf0\uddf2\uddf3\uddf7\uddf9\uddfa]|\ud83c\uddee\ud83c[\udde8-\uddea\uddf1-\uddf4\uddf6-\uddf9]|\ud83c\uddef\ud83c[\uddea\uddf2\uddf4\uddf5]|\ud83c\uddf0\ud83c[\uddea\uddec-\uddee\uddf2\uddf3\uddf5\uddf7\uddfc\uddfe\uddff]|\ud83c\uddf1\ud83c[\udde6-\udde8\uddee\uddf0\uddf7-\uddfb\uddfe]|\ud83c\uddf2\ud83c[\udde6\udde8-\udded\uddf0-\uddff]|\ud83c\uddf3\ud83c[\udde6\udde8\uddea-\uddec\uddee\uddf1\uddf4\uddf5\uddf7\uddfa\uddff]|\ud83c\uddf4\ud83c\uddf2|\ud83c\uddf5\ud83c[\udde6\uddea-\udded\uddf0-\uddf3\uddf7-\uddf9\uddfc\uddfe]|\ud83c\uddf6\ud83c\udde6|\ud83c\uddf7\ud83c[\uddea\uddf4\uddf8\uddfa\uddfc]|\ud83c\uddf8\ud83c[\udde6-\uddea\uddec-\uddf4\uddf7-\uddf9\uddfb\uddfd-\uddff]|\ud83c\uddf9\ud83c[\udde6\udde8\udde9\uddeb-\udded\uddef-\uddf4\uddf7\uddf9\uddfb\uddfc\uddff]|\ud83c\uddfa\ud83c[\udde6\uddec\uddf2\uddf3\uddf8\uddfe\uddff]|\ud83c\uddfb\ud83c[\udde6\udde8\uddea\uddec\uddee\uddf3\uddfa]|\ud83c\uddfc\ud83c[\uddeb\uddf8]|\ud83c\uddfd\ud83c\uddf0|\ud83c\uddfe\ud83c[\uddea\uddf9]|\ud83c\uddff\ud83c[\udde6\uddf2\uddfc]|\ud83c[\udccf\udd8e\udd91-\udd9a\udde6-\uddff\ude01\ude32-\ude36\ude38-\ude3a\ude50\ude51\udf00-\udf20\udf2d-\udf35\udf37-\udf7c\udf7e-\udf84\udf86-\udf93\udfa0-\udfc1\udfc5\udfc6\udfc8\udfc9\udfcf-\udfd3\udfe0-\udff0\udff4\udff8-\udfff]|\ud83d[\udc00-\udc3e\udc40\udc44\udc45\udc51-\udc65\udc6a\udc6f\udc79-\udc7b\udc7d-\udc80\udc84\udc88-\udca9\udcab-\udcfc\udcff-\udd3d\udd4b-\udd4e\udd50-\udd67\udda4\uddfb-\ude44\ude48-\ude4a\ude80-\udea2\udea4-\udeb3\udeb7-\udebf\udec1-\udec5\uded0-\uded2\uded5-\uded7\udeeb\udeec\udef4-\udefc\udfe0-\udfeb]|\ud83e[\udd0d\udd0e\udd10-\udd17\udd1d\udd20-\udd25\udd27-\udd2f\udd3a\udd3c\udd3f-\udd45\udd47-\udd76\udd78\udd7a-\uddb4\uddb7\uddba\uddbc-\uddcb\uddd0\uddde-\uddff\ude70-\ude74\ude78-\ude7a\ude80-\ude86\ude90-\udea8\udeb0-\udeb6\udec0-\udec2\uded0-\uded6]|[\u23e9-\u23ec\u23f0\u23f3\u267e\u26ce\u2705\u2728\u274c\u274e\u2753-\u2755\u2795-\u2797\u27b0\u27bf\ue50a])|\ufe0f/g);
let connection = true;

/** 检查网络情况，如果连不上Twitter那后面都不用做了*/
function checkConnection() {
    return axios.get("https://twitter.com").then(res => {connection = (res.status == 200) ? true : false}).catch(err => connection = false);
}

/**
 * Twitter截图
 * @param {object} context 
 * @param {string} twitter_url 单条Tweet网址
 * @param {object} trans_args 所有翻译相关选项
 */
function tweetShot(context, replyFunc, twitter_url, trans_args={}) {
    (async () => {
        let browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-dev-shm-usage']
        });
        let page = await browser.newPage();
        await page.setExtraHTTPHeaders({
            "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
            "accept-language" : "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6"
        });
        await page.emulateTimezone('Asia/Tokyo');
        await page.goto(twitter_url, {waitUntil : "networkidle0"});

        if (Object.keys(trans_args).length > 0) {
            let html_ready = {}
            let trans_article_html = consistHTML(trans_args.translation, trans_args);
            let trans_group_html = "";

            if (trans_args.reply_html != undefined) html_ready.reply_html = consistHTML(trans_args.reply, trans_args);
            if (trans_args.group_info == undefined) trans_args.group_info = "翻译自日文"
            if (trans_args.group_html == undefined) trans_group_html = ['<div dir="auto" style="margin-top: 8px; margin-bottom: 10px;  margin-left: 10px;">',
                                                                        parseString(trans_args.group_info, {'color' : '#1DA1F2', 'size' : '15px'}), '</div>'].join("");
            else trans_group_html = ['<div dir="auto" style="margin-top: 8px; margin-bottom: 10px; margin-left: 10px;">', trans_args.group_html, '</div>'].join("");

            html_ready.trans_article_html = trans_article_html;
            html_ready.trans_group_html = trans_group_html;

            await page.evaluate((html_ready, cover_origin) => {
                let banner = document.getElementsByTagName('header')[0];
                banner.parentNode.removeChild(banner);
                let footer = document.getElementsByClassName('css-1dbjc4n r-aqfbo4 r-1p0dtai r-1d2f490 r-12vffkv r-1xcajam r-zchlnj')[0];
                footer.parentNode.removeChild(footer);

                let article = document.querySelectorAll('article')[0].querySelector('[role=group]').parentElement;
                insert(article, html_ready.trans_article_html, html_ready.trans_group_html, cover_origin);

                if (html_ready.reply_html != undefined) {
                    article = document.querySelectorAll('article')[1].querySelector('[role=group]').parentElement;
                    insert(article, html_ready.reply_html, html_ready.trans_group_html, cover_origin);
                }
          
                function insert(article, translation_html, group_html, cover_origin=false) {
                    let trans_place = document.createElement('div');
                    let node_group_info = document.createElement('div');
                    let node_trans_article = document.createElement('div');

                    trans_place.setAttribute("dir", "auto");
                    node_group_info.setAttribute("dir", "auto");
                    node_trans_article.setAttribute("dir", "auto");

                    node_group_info.innerHTML = group_html;
                    node_trans_article.innerHTML = translation_html;

                    if (/^回复 \n@/.test(article.firstElementChild.innerText)) article = article.children[1].firstElementChild;
                    else article = article.firstElementChild;

                    trans_place.appendChild(node_group_info);
                    trans_place.appendChild(node_trans_article);
                    if (cover_origin) article.replaceWith(trans_place);
                    else article.appendChild(trans_place);
                }
                document.querySelector("#react-root").scrollIntoView();
            }, html_ready, trans_args.cover_origin);
        }
        else {
            await page.evaluate(() => {
                let banner = document.getElementsByTagName('header')[0];
                banner.parentNode.removeChild(banner);
                let footer = document.getElementsByClassName('css-1dbjc4n r-aqfbo4 r-1p0dtai r-1d2f490 r-12vffkv r-1xcajam r-zchlnj')[0];
                footer.parentNode.removeChild(footer);
            });
        }
        await page.waitFor(2000);
        let tweet_box = await page.$('article .css-1dbjc4n .r-vpgt9t').then((tweet_article) => {return tweet_article.boundingBox()});
        await page.setViewport({
            width: 800,
            height: Math.round(tweet_box.y + 200),
            deviceScaleFactor: 1.6
        });

        await page.screenshot({
            type : "jpeg",
            quality : 100,
            encoding : "base64",
            clip : {x : tweet_box.x - 15, y : -3, width : tweet_box.width + 25, height : tweet_box.y + tweet_box.height + 12}
        }).then(pic64 => replyFunc(context, `[CQ:image,file=base64://${pic64}]`));
        await browser.close();
    })().catch(err => {
        console.error(err);
        replyFunc(context, "出错惹", true);
        return 1;
    });
}

function consistHTML(text, trans_args) {
    let trans_article_html = "";
    
    if (trans_args.trans_html != undefined) trans_article_html = trans_args.trans_html;
    else if (trans_args.style != undefined) trans_article_html = `<div style="${trans_args.style}">${text}</div>`
    else {
        let font = (trans_args.font != undefined) ? trans_args.font : "";
        let size = (trans_args.size != undefined) ? trans_args.size : "";
        let color = (trans_args.color != undefined) ? trans_args.color : "black";
        let background = (trans_args.background != undefined) ? trans_args.background : "";
        let text_decoration = (trans_args.text_decoration != undefined) ? trans_args.text_decoration : "";
        let styles = {font:font, size:size, color:color, background:background, text_decoration:text_decoration};

        trans_article_html = parseString(text, styles);
    }

    return trans_article_html;
}

function parseString(text, styles=false) {
    let capture = [...text.matchAll(twemoji_reg)];

    let offset = 0;
    let ready_html = "";
    let code = "";
    let part = "";
    let string_html = "";
    let emoji_html = "";

    if (capture[0] != undefined) {
        for (emoji of capture) {
            code = emoji[0].codePointAt(0).toString(16);
            part = text.substring(offset, emoji.index);

            string_html = (part.length > 0) ? crtString(part) : "";

            emoji_html = (part.length > 0) ? 
                '<span dir="auto" class="css-901oao css-16my406 r-4qtqp9 r-ip8ujx r-sjv1od r-zw8f10 r-bnwqim r-h9hxbl">' +
                `<div aria-label="${emoji[0]}" class="css-1dbjc4n r-xoduu5 r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-h9hxbl r-417010" style="height: 1.2em;">` +
                '<div class="css-1dbjc4n r-1niwhzg r-vvn4in r-u6sd8q r-x3cy2q r-1p0dtai r-xoduu5 r-1pi2tsx r-1d2f490 r-u8s1d r-zchlnj r-ipm5af r-13qz1uu r-1wyyakw" ' +
                `style="background-image: url(&quot;https://abs-0.twimg.com/emoji/v2/svg/${code}.svg&quot;);"></div>` +
                `<img alt="${emoji[0]}" draggable="false" src="https://abs-0.twimg.com/emoji/v2/svg/${code}.svg" class="css-9pa8cd"></div></span>`
                : "";

            ready_html += (offset > emoji.index) ? emoji_html + string_html : string_html + emoji_html;
            offset = emoji.index + 1;
        }
        if (capture[capture.length-1].index+1 < text.length) ready_html += crtString(text.substr(capture[capture.length-1].index+1, text.length));
    }
    else {
        ready_html = crtString(text);
    }
    return ready_html;

    function crtString(text_part) {
        return '<span dir="auto" class="css-901oao css-16my406 r-1qd0xha r-ad9z0x r-bcqeeo r-qvutc0" ' + 
                ((styles) ? `style="font-family: ${styles.font}; font-size: ${styles.size}; text-decoration: ${styles.text_decoration}; color: ${styles.color}; background: ${styles.background};"` : "") +
                `>${text_part}</span>`;
    }
}

function cookTweet(context, replyFunc) {
    let {groups : {twitter_url, text}} = /(?<twitter_url>https:\/\/twitter.com\/.+?\/status\/\d+)[>＞](?<text>.+)/i.exec(context.message);

    if (/https:\/\/twitter.com\/.+?\/status\/\d+[>＞]{2}/.test(context.message)) {
        tweetShot(context, replyFunc, twitter_url, {translation : text.substring(1, text.length)});
        return;
    }
    
    let trans_args = {};
    let style_options = text.split(/[+＋]/);
    let option = "";
    let style = "";
    let option_map = {
        "翻译" : "translation",
        "回复" : "reply",
        "颜色" : "color",
        "大小" : "size",
        "字体" : "font_family",
        "装饰" : "text_decoration",
        "背景" : "background",
        "汉化组" : "group_info",
        "覆盖" : "cover_origin",
        "group_html" : "group_html",
        "trans_html" : "trans_html",
        "style" : "style",
        "error" : false
    }

    for (i in style_options) {
        option = style_options[i].split(/(?<!<.+(style|class))[=＝]/).filter((noEmpty) => {return noEmpty != undefined});
        style = option_map[option[0].replace(" ", "")] || option_map["error"];
        if (!style) {
            replyFunc(context, `没有${option[0]}这个选项`, true);
            return;
        }
        else trans_args[style] = option[1];
    }

    if (!'trans_html' in trans_args && trans_args.trans_html.length == 0 &&
        !'translation' in trans_args && trans_args.translation.length == 0) {
        replyFunc(context, "你没加翻译", true);
        return;
    }
    if ('cover_origin' in trans_args) trans_args.cover_origin = true;
    else trans_args.cover_origin = false;

    tweetShot(context, replyFunc, twitter_url, trans_args);
}

function complex(context, replyFunc) {
    if (connection && /^(推特|Twitter)截图\s?https:\/\/twitter.com\/.+?\/status\/\d+/i.test(context.message)) {
        let twitter_url = /https:\/\/twitter.com\/.+?\/status\/\d+/i.exec(context.message)[0];
        tweetShot(context, replyFunc, twitter_url);
        return true;
    }
    else if (connection && /^烤制\s?https:\/\/twitter.com\/.+?\/status\/\d+.+/i.test(context.message)) {
        cookTweet(context, replyFunc);
        return true;
    }
}

module.exports = {complex};
