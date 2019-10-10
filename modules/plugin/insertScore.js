const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

function insertData(context, replyFunc) {
	var url = 'mongodb://localhost:27017/';
	var dbName = 'score';
	var client = new MongoClient(url, {useNewUrlParser: true});
	return new Promise((resolve, err) => {
		client.connect(function(err) {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		var collection = db.collection("score");
		var game_name = group_name = "";
		var score = rank = success = 0;
		var message = context.message;
		message.replace(/\s/g, "");
		//replyFunc(context, message, false);
		if (/名字/g.exec(message)) {
			group_name = /名字(:|：)(.*?)(;|；|，)/g.exec(context.message)[2];
		} else {group_name = context.sender.card;}
		if (/游戏名称/g.exec(message)) {game_name = /游戏名称(:|：)(.*?)(;|；|，|,)/g.exec(message)[2];}
		if (/分数/g.exec(message)) {score = parseInt(/分数(:|：)(\d{1,10})(;|；|，|,)/g.exec(message)[2]);}
		if (/排行/g.exec(message)) {rank = parseInt(/排行(:|：)(\d{1,3})/g.exec(message)[2]);}
		let text = group_name + game_name + score + rank;
		replyFunc(context, text, false);
		if (group_name != "" && game_name != "" && score >0 && rank > 0) {
			collection.insert({
            group_name : group_name,
            game_name : game_name,
            score : score,
            rank : rank
		});
		success = 1;
		}
		client.close();
		resolve(success)
	})
	});
}

function insertScore(context, replyFunc) {
	insertData(context, replyFunc).then(function(success) {
		if (success == 1) {var text = "成绩已录入数据库";}
		else {var text = "成绩录入失败，可能是格式错误";}
		replyFunc(context, text, true);
	}).catch((context) => {
		let text = "成绩录入失败，可能是格式错误";
		replyFunc(context, text, true)
	});
}

module.exports = insertScore