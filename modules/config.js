//import conf from '../config.json';
//import dConf from '../config.default.json';
import Hjson from "hjson";
import fs from "fs";
var text1=fs.readFileSync("./config.hjson", "utf8");
var text2=fs.readFileSync("./config.default.hjson", "utf8");
var conf=Hjson.parse(text1);
var dConf=Hjson.parse(text2);

// parse either JSON or Hjson
//var data=Hjson.parse(text);
//console.log(data);
//console.log();

// convert to JSON
//console.log("--- JSON output:");
//console.log(JSON.stringify(data, null, 2));
//console.log();

// convert to Hjson
//console.log("\n--- Hjson output:");
//console.log(Hjson.stringify(data));

function isObject(obj) {
    return typeof obj == 'object' && !Array.isArray(obj);
}

function recursiveCopy(c, dc) {
    for (let key in dc) {
        if (key == 'saucenaoHost' || key == 'whatanimeHost') {
            if (typeof c[key] == 'string') c[key] = [c[key]];
        }
        if (isObject(c[key]) && isObject(dc[key])) recursiveCopy(c[key], dc[key]);
        else if (typeof c[key] == 'undefined' || typeof c[key] != typeof dc[key]) c[key] = dc[key];
    }
}

if (!global.configStorage) {
    recursiveCopy(conf, dConf);
    global.configStorage = conf;
}

export default global.configStorage;
