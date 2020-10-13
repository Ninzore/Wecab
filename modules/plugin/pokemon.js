const mongodb = require('mongodb').MongoClient;

const db_port = 27017;
const db_path = "mongodb://127.0.0.1:" + db_port;

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

function locationName(num = 0) {
    let location = "";
    switch (num) {
        case 0: location = "橙华森林"; break;
        case 1: location = "石之洞窟"; break;
        case 2: location = "卡绿隧道"; break;
        case 3: location = "弃船"; break;
        case 4: location = "沙漠"; break;
        case 5: location = "热焰小径"; break;
        case 6: location = "凹凸山道"; break;
        case 7: location = "新紫堇"; break;
        case 8: location = "流星瀑布 "; break;
        case 9: location = "送神山"; break;
        case 10: location = "浅滩洞穴"; break;
        case 11: location = "觉醒祠堂"; break;
        case 12: location = "冠军之路"; break;
        case 13: location = "天空之柱"; break;
        case 14: location = "101号道路"; break;
        case 15: location = "102号道路"; break;
        case 16: location = "103号道路"; break;
        case 17: location = "104号道路"; break;
        case 18: location = "105号水路"; break;
        case 19: location = "106号水路"; break;
        case 20: location = "107号水路"; break;
        case 21: location = "108号水路"; break;
        case 22: location = "109号水路"; break;
        case 23: location = "110号道路"; break;
        case 24: location = "111号道路"; break;
        case 25: location = "112号道路"; break;
        case 26: location = "113号道路"; break;
        case 27: location = "114号道路"; break;
        case 28: location = "115号道路"; break;
        case 29: location = "116号道路"; break;
        case 30: location = "117号道路"; break;
        case 31: location = "118号道路"; break;
        case 32: location = "119号道路"; break;
        case 33: location = "120号道路"; break;
        case 34: location = "121号道路"; break;
        case 35: location = "122号水路"; break;
        case 36: location = "123号道路"; break;
        case 37: location = "124号水路"; break;
        case 38: location = "125号水路"; break;
        case 39: location = "126号水路"; break;
        case 40: location = "127号水路"; break;
        case 41: location = "128号水路"; break;
        case 42: location = "129号水路"; break;
        case 43: location = "132号水路"; break;
        case 44: location = "133号水路"; break;
        case 45: location = "134号水路"; break;
        case 46: location = "狩猎地带-区域1"; break;
        case 47: location = "狩猎地带-区域2"; break;
        case 48: location = "狩猎地带-区域3"; break;
        case 49: location = "狩猎地带-区域4"; break;
        case 50: location = "狩猎地带-区域5"; break;
        case 51: location = "狩猎地带-区域6"; break;
    }
    return location;
}

function normalDist(centre = 0, std_deviation = 1) {
    let u = Math.random();
    let v = Math.random();
    let radius = Math.sqrt(-2 * Math.log(u))
    let theta = 2 * Math.PI * v;
    return ((radius * Math.sin(theta)) * std_deviation + centre);
}

function random(min, max, round = false) {
    let num = (max - min) * Math.random() + min;
    // if (round) return Math.round(num); 
    if (round) return parseInt(num); 
    else return num; 
}

