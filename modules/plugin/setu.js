/*
 * @Author: Jindai Kirin 
 * @Date: 2018-10-26 14:44:55 
 * @Last Modified by: Jindai Kirin
 * @Last Modified time: 2019-01-16 14:26:24
 */

import Axios from 'axios';
import config from '../config';
import Pximg from './pximg';
import CQcode from '../CQcode';
import {
	resolve
} from 'url';
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const setting = config.picfinder.setu;
const setuReply = config.picfinder.replys;
const setuReg = new RegExp(config.picfinder.regs.setu);
const proxy = setting.pximgProxy;

if (proxy == '') Pximg.startProxy();
var page = 0;

function database(name) {
	var url = 'mongodb://localhost:27017/';
	var dbName = 'setu';
	var client = new MongoClient(url, {useNewUrlParser: true});
	return new Promise((resolve, err) => {
		client.connect(function(err) {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		var collection = db.collection(name);
		collection.aggregate([{$sample:{size:1}}]).each(function(err,doc) {
			if(doc) {
				//console.log(doc.url);
				resolve(doc.url);
				client.close();
				return
			}
		})
		client.close();
	})
	});
}

function sendSetu(context, replyFunc, logger, bot) {
	if (setuReg.exec(context.message)) {
		//普通
		let limit = {
			value: setting.limit,
			cd: setting.cd
		};
		let delTime = setting.deleteTime;

		//群聊还是私聊
		if (context.group_id) {
			//群白名单
			if (setting.whiteGroup.includes(context.group_id)) {
				limit.cd = setting.whiteCd;
				delTime = setting.whiteDeleteTime;
			} else if (setting.whiteOnly) {
				replyFunc(context, setuReply.setuReject);
				return true;
			}
		} else {
			if (!setting.allowPM) {
				replyFunc(context, setuReply.setuReject);
				return true;
			}
			limit.cd = 0; //私聊无cd
		}

		if (!logger.canSearch(context.user_id, limit, 'setu')) {
			replyFunc(context, setuReply.setuLimit, true);
			return;
		}

		if (/随便|微笑|东方|柰子|乃子|naizi|奶子|屁股|猫耳|腿子|大腿|大白腿|雪糕|巧克力|湿衣服|机械?娘|武器娘|驱逐舰|色色的/g.exec(context.message)) {
			let coll_name = "";
			let text = ""
			if (/微笑/g.exec(context.message)) {coll_name = "smile"; text = "今日份的微笑请收好 ";}
			if (/随便/g.exec(context.message)) {coll_name = "yuanchuang"; text = "Good Luck! ";}
			if (/东方/g.exec(context.message)) {coll_name = "touhou"; text = "你点的东方来了 ";}
			if (/高级屁股/g.exec(context.message)) {text = "你点的高级屁股来了 "; coll_name = "pigu_high";}
			else if (/屁股/g.exec(context.message)) {text = "你点的屁股来了 "; coll_name = "pigu_low";}
			if (/高级(柰子|乃子|naizi|奶子)/g.exec(context.message)) {text = "你点的高级柰子来了 "; coll_name = "naizi_high";}
			else if (/柰子|乃子|naizi|奶子/g.exec(context.message)) {text = "你点的柰子来了 "; coll_name = "naizi_low";}
			if (/高级(腿子|大腿|大白腿)/g.exec(context.message)) {text = "你点的高级腿子来了 "; coll_name = "dabaitui_high";}
			else if (/腿子|大腿|大白腿/g.exec(context.message)) {text = "你点的腿子来了 "; coll_name = "dabaitui_low";}
			if (/猫耳/g.exec(context.message)) {coll_name = "maoer"; text = "你点的猫耳来了 ";}
			if (/雪糕/g.exec(context.message)) {coll_name = "xuegao"; text = "你点的雪糕来了 ";}
			if (/巧克力/g.exec(context.message)) {coll_name = "qiaokeli"; text = "你点的巧克力来了 ";}
			if (/湿衣服/g.exec(context.message)) {coll_name = "shiyifu"; text = "你点的湿衣服来了 ";}
			if (/机娘/g.exec(context.message)) {coll_name = "jiniang"; text = "你点的机娘来了 ";}
			if (/武器娘/g.exec(context.message)) {coll_name = "wuqiniang"; text = "你点的武器娘来了 ";}
			if (/驱逐舰/g.exec(context.message)) {coll_name = "quzhujian"; text = "你点的驱逐舰来了 ";}
			if (/色色的/g.exec(context.message)) {coll_name = "hso"; text = "你点的色色的东西来了 ";}
			//replyFunc(context, coll_name);
			database(coll_name).then(pic_url => {
				//replyFunc(context, url);
				let payload = "[CQ:image,cache=0,file=" + pic_url + "]";
				let url = /(\d*)_p\d/.exec(pic_url)[1];
				text = text + "https://pixiv.net/i/" + url;
				replyFunc(context, text, true);
				replyFunc(context, payload).then(r => {
					if (delTime > 0) setTimeout(() => {
						if (r && r.data && r.data.message_id) bot('delete_msg', {
							message_id: r.data.message_id
						});
					}, delTime * 1000);
				}).catch(() => {
					console.log(`${new Date().toLocaleString()} [error] delete msg`);
				});
				//console.log(text)
			});
			return true
		}
		else {
			let text = "多看点"
			let pic_list = ["006", "090", "091", "092", "095", "096", "097", 
							"137", "139", "140", "219", "220", "221", "222",
							"224", "235", "236", "244", "236", "244", "245"];
			let pic_url = "IMG-" + pic_list[page] + ".jpg";
			let payload = "[CQ:image,cache=0,file=" + pic_url + "]";
			page++;
			if (page >= pic_list.length) page = 0;
			replyFunc(context, text, true);
				replyFunc(context, payload).then(r => {
					if (delTime > 0) setTimeout(() => {
						if (r && r.data && r.data.message_id) bot('delete_msg', {
							message_id: r.data.message_id
						});
					}, delTime * 1000);
				})
				//console.log(text)
			return true
		}

		Axios.get('https://api.lolicon.app/setu/zhuzhu.php').then(ret => ret.data).then(ret => {
			if (Pximg.getProxyURL(ret.file) == 403) {replyFunc(context, 'Error 403', true);}
			let url = Pximg.getProxyURL(ret.file);
			if (proxy != '') {
				let path = /(?<=https:\/\/i.pximg.net\/).+/.exec(url)[0];
				url = resolve(proxy, path);
			}
			replyFunc(context, `${ret.url} (p${ret.p})`, true);
			replyFunc(context, CQcode.img(url)).then(r => {
				if (delTime > 0) setTimeout(() => {
					if (r && r.data && r.data.message_id) bot('delete_msg', {
						message_id: r.data.message_id
					});
				}, delTime * 1000);
			}).catch(() => {
				console.log(`${new Date().toLocaleString()} [error] delete msg`);
			});
		}).catch(e => {
			console.error(`${new Date().toLocaleString()}\n${e}`);
			replyFunc(context, setuReply.setuError);
		});
		return true;
	}
	return false;
}

export default sendSetu;
