var seedrandom = require('seedrandom');
var mongodb = require('mongodb').MongoClient;

var randomseed = seedrandom();
var db_port = 27017;
var db_path = "mongodb://127.0.0.1:" + db_port;

const chart = {
    normal : {normal : 1, fire : 1, water : 1, electric : 1, grass : 1, ice : 1,
            fighting : 0.5, poison : 1, ground : 1, flying : 1, psychic : 1, bug : 1,
            rock : 1, ghost : 0, dragon : 1, dark : 1, steel : 0.5, fairy : 1},
            
    fire : {normal : 1, fire : 0.5, water : 0.5, electric : 1, grass : 2, ice : 2,
            fighting : 1, poison : 1, ground : 1, flying : 1, psychic : 1, bug : 2,
            rock : 0.5, ghost : 1, dragon : 0.5, dark : 1, steel : 2, fairy : 1},

    water : {normal : 1, fire : 2, water : 0.5, electric : 1, grass : 0.5, ice : 1,
            fighting : 1, poison : 1, ground : 2, flying : 1, psychic : 1, bug : 1,
            rock : 2, ghost : 1, dragon : 0.5, dark : 1, steel : 1, fairy : 1},

    electric : {normal : 1, fire : 1, water : 2, electric : 0.5, grass : 0.5, ice : 1,
                fighting : 1, poison : 1, ground : 0, flying : 2, psychic : 1, bug : 1,
                rock : 1, ghost : 1, dragon : 0.5, dark : 1, steel : 1, fairy : 1},

    grass : {normal : 1, fire : 0.5, water : 2, electric : 1, grass : 0.5, ice : 1,
            fighting : 1, poison : 0.5, ground : 2, flying : 0.5, psychic : 1, bug : 0.5,
            rock : 2, ghost : 1, dragon : 0.5, dark : 1, steel : 0.5, fairy : 1},

    ice : {normal : 1, fire : 0.5, water : 0.5, electric : 1, grass : 2, ice : 0.5,
            fighting : 2, poison : 1, ground : 2, flying : 1, psychic : 1, bug : 1,
            rock : 1, ghost : 1, dragon : 2, dark : 1, steel : 0.5, fairy : 1},

    fighting : {normal : 2, fire : 1, water : 1, electric : 1, grass : 1, ice : 2,
                fighting : 0.5, poison : 0.5, ground : 1, flying : 1, psychic : 0.5, bug : 0.5,
                rock : 2, ghost : 0, dragon : 1, dark : 2, steel : 2, fairy : 0.5},

    poison : {normal : 1, fire : 1, water : 1, electric : 1, grass : 2, ice : 1,
            fighting : 1, poison : 0.5, ground : 0.5, flying : 1, psychic : 1, bug : 1,
            rock : 0.5, ghost : 0.5, dragon : 1, dark : 1, steel : 0, fairy : 2},

    ground : {normal : 1, fire : 2, water : 1, electric : 2, grass : 0.5, ice : 1,
            fighting : 1, poison : 2, ground : 1, flying : 0, psychic : 1, bug : 0.5,
            rock : 2, ghost : 1, dragon : 1, dark : 1, steel : 2, fairy : 1},

    flying : {normal : 1, fire : 1, water : 1, electric : 0.5, grass : 2, ice : 1,
            fighting : 2, poison : 1, ground : 1, flying : 1, psychic : 1, bug : 2,
            rock : 0.5, ghost : 1, dragon : 1, dark : 1, steel : 0.5, fairy : 1},

    psychic : {normal : 1, fire : 1, water : 1, electric : 1, grass : 1, ice : 1,
            fighting : 2, poison : 2, ground : 1, flying : 1, psychic : 0.5, bug : 1,
            rock : 1, ghost : 1, dragon : 1, dark : 0, steel : 0.5, fairy : 1},

    bug : {normal : 1, fire : 0.5, water : 1, electric : 1, grass : 2, ice : 1,
            fighting : 1, poison : 0.5, ground : 1, flying : 0.5, psychic : 2, bug : 1,
            rock : 1, ghost : 0.5, dragon : 1, dark : 2, steel : 0.5, fairy : 0.5},

    rock : {normal : 1, fire : 2, water : 1, electric : 1, grass : 1, ice : 2,
            fighting : 0.5, poison : 1, ground : 0.5, flying : 2, psychic : 1, bug : 2,
            rock : 0.5, ghost : 1, dragon : 1, dark : 1, steel : 1, fairy : 1},

    ghost : {normal : 0, fire : 1, water : 1, electric : 1, grass : 1, ice : 1,
            fighting : 1, poison : 1, ground : 1, flying : 1, psychic : 2, bug : 1,
            rock : 1, ghost : 2, dragon : 1, dark : 0.5, steel : 1, fairy : 1},

    dragon : {normal : 1, fire : 1, water : 1, electric : 1, grass : 1, ice : 1,
            fighting : 1, poison : 1, ground : 1, flying : 1, psychic : 1, bug : 1,
            rock : 1, ghost : 1, dragon : 2, dark : 1, steel : 0.5, fairy : 0},

    dark : {normal : 1, fire : 1, water : 1, electric : 1, grass : 1, ice : 1,
            fighting : 0.5, poison : 1, ground : 1, flying : 1, psychic : 2, bug : 1,
            rock : 1, ghost : 2, dragon : 1, dark : 0.5, steel : 1, fairy : 0.5},

    steel : {normal : 1, fire : 0.5, water : 0.5, electric : 0.5, grass : 1, ice : 2,
            fighting : 1, poison : 1, ground : 1, flying : 1, psychic : 1, bug : 1,
            rock : 2, ghost : 1, dragon : 1, dark : 1, steel : 0.5, fairy : 2},

    fairy : {normal : 1, fire : 0.5, water : 1, electric : 1, grass : 1, ice : 1,
            fighting : 2, poison : 0.5, ground : 1, flying : 1, psychic : 1, bug : 1,
            rock : 1, ghost : 1, dragon : 2, dark : 2, steel : 0.5, fairy : 1}
}