function loadedDice(centre, min, max, std_devi_denominator=4) {
    let num = Math.round(normalDist(centre, (max - min) / std_devi_denominator));
    if(num > max) num = min + num - max - 1;
    if(num < min) num = max - Math.abs(min - num) + 1;

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
        let time = new Date().getTime();
        if (user_profile == undefined) {
            let location_list = [];
            let pokemon_list = [];
            let init_location = [14, 15, 0, 2, 16, 17];
            for (let i=0; i<6; i++){
                rand = init_location[i]
                // console.log(location_choice):
                location = locationName(rand);
                location_list.push(location);
                choice_list = (await coll_loc.findOne({location:location},
                            {projection: {_id : 0, pokemons : 1}})).pokemons;
                rand = random(0, choice_list.length, true);
                // pokemon_list.push(choice_list[rand]);
                pokemon_list.push(choice_list[rand].name);
            }
            // console.log(location_list);
            // console.log(pkm_name);

            await coll_pkm_stg.insertOne({player_id : context.user_id, player_name : context.nickname,
                                    list : pokemon_list, storage : [], last_win : 0,
                                    last_capture : time, last_travel : time, last_fight : 0,
                                    money : 500, pokeball : 3, centre : 14});
            
            for (let i=0; i<6; i++) {
                if (i != 2 || i != 5){
                    location_list[i] = location_list[i].padEnd(8, " ");
                    pokemon_list[i] = pokemon_list[i].padEnd(8, " ");
                }
            }
            location_list.splice(3 ,0, "\n");
            pokemon_list.splice(3 ,0, "\n");
            text = "你在\n" + location_list.join("") + "\n\n抓住了\n" + pokemon_list.join("");
        }
        else if(user_profile.pokeball <= 0) {
            text = `已经...没球了, 但是你还有${user_profile.money}元`;
        }
        else if(time - user_profile.last_capture < 3600000) {
            text = `还需要${Math.round((3600000 - time + user_profile.last_capture)/60000)}分钟才能再次捕捉`;
        }
        else {
            let centre = user_profile.centre;
            let location = locationName(centre);
            let info = await coll_loc.findOne({location:location},
                            {projection: {_id : 0, pokemons : 1}});
            let choice_list = info.pokemons;

            let rand = random(0, choice_list.length, true);
            let pkm_name = choice_list[rand].name;
            if (user_profile.storage.indexOf(pkm_name) != -1  || user_profile.list.indexOf(pkm_name) != -1) {
                text = `你在${location}找到了一只${pkm_name}，因为你已经有一只相同了所以放生了,等一小时再来吧`
                coll_pkm_stg.updateOne({player_id : context.user_id}, 
                                        {$set : {last_capture : time}});
            }
            else {
                let pokeball = user_profile.pokeball-1;
                coll_pkm_stg.updateOne({player_id : context.user_id}, 
                                        {$set : {pokeball : pokeball, last_capture : time},
                                        $push : {storage : pkm_name}});
            
                text = `你在${location}抓住了一只${pkm_name}，存进电脑了，剩余${pokeball}个精灵球`;
            }
        }
        mongo.close();
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
            let time = new Date().getTime();
            if (time - player_data_a.last_fight < 3600000) text = `还需要${Math.round((3600000 - time + player_data_a.last_fight)/60000)}分钟才能再次对战`;
            else {
                if (player_data_a.last_win == player_b || player_data_b.last_win == player_a) {
                    text = "不能重复打一个人哦";
                }
                else {
                    let pokemon_list_a = player_data_a.list.filter(value => typeof value === "string");
                    let pokemon_list_b = player_data_b.list.filter(value => typeof value === "string");

                    if (pokemon_list_a.length < 6) {
                        replyFunc(context, `[CQ:at,qq=${player_a}]存档坏了，修复一下吧`);
                        mongo.close();
                        return;
                    }
                    if (pokemon_list_b.length < 6) {
                        replyFunc(context, `[CQ:at,qq=${player_b}]存档坏了，修复一下吧`);
                        mongo.close();
                        return;
                    }

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

                    function shuffle() {
                        let box = [0,1,2,3,4,5];
                        for (let i in box) {
                            let rand = Math.floor(Math.random() * i);
                            [box[i], box[rand]] = [box[rand], box[i]];
                        }
                        return box.filter(value => typeof value == "number");;
                    }

                    let player_a_box = shuffle();
                    let player_b_box = shuffle();

                    for (let i=0; i<6; i++) {
                        pkm_a = await coll_pokedex.findOne({name : pokemon_list_a[player_a_box[i]]});
                        pkm_b = await coll_pokedex.findOne({name : pokemon_list_b[player_b_box[i]]});

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
                            await coll_pkm_stg.updateOne({player_id : player_a}, {$set : {last_win : player_b}});
                            await coll_pkm_stg.updateOne({player_id : player_b}, {$set : {money : 0}});
                        }
                        else if (player_data_b.money - count*100 <= 0) {
                            match_result = `赢了，获得${count*100}, 对方余额全部白给了`;
                            await coll_pkm_stg.updateOne({player_id : player_a}, {$inc : {money : player_data_b.money},
                                                                            $set : {last_win : player_b}});
                            await coll_pkm_stg.updateOne({player_id : player_b}, {$set : {money : 0}});
                        }
                        else {
                            match_result = `赢了，获得了${count*100}元，对方失去${count*100}元`;
                            await coll_pkm_stg.updateOne({player_id : player_a}, {$inc : {money : count*100},
                                                                            $set : {last_win : player_b}});
                            await coll_pkm_stg.updateOne({player_id : player_b}, {$inc : {money : -count*100}});
                        }
                    }
                    else if (count < 0) {
                        if (player_data_a.money <= 0) {
                            match_result = "输了，你已经没钱了，所以对方一分钱也没拿到";
                            await coll_pkm_stg.updateOne({player_id : player_a}, {$set : {money : 0}});
                            await coll_pkm_stg.updateOne({player_id : player_b}, {$set : {last_win : player_a}});
                        }
                        else if (player_data_a.money + count*100 <= 0) {
                            match_result = `输了，失去-${count*100}，余额全部白给`;
                            await coll_pkm_stg.updateOne({player_id : player_b}, {$set : {last_win : player_a},
                                                                            $inc : {money : player_data_a.money}});
                            await coll_pkm_stg.updateOne({player_id : player_a}, {$set : {money : 0}});
                        }
                        else {
                            match_result = `输了，失去了-${count*100}元，对方获得了-${count*100}元`;
                            await coll_pkm_stg.updateOne({player_id : player_a}, {$inc : {money : count*100}});
                            await coll_pkm_stg.updateOne({player_id : player_b}, {$inc : {money : -count*100},
                                                                            $set : {last_win : player_a}});
                        }
                    }
                    else  match_result = "平局";
                    await coll_pkm_stg.updateOne({player_id : player_a}, {$set : {last_fight : time}});
                    await coll_pkm_stg.updateOne({player_id : player_b}, {$set : {last_fight : time}});

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
    }).catch(err => console.log(err));

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
        let profile = await coll_pkm_stg.findOne({player_id : player_a}, {projection: {_id : 0}});
        let pokemon_list = profile.list;
        mongo.close();
   
        let text = "当前对战列表为\n" + pokemon_list.join("，");
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function checkStorage(context, replyFunc) {
    let player_a = context.user_id;
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let storage = (await coll_pkm_stg.findOne({player_id : player_a}, {projection: {_id : 0}})).storage;
        mongo.close();
        let text = "";
        if (storage.length == 0) text = "你的电脑里没有宝可梦";
        else text = "你的电脑中储存有\n" + storage.join(" ");
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function changeList(context, replyFunc) {
    let player_id = context.user_id;
    let pokemon_change = /用(.+)换掉.+/.exec(context.message)[1];
    let pokemon_origin = /用.+换掉(.+)/.exec(context.message)[1];
    let text = "";
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let player_data = await coll_pkm_stg.findOne({player_id : player_id}, {projection: {_id : 0}});
        let list = player_data.list;
        let storage = player_data.storage;
        let list_position = list.indexOf(pokemon_origin);
        
        // console.log(list)
        // console.log(list)
        if (list_position == -1) text = "你的对战列表里面没有" + pokemon_origin;
        else if (storage.indexOf(pokemon_change) == -1) text = "你的储存箱里面没有" + pokemon_change;
        else {
            for (let i in list) {
                if (list[i] == pokemon_origin) {
                    list[i] = pokemon_change;
                    break;
                }
            }
            for (let i in storage) {
                if (storage[i] == pokemon_change) {
                    storage[i] = pokemon_origin;
                    break;
                }
            }
            coll_pkm_stg.updateOne({player_id : player_id},
                                    {$set : {list : list, storage : storage}});
                
            text = `用${pokemon_change}换掉了${pokemon_origin}\n当前对战列表为\n` + list.join("，");
        }
        mongo.close();
        replyFunc(context, text, true);
    }).catch((err) => {console.error(err)});
}

