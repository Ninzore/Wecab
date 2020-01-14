var seedrandom = require('seedrandom');
var mongodb = require('mongodb').MongoClient;

var randomseed = seedrandom();
var db_port = 27017;
var db_path = "mongodb://127.0.0.1:" + db_port;

var centre = 6;

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
        case 13: location = "天柱"; break;
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

function loadedDice(centre, min, max) {
    let num = Math.round(normalDist(centre, (max - min) / 4));
    if(num > max) num = min + num - max - 1;
    if(num < min) num = max - Math.abs(min - num) + 1;
    // while(num > max) num -= max;
    // while(num < min) num += min;
    // console.log(num)
    //return Math.round(num);
    return num;
}

function gacha(context, replyFunc) {
    let location_list = [];
    let pkm_id = [];
    let pkm_name = [];
    let location = "";
    let rand = 0;
    let pkm_list = [];

    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        let coll_loc = mongo.db('bot').collection('pokemon_location');
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        //扔9次骰子，确定9块地形
        for (let i=0; i<9; i++){
            rand = loadedDice(centre, 0, 13);
            // console.log(location_choice);
            location = locationName(rand);
            location_list.push(location);

            pkm_list = (await coll_loc.findOne({location:location},
                        {projection: {_id : 0, pokemon_list : 1}})).pokemon_list;
            rand = random(0, pkm_list.length, true)
            pkm_name.push(pkm_list[rand].name);
            pkm_id.push(pkm_list[rand].id);
        }
        coll_pkm_stg.updateOne({player_id : context.user_id}, 
                                {$set : {pokemon_id : pkm_id, pokemon_name : pkm_name}},
                                {upsert : true});
        mongo.close();
        // console.log(location_list);
        // console.log(pkm_name);
        for (let i=0; i<9; i++) {
            if (i != 2 || i != 5 || i != 8){
                location_list[i] = location_list[i].padEnd(6, " ");
                pkm_name[i] = pkm_name[i].padEnd(6, " ");
            }
        }
        location_list.splice(3 ,0, "\n");
        location_list.splice(7 ,0, "\n");
        pkm_name.splice(3 ,0, "\n");
        pkm_name.splice(7, 0, "\n");
        let text = "你在\n" + location_list.join("") + "\n\n抓住了\n" + pkm_name.join("")
        // console.log(text);
        replyFunc(context, text);
    }).catch();
}

function fight(context, replyFunc) {
    let player_a = context.user_id;
    let player_b = /qq=(\d+)/.exec(context.message)[1] * 1;
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let coll_pokedex = mongo.db('bot').collection('pokedex');
        let player_data_a = await coll_pkm_stg.findOne({player_id : player_a}, {projection: {_id : 0}});
        let player_data_b = await coll_pkm_stg.findOne({player_id : player_b}, {projection: {_id : 0}});
        // console.log(player_data_a)

        let pkm_name_a = player_data_a.pokemon_name;
        let pkm_name_b = player_data_b.pokemon_name;
        let pkm_id_a = player_data_a.pokemon_id;
        let pkm_id_b = player_data_b.pokemon_id;
 
        let pkm_a = {};
        let pkm_b = {};
        let id_a = 0;
        let id_b = 0;
        let type_a = "";
        let type_b = "";
        let round_1 = 1;
        let round_2 = 1;
        let results = [];
        let count = 0;
        for (let i=0; i<pkm_id_a.length; i++) {
            id_a = pkm_id_a[i];
            id_b = pkm_id_b[i];
            pkm_a = await coll_pokedex.findOne({id : id_a}, {projection: {_id : 0}});
            pkm_b = await coll_pokedex.findOne({id : id_b}, {projection: {_id : 0}});
            
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
        mongo.close();
        let match_result = "";
        if (count > 0) match_result = "赢了";
        else if (count < 0) match_result = "输了";
        else  match_result = "平局";

        for (let i=0; i<9; i++) {
            if (i != 2 || i != 5 || i != 8){
                pkm_name_a[i] = pkm_name_a[i].padEnd(6, " ");
                pkm_name_b[i] = pkm_name_b[i].padEnd(6, " ");
            }
        }
        pkm_name_a.splice(3 ,0, "\n");
        pkm_name_a.splice(7 ,0, "\n");
        pkm_name_b.splice(3 ,0, "\n");
        pkm_name_b.splice(7, 0, "\n");
        let text = `[CQ:at,qq=${player_a}] 对战 [CQ:at,qq=${player_b}]\n` + 
                pkm_name_a.join("") + "\n  vs  \n" + pkm_name_b.join("")
                 + "\n\n结果:\n" + results.join(" ") + `\n${match_result}`;
        // console.log(text)
        replyFunc(context, text)
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

function travel(context, replyFunc){
    centre = random(0, 13, true);
    let text = "旅行团到了" +locationName(centre) + "附近";
    // console.log(text)
    replyFunc(context, text);
}

function checkLocation(context, replyFunc){
    let text = "旅行团现在在" +locationName(centre) + "附近";
    // console.log(text)
    replyFunc(context, text);
}

module.exports = {gacha, fight, travel, checkLocation};
