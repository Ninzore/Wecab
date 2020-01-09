if (/^看看.+?(微博|B站)$/g.exec(context.message))
	{	
		var num = 1;
        var choose = 0;
        var name = "";
        if (/置顶/.exec(context.message)) (num = -1);
        else if (/最新/.exec(context.message)) (num = 0);
        else if (/上上上条/.exec(context.message)) (num = 3);
        else if (/上上条/.exec(context.message)) (num = 2);
        else if (/上条/.exec(context.message)) (num = 1);
	    else if (/第.+?条/.exec(context.message)) {
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
        if (/(烧钱|少前)/.exec(context.message)) (choose = 1);
        else if (/(方舟|明日方舟)/.exec(context.message)) (choose = 2);
        else if (/(邦邦)/.exec(context.message)) (choose = 3);
        else if (/(FF|狒狒|菲菲)/.exec(context.message)) (choose = 4);
        else choose = 0;

        name = /看看(.+?)的?((第[0-9]?[一二三四五六七八九]?条)|(上*条)|(置顶)|(最新))?(微博|B站)/.exec(context.message)[1];
        
        if (/B站/g.exec(context)) bilibili.rtBilibili(context, replyMsg, name, num)
        else weibo.rtWeibo(context, replyMsg, choose, name, num);
	}
    
    else  if (/^看看微博\s?https:\/\/m.weibo.cn\/\d+\/\d+$/g.exec(context.message)) {
	// replyMsg(context, "pass1")
        let url = /https:\/\/m.weibo.cn\/\d+\/\d+/.exec(context.message)[0];
	   // replyMsg(context, url);
        weibo.rtWeiboByUrl(context, replyMsg, url);
    }

    else  if (/^看看B站\s?https:\/\/t.bilibili.com\/(\d+)$/g.exec(context.message)) {
            let url = /https:\/\/t.bilibili.com\/\d+/.exec(context.message)[0];
            bilibili.rtBiliByUrl(context, replyMsg, url);
    }

    else if (/^订阅.+?微博$/g.exec(context.message)) {
        let choose = 0;
        let name = "";
        if (/(烧钱|少前)/.exec(context.message)) (choose = 1);
        else if (/(方舟|明日方舟)/.exec(context.message)) (choose = 2);
        else if (/(邦邦)/.exec(context.message)) (choose = 3);
        else if (/(FF|狒狒|菲菲)/.exec(context.message)) (choose = 4);
        else name = /^订阅(.+?)微博$/g.exec(context.message)[1];
        weibo.addSubscribe(context, replyMsg, choose, name);
    }

    else if (/^取消订阅.+?微博$/g.exec(context.message)) {
        let choose = 0;
        let name = "";
        if (/(烧钱|少前)/.exec(context.message)) (choose = 1);
        else if (/(方舟|明日方舟)/.exec(context.message)) (choose = 2);
        else if (/(邦邦)/.exec(context.message)) (choose = 3);
        else if (/(FF|狒狒|菲菲)/.exec(context.message)) (choose = 4);
        else name = /^取消订阅(.+?)微博$/g.exec(context.message)[1];
        weibo.rmSubscribe(context, replyMsg, choose, name);
    }

    else if (/^查看订阅微博$/g.exec(context.message)) {
        weibo.checkSubscribes(context, replyMsg);
    }

    if (/^\.dice.+/g.exec(context.message)) {
  	    dice(context, replyMsg, rand);
    }
