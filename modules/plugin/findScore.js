const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

function findData(context, replyFunc) {
	var url = 'mongodb://localhost:27017/';
	var dbName = 'score';
	var client = new MongoClient(url, {useNewUrlParser: true});
	return new Promise((resolve, err) => {
		client.connect(function(err) {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		var collection = db.collection("score");
		let group_name = context.sender.card;
		let text = "查询人：" + group_name;
		replyFunc(context, text, false);
		if (group_name != "") {
			var data = collection.findOne({"group_name" : group_name})
		}
		client.close();
		resolve(data)
	})
	});
}

function findScore(context, replyFunc) {
	findData(context, replyFunc).then((data) => {
		if (data) {
			replyFunc(context, data, false);
		}
		else {replyFunc(context, "成绩查询失败", true);}
		
	}).catch(() => {
		let text = "成绩查询失败";
		replyFunc(context, text, true)
	});
}

module.exports = findScore