function shop(context, replyFunc) {
    let player_a = context.user_id;
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let player_data = await coll_pkm_stg.findOne({player_id : player_a}, {projection: {_id : 0}});
        mongo.close();
        
        let text = "欢迎来到友好商店\n你现在有" + player_data.money + 
                    "元和" + player_data.pokeball + "个精灵球\n" +
                    "请问你要买什么?\n精灵球(100元)"
                    
        replyFunc(context, text, true);
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
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function travel(context, replyFunc) {
    centre = random(0, 51, true);
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let text = "";
        let time = new Date().getTime();
        let user_profile = await coll_pkm_stg.findOne({player_id : context.user_id});
        if (time - user_profile.last_travel < 3600000) text = 
            `还需要${Math.round((3600000 - time + user_profile.last_travel)/60000)}分钟才能再次旅行`;
        else {
            coll_pkm_stg.updateOne({player_id : context.user_id}, {$set : {centre : centre, last_travel : time}});
            mongo.close();
            text = "你旅行到了" +locationName(centre);
        }
        mongo.close();
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function checkLocation(context, replyFunc) {
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let {centre} = (await coll_pkm_stg.findOne({player_id : context.user_id}, {projection : {centre : 1}}));
        mongo.close();
        let text = "你现在在" +locationName(centre);
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function lowBalanceInsurance(context, replyFunc) {
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let user_profile = await coll_pkm_stg.findOne({player_id : context.user_id});
        let money = user_profile.money;
        let text = "";
        if (money <= 0) {
            money = random(1, 3, true) * 100;
            await coll_pkm_stg.updateOne({player_id : context.user_id}, {$set : {money : money}});
            text = "恰到了" + money +"元的低保";
        }
        else text = "你又不穷你恰个鬼的低保";
        replyFunc(context, text, true);
        mongo.close();
    }).catch((err) => {console.error(err)});
}

function selfRepair(context, replyFunc) {
    mongodb(db_path, {useUnifiedTopology: true}).connect().then(async (mongo) => {
        // if (err) console.log("database connection error during checkList")
        let coll_pkm_stg = mongo.db('bot').collection('pokemon_storage');
        let user_profile = (await coll_pkm_stg.findOne({player_id : context.user_id}));
        let list = user_profile.list;
        let storage = user_profile.storage;
        list = list.filter(value => typeof value === "string");

        if (list.length < 6) {
            if (6 - list.length > storage.length) {
                replyFunc(context, `这个现在修不好，继续捕捉${6 - list.length}次后可以修复`, true);
                return;
            }
            else {
                for (let i = list.length; i < 6; i++) {
                    list[i] = storage[i - list.length];
                    storage.shift();
                }
            }
        }
        
        await coll_pkm_stg.updateOne({player_id : context.user_id}, {$set : {list : list, storage : storage}});
        mongo.close();
        let text = "可能好了";
        replyFunc(context, text, true);
    }).catch((err) => {console.log(err)});
}

function help(context, replyFunc) {
    let text = "首先一切操作都需要‘捕捉’后才能进行，所有首先进行‘捕捉’吧\n" +
                "旅行：使用旅行可以在丰源地区的52个区域中随机旅行到一个地方\n" +
                "对战：有了宝可梦之后首先就想要对战呢，@一个人然后说对战就可以对战了，获胜可以得到战利品哦\n" +
                "我现在在哪：检查当前自己的所在位置，忘了自己在什么地方的时候用吧\n" +
                "查看对战列表：可以查看当前用来对战的6只宝可梦\n" +
                "查看电脑：查看电脑来检查自己所拥有的不在列表中的宝可梦吧\n" +
                "用xxx换掉xxx：可以把电脑中的宝可梦和对战列表中的对换，用它来变化自己的对战列表吧" +
                "进入友好商店：进入商店可以查看自己持有的物品，查看当前商品价格\n" +
                "我要买x个xxx：进商店当然就是要买东西啦，说这句话来买东西吧，是要花钱的哦，用对战来赚取金钱吧\n" +
                "自助修复：有时抽风了的话，可以用这条指令尝试修复，说不定能好\n" +
                "除了战斗必须在群内使用，其他的建议全部私聊";
    replyFunc(context, text)
}

function pokemonCheck(context, replyMsg) {
    if (/^旅行$/.test(context.message)) {
        travel(context, replyMsg);
        return true;
    }
    else if (/^我现在在哪$/.test(context.message)) {
        checkLocation(context, replyMsg);
        return true;
    }
    else if (/^捕捉$/.test(context.message)) {
        gacha(context, replyMsg);
        return true;
    }
    else if (/^(对战\[CQ:at.+?]\s?|\[CQ:at.+?\]\s?对战)$/.test(context.message)) {
        fight(context, replyMsg);
        return true;
    }
    else if (/^恰低保$/.exec(context.message)) {
        lowBalanceInsurance(context, replyMsg);
    }
    else if (/^查看对战列表$/.test(context.message)) {
        checkList(context, replyMsg);
        return true;
    }
    else if (/^查看电脑$/.test(context.message)) {
        checkStorage(context, replyMsg);
        return true;
    }
    else if (/^用.+?换掉.+?$/.test(context.message)) {
        changeList(context, replyMsg);
        return true;
    }
    else if (/^进入友好商店$/.test(context.message)) {
        shop(context, replyMsg);
        return true;
    }
    else if (/^我要买\d{1,2}个精灵球$/.test(context.message)) {
        buy(context, replyMsg);
        return true;
    }
    else if (/^自助修复$/.test(context.message)) {
        selfRepair(context, replyMsg);
        return true;
    }
    else if (/^宝可梦帮助$/.test(context.message)) {
        help(context, replyMsg);
        return true;
    }
}

module.exports = {pokemonCheck};