function locationName(num = 6) {
    let location = "";
    switch (num) {
        case 0: location = "狩猎地带"; break;
        case 1: location = "橙华森林"; break;
        case 2: location = "石之洞窟"; break;
        case 3: location = "新紫堇"; break;
        case 4: location = "烟囱山"; break;
        case 5: location = "海底洞窟"; break;
        case 6: location = "弃船"; break;
        case 7: location = "流星瀑布"; break;
        case 8: location = "浅滩洞穴"; break;
        case 9: location = "送神山"; break;
        case 10: location = "凹凸山道"; break;
        case 11: location = "沙漠"; break;
        case 12: location = "茵郁"; break;
        case 13: location = "101号道路"; break;
        case 14: location = "102号道路"; break;
        case 15: location = "117号道路"; break;
        case 16: location = "120号道路"; break;
        case 17: location = "123号道路"; break;
    }
    return location;
}

function normalDist(centre = 0, std_deviation = 1) {
    let u = randomseed();
    let v = randomseed();
    let radius = Math.sqrt(-2 * Math.log(u))
    let theta = 2 * Math.PI * v;
    return ((radius * Math.sin(theta)) * std_deviation + centre);
}

function random(min, max, round = false) {
    let num = (max - min) * randomseed() + min;
    // if (round) return Math.round(num); 
    if (round) return parseInt(num); 
    else return num; 
}

function loadedDice(centre, min, max, std_devi_denominator=4) {
    let num = Math.round(normalDist(centre, (max - min) / std_devi_denominator));
    if(num > max) num = min + num - max - 1;
    if(num < min) num = max - Math.abs(min - num) + 1;
    // while(num > max) num -= max;
    // while(num < min) num += min;
    // console.log(num)
    //return Math.round(num);
    return num;
}

function gacha(context, replyFunc) {
    let location = "";
    let rand = 0;
    let choice_list = [];
    let text = "";

    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        let coll_loc = mongo.db('bot').collection('pokemon_location');
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        
        let user_profile = await coll_pkm_stg.findOne({player_id : context.user_id});
        if (user_profile == undefined) {
            let location_list = [];
            let pokemon_list = [];
            let centre = random(0, 17, true);
            //扔6次骰子，确定6块地形
            for (let i=0; i<6; i++){
                rand = loadedDice(centre, 0, 17);
                // console.log(location_choice):
                location = locationName(rand);
                location_list.push(location);

                choice_list = (await coll_loc.findOne({location:location},
                            {projection: {_id : 0, pokemon_list : 1}})).pokemon_list;
                rand = random(0, choice_list.length, true);
                // pokemon_list.push(choice_list[rand]);
                pokemon_list.push(choice_list[rand]);
            }
            // console.log(location_list);
            // console.log(pkm_name);
            
            coll_pkm_stg.insertOne({player_id : context.user_id, player_name : context.nickname,
                                    list : pokemon_list, storage : [], last_win : 0,
                                    money : 500, pokeball : 3, centre : 0, curfew : 24});
            
            for (let i=0; i<6; i++) {
                if (i != 2 || i != 5){
                    location_list[i] = location_list[i].padEnd(6, " ");
                    pokemon_list[i] = pokemon_list[i].padEnd(6, " ");
                }
            }
            location_list.splice(3 ,0, "\n");
            pokemon_list.splice(3 ,0, "\n");
            text = "你在\n" + location_list.join("") + "\n\n抓住了\n" + pokemon_list.join("");
        }
        else if(user_profile.pokeball <= 0) {
            text = `已经...没球了, 但是你还有${user_profile.money}元`;
        }
        else {
            centre = user_profile.centre;
            location = locationName(centre);
            choice_list = (await coll_loc.findOne({location:location},
                        {projection: {_id : 0, pokemon_list : 1}})).pokemon_list;
            rand = random(0, choice_list.length, true);
            let pkm_name = choice_list[rand];
            let pokeball = user_profile.pokeball-1;
            coll_pkm_stg.updateOne({player_id : context.user_id}, 
                                    {$set : {pokeball : pokeball},
                                    $push : {storage : pkm_name}});
            
            text = `你在${location}抓住了一只${pkm_name}，存进电脑了，剩余${pokeball}个精灵球`;
        }
        mongo.close();
        // console.log(text);
        replyFunc(context, text, true);
    }).catch();
}

function fight(context, replyFunc) {
    let player_a = context.user_id;
    let player_b = /qq=(\d+)/.exec(context.message)[1] * 1;
    let text = "";
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let coll_pokedex = mongo.db('bot').collection('pokedex');
        let player_data_a = await coll_pkm_stg.findOne({player_id : player_a}, {projection: {_id : 0}});
        let player_data_b = await coll_pkm_stg.findOne({player_id : player_b}, {projection: {_id : 0}});
        // console.log(player_data_a)
        if (player_data_a == undefined) text = "你必须先捕捉才能对战";
        else if (player_data_b == undefined) text = "训练家不能对普通人出手！";
        else {
            let time = new Date();
            let hour = time.getHours() - 1;
            if (hour < 4) hour += 24;
            if (player_data_b.curfew > hour) text = "对方已宵禁，明天再打";
            else {
                if (player_data_a.last_win == player_b || player_data_b.last_win == player_a) {
                    text = "不能重复打一个人哦";
                }
                else {
                    let pokemon_list_a = player_data_a.list;
                    let pokemon_list_b = player_data_b.list;

                    let pkm_a = "";
                    let pkm_b = "";
                    // let pkm_name_a = [];
                    // let pkm_name_b = [];
                    let type_a = "";
                    let type_b = "";
                    let round_1 = 1;
                    let round_2 = 1;
                    let results = [];
                    let count = 0;

                    for (let i=0; i<6; i++) {
                        pkm_a = await coll_pokedex.findOne({name : pokemon_list_a[i]}, {projection: {_id : 0}});
                        pkm_b = await coll_pokedex.findOne({name : pokemon_list_b[i]}, {projection: {_id : 0}});
                        console.log(pkm_b)
                        // console.log(pokemon_list_a[i])
                        type_a = pkm_a.type_id;
                        type_b = pkm_b.type_id;
                        type_a = type_a.split(",");
                        type_b = type_b.split(",");

                        round_1 = calculator(type_a, type_b);
                        round_2 = calculator(type_b, type_a);
                        if (round_1 > round_2) {
                            results.push("胜");
                            count++;
                        }
                        else if (round_1 < round_2) {
                            results.push("负");
                            count--;
                        }
                        else results.push("平");
                    }
                    // console.log(results)
                    
                    let match_result = "";
                    if (count > 0) {
                        if (player_data_b.money <= 0) {
                            match_result = "赢了，但是对方已经没钱了，所以你一分钱也没拿到";
                            coll_pkm_stg.updateOne({player_id : player_a}, {$set : {last_win : player_b}});
                            coll_pkm_stg.updateOne({player_id : player_b}, {$set : {money : 0}});
                        }
                        else {
                            match_result = `赢了，获得了${count*100}元，对方失去${count*100}元`;
                            coll_pkm_stg.updateOne({player_id : player_a}, {$inc : {money : count*100},
                                                                            $set : {last_win : player_b}});
                            coll_pkm_stg.updateOne({player_id : player_b}, {$inc : {money : -count*100}});
                        }
                    }
                    else if (count < 0) {
                        if (player_data_a.money <= 0) {
                            match_result = "输了，你已经没钱了，所以对方一分钱也没拿到";
                            coll_pkm_stg.updateOne({player_id : player_a}, {$set : {money : 0}});
                            coll_pkm_stg.updateOne({player_id : player_b}, {$set : {last_win : player_a}});
                        }
                        else {
                            match_result = `输了，失去了${count*100}元，对方获得了${count*100}元`;
                            coll_pkm_stg.updateOne({player_id : player_a}, {$inc : {money : -count*100}});
                            coll_pkm_stg.updateOne({player_id : player_b}, {$inc : {money : count*100},
                                                                            $set : {last_win : player_a}});
                        }
                    }
                    else  match_result = "平局";

                    for (let i=0; i<6; i++) {
                        if (i != 2 || i != 6){
                            pokemon_list_a[i] = pokemon_list_a[i].padEnd(6, " ");
                            pokemon_list_b[i] = pokemon_list_b[i].padEnd(6, " ");
                        }
                    }
                    pokemon_list_a.splice(3 ,0, "\n");
                    pokemon_list_b.splice(3 ,0, "\n");
                    text = `[CQ:at,qq=${player_a}] 对战 [CQ:at,qq=${player_b}]\n` + 
                                pokemon_list_a.join("") + "\n  vs  \n" + pokemon_list_b.join("")
                            + "\n\n结果:\n" + results.join(" ") + `\n${match_result}`;
                }
            }
        }
        replyFunc(context, text);
        mongo.close();
    }).catch();

    function calculator(type_a = [], type_b = []) {
        let result = 1;
        for(let i=0; i<type_a.length; i++) {
            for(let j=0; j<type_b.length; j++) {
                result *= chart[type_a[i]][type_b[j]];
            }
        }
        return result;
    }
}

function checkList(context, replyFunc) {
    let player_a = context.user_id;
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let pokemon_list = (await coll_pkm_stg.findOne({player_id : player_a}, {projection: {_id : 0}})).list;
        mongo.close();
   
        for (let i=0; i<6; i++) {
            if (i != 2 || i != 5){
                pokemon_list[i] = pokemon_list[i].padEnd(6, " ");
            }
        }
        pokemon_list.splice(3 ,0, "\n");
        let text = "当前对战列表为\n" + pokemon_list.join("");
        // console.log(text);
        replyFunc(context, text);
    }).catch((err) => {console.log(err)});
}

function checkStorage(context, replyFunc) {
    let player_a = context.user_id;
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let storage = (await coll_pkm_stg.findOne({player_id : player_a}, {projection: {_id : 0}})).storage;
        mongo.close();
        let text = "你的电脑中储存有\n" + storage.join(" ");
        // console.log(text);
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function changeList(context, replyFunc) {
    let player_id = context.user_id;
    let pokemon_change = /用(.+)换掉.+/.exec(context.message)[1];
    let pokemon_origin = /用.+换掉(.+)/.exec(context.message)[1];
    let text = "";
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let player_data = await coll_pkm_stg.findOne({player_id : player_id}, {projection: {_id : 0}});
        let list = player_data.list;
        let storage = player_data.storage;
        let list_position = list.indexOf(pokemon_origin);
        
        // console.log(list)
        if (list_position == -1) text = "你的对战列表里面没有" + pokemon_origin;
        else if (storage.indexOf(pokemon_change) == -1) text = "你的储存箱里面没有" + pokemon_change;
        else {
            coll_pkm_stg.updateOne({player_id : player_id},
                                    {$pull : {list : {$in : [pokemon_origin]},
                                    storage : {$in : [pokemon_change]}}});
            coll_pkm_stg.updateOne({player_id : player_id},
                                    {$push : {list : {$each : [pokemon_change], 
                                            $position:list_position},
                                    storage : pokemon_origin}});
                
            list[list_position] = pokemon_change;
            // console.log(list)
            for (let i=0; i<6; i++) {
                if (i != 2 || i != 5){
                    list[i] = list[i].padEnd(6, " ");
                }
            }
            list.splice(3 ,0, "\n");
            text = `用${pokemon_change}换掉了${pokemon_origin}\n当前对战列表为\n` + list.join("");
        }
        mongo.close();
        // console.log(text);
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function shop(context, replyFunc) {
    let player_a = context.user_id;
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let player_data = await coll_pkm_stg.findOne({player_id : player_a}, {projection: {_id : 0}});
        mongo.close();
        
        let text = "欢迎来到友好商店\n你现在有" + player_data.money + 
                    "元和" + player_data.pokeball + "个精灵球\n" +
                    "请问你要买什么?\n精灵球(100元)"
                    
        // console.log(text);
        replyFunc(context, text);
    }).catch((err) => {console.log(err)});
}

function buy(context, replyFunc) {
    let player_id = context.user_id;
    let pokeball_buy = parseInt(/(\d{1,2})个/.exec(context.message)[1]);
    let text = "";
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let player_data = await coll_pkm_stg.findOne({player_id : player_id}, {projection: {_id : 0}});
        if (player_data.money < pokeball_buy*100) text = "余额不足无法购买";
        else {
            coll_pkm_stg.updateOne({player_id : player_id}, {$inc : {money : -pokeball_buy*100, 
                                                                    pokeball : pokeball_buy}});
            text = `购买了${pokeball_buy}个精灵球，花费了${pokeball_buy*100}元\n`
                    + `剩余${player_data.money-pokeball_buy*100}元`;
        }
        mongo.close();
        // console.log(text);
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function travel(context, replyFunc){
    centre = random(0, 17, true);
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        coll_pkm_stg.updateOne({player_id : context.user_id}, {$set : {centre : centre}});
        mongo.close();
        let text = "你旅行到了" +locationName(centre) + "附近";
        // console.log(text);
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function checkLocation(context, replyFunc){
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let {centre} = (await coll_pkm_stg.findOne({player_id : context.user_id}, {projection : {centre : 1}}));
        mongo.close();
        let text = "你现在在" +locationName(centre) + "附近";
        // console.log(text);
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function setCurfew(context, replyFunc){
    let hour = /(\d{1,2})点/.exec(context.message)[1];
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        coll_pkm_stg.updateOne({player_id : context.user_id}, {$set : {curfew : hour}});
        mongo.close();
        let text = `你的宵禁时间是${hour}点`;
        // console.log(text);
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

module.exports = {gacha, fight, travel, checkLocation, checkList, checkStorage, changeList, shop, buy, setCurfew};